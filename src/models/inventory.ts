/**
 * IAB Deals API v1.0 - Inventory Model
 * Inventory targeting parameters per IAB Deal Sync API v1.0
 */

import { z } from "zod";
import { IncludedInventory } from "./enums.js";

/** Inventory schema - optional 1:1 with Deal */
export const InventorySchema = z.object({
  /** Included inventory types: 1=App, 2=Site, 3=CTV, 4=DOOH, 5=Audio, 6=Social */
  inclInventory: z.array(z.nativeEnum(IncludedInventory)).default([]).describe("Included inventory types"),

  /** Device type codes */
  deviceType: z.array(z.number().int()).default([]).describe("Device type codes"),

  /** Seller IDs (max 64) */
  sellerIds: z.array(z.string()).max(64).default([]).describe("Seller IDs (max 64)"),

  /** Site domains */
  siteDomains: z.array(z.string()).default([]).describe("Site domains"),

  /** App bundle IDs */
  appBundles: z.array(z.string()).default([]).describe("App bundle IDs"),

  /** IAB content categories */
  cat: z.array(z.string()).default([]).describe("IAB content categories"),

  /** Content category taxonomy (e.g., IAB taxonomy version) */
  catTax: z.number().int().nullable().default(null).describe("Content category taxonomy"),

  /** Extension object for custom fields */
  ext: z.record(z.unknown()).nullable().default(null).describe("Extension object"),
});

export type Inventory = z.infer<typeof InventorySchema>;

/** Request schema for inventory targeting */
export const InventoryRequestSchema = InventorySchema.partial();

export type InventoryRequest = z.infer<typeof InventoryRequestSchema>;
