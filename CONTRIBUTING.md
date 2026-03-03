# Contributing to IAB Deals MCP Server

Thank you for your interest in contributing! This project is a reference implementation for the IAB Tech Lab Agentic Task Force, and we welcome contributions from the community.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/IABTechLab/iab-deals-mcp-server.git
cd iab-deals-mcp-server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Build
npm run build

# Run in demo mode
NODE_ENV=demo SEED_DEMO_DATA=true npm start
```

### Development Workflow

```bash
# Start with hot reload
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Run tests
npm test
```

## How to Contribute

### Reporting Bugs

Open an issue using the [bug report template](https://github.com/IABTechLab/iab-deals-mcp-server/issues/new?template=bug_report.md). Include:

- Steps to reproduce
- Expected vs actual behavior
- Node.js version and OS
- Relevant log output

### Suggesting Features

Open an issue using the [feature request template](https://github.com/IABTechLab/iab-deals-mcp-server/issues/new?template=feature_request.md).

### Adding a New Provider

This is the most impactful way to contribute. See the [Adding a New Provider](README.md#adding-a-new-provider) section in the README for the interface to implement, then:

1. Create `src/providers/<provider-name>.ts`
2. Implement the `DealProvider` interface from `src/providers/base.ts`
3. Register your provider in `src/providers/registry.ts`
4. Add any required environment variables to `.env.example`
5. Update the README with provider-specific configuration

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Ensure all checks pass:
   ```bash
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```
5. Commit with a descriptive message
6. Push to your fork and open a pull request

## Code Style

- **TypeScript** with strict mode enabled
- **Zod** for runtime validation and schema definitions
- **ESM modules** (`import`/`export`, `.js` extensions in imports)
- Descriptive variable and function names
- Keep functions focused and small

## Project Structure

```
src/
├── index.ts           # MCP server entry point
├── config.ts          # Environment configuration
├── models/            # Zod schemas and TypeScript types
├── tools/             # MCP tool implementations
├── providers/         # DSP/SSP provider abstraction
└── db/                # SQLite database layer
```

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Questions?

Open a [discussion](https://github.com/IABTechLab/iab-deals-mcp-server/issues) or reach out via the IAB Tech Lab Agentic Task Force channels.
