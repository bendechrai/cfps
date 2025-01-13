import { Continent } from "../../utils/types";
import { getContinent } from "../../utils/countryToContinent";
import styles from "./FilterBar.module.css";
import { MultiSelect } from "../MultiSelect/MultiSelect";
import { SingleSelect } from "../SingleSelect/SingleSelect";
import { useFilter } from "../../contexts/FilterContext";
import { useCFP } from "../../contexts/CFPContext";

export const FilterBar = () => {
  const { cfps } = useCFP();
  const {
    searchTerm,
    setSearchTerm,
    selectedContinents,
    setSelectedContinents,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
  } = useFilter();

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

  const statusOptions = [null, "submitted", "ignored", "all"] as const;
  const sortOptions = ["cfpClose", "eventStart"] as const;

  const getStatusLabel = (status: (typeof statusOptions)[number]): string => {
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

  const getSortLabel = (option: (typeof sortOptions)[number]): string => {
    switch (option) {
      case "cfpClose":
        return "CFP Close Date";
      case "eventStart":
        return "Event Start Date";
      default:
        return "Unknown";
    }
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Search</label>
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
        <label className={styles.filterLabel}>Continents</label>
        <MultiSelect
          options={continents}
          selected={selectedContinents}
          onChange={setSelectedContinents}
          getOptionLabel={(continent) => continent}
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
        <label className={styles.filterLabel}>Status</label>
        <SingleSelect
          options={statusOptions}
          selected={statusFilter}
          onChange={setStatusFilter}
          getOptionLabel={getStatusLabel}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Sort By</label>
        <SingleSelect
          options={sortOptions}
          selected={sortBy}
          onChange={setSortBy}
          getOptionLabel={getSortLabel}
        />
      </div>
    </div>
  );
};
