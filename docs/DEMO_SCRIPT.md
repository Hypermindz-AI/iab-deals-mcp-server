# IAB Deals MCP Server - Demo Script

**Event:** IAB Tech Lab Bootcamp - March 12, 2026
**Duration:** 10-15 minutes

---

## Setup (Before Demo)

1. Ensure Claude Desktop is running with `iab-deals` MCP server configured
2. Delete existing demo database for fresh start:
   ```bash
   rm -f data/deals.db
   ```
3. Restart Claude Desktop to seed fresh demo data

---

## Demo Flow

### 1. Introduction (1 min)

> "Today I'll demonstrate an MCP server that implements the IAB Deals API v1.0. This allows AI agents to manage programmatic advertising deals using natural language, while maintaining full compliance with industry standards."

### 2. List Existing Deals (2 min)

**Prompt Claude:**
> "List all available programmatic deals"

**Expected Response:** Shows 5 demo deals:
- Q1 Premium CTV Campaign ($35 CPM)
- Holiday Retail PMP 2026 ($28 CPM)
- DOOH Sports Venue Network ($45 CPM)
- Premium Podcast Network ($18 CPM)
- Gaming & Esports Sponsorship ($22 CPM)

**Talking Point:**
> "The server comes pre-loaded with realistic sample deals across CTV, display, DOOH, audio, and gaming inventory."

### 3. Create a New Deal (3 min)

**Prompt Claude:**
> "Create a new programmatic deal for our summer video campaign. We need $30 CPM floor price for video ads starting June 1st 2026. The deal is for our premium entertainment inventory on streaming.example.com."

**Expected Response:** New deal created with:
- Status: PENDING
- External Deal ID: IAB-xxx-xxx
- Ad Types: Video (2)
- Deal Floor: $30.00

**Talking Point:**
> "Notice the AI agent converted natural language requirements into IAB-compliant data structures. The deal ID follows IAB conventions."

### 4. Send to Provider (2 min)

**Prompt Claude:**
> "Send this deal to our DSP partner for approval. Use seat ID 'summer-campaign-001'"

**Expected Response:** Deal sent successfully
- Provider: Mock Provider
- Buyer Status: PENDING
- Platform Deal ID assigned

**Talking Point:**
> "In production, this would integrate with The Trade Desk, DV360, or other DSPs via their APIs. The mock provider simulates realistic latency and response patterns."

### 5. Check Status (1 min)

**Prompt Claude:**
> "What's the current status of my summer campaign deal?"

**Expected Response:** Shows:
- Seller Status: Active
- Buyer Status: Pending/Accepted
- Platform Deal ID

### 6. Confirm the Deal (1 min)

**Prompt Claude:**
> "Confirm and activate the summer campaign deal"

**Expected Response:** Deal activated
- Status: ACTIVE
- Buyer Seat: ACCEPTED

### 7. Pause/Resume (2 min)

**Prompt Claude:**
> "Pause the summer campaign deal - we need to adjust creative"

**Expected Response:** Deal paused

**Then:**
> "Resume the summer campaign"

**Expected Response:** Deal resumed

**Talking Point:**
> "Full lifecycle management through natural language. Every action is logged with audit trails."

### 8. Architecture Overview (2 min)

**Show diagram or explain:**
> "The architecture follows a clean separation:
> - MCP layer handles AI agent communication
> - Provider abstraction enables DSP/SSP integrations
> - SQLite for demo, but can swap to PostgreSQL or Turso
> - All data models use Zod schemas matching IAB spec"

---

## Key Messages

1. **Standards Compliance:** Built on IAB Deals API v1.0 specification
2. **AI-Native:** Designed for agentic workflows from the ground up
3. **Extensible:** Add real providers without changing the core
4. **Open Source:** Reference implementation for the community
5. **Production Ready:** TypeScript, proper error handling, audit logging

---

## Handling Q&A

**Q: How does authentication work?**
> "Two layers: API key for MCP server access, and per-provider OAuth2/API keys for DSP/SSP integrations."

**Q: What providers are supported?**
> "Currently mock provider for demo. Real integrations planned"

**Q: Can this run on Vercel/serverless?**
> "Yes! TypeScript + SQLite (Turso) means easy edge deployment. The mock provider has no external dependencies."

**Q: How does this relate to A2A (Agent-to-Agent)?**
> "MCP is the client-to-server protocol. A2A would be server-to-server. This implementation can evolve to support both."

---

## Fallback Scenarios

**If demo fails:**
1. Show the code structure and explain architecture
2. Walk through the README documentation
3. Show the ERD diagrams from the IAB Tech Lab folder

**If network issues:**
- All functionality is local (SQLite + mock provider)
- No external APIs required for demo

---

## Post-Demo Resources

Share these links:
- GitHub: https://github.com/Hypermindz-AI/iab-deals-mcp-server
- IAB Deals API Spec: https://iabtechlab.com/standards/deals-api/
- MCP Documentation: https://modelcontextprotocol.io/

---

*Last Updated: 2026-02-21*
