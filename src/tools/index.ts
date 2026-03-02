/**
 * IAB Deals MCP Server - Tool Definitions
 * All 9 MCP tools for deal management per IAB Deal Sync API v1.0
 */

import { z } from "zod";
import {
  createDeal,
  getDealById,
  listDeals,
  updateDeal,
  updateDealStatus,
  createBuyerSeat,
  getBuyerSeatById,
  updateBuyerSeatStatus,
} from "../db/database.js";
import { getProvider, getAvailableProviders } from "../providers/registry.js";
import {
  AdType,
  SellerStatus,
  BuyerStatus,
  PriceType,
  AuxData,
  PubCount,
  DynamicInventory,
  IncludedInventory,
  CurationFeeType,
  Guaranteed,
  SellerStatusLabels,
  BuyerStatusLabels,
  AdTypeLabels,
} from "../models/index.js";
import type { Deal, DealResponse, DealListResponse } from "../models/index.js";

// ============================================
// Tool: deals/create
// ============================================

export const dealsCreateSchema = z.object({
  name: z.string().min(1).max(255).describe("Deal name"),
  origin: z.string().describe("Domain receiving bid responses"),
  seller: z.string().describe("Business entity sourcing demand"),
  description: z.string().max(250).optional().describe("Brief description (max 250 chars)"),
  adTypes: z.array(z.nativeEnum(AdType)).optional().describe("Ad formats: 1=Banner, 2=Video, 3=Audio, 4=Native (empty=all)"),
  dealFloor: z.number().min(0).describe("Minimum CPM price"),
  currency: z.string().length(3).default("USD").describe("ISO-4217 currency code"),
  priceType: z.nativeEnum(PriceType).default(PriceType.SECOND_PRICE_PLUS).describe("0=Dynamic, 1=First Price, 2=Second Price Plus, 3=Fixed"),
  startDate: z.string().datetime().describe("Deal start date (ISO-8601)"),
  endDate: z.string().datetime().nullable().optional().describe("Deal end date (null=evergreen)"),
  countries: z.array(z.string()).optional().describe("ISO-3166-1 alpha-3 country codes"),
  wseat: z.array(z.string()).optional().describe("Whitelisted buyer seat IDs"),
  bseat: z.array(z.string()).optional().describe("Blocked buyer seat IDs"),
  auxData: z.nativeEnum(AuxData).optional().describe("Auxiliary data signal (0-4)"),
  pubCount: z.nativeEnum(PubCount).optional().describe("Publisher count (0-2)"),
  dInventory: z.nativeEnum(DynamicInventory).optional().describe("Dynamic inventory flag (0-2)"),
  guar: z.nativeEnum(Guaranteed).optional().describe("Guaranteed flag: 0=Non-guaranteed, 1=Guaranteed"),
  units: z.number().int().optional().describe("Total units (impressions)"),
  totalCost: z.number().optional().describe("Total cost of the deal"),
  curation: z.object({
    curator: z.string().optional(),
    cdealId: z.string().optional(),
    curFeeType: z.nativeEnum(CurationFeeType).optional(),
    ext: z.record(z.unknown()).optional(),
  }).optional().describe("Curation details"),
});

export type DealsCreateInput = z.infer<typeof dealsCreateSchema>;

export function dealsCreate(input: DealsCreateInput): DealResponse {
  try {
    const deal = createDeal(
      input.name,
      input.origin,
      input.seller,
      input.adTypes || [],
      {
        dealFloor: input.dealFloor,
        currency: input.currency || "USD",
        priceType: input.priceType ?? PriceType.SECOND_PRICE_PLUS,
        startDate: input.startDate,
        endDate: input.endDate || null,
        countries: input.countries || [],
        guar: input.guar ?? null,
        units: input.units ?? null,
        totalCost: input.totalCost ?? null,
        ext: null,
      },
      {
        description: input.description,
        wseat: input.wseat,
        bseat: input.bseat,
        auxData: input.auxData ?? null,
        pubCount: input.pubCount ?? null,
        dInventory: input.dInventory ?? null,
        curation: input.curation || null,
      }
    );

    return { success: true, deal };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// Tool: deals/update
// ============================================

export const dealsUpdateSchema = z.object({
  id: z.string().uuid().describe("Deal ID to update"),
  name: z.string().min(1).max(255).optional().describe("New deal name"),
  description: z.string().max(250).optional().describe("New description"),
  adTypes: z.array(z.nativeEnum(AdType)).optional().describe("New ad formats"),
  dealFloor: z.number().min(0).optional().describe("New minimum CPM"),
  currency: z.string().length(3).optional().describe("New currency code"),
  startDate: z.string().datetime().optional().describe("New start date"),
  endDate: z.string().datetime().nullable().optional().describe("New end date"),
  countries: z.array(z.string()).optional().describe("New country codes"),
  wseat: z.array(z.string()).optional().describe("New whitelisted buyer seat IDs"),
  bseat: z.array(z.string()).optional().describe("New blocked buyer seat IDs"),
  auxData: z.nativeEnum(AuxData).optional().describe("New auxiliary data signal"),
  pubCount: z.nativeEnum(PubCount).optional().describe("New publisher count"),
  dInventory: z.nativeEnum(DynamicInventory).optional().describe("New dynamic inventory flag"),
  guar: z.nativeEnum(Guaranteed).optional().describe("New guaranteed flag"),
  units: z.number().int().optional().describe("New total units"),
  totalCost: z.number().optional().describe("New total cost"),
  curation: z.object({
    curator: z.string().optional(),
    cdealId: z.string().optional(),
    curFeeType: z.nativeEnum(CurationFeeType).optional(),
    ext: z.record(z.unknown()).optional(),
  }).nullable().optional().describe("New curation details (null to remove)"),
});

export type DealsUpdateInput = z.infer<typeof dealsUpdateSchema>;

export function dealsUpdate(input: DealsUpdateInput): DealResponse {
  try {
    const existing = getDealById(input.id);
    if (!existing) {
      return { success: false, error: `Deal not found: ${input.id}` };
    }

    const deal = updateDeal(input.id, {
      name: input.name,
      description: input.description,
      adTypes: input.adTypes,
      wseat: input.wseat,
      bseat: input.bseat,
      auxData: input.auxData,
      pubCount: input.pubCount,
      dInventory: input.dInventory,
      curation: input.curation,
      terms: {
        dealFloor: input.dealFloor,
        currency: input.currency,
        startDate: input.startDate,
        endDate: input.endDate,
        countries: input.countries,
        guar: input.guar,
        units: input.units,
        totalCost: input.totalCost,
      },
    });

    return { success: true, deal: deal! };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// Tool: deals/send
// ============================================

export const dealsSendSchema = z.object({
  dealId: z.string().uuid().describe("Deal ID to send"),
  providerId: z.string().describe("Target provider ID (e.g., 'mock', 'ttd', 'dv360')"),
  seatId: z.string().describe("Buyer seat identifier"),
});

export type DealsSendInput = z.infer<typeof dealsSendSchema>;

export async function dealsSend(input: DealsSendInput): Promise<{
  success: boolean;
  deal?: Deal;
  buyerSeatId?: string;
  providerResponse?: any;
  error?: string;
}> {
  try {
    const deal = getDealById(input.dealId);
    if (!deal) {
      return { success: false, error: `Deal not found: ${input.dealId}` };
    }

    const provider = getProvider(input.providerId);
    if (!provider) {
      const available = getAvailableProviders().map((p) => p.id).join(", ");
      return { success: false, error: `Provider not found: ${input.providerId}. Available: ${available}` };
    }

    if (!provider.isAvailable()) {
      return { success: false, error: `Provider not available: ${input.providerId}` };
    }

    // Create buyer seat record
    const buyerSeat = createBuyerSeat(input.dealId, input.seatId, input.providerId);

    // Send to provider
    const response = await provider.sendDeal(deal, input.seatId);

    // Update buyer seat with response
    if (response.success) {
      updateBuyerSeatStatus(buyerSeat.id, BuyerStatus.PENDING, {
        platformDealId: response.platformDealId || undefined,
      });
      // Update deal status to active if still pending
      if (deal.sellerStatus === SellerStatus.PENDING) {
        updateDealStatus(input.dealId, SellerStatus.ACTIVE, "system", "Deal sent to provider");
      }
    } else {
      // Use REJECTED + rejectionReason instead of removed ERROR status
      updateBuyerSeatStatus(buyerSeat.id, BuyerStatus.REJECTED, {
        rejectionReason: response.message,
      });
    }

    return {
      success: response.success,
      deal: getDealById(input.dealId)!,
      buyerSeatId: buyerSeat.id,
      providerResponse: response,
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// Tool: deals/confirm
// ============================================

export const dealsConfirmSchema = z.object({
  dealId: z.string().uuid().describe("Deal ID to confirm"),
  buyerSeatId: z.string().uuid().optional().describe("Specific buyer seat to confirm (optional)"),
});

export type DealsConfirmInput = z.infer<typeof dealsConfirmSchema>;

export async function dealsConfirm(input: DealsConfirmInput): Promise<DealResponse> {
  try {
    const deal = getDealById(input.dealId);
    if (!deal) {
      return { success: false, error: `Deal not found: ${input.dealId}` };
    }

    // Check if any buyer seats are approved or pending
    const confirmableSeats = deal.buyerSeats.filter(
      (s) => s.buyerStatus === BuyerStatus.APPROVED || s.buyerStatus === BuyerStatus.PENDING
    );

    if (confirmableSeats.length === 0) {
      return { success: false, error: "No buyer seats to confirm. Send deal to a provider first." };
    }

    // If specific buyer seat, confirm it
    if (input.buyerSeatId) {
      const seat = getBuyerSeatById(input.buyerSeatId);
      if (!seat || seat.dealId !== input.dealId) {
        return { success: false, error: `Buyer seat not found or doesn't belong to this deal` };
      }
      updateBuyerSeatStatus(input.buyerSeatId, BuyerStatus.APPROVED);
    } else {
      // Confirm all pending seats
      for (const seat of confirmableSeats) {
        if (seat.buyerStatus === BuyerStatus.PENDING) {
          updateBuyerSeatStatus(seat.id, BuyerStatus.APPROVED);
        }
      }
    }

    // Update deal status to active
    const updatedDeal = updateDealStatus(input.dealId, SellerStatus.ACTIVE, "user", "Deal confirmed");

    return { success: true, deal: updatedDeal! };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// Tool: deals/status
// ============================================

export const dealsStatusSchema = z.object({
  dealId: z.string().uuid().describe("Deal ID to check status"),
});

export type DealsStatusInput = z.infer<typeof dealsStatusSchema>;

export async function dealsStatus(input: DealsStatusInput): Promise<{
  success: boolean;
  deal?: Deal;
  status?: {
    sellerStatus: string;
    buyerStatuses: Array<{
      providerId: string;
      seatId: string;
      status: string;
      platformDealId: string | null;
    }>;
  };
  error?: string;
}> {
  try {
    const deal = getDealById(input.dealId);
    if (!deal) {
      return { success: false, error: `Deal not found: ${input.dealId}` };
    }

    // Check status with providers for each buyer seat
    const buyerStatuses = deal.buyerSeats.map((seat) => ({
      providerId: seat.providerId,
      seatId: seat.seatId,
      status: BuyerStatusLabels[seat.buyerStatus as BuyerStatus],
      platformDealId: seat.platformDealId,
    }));

    return {
      success: true,
      deal,
      status: {
        sellerStatus: SellerStatusLabels[deal.sellerStatus as SellerStatus],
        buyerStatuses,
      },
    };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// Tool: deals/list
// ============================================

export const dealsListSchema = z.object({
  status: z.nativeEnum(SellerStatus).optional().describe("Filter by seller status"),
  page: z.number().int().min(1).default(1).describe("Page number"),
  pageSize: z.number().int().min(1).max(100).default(20).describe("Items per page"),
});

export type DealsListInput = z.infer<typeof dealsListSchema>;

export function dealsList(input: DealsListInput): DealListResponse {
  try {
    const result = listDeals({
      status: input.status,
      page: input.page,
      pageSize: input.pageSize,
    });

    return {
      success: true,
      deals: result.deals,
      total: result.total,
      page: input.page || 1,
      pageSize: input.pageSize || 20,
    };
  } catch (error) {
    return { success: false, deals: [], total: 0, page: 1, pageSize: 20 };
  }
}

// ============================================
// Tool: deals/pause
// ============================================

export const dealsPauseSchema = z.object({
  dealId: z.string().uuid().describe("Deal ID to pause"),
  reason: z.string().optional().describe("Reason for pausing"),
});

export type DealsPauseInput = z.infer<typeof dealsPauseSchema>;

export async function dealsPause(input: DealsPauseInput): Promise<DealResponse> {
  try {
    const deal = getDealById(input.dealId);
    if (!deal) {
      return { success: false, error: `Deal not found: ${input.dealId}` };
    }

    if (deal.sellerStatus !== SellerStatus.ACTIVE) {
      return { success: false, error: `Deal is not active. Current status: ${SellerStatusLabels[deal.sellerStatus]}` };
    }

    // Pause with each provider
    for (const seat of deal.buyerSeats) {
      if (seat.buyerStatus === BuyerStatus.APPROVED || seat.buyerStatus === BuyerStatus.ACTIVE) {
        const provider = getProvider(seat.providerId);
        if (provider?.isAvailable()) {
          await provider.pauseDeal(deal, seat);
          updateBuyerSeatStatus(seat.id, BuyerStatus.PAUSED);
        }
      }
    }

    const updatedDeal = updateDealStatus(input.dealId, SellerStatus.PAUSED, "user", input.reason || "Deal paused");

    return { success: true, deal: updatedDeal! };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// Tool: deals/resume
// ============================================

export const dealsResumeSchema = z.object({
  dealId: z.string().uuid().describe("Deal ID to resume"),
});

export type DealsResumeInput = z.infer<typeof dealsResumeSchema>;

export async function dealsResume(input: DealsResumeInput): Promise<DealResponse> {
  try {
    const deal = getDealById(input.dealId);
    if (!deal) {
      return { success: false, error: `Deal not found: ${input.dealId}` };
    }

    if (deal.sellerStatus !== SellerStatus.PAUSED) {
      return { success: false, error: `Deal is not paused. Current status: ${SellerStatusLabels[deal.sellerStatus]}` };
    }

    // Resume with each provider
    for (const seat of deal.buyerSeats) {
      if (seat.buyerStatus === BuyerStatus.PAUSED) {
        const provider = getProvider(seat.providerId);
        if (provider?.isAvailable()) {
          await provider.resumeDeal(deal, seat);
          updateBuyerSeatStatus(seat.id, BuyerStatus.APPROVED);
        }
      }
    }

    const updatedDeal = updateDealStatus(input.dealId, SellerStatus.ACTIVE, "user", "Deal resumed");

    return { success: true, deal: updatedDeal! };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// Tool: providers/list
// ============================================

export function providersList(): {
  success: boolean;
  providers: Array<{ id: string; name: string; available: boolean }>;
} {
  const providers = getAvailableProviders();
  return {
    success: true,
    providers: providers.map((p) => ({
      id: p.id,
      name: p.name,
      available: p.isAvailable(),
    })),
  };
}
