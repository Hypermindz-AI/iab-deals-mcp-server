/**
 * IAB Deals MCP Server - Demo Data Seeding
 * Seeds realistic sample deals for demonstration per IAB Deal Sync API v1.0
 */

import { createDeal, listDeals } from "./database.js";
import {
  AdType,
  PriceType,
  IncludedInventory,
  DynamicInventory,
  AuxData,
  PubCount,
  CurationFeeType,
  Guaranteed,
} from "../models/index.js";

/** Seed demo data if database is empty */
export function seedDemoData(): void {
  const existing = listDeals({ pageSize: 1 });
  if (existing.total > 0) {
    return; // Already has data
  }

  console.error("Seeding demo data...");

  // Deal 1: Q1 Premium CTV Campaign
  createDeal(
    "Q1 Premium CTV Campaign",
    "ads.autobrand.com",
    "AutoBrand Inc.",
    [AdType.VIDEO],
    {
      dealFloor: 35.0,
      currency: "USD",
      priceType: PriceType.FIXED,
      startDate: new Date("2026-01-01T00:00:00Z").toISOString(),
      endDate: new Date("2026-03-31T23:59:59Z").toISOString(),
      countries: ["USA"],
      guar: Guaranteed.GUARANTEED,
      units: 500000,
      totalCost: 17500.0,
      ext: null,
    },
    {
      description: "Premium CTV inventory for Q1 auto brand campaign targeting cord-cutters",
      inventory: {
        inclInventory: [IncludedInventory.CTV],
        deviceType: [],
        sellerIds: ["pub-hulu", "pub-peacock", "pub-paramount"],
        siteDomains: [],
        appBundles: [],
        cat: ["IAB2"],  // Automotive
        catTax: null,
        ext: null,
      },
      dInventory: DynamicInventory.STATIC,
      auxData: AuxData.DEAL_ID_AND_SEAT,
      pubCount: PubCount.MULTIPLE_KNOWN,
    }
  );

  // Deal 2: Holiday Retail PMP
  createDeal(
    "Holiday Retail PMP 2026",
    "ads.retailgiant.com",
    "Retail Giant Corp",
    [AdType.BANNER, AdType.VIDEO, AdType.NATIVE],
    {
      dealFloor: 12.5,
      currency: "USD",
      priceType: PriceType.FIRST_PRICE,
      startDate: new Date("2026-11-01T00:00:00Z").toISOString(),
      endDate: new Date("2026-12-31T23:59:59Z").toISOString(),
      countries: ["USA", "CAN"],
      guar: null,
      units: null,
      totalCost: null,
      ext: null,
    },
    {
      description: "Multi-format PMP for holiday shopping season",
      inventory: {
        inclInventory: [IncludedInventory.SITE],
        deviceType: [],
        sellerIds: ["pub-cnn", "pub-nyt", "pub-wapo"],
        siteDomains: ["cnn.com", "nytimes.com", "washingtonpost.com"],
        appBundles: [],
        cat: ["IAB22"],  // Shopping
        catTax: null,
        ext: null,
      },
    }
  );

  // Deal 3: DOOH Sports Venue
  createDeal(
    "DOOH Sports Venue Network",
    "ads.sportvenues.net",
    "Stadium Media Group",
    [AdType.VIDEO, AdType.BANNER],
    {
      dealFloor: 45.0,
      currency: "USD",
      priceType: PriceType.FIXED,
      startDate: new Date("2026-02-01T00:00:00Z").toISOString(),
      endDate: null, // Evergreen
      countries: ["USA"],
      guar: null,
      units: null,
      totalCost: null,
      ext: null,
    },
    {
      description: "Digital out-of-home network across major sports venues and stadiums",
      inventory: {
        inclInventory: [IncludedInventory.DOOH],
        deviceType: [],
        sellerIds: ["pub-dooh-nfl", "pub-dooh-nba", "pub-dooh-mlb"],
        siteDomains: [],
        appBundles: [],
        cat: ["IAB17"],  // Sports
        catTax: null,
        ext: null,
      },
      dInventory: DynamicInventory.DYNAMIC_ADDITION,
    }
  );

  // Deal 4: Podcast Audio Campaign
  createDeal(
    "Premium Podcast Network",
    "ads.podcastnetwork.io",
    "Audio Media Partners",
    [AdType.AUDIO],
    {
      dealFloor: 25.0,
      currency: "USD",
      priceType: PriceType.SECOND_PRICE_PLUS,
      startDate: new Date("2026-01-15T00:00:00Z").toISOString(),
      endDate: new Date("2026-06-30T23:59:59Z").toISOString(),
      countries: ["USA", "GBR", "AUS"],
      guar: null,
      units: null,
      totalCost: null,
      ext: null,
    },
    {
      description: "Host-read and dynamic insertion across top-50 podcasts",
      inventory: {
        inclInventory: [IncludedInventory.AUDIO],
        deviceType: [],
        sellerIds: ["pub-spotify", "pub-iheartmedia", "pub-wondery"],
        siteDomains: [],
        appBundles: [],
        cat: ["IAB1"],  // Arts & Entertainment
        catTax: null,
        ext: null,
      },
    }
  );

  // Deal 5: Gaming & Esports (with curation and wseat)
  createDeal(
    "Gaming & Esports Sponsorship",
    "ads.gamingmedia.gg",
    "Esports Entertainment",
    [AdType.VIDEO, AdType.BANNER, AdType.NATIVE],
    {
      dealFloor: 18.0,
      currency: "USD",
      priceType: PriceType.SECOND_PRICE_PLUS,
      startDate: new Date("2026-03-01T00:00:00Z").toISOString(),
      endDate: new Date("2026-08-31T23:59:59Z").toISOString(),
      countries: ["USA", "CAN", "GBR", "DEU", "KOR"],
      guar: Guaranteed.NON_GUARANTEED,
      units: null,
      totalCost: null,
      ext: null,
    },
    {
      description: "Reach gaming audiences across streams, tournaments, and gaming sites",
      inventory: {
        inclInventory: [IncludedInventory.SITE, IncludedInventory.APP],
        deviceType: [],
        sellerIds: ["pub-twitch", "pub-youtube-gaming", "pub-ign"],
        siteDomains: ["twitch.tv", "ign.com"],
        appBundles: [],
        cat: ["IAB9"],  // Hobbies & Interests (Gaming)
        catTax: null,
        ext: null,
      },
      wseat: ["seat-activision", "seat-ea", "seat-riot"],
      auxData: AuxData.FULL_BID_REQUEST,
      pubCount: PubCount.MULTIPLE_KNOWN,
      curation: {
        curator: "GameStack Curation",
        cdealId: "GS-ESPORTS-2026",
        curFeeType: CurationFeeType.PERCENT_MEDIA,
        ext: null,
      },
    }
  );

  console.error("Demo data seeded successfully.");
}
