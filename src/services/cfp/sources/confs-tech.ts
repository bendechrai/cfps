import { ICFPSource, RawConfsTechCFP, CFPSourceConfig } from "../types";
import { CFP } from "../../../utils/types";

export class ConfsTechCFPSource implements ICFPSource<RawConfsTechCFP> {
  private config: CFPSourceConfig;

  constructor(config: CFPSourceConfig) {
    this.config = config;
  }

  getName(): string {
    return "confs.tech";
  }

  async fetchRawData(): Promise<RawConfsTechCFP[]> {

    try {
      const response = await fetch(this.config.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-algolia-api-key": "f2534ea79a28d8469f4e81d546297d39",
          "x-algolia-application-id": "29FLVJV5X9",
        },
        body: JSON.stringify({
          requests: [
            {
              indexName: "prod_conferences",
              params: `facets=["continent","country","offersSignLanguageOrCC","topics"]&filters=startDateUnix>${Math.floor(
                Date.now() / 1000
              )} AND cfpEndDateUnix>${Math.floor(
                Date.now() / 1000
              )}&highlightPostTag=</ais-highlight-0000000000>&highlightPreTag=<ais-highlight-0000000000>&hitsPerPage=600&maxValuesPerFacet=100&page=0&query=&tagFilters=`,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch CFPs from confs.tech");
      }

      const data = await response.json();
      return data.results[0].hits;
    } catch (error) {
      console.error("Error fetching CFPs from confs.tech:", error);
      throw error; // Let CFPService handle the error
    }
  }

  private transformDate(dateStr: string, endOfDay: boolean = false): number {
    try {
      // Create a UTC date at either start or end of day
      const date = new Date(dateStr);
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
      console.error('Error transforming date:', error, 'date:', dateStr);
      return 0;
    }
  }

  private transformCFP(raw: RawConfsTechCFP): CFP | null {
    try {
      const location = raw.online
        ? "Online"
        : [raw.city, raw.country].filter(Boolean).join(", ");

      const cfpEndDate = this.transformDate(raw.cfpEndDate, true);
      const eventStartDate = this.transformDate(raw.startDate, false);
      const eventEndDate = this.transformDate(raw.endDate || raw.startDate, true);

      // Skip invalid CFPs
      if (!cfpEndDate || !eventStartDate || !eventEndDate) {
        console.warn('Skipping CFP due to invalid dates:', raw);
        return null;
      }

      return {
        id: `confstech-${raw.id}`,
        name: raw.name,
        cfpUrl: raw.cfpUrl,
        eventUrl: raw.url,
        cfpEndDate,
        eventStartDate,
        eventEndDate,
        location,
        status: "open", // confs.tech only returns open CFPs
        source: "confs.tech",
        references: {
          "confs.tech": raw.url,
        },
      };
    } catch (error) {
      console.error('Error transforming CFP:', error, 'raw:', raw);
      return null;
    }
  }

  public transformRawDataToCFPs(rawData: RawConfsTechCFP[]): CFP[] {
    return rawData
      .map((raw) => this.transformCFP(raw))
      .filter((cfp): cfp is CFP => cfp !== null);
  }
}
