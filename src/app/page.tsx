"use client";

import styles from "./cfps.module.css";
import { createCFPId } from "../utils/cfpStatus";
import { getContinent } from "../utils/countryToContinent";
import { CFPCard } from "../components/CFPCard/CFPCard";
import { FilterBar } from "../components/FilterBar/FilterBar";
import { LoadingState } from "../components/LoadingState/LoadingState";
import { ErrorState } from "../components/ErrorState/ErrorState";
import { PageFooter } from "../components/PageFooter/PageFooter";
import { CFPProvider, useCFP } from "../contexts/CFPContext";
import { FilterProvider, useFilter } from "../contexts/FilterContext";

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.titleBlock}>
        <div className={styles.titleContent}>
          <h1>CFP Tracker</h1>
          <p className={styles.subtitle}>
            Track your conference talk proposals and submissions
          </p>
        </div>
      </div>

      <CFPProvider>
        <FilterProvider>
          <div className={styles.contentContainer}>
            <div className={styles.header}>
              <div className={styles.headerContent}>
                <FilterBar />
              </div>
            </div>
            <main className={styles.main}>
              <CFPGrid />
            </main>
          </div>
        </FilterProvider>
      </CFPProvider>

      <PageFooter />
    </div>
  );
}

// Separate the grid into its own component to handle loading/error states
function CFPGrid() {
  const { cfps, loading, error, cfpStatuses } = useCFP();
  const { searchTerm, selectedContinents, statusFilter, sortBy } = useFilter();

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const filteredCFPs = cfps
    .filter((cfp) => {
      const matchesSearch = cfp.conf.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesContinent =
        selectedContinents.size === 0 ||
        selectedContinents.has(getContinent(cfp.conf.location));
      const cfpId = createCFPId(cfp);
      const currentStatus = cfpStatuses[cfpId]?.status;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === null
          ? !currentStatus
          : currentStatus === statusFilter;
      return matchesSearch && matchesContinent && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "eventStart") {
        return a.conf.date[0] - b.conf.date[0];
      }
      return a.untilDate - b.untilDate;
    });

  return (
    <div className={styles.grid}>
      {filteredCFPs.length === 0 ? (
        <div className={styles.noResults}>No CFPs match your filters</div>
      ) : (
        filteredCFPs.map((cfp) => {
          const isClosingSoon =
            cfp.untilDate - new Date().getTime() < 3 * 24 * 60 * 60 * 1000;
          return (
            <CFPCard
              key={createCFPId(cfp)}
              cfp={cfp}
              isClosingSoon={isClosingSoon}
            />
          );
        })
      )}
    </div>
  );
}
