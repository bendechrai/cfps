import { ICFPSource, CFPSourceConfig, RawJoindInCFP } from "../types";
import { CFP } from "../../../utils/types";

interface JoindInResponse {
  events: RawJoindInCFP[];
}

export class JoindInCFPSource implements ICFPSource<RawJoindInCFP> {
  private config: CFPSourceConfig;

  constructor(config: CFPSourceConfig) {
    this.config = config;
  }

  getName(): string {
    return "joindin";
  }

  async fetchRawData(): Promise<RawJoindInCFP[]> {
    if (!this.config.enabled) return [];

    try {
      const response = await fetch(this.config.url);
      if (!response.ok) throw new Error("Failed to fetch CFPs from joind.in");
      const data: JoindInResponse = await response.json();

      // Enrich the data with CFP end dates before caching
      const enrichedData = await this.enrichWithCFPEndDates(data.events);
      return enrichedData;
    } catch (error) {
      console.error("Error fetching CFPs from joind.in:", error);
      throw error;
    }
  }

  private async enrichWithCFPEndDates(
    cfps: RawJoindInCFP[]
  ): Promise<RawJoindInCFP[]> {
    return await Promise.all(
      cfps.map(async (cfp) => {
        const cfpEndDate = await this.fetchCFPEndDate(cfp.website_uri);
        return { ...cfp, cfpEndDate };
      })
    );
  }

  private async fetchCFPEndDate(
    websiteUri: string
  ): Promise<number | undefined> {
    try {
      const response = await fetch(`${websiteUri}/details`);
      if (!response.ok) return undefined;
      const text = await response.text();
      const match = text.match(
        /Call for Papers:[\s\S]+?Open until (\d{1,2} \w{3} \d{4})\./
      );
      if (!match) return undefined;
      return new Date(match[1]).getTime();
    } catch (error) {
      console.error("Error fetching CFP end date:", error);
      return undefined;
    }
  }

  private transformCFP(raw: Required<RawJoindInCFP>): CFP {
    return {
      id: `joindin-${raw.website_uri}`,
      name: raw.name,
      cfpUrl: `${raw.website_uri}/details`,
      eventUrl: raw.website_uri,
      cfpEndDate: raw.cfpEndDate,
      eventStartDate: new Date(raw.start_date).getTime(),
      eventEndDate: new Date(raw.end_date).getTime(),
      location: raw.location,
      status: "open",
      source: "joindin",
      tags: raw.tags,
      references: {
        joindin: raw.href,
      },
    };
  }

  public transformRawDataToCFPs(rawData: RawJoindInCFP[]): CFP[] {
    return (
      rawData
        // Filter only CFPs that have a valid end date
        .filter(
          (raw): raw is Required<RawJoindInCFP> => raw.cfpEndDate !== undefined
        )
        // Transform each raw CFP to a CFP object
        .map((raw) => this.transformCFP(raw))
    );
  }
}
