# Skill: Discover CRM Schema

## Goal
Discover all CRM object schemas for a given HubSpot portal, including standard and custom objects.

## Preconditions
- Backend has valid OAuth access token for the portal (`hub_id`)
- Access token has required scopes (typically `crm.objects.read` or `crm.schemas.read`)
- Backend can make HTTPS requests to HubSpot API

## Steps

1. **Get Access Token**
   - Retrieve stored access token for `hub_id`
   - Verify token is not expired
   - If expired, refresh token using refresh token flow
   - If refresh fails, return error (user must re-authorize)

2. **Check Cache**
   - Check if schema data exists in cache for this `hub_id`
   - If cached and not expired (e.g., < 1 hour old), return cached data
   - If cache miss or expired, proceed to API call

3. **Call HubSpot Schemas API**
   - Endpoint: `GET https://api.hubapi.com/crm-object-schemas/v3/schemas`
   - Header: `Authorization: Bearer {access_token}`
   - Query parameter: `archived=false` (optional, to exclude archived schemas)
   - Make request with timeout (e.g., 10 seconds)

4. **Handle Response**
   - If status 200: Parse JSON response
   - If status 401: Token expired or invalid, refresh and retry once
   - If status 429: Rate limited, wait and retry with exponential backoff
   - If status 4xx/5xx: Log error and return error to caller

5. **Filter Schemas**
   - Exclude schemas where `archived: true` (if not filtered by API)
   - Include only schemas needed for application (optional filtering)
   - Standard object types: `contacts`, `companies`, `deals`, `tickets`, `products`, etc.
   - Custom object types: typically prefixed (e.g., `2-xxxxx`)

6. **Extract Schema Metadata**
   - For each schema, extract:
     - `id` or `objectTypeId`
     - `name` (object type name)
     - `labels.singular`
     - `labels.plural`
     - `requiredProperties[]`
     - `searchableProperties[]`
     - `primaryDisplayProperty`
     - `associations[]` (if needed)
     - `metaType` (PORTAL_SPECIFIC for custom objects)

7. **Cache Results**
   - Store schema data in cache keyed by `hub_id`
   - Set cache expiration (e.g., 1 hour)
   - Cache format: JSON object with schema array

8. **Return Results**
   - Return array of schema objects
   - Each schema object contains metadata from step 6
   - Include `hub_id` in response for reference

## Expected Output Artifacts

- **Schema List** (JSON array):
  ```json
  [
    {
      "id": "0-1",
      "name": "contacts",
      "objectTypeId": "0-1",
      "labels": {
        "singular": "Contact",
        "plural": "Contacts"
      },
      "requiredProperties": ["email"],
      "searchableProperties": ["email", "firstname", "lastname"],
      "primaryDisplayProperty": "firstname",
      "metaType": "PORTAL_SPECIFIC"
    },
    {
      "id": "2-123456",
      "name": "custom_object_1",
      "objectTypeId": "2-123456",
      "labels": {
        "singular": "Custom Object",
        "plural": "Custom Objects"
      },
      "requiredProperties": ["name"],
      "searchableProperties": ["name"],
      "primaryDisplayProperty": "name",
      "metaType": "PORTAL_SPECIFIC"
    }
  ]
  ```

- **Cache Entry**:
  - Key: `schema:{hub_id}`
  - Value: Schema list JSON
  - TTL: 3600 seconds (1 hour)

## Error Handling

- **Token Expired**: Refresh token, retry once
- **Token Invalid**: Return error, require re-authorization
- **Rate Limited (429)**: Wait, retry with exponential backoff (max 3 retries)
- **API Error (4xx/5xx)**: Log error, return error to caller
- **Network Error**: Retry once, then return error

## Assumptions

- HubSpot API endpoint is stable and documented
- Access token has sufficient scopes
- Cache is available and persistent
- Network connectivity is reliable
- Standard object types are always available (contacts, companies, deals)
