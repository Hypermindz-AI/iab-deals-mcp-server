/**
 * IAB Deals API v1.0 - Deal Model
 * Core deal entity following IAB specification
 */

import { z } from "zod";
import { AdType, SellerStatus } from "./enums.js";
import { TermsSchema, TermsRequestSchema } from "./terms.js";
import { InventorySchema, InventoryRequestSchema } from "./inventory.js";
import { BuyerSeatSchema } from "./buyer-seat.js";

/** Full Deal schema */
export const DealSchema = z.object({
  /** Internal unique identifier */
  id: z.string().uuid().describe("Internal deal ID"),

  /** IAB external deal identifier */
  externalDealId: z.string().describe("IAB deal identifier"),

  /** Domain receiving bid responses */
  origin: z.string().describe("Domain receiving bid responses"),

  /** Human-readable deal name */
  name: z.string().min(1).max(255).describe("Deal name"),

  /** Business entity sourcing demand */
  seller: z.string().describe("Seller name"),

  /** Brief description (max 250 chars) */
  description: z.string().max(250).nullable().default(null),

  /** Seller status: 0=active, 1=paused, 2=pending, 4=complete */
  sellerStatus: z.nativeEnum(SellerStatus).default(SellerStatus.PENDING),

  /** Ad format types: 1=Banner, 2=Video, 3=Audio, 4=Native */
  adTypes: z.array(z.nativeEnum(AdType)).min(1).describe("Supported ad formats"),

  /** Organization/owner ID */
  organizationId: z.string().uuid().describe("Owner organization ID"),

  /** Deal terms (pricing, timing) */
  terms: TermsSchema,

  /** Inventory targeting (optional) */
  inventory: InventorySchema.nullable().default(null),

  /** Buyer seats (populated when sent to providers) */
  buyerSeats: z.array(BuyerSeatSchema).default([]),

  /** Creation timestamp */
  createdAt: z.string().datetime(),

  /** Last update timestamp */
  updatedAt: z.string().datetime(),
});

export type Deal = z.infer<typeof DealSchema>;

/** Request schema for creating a deal */
export const DealCreateRequestSchema = z.object({
  /** Human-readable deal name */
  name: z.string().min(1).max(255).describe("Deal name"),

  /** Domain receiving bid responses */
  origin: z.string().describe("Domain receiving bid responses"),

  /** Business entity sourcing demand */
  seller: z.string().describe("Seller name"),

  /** Brief description (max 250 chars) */
  description: z.string().max(250).optional(),

  /** Ad format types */
  adTypes: z.array(z.nativeEnum(AdType)).min(1).describe("Supported ad formats"),

  /** Deal terms */
  terms: TermsRequestSchema,

  /** Inventory targeting (optional) */
  inventory: InventoryRequestSchema.optional(),
});

export type DealCreateRequest = z.infer<typeof DealCreateRequestSchema>;

/** Request schema for updating a deal */
export const DealUpdateRequestSchema = z.object({
  /** Deal ID to update */
  id: z.string().uuid(),

  /** Fields to update */
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(250).optional(),
  adTypes: z.array(z.nativeEnum(AdType)).min(1).optional(),
  terms: TermsRequestSchema.partial().optional(),
  inventory: InventoryRequestSchema.optional(),
});

export type DealUpdateRequest = z.infer<typeof DealUpdateRequestSchema>;

/** Response for deal operations */
export const DealResponseSchema = z.object({
  success: z.boolean(),
  deal: DealSchema.optional(),
  error: z.string().optional(),
});

export type DealResponse = z.infer<typeof DealResponseSchema>;

/** Response for list operations */
export const DealListResponseSchema = z.object({
  success: z.boolean(),
  deals: z.array(DealSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export type DealListResponse = z.infer<typeof DealListResponseSchema>;
