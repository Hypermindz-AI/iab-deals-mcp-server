import { describe, it, expect } from "vitest";
import {
  getProvider,
  getAvailableProviders,
  listProviderIds,
  isProviderAvailable,
} from "../../providers/registry.js";

describe("Provider Registry", () => {
  describe("getProvider", () => {
    it("returns mock provider", () => {
      const provider = getProvider("mock");
      expect(provider).not.toBeNull();
      expect(provider!.id).toBe("mock");
      expect(provider!.name).toBe("Mock Provider (Demo)");
    });

    it("returns null for unknown provider", () => {
      expect(getProvider("nonexistent")).toBeNull();
    });
  });

  describe("getAvailableProviders", () => {
    it("returns at least the mock provider", () => {
      const providers = getAvailableProviders();
      expect(providers.length).toBeGreaterThanOrEqual(1);
      const ids = providers.map((p) => p.id);
      expect(ids).toContain("mock");
    });

    it("only returns providers that are available", () => {
      const providers = getAvailableProviders();
      for (const p of providers) {
        expect(p.isAvailable()).toBe(true);
      }
    });
  });

  describe("listProviderIds", () => {
    it("returns array containing mock", () => {
      const ids = listProviderIds();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids).toContain("mock");
    });
  });

  describe("isProviderAvailable", () => {
    it("returns true for mock", () => {
      expect(isProviderAvailable("mock")).toBe(true);
    });

    it("returns false for unknown", () => {
      expect(isProviderAvailable("nonexistent")).toBe(false);
    });
  });
});
