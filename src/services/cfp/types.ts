import { CFP } from "../../utils/types";

export interface ICFPSource<T = unknown> {
  getName(): string;
  fetchRawData(): Promise<T[]>;
  transformRawDataToCFPs(rawData: T[]): CFP[];
}

export interface RawDevelopersEventsCFP {
  conf: {
    name: string;
    date: number[];
    hyperlink: string;
    status: string;
    location: string;
  };
  link: string;
  untilDate: number;
}

export interface RawJoindInCFP {
  name: string;
  website_uri: string;
  start_date: string;
  end_date: string;
  location: string;
  tags: string[];
  href: string;
  cfpEndDate?: number; // Optional as it's fetched separately
}

export interface RawConfsTechCFP {
  id: number;
  name: string;
  url: string;
  cfpUrl: string;
  startDate: string;
  endDate: string;
  cfpEndDate: string;
  city: string | null;
  country: string | null;
  online: boolean;
  topics: string[];
  cocUrl: string | null;
}

export interface RawPaperCallCFP {
  id: string;
  name: string;
  eventUrl: string;
  cfpUrl: string;
  location: string;
  eventStartDate: string;
  eventEndDate: string;
  cfpEndDate: string;
  tags: string[];
}

export interface CFPSourceConfig {
  url: string;
}
