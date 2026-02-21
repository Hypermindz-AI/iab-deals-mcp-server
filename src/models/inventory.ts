/**
 * IAB Deals API v1.0 - Inventory Model
 * Targeting parameters for a deal
 */

import { z } from "zod";

/** Inventory schema - optional 1:1 with Deal */
export const InventorySchema = z.object({
  /** ISO-3166-1 alpha-3 country codes */
  geoCountries: z.array(z.string().length(3)).default([]).describe("ISO-3166-1 alpha-3 country codes"),

  /** ISO-3166-2 region codes */
  geoRegions: z.array(z.string()).default([]).describe("ISO-3166-2 region codes"),

  /** Allowed publisher IDs */
  publisherIds: z.array(z.string()).default([]).describe("Allowed publisher IDs"),

  /** Allowed site/app IDs */
  siteIds: z.array(z.string()).default([]).describe("Allowed site/app IDs"),
});

export type Inventory = z.infer<typeof InventorySchema>;

/** Request schema for inventory targeting */
export const InventoryRequestSchema = InventorySchema.partial();

export type InventoryRequest = z.infer<typeof InventoryRequestSchema>;
