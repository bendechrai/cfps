'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CFP } from '../utils/types';
import { CFPStatus, CFPStatusData, CFP_STATUS_KEY } from '../utils/cfpStatus';
import { CFPService } from '../services/cfp/cfp.service';
import { getCFPStatuses } from '../utils/cfpStatus';

interface CFPContextType {
  cfps: CFP[];
  loading: boolean;
  error: string | null;
  cfpStatuses: CFPStatusData;
  updateCFPStatus: (cfpId: string, newStatus: CFPStatus | null) => void;
}

const CFPContext = createContext<CFPContextType | undefined>(undefined);

export function useCFP() {
  const context = useContext(CFPContext);
  if (!context) {
    throw new Error('useCFP must be used within a CFPProvider');
  }
  return context;
}

export function CFPProvider({ children }: { children: ReactNode }) {
  const [cfps, setCfps] = useState<CFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cfpStatuses, setCfpStatuses] = useState<CFPStatusData>({});

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
    setCfpStatuses(savedStatuses);
  }, []);

  const updateCFPStatus = (cfpId: string, newStatus: CFPStatus | null) => {
    const newStatuses = { ...cfpStatuses };
    if (newStatus === null) {
      delete newStatuses[cfpId];
    } else {
      newStatuses[cfpId] = {
        status: newStatus,
        timestamp: Date.now(),
        notes: cfpStatuses[cfpId]?.notes || "",
      };
    }
    setCfpStatuses(newStatuses);
    localStorage.setItem(CFP_STATUS_KEY, JSON.stringify(newStatuses));
  };

  return (
    <CFPContext.Provider value={{ cfps, loading, error, cfpStatuses, updateCFPStatus }}>
      {children}
    </CFPContext.Provider>
  );
}
