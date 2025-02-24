import { ICFPSource, CFPSourceConfig } from "./types";
import { CFP } from "../../utils/types";
import { DevelopersEventsCFPSource } from "./sources/developers-events";
import { JoindInCFPSource } from "./sources/joindin";

export class CFPService {
  private static instance: CFPService;
  private sources: ICFPSource[] = [];

  private constructor() {
    this.initializeSources();
  }

  public static getInstance(): CFPService {
    if (!CFPService.instance) {
      CFPService.instance = new CFPService();
    }
    return CFPService.instance;
  }

  private initializeSources() {
    // In the future, this could be loaded from configuration or environment variables
    const developersEventsConfig: CFPSourceConfig = {
      enabled: true,
      url: "https://developers.events/all-cfps.json",
    };

    const joindInConfig: CFPSourceConfig = {
      enabled: true,
      url: "https://api.joind.in/v2.1/events",
    };

    this.sources = [
      new DevelopersEventsCFPSource(developersEventsConfig),
      new JoindInCFPSource(joindInConfig),
    ];
  }

  async fetchCFPs(): Promise<CFP[]> {
    try {
      // Fetch from all sources in parallel
      const allCFPs = await Promise.all(
        this.sources.map(source => source.fetchCFPs())
      );

      const currentTime = new Date().getTime();

      // Combine and filter CFPs
      return allCFPs
        .flat()
        .filter(cfp => cfp.cfpEndDate > currentTime)
        .sort((a, b) => a.cfpEndDate - b.cfpEndDate);
    } catch (error) {
      console.error("Error fetching CFPs:", error);
      throw new Error("Failed to load CFPs. Please try again later.");
    }
  }

  public formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
}
