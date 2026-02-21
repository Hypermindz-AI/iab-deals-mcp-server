/**
 * IAB Deals MCP Server - Tool Definitions
 * All 8 MCP tools for deal management
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
  adTypes: z.array(z.nativeEnum(AdType)).min(1).describe("Ad formats: 1=Banner, 2=Video, 3=Audio, 4=Native"),
  dealFloor: z.number().min(0).describe("Minimum CPM price"),
  currency: z.string().length(3).default("USD").describe("ISO-4217 currency code"),
  priceType: z.nativeEnum(PriceType).default(PriceType.FLOOR).describe("1=floor, 2=fixed"),
  startDate: z.string().datetime().describe("Deal start date (ISO-8601)"),
  endDate: z.string().datetime().nullable().optional().describe("Deal end date (null=evergreen)"),
  geoCountries: z.array(z.string()).optional().describe("ISO-3166-1 alpha-3 country codes"),
  geoRegions: z.array(z.string()).optional().describe("ISO-3166-2 region codes"),
});

export type DealsCreateInput = z.infer<typeof dealsCreateSchema>;

export function dealsCreate(input: DealsCreateInput): DealResponse {
  try {
    const deal = createDeal(
      input.name,
      input.origin,
      input.seller,
      input.adTypes,
      {
        dealFloor: input.dealFloor,
        currency: input.currency || "USD",
        priceType: input.priceType || PriceType.FLOOR,
        startDate: input.startDate,
        endDate: input.endDate || null,
      },
      {
        description: input.description,
        inventory: input.geoCountries || input.geoRegions
          ? {
              geoCountries: input.geoCountries || [],
              geoRegions: input.geoRegions || [],
              publisherIds: [],
              siteIds: [],
            }
          : undefined,
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
  adTypes: z.array(z.nativeEnum(AdType)).min(1).optional().describe("New ad formats"),
  dealFloor: z.number().min(0).optional().describe("New minimum CPM"),
  currency: z.string().length(3).optional().describe("New currency code"),
  startDate: z.string().datetime().optional().describe("New start date"),
  endDate: z.string().datetime().nullable().optional().describe("New end date"),
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
      terms: {
        dealFloor: input.dealFloor,
        currency: input.currency,
        startDate: input.startDate,
        endDate: input.endDate,
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
      updateBuyerSeatStatus(buyerSeat.id, BuyerStatus.ERROR, {
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

    // Check if any buyer seats are accepted
    const acceptedSeats = deal.buyerSeats.filter(
      (s) => s.buyerStatus === BuyerStatus.ACCEPTED || s.buyerStatus === BuyerStatus.PENDING
    );

    if (acceptedSeats.length === 0) {
      return { success: false, error: "No buyer seats to confirm. Send deal to a provider first." };
    }

    // If specific buyer seat, confirm it
    if (input.buyerSeatId) {
      const seat = getBuyerSeatById(input.buyerSeatId);
      if (!seat || seat.dealId !== input.dealId) {
        return { success: false, error: `Buyer seat not found or doesn't belong to this deal` };
      }
      updateBuyerSeatStatus(input.buyerSeatId, BuyerStatus.ACCEPTED);
    } else {
      // Confirm all pending seats
      for (const seat of acceptedSeats) {
        if (seat.buyerStatus === BuyerStatus.PENDING) {
          updateBuyerSeatStatus(seat.id, BuyerStatus.ACCEPTED);
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
      if (seat.buyerStatus === BuyerStatus.ACCEPTED) {
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
          updateBuyerSeatStatus(seat.id, BuyerStatus.ACCEPTED);
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
