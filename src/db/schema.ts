/**
 * IAB Deals MCP Server - Database Schema
 * SQLite schema definitions per IAB Deal Sync API v1.0
 */

/** SQL to create all tables */
export const CREATE_TABLES_SQL = `
-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  external_deal_id TEXT NOT NULL UNIQUE,
  origin TEXT NOT NULL,
  name TEXT NOT NULL,
  seller TEXT NOT NULL,
  description TEXT,
  seller_status INTEGER NOT NULL DEFAULT 2,
  ad_types TEXT NOT NULL DEFAULT '[]', -- JSON array, empty = all types
  wseat TEXT DEFAULT '[]', -- JSON array of whitelisted buyer seat IDs
  bseat TEXT DEFAULT '[]', -- JSON array of blocked buyer seat IDs
  auxdata INTEGER, -- AuxData enum (0-4)
  pubcount INTEGER, -- PubCount enum (0-2)
  dinventory INTEGER, -- DynamicInventory enum (0-2)
  ext TEXT, -- JSON extension object
  organization_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Terms table (1:1 with deals)
CREATE TABLE IF NOT EXISTS terms (
  deal_id TEXT PRIMARY KEY,
  deal_floor REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  price_type INTEGER NOT NULL DEFAULT 2, -- SECOND_PRICE_PLUS per spec
  start_date TEXT NOT NULL,
  end_date TEXT,
  countries TEXT DEFAULT '[]', -- JSON array of ISO-3166-1 alpha-3 codes
  guar INTEGER, -- Guaranteed enum (0-1)
  units INTEGER, -- Total impressions
  totalcost REAL, -- Total cost
  ext TEXT, -- JSON extension object
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

-- Inventory table (1:1 with deals, optional)
CREATE TABLE IF NOT EXISTS inventory (
  deal_id TEXT PRIMARY KEY,
  incl_inventory TEXT DEFAULT '[]', -- JSON array of IncludedInventory enum values
  device_type TEXT DEFAULT '[]', -- JSON array of device type codes
  seller_ids TEXT DEFAULT '[]', -- JSON array of seller IDs (max 64)
  site_domains TEXT DEFAULT '[]', -- JSON array of site domains
  app_bundles TEXT DEFAULT '[]', -- JSON array of app bundle IDs
  cat TEXT DEFAULT '[]', -- JSON array of IAB content categories
  cat_tax INTEGER, -- Content category taxonomy
  ext TEXT, -- JSON extension object
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

-- Curation table (1:1 with deals, optional)
CREATE TABLE IF NOT EXISTS curation (
  deal_id TEXT PRIMARY KEY,
  curator TEXT, -- Curator name/identifier
  cdealid TEXT, -- Curator's deal ID
  curfeetype INTEGER, -- CurationFeeType enum (0-4)
  ext TEXT, -- JSON extension object
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

-- Buyer seats table (1:many with deals)
CREATE TABLE IF NOT EXISTS buyer_seats (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL,
  seat_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  buyer_status INTEGER NOT NULL DEFAULT 0,
  approved_at TEXT,
  rejection_reason TEXT,
  platform_deal_id TEXT,
  ext TEXT, -- JSON extension object
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

-- Status history table (audit trail)
CREATE TABLE IF NOT EXISTS status_history (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL,
  previous_status INTEGER,
  new_status INTEGER NOT NULL,
  changed_by TEXT NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  reason TEXT,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deals_organization ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_deals_seller_status ON deals(seller_status);
CREATE INDEX IF NOT EXISTS idx_deals_external_id ON deals(external_deal_id);
CREATE INDEX IF NOT EXISTS idx_buyer_seats_deal ON buyer_seats(deal_id);
CREATE INDEX IF NOT EXISTS idx_buyer_seats_provider ON buyer_seats(provider_id);
CREATE INDEX IF NOT EXISTS idx_status_history_deal ON status_history(deal_id);
`;

/** SQL to drop all tables (for testing) */
export const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS status_history;
DROP TABLE IF EXISTS buyer_seats;
DROP TABLE IF EXISTS curation;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS terms;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS organizations;
`;
