# IAB Deals MCP Server

MCP Server implementing IAB Deals API v1.0 for programmatic deal management.

## Overview

This MCP server provides tools for managing programmatic advertising deals following the [IAB Deals API specification](https://iabtechlab.com/standards/deals-api/). It enables AI agents to create, manage, and monitor deals across DSPs and SSPs.

## Features

- **9 MCP Tools** for complete deal lifecycle management
- **Mock Provider** for standalone demo (no external dependencies)
- **SQLite Database** for local persistence
- **IAB Compliant** data models and status codes
- **Extensible** provider architecture for real DSP/SSP integrations

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/Hypermindz-AI/iab-deals-mcp-server.git
cd iab-deals-mcp-server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build
npm run build

# Run
npm start
```

### Claude Desktop Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

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

Or with `npx` (after publishing):

```json
{
  "mcpServers": {
    "iab-deals": {
      "command": "npx",
      "args": ["iab-deals-mcp"],
      "env": {
        "NODE_ENV": "demo"
      }
    }
  }
}
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `deals/create` | Create a new deal in PENDING status |
| `deals/update` | Update deal properties |
| `deals/send` | Send deal to DSP/SSP for approval |
| `deals/confirm` | Activate an approved deal |
| `deals/status` | Get deal status and buyer seat info |
| `deals/list` | List deals with filtering/pagination |
| `deals/pause` | Pause an active deal |
| `deals/resume` | Resume a paused deal |
| `providers/list` | List available providers |

## Demo Walkthrough

### 1. List existing deals

```
Use the deals/list tool to see sample deals
```

### 2. Create a new deal

```
Use deals/create with:
- name: "Q2 Video Campaign"
- origin: "ads.mybrand.com"
- seller: "My Brand Inc"
- adTypes: [2] (Video)
- dealFloor: 25.00
- startDate: "2026-04-01T00:00:00Z"
```

### 3. Send to provider

```
Use deals/send with:
- dealId: <from step 2>
- providerId: "mock"
- seatId: "buyer-seat-001"
```

### 4. Check status

```
Use deals/status with the dealId
```

### 5. Confirm the deal

```
Use deals/confirm with the dealId
```

### 6. Pause/Resume

```
Use deals/pause and deals/resume to control delivery
```

## Data Model

### Deal Status Codes (Seller)

| Code | Status | Description |
|------|--------|-------------|
| 0 | Active | Deal is active and serving |
| 1 | Paused | Deal is temporarily paused |
| 2 | Pending | Deal created, not yet sent |
| 4 | Complete | Deal has completed |

### Buyer Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 0 | Pending | Awaiting provider response |
| 1 | Accepted | Provider accepted the deal |
| 2 | Rejected | Provider rejected the deal |
| 3 | Expired | Deal expired before response |
| 4 | Paused | Deal paused on provider |
| 5 | Error | Error communicating with provider |

### Ad Types

| Code | Type |
|------|------|
| 1 | Banner |
| 2 | Video |
| 3 | Audio |
| 4 | Native |

## Project Structure

```
iab-deals-mcp-server/
├── src/
│   ├── index.ts           # MCP server entry point
│   ├── config.ts          # Configuration management
│   ├── models/            # Zod schemas and types
│   │   ├── deal.ts
│   │   ├── terms.ts
│   │   ├── inventory.ts
│   │   ├── buyer-seat.ts
│   │   └── provider.ts
│   ├── tools/             # MCP tool implementations
│   │   └── index.ts
│   ├── providers/         # DSP/SSP provider abstraction
│   │   ├── base.ts
│   │   ├── mock.ts
│   │   └── registry.ts
│   └── db/                # Database layer
│       ├── schema.ts
│       ├── database.ts
│       └── seed.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Authentication

### MCP Server (Client → Server)

- **Demo Mode**: No authentication required
- **Production**: Set `IAB_DEALS_API_KEY` environment variable

### Provider APIs (Server → DSPs/SSPs)

Configure provider credentials in environment variables:

```bash
# The Trade Desk
TTD_API_KEY=your-api-key
TTD_PARTNER_ID=your-partner-id

# Google DV360
DV360_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# FreeWheel
FREEWHEEL_CLIENT_ID=your-client-id
FREEWHEEL_CLIENT_SECRET=your-client-secret
```

## Development

```bash
# Development mode with hot reload
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test
```

## Adding a New Provider

1. Create a new file in `src/providers/` (e.g., `ttd.ts`)
2. Implement the `DealProvider` interface
3. Register in `src/providers/registry.ts`

Example:

```typescript
import { BaseDealProvider } from "./base.js";
import type { Deal, BuyerSeat, ProviderResponse } from "../models/index.js";

export class TradeDeskProvider extends BaseDealProvider {
  readonly id = "ttd";
  readonly name = "The Trade Desk";

  isAvailable(): boolean {
    return !!process.env.TTD_API_KEY;
  }

  async sendDeal(deal: Deal, seatId: string): Promise<ProviderResponse> {
    // Implement TTD API integration
  }

  // ... other methods
}
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

This is a reference implementation for the IAB Tech Lab Agentic Working Group. Contributions welcome!

## Resources

- [IAB Deals API Specification](https://iabtechlab.com/standards/deals-api/)
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)
- [IAB Tech Lab](https://iabtechlab.com/)

---

Built by [HyperMindZ](https://hypermindz.ai) for the IAB Tech Lab Agentic Task Force.
