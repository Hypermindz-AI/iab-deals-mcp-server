import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from "vitest";
import { initTestDb, cleanupTestDb } from "../helpers/setup.js";
import { minimalDealInput, fullDealInput } from "../helpers/fixtures.js";
import {
  dealsCreate,
  dealsUpdate,
  dealsSend,
  dealsConfirm,
  dealsStatus,
  dealsList,
  dealsPause,
  dealsResume,
  providersList,
} from "../../tools/index.js";
import { SellerStatus, BuyerStatus, AdType } from "../../models/enums.js";

beforeAll(() => initTestDb());
afterAll(() => cleanupTestDb());

afterEach(() => {
  vi.restoreAllMocks();
});

describe("dealsCreate", () => {
  it("creates a deal with minimal input", () => {
    const result = dealsCreate(minimalDealInput());
    expect(result.success).toBe(true);
    expect(result.deal).toBeDefined();
    expect(result.deal!.name).toBe("Test Deal");
    expect(result.deal!.sellerStatus).toBe(SellerStatus.PENDING);
  });

  it("creates a deal with full input including geo", () => {
    const result = dealsCreate(fullDealInput());
    expect(result.success).toBe(true);
    expect(result.deal!.name).toBe("Premium Video Campaign");
    expect(result.deal!.description).toBe("Multi-format premium campaign");
    expect(result.deal!.inventory).not.toBeNull();
    expect(result.deal!.inventory!.geoCountries).toEqual(["USA", "GBR"]);
  });
});

describe("dealsUpdate", () => {
  it("updates deal name", () => {
    const created = dealsCreate(minimalDealInput({ name: "Before" }));
    const result = dealsUpdate({ id: created.deal!.id, name: "After" });
    expect(result.success).toBe(true);
    expect(result.deal!.name).toBe("After");
  });

  it("updates deal floor", () => {
    const created = dealsCreate(minimalDealInput());
    const result = dealsUpdate({ id: created.deal!.id, dealFloor: 99.0 });
    expect(result.success).toBe(true);
    expect(result.deal!.terms.dealFloor).toBe(99.0);
  });

  it("returns error for non-existent deal", () => {
    const result = dealsUpdate({ id: "00000000-0000-0000-0000-000000000000", name: "X" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });
});

describe("dealsSend", () => {
  it("sends deal to mock provider (accepted)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const created = dealsCreate(minimalDealInput({ name: "Send Accepted" }));
    const result = await dealsSend({
      dealId: created.deal!.id,
      providerId: "mock",
      seatId: "SEAT-SEND-1",
    });

    expect(result.success).toBe(true);
    expect(result.buyerSeatId).toBeDefined();
    expect(result.deal).toBeDefined();
    // Deal should be activated after send
    expect(result.deal!.sellerStatus).toBe(SellerStatus.ACTIVE);
  });

  it("handles mock provider rejection", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.95);

    const created = dealsCreate(minimalDealInput({ name: "Send Rejected" }));
    const result = await dealsSend({
      dealId: created.deal!.id,
      providerId: "mock",
      seatId: "SEAT-SEND-2",
    });

    expect(result.success).toBe(false);
    expect(result.providerResponse?.status).toBe("rejected");
  });

  it("returns error for unknown provider", async () => {
    const created = dealsCreate(minimalDealInput());
    const result = await dealsSend({
      dealId: created.deal!.id,
      providerId: "nonexistent",
      seatId: "SEAT-X",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Provider not found");
  });

  it("returns error for non-existent deal", async () => {
    const result = await dealsSend({
      dealId: "00000000-0000-0000-0000-000000000000",
      providerId: "mock",
      seatId: "SEAT-X",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });
});

describe("dealsConfirm", () => {
  it("confirms a sent deal", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const created = dealsCreate(minimalDealInput({ name: "Confirm Test" }));
    await dealsSend({
      dealId: created.deal!.id,
      providerId: "mock",
      seatId: "SEAT-CONF",
    });

    const result = await dealsConfirm({ dealId: created.deal!.id });
    expect(result.success).toBe(true);
    expect(result.deal!.sellerStatus).toBe(SellerStatus.ACTIVE);
  });

  it("fails when no buyer seats exist", async () => {
    const created = dealsCreate(minimalDealInput({ name: "No Seats" }));
    const result = await dealsConfirm({ dealId: created.deal!.id });
    expect(result.success).toBe(false);
    expect(result.error).toContain("No buyer seats");
  });

  it("returns error for non-existent deal", async () => {
    const result = await dealsConfirm({ dealId: "00000000-0000-0000-0000-000000000000" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("not found");
  });
});

describe("dealsStatus", () => {
  it("returns deal status", async () => {
    const created = dealsCreate(minimalDealInput({ name: "Status Check" }));
    const result = await dealsStatus({ dealId: created.deal!.id });

    expect(result.success).toBe(true);
    expect(result.deal).toBeDefined();
    expect(result.status).toBeDefined();
    expect(result.status!.sellerStatus).toBe("Pending");
  });

  it("returns buyer seat statuses", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const created = dealsCreate(minimalDealInput({ name: "Status Seats" }));
    await dealsSend({
      dealId: created.deal!.id,
      providerId: "mock",
      seatId: "SEAT-STAT",
    });

    const result = await dealsStatus({ dealId: created.deal!.id });
    expect(result.status!.buyerStatuses.length).toBe(1);
    expect(result.status!.buyerStatuses[0].providerId).toBe("mock");
    expect(result.status!.buyerStatuses[0].seatId).toBe("SEAT-STAT");
  });

  it("returns error for non-existent deal", async () => {
    const result = await dealsStatus({ dealId: "00000000-0000-0000-0000-000000000000" });
    expect(result.success).toBe(false);
  });
});

describe("dealsList", () => {
  it("lists deals with pagination", () => {
    const result = dealsList({ page: 1, pageSize: 5 });
    expect(result.success).toBe(true);
    expect(result.deals.length).toBeLessThanOrEqual(5);
    expect(result.total).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(5);
  });

  it("filters by status", () => {
    const result = dealsList({ page: 1, pageSize: 100, status: SellerStatus.PENDING });
    for (const deal of result.deals) {
      expect(deal.sellerStatus).toBe(SellerStatus.PENDING);
    }
  });
});

describe("dealsPause", () => {
  it("pauses an active deal", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const created = dealsCreate(minimalDealInput({ name: "Pause Test" }));
    // Send to make it active
    await dealsSend({ dealId: created.deal!.id, providerId: "mock", seatId: "SEAT-PAUSE" });
    // Confirm to have accepted seats
    await dealsConfirm({ dealId: created.deal!.id });

    const result = await dealsPause({ dealId: created.deal!.id, reason: "Budget cap reached" });
    expect(result.success).toBe(true);
    expect(result.deal!.sellerStatus).toBe(SellerStatus.PAUSED);
  });

  it("fails to pause a pending deal", async () => {
    const created = dealsCreate(minimalDealInput({ name: "Pause Pending" }));
    const result = await dealsPause({ dealId: created.deal!.id });
    expect(result.success).toBe(false);
    expect(result.error).toContain("not active");
  });
});

describe("dealsResume", () => {
  it("resumes a paused deal", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const created = dealsCreate(minimalDealInput({ name: "Resume Test" }));
    await dealsSend({ dealId: created.deal!.id, providerId: "mock", seatId: "SEAT-RESUME" });
    await dealsConfirm({ dealId: created.deal!.id });
    await dealsPause({ dealId: created.deal!.id });

    const result = await dealsResume({ dealId: created.deal!.id });
    expect(result.success).toBe(true);
    expect(result.deal!.sellerStatus).toBe(SellerStatus.ACTIVE);
  });

  it("fails to resume a non-paused deal", async () => {
    const created = dealsCreate(minimalDealInput({ name: "Resume Active" }));
    const result = await dealsResume({ dealId: created.deal!.id });
    expect(result.success).toBe(false);
    expect(result.error).toContain("not paused");
  });
});

describe("providersList", () => {
  it("returns providers including mock", () => {
    const result = providersList();
    expect(result.success).toBe(true);
    expect(result.providers.length).toBeGreaterThanOrEqual(1);
    const mock = result.providers.find((p) => p.id === "mock");
    expect(mock).toBeDefined();
    expect(mock!.available).toBe(true);
  });
});
