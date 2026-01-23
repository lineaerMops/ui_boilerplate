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

## Replication Checklist (Per Customer)

Use this checklist whenever you roll out to a new customer or a colleague needs
to re-run the setup from scratch.

1. **Confirm existing project**: Verify if a HubSpot project already exists in
   the target account (`hs project list` or Developer Projects UI).
2. **Confirm backend hosting**: Decide where the backend lives (Vercel or other)
   before creating the app config.
3. **Create project**: Use `hs project create` and capture the **project name**
   exactly as chosen during the prompt.
4. **Update OAuth + fetch**:
   - `hs-project/src/app/app-hsmeta.json` → redirect URL + permitted fetch base
   - `hs-project/src/app/cards/TicketBugCard.tsx` → `hubspot.fetch(...)` URL
5. **Set Vercel env vars**: `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET`,
   `HUBSPOT_REDIRECT_URI`, optional `N8N_WEBHOOK_URL`.
6. **Install OAuth**: Build the install URL with correct scopes and install.
7. **Verify card**: Open a Ticket and confirm ID, pipeline stage, contacts, and
   the action button.

## Common Pitfalls (Avoid Next Time)

- **Skip discovery**: Always check if a project already exists before creating.
- **Backend undecided**: Hosting must be decided before OAuth/URLs are set.
- **Wrong scopes**: Use only documented scopes from
  https://developers.hubspot.com/docs/apps/legacy-apps/authentication/scopes
- **Wrong properties**: Discover properties first; then bind UI to real fields.
- **Signature v3 mismatch**: Use correct URL reconstruction + base64/base64url
  HMAC; ensure Client Secret matches the app ID.
- **Associations hook params**: Use documented `useAssociations` params and
  `toObjectType` values; test with real data.

## Per-Customer Variables

- HubSpot account (portal) + appId
- OAuth redirect URL (Vercel domain)
- `hubspot.fetch` base URL (Vercel domain)
- Required scopes (keep minimal: `oauth`, `tickets`, `crm.objects.contacts.read`)
- Client Secret in Vercel must match the HubSpot app’s Client Secret


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
5. This repo includes `vercel.json` rewrites for the intro/connected pages under
   `/ui_demo`. The action endpoint should be called at `/api/action` to avoid
   signature mismatches.
6. The OAuth callback redirects to a simple success page:
   - `/ui_demo/connected`
   - Append `?redirect=json` if you want JSON response instead of redirect.
7. The install intro page is:
   - `/ui_demo/intro`

### 3) Update HubSpot App Config

Edit `hs-project/src/app/app-hsmeta.json`:

- `auth.redirectUrls`: set to your Vercel callback URL
- `permittedUrls.fetch`: include your Vercel base URL

Edit `hs-project/src/app/cards/TicketBugCard.tsx`:

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
&scope=oauth+tickets+crm.objects.contacts.read
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
