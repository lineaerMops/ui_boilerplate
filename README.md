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
