# Adding a Provider

This guide walks through adding a real DSP/SSP provider integration to the IAB Deals MCP Server. Use `MockProvider` (`src/providers/mock.ts`) as a working reference.

## Architecture

```
src/providers/
├── base.ts        # DealProvider interface + BaseDealProvider abstract class
├── mock.ts        # Mock provider (demo/testing)
├── registry.ts    # Provider factory — registers and looks up providers
└── <yours>.ts     # Your new provider
```

The server never talks to providers directly. All provider interactions go through:

1. **`DealProvider` interface** — the contract every provider must implement
2. **`registry.ts`** — the factory that maps provider IDs to instances

## Step 1: Understand the Interface

Every provider implements 4 methods defined in `src/providers/base.ts`:

```typescript
interface DealProvider {
  readonly id: string;          // Unique identifier (e.g., "ttd", "dv360")
  readonly name: string;        // Display name (e.g., "The Trade Desk")

  isAvailable(): boolean;       // Are credentials configured?
  sendDeal(deal: Deal, seatId: string): Promise<ProviderResponse>;
  checkStatus(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse>;
  pauseDeal(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse>;
  resumeDeal(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse>;
}
```

`BaseDealProvider` provides two helper methods you can use:
- `this.successResponse(status, platformDealId?, message?)` — builds a success `ProviderResponse`
- `this.errorResponse(message)` — builds an error `ProviderResponse`

The `ProviderResponse` shape:

```typescript
{
  success: boolean;
  providerId: string;       // Your provider's id
  platformDealId: string | null;  // Provider's internal deal ID
  status: string;           // Free-form status string
  message?: string;         // Human-readable detail
  rawResponse?: unknown;    // Optional: store raw API response for debugging
}
```

## Step 2: Create the Provider File

Create `src/providers/<provider-id>.ts`. Here's a complete skeleton using The Trade Desk as an example:

```typescript
/**
 * The Trade Desk (TTD) Provider
 * Docs: https://api.thetradedesk.com/v3/portal/data/doc/DataDealApiReference
 */

import { BaseDealProvider } from "./base.js";
import type { Deal, BuyerSeat, ProviderResponse } from "../models/index.js";

const TTD_API_BASE = "https://api.thetradedesk.com/v3";

export class TradeDeskProvider extends BaseDealProvider {
  readonly id = "ttd";
  readonly name = "The Trade Desk";

  private get apiKey(): string | undefined {
    return process.env.TTD_API_KEY?.trim();
  }

  private get partnerId(): string | undefined {
    return process.env.TTD_PARTNER_ID?.trim();
  }

  isAvailable(): boolean {
    return !!(this.apiKey && this.partnerId);
  }

  async sendDeal(deal: Deal, seatId: string): Promise<ProviderResponse> {
    try {
      // Map IAB deal to TTD API format
      const payload = {
        DealId: deal.externalDealId,
        DealName: deal.name,
        FloorCPMInAdvertiserCurrency: deal.terms.dealFloor,
        Currency: deal.terms.currency,
        StartDate: deal.terms.startDate,
        EndDate: deal.terms.endDate,
        AdvertiserSeatId: seatId,
        // Map ad types to TTD format
        AdFormats: deal.adTypes.map(this.mapAdType),
      };

      const response = await fetch(`${TTD_API_BASE}/deal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "TTD-Auth": this.apiKey!,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        return this.errorResponse(`TTD API error (${response.status}): ${error}`);
      }

      const data = await response.json();
      return this.successResponse(
        "pending_approval",
        data.DealId,
        `Deal submitted to TTD. Platform ID: ${data.DealId}`
      );
    } catch (error) {
      return this.errorResponse(`TTD request failed: ${error}`);
    }
  }

  async checkStatus(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse> {
    try {
      const response = await fetch(
        `${TTD_API_BASE}/deal/${buyerSeat.platformDealId}`,
        {
          headers: { "TTD-Auth": this.apiKey! },
        }
      );

      if (!response.ok) {
        return this.errorResponse(`TTD status check failed: ${response.status}`);
      }

      const data = await response.json();
      return this.successResponse(
        data.Status?.toLowerCase() || "unknown",
        buyerSeat.platformDealId,
        `TTD status: ${data.Status}`
      );
    } catch (error) {
      return this.errorResponse(`TTD status check failed: ${error}`);
    }
  }

  async pauseDeal(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse> {
    try {
      const response = await fetch(
        `${TTD_API_BASE}/deal/${buyerSeat.platformDealId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "TTD-Auth": this.apiKey!,
          },
          body: JSON.stringify({ Status: "Paused" }),
        }
      );

      if (!response.ok) {
        return this.errorResponse(`TTD pause failed: ${response.status}`);
      }

      return this.successResponse("paused", buyerSeat.platformDealId, "Deal paused on TTD");
    } catch (error) {
      return this.errorResponse(`TTD pause failed: ${error}`);
    }
  }

  async resumeDeal(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse> {
    try {
      const response = await fetch(
        `${TTD_API_BASE}/deal/${buyerSeat.platformDealId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "TTD-Auth": this.apiKey!,
          },
          body: JSON.stringify({ Status: "Active" }),
        }
      );

      if (!response.ok) {
        return this.errorResponse(`TTD resume failed: ${response.status}`);
      }

      return this.successResponse("active", buyerSeat.platformDealId, "Deal resumed on TTD");
    } catch (error) {
      return this.errorResponse(`TTD resume failed: ${error}`);
    }
  }

  /** Map IAB AdType enum to TTD format */
  private mapAdType(adType: number): string {
    const map: Record<number, string> = {
      1: "Banner",
      2: "Video",
      3: "Audio",
      4: "Native",
    };
    return map[adType] || "Unknown";
  }
}
```

## Step 3: Register the Provider

Edit `src/providers/registry.ts` to import and register your provider:

```typescript
import { TradeDeskProvider } from "./ttd.js";

function initProviders(): void {
  if (providers.size > 0) return;

  // Mock provider (always available)
  const mock = new MockProvider();
  providers.set(mock.id, mock);

  // The Trade Desk (available when credentials are set)
  const ttd = new TradeDeskProvider();
  providers.set(ttd.id, ttd);
}
```

The registry calls `isAvailable()` at runtime. If credentials aren't set, the provider is registered but won't appear in `getAvailableProviders()`. Users see it listed but disabled — no code changes needed to toggle availability.

## Step 4: Add Environment Variables

Add your provider's credentials to `.env`:

```bash
# The Trade Desk
TTD_API_KEY=your-api-key-here
TTD_PARTNER_ID=your-partner-id-here
```

And document them in `.env.example`:

```bash
# The Trade Desk (optional — enables TTD provider)
TTD_API_KEY=
TTD_PARTNER_ID=
```

## Step 5: Write Tests

Create `src/__tests__/providers/<provider-id>.test.ts`. Test two layers:

### Unit tests (no network)

Test your mapping logic, `isAvailable()`, and error handling without making real API calls:

```typescript
import { describe, it, expect, vi, afterEach } from "vitest";
import { TradeDeskProvider } from "../../providers/ttd.js";

describe("TradeDeskProvider", () => {
  const provider = new TradeDeskProvider();

  it("has correct id and name", () => {
    expect(provider.id).toBe("ttd");
    expect(provider.name).toBe("The Trade Desk");
  });

  it("is unavailable without env vars", () => {
    delete process.env.TTD_API_KEY;
    expect(provider.isAvailable()).toBe(false);
  });

  it("is available with env vars", () => {
    process.env.TTD_API_KEY = "test-key";
    process.env.TTD_PARTNER_ID = "test-partner";
    expect(provider.isAvailable()).toBe(true);
    delete process.env.TTD_API_KEY;
    delete process.env.TTD_PARTNER_ID;
  });
});
```

### Integration tests (with sandbox API)

If the provider offers a sandbox/test environment, write tests that hit it:

```typescript
describe("TradeDeskProvider (sandbox)", () => {
  // Only run if sandbox credentials are available
  const hasCreds = !!process.env.TTD_SANDBOX_API_KEY;

  it.skipIf(!hasCreds)("sends a deal to sandbox", async () => {
    // ... test against real sandbox API
  });
});
```

## Step 6: Verify

```bash
# Type check
npm run typecheck

# Run tests
npm test

# Build
npm run build

# Start server and check provider appears
NODE_ENV=demo npm start
# Then use providers_list tool to confirm
```

## Checklist

- [ ] Provider class extends `BaseDealProvider`
- [ ] `id` is lowercase, URL-safe (e.g., `"ttd"`, `"dv360"`, `"freewheel"`)
- [ ] `isAvailable()` checks all required env vars
- [ ] All 4 methods (`sendDeal`, `checkStatus`, `pauseDeal`, `resumeDeal`) implemented
- [ ] Error handling wraps all API calls in try/catch
- [ ] `ProviderResponse` returned for both success and failure (never throws)
- [ ] Registered in `registry.ts`
- [ ] Env vars documented in `.env.example`
- [ ] Unit tests written
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes

## Reference: Provider ID Conventions

| Provider | ID | Env Vars |
|----------|-----|----------|
| Mock (demo) | `mock` | *(none — always available)* |
| The Trade Desk | `ttd` | `TTD_API_KEY`, `TTD_PARTNER_ID` |
| Google DV360 | `dv360` | `DV360_SERVICE_ACCOUNT_JSON` |
| FreeWheel | `freewheel` | `FREEWHEEL_CLIENT_ID`, `FREEWHEEL_CLIENT_SECRET` |
| Magnite | `magnite` | `MAGNITE_API_KEY` |
