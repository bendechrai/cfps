'use client';

import { useEffect, useState, useRef } from 'react';
import styles from './cfps.module.css';
import { CFP, Continent } from '../utils/types';
import { getContinent } from '../utils/countryToContinent';
import { CFPStatus, createCFPId, getCFPStatuses, saveCFPStatus } from '../utils/cfpStatus';
import { MultiSelect } from '../components/MultiSelect';
import { SingleSelect } from '../components/SingleSelect';

const CURRENT_TIME = new Date('2025-01-06T00:54:02Z').getTime();

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
  const [showMinLoading, setShowMinLoading] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const minLoadingTime = 500; // Minimum load time to show off the tractor!

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
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, minLoadingTime - elapsedTime);
        
        // Ensure minimum loading time
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

  const baseContients: Continent[] = ['Europe', 'North America', 'South America', 'Asia', 'Africa', 'Oceania', 'Online'];
  const continents: Continent[] = cfps.some(cfp => getContinent(cfp.conf.location) === 'Unknown')
    ? [...baseContients, 'Unknown']
    : baseContients;

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


  return (
    <div className={styles.container}>
      <div className={styles.titleBlock}>
        <div className={styles.titleContent}>
          <h1>Ben's CFP Tracker</h1>
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
            <div className={styles.errorMessage}>
              {error}
            </div>
          </div>
        )}

        {!loading && !error && !showMinLoading && (
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
        )}
      </div>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          Created by <a href="https://bsky.app/profile/bendechr.ai" target="_blank" rel="noopener noreferrer">
            <svg className={styles.blueskyIcon} viewBox="0 0 600 530" aria-hidden="true">
              <path d="m135.72 44.03c66.496 49.921 138.02 151.14 164.28 205.46 26.262-54.316 97.782-155.54 164.28-205.46 47.98-36.021 125.72-63.892 125.72 24.795 0 17.712-10.155 148.79-16.111 170.07-20.703 73.984-96.144 92.854-163.25 81.433 117.3 19.964 147.14 86.092 82.697 152.22-122.39 125.59-175.91-31.511-189.63-71.766-2.514-7.3797-3.6904-10.832-3.7077-7.8964-0.0174-2.9357-1.1937 0.51669-3.7077 7.8964-13.714 40.255-67.233 197.36-189.63 71.766-64.444-66.128-34.605-132.26 82.697-152.22-67.108 11.421-142.55-7.4491-163.25-81.433-5.9562-21.282-16.111-152.36-16.111-170.07 0-88.687 77.742-60.816 125.72-24.795z" />
            </svg>{" "}
            bendechr.ai
          </a>. Conference submission statuses are stored in your browser&apos;s local storage for privacy.
          Data from <a href="https://github.com/scraly/developers-conferences-agenda" target="_blank" rel="noopener noreferrer">
            <svg className={styles.githubIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>{" "}
            developers-conferences-agenda
          </a>
        </div>
      </footer>
    </div>
  );
}
