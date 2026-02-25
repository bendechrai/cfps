# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

CFP Tracker is a Next.js web app that aggregates Call for Papers (CFP) data from multiple conference listing sources, deduplicates them into canonical events, and lets speakers track their submission status. User submission status is stored in localStorage only (no server-side tracking).

## Commands

```bash
npm run dev              # Start dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npm run db:migrate:dev   # Create and apply a new migration
npm run db:migrate:deploy # Apply existing migrations (production)
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset the database
```

There are no tests. The `vercel-build` script runs `prisma generate && prisma migrate deploy && next build` for deployment.

## Environment Variables

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cfps?schema=public"
ARCJET_KEY=ajkey_...
ALLOWED_ORIGINS=http://localhost:3000,...
```

## Architecture

### Data Pipeline

Data flows through three stages, each with a corresponding API endpoint:

1. **`/api/update-source`** - Fetches raw data from one external source per call, storing it in `CFPCache` (raw JSON) and `Event` (normalized records). Prioritizes uncached sources, then stale cache (>1 hour old).

2. **`/api/deduplicate`** - Merges `Event` records into `CanonicalEvent` records by comparing URLs and dates.

3. **`/api/cfps`** - Returns `CanonicalEvent` records with future CFP end dates to the frontend.

### Database Schema (Prisma + PostgreSQL)

- **CFPCache** - Raw JSON responses from external sources (one row per source)
- **Event** - Normalized CFP data per source; unique on `(source, sourceId)`
- **CanonicalEvent** - Deduplicated single record per conference, aggregated from multiple sources

Always use `prisma migrate dev` to create migrations during development. Never use `prisma db push`.

### Data Sources (`src/services/cfp/sources/`)

Six sources are implemented, each implementing `ICFPSource<T>` from `src/services/cfp/types.ts`:
- `getName()` - identifier string
- `fetchRawData()` - fetch and parse from external API/HTML
- `transformRawDataToCFPs()` - normalize to the common `CFP` type

Sources include Confs.tech (Algolia API), Codosaurus (HTML scraping), Joind.in (REST API), Papercall.io (scraping), Developers.events, and AdatoSystems.

### Frontend

- `src/contexts/CFPContext.tsx` - fetches canonical events from `/api/cfps`, manages submission status from localStorage
- `src/contexts/FilterContext.tsx` - search/filter state (persisted to localStorage)
- Components in `src/components/` are client components rendering CFP cards, filter bar, and select controls

### API Security

All API routes use Arcjet for bot detection and rate limiting. `/api/cfps` also checks CORS against `ALLOWED_ORIGINS`.
