# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

**IAB Deals MCP Server** - A TypeScript MCP server implementing IAB Deals API v1.0 for programmatic advertising deal management.

**Purpose:** Reference implementation for IAB Tech Lab Agentic Task Force demonstrating how AI agents can manage programmatic deals via MCP.

**Client:** IAB Tech Lab

## Tech Stack

- **Language:** TypeScript (Node.js 18+)
- **MCP SDK:** `@modelcontextprotocol/sdk`
- **Database:** SQLite via `better-sqlite3`
- **Validation:** Zod schemas
- **Build:** TypeScript compiler (tsc)

## Project Structure

```
src/
├── index.ts           # MCP server entry point
├── config.ts          # Environment configuration
├── models/            # Zod schemas (Deal, Terms, Inventory, BuyerSeat, Provider)
├── tools/             # MCP tool implementations (9 tools)
├── providers/         # DSP/SSP provider abstraction
│   ├── base.ts        # Provider interface
│   ├── mock.ts        # Mock provider for demos
│   └── registry.ts    # Provider factory
└── db/                # Database layer
    ├── schema.ts      # SQLite schema
    ├── database.ts    # CRUD operations
    └── seed.ts        # Demo data seeding
```

## Common Commands

```bash
# Development
npm run dev          # Run with hot reload (tsx watch)
npm run build        # Compile TypeScript
npm start            # Run compiled server

# Testing
npm test             # Run vitest tests
npm run typecheck    # Type check without emitting

# Linting
npm run lint         # ESLint
```

## MCP Tools

| Tool | Purpose | Status Flow |
|------|---------|-------------|
| `deals/create` | Create new deal | → PENDING |
| `deals/update` | Modify deal | (no change) |
| `deals/send` | Send to provider | PENDING → ACTIVE |
| `deals/confirm` | Activate deal | → ACTIVE |
| `deals/status` | Get status | (read-only) |
| `deals/list` | List deals | (read-only) |
| `deals/pause` | Pause deal | ACTIVE → PAUSED |
| `deals/resume` | Resume deal | PAUSED → ACTIVE |
| `providers/list` | List providers | (read-only) |

## IAB Deal Sync API v1.0 Status Codes

**Seller Status:** 0=Active, 1=Paused, 2=Pending, 4=Complete, 5=Archived
**Buyer Status:** 0=Pending, 1=Approved, 2=Rejected, 3=Ready to Serve, 4=Active, 5=Paused, 6=Complete
**Ad Types:** 1=Banner, 2=Video, 3=Audio, 4=Native
**Price Types:** 0=Dynamic, 1=First Price, 2=Second Price Plus (default), 3=Fixed

## Authentication

Two-layer auth strategy:

1. **MCP Server Access:** API key via `IAB_DEALS_API_KEY` env var
2. **Provider APIs:** Per-provider credentials (TTD_API_KEY, DV360_SERVICE_ACCOUNT_JSON, etc.)

## Testing with Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "iab-deals": {
      "command": "node",
      "args": ["/path/to/iab-deals-mcp-server/dist/index.js"],
      "env": {
        "NODE_ENV": "demo",
        "SEED_DEMO_DATA": "true"
      }
    }
  }
}
```

## Key Files

- `src/index.ts` - Main server, tool registration
- `src/tools/index.ts` - All tool implementations
- `src/models/deal.ts` - Core Deal schema
- `src/providers/mock.ts` - Mock provider for demos
- `src/db/seed.ts` - Demo data (5 sample deals)
- `docs/PLAN.md` - Implementation plan and next steps

