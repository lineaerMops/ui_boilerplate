# Schema Discovery Strategy

## Overview
This document defines the exact process for discovering CRM object properties using HubSpot's `/crm-object-schemas/v3/schemas` and `/crm/v3/properties` APIs, including filtering rules, caching expectations, and how UI generation depends on discovery results.

## API Endpoints

### Schema Discovery
- **Endpoint**: `GET https://api.hubapi.com/crm-object-schemas/v3/schemas`
- **Purpose**: Discover all object schemas (standard and custom) in a portal
- **Authentication**: `Authorization: Bearer {access_token}`
- **Query Parameters**: 
  - `archived=false` (optional, exclude archived schemas)

### Property Discovery
- **Endpoint**: `GET https://api.hubapi.com/crm/v3/properties/{objectType}`
- **Purpose**: Discover all properties for a specific object type
- **Authentication**: `Authorization: Bearer {access_token}`
- **Path Parameter**: `{objectType}` (e.g., `contacts`, `companies`, `deals`)
- **Query Parameters**:
  - `archived=false` (optional, exclude archived properties)

## Discovery Process

### Step 1: Discover Schemas
1. Call `/crm-object-schemas/v3/schemas` with valid access token
2. Parse response JSON
3. Extract schema list from response
4. Filter out archived schemas (`archived: true`)
5. Extract metadata for each schema:
   - `id` / `objectTypeId`
   - `name` (object type identifier)
   - `labels.singular`
   - `labels.plural`
   - `requiredProperties[]`
   - `searchableProperties[]`
   - `primaryDisplayProperty`
   - `associations[]` (if needed)
   - `metaType` (PORTAL_SPECIFIC for custom objects)
6. Cache results keyed by `hub_id`
7. Cache TTL: 3600 seconds (1 hour)

### Step 2: Discover Properties (Per Object Type)
1. For each object type needed:
   - Call `/crm/v3/properties/{objectType}` with valid access token
   - Parse response JSON
   - Extract property list from response
2. Filter properties using filtering rules (see below)
3. Extract metadata for each property:
   - `name` (internal identifier)
   - `label` (display label)
   - `type` (data type)
   - `fieldType` (UI type)
   - `groupName` (property group)
   - `description` (if available)
   - `options[]` (for enumerations)
   - `hasUniqueValue` (boolean)
   - `readOnlyValue` (boolean)
   - `calculated` (boolean)
   - `archived` (boolean)
4. Sort properties:
   - By `groupName` (alphabetically)
   - Within group, by `label` (alphabetically)
   - Properties without `groupName` at end
5. Cache results keyed by `hub_id` and `objectType`
6. Cache TTL: 3600 seconds (1 hour)

## Filtering Rules

### Schema Filtering
- **Always Exclude**:
  - `archived: true` (archived/deleted schemas)

### Property Filtering

#### For Readable Properties (Display Only)
- **Always Exclude**:
  - `archived: true`
  - `calculated: true`
- **Include**:
  - All other properties

#### For Writable Properties (Forms/Edits)
- **Always Exclude**:
  - `archived: true`
  - `calculated: true`
  - `readOnlyValue: true`
- **Include**:
  - All other properties

#### Special Cases
- **Enumeration Properties**: Include `options[]` array with allowed values
- **Unique Properties**: Note `hasUniqueValue: true` for validation
- **Required Properties**: Use `requiredProperties[]` from schema for validation

## Caching Strategy

### Cache Keys
- **Schemas**: `schema:{hub_id}`
- **Properties**: `properties:{hub_id}:{objectType}`

### Cache TTL
- **Default**: 3600 seconds (1 hour)
- **Rationale**: Schemas and properties change infrequently, 1 hour reduces API calls while staying reasonably fresh

### Cache Invalidation
- **Manual**: Clear cache when schema/property changes are known
- **Automatic**: Cache expires after TTL, next request triggers refresh
- **On Error**: Don't cache error responses, retry on next request

### Cache Storage
- **Backend**: Store in memory, Redis, or database
- **Scope**: Per `hub_id` (never share cache across portals)
- **Format**: JSON objects matching API response structure

## UI Generation Dependencies

### Schema Dependencies
- **Object Type Names**: Used in `objectTypes` array in `card.json`
- **Labels**: Used for UI display (singular/plural forms)
- **Required Properties**: Used for form validation
- **Primary Display Property**: Used for record identification
- **Associations**: Used for relationship displays (if needed)

### Property Dependencies
- **Property Names**: Used in `useCrmProperties()` hook calls
- **Property Labels**: Used for UI field labels
- **Property Types**: Used to select appropriate UI components:
  - `string` + `text` → `Text` component
  - `string` + `textarea` → `TextArea` component
  - `enumeration` + `select` → `Select` component
  - `enumeration` + `radio` → `ToggleGroup` component
  - `date` / `datetime` → `DateInput` component or formatted text
  - `number` → `Text` component with number formatting
  - `bool` → `Checkbox` or `Toggle` component
- **Property Groups**: Used for organizing fields in UI
- **Property Options**: Used for enumeration dropdowns/radios
- **Read-Only Flag**: Used to disable fields in forms

## Error Handling

### Token Errors
- **401 Unauthorized**: Token expired or invalid
  - Refresh token using refresh token flow
  - Retry request once
  - If refresh fails, return error (user must re-authorize)

### Rate Limiting
- **429 Too Many Requests**: Rate limit exceeded
  - Wait with exponential backoff
  - Retry up to 3 times
  - If still rate limited, return error

### Not Found
- **404 Not Found**: Object type doesn't exist
  - Return empty array (not an error)
  - Log for debugging

### Other Errors
- **4xx Client Error**: Log error, return error to caller
- **5xx Server Error**: Retry once, then return error
- **Network Error**: Retry once, then return error

## Discovery Flow Diagram

```
1. User requests schema/property data
   ↓
2. Check cache for hub_id (+ objectType for properties)
   ↓
3. Cache hit? → Return cached data
   ↓
4. Cache miss? → Get access token for hub_id
   ↓
5. Call HubSpot API
   ↓
6. Handle response:
   - 200: Parse, filter, cache, return
   - 401: Refresh token, retry once
   - 429: Wait, retry (max 3 times)
   - 404: Return empty array
   - Other: Return error
   ↓
7. Cache results (on success)
   ↓
8. Return data to caller
```

## Assumptions

1. **API Stability**: HubSpot API endpoints are stable and documented
2. **Token Scopes**: Access tokens have sufficient scopes (`crm.objects.read`, `crm.schemas.read`, `crm.properties.read`)
3. **Cache Availability**: Backend has cache storage available
4. **Network Reliability**: Network connectivity is generally reliable
5. **Standard Objects**: Standard object types (contacts, companies, deals) are always available
6. **Custom Objects**: Custom objects may not exist in all portals
7. **Property Changes**: Properties change infrequently (1 hour cache is acceptable)

## Notes

- Discovery is performed by backend, never by UI Extensions
- All API calls require valid OAuth access tokens
- Cache is scoped per `hub_id` (never shared across portals)
- Filtering rules are strict: exclude calculated and archived properties
- Read-only properties are excluded from writable property lists
- Discovery results drive UI generation (card config and component code)
- Property metadata determines which UI components to use
