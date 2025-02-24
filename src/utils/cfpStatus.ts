import { CFP } from "./types";

/**
 * Possible status values for a CFP
 */
export type CFPStatus = 'submitted' | 'ignored' | null;

/**
 * Structure for storing CFP status data
 */
export interface CFPStatusData {
  [cfpId: string]: {
    /** Current status of the CFP */
    status: CFPStatus;
    /** Timestamp when status was last updated */
    timestamp: number;
    /** Optional notes about the CFP */
    notes?: string;
  };
}

/** Local Storage key for CFP status data */
export const CFP_STATUS_KEY = 'cfp-tracker-status';

/**
 * Creates a unique identifier for a CFP
 * @param cfp The CFP to create an ID for
 * @returns A unique string identifier
 */
export const createCFPId = (cfp: CFP): string => {
  return `${cfp.source}-${cfp.id}`;
};

/**
 * Retrieves all CFP statuses from localStorage
 * @returns Object containing all saved CFP statuses
 */
export const getCFPStatuses = (): CFPStatusData => {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(CFP_STATUS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error reading CFP statuses:', error);
    return {};
  }
};

/**
 * Saves or updates a CFP's status in localStorage
 * @param cfpId Unique identifier of the CFP
 * @param status New status to save
 * @param notes Optional notes about the CFP
 */
export const saveCFPStatus = (
  cfpId: string,
  status: CFPStatus,
  notes: string = ''
): void => {
  if (typeof window === 'undefined') return;

  try {
    const statuses = getCFPStatuses();
    
    if (status === null) {
      delete statuses[cfpId];
    } else {
      statuses[cfpId] = {
        status,
        timestamp: Date.now(),
        ...(notes ? { notes } : {})
      };
    }
    
    localStorage.setItem(CFP_STATUS_KEY, JSON.stringify(statuses));
  } catch (error) {
    console.error('Error saving CFP status:', error);
  }
};
