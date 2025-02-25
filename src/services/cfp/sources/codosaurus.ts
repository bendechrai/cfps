import { CFP } from "@/utils/types";
import { JSDOM } from "jsdom";
import { CFPSourceConfig, ICFPSource } from "../types";

export interface RawCodosaurusCFP {
  name: string;
  eventUrl: string;
  cfpUrl: string;
  location: string;
  cfpEndDate: string;
  eventStartDate: string;
  eventEndDate: string;
}

export class CodosaurusCFPSource implements ICFPSource<RawCodosaurusCFP> {
  private config: CFPSourceConfig;

  constructor(config: CFPSourceConfig) {
    this.config = config;
  }

  getName(): string {
    return "codosaurus";
  }

  async fetchRawData(): Promise<RawCodosaurusCFP[]> {
    if (!this.config.enabled) return [];

    try {
      const response = await fetch(this.config.url);
      if (!response.ok) throw new Error("Failed to fetch CFPs from Codosaurus");
      const html = await response.text();

      const dom = new JSDOM(html);
      const document = dom.window.document;

      const table = document.querySelector("table");
      if (!table) return [];

      const rows = table.querySelectorAll("tr");
      // Skip header row
      const dataRows = Array.from(rows).slice(1);

      return dataRows.map((row) => {
        const cells = row.querySelectorAll("td");
        const [
          name,
          eventUrlCell,
          location,
          cfpEndDate,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          cfpEndDateEstimated,
          eventDate,
          cfpUrlCell,
        ] = Array.from(cells);

        // Extract URLs from anchor tags
        const eventUrl =
          eventUrlCell.querySelector("a")?.getAttribute("href") || "";
        const cfpUrl =
          cfpUrlCell.querySelector("a")?.getAttribute("href") || "";

        // Parse dates
        const eventStartDate = this.parseEventDate(
          eventDate.textContent?.trim() || ""
        );

        return {
          name: name.textContent?.trim() || "",
          eventUrl,
          cfpUrl,
          location: location.textContent?.trim() || "",
          cfpEndDate: this.parseEventDate(cfpEndDate.textContent?.trim() || ""),
          eventStartDate,
          eventEndDate: eventStartDate,
        };
      });
    } catch (error) {
      console.error("Error fetching CFPs from Codosaurus:", error);
      throw error;
    }
  }

  private parseEventDate(dateStr: string): string {
    // Input format: MM-DD
    // Year is current year, unless that would create a date in the past,
    // in which case, year is one year in the future
    const [month, day] = dateStr.trim().split("-");
    const now = new Date();
    let year = now.getFullYear();
    if (now > new Date(`${year}-${month}-${day}`)) {
      year += 1;
    }
    return `${year}-${month}-${day}`;
  }

  private transformCFP(raw: RawCodosaurusCFP): CFP {
    return {
      id: `codosaurus-${raw.eventUrl}`,
      name: raw.name,
      cfpUrl: raw.cfpUrl,
      eventUrl: raw.eventUrl,
      cfpEndDate: new Date(`${raw.cfpEndDate}T23:59:59Z`).getTime(),
      eventStartDate: new Date(`${raw.eventStartDate}T00:00:00Z`).getTime(),
      eventEndDate: new Date(`${raw.eventEndDate}T23:59:59Z`).getTime(),
      location: raw.location,
      status: "open",
      source: "codosaurus",
      references: {
        codosaurus: raw.eventUrl,
      },
    };
  }

  public transformRawDataToCFPs(rawData: RawCodosaurusCFP[]): CFP[] {
    return rawData
      .filter((raw) => raw.eventUrl && raw.cfpUrl) // Only include entries with valid URLs
      .map((raw) => this.transformCFP(raw));
  }
}
