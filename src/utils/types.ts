/**
 * Represents a Call for Papers (CFP) submission opportunity
 */
export interface CFP {
  /** Unique identifier for the CFP */
  id: string;
  /** Conference name */
  name: string;
  /** URL to submit CFP */
  cfpUrl: string;
  /** Main event URL */
  eventUrl: string;
  /** Unix timestamp for CFP end date */
  cfpEndDate: number;
  /** Unix timestamp for event start */
  eventStartDate: number;
  /** Unix timestamp for event end */
  eventEndDate: number;
  /** Event location */
  location: string;
  /** CFP status */
  status: 'open' | 'closed';
  /** Source of the CFP data */
  source: string;
  /** Optional tags/topics */
  tags?: string[];
  /** Source references */
  references: {
    [key: string]: string;
  };
}

/**
 * Valid continents for conference locations
 */
export type Continent = 
  | 'Europe' 
  | 'North America' 
  | 'South America' 
  | 'Asia' 
  | 'Africa' 
  | 'Oceania' 
  | 'Online' 
  | 'Unknown';
