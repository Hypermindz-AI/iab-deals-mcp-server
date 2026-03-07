import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { initTestDb, cleanupTestDb } from "../helpers/setup.js";
import { seedDemoData } from "../../db/seed.js";
import { listDeals } from "../../db/database.js";

beforeAll(() => initTestDb());
afterAll(() => cleanupTestDb());

describe("seedDemoData", () => {
  it("seeds 5 demo deals into an empty database", () => {
    const before = listDeals();
    expect(before.total).toBe(0);

    seedDemoData();

    const after = listDeals({ pageSize: 100 });
    expect(after.total).toBe(5);
  });

  it("is idempotent - calling again does not duplicate", () => {
    seedDemoData();

    const result = listDeals({ pageSize: 100 });
    expect(result.total).toBe(5);
  });

  it("creates deals with expected names", () => {
    const result = listDeals({ pageSize: 100 });
    const names = result.deals.map((d) => d.name).sort();
    expect(names).toContain("Q1 Premium CTV Campaign");
    expect(names).toContain("Holiday Retail PMP 2026");
    expect(names).toContain("DOOH Sports Venue Network");
    expect(names).toContain("Premium Podcast Network");
    expect(names).toContain("Gaming & Esports Sponsorship");
  });

  it("creates deals with terms and inventory", () => {
    const result = listDeals({ pageSize: 100 });
    for (const deal of result.deals) {
      expect(deal.terms).toBeDefined();
      expect(deal.terms.dealFloor).toBeGreaterThan(0);
      expect(deal.terms.startDate).toBeDefined();
      expect(deal.inventory).not.toBeNull();
    }
  });
});
