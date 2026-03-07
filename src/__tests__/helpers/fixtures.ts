/**
 * Test data factories for deal inputs.
 */

import { AdType, PriceType } from "../../models/index.js";
import type { DealsCreateInput } from "../../tools/index.js";

/** Minimal valid deal input */
export function minimalDealInput(overrides?: Partial<DealsCreateInput>): DealsCreateInput {
  return {
    name: "Test Deal",
    origin: "ads.test.com",
    seller: "Test Seller",
    adTypes: [AdType.BANNER],
    dealFloor: 10.0,
    currency: "USD",
    priceType: PriceType.FLOOR,
    startDate: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

/** Full deal input with all optional fields */
export function fullDealInput(overrides?: Partial<DealsCreateInput>): DealsCreateInput {
  return {
    name: "Premium Video Campaign",
    origin: "ads.premium.com",
    seller: "Premium Corp",
    description: "Multi-format premium campaign",
    adTypes: [AdType.VIDEO, AdType.BANNER, AdType.NATIVE],
    dealFloor: 25.5,
    currency: "EUR",
    priceType: PriceType.FIXED,
    startDate: "2026-03-01T00:00:00Z",
    endDate: "2026-06-30T23:59:59Z",
    geoCountries: ["USA", "GBR"],
    geoRegions: ["US-CA", "US-NY"],
    ...overrides,
  };
}
