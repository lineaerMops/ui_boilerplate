# Skill: Discover CRM Properties

## Goal
Discover all properties (fields) for a specific CRM object type in a given HubSpot portal, filtered for UI generation use cases.

## Preconditions
- Backend has valid OAuth access token for the portal (`hub_id`)
- Access token has required scopes (typically `crm.objects.read` or `crm.properties.read`)
- Object type is known (e.g., `contacts`, `companies`, `deals`, or custom object type)
- Backend can make HTTPS requests to HubSpot API

## Steps

1. **Get Access Token**
   - Retrieve stored access token for `hub_id`
   - Verify token is not expired
   - If expired, refresh token using refresh token flow
   - If refresh fails, return error (user must re-authorize)

2. **Check Cache**
   - Check if property data exists in cache for this `hub_id` and `objectType`
   - Cache key format: `properties:{hub_id}:{objectType}`
   - If cached and not expired (e.g., < 1 hour old), return cached data
   - If cache miss or expired, proceed to API call

3. **Call HubSpot Properties API**
   - Endpoint: `GET https://api.hubapi.com/crm/v3/properties/{objectType}`
   - Replace `{objectType}` with actual object type (e.g., `contacts`, `companies`)
   - Header: `Authorization: Bearer {access_token}`
   - Query parameter: `archived=false` (optional, to exclude archived properties)
   - Make request with timeout (e.g., 10 seconds)

4. **Handle Response**
   - If status 200: Parse JSON response
   - If status 401: Token expired or invalid, refresh and retry once
   - If status 429: Rate limited, wait and retry with exponential backoff
   - If status 404: Object type not found, return empty array
   - If status 4xx/5xx: Log error and return error to caller

5. **Filter Properties**
   - Exclude properties where `archived: true`
   - Exclude properties where `calculated: true` (cannot be edited)
   - For readable properties: Include all non-archived, non-calculated properties
   - For writable properties: Additionally exclude where `readOnlyValue: true`
   - Include only properties with `name`, `label`, `type`, `fieldType` defined

6. **Extract Property Metadata**
   - For each property, extract:
     - `name` (internal identifier)
     - `label` (display label)
     - `type` (data type: `string`, `number`, `date`, `datetime`, `bool`, `enumeration`, etc.)
     - `fieldType` (UI type: `text`, `textarea`, `select`, `radio`, `date`, etc.)
     - `groupName` (property group)
     - `description` (if available)
     - `options[]` (for enumeration types)
     - `hasUniqueValue` (boolean)
     - `readOnlyValue` (boolean)
     - `calculated` (boolean, should be false after filtering)

7. **Sort Properties**
   - Sort by `groupName` (alphabetically)
   - Within each group, sort by `label` (alphabetically)
   - Put properties without `groupName` at the end

8. **Cache Results**
   - Store property data in cache keyed by `hub_id` and `objectType`
   - Cache key format: `properties:{hub_id}:{objectType}`
   - Set cache expiration (e.g., 1 hour)
   - Cache format: JSON object with property array

9. **Return Results**
   - Return array of property objects
   - Each property object contains metadata from step 6
   - Include `hub_id` and `objectType` in response for reference

## Expected Output Artifacts

- **Property List** (JSON array):
  ```json
  [
    {
      "name": "email",
      "label": "Email",
      "type": "string",
      "fieldType": "text",
      "groupName": "contactinformation",
      "description": "Contact email address",
      "readOnlyValue": false,
      "calculated": false,
      "hasUniqueValue": false
    },
    {
      "name": "firstname",
      "label": "First Name",
      "type": "string",
      "fieldType": "text",
      "groupName": "contactinformation",
      "description": "Contact first name",
      "readOnlyValue": false,
      "calculated": false,
      "hasUniqueValue": false
    },
    {
      "name": "lifecyclestage",
      "label": "Lifecycle Stage",
      "type": "enumeration",
      "fieldType": "select",
      "groupName": "contactinformation",
      "description": "Contact lifecycle stage",
      "options": [
        {
          "label": "Subscriber",
          "value": "subscriber"
        },
        {
          "label": "Lead",
          "value": "lead"
        }
      ],
      "readOnlyValue": false,
      "calculated": false,
      "hasUniqueValue": false
    }
  ]
  ```

- **Cache Entry**:
  - Key: `properties:{hub_id}:{objectType}`
  - Value: Property list JSON
  - TTL: 3600 seconds (1 hour)

## Filtering Rules

### Always Exclude
- `archived: true` (deleted/disabled properties)
- `calculated: true` (calculation properties cannot be edited)

### For Readable Properties (Display Only)
- Include all properties that pass "Always Exclude" filter
- No additional filtering needed

### For Writable Properties (Forms/Edits)
- Include all properties that pass "Always Exclude" filter
- Additionally exclude: `readOnlyValue: true`
- Note: Some properties may be conditionally writable (check documentation)

## Error Handling

- **Token Expired**: Refresh token, retry once
- **Token Invalid**: Return error, require re-authorization
- **Rate Limited (429)**: Wait, retry with exponential backoff (max 3 retries)
- **Object Not Found (404)**: Return empty array (object type doesn't exist)
- **API Error (4xx/5xx)**: Log error, return error to caller
- **Network Error**: Retry once, then return error

## Assumptions

- HubSpot API endpoint is stable and documented
- Access token has sufficient scopes
- Cache is available and persistent
- Network connectivity is reliable
- Object type names are consistent (lowercase, underscores for standard objects)
- Custom object types may have different naming conventions

## Notes

- Property discovery is per object type
- Must call this skill once per object type needed
- Cache per object type to avoid unnecessary API calls
- Filtering rules are strict: exclude calculated and archived properties
- Read-only properties are excluded from writable property lists
