/**
 * IAB Deals MCP Server - Provider Base Interface
 * Abstract interface for DSP/SSP providers
 */

import type { Deal, BuyerSeat, ProviderResponse } from "../models/index.js";

/** Provider interface - implement for each DSP/SSP */
export interface DealProvider {
  /** Provider identifier */
  readonly id: string;

  /** Provider display name */
  readonly name: string;

  /** Check if provider is available/configured */
  isAvailable(): boolean;

  /** Send deal to provider for approval */
  sendDeal(deal: Deal, seatId: string): Promise<ProviderResponse>;

  /** Check deal status on provider */
  checkStatus(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse>;

  /** Pause deal on provider */
  pauseDeal(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse>;

  /** Resume deal on provider */
  resumeDeal(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse>;
}

/** Base class with common functionality */
export abstract class BaseDealProvider implements DealProvider {
  abstract readonly id: string;
  abstract readonly name: string;

  abstract isAvailable(): boolean;
  abstract sendDeal(deal: Deal, seatId: string): Promise<ProviderResponse>;
  abstract checkStatus(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse>;
  abstract pauseDeal(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse>;
  abstract resumeDeal(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse>;

  /** Generate error response */
  protected errorResponse(message: string): ProviderResponse {
    return {
      success: false,
      providerId: this.id,
      platformDealId: null,
      status: "error",
      message,
    };
  }

  /** Generate success response */
  protected successResponse(
    status: string,
    platformDealId?: string,
    message?: string
  ): ProviderResponse {
    return {
      success: true,
      providerId: this.id,
      platformDealId: platformDealId || null,
      status,
      message,
    };
  }
}
