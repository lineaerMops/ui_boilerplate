# HubSpot Public App & UI Extensions Default Setup

A strict, repeatable default setup for creating HubSpot Public Apps with OAuth and UI Extensions (Cards) that connect to external backends.

## Overview

This repository contains:
- **Rules**: Strict constraints for UI Extensions, backend, and OAuth
- **Tasks**: Step-by-step setup instructions
- **Skills**: Reusable skills for common operations
- **Schema Discovery**: Complete strategy for discovering CRM schemas and properties

## Quick Start

1. **Read the Rules**: Start with `rules/hubspot.rules.md` to understand constraints
2. **Follow the Tasks**: Execute `tasks/default-setup.md` step-by-step
3. **Use the Skills**: Reference `skills/` directory for reusable operations

## Structure

```
.
├── rules/
│   └── hubspot.rules.md          # Strict rules and constraints
├── tasks/
│   └── default-setup.md          # Step-by-step setup tasks
├── skills/
│   ├── discover-crm-schema.md    # Discover CRM object schemas
│   ├── discover-crm-properties.md # Discover object properties
│   ├── generate-ui-card.md        # Generate UI cards from schema
│   ├── add-action-button.md       # Add POST action buttons
│   ├── bind-object-type.md        # Bind cards to object types
│   └── schema-discovery-strategy.md # Complete discovery strategy
└── README.md
```

## Key Principles

- **UI Extensions**: Pure renderers using only `@hubspot/ui-extensions` and `hubspot.fetch()`
- **Backend**: Owns OAuth, tokens, schema discovery, and business logic
- **No Enterprise Required**: Works without HubSpot Enterprise subscription
- **Portal-Aware**: All operations scoped by `hub_id`
- **Conservative**: Only documented APIs and behaviors

## Vercel + HubSpot End-to-End Guide

This repo now includes a Vercel backend (serverless) in `api/` and a HubSpot
Developer Project in `hs-project/`.

### 1) Environment Variables (Vercel)

Create these environment variables in Vercel:

- `HUBSPOT_CLIENT_ID`
- `HUBSPOT_CLIENT_SECRET`
- `HUBSPOT_REDIRECT_URI` (e.g. `https://<vercel-app>.vercel.app/oauth/callback`)
- `N8N_WEBHOOK_URL` (optional)

### 2) Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, import the GitHub repo.
3. Framework preset: "Other".
4. The API will deploy as serverless routes under:
   - `/api/oauth/callback`
   - `/api/action`

### 3) Update HubSpot App Config

Edit `hs-project/src/app/app-hsmeta.json`:

- `auth.redirectUrls`: set to your Vercel callback URL
- `permittedUrls.fetch`: include your Vercel base URL

Edit `hs-project/src/app/cards/NewCard.tsx`:

- Update `hubspot.fetch("https://your-backend.example.com/action")` to your Vercel URL

### 4) Upload Project to HubSpot

From the project directory:

```
cd /Users/benjaminnygaard/Documents/Code/ui_demo/hs-project
hs project upload
```

### 5) Install the App (OAuth)

Generate an install URL:

```
https://app.hubspot.com/oauth/authorize
?client_id=YOUR_CLIENT_ID
&redirect_uri=YOUR_REDIRECT_URL
&scope=oauth+crm.objects.tickets.read+crm.objects.tickets.write
```

Open it in a browser and approve. HubSpot redirects to your Vercel callback
endpoint which exchanges the code for tokens.

### 6) Verify in CRM

Open a Ticket record and confirm the card appears in the sidebar. Click the
button and confirm `/api/action` receives a request.

## Requirements

- HubSpot Developer Account
- External backend (HTTPS) for OAuth callback and action endpoints
- Node.js and npm for UI Extension development
- HubSpot CLI (optional, for deployment)

## Documentation Scope

Based on official HubSpot documentation:
- Public Apps & OAuth
- UI Extensions (cards, fetch limitations, auth model)
- CRM Schemas & Properties APIs
- App installation & environment handling

## License

This is a documentation and setup guide. Use as needed for your HubSpot integrations.
