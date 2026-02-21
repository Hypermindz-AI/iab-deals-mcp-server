/**
 * IAB Deals MCP Server - Mock Provider
 * Simulated DSP/SSP for demo and testing
 */

import { BaseDealProvider } from "./base.js";
import type { Deal, BuyerSeat, ProviderResponse } from "../models/index.js";

/** Simulated delay range in ms */
const MIN_DELAY = 200;
const MAX_DELAY = 800;

/** Simulated acceptance rate (90% accept) */
const ACCEPT_RATE = 0.9;

export class MockProvider extends BaseDealProvider {
  readonly id = "mock";
  readonly name = "Mock Provider (Demo)";

  isAvailable(): boolean {
    return true; // Always available
  }

  async sendDeal(deal: Deal, seatId: string): Promise<ProviderResponse> {
    await this.simulateLatency();

    // Simulate acceptance/rejection
    const accepted = Math.random() < ACCEPT_RATE;
    const platformDealId = `MOCK-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    if (accepted) {
      return this.successResponse(
        "pending_approval",
        platformDealId,
        `Deal submitted successfully. Mock platform deal ID: ${platformDealId}`
      );
    } else {
      return {
        success: false,
        providerId: this.id,
        platformDealId: null,
        status: "rejected",
        message: "Deal rejected: Mock provider simulation (10% rejection rate for testing)",
      };
    }
  }

  async checkStatus(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse> {
    await this.simulateLatency();

    // Simulate different statuses based on time since creation
    const createdAt = new Date(buyerSeat.createdAt).getTime();
    const now = Date.now();
    const ageSeconds = (now - createdAt) / 1000;

    let status: string;
    let message: string;

    if (ageSeconds < 30) {
      status = "pending";
      message = "Deal is pending approval";
    } else if (ageSeconds < 60) {
      status = "approved";
      message = "Deal has been approved by buyer";
    } else {
      status = "active";
      message = "Deal is actively serving impressions";
    }

    return this.successResponse(status, buyerSeat.platformDealId || undefined, message);
  }

  async pauseDeal(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse> {
    await this.simulateLatency();
    return this.successResponse("paused", buyerSeat.platformDealId || undefined, "Deal paused successfully");
  }

  async resumeDeal(deal: Deal, buyerSeat: BuyerSeat): Promise<ProviderResponse> {
    await this.simulateLatency();
    return this.successResponse("active", buyerSeat.platformDealId || undefined, "Deal resumed successfully");
  }

  /** Simulate network latency */
  private async simulateLatency(): Promise<void> {
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
}
