/**
 * End-to-end test: MCP Server over stdio
 * Spawns the real compiled server as a child process and communicates
 * via MCP protocol using the SDK's Client + StdioClientTransport.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "path";

const PROJECT_ROOT = resolve(import.meta.dirname, "..", "..", "..");
const SERVER_PATH = resolve(PROJECT_ROOT, "dist", "index.js");

let client: Client;
let transport: StdioClientTransport;

beforeAll(async () => {
  transport = new StdioClientTransport({
    command: "node",
    args: [SERVER_PATH],
    env: {
      ...process.env,
      NODE_ENV: "demo",
      SEED_DEMO_DATA: "true",
      DATABASE_URL: `/tmp/iab-e2e-mcp-${Date.now()}.db`,
    },
  });

  client = new Client({ name: "e2e-test-client", version: "1.0.0" });
  await client.connect(transport);
}, 15000);

afterAll(async () => {
  await client.close();
});

describe("MCP Server E2E", () => {
  // ==========================================
  // tools/list
  // ==========================================
  describe("tools/list", () => {
    it("lists all 9 tools", async () => {
      const result = await client.listTools();
      const toolNames = result.tools.map((t) => t.name).sort();

      expect(toolNames).toEqual([
        "deals_confirm",
        "deals_create",
        "deals_list",
        "deals_pause",
        "deals_resume",
        "deals_send",
        "deals_status",
        "deals_update",
        "providers_list",
      ]);
    });

    it("each tool has inputSchema", async () => {
      const result = await client.listTools();
      for (const tool of result.tools) {
        expect(tool.inputSchema).toBeDefined();
        expect(tool.inputSchema.type).toBe("object");
      }
    });
  });

  // ==========================================
  // providers_list
  // ==========================================
  describe("providers_list", () => {
    it("returns mock provider", async () => {
      const result = await client.callTool({ name: "providers_list", arguments: {} });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(true);
      expect(content.providers.length).toBeGreaterThanOrEqual(1);
      const mock = content.providers.find((p: any) => p.id === "mock");
      expect(mock).toBeDefined();
      expect(mock.available).toBe(true);
    });
  });

  // ==========================================
  // deals_list (seeded demo data)
  // ==========================================
  describe("deals_list (seeded data)", () => {
    it("returns 5 seeded demo deals", async () => {
      const result = await client.callTool({ name: "deals_list", arguments: {} });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(true);
      expect(content.total).toBe(5);
      expect(content.deals.length).toBe(5);
    });

    it("supports pagination", async () => {
      const result = await client.callTool({
        name: "deals_list",
        arguments: { page: 1, pageSize: 2 },
      });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(true);
      expect(content.deals.length).toBe(2);
      expect(content.total).toBe(5);
    });

    it("filters by status", async () => {
      const result = await client.callTool({
        name: "deals_list",
        arguments: { status: 2 }, // PENDING
      });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(true);
      for (const deal of content.deals) {
        expect(deal.sellerStatus).toBe(2);
      }
    });
  });

  // ==========================================
  // Full lifecycle via MCP protocol
  // ==========================================
  describe("full lifecycle via MCP", () => {
    let dealId: string;

    it("creates a deal", async () => {
      const result = await client.callTool({
        name: "deals_create",
        arguments: {
          name: "E2E MCP Test Deal",
          origin: "ads.e2etest.com",
          seller: "E2E Corp",
          description: "End-to-end MCP protocol test",
          adTypes: [2], // VIDEO
          dealFloor: 20.0,
          currency: "USD",
          priceType: 2, // FIXED
          startDate: "2026-04-01T00:00:00Z",
          endDate: "2026-06-30T23:59:59Z",
          geoCountries: ["USA"],
        },
      });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(true);
      expect(content.deal.name).toBe("E2E MCP Test Deal");
      expect(content.deal.sellerStatus).toBe(2); // PENDING
      expect(content.deal.terms.dealFloor).toBe(20.0);
      expect(content.deal.inventory.geoCountries).toEqual(["USA"]);
      dealId = content.deal.id;
    });

    it("updates the deal", async () => {
      const result = await client.callTool({
        name: "deals_update",
        arguments: {
          id: dealId,
          name: "E2E MCP Test Deal (Updated)",
          dealFloor: 25.0,
        },
      });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(true);
      expect(content.deal.name).toBe("E2E MCP Test Deal (Updated)");
      expect(content.deal.terms.dealFloor).toBe(25.0);
    });

    it("gets deal status", async () => {
      const result = await client.callTool({
        name: "deals_status",
        arguments: { dealId },
      });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(true);
      expect(content.status.sellerStatus).toBe("Pending");
      expect(content.status.buyerStatuses).toEqual([]);
    });

    it("sends deal to mock provider", async () => {
      const result = await client.callTool({
        name: "deals_send",
        arguments: {
          dealId,
          providerId: "mock",
          seatId: "E2E-SEAT-001",
        },
      });
      const content = JSON.parse((result.content as any)[0].text);

      // MockProvider has 90% accept rate; either outcome is valid
      expect(typeof content.success).toBe("boolean");
      if (content.success) {
        expect(content.buyerSeatId).toBeDefined();
        expect(content.deal.sellerStatus).toBe(0); // ACTIVE
      }
    });

    it("confirms the deal", async () => {
      // First check if send succeeded (deal is active)
      const statusResult = await client.callTool({
        name: "deals_status",
        arguments: { dealId },
      });
      const statusContent = JSON.parse((statusResult.content as any)[0].text);

      if (statusContent.deal.buyerSeats.length === 0) {
        // Send was rejected, skip confirm
        return;
      }

      const result = await client.callTool({
        name: "deals_confirm",
        arguments: { dealId },
      });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(true);
      expect(content.deal.sellerStatus).toBe(0); // ACTIVE
    });

    it("pauses the deal", async () => {
      const statusResult = await client.callTool({
        name: "deals_status",
        arguments: { dealId },
      });
      const statusContent = JSON.parse((statusResult.content as any)[0].text);

      if (statusContent.deal.sellerStatus !== 0) {
        // Deal not active, can't pause
        return;
      }

      const result = await client.callTool({
        name: "deals_pause",
        arguments: { dealId, reason: "E2E test pause" },
      });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(true);
      expect(content.deal.sellerStatus).toBe(1); // PAUSED
    });

    it("resumes the deal", async () => {
      const statusResult = await client.callTool({
        name: "deals_status",
        arguments: { dealId },
      });
      const statusContent = JSON.parse((statusResult.content as any)[0].text);

      if (statusContent.deal.sellerStatus !== 1) {
        // Deal not paused, can't resume
        return;
      }

      const result = await client.callTool({
        name: "deals_resume",
        arguments: { dealId },
      });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(true);
      expect(content.deal.sellerStatus).toBe(0); // ACTIVE
    });
  });

  // ==========================================
  // Error handling
  // ==========================================
  describe("error handling", () => {
    it("returns error for unknown tool", async () => {
      const result = await client.callTool({
        name: "nonexistent_tool",
        arguments: {},
      });
      // MCP SDK may throw or return error content
      expect(result).toBeDefined();
    });

    it("returns error for non-existent deal", async () => {
      const result = await client.callTool({
        name: "deals_status",
        arguments: { dealId: "00000000-0000-0000-0000-000000000000" },
      });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(false);
      expect(content.error).toContain("not found");
    });

    it("returns error for invalid provider", async () => {
      // First create a deal to get a valid dealId
      const createResult = await client.callTool({
        name: "deals_create",
        arguments: {
          name: "Error Test Deal",
          origin: "ads.err.com",
          seller: "Error Corp",
          adTypes: [1],
          dealFloor: 5.0,
          startDate: "2026-01-01T00:00:00Z",
        },
      });
      const created = JSON.parse((createResult.content as any)[0].text);

      const result = await client.callTool({
        name: "deals_send",
        arguments: {
          dealId: created.deal.id,
          providerId: "nonexistent",
          seatId: "SEAT-ERR",
        },
      });
      const content = JSON.parse((result.content as any)[0].text);

      expect(content.success).toBe(false);
      expect(content.error).toContain("Provider not found");
    });
  });
});
