/**
 * IAB Deals API v1.0 - Enumeration Types
 * Based on IAB Tech Lab Deals API specification
 */

/** Seller status codes per IAB spec */
export enum SellerStatus {
  ACTIVE = 0,
  PAUSED = 1,
  PENDING = 2,
  COMPLETE = 4,
}

/** Buyer status codes per IAB spec */
export enum BuyerStatus {
  PENDING = 0,
  ACCEPTED = 1,
  REJECTED = 2,
  EXPIRED = 3,
  PAUSED = 4,
  ERROR = 5,
}

/** Ad format types per IAB spec */
export enum AdType {
  BANNER = 1,
  VIDEO = 2,
  AUDIO = 3,
  NATIVE = 4,
}

/** Price type per IAB spec */
export enum PriceType {
  FLOOR = 1,    // Minimum CPM price
  FIXED = 2,    // Fixed CPM price
}

/** Provider types */
export enum ProviderType {
  DSP = "DSP",  // Demand Side Platform
  SSP = "SSP",  // Supply Side Platform
}

/** Authentication types for providers */
export enum AuthType {
  OAUTH2 = "OAuth2",
  API_KEY = "APIKey",
}

/** Human-readable labels */
export const SellerStatusLabels: Record<SellerStatus, string> = {
  [SellerStatus.ACTIVE]: "Active",
  [SellerStatus.PAUSED]: "Paused",
  [SellerStatus.PENDING]: "Pending",
  [SellerStatus.COMPLETE]: "Complete",
};

export const BuyerStatusLabels: Record<BuyerStatus, string> = {
  [BuyerStatus.PENDING]: "Pending",
  [BuyerStatus.ACCEPTED]: "Accepted",
  [BuyerStatus.REJECTED]: "Rejected",
  [BuyerStatus.EXPIRED]: "Expired",
  [BuyerStatus.PAUSED]: "Paused",
  [BuyerStatus.ERROR]: "Error",
};

export const AdTypeLabels: Record<AdType, string> = {
  [AdType.BANNER]: "Banner",
  [AdType.VIDEO]: "Video",
  [AdType.AUDIO]: "Audio",
  [AdType.NATIVE]: "Native",
};
