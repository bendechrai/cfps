import { ICFPSource, CFPSourceConfig } from "./types";
import { CFP } from "../../utils/types";
import { DevelopersEventsCFPSource } from "./sources/developers-events";
import { JoindInCFPSource } from "./sources/joindin";
import { ConfsTechCFPSource } from "./sources/confs-tech";

import { PrismaClient, Prisma } from "@prisma/client";

export class CFPService {
  private static instance: CFPService;
  private sources: ICFPSource[] = [];
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient();
    this.initializeSources();
  }

  public static getInstance(): CFPService {
    if (!CFPService.instance) {
      CFPService.instance = new CFPService();
    }
    return CFPService.instance;
  }

  private initializeSources() {
    const developersEventsConfig: CFPSourceConfig = {
      enabled: true,
      url: "https://developers.events/all-cfps.json",
    };

    const joindInConfig: CFPSourceConfig = {
      enabled: true,
      url: "https://api.joind.in/v2.1/events?filter=cfp",
    };

    const confsTechConfig: CFPSourceConfig = {
      enabled: true,
      url: "https://29flvjv5x9-dsn.algolia.net/1/indexes/*/queries",
    };

    this.sources = [
      new DevelopersEventsCFPSource(developersEventsConfig),
      new JoindInCFPSource(joindInConfig),
      new ConfsTechCFPSource(confsTechConfig),
    ];
  }

  private async getCachedData<T>(sourceName: string): Promise<T[] | null> {
    const cacheEntry = await this.prisma.cFPCache.findFirst({
      where: {
        source: sourceName,
        fetchedAt: {
          // Only use cache less than 24 hours old
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        fetchedAt: "desc",
      },
    });

    return (cacheEntry?.rawData as T[]) || null;
  }

  private async cacheSourceData<T>(
    sourceName: string,
    data: T[]
  ): Promise<void> {
    await this.prisma.cFPCache.create({
      data: {
        source: sourceName,
        rawData: data as unknown as Prisma.InputJsonValue,
      },
    });
  }

  private async getSourceData<T>(source: ICFPSource<T>): Promise<T[]> {
    const sourceName = source.getName();

    try {
      // Check cache first
      const cachedData = await this.getCachedData<T>(sourceName);
      if (cachedData) {
        console.log(`Using cached data for ${sourceName}`);
        return cachedData;
      }

      // If no cache or stale, fetch fresh data
      console.log(`Fetching fresh data for ${sourceName}`);
      const freshData = await source.fetchRawData();

      // Cache the fresh data
      await this.cacheSourceData<T>(sourceName, freshData);

      return freshData;
    } catch (error) {
      console.error(`Error fetching data from ${sourceName}:`, error);
      // If fetch fails, try to use any cached data regardless of age
      const cachedData = await this.getCachedData<T>(sourceName);
      if (cachedData) {
        console.log(`Using stale cache for ${sourceName} due to fetch error`);
        return cachedData;
      }
      throw error;
    }
  }

  async fetchCFPs(): Promise<CFP[]> {
    try {
      // Fetch and transform data from all sources
      const allCFPs = await Promise.all(
        this.sources.map(async (source) => {
          const rawData = await this.getSourceData(source);
          return source.transformRawDataToCFPs(rawData);
        })
      );

      const currentTime = Date.now();

      // Combine all CFPs and sort by end date
      return (
        allCFPs
          // Flatten the array
          .flat()
          // Filter only CFPs that have an end date in the future
          .filter((cfp) => cfp.cfpEndDate > currentTime)
          // Sort by end date
          .sort((a, b) => a.cfpEndDate - b.cfpEndDate)
      );
    } catch (error) {
      console.error("Error fetching CFPs:", error);
      
      // Check if it's a rate limiting error (HTTP 429)
      if (error instanceof Response && error.status === 429) {
        throw new Error("Rate limit exceeded. Please wait a few seconds before trying again.");
      }
      
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
