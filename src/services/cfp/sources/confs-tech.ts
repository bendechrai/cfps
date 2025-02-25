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
    if (!this.config.enabled) return [];

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

  private transformCFP(raw: RawConfsTechCFP): CFP {
    const location = raw.online
      ? "Online"
      : [raw.city, raw.country].filter(Boolean).join(", ");

    return {
      id: `confstech-${raw.id}`,
      name: raw.name,
      cfpUrl: raw.cfpUrl,
      eventUrl: raw.url,
      cfpEndDate: new Date(raw.cfpEndDate).getTime(),
      eventStartDate: new Date(raw.startDate).getTime(),
      eventEndDate: new Date(raw.endDate).getTime(),
      location,
      status: "open", // confs.tech only returns open CFPs
      source: "confs.tech",
      references: {
        "confs.tech": raw.url,
      },
    };
  }

  public transformRawDataToCFPs(rawData: RawConfsTechCFP[]): CFP[] {
    return rawData.map((raw) => this.transformCFP(raw));
  }
}
