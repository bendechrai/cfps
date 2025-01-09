import { CFP } from "../../../utils/types";
import { ICFPSource, RawDevelopersEventsCFP, CFPSourceConfig } from "../types";

export class DevelopersEventsCFPSource implements ICFPSource {
  private config: CFPSourceConfig;

  constructor(config: CFPSourceConfig) {
    this.config = config;
  }

  async fetchCFPs(): Promise<CFP[]> {
    if (!this.config.enabled) return [];

    try {
      const response = await fetch(this.config.url);
      if (!response.ok) throw new Error("Failed to fetch CFPs from developers.events");
      const data: RawDevelopersEventsCFP[] = await response.json();
      return data.map(this.transformCFP);
    } catch (error) {
      console.error("Error fetching CFPs from developers.events:", error);
      throw error;
    }
  }

  private transformCFP(raw: RawDevelopersEventsCFP): CFP {
    return {
      conf: {
        name: raw.conf.name,
        date: raw.conf.date,
        hyperlink: raw.conf.hyperlink,
        status: raw.conf.status,
        location: raw.conf.location,
      },
      link: raw.link,
      until: new Date(raw.untilDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      untilDate: raw.untilDate,
    };
  }
}
