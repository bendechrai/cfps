/**
 * Represents a conference event
 */
export interface Conference {
  /** Name of the conference */
  name: string;
  /** Array of timestamps for conference dates */
  date: number[];
  /** URL to conference website */
  hyperlink: string;
  /** Current status of the conference */
  status: string;
  /** Physical or virtual location of the conference */
  location: string;
}

/**
 * Represents a Call for Papers (CFP) submission opportunity
 */
export interface CFP {
  /** URL to submit CFP */
  link: string;
  /** Human-readable deadline string */
  until: string;
  /** Timestamp of the deadline */
  untilDate: number;
  /** Associated conference details */
  conf: Conference;
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
