"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./cfps.module.css";
import { CFP, Continent } from "../utils/types";
import { getContinent } from "../utils/countryToContinent";
import {
  CFPStatus,
  createCFPId,
  getCFPStatuses,
} from "../utils/cfpStatus";
import { MultiSelect } from "../components/MultiSelect";
import { SingleSelect } from "../components/SingleSelect";
import { CFPService } from "../services/cfp/cfp.service";

const FILTER_STORAGE_KEY = "cfp-tracker-filters";

type SortOption = "cfpClose" | "eventStart";

interface SavedFilters {
  searchTerm: string;
  selectedContinents: Continent[];
  sortBy: SortOption;
}

type StatusFilterType = CFPStatus | "all";

export default function Home() {
  const [cfps, setCfps] = useState<CFP[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContinents, setSelectedContinents] = useState<Set<Continent>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cfpStatuses, setCfpStatuses] = useState<
    Record<string, { status: CFPStatus; notes: string }>
  >({});
  const [showStatusFilter, setShowStatusFilter] =
    useState<StatusFilterType>(null);
  const [showMinLoading, setShowMinLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("cfpClose");

  useEffect(() => {
    const startTime = Date.now();
    const minLoadingTime = 500; // Minimum load time to show off the tractor!

    const fetchCFPs = async () => {
      try {
        const cfpService = CFPService.getInstance();
        const activeCfps = await cfpService.fetchCFPs();
        setCfps(activeCfps);
      } catch (error) {
        console.error("Error fetching CFPs:", error);
        setError("Failed to load CFPs. Please try again later.");
      } finally {
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

        setTimeout(() => {
          setLoading(false);
          setShowMinLoading(false);
        }, remainingTime);
      }
    };

    fetchCFPs();
  }, []);

  useEffect(() => {
    // Load saved statuses
    const savedStatuses = getCFPStatuses();
    setCfpStatuses(
      Object.fromEntries(
        Object.entries(savedStatuses).map(([id, data]) => [
          id,
          {
            status: data.status,
            notes: data.notes || "",
          },
        ])
      )
    );
  }, []);

  useEffect(() => {
    // Load saved filters
    if (typeof window === "undefined") return;

    try {
      const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
      if (savedFilters) {
        const { searchTerm, selectedContinents, sortBy } = JSON.parse(
          savedFilters
        ) as SavedFilters;
        setSearchTerm(searchTerm);
        setSelectedContinents(new Set(selectedContinents));
        setSortBy(sortBy || "cfpClose");
      }
    } catch (error) {
      console.error("Error loading saved filters:", error);
    }
  }, []);

  useEffect(() => {
    // Save filters when they change
    if (typeof window === "undefined") return;

    try {
      const filtersToSave: SavedFilters = {
        searchTerm,
        selectedContinents: Array.from(selectedContinents),
        sortBy,
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filtersToSave));
    } catch (error) {
      console.error("Error saving filters:", error);
    }
  }, [searchTerm, selectedContinents, sortBy]);

  const baseContients: Continent[] = [
    "Europe",
    "North America",
    "South America",
    "Asia",
    "Africa",
    "Oceania",
    "Online",
  ];
  const continents: Continent[] = cfps.some(
    (cfp) => getContinent(cfp.conf.location) === "Unknown"
  )
    ? [...baseContients, "Unknown"]
    : baseContients;

  const statusOptions: StatusFilterType[] = [
    null,
    "submitted",
    "ignored",
    "all",
  ];

  const sortOptions: SortOption[] = ["cfpClose", "eventStart"];

  const getSortLabel = (option: SortOption): string => {
    switch (option) {
      case "cfpClose":
        return "CFP Close Date";
      case "eventStart":
        return "Event Start Date";
      default:
        return "Unknown";
    }
  };

  const handleStatusChange = (newStatus: StatusFilterType) => {
    setShowStatusFilter(newStatus);
  };

  const handleCFPStatusChange = (
    cfpId: string,
    newStatus: CFPStatus | null
  ) => {
    const newStatuses = {
      ...cfpStatuses,
    };

    if (newStatus === null) {
      delete newStatuses[cfpId];
    } else {
      newStatuses[cfpId] = {
        status: newStatus,
        notes: cfpStatuses[cfpId]?.notes || "",
      };
    }

    setCfpStatuses(newStatuses);
    localStorage.setItem("cfpStatuses", JSON.stringify(newStatuses));
  };

  const filteredCFPs = cfps.filter((cfp) => {
    const matchesSearch = cfp.conf.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesContinent =
      selectedContinents.size === 0 ||
      selectedContinents.has(getContinent(cfp.conf.location));
    const cfpId = createCFPId(cfp);
    const currentStatus = cfpStatuses[cfpId]?.status;
    const matchesStatus =
      showStatusFilter === "all"
        ? true
        : showStatusFilter === null
        ? !currentStatus
        : currentStatus === showStatusFilter;
    return matchesSearch && matchesContinent && matchesStatus;
  });

  const sortedAndFilteredCFPs = filteredCFPs.sort((a, b) => {
    if (sortBy === "eventStart") {
      return a.conf.date[0] - b.conf.date[0];
    }
    return a.untilDate - b.untilDate;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusLabel = (status: StatusFilterType): string => {
    switch (status) {
      case "all":
        return "All";
      case "submitted":
        return "Submitted";
      case "ignored":
        return "Not Interested";
      case null:
        return "Pending";
      default:
        return "Unknown";
    }
  };

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    // Add title tooltips for truncated text
    const titles = gridRef.current.querySelectorAll(`.${styles.cardTitle}`);
    titles.forEach((title) => {
      const element = title as HTMLElement;
      if (element.scrollHeight > element.clientHeight) {
        element.title = element.textContent || "";
      }
    });
  }, [sortedAndFilteredCFPs]);

  return (
    <div className={styles.container}>
      <div className={styles.titleBlock}>
        <div className={styles.titleContent}>
          <h1>Ben&apos;s CFP Tracker</h1>
        </div>
      </div>
      <div className={styles.contentContainer}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.filtersContainer}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Name</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conferences..."
                  className={styles.searchInput}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Location</label>
                <MultiSelect<Continent>
                  options={continents}
                  selectedOptions={selectedContinents}
                  onChange={setSelectedContinents}
                  placeholder="All Locations"
                />
                {selectedContinents.size > 0 && (
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => setSelectedContinents(new Set())}
                    aria-label="Clear location filter"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Proposals</label>
                <SingleSelect<StatusFilterType>
                  options={statusOptions}
                  value={showStatusFilter}
                  onChange={handleStatusChange}
                  placeholder="Filter by Status"
                  getLabel={getStatusLabel}
                />
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Sort by</label>
                <SingleSelect<SortOption>
                  options={sortOptions}
                  value={sortBy}
                  onChange={setSortBy}
                  placeholder="Sort by"
                  getLabel={getSortLabel}
                />
              </div>
            </div>
          </div>
        </header>

        {(loading || showMinLoading) && (
          <div className={styles.messageContainer}>
            <div className={styles.loadingMessage}>
              <span className={styles.loadingEmoji}>🚜</span>
              Loading CFPs...
            </div>
          </div>
        )}

        {error && (
          <div className={styles.messageContainer}>
            <div className={styles.errorMessage}>{error}</div>
          </div>
        )}

        {!loading && !error && !showMinLoading && (
          <main className={styles.main}>
            <div className={styles.grid} ref={gridRef}>
              {sortedAndFilteredCFPs.length > 0 ? (
                sortedAndFilteredCFPs.map((cfp, index) => {
                  const cfpId = createCFPId(cfp);
                  const status = cfpStatuses[cfpId]?.status;
                  const isClosingSoon = cfp.untilDate - new Date("2025-01-10T22:01:52Z").getTime() < 7 * 24 * 60 * 60 * 1000;
                  return (
                    <article
                      key={index}
                      className={`${styles.card} ${
                        status ? styles[status] : ""
                      } ${isClosingSoon ? styles.closingSoon : ""}`}
                    >
                      <h2 className={styles.cardTitle}>{cfp.conf.name}</h2>
                      <div className={styles.cardMeta}>
                        <p>Location: {cfp.conf.location}</p>
                        <p>CFP Closes: {formatDate(cfp.untilDate)}</p>
                        <p>Event Date: {formatDate(cfp.conf.date[0])}</p>
                      </div>
                      <div className={styles.cardActions}>
                        <a
                          href={cfp.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.cardLink}
                        >
                          Submit Proposal
                        </a>
                        <div className={styles.statusButtons}>
                          <button
                            className={`${styles.statusButton} ${
                              status === "submitted" ? styles.active : ""
                            }`}
                            onClick={() =>
                              handleCFPStatusChange(
                                cfpId,
                                status === "submitted" ? null : "submitted"
                              )
                            }
                          >
                            <span
                              style={{
                                color:
                                  status === "submitted"
                                    ? "#22c55e"
                                    : "currentColor",
                              }}
                            >
                              ✓
                            </span>
                            {status === "submitted" ? "Unsubmit" : "Submitted"}
                          </button>
                          <button
                            className={`${styles.statusButton} ${
                              status === "ignored" ? styles.active : ""
                            }`}
                            onClick={() =>
                              handleCFPStatusChange(
                                cfpId,
                                status === "ignored" ? null : "ignored"
                              )
                            }
                          >
                            <span
                              style={{
                                color:
                                  status === "ignored"
                                    ? "#ef4444"
                                    : "currentColor",
                              }}
                            >
                              ✕
                            </span>
                            {status === "ignored" ? "Reinstate" : "Not Interested"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <p className={styles.noResults}>
                  No active CFPs found matching your criteria
                </p>
              )}
            </div>
          </main>
        )}
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          Created by{" "}
          <a
            href="https://bsky.app/profile/bendechr.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              className={styles.blueskyIcon}
              viewBox="0 0 600 530"
              aria-hidden="true"
            >
              <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
            </svg>{" "}
            bendechr.ai
          </a>
          . Conference submission statuses are stored in your browser&apos;s
          local storage for privacy.{" "}
          <a
            href="https://github.com/bendechrai/cfps/issues"
            target="_blank"
            rel="noopener noreferrer"
          >
            Submit feature requests or issues
          </a>
          . Data from{" "}
          <a
            href="https://github.com/scraly/developers-conferences-agenda"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg
              className={styles.githubIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
            </svg>{" "}
            developers-conferences-agenda
          </a>
        </div>
      </footer>
    </div>
  );
}
