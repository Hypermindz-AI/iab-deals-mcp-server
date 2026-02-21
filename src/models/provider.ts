/**
 * IAB Deals API v1.0 - Provider Model
 * DSP/SSP provider configuration
 */

import { z } from "zod";
import { ProviderType, AuthType } from "./enums.js";

/** Provider configuration schema */
export const ProviderSchema = z.object({
  /** Provider identifier (e.g., 'ttd', 'dv360', 'freewheel', 'magnite') */
  id: z.string().describe("Provider ID"),

  /** Display name */
  name: z.string().describe("Provider display name"),

  /** Provider type: DSP or SSP */
  type: z.nativeEnum(ProviderType),

  /** REST API base URL */
  apiEndpoint: z.string().url().nullable().default(null),

  /** Authentication type */
  authType: z.nativeEnum(AuthType).nullable().default(null),

  /** Whether provider is active/available */
  active: z.boolean().default(true),
});

export type Provider = z.infer<typeof ProviderSchema>;

/** Supported providers registry */
export const SUPPORTED_PROVIDERS: Provider[] = [
  {
    id: "mock",
    name: "Mock Provider (Demo)",
    type: ProviderType.DSP,
    apiEndpoint: null,
    authType: null,
    active: true,
  },
  {
    id: "ttd",
    name: "The Trade Desk",
    type: ProviderType.DSP,
    apiEndpoint: "https://api.thetradedesk.com/v3",
    authType: AuthType.API_KEY,
    active: false, // Requires credentials
  },
  {
    id: "dv360",
    name: "Google Display & Video 360",
    type: ProviderType.DSP,
    apiEndpoint: "https://displayvideo.googleapis.com/v3",
    authType: AuthType.OAUTH2,
    active: false, // Requires credentials
  },
  {
    id: "freewheel",
    name: "FreeWheel",
    type: ProviderType.SSP,
    apiEndpoint: "https://api.freewheel.tv/deals",
    authType: AuthType.OAUTH2,
    active: false, // Requires credentials
  },
  {
    id: "magnite",
    name: "Magnite",
    type: ProviderType.SSP,
    apiEndpoint: "https://api.magnite.com/v1",
    authType: AuthType.API_KEY,
    active: false, // Requires credentials
  },
];

/** Provider response from sending a deal */
export const ProviderResponseSchema = z.object({
  success: z.boolean(),
  providerId: z.string(),
  platformDealId: z.string().nullable(),
  status: z.string(),
  message: z.string().optional(),
  rawResponse: z.unknown().optional(),
});

export type ProviderResponse = z.infer<typeof ProviderResponseSchema>;
