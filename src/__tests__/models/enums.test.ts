import { describe, it, expect } from "vitest";
import {
  SellerStatus,
  BuyerStatus,
  AdType,
  PriceType,
  ProviderType,
  AuthType,
  SellerStatusLabels,
  BuyerStatusLabels,
  AdTypeLabels,
} from "../../models/enums.js";

describe("SellerStatus", () => {
  it("has IAB spec values", () => {
    expect(SellerStatus.ACTIVE).toBe(0);
    expect(SellerStatus.PAUSED).toBe(1);
    expect(SellerStatus.PENDING).toBe(2);
    expect(SellerStatus.COMPLETE).toBe(4);
  });

  it("has labels for every value", () => {
    const values = [SellerStatus.ACTIVE, SellerStatus.PAUSED, SellerStatus.PENDING, SellerStatus.COMPLETE];
    for (const v of values) {
      expect(SellerStatusLabels[v]).toBeDefined();
      expect(typeof SellerStatusLabels[v]).toBe("string");
    }
  });
});

describe("BuyerStatus", () => {
  it("has IAB spec values", () => {
    expect(BuyerStatus.PENDING).toBe(0);
    expect(BuyerStatus.ACCEPTED).toBe(1);
    expect(BuyerStatus.REJECTED).toBe(2);
    expect(BuyerStatus.EXPIRED).toBe(3);
    expect(BuyerStatus.PAUSED).toBe(4);
    expect(BuyerStatus.ERROR).toBe(5);
  });

  it("has labels for every value", () => {
    const values = [
      BuyerStatus.PENDING,
      BuyerStatus.ACCEPTED,
      BuyerStatus.REJECTED,
      BuyerStatus.EXPIRED,
      BuyerStatus.PAUSED,
      BuyerStatus.ERROR,
    ];
    for (const v of values) {
      expect(BuyerStatusLabels[v]).toBeDefined();
      expect(typeof BuyerStatusLabels[v]).toBe("string");
    }
  });
});

describe("AdType", () => {
  it("has IAB spec values", () => {
    expect(AdType.BANNER).toBe(1);
    expect(AdType.VIDEO).toBe(2);
    expect(AdType.AUDIO).toBe(3);
    expect(AdType.NATIVE).toBe(4);
  });

  it("has labels for every value", () => {
    const values = [AdType.BANNER, AdType.VIDEO, AdType.AUDIO, AdType.NATIVE];
    for (const v of values) {
      expect(AdTypeLabels[v]).toBeDefined();
    }
  });
});

describe("PriceType", () => {
  it("has IAB spec values", () => {
    expect(PriceType.FLOOR).toBe(1);
    expect(PriceType.FIXED).toBe(2);
  });
});

describe("ProviderType", () => {
  it("has DSP and SSP", () => {
    expect(ProviderType.DSP).toBe("DSP");
    expect(ProviderType.SSP).toBe("SSP");
  });
});

describe("AuthType", () => {
  it("has OAuth2 and APIKey", () => {
    expect(AuthType.OAUTH2).toBe("OAuth2");
    expect(AuthType.API_KEY).toBe("APIKey");
  });
});
