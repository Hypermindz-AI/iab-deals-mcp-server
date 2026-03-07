import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { initTestDb, cleanupTestDb } from "../helpers/setup.js";
import {
  createDeal,
  getDealById,
  getDealByExternalId,
  listDeals,
  updateDeal,
  updateDealStatus,
  createBuyerSeat,
  getBuyerSeatById,
  getBuyerSeatsForDeal,
  updateBuyerSeatStatus,
} from "../../db/database.js";
import { SellerStatus, BuyerStatus, AdType, PriceType } from "../../models/enums.js";

beforeAll(() => initTestDb());
afterAll(() => cleanupTestDb());

describe("createDeal / getDealById", () => {
  it("creates a deal and retrieves it by id", () => {
    const deal = createDeal(
      "Test Deal",
      "ads.test.com",
      "Test Seller",
      [AdType.BANNER],
      {
        dealFloor: 10.0,
        currency: "USD",
        priceType: PriceType.FLOOR,
        startDate: "2026-01-01T00:00:00Z",
        endDate: null,
      }
    );

    expect(deal.id).toBeDefined();
    expect(deal.name).toBe("Test Deal");
    expect(deal.origin).toBe("ads.test.com");
    expect(deal.seller).toBe("Test Seller");
    expect(deal.sellerStatus).toBe(SellerStatus.PENDING);
    expect(deal.adTypes).toEqual([AdType.BANNER]);
    expect(deal.terms.dealFloor).toBe(10.0);
    expect(deal.terms.currency).toBe("USD");
    expect(deal.externalDealId).toMatch(/^IAB-/);
    expect(deal.createdAt).toBeDefined();
    expect(deal.updatedAt).toBeDefined();

    const fetched = getDealById(deal.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(deal.id);
    expect(fetched!.name).toBe("Test Deal");
  });

  it("returns null for non-existent id", () => {
    expect(getDealById("00000000-0000-0000-0000-000000000000")).toBeNull();
  });

  it("creates a deal with inventory", () => {
    const deal = createDeal(
      "Deal With Inventory",
      "ads.inv.com",
      "Inv Seller",
      [AdType.VIDEO],
      {
        dealFloor: 20.0,
        currency: "EUR",
        priceType: PriceType.FIXED,
        startDate: "2026-03-01T00:00:00Z",
        endDate: "2026-06-30T23:59:59Z",
      },
      {
        description: "Test with inventory",
        inventory: {
          geoCountries: ["USA", "GBR"],
          geoRegions: ["US-CA"],
          publisherIds: ["pub-1"],
          siteIds: ["site-1"],
        },
      }
    );

    expect(deal.description).toBe("Test with inventory");
    expect(deal.inventory).not.toBeNull();
    expect(deal.inventory!.geoCountries).toEqual(["USA", "GBR"]);
    expect(deal.inventory!.geoRegions).toEqual(["US-CA"]);
    expect(deal.inventory!.publisherIds).toEqual(["pub-1"]);
    expect(deal.inventory!.siteIds).toEqual(["site-1"]);
  });
});

describe("getDealByExternalId", () => {
  it("finds deal by external id", () => {
    const deal = createDeal(
      "External ID Test",
      "ads.ext.com",
      "Ext Seller",
      [AdType.AUDIO],
      {
        dealFloor: 5.0,
        currency: "USD",
        priceType: PriceType.FLOOR,
        startDate: "2026-01-01T00:00:00Z",
        endDate: null,
      }
    );

    const fetched = getDealByExternalId(deal.externalDealId);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(deal.id);
  });

  it("returns null for non-existent external id", () => {
    expect(getDealByExternalId("IAB-NONEXISTENT")).toBeNull();
  });
});

describe("listDeals", () => {
  it("lists all deals", () => {
    const result = listDeals();
    expect(result.deals.length).toBeGreaterThanOrEqual(3);
    expect(result.total).toBeGreaterThanOrEqual(3);
  });

  it("filters by status", () => {
    const result = listDeals({ status: SellerStatus.PENDING });
    for (const deal of result.deals) {
      expect(deal.sellerStatus).toBe(SellerStatus.PENDING);
    }
  });

  it("paginates results", () => {
    const page1 = listDeals({ page: 1, pageSize: 2 });
    expect(page1.deals.length).toBeLessThanOrEqual(2);

    const page2 = listDeals({ page: 2, pageSize: 2 });
    if (page1.total > 2) {
      expect(page2.deals.length).toBeGreaterThanOrEqual(1);
      // Pages should have different deals
      const ids1 = page1.deals.map((d) => d.id);
      for (const d of page2.deals) {
        expect(ids1).not.toContain(d.id);
      }
    }
  });
});

describe("updateDeal", () => {
  it("updates deal name", () => {
    const deal = createDeal("Before Update", "ads.up.com", "Seller", [AdType.BANNER], {
      dealFloor: 8.0,
      currency: "USD",
      priceType: PriceType.FLOOR,
      startDate: "2026-01-01T00:00:00Z",
      endDate: null,
    });

    const updated = updateDeal(deal.id, { name: "After Update" });
    expect(updated).not.toBeNull();
    expect(updated!.name).toBe("After Update");
    expect(updated!.updatedAt).toBeDefined();
  });

  it("updates deal terms", () => {
    const deal = createDeal("Terms Update", "ads.tu.com", "Seller", [AdType.VIDEO], {
      dealFloor: 10.0,
      currency: "USD",
      priceType: PriceType.FLOOR,
      startDate: "2026-01-01T00:00:00Z",
      endDate: null,
    });

    const updated = updateDeal(deal.id, { terms: { dealFloor: 15.0, currency: "EUR" } });
    expect(updated!.terms.dealFloor).toBe(15.0);
    expect(updated!.terms.currency).toBe("EUR");
  });

  it("updates adTypes", () => {
    const deal = createDeal("AdTypes Update", "ads.at.com", "Seller", [AdType.BANNER], {
      dealFloor: 10.0,
      currency: "USD",
      priceType: PriceType.FLOOR,
      startDate: "2026-01-01T00:00:00Z",
      endDate: null,
    });

    const updated = updateDeal(deal.id, { adTypes: [AdType.VIDEO, AdType.NATIVE] });
    expect(updated!.adTypes).toEqual([AdType.VIDEO, AdType.NATIVE]);
  });
});

describe("updateDealStatus", () => {
  it("changes seller status", () => {
    const deal = createDeal("Status Test", "ads.st.com", "Seller", [AdType.BANNER], {
      dealFloor: 10.0,
      currency: "USD",
      priceType: PriceType.FLOOR,
      startDate: "2026-01-01T00:00:00Z",
      endDate: null,
    });

    expect(deal.sellerStatus).toBe(SellerStatus.PENDING);

    const updated = updateDealStatus(deal.id, SellerStatus.ACTIVE, "test", "Activated");
    expect(updated).not.toBeNull();
    expect(updated!.sellerStatus).toBe(SellerStatus.ACTIVE);
  });

  it("returns null for non-existent deal", () => {
    expect(updateDealStatus("00000000-0000-0000-0000-000000000000", SellerStatus.ACTIVE, "test")).toBeNull();
  });
});

describe("Buyer Seat operations", () => {
  it("creates and retrieves a buyer seat", () => {
    const deal = createDeal("Seat Test", "ads.bs.com", "Seller", [AdType.BANNER], {
      dealFloor: 10.0,
      currency: "USD",
      priceType: PriceType.FLOOR,
      startDate: "2026-01-01T00:00:00Z",
      endDate: null,
    });

    const seat = createBuyerSeat(deal.id, "SEAT-001", "mock");
    expect(seat.id).toBeDefined();
    expect(seat.dealId).toBe(deal.id);
    expect(seat.seatId).toBe("SEAT-001");
    expect(seat.providerId).toBe("mock");
    expect(seat.buyerStatus).toBe(BuyerStatus.PENDING);

    const fetched = getBuyerSeatById(seat.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.id).toBe(seat.id);
  });

  it("lists buyer seats for a deal", () => {
    const deal = createDeal("Multi Seat", "ads.ms.com", "Seller", [AdType.BANNER], {
      dealFloor: 10.0,
      currency: "USD",
      priceType: PriceType.FLOOR,
      startDate: "2026-01-01T00:00:00Z",
      endDate: null,
    });

    createBuyerSeat(deal.id, "SEAT-A", "mock");
    createBuyerSeat(deal.id, "SEAT-B", "mock");

    const seats = getBuyerSeatsForDeal(deal.id);
    expect(seats.length).toBe(2);
    expect(seats.map((s) => s.seatId).sort()).toEqual(["SEAT-A", "SEAT-B"]);
  });

  it("updates buyer seat status to accepted", () => {
    const deal = createDeal("Accept Test", "ads.ac.com", "Seller", [AdType.BANNER], {
      dealFloor: 10.0,
      currency: "USD",
      priceType: PriceType.FLOOR,
      startDate: "2026-01-01T00:00:00Z",
      endDate: null,
    });

    const seat = createBuyerSeat(deal.id, "SEAT-ACC", "mock");
    const updated = updateBuyerSeatStatus(seat.id, BuyerStatus.ACCEPTED, {
      platformDealId: "MOCK-123",
    });

    expect(updated!.buyerStatus).toBe(BuyerStatus.ACCEPTED);
    expect(updated!.platformDealId).toBe("MOCK-123");
    expect(updated!.acceptedAt).not.toBeNull();
  });

  it("updates buyer seat status to rejected with reason", () => {
    const deal = createDeal("Reject Test", "ads.rj.com", "Seller", [AdType.BANNER], {
      dealFloor: 10.0,
      currency: "USD",
      priceType: PriceType.FLOOR,
      startDate: "2026-01-01T00:00:00Z",
      endDate: null,
    });

    const seat = createBuyerSeat(deal.id, "SEAT-REJ", "mock");
    const updated = updateBuyerSeatStatus(seat.id, BuyerStatus.REJECTED, {
      rejectionReason: "Floor too high",
    });

    expect(updated!.buyerStatus).toBe(BuyerStatus.REJECTED);
    expect(updated!.rejectionReason).toBe("Floor too high");
  });
});
