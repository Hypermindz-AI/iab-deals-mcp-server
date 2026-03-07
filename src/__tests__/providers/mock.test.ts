import { describe, it, expect, vi, afterEach } from "vitest";
import { MockProvider } from "../../providers/mock.js";
import { SellerStatus, BuyerStatus, AdType, PriceType } from "../../models/enums.js";
import type { Deal, BuyerSeat } from "../../models/index.js";

/** Create a minimal Deal object for provider tests */
function makeDeal(overrides?: Partial<Deal>): Deal {
  return {
    id: "550e8400-e29b-41d4-a716-446655440000",
    externalDealId: "IAB-TEST-001",
    origin: "ads.test.com",
    name: "Test Deal",
    seller: "Test Seller",
    description: null,
    sellerStatus: SellerStatus.ACTIVE,
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
    ...overrides,
  };
}

/** Create a minimal BuyerSeat object */
function makeBuyerSeat(overrides?: Partial<BuyerSeat>): BuyerSeat {
  return {
    id: "660e8400-e29b-41d4-a716-446655440000",
    dealId: "550e8400-e29b-41d4-a716-446655440000",
    seatId: "SEAT-001",
    providerId: "mock",
    buyerStatus: BuyerStatus.ACCEPTED,
    acceptedAt: "2026-01-01T00:00:00Z",
    rejectionReason: null,
    platformDealId: "MOCK-PLAT-001",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("MockProvider", () => {
  const provider = new MockProvider();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("has correct id and name", () => {
    expect(provider.id).toBe("mock");
    expect(provider.name).toBe("Mock Provider (Demo)");
  });

  it("is always available", () => {
    expect(provider.isAvailable()).toBe(true);
  });

  describe("sendDeal", () => {
    it("accepts deal when random < 0.9", async () => {
      vi.spyOn(Math, "random").mockReturnValue(0.5);

      const result = await provider.sendDeal(makeDeal(), "SEAT-001");
      expect(result.success).toBe(true);
      expect(result.providerId).toBe("mock");
      expect(result.status).toBe("pending_approval");
      expect(result.platformDealId).toBeTruthy();
      expect(result.platformDealId).toMatch(/^MOCK-/);
    });

    it("rejects deal when random >= 0.9", async () => {
      vi.spyOn(Math, "random").mockReturnValue(0.95);

      const result = await provider.sendDeal(makeDeal(), "SEAT-001");
      expect(result.success).toBe(false);
      expect(result.status).toBe("rejected");
      expect(result.platformDealId).toBeNull();
      expect(result.message).toContain("rejected");
    });
  });

  describe("checkStatus", () => {
    it("returns a status response", async () => {
      const result = await provider.checkStatus(makeDeal(), makeBuyerSeat());
      expect(result.success).toBe(true);
      expect(result.providerId).toBe("mock");
      expect(["pending", "approved", "active"]).toContain(result.status);
    });
  });

  describe("pauseDeal", () => {
    it("returns success with paused status", async () => {
      const result = await provider.pauseDeal(makeDeal(), makeBuyerSeat());
      expect(result.success).toBe(true);
      expect(result.status).toBe("paused");
      expect(result.message).toContain("paused");
    });
  });

  describe("resumeDeal", () => {
    it("returns success with active status", async () => {
      const result = await provider.resumeDeal(makeDeal(), makeBuyerSeat());
      expect(result.success).toBe(true);
      expect(result.status).toBe("active");
      expect(result.message).toContain("resumed");
    });
  });
});
