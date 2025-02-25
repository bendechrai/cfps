import { CFP } from "@/utils/types";
import { JSDOM } from "jsdom";
import { CFPSourceConfig, ICFPSource, RawPaperCallCFP } from "../types";

export class PaperCallCFPSource implements ICFPSource<RawPaperCallCFP> {
  private config: CFPSourceConfig;

  constructor(config: CFPSourceConfig) {
    this.config = config;
  }

  getName(): string {
    return "papercall";
  }

  async fetchRawData(): Promise<RawPaperCallCFP[]> {
    try {
      const response = await fetch(this.config.url, {
        headers: {
          accept: "text/html",
          "user-agent": "Mozilla/5.0",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch PaperCall CFPs: ${response.status}`);
      }

      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      const cfps: RawPaperCallCFP[] = [];
      const eventPanels = document.querySelectorAll(".event-list-detail");

      eventPanels.forEach((panel) => {
        try {
          const titleEl = panel.querySelector(".event__title a:last-child");
          if (!titleEl) return;

          const name = titleEl.textContent?.trim() || "";
          const cfpUrl = titleEl.getAttribute("href")?.toString() || "";

          const eventUrlEl = panel.querySelector(
            ".panel-body h4 a[target='_blank']"
          );
          const eventUrl = eventUrlEl?.getAttribute("href") || "";

          const locationMatch = name.match(/- ([^-]+)$/);
          const location = locationMatch ? locationMatch[1].trim() : "Online";

          const eventDatesEl = panel.querySelector(
            ".panel-body h4:nth-child(2)"
          );
          const eventDatesText =
            eventDatesEl?.textContent
              ?.replace("Upcoming", "")
              .replace("Event Dates:", "")
              .trim() || "";

          // Split on comma and clean up each part
          const dateParts = eventDatesText
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

          // dateParts will be something like this:
          // ["May 22", "2025"]
          // or
          // ["May 22", "2025", "May 24", "2025"]
          const eventStartDate =
            dateParts.length >= 2 ? `${dateParts[0]} ${dateParts[1]}` : "";
          const eventEndDate =
            dateParts.length === 4 ? `${dateParts[2]} ${dateParts[3]}` : "";

          const cfpEndDateEl = panel.querySelector("time[datetime]");
          const cfpEndDate = cfpEndDateEl?.getAttribute("datetime") || "";

          const tagsEls = panel.querySelectorAll(".panel-body h4:last-child a");
          const tags = Array.from(tagsEls).map(
            (tag) => tag.textContent?.replace(/^tags: ?/i, "").trim() || ""
          );

          cfps.push({
            id: `papercall-${cfpUrl}`,
            name: name.replace(/- [^-]+$/, "").trim(), // Remove location from name
            eventUrl,
            cfpUrl,
            location,
            eventStartDate,
            eventEndDate,
            cfpEndDate,
            tags,
          });
        } catch (error) {
          console.error("Error parsing PaperCall CFP:", error);
        }
      });

      return cfps;
    } catch (error) {
      console.error("Error fetching PaperCall CFPs:", error);
      return [];
    }
  }

  private transformCFP(raw: RawPaperCallCFP): CFP | null {
    try {
      return {
        id: raw.id,
        name: raw.name,
        eventUrl: raw.eventUrl,
        cfpUrl: raw.cfpUrl,
        location: raw.location,
        status: "open",
        eventStartDate: new Date(raw.eventStartDate).getTime(),
        eventEndDate: new Date(raw.eventEndDate).getTime(),
        cfpEndDate: new Date(raw.cfpEndDate).getTime(),
        source: this.getName(),
        tags: raw.tags,
        references: {
          papercall: raw.cfpUrl,
        },
      };
    } catch (error) {
      console.error("Error transforming PaperCall CFP:", error, "raw:", raw);
      return null;
    }
  }

  public transformRawDataToCFPs(rawData: RawPaperCallCFP[]): CFP[] {
    return rawData
      .map((raw) => this.transformCFP(raw))
      .filter((cfp): cfp is CFP => cfp !== null);
  }
}
