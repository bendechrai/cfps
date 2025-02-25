import { JSDOM } from "jsdom";
import { ICFPSource, CFPSourceConfig } from "../types";
import { CFP } from "@/utils/types";

export interface RawAdatoSystemsCFP {
  name: string;
  eventUrl: string;
  cfpUrl: string;
  location: string;
  cfpEndDate: string;
  eventStartDate: string;
  eventEndDate: string;
}

export class AdatoSystemsCFPSource implements ICFPSource<RawAdatoSystemsCFP> {
  private config: CFPSourceConfig;

  constructor(config: CFPSourceConfig) {
    this.config = config;
  }

  getName(): string {
    return "adatosystems";
  }

  async fetchRawData(): Promise<RawAdatoSystemsCFP[]> {

    try {
      const response = await fetch(this.config.url);
      if (!response.ok) throw new Error("Failed to fetch CFPs from AdatoSystems");
      const html = await response.text();

      const dom = new JSDOM(html);
      const document = dom.window.document;

      // Find the first table in the document
      const table = document.querySelector("table");
      if (!table) return [];

      const rows = table.querySelectorAll("tr");
      // Skip header row
      const dataRows = Array.from(rows).slice(1);

      return dataRows.map((row) => {
        const cells = row.querySelectorAll("td");
        const [
          name,
          city,
          country,
          eventStartDate,
          eventEndDate,
          cfpEndDate,
          eventUrlCell,
          cfpUrlCell,
        ] = Array.from(cells);

        // Extract URLs from anchor tags
        const eventUrl =
          eventUrlCell.querySelector("a")?.getAttribute("href") || "";
        const cfpUrl =
          cfpUrlCell.querySelector("a")?.getAttribute("href") || "";

        // Combine city and country for location
        const location = [city.textContent?.trim(), country.textContent?.trim()]
          .filter(Boolean)
          .join(", ");

        return {
          name: name.textContent?.trim() || "",
          eventUrl,
          cfpUrl,
          location,
          cfpEndDate: cfpEndDate.textContent?.trim() || "",
          eventStartDate: eventStartDate.textContent?.trim() || "",
          eventEndDate: eventEndDate.textContent?.trim() || "",
        };
      });
    } catch (error) {
      console.error("Error fetching CFPs from AdatoSystems:", error);
      throw error;
    }
  }

  private transformCFP(raw: RawAdatoSystemsCFP): CFP {
    return {
      id: `adatosystems-${raw.eventUrl}`,
      name: raw.name,
      cfpUrl: raw.cfpUrl,
      eventUrl: raw.eventUrl,
      cfpEndDate: new Date(`${raw.cfpEndDate}T23:59:59Z`).getTime(),
      eventStartDate: new Date(`${raw.eventStartDate}T00:00:00Z`).getTime(),
      eventEndDate: new Date(`${raw.eventEndDate}T23:59:59Z`).getTime(),
      location: raw.location,
      status: "open",
      source: "adatosystems",
      references: {
        adatosystems: raw.eventUrl,
      },
    };
  }

  public transformRawDataToCFPs(rawData: RawAdatoSystemsCFP[]): CFP[] {
    return rawData
      .filter((raw) => raw.eventUrl && raw.cfpUrl) // Only include entries with valid URLs
      .map((raw) => this.transformCFP(raw));
  }
}
