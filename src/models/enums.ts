/**
 * IAB Deals API v1.0 - Enumeration Types
 * Based on IAB Tech Lab Deal Sync API v1.0 specification
 * https://github.com/IABTechLab/deal-api/blob/develop/deal1.0.md
 */

/** Seller status codes per IAB Deal Sync API v1.0 */
export enum SellerStatus {
  ACTIVE = 0,
  PAUSED = 1,
  PENDING = 2,
  COMPLETE = 4,
  ARCHIVED = 5,
}

/** Buyer status codes per IAB Deal Sync API v1.0 */
export enum BuyerStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  READY_TO_SERVE = 3,
  ACTIVE = 4,
  PAUSED = 5,
  COMPLETE = 6,
}

/** Ad format types per IAB spec */
export enum AdType {
  BANNER = 1,
  VIDEO = 2,
  AUDIO = 3,
  NATIVE = 4,
}

/** Price type per IAB Deal Sync API v1.0 */
export enum PriceType {
  DYNAMIC = 0,
  FIRST_PRICE = 1,
  SECOND_PRICE_PLUS = 2,  // Default per spec
  FIXED = 3,
}

/** Auxiliary data signaling per IAB Deal Sync API v1.0 */
export enum AuxData {
  NO_SIGNAL = 0,
  DEAL_ID_ONLY = 1,
  DEAL_ID_AND_SEAT = 2,
  FULL_BID_REQUEST = 3,
  CUSTOM = 4,
}

/** Publisher count per IAB Deal Sync API v1.0 */
export enum PubCount {
  SINGLE = 0,
  MULTIPLE_KNOWN = 1,
  MULTIPLE_UNKNOWN = 2,
}

/** Dynamic inventory flag per IAB Deal Sync API v1.0 */
export enum DynamicInventory {
  STATIC = 0,
  DYNAMIC_ADDITION = 1,
  DYNAMIC_REMOVAL = 2,
}

/** Included inventory type per IAB Deal Sync API v1.0 */
export enum IncludedInventory {
  APP = 1,
  SITE = 2,
  CTV = 3,
  DOOH = 4,
  AUDIO = 5,
  SOCIAL = 6,
}

/** Curation fee type per IAB Deal Sync API v1.0 */
export enum CurationFeeType {
  NONE = 0,
  FLAT_CPM = 1,
  PERCENT_MEDIA = 2,
  PERCENT_DATA = 3,
  INCLUDED = 4,
}

/** Guaranteed deal flag per IAB Deal Sync API v1.0 */
export enum Guaranteed {
  NON_GUARANTEED = 0,
  GUARANTEED = 1,
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
  [SellerStatus.ARCHIVED]: "Archived",
};

export const BuyerStatusLabels: Record<BuyerStatus, string> = {
  [BuyerStatus.PENDING]: "Pending",
  [BuyerStatus.APPROVED]: "Approved",
  [BuyerStatus.REJECTED]: "Rejected",
  [BuyerStatus.READY_TO_SERVE]: "Ready to Serve",
  [BuyerStatus.ACTIVE]: "Active",
  [BuyerStatus.PAUSED]: "Paused",
  [BuyerStatus.COMPLETE]: "Complete",
};

export const PriceTypeLabels: Record<PriceType, string> = {
  [PriceType.DYNAMIC]: "Dynamic",
  [PriceType.FIRST_PRICE]: "First Price",
  [PriceType.SECOND_PRICE_PLUS]: "Second Price Plus",
  [PriceType.FIXED]: "Fixed",
};

export const AdTypeLabels: Record<AdType, string> = {
  [AdType.BANNER]: "Banner",
  [AdType.VIDEO]: "Video",
  [AdType.AUDIO]: "Audio",
  [AdType.NATIVE]: "Native",
};
