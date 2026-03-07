/**
 * IAB Deals API v1.0 - BuyerSeat Model
 * Represents a buyer's seat on a deal sent to a provider
 */

import { z } from "zod";
import { BuyerStatus } from "./enums.js";

/** BuyerSeat schema - 1:many with Deal */
export const BuyerSeatSchema = z.object({
  /** Unique identifier */
  id: z.string().uuid().describe("Buyer seat ID"),

  /** Parent deal ID */
  dealId: z.string().uuid().describe("Parent deal ID"),

  /** Buyer's seat identifier */
  seatId: z.string().describe("Buyer seat identifier"),

  /** Target provider ID (DSP/SSP) */
  providerId: z.string().describe("Target provider ID"),

  /** Buyer status: 0=pending, 1=accepted, 2=rejected, 3=expired, 4=paused, 5=error */
  buyerStatus: z.nativeEnum(BuyerStatus).default(BuyerStatus.PENDING),

  /** Timestamp when deal was accepted */
  acceptedAt: z.string().datetime().nullable().default(null),

  /** Reason for rejection (if rejected) */
  rejectionReason: z.string().nullable().default(null),

  /** Provider's internal deal ID */
  platformDealId: z.string().nullable().default(null),

  /** Creation timestamp */
  createdAt: z.string().datetime(),

  /** Last update timestamp */
  updatedAt: z.string().datetime(),
});

export type BuyerSeat = z.infer<typeof BuyerSeatSchema>;

/** Request to send deal to a provider */
export const SendDealRequestSchema = z.object({
  /** Buyer seat ID */
  seatId: z.string().describe("Buyer seat identifier"),

  /** Target provider ID */
  providerId: z.string().describe("Target provider ID (e.g., 'ttd', 'dv360', 'freewheel')"),
});

export type SendDealRequest = z.infer<typeof SendDealRequestSchema>;
