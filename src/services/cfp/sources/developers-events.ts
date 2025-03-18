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

  private transformDate(timestamp: number | null | undefined, endOfDay: boolean = false): number {
    if (!timestamp) {
      console.warn('Invalid timestamp:', timestamp);
      return 0;
    }

    try {
      // Convert milliseconds to seconds if needed
      const seconds = timestamp > 9999999999 ? Math.floor(timestamp / 1000) : timestamp;
      const date = new Date(seconds * 1000);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date from timestamp:', timestamp);
        return 0;
      }

      // Ensure we're working with UTC dates
      const utcDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        endOfDay ? 23 : 0,
        endOfDay ? 59 : 0,
        endOfDay ? 59 : 0
      ));

      return utcDate.getTime();
    } catch (error) {
      console.error('Error transforming date:', error, 'timestamp:', timestamp);
      return 0;
    }
  }

  private transformCFP(raw: RawDevelopersEventsCFP): CFP | null {
    try {
      const cfpEndDate = this.transformDate(raw.untilDate, true);
      const eventStartDate = this.transformDate(raw.conf.date[0], false);
      // If there's only one date, use it for both start and end
      const eventEndDate = this.transformDate(
        raw.conf.date.length > 1 ? raw.conf.date[1] : raw.conf.date[0],
        true
      );

      // Skip invalid CFPs
      if (!cfpEndDate || !eventStartDate || !eventEndDate) {
        console.warn('Skipping CFP due to invalid dates:', raw);
        return null;
      }

      return {
        id: `devents-${raw.conf.name}-${encodeURIComponent(raw.conf.location)}-${raw.untilDate}`,
        name: raw.conf.name,
        cfpUrl: raw.link,
        eventUrl: raw.conf.hyperlink,
        cfpEndDate,
        eventStartDate,
        eventEndDate,
        location: raw.conf.location,
        status: raw.conf.status as "open" | "closed",
        source: "developers-events",
        references: {
          "developers-events": raw.link,
        },
      };
    } catch (error) {
      console.error('Error transforming CFP:', error, 'raw:', raw);
      return null;
    }
  }

  public transformRawDataToCFPs(rawData: RawDevelopersEventsCFP[]): CFP[] {
    return (
      rawData
        // Transform each raw CFP to a CFP object
        .map((raw) => this.transformCFP(raw))
        // Filter out null values from invalid CFPs
        .filter((cfp): cfp is CFP => cfp !== null)
    );
  }
}
