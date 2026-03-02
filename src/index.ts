#!/usr/bin/env node
/**
 * IAB Deals MCP Server
 * MCP Server implementing IAB Deal Sync API v1.0 for programmatic deal management
 *
 * Tools:
 * - deals_create: Create a new deal in draft status
 * - deals_update: Update deal properties
 * - deals_send: Send deal to a DSP/SSP provider
 * - deals_confirm: Activate an approved deal
 * - deals_status: Get deal status and metrics
 * - deals_list: List deals with filtering
 * - deals_pause: Pause an active deal
 * - deals_resume: Resume a paused deal
 * - providers_list: List available providers
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { appConfig, validateConfig } from "./config.js";
import { initDatabase, closeDatabase } from "./db/database.js";
import { seedDemoData } from "./db/seed.js";
import {
  dealsCreate,
  dealsCreateSchema,
  dealsUpdate,
  dealsUpdateSchema,
  dealsSend,
  dealsSendSchema,
  dealsConfirm,
  dealsConfirmSchema,
  dealsStatus,
  dealsStatusSchema,
  dealsList,
  dealsListSchema,
  dealsPause,
  dealsPauseSchema,
  dealsResume,
  dealsResumeSchema,
  providersList,
} from "./tools/index.js";

// Tool definitions for MCP
const TOOLS = [
  {
    name: "deals_create",
    description: "Create a new programmatic deal. Returns the deal in PENDING status ready to be sent to providers.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Deal name (max 255 chars)" },
        origin: { type: "string", description: "Domain receiving bid responses" },
        seller: { type: "string", description: "Business entity sourcing demand" },
        description: { type: "string", description: "Brief description (max 250 chars)" },
        adTypes: {
          type: "array",
          items: { type: "integer", enum: [1, 2, 3, 4] },
          description: "Ad formats: 1=Banner, 2=Video, 3=Audio, 4=Native (optional, empty=all types)",
        },
        dealFloor: { type: "number", description: "Minimum CPM price" },
        currency: { type: "string", description: "ISO-4217 currency code (default: USD)" },
        priceType: { type: "integer", enum: [0, 1, 2, 3], description: "0=Dynamic, 1=First Price, 2=Second Price Plus (default), 3=Fixed" },
        startDate: { type: "string", format: "date-time", description: "Deal start date (ISO-8601)" },
        endDate: { type: "string", format: "date-time", description: "Deal end date (null=evergreen)" },
        countries: { type: "array", items: { type: "string" }, description: "ISO-3166-1 alpha-3 country codes" },
        wseat: { type: "array", items: { type: "string" }, description: "Whitelisted buyer seat IDs" },
        bseat: { type: "array", items: { type: "string" }, description: "Blocked buyer seat IDs" },
        auxData: { type: "integer", enum: [0, 1, 2, 3, 4], description: "Auxiliary data signal: 0=No Signal, 1=Deal ID Only, 2=Deal ID+Seat, 3=Full Bid Request, 4=Custom" },
        pubCount: { type: "integer", enum: [0, 1, 2], description: "Publisher count: 0=Single, 1=Multiple Known, 2=Multiple Unknown" },
        dInventory: { type: "integer", enum: [0, 1, 2], description: "Dynamic inventory: 0=Static, 1=Dynamic Addition, 2=Dynamic Removal" },
        guar: { type: "integer", enum: [0, 1], description: "Guaranteed: 0=Non-guaranteed, 1=Guaranteed" },
        units: { type: "integer", description: "Total units (impressions)" },
        totalCost: { type: "number", description: "Total cost of the deal" },
        curation: {
          type: "object",
          properties: {
            curator: { type: "string", description: "Curator name/identifier" },
            cdealId: { type: "string", description: "Curator's deal ID" },
            curFeeType: { type: "integer", enum: [0, 1, 2, 3, 4], description: "Fee type: 0=None, 1=Flat CPM, 2=% Media, 3=% Data, 4=Included" },
          },
          description: "Curation details for curated deals",
        },
      },
      required: ["name", "origin", "seller", "dealFloor", "startDate"],
    },
  },
  {
    name: "deals_update",
    description: "Update an existing deal's properties. Cannot update deals that have been sent to providers.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid", description: "Deal ID to update" },
        name: { type: "string", description: "New deal name" },
        description: { type: "string", description: "New description" },
        adTypes: { type: "array", items: { type: "integer" }, description: "New ad formats" },
        dealFloor: { type: "number", description: "New minimum CPM" },
        currency: { type: "string", description: "New currency code" },
        startDate: { type: "string", format: "date-time", description: "New start date" },
        endDate: { type: "string", format: "date-time", description: "New end date" },
        countries: { type: "array", items: { type: "string" }, description: "New country codes" },
        wseat: { type: "array", items: { type: "string" }, description: "New whitelisted buyer seat IDs" },
        bseat: { type: "array", items: { type: "string" }, description: "New blocked buyer seat IDs" },
        auxData: { type: "integer", enum: [0, 1, 2, 3, 4], description: "New auxiliary data signal" },
        pubCount: { type: "integer", enum: [0, 1, 2], description: "New publisher count" },
        dInventory: { type: "integer", enum: [0, 1, 2], description: "New dynamic inventory flag" },
        guar: { type: "integer", enum: [0, 1], description: "New guaranteed flag" },
        units: { type: "integer", description: "New total units" },
        totalCost: { type: "number", description: "New total cost" },
        curation: {
          type: "object",
          properties: {
            curator: { type: "string" },
            cdealId: { type: "string" },
            curFeeType: { type: "integer", enum: [0, 1, 2, 3, 4] },
          },
          description: "New curation details (null to remove)",
        },
      },
      required: ["id"],
    },
  },
  {
    name: "deals_send",
    description: "Send a deal to a DSP/SSP provider for approval. Creates a buyer seat and submits to the provider.",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string", format: "uuid", description: "Deal ID to send" },
        providerId: { type: "string", description: "Target provider ID (e.g., 'mock', 'ttd', 'dv360')" },
        seatId: { type: "string", description: "Buyer seat identifier" },
      },
      required: ["dealId", "providerId", "seatId"],
    },
  },
  {
    name: "deals_confirm",
    description: "Confirm/activate a deal after provider approval. Marks the deal as ACTIVE.",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string", format: "uuid", description: "Deal ID to confirm" },
        buyerSeatId: { type: "string", format: "uuid", description: "Specific buyer seat to confirm (optional)" },
      },
      required: ["dealId"],
    },
  },
  {
    name: "deals_status",
    description: "Get the current status of a deal including all buyer seat statuses.",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string", format: "uuid", description: "Deal ID to check status" },
      },
      required: ["dealId"],
    },
  },
  {
    name: "deals_list",
    description: "List all deals with optional filtering by status. Returns paginated results.",
    inputSchema: {
      type: "object",
      properties: {
        status: { type: "integer", enum: [0, 1, 2, 4, 5], description: "Filter by status: 0=Active, 1=Paused, 2=Pending, 4=Complete, 5=Archived" },
        page: { type: "integer", minimum: 1, description: "Page number (default: 1)" },
        pageSize: { type: "integer", minimum: 1, maximum: 100, description: "Items per page (default: 20)" },
      },
    },
  },
  {
    name: "deals_pause",
    description: "Pause an active deal. Notifies all connected providers.",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string", format: "uuid", description: "Deal ID to pause" },
        reason: { type: "string", description: "Reason for pausing" },
      },
      required: ["dealId"],
    },
  },
  {
    name: "deals_resume",
    description: "Resume a paused deal. Notifies all connected providers.",
    inputSchema: {
      type: "object",
      properties: {
        dealId: { type: "string", format: "uuid", description: "Deal ID to resume" },
      },
      required: ["dealId"],
    },
  },
  {
    name: "providers_list",
    description: "List all available DSP/SSP providers that deals can be sent to.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

async function main() {
  // Validate configuration
  try {
    validateConfig();
  } catch (error) {
    console.error("Configuration error:", error);
    process.exit(1);
  }

  // Initialize database
  initDatabase();

  // Seed demo data if configured
  if (appConfig.seedDemoData && appConfig.isDemo) {
    seedDemoData();
  }

  // Create MCP server
  const server = new Server(
    {
      name: "iab-deals-mcp",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tool listing handler
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Register tool execution handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: any;

      switch (name) {
        case "deals_create":
          result = dealsCreate(dealsCreateSchema.parse(args));
          break;
        case "deals_update":
          result = dealsUpdate(dealsUpdateSchema.parse(args));
          break;
        case "deals_send":
          result = await dealsSend(dealsSendSchema.parse(args));
          break;
        case "deals_confirm":
          result = await dealsConfirm(dealsConfirmSchema.parse(args));
          break;
        case "deals_status":
          result = await dealsStatus(dealsStatusSchema.parse(args));
          break;
        case "deals_list":
          result = dealsList(dealsListSchema.parse(args || {}));
          break;
        case "deals_pause":
          result = await dealsPause(dealsPauseSchema.parse(args));
          break;
        case "deals_resume":
          result = await dealsResume(dealsResumeSchema.parse(args));
          break;
        case "providers_list":
          result = providersList();
          break;
        default:
          return {
            content: [{ type: "text", text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error}` }],
        isError: true,
      };
    }
  });

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Handle shutdown
  process.on("SIGINT", () => {
    closeDatabase();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    closeDatabase();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
