import { ICFPSource, CFPSourceConfig, RawJoindInCFP } from "../types";
import { CFP } from "../../../utils/types";

interface JoindInResponse {
  events: RawJoindInCFP[];
}

export class JoindInCFPSource implements ICFPSource {
  private config: CFPSourceConfig;

  constructor(config: CFPSourceConfig) {
    this.config = config;
  }

  async fetchCFPs(): Promise<CFP[]> {
    if (!this.config.enabled) return [];

    try {
      const rawCFPs = await this.fetchRawCFPs();
      const cfpsWithEndDates = await this.enrichWithCFPEndDates(rawCFPs);
      return cfpsWithEndDates
        .filter((cfp): cfp is Required<RawJoindInCFP> => cfp.cfpEndDate !== undefined)
        .map(this.transformCFP);
    } catch (error) {
      console.error("Error fetching CFPs from joind.in:", error);
      throw error;
    }
  }

  private async fetchRawCFPs(): Promise<RawJoindInCFP[]> {
    const response = await fetch("https://api.joind.in/v2.1/events?filter=cfp");
    if (!response.ok) throw new Error("Failed to fetch CFPs from joind.in");
    const data: JoindInResponse = await response.json();
    return data.events;
  }

  private async enrichWithCFPEndDates(cfps: RawJoindInCFP[]): Promise<RawJoindInCFP[]> {
    return await Promise.all(
      cfps.map(async (cfp) => {
        const cfpEndDate = await this.fetchCFPEndDate(cfp.website_uri);
        return { ...cfp, cfpEndDate };
      })
    );
  }

  private async fetchCFPEndDate(websiteUri: string): Promise<number | undefined> {
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
      status: 'open',
      source: 'joindin',
      tags: raw.tags,
      references: {
        'joindin': raw.href
      }
    };
  }
}
