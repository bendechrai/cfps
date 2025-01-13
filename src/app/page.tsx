"use client";

import { useEffect, useState, useRef } from "react";
import styles from "./cfps.module.css";
import { CFP, Continent } from "../utils/types";
import { getContinent } from "../utils/countryToContinent";
import { CFPStatus, createCFPId, getCFPStatuses } from "../utils/cfpStatus";
import { CFPService } from "../services/cfp/cfp.service";
import { CFPCard } from "../components/CFPCard/CFPCard";
import { FilterBar } from "../components/FilterBar";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { PageFooter } from "../components/PageFooter";

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
  const [sortBy, setSortBy] = useState<SortOption>("cfpClose");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const cfpService = CFPService.getInstance();
        const fetchedCFPs = await cfpService.fetchCFPs();
        setCfps(fetchedCFPs);
      } catch (error) {
        console.error("Error fetching CFPs:", error);
        setError("Failed to load CFPs. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
            <FilterBar
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              selectedContinents={selectedContinents}
              onSelectedContinentsChange={setSelectedContinents}
              continents={continents}
              showStatusFilter={showStatusFilter}
              onStatusFilterChange={handleStatusChange}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              statusOptions={statusOptions}
              sortOptions={sortOptions}
              getStatusLabel={getStatusLabel}
              getSortLabel={getSortLabel}
            />
          </div>
        </header>

        {loading && <LoadingState />}

        {error && <ErrorState message={error} />}

        {!loading && !error && (
          <main className={styles.main}>
            <div className={styles.grid} ref={gridRef}>
              {sortedAndFilteredCFPs.length > 0 ? (
                sortedAndFilteredCFPs.map((cfp, index) => {
                  const cfpId = createCFPId(cfp);
                  const status = cfpStatuses[cfpId]?.status;
                  const isClosingSoon = cfp.untilDate - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;
                  return (
                    <CFPCard
                      key={index}
                      cfp={cfp}
                      status={status}
                      isClosingSoon={isClosingSoon}
                      onStatusChange={(newStatus) => handleCFPStatusChange(cfpId, newStatus)}
                    />
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
      <PageFooter />
    </div>
  );
}
