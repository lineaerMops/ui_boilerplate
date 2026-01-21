# HubSpot Public App & UI Extensions Rules

## UI Extensions Rules

### Allowed
- Use only `@hubspot/ui-extensions` package for React components
- Use only `hubspot.fetch()` for HTTP requests to external backends
- Declare all external URLs in `permittedUrls.fetch` in `*-hsmeta.json`
- Use HTTPS URLs only (no `localhost` in production)
- Use `hubspot.extend()` to register extension components
- Access context via `useExtensionContext()` hook
- Access actions via `useExtensionActions()` hook
- Use standard UI components from `@hubspot/ui-extensions`
- Use CRM data hooks: `useCrmProperties()`, `useAssociations()`
- POST payloads to external backend endpoints via `hubspot.fetch()`
- Maximum request body size: 1 MB
- Maximum response size: 1 MB
- Maximum timeout: 15 seconds per request
- Maximum concurrent requests: 20 per HubSpot account
- Handle 429 status codes (rate limiting) with retry logic

### Forbidden
- Direct calls to HubSpot APIs from UI Extensions
- Storing OAuth tokens, client secrets, or API keys in UI Extension code
- Using `fetch()` directly (must use `hubspot.fetch()`)
- HTTP URLs (only HTTPS allowed)
- `localhost` URLs in production builds
- Business logic in UI Extensions (UI is pure renderer)
- Schema discovery in UI Extensions
- Token management in UI Extensions
- Exceeding 1 MB payload or response limits
- Exceeding 20 concurrent requests per account
- Exceeding 15 second timeout per request

## Backend Rules

### Required
- Own and manage OAuth flow (authorization code exchange)
- Store and refresh OAuth tokens (access_token, refresh_token)
- Validate HubSpot request signatures (v1, v2, or v3)
- Reject signatures older than 5 minutes
- Handle signature validation for all `hubspot.fetch()` requests
- Discover CRM schemas via `/crm-object-schemas/v3/schemas`
- Discover CRM properties via `/crm/v3/properties/{objectType}`
- Cache schema and property metadata
- Filter properties by: readable, writable, non-calculated, non-archived
- Generate UI card configurations from schema + config
- Forward action button POST requests to n8n
- Include `hub_id` (portal ID) in all operations
- Scope all data operations by `hub_id`
- Handle token refresh before expiration
- Support multiple portals (multiple `hub_id` values)
- Return JSON responses to UI Extensions
- Handle POST requests from action buttons

### Forbidden
- Exposing OAuth tokens to UI Extensions
- Exposing client secrets to UI Extensions
- Skipping signature validation
- Making UI Extensions responsible for schema discovery
- Making UI Extensions responsible for token management
- Cross-portal data access (must scope by `hub_id`)

## OAuth Rules

### Required
- Use OAuth 2.0 authorization code flow
- Request scopes during installation
- Support required, conditionally required, and optional scopes
- Exchange authorization code for tokens at `/oauth/v1/token`
- Store `access_token`, `refresh_token`, `expires_in`
- Use `Authorization: Bearer <access_token>` header for API calls
- Refresh tokens before access token expiration
- Extract `hub_id` from token metadata
- Support "App Marketplace Access" permission requirement (for scopes beyond `oauth`)
- Build install URL with: `client_id`, `redirect_uri`, `scope`, optional `optional_scope`, optional `state`

### Forbidden
- Using API keys for Public Apps
- Using Private App tokens for Public Apps
- Storing tokens in client-side code
- Hardcoding portal IDs

## Schema Discovery Rules

### Required
- Use `/crm-object-schemas/v3/schemas` for schema discovery
- Use `/crm/v3/properties/{objectType}` for property discovery
- Filter out archived properties (`archived: false`)
- Filter out calculated properties (`calculated: false`)
- Filter for readable properties (check `readOnlyValue: false` or equivalent)
- Filter for writable properties when generating forms
- Cache schema results per `hub_id`
- Cache property results per `hub_id` and `objectType`
- Include property metadata: `name`, `label`, `type`, `fieldType`, `groupName`, `options` (for enumerations)
- Include schema metadata: `name`, `labels`, `requiredProperties`, `searchableProperties`, `primaryDisplayProperty`

### Forbidden
- Including calculated properties in UI forms
- Including archived properties
- Including read-only properties in write operations
- Caching across different `hub_id` values
- Making UI Extensions discover schemas

## App Configuration Rules

### Required
- Set `distribution: "private"` or `distribution: "marketplace"` in app schema
- Set `auth.type: "oauth"` for Public Apps
- Declare all external URLs in `permittedUrls.fetch` in `*-hsmeta.json`
- Define extension location: `crm.record.sidebar`, `crm.record.tab`, or `crm.preview`
- Define `objectTypes` array for each extension
- Support allowlist for private apps (up to 25 accounts before marketplace listing)
- Support unlimited installs after marketplace listing
- Use app versioning (only "live" versions deploy to new installs)

### Forbidden
- Using `auth.type: "static"` for multi-portal Public Apps
- Undeclared URLs in `permittedUrls.fetch`
- Hardcoding object types
- Assuming Enterprise features are available

## Portal/Environment Rules

### Required
- Extract `hub_id` from OAuth token metadata
- Scope all operations by `hub_id`
- Support multiple portals per installation
- Handle portal switching (users can switch between portals)
- Support test accounts (up to 10 test portals for developer accounts)
- Support sandbox portals (Enterprise feature, but don't assume it exists)

### Forbidden
- Assuming single portal per app installation
- Cross-portal data access
- Hardcoding portal IDs
- Assuming sandbox availability (Enterprise-only)

## n8n Integration Rules

### Required
- Backend receives POST from UI Extension action buttons
- Backend validates HubSpot signature
- Backend forwards validated requests to n8n
- Backend does not expose n8n directly to UI Extensions

### Forbidden
- UI Extensions calling n8n directly
- Skipping signature validation before forwarding to n8n
- Exposing n8n endpoints in `permittedUrls.fetch`

## General Rules

### Required
- Work without HubSpot Enterprise subscription
- Use only documented APIs and features
- State assumptions explicitly when documentation is unclear
- Follow explicit, step-by-step processes
- Be conservative (prefer explicit over clever)

### Forbidden
- Using Enterprise-only features
- Using undocumented APIs or behaviors
- Optimizing or abstracting beyond documentation
- Assuming undocumented behavior
