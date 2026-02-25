import { CFP } from "@/utils/types";
import { prisma } from "@/lib/prisma";
import { AdatoSystemsCFPSource } from "./sources/adatosystems";
import { ConfsTechCFPSource } from "./sources/confs-tech";
import { DevelopersEventsCFPSource } from "./sources/developers-events";
import { JoindInCFPSource } from "./sources/joindin";
import { PaperCallCFPSource } from "./sources/papercall";
import { CFPSourceConfig, ICFPSource } from "./types";
import { Prisma } from "@prisma/client";

export class CFPService {
  private static instance: CFPService;
  private _sources: ICFPSource[] = [];

  private constructor() {
    this.initializeSources();
  }

  public static getInstance(): CFPService {
    if (!CFPService.instance) {
      CFPService.instance = new CFPService();
    }
    return CFPService.instance;
  }

  public get sources(): ICFPSource[] {
    return this._sources;
  }

  public getSourceByName(name: string): ICFPSource | undefined {
    return this._sources.find(source => source.getName() === name);
  }

  private initializeSources() {
    const adatoSystemsConfig: CFPSourceConfig = {
      url: "https://adatosystems.com/cfp-tracker/",
    };

    const confsTechConfig: CFPSourceConfig = {
      url: "https://29flvjv5x9-dsn.algolia.net/1/indexes/*/queries",
    };

    const developersEventsConfig: CFPSourceConfig = {
      url: "https://developers.events/all-cfps.json",
    };

    const joindInConfig: CFPSourceConfig = {
      url: "https://api.joind.in/v2.1/events?filter=cfp",
    };

    const paperCallConfig: CFPSourceConfig = {
      url: "https://papercall.io/events?cfps-scope=open&keywords=",
    };

    this._sources = [
      new AdatoSystemsCFPSource(adatoSystemsConfig),
      new ConfsTechCFPSource(confsTechConfig),
      new DevelopersEventsCFPSource(developersEventsConfig),
      new JoindInCFPSource(joindInConfig),
      new PaperCallCFPSource(paperCallConfig),
    ];
  }

  private async getCachedData<T>(sourceName: string): Promise<T[] | null> {
    const cacheEntry = await prisma.cFPCache.findFirst({
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
    await prisma.cFPCache.create({
      data: {
        source: sourceName,
        rawData: data as Prisma.InputJsonValue,
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
      return []; // Return empty array instead of throwing to allow other sources to continue
    }
  }

  async fetchCFPs(): Promise<CFP[]> {
    // Fetch and transform data from all sources, handling failures individually
    const results = await Promise.allSettled(
      this.sources.map(async (source) => {
        try {
          const rawData = await this.getSourceData(source);
          return source.transformRawDataToCFPs(rawData);
        } catch (error) {
          console.error(`Error fetching CFPs from ${source.getName()}:`, error);
          return [];
        }
      })
    );

    // Collect successful results
    const allCFPs = results
      .filter((result): result is PromiseFulfilledResult<CFP[]> => result.status === 'fulfilled')
      .map(result => result.value)
      .flat();

    const currentTime = Date.now();

    // If we got no CFPs at all, something is seriously wrong
    if (allCFPs.length === 0) {
      throw new Error("Failed to load CFPs from any source. Please try again later.");
    }

    // Return valid CFPs sorted by end date
    return allCFPs
      .filter((cfp) => cfp.cfpEndDate > currentTime)
      .filter((cfp) => cfp.eventEndDate > currentTime)
      .sort((a, b) => a.cfpEndDate - b.cfpEndDate);
  }

  
}
