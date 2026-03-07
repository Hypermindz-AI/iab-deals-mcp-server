/**
 * IAB Deals API v1.0 - Terms Model
 * Pricing and timing terms for a deal
 */

import { z } from "zod";
import { PriceType } from "./enums.js";

/** Terms schema - embedded 1:1 with Deal */
export const TermsSchema = z.object({
  /** Minimum CPM price in specified currency */
  dealFloor: z.number().min(0).describe("Minimum CPM price"),

  /** ISO-4217 currency code (default: USD) */
  currency: z.string().length(3).default("USD").describe("ISO-4217 currency code"),

  /** Price type: 1=floor (minimum), 2=fixed */
  priceType: z.nativeEnum(PriceType).default(PriceType.FLOOR).describe("1=floor, 2=fixed"),

  /** Deal start date (ISO-8601 UTC) */
  startDate: z.string().datetime().describe("Deal start date ISO-8601"),

  /** Deal end date (ISO-8601 UTC, null for evergreen) */
  endDate: z.string().datetime().nullable().default(null).describe("Deal end date, null=evergreen"),
});

export type Terms = z.infer<typeof TermsSchema>;

/** Request schema for creating/updating terms */
export const TermsRequestSchema = TermsSchema.partial().extend({
  dealFloor: z.number().min(0),
});

export type TermsRequest = z.infer<typeof TermsRequestSchema>;
