import { CFP } from "../../utils/types";

export interface ICFPSource {
  fetchCFPs(): Promise<CFP[]>;
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

export interface CFPSourceConfig {
  enabled: boolean;
  url: string;
}
