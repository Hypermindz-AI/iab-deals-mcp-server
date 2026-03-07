import { describe, it, expect } from "vitest";
import {
  TermsSchema,
  TermsRequestSchema,
  InventorySchema,
  InventoryRequestSchema,
  DealSchema,
  DealCreateRequestSchema,
  BuyerSeatSchema,
  ProviderSchema,
} from "../../models/index.js";
import { AdType, PriceType, SellerStatus, BuyerStatus, ProviderType, AuthType } from "../../models/enums.js";

describe("TermsSchema", () => {
  const validTerms = {
    dealFloor: 10.0,
    currency: "USD",
    priceType: PriceType.FLOOR,
    startDate: "2026-01-01T00:00:00Z",
    endDate: null,
  };

  it("accepts valid terms", () => {
    const result = TermsSchema.parse(validTerms);
    expect(result.dealFloor).toBe(10.0);
    expect(result.currency).toBe("USD");
  });

  it("rejects negative dealFloor", () => {
    expect(() => TermsSchema.parse({ ...validTerms, dealFloor: -1 })).toThrow();
  });

  it("rejects invalid currency length", () => {
    expect(() => TermsSchema.parse({ ...validTerms, currency: "US" })).toThrow();
    expect(() => TermsSchema.parse({ ...validTerms, currency: "USDD" })).toThrow();
  });

  it("rejects invalid datetime format", () => {
    expect(() => TermsSchema.parse({ ...validTerms, startDate: "not-a-date" })).toThrow();
  });

  it("allows null endDate for evergreen deals", () => {
    const result = TermsSchema.parse(validTerms);
    expect(result.endDate).toBeNull();
  });
});

describe("TermsRequestSchema", () => {
  it("requires only dealFloor", () => {
    const result = TermsRequestSchema.parse({ dealFloor: 5.0 });
    expect(result.dealFloor).toBe(5.0);
  });

  it("rejects missing dealFloor", () => {
    expect(() => TermsRequestSchema.parse({})).toThrow();
  });
});

describe("InventorySchema", () => {
  it("accepts empty arrays (defaults)", () => {
    const result = InventorySchema.parse({});
    expect(result.geoCountries).toEqual([]);
    expect(result.geoRegions).toEqual([]);
    expect(result.publisherIds).toEqual([]);
    expect(result.siteIds).toEqual([]);
  });

  it("accepts populated arrays", () => {
    const result = InventorySchema.parse({
      geoCountries: ["USA", "GBR"],
      publisherIds: ["pub-1"],
    });
    expect(result.geoCountries).toEqual(["USA", "GBR"]);
    expect(result.publisherIds).toEqual(["pub-1"]);
  });

  it("rejects invalid country code length", () => {
    expect(() => InventorySchema.parse({ geoCountries: ["US"] })).toThrow();
  });
});

describe("InventoryRequestSchema", () => {
  it("allows all fields optional", () => {
    const result = InventoryRequestSchema.parse({});
    expect(result).toBeDefined();
  });
});

describe("DealSchema", () => {
  const validDeal = {
    id: "550e8400-e29b-41d4-a716-446655440000",
    externalDealId: "IAB-123",
    origin: "ads.test.com",
    name: "Test Deal",
    seller: "Test Seller",
    description: null,
    sellerStatus: SellerStatus.PENDING,
    adTypes: [AdType.BANNER],
    organizationId: "550e8400-e29b-41d4-a716-446655440001",
    terms: {
      dealFloor: 10.0,
      currency: "USD",
      priceType: PriceType.FLOOR,
      startDate: "2026-01-01T00:00:00Z",
      endDate: null,
    },
    inventory: null,
    buyerSeats: [],
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("accepts a valid deal", () => {
    const result = DealSchema.parse(validDeal);
    expect(result.name).toBe("Test Deal");
    expect(result.adTypes).toEqual([AdType.BANNER]);
  });

  it("rejects empty name", () => {
    expect(() => DealSchema.parse({ ...validDeal, name: "" })).toThrow();
  });

  it("rejects empty adTypes", () => {
    expect(() => DealSchema.parse({ ...validDeal, adTypes: [] })).toThrow();
  });

  it("rejects invalid UUID id", () => {
    expect(() => DealSchema.parse({ ...validDeal, id: "not-a-uuid" })).toThrow();
  });

  it("rejects description over 250 chars", () => {
    expect(() => DealSchema.parse({ ...validDeal, description: "x".repeat(251) })).toThrow();
  });
});

describe("DealCreateRequestSchema", () => {
  it("accepts minimal valid input", () => {
    const result = DealCreateRequestSchema.parse({
      name: "Test",
      origin: "ads.test.com",
      seller: "Seller",
      adTypes: [AdType.VIDEO],
      terms: { dealFloor: 5.0, startDate: "2026-01-01T00:00:00Z" },
    });
    expect(result.name).toBe("Test");
  });

  it("rejects missing required fields", () => {
    expect(() => DealCreateRequestSchema.parse({ name: "Test" })).toThrow();
  });
});

describe("BuyerSeatSchema", () => {
  const validSeat = {
    id: "550e8400-e29b-41d4-a716-446655440002",
    dealId: "550e8400-e29b-41d4-a716-446655440000",
    seatId: "SEAT-001",
    providerId: "mock",
    buyerStatus: BuyerStatus.PENDING,
    acceptedAt: null,
    rejectionReason: null,
    platformDealId: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  it("accepts valid buyer seat", () => {
    const result = BuyerSeatSchema.parse(validSeat);
    expect(result.seatId).toBe("SEAT-001");
    expect(result.buyerStatus).toBe(BuyerStatus.PENDING);
  });

  it("rejects invalid buyerStatus", () => {
    expect(() => BuyerSeatSchema.parse({ ...validSeat, buyerStatus: 99 })).toThrow();
  });
});

describe("ProviderSchema", () => {
  it("accepts valid provider", () => {
    const result = ProviderSchema.parse({
      id: "mock",
      name: "Mock Provider",
      type: ProviderType.DSP,
      apiEndpoint: null,
      authType: null,
      active: true,
    });
    expect(result.id).toBe("mock");
  });

  it("rejects invalid url for apiEndpoint", () => {
    expect(() =>
      ProviderSchema.parse({
        id: "test",
        name: "Test",
        type: ProviderType.DSP,
        apiEndpoint: "not-a-url",
        authType: null,
      })
    ).toThrow();
  });
});
