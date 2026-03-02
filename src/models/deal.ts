/**
 * IAB Deals API v1.0 - Deal Model
 * Core deal entity per IAB Deal Sync API v1.0
 */

import { z } from "zod";
import { AdType, SellerStatus, AuxData, PubCount, DynamicInventory } from "./enums.js";
import { TermsSchema, TermsRequestSchema } from "./terms.js";
import { InventorySchema, InventoryRequestSchema } from "./inventory.js";
import { BuyerSeatSchema } from "./buyer-seat.js";
import { CurationSchema, CurationRequestSchema } from "./curation.js";

/** Full Deal schema */
export const DealSchema = z.object({
  /** Internal unique identifier */
  id: z.string().uuid().describe("Internal deal ID"),

  /**
   * IAB external deal identifier.
   * Maps to spec's `deal.id` — the public deal ID shared with buyers/providers.
   */
  externalDealId: z.string().describe("IAB deal identifier (spec's deal.id)"),

  /** Domain receiving bid responses */
  origin: z.string().describe("Domain receiving bid responses"),

  /** Human-readable deal name */
  name: z.string().min(1).max(255).describe("Deal name"),

  /** Business entity sourcing demand */
  seller: z.string().describe("Seller name"),

  /** Brief description (max 250 chars) */
  description: z.string().max(250).nullable().default(null),

  /** Seller status: 0=Active, 1=Paused, 2=Pending, 4=Complete, 5=Archived */
  sellerStatus: z.nativeEnum(SellerStatus).default(SellerStatus.PENDING),

  /** Ad format types: 1=Banner, 2=Video, 3=Audio, 4=Native. Optional per spec — empty/missing = all types */
  adTypes: z.array(z.nativeEnum(AdType)).default([]).describe("Supported ad formats (empty=all)"),

  /** Whitelisted buyer seat IDs */
  wseat: z.array(z.string()).default([]).describe("Whitelisted buyer seat IDs"),

  /** Blocked buyer seat IDs */
  bseat: z.array(z.string()).default([]).describe("Blocked buyer seat IDs"),

  /** Auxiliary data signal: 0-4 per spec */
  auxData: z.nativeEnum(AuxData).nullable().default(null).describe("Auxiliary data signaling"),

  /** Publisher count: 0=Single, 1=Multiple Known, 2=Multiple Unknown */
  pubCount: z.nativeEnum(PubCount).nullable().default(null).describe("Publisher count"),

  /** Dynamic inventory: 0=Static, 1=Dynamic Addition, 2=Dynamic Removal */
  dInventory: z.nativeEnum(DynamicInventory).nullable().default(null).describe("Dynamic inventory flag"),

  /** Curation details (optional) */
  curation: CurationSchema.nullable().default(null),

  /** Extension object for custom fields */
  ext: z.record(z.unknown()).nullable().default(null).describe("Extension object"),

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

  /** Ad format types (optional — empty/missing = all types) */
  adTypes: z.array(z.nativeEnum(AdType)).optional().describe("Supported ad formats (empty=all)"),

  /** Whitelisted buyer seat IDs */
  wseat: z.array(z.string()).optional(),

  /** Blocked buyer seat IDs */
  bseat: z.array(z.string()).optional(),

  /** Auxiliary data signal */
  auxData: z.nativeEnum(AuxData).optional(),

  /** Publisher count */
  pubCount: z.nativeEnum(PubCount).optional(),

  /** Dynamic inventory flag */
  dInventory: z.nativeEnum(DynamicInventory).optional(),

  /** Curation details */
  curation: CurationRequestSchema.optional(),

  /** Extension object */
  ext: z.record(z.unknown()).optional(),

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
  adTypes: z.array(z.nativeEnum(AdType)).optional(),
  wseat: z.array(z.string()).optional(),
  bseat: z.array(z.string()).optional(),
  auxData: z.nativeEnum(AuxData).optional(),
  pubCount: z.nativeEnum(PubCount).optional(),
  dInventory: z.nativeEnum(DynamicInventory).optional(),
  curation: CurationRequestSchema.optional(),
  ext: z.record(z.unknown()).optional(),
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
