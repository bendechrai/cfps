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

export interface CFPSourceConfig {
  enabled: boolean;
  url: string;
}
