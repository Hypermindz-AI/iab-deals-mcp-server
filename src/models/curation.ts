/**
 * IAB Deals API v1.0 - Curation Model
 * Curation details for curated deals per IAB Deal Sync API v1.0
 */

import { z } from "zod";
import { CurationFeeType } from "./enums.js";

/** Curation schema - optional 1:1 with Deal */
export const CurationSchema = z.object({
  /** Curator name/identifier */
  curator: z.string().nullable().default(null).describe("Curator name or identifier"),

  /** Curator's deal ID */
  cdealId: z.string().nullable().default(null).describe("Curator's deal ID"),

  /** Curation fee type: 0=None, 1=Flat CPM, 2=% Media, 3=% Data, 4=Included */
  curFeeType: z.nativeEnum(CurationFeeType).nullable().default(null).describe("Curation fee type"),

  /** Extension object for custom fields */
  ext: z.record(z.unknown()).nullable().default(null).describe("Extension object"),
});

export type Curation = z.infer<typeof CurationSchema>;

/** Request schema for curation */
export const CurationRequestSchema = CurationSchema.partial();

export type CurationRequest = z.infer<typeof CurationRequestSchema>;
