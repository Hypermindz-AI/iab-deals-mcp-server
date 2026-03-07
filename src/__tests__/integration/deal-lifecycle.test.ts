/**
 * Integration test: Full deal lifecycle
 * create → update → list → send → status → confirm → pause → resume
 */

import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { initTestDb, cleanupTestDb } from "../helpers/setup.js";
import { minimalDealInput } from "../helpers/fixtures.js";
import {
  dealsCreate,
  dealsUpdate,
  dealsSend,
  dealsConfirm,
  dealsStatus,
  dealsList,
  dealsPause,
  dealsResume,
} from "../../tools/index.js";
import { SellerStatus, AdType, PriceType } from "../../models/enums.js";

beforeAll(() => initTestDb());
afterAll(() => cleanupTestDb());

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Full deal lifecycle", () => {
  let dealId: string;

  it("Step 1: Create deal", () => {
    const result = dealsCreate(
      minimalDealInput({
        name: "Lifecycle Test Deal",
        adTypes: [AdType.VIDEO, AdType.BANNER],
        dealFloor: 15.0,
        priceType: PriceType.FIXED,
        startDate: "2026-03-01T00:00:00Z",
        endDate: "2026-06-30T23:59:59Z",
      })
    );

    expect(result.success).toBe(true);
    expect(result.deal).toBeDefined();
    dealId = result.deal!.id;

    expect(result.deal!.name).toBe("Lifecycle Test Deal");
    expect(result.deal!.sellerStatus).toBe(SellerStatus.PENDING);
    expect(result.deal!.adTypes).toEqual([AdType.VIDEO, AdType.BANNER]);
    expect(result.deal!.terms.dealFloor).toBe(15.0);
    expect(result.deal!.terms.priceType).toBe(PriceType.FIXED);
    expect(result.deal!.buyerSeats).toEqual([]);
  });

  it("Step 2: Update deal", () => {
    const result = dealsUpdate({
      id: dealId,
      name: "Lifecycle Test Deal (Updated)",
      description: "Updated description",
      dealFloor: 18.0,
    });

    expect(result.success).toBe(true);
    expect(result.deal!.name).toBe("Lifecycle Test Deal (Updated)");
    expect(result.deal!.description).toBe("Updated description");
    expect(result.deal!.terms.dealFloor).toBe(18.0);
    // Status should still be pending
    expect(result.deal!.sellerStatus).toBe(SellerStatus.PENDING);
  });

  it("Step 3: List deals and find ours", () => {
    const result = dealsList({ page: 1, pageSize: 100 });

    expect(result.success).toBe(true);
    expect(result.total).toBeGreaterThanOrEqual(1);

    const ourDeal = result.deals.find((d) => d.id === dealId);
    expect(ourDeal).toBeDefined();
    expect(ourDeal!.name).toBe("Lifecycle Test Deal (Updated)");
  });

  it("Step 4: Send deal to provider", async () => {
    // Force acceptance
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = await dealsSend({
      dealId,
      providerId: "mock",
      seatId: "LIFECYCLE-SEAT-001",
    });

    expect(result.success).toBe(true);
    expect(result.buyerSeatId).toBeDefined();
    expect(result.providerResponse?.status).toBe("pending_approval");
    // Deal transitions from PENDING to ACTIVE
    expect(result.deal!.sellerStatus).toBe(SellerStatus.ACTIVE);
    expect(result.deal!.buyerSeats.length).toBe(1);
  });

  it("Step 5: Check deal status", async () => {
    const result = await dealsStatus({ dealId });

    expect(result.success).toBe(true);
    expect(result.status!.sellerStatus).toBe("Active");
    expect(result.status!.buyerStatuses.length).toBe(1);
    expect(result.status!.buyerStatuses[0].providerId).toBe("mock");
    expect(result.status!.buyerStatuses[0].seatId).toBe("LIFECYCLE-SEAT-001");
  });

  it("Step 6: Confirm deal", async () => {
    const result = await dealsConfirm({ dealId });

    expect(result.success).toBe(true);
    expect(result.deal!.sellerStatus).toBe(SellerStatus.ACTIVE);
    // Buyer seat should now be accepted
    const acceptedSeat = result.deal!.buyerSeats.find((s) => s.seatId === "LIFECYCLE-SEAT-001");
    expect(acceptedSeat).toBeDefined();
  });

  it("Step 7: Pause deal", async () => {
    const result = await dealsPause({ dealId, reason: "Budget review" });

    expect(result.success).toBe(true);
    expect(result.deal!.sellerStatus).toBe(SellerStatus.PAUSED);
  });

  it("Step 8: Resume deal", async () => {
    const result = await dealsResume({ dealId });

    expect(result.success).toBe(true);
    expect(result.deal!.sellerStatus).toBe(SellerStatus.ACTIVE);
  });

  it("Step 9: Final state verification", async () => {
    const result = await dealsStatus({ dealId });

    expect(result.success).toBe(true);
    expect(result.deal!.name).toBe("Lifecycle Test Deal (Updated)");
    expect(result.deal!.description).toBe("Updated description");
    expect(result.deal!.sellerStatus).toBe(SellerStatus.ACTIVE);
    expect(result.deal!.terms.dealFloor).toBe(18.0);
    expect(result.deal!.buyerSeats.length).toBe(1);
    expect(result.status!.sellerStatus).toBe("Active");
  });
});
