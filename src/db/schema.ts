/**
 * IAB Deals MCP Server - Database Schema
 * SQLite schema definitions
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
  ad_types TEXT NOT NULL, -- JSON array
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
  price_type INTEGER NOT NULL DEFAULT 1,
  start_date TEXT NOT NULL,
  end_date TEXT,
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

-- Inventory table (1:1 with deals, optional)
CREATE TABLE IF NOT EXISTS inventory (
  deal_id TEXT PRIMARY KEY,
  geo_countries TEXT, -- JSON array
  geo_regions TEXT, -- JSON array
  publisher_ids TEXT, -- JSON array
  site_ids TEXT, -- JSON array
  FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
);

-- Buyer seats table (1:many with deals)
CREATE TABLE IF NOT EXISTS buyer_seats (
  id TEXT PRIMARY KEY,
  deal_id TEXT NOT NULL,
  seat_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  buyer_status INTEGER NOT NULL DEFAULT 0,
  accepted_at TEXT,
  rejection_reason TEXT,
  platform_deal_id TEXT,
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
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS terms;
DROP TABLE IF EXISTS deals;
DROP TABLE IF EXISTS organizations;
`;
