import { Continent } from "../utils/types";
import { CFPStatus } from "../utils/cfpStatus";
import styles from "../app/cfps.module.css";
import { MultiSelect } from "./MultiSelect";
import { SingleSelect } from "./SingleSelect";

type SortOption = "cfpClose" | "eventStart";
type StatusFilterType = CFPStatus | "all" | null;

interface FilterBarProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedContinents: Set<Continent>;
  onSelectedContinentsChange: (continents: Set<Continent>) => void;
  continents: Continent[];
  showStatusFilter: StatusFilterType;
  onStatusFilterChange: (status: StatusFilterType) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  statusOptions: StatusFilterType[];
  sortOptions: SortOption[];
  getStatusLabel: (status: StatusFilterType) => string;
  getSortLabel: (option: SortOption) => string;
}

export const FilterBar = ({
  searchTerm,
  onSearchTermChange,
  selectedContinents,
  onSelectedContinentsChange,
  continents,
  showStatusFilter,
  onStatusFilterChange,
  sortBy,
  onSortByChange,
  statusOptions,
  sortOptions,
  getStatusLabel,
  getSortLabel,
}: FilterBarProps) => {
  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Name</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          placeholder="Search conferences..."
          className={styles.searchInput}
        />
        {searchTerm && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => onSearchTermChange("")}
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
          onChange={onSelectedContinentsChange}
          placeholder="All Locations"
        />
        {selectedContinents.size > 0 && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => onSelectedContinentsChange(new Set())}
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
          onChange={onStatusFilterChange}
          placeholder="Filter by Status"
          getLabel={getStatusLabel}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>Sort by</label>
        <SingleSelect<SortOption>
          options={sortOptions}
          value={sortBy}
          onChange={onSortByChange}
          placeholder="Sort by"
          getLabel={getSortLabel}
        />
      </div>
    </div>
  );
};
