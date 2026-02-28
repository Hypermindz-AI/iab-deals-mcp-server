/**
 * IAB Deals MCP Server - Demo Data Seeding
 * Seeds realistic sample deals for demonstration
 */

import { createDeal, listDeals } from "./database.js";
import { AdType, PriceType } from "../models/index.js";

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
    },
    {
      description: "Premium CTV inventory for Q1 auto brand campaign targeting cord-cutters",
      inventory: {
        geoCountries: ["USA"],
        geoRegions: ["US-CA", "US-NY", "US-TX", "US-FL"],
        publisherIds: ["pub-hulu", "pub-peacock", "pub-paramount"],
        siteIds: [],
      },
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
      priceType: PriceType.FLOOR,
      startDate: new Date("2026-11-01T00:00:00Z").toISOString(),
      endDate: new Date("2026-12-31T23:59:59Z").toISOString(),
    },
    {
      description: "Multi-format PMP for holiday shopping season",
      inventory: {
        geoCountries: ["USA", "CAN"],
        geoRegions: [],
        publisherIds: ["pub-cnn", "pub-nyt", "pub-wapo"],
        siteIds: [],
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
    },
    {
      description: "Digital out-of-home network across major sports venues and stadiums",
      inventory: {
        geoCountries: ["USA"],
        geoRegions: [],
        publisherIds: ["pub-dooh-nfl", "pub-dooh-nba", "pub-dooh-mlb"],
        siteIds: ["venue-sofi", "venue-msg", "venue-att"],
      },
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
      priceType: PriceType.FLOOR,
      startDate: new Date("2026-01-15T00:00:00Z").toISOString(),
      endDate: new Date("2026-06-30T23:59:59Z").toISOString(),
    },
    {
      description: "Host-read and dynamic insertion across top-50 podcasts",
      inventory: {
        geoCountries: ["USA", "GBR", "AUS"],
        geoRegions: [],
        publisherIds: ["pub-spotify", "pub-iheartmedia", "pub-wondery"],
        siteIds: [],
      },
    }
  );

  // Deal 5: Gaming & Esports
  createDeal(
    "Gaming & Esports Sponsorship",
    "ads.gamingmedia.gg",
    "Esports Entertainment",
    [AdType.VIDEO, AdType.BANNER, AdType.NATIVE],
    {
      dealFloor: 18.0,
      currency: "USD",
      priceType: PriceType.FLOOR,
      startDate: new Date("2026-03-01T00:00:00Z").toISOString(),
      endDate: new Date("2026-08-31T23:59:59Z").toISOString(),
    },
    {
      description: "Reach gaming audiences across streams, tournaments, and gaming sites",
      inventory: {
        geoCountries: ["USA", "CAN", "GBR", "DEU", "KOR"],
        geoRegions: [],
        publisherIds: ["pub-twitch", "pub-youtube-gaming", "pub-ign"],
        siteIds: [],
      },
    }
  );

  console.error("Demo data seeded successfully.");
}
