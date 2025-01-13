'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Continent } from '../utils/types';

type SortOption = 'cfpClose' | 'eventStart';
type StatusFilterType = 'submitted' | 'ignored' | 'all' | null;

interface FilterContextType {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedContinents: Set<Continent>;
  setSelectedContinents: (continents: Set<Continent>) => void;
  statusFilter: StatusFilterType;
  setStatusFilter: (status: StatusFilterType) => void;
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
}

const FILTER_STORAGE_KEY = 'cfp-tracker-filters';

interface SavedFilters {
  searchTerm: string;
  selectedContinents: Continent[];
  statusFilter: StatusFilterType;
  sortBy: SortOption;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinents, setSelectedContinents] = useState<Set<Continent>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>(null);
  const [sortBy, setSortBy] = useState<SortOption>('cfpClose');

  // Load saved filters
  useEffect(() => {
    const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
    if (savedFilters) {
      const { searchTerm, selectedContinents, statusFilter, sortBy } = JSON.parse(savedFilters) as SavedFilters;
      setSearchTerm(searchTerm);
      setSelectedContinents(new Set(selectedContinents));
      setStatusFilter(statusFilter);
      setSortBy(sortBy);
    }
  }, []);

  // Save filters when they change
  useEffect(() => {
    const filtersToSave: SavedFilters = {
      searchTerm,
      selectedContinents: Array.from(selectedContinents),
      statusFilter,
      sortBy,
    };
    localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filtersToSave));
  }, [searchTerm, selectedContinents, statusFilter, sortBy]);

  return (
    <FilterContext.Provider
      value={{
        searchTerm,
        setSearchTerm,
        selectedContinents,
        setSelectedContinents,
        statusFilter,
        setStatusFilter,
        sortBy,
        setSortBy,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
