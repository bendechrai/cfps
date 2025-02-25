import { ICFPSource, RawDevelopersEventsCFP, CFPSourceConfig } from "../types";
import { CFP } from "../../../utils/types";

export class DevelopersEventsCFPSource implements ICFPSource<RawDevelopersEventsCFP> {
  private config: CFPSourceConfig;

  constructor(config: CFPSourceConfig) {
    this.config = config;
  }

  getName(): string {
    return "developers.events";
  }

  async fetchRawData(): Promise<RawDevelopersEventsCFP[]> {
    if (!this.config.enabled) return [];

    try {
      const response = await fetch(this.config.url);
      if (!response.ok)
        throw new Error("Failed to fetch CFPs from developers.events");
      return await response.json();
    } catch (error) {
      console.error("Error fetching CFPs from developers.events:", error);
      throw error; // Let CFPService handle the error
    }
  }

  private transformCFP(raw: RawDevelopersEventsCFP): CFP {
    return {
      id: `devents-${raw.conf.name}-${raw.untilDate}`,
      name: raw.conf.name,
      cfpUrl: raw.link,
      eventUrl: raw.conf.hyperlink,
      cfpEndDate: raw.untilDate,
      eventStartDate: raw.conf.date[0],
      eventEndDate: raw.conf.date[1],
      location: raw.conf.location,
      status: raw.conf.status as "open" | "closed",
      source: "developers-events",
      references: {
        "developers-events": raw.link,
      },
    };
  }

  public transformRawDataToCFPs(rawData: RawDevelopersEventsCFP[]): CFP[] {
    return (
      rawData
        // Transform each raw CFP to a CFP object
        .map((raw) => this.transformCFP(raw))
    );
  }
}
