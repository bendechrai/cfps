'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './cfps.module.css';
import { CFP, Continent } from '../utils/types';
import { getContinent } from '../utils/countryToContinent';
import { CFPStatus, createCFPId, getCFPStatuses, saveCFPStatus } from '../utils/cfpStatus';
import { MultiSelect } from '../components/MultiSelect';
import { SingleSelect } from '../components/SingleSelect';

const CURRENT_TIME = new Date('2025-01-05T23:03:18Z').getTime();

const FILTER_STORAGE_KEY = 'cfp-tracker-filters';

interface SavedFilters {
  searchTerm: string;
  selectedContinents: Continent[];
}

type StatusFilterType = CFPStatus | 'all';

export default function Home() {
  const [cfps, setCfps] = useState<CFP[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinents, setSelectedContinents] = useState<Set<Continent>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cfpStatuses, setCfpStatuses] = useState<Record<string, { status: CFPStatus; notes: string }>>({});
  const [showStatusFilter, setShowStatusFilter] = useState<StatusFilterType>(null);

  useEffect(() => {
    const fetchCFPs = async () => {
      try {
        const response = await fetch('https://developers.events/all-cfps.json');
        if (!response.ok) throw new Error('Failed to fetch CFPs');
        const data = await response.json();
        
        // Only check untilDate, ignore status field
        const activeCfps = data
          .filter((cfp: CFP) => cfp.untilDate > CURRENT_TIME)
          .sort((a: CFP, b: CFP) => a.untilDate - b.untilDate);
        
        setCfps(activeCfps);
      } catch (error) {
        setError('Failed to load CFPs. Please try again later.');
        console.error('Error fetching CFPs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCFPs();
  }, []);

  useEffect(() => {
    // Load saved statuses
    const savedStatuses = getCFPStatuses();
    setCfpStatuses(Object.fromEntries(
      Object.entries(savedStatuses).map(([id, data]) => [id, { 
        status: data.status, 
        notes: data.notes || '' 
      }])
    ));
  }, []);

  useEffect(() => {
    // Load saved filters
    if (typeof window === 'undefined') return;
    
    try {
      const savedFilters = localStorage.getItem(FILTER_STORAGE_KEY);
      if (savedFilters) {
        const { searchTerm, selectedContinents } = JSON.parse(savedFilters) as SavedFilters;
        setSearchTerm(searchTerm);
        setSelectedContinents(new Set(selectedContinents));
      }
    } catch (error) {
      console.error('Error loading saved filters:', error);
    }
  }, []);

  useEffect(() => {
    // Save filters when they change
    if (typeof window === 'undefined') return;
    
    try {
      const filtersToSave: SavedFilters = {
        searchTerm,
        selectedContinents: Array.from(selectedContinents)
      };
      localStorage.setItem(FILTER_STORAGE_KEY, JSON.stringify(filtersToSave));
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  }, [searchTerm, selectedContinents]);

  const continents: Continent[] = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Oceania', 'Online', 'Unknown'];
  const statusOptions: StatusFilterType[] = [null, 'submitted', 'ignored', 'all'];

  const handleStatusChange = (newStatus: StatusFilterType) => {
    setShowStatusFilter(newStatus);
  };

  const handleCFPStatusChange = (cfpId: string, newStatus: CFPStatus | null) => {
    if (!newStatus) return;
    
    const newStatuses = {
      ...cfpStatuses,
      [cfpId]: {
        status: newStatus,
        notes: cfpStatuses[cfpId]?.notes || ''
      }
    };
    
    setCfpStatuses(newStatuses);
    saveCFPStatus(cfpId, newStatus);
  };

  const filteredCFPs = cfps.filter(cfp => {
    const matchesSearch = cfp.conf.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesContinent = selectedContinents.size === 0 || selectedContinents.has(getContinent(cfp.conf.location));
    const cfpId = createCFPId(cfp);
    const currentStatus = cfpStatuses[cfpId]?.status;
    const matchesStatus = showStatusFilter === 'all' 
      ? true 
      : showStatusFilter === null 
        ? !currentStatus 
        : currentStatus === showStatusFilter;
    return matchesSearch && matchesContinent && matchesStatus;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusLabel = (status: StatusFilterType): string => {
    switch (status) {
      case 'all':
        return 'All';
      case 'submitted':
        return 'Submitted';
      case 'ignored':
        return 'Not Interested';
      case null:
        return 'Pending';
      default:
        return 'Unknown';
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
        element.title = element.textContent || '';
      }
    });
  }, [filteredCFPs]);

  if (loading) return <div className={styles.container}>Loading CFPs...</div>;
  if (error) return <div className={styles.container}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.titleBlock}>
        <div className={styles.titleContent}>
          <h1>CFP Tracker</h1>
        </div>
      </div>
      <div className={styles.contentContainer}>
        <header className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.filtersContainer}>
              <div className={styles.filterGroup}>
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
                    onClick={() => setSearchTerm('')}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              <div className={styles.filterGroup}>
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
                <SingleSelect<StatusFilterType>
                  options={statusOptions}
                  value={showStatusFilter}
                  onChange={handleStatusChange}
                  placeholder="Filter by Status"
                  getLabel={getStatusLabel}
                />
              </div>
            </div>
          </div>
        </header>

        <main className={styles.main}>
          <div className={styles.grid} ref={gridRef}>
            {filteredCFPs.length > 0 ? (
              filteredCFPs.map((cfp, index) => {
                const cfpId = createCFPId(cfp);
                const status = cfpStatuses[cfpId]?.status;
                return (
                  <article key={index} className={`${styles.card} ${status ? styles[status] : ''}`}>
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
                          className={`${styles.statusButton} ${status === 'submitted' ? styles.active : ''}`}
                          onClick={() => handleCFPStatusChange(cfpId, status === 'submitted' ? null : 'submitted')}
                        >
                          <span style={{ color: status === 'submitted' ? '#22c55e' : 'currentColor' }}>✓</span>
                          Submitted
                        </button>
                        <button
                          className={`${styles.statusButton} ${status === 'ignored' ? styles.active : ''}`}
                          onClick={() => handleCFPStatusChange(cfpId, status === 'ignored' ? null : 'ignored')}
                        >
                          <span style={{ color: status === 'ignored' ? '#ef4444' : 'currentColor' }}>✕</span>
                          Not Interested
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className={styles.noResults}>No active CFPs found matching your criteria</p>
            )}
          </div>
        </main>
      </div>
      <footer className={styles.footer}>
        Data provided by <a href="https://github.com/scraly/developers-conferences-agenda" target="_blank" rel="noopener noreferrer">
          <svg className={styles.githubIcon} viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          developers-conferences-agenda.
        </a> Conference submission statuses are stored in your browser&apos;s local storage for privacy.
      </footer>
    </div>
  );
}
