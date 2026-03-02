/**
 * IAB Deals API v1.0 - Terms Model
 * Pricing and timing terms for a deal per IAB Deal Sync API v1.0
 */

import { z } from "zod";
import { PriceType, Guaranteed } from "./enums.js";

/** Terms schema - embedded 1:1 with Deal */
export const TermsSchema = z.object({
  /** Minimum CPM price in specified currency */
  dealFloor: z.number().min(0).describe("Minimum CPM price"),

  /** ISO-4217 currency code (default: USD) */
  currency: z.string().length(3).default("USD").describe("ISO-4217 currency code"),

  /** Price type: 0=Dynamic, 1=First Price, 2=Second Price Plus (default), 3=Fixed */
  priceType: z.nativeEnum(PriceType).default(PriceType.SECOND_PRICE_PLUS).describe("0=Dynamic, 1=First Price, 2=Second Price Plus, 3=Fixed"),

  /** Deal start date (ISO-8601 UTC) */
  startDate: z.string().datetime().describe("Deal start date ISO-8601"),

  /** Deal end date (ISO-8601 UTC, null for evergreen) */
  endDate: z.string().datetime().nullable().default(null).describe("Deal end date, null=evergreen"),

  /** ISO-3166-1 alpha-3 country codes */
  countries: z.array(z.string()).default([]).describe("ISO-3166-1 alpha-3 country codes"),

  /** Guaranteed flag: 0=Non-guaranteed, 1=Guaranteed */
  guar: z.nativeEnum(Guaranteed).nullable().default(null).describe("0=Non-guaranteed, 1=Guaranteed"),

  /** Total number of units (impressions) */
  units: z.number().int().nullable().default(null).describe("Total number of units (impressions)"),

  /** Total cost of the deal */
  totalCost: z.number().nullable().default(null).describe("Total cost of the deal"),

  /** Extension object for custom fields */
  ext: z.record(z.unknown()).nullable().default(null).describe("Extension object"),
});

export type Terms = z.infer<typeof TermsSchema>;

/** Request schema for creating/updating terms */
export const TermsRequestSchema = TermsSchema.partial().extend({
  dealFloor: z.number().min(0),
});

export type TermsRequest = z.infer<typeof TermsRequestSchema>;
