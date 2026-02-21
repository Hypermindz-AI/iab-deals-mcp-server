/**
 * IAB Deals MCP Server - Provider Registry
 * Factory for getting provider instances
 */

import type { DealProvider } from "./base.js";
import { MockProvider } from "./mock.js";

/** Registered provider instances */
const providers: Map<string, DealProvider> = new Map();

/** Initialize providers */
function initProviders(): void {
  if (providers.size > 0) return;

  // Register mock provider
  const mock = new MockProvider();
  providers.set(mock.id, mock);

  // Future: Register real providers based on environment
  // if (process.env.TTD_API_KEY) {
  //   providers.set("ttd", new TradeDeskProvider());
  // }
}

/** Get provider by ID */
export function getProvider(id: string): DealProvider | null {
  initProviders();
  return providers.get(id) || null;
}

/** Get all available providers */
export function getAvailableProviders(): DealProvider[] {
  initProviders();
  return Array.from(providers.values()).filter((p) => p.isAvailable());
}

/** List all registered provider IDs */
export function listProviderIds(): string[] {
  initProviders();
  return Array.from(providers.keys());
}

/** Check if provider exists and is available */
export function isProviderAvailable(id: string): boolean {
  const provider = getProvider(id);
  return provider?.isAvailable() ?? false;
}
