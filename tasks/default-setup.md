# Default HubSpot Public App Setup Tasks

## Prerequisites

1. Create HubSpot Developer Account
   - Go to https://developers.hubspot.com
   - Sign up or log in
   - Verify email if required

2. Prepare External Backend
   - Backend must be accessible via HTTPS
   - Backend must have endpoint to receive OAuth redirect
   - Backend must have endpoint to receive POST from UI Extensions
   - Backend must support signature validation

## Task 1: Create HubSpot Public App

1. Navigate to HubSpot Developer Account
2. Go to "Apps" section
3. Click "Create app"
4. Fill in required fields:
   - App name
   - Description
   - Logo (optional)
   - Support contact information
5. Save app
6. Note the `client_id` (App ID) from app settings
7. Note the `client_secret` from app settings (keep secret)

## Task 2: Configure OAuth

1. In app settings, go to "Auth" section
2. Set authentication type to "OAuth"
3. Add redirect URL(s):
   - Format: `https://your-backend.example.com/oauth/callback`
   - Must be HTTPS
   - Can add multiple redirect URLs
4. Configure scopes:
   - Select required scopes
   - Select conditionally required scopes (if needed)
   - Select optional scopes (if needed)
   - Minimum: `oauth` scope
   - Note: Scopes beyond `oauth` require "App Marketplace Access" permission
5. Save OAuth configuration

## Task 3: Configure App Distribution

1. In app settings, go to "Distribution" section
2. Choose distribution type:
   - `"private"`: Limited to allowlist (up to 25 accounts before marketplace)
   - `"marketplace"`: Public listing (unlimited after listing)
3. If private:
   - Add allowed `hub_id` values to allowlist
   - Up to 25 accounts before marketplace listing
4. Save distribution settings

## Task 4: Create Project Structure

1. Create project directory
2. Initialize npm project:
   ```bash
   npm init -y
   ```
3. Install dependencies:
   ```bash
   npm install @hubspot/ui-extensions react react-dom
   npm install --save-dev @types/react @types/react-dom
   ```
4. Create directory structure:
   ```
   project/
   ├── extensions/
   │   └── my-card/
   │       ├── card.jsx
   │       └── card.json
   ├── backend/ (separate service)
   └── package.json
   ```

## Task 5: Create UI Extension Card

1. Create `extensions/my-card/card.json`:
   ```json
   {
     "type": "crm-card",
     "location": "crm.record.sidebar",
     "objectTypes": ["CONTACT"],
     "module": {
       "file": "card.jsx"
     },
     "title": "My Card",
     "description": "Card description",
     "permittedUrls": {
       "fetch": [
         "https://your-backend.example.com"
       ]
     }
   }
   ```
2. Update `objectTypes` array with required object types (e.g., `["CONTACT", "COMPANY", "DEAL"]`)
3. Update `location` if needed (`crm.record.sidebar`, `crm.record.tab`, or `crm.preview`)
4. Update `permittedUrls.fetch` with your backend domain(s)

## Task 6: Implement UI Extension Component

1. Create `extensions/my-card/card.jsx`:
   ```jsx
   import React from 'react';
   import { hubspot } from '@hubspot/ui-extensions';
   import { Button, Text, Flex } from '@hubspot/ui-extensions';
   import { useExtensionActions, useExtensionContext } from '@hubspot/ui-extensions';

   hubspot.extend(() => <MyCard />);

   function MyCard() {
     const actions = useExtensionActions();
     const context = useExtensionContext();

     const handleAction = async () => {
       try {
         const response = await hubspot.fetch('https://your-backend.example.com/action', {
           method: 'POST',
           body: {
             objectType: context.objectType,
             objectId: context.objectId,
             hubId: context.portal.id
           },
           timeout: 10000
         });
         
         const json = await response.json();
         if (response.ok) {
           actions.addAlert({ message: 'Action succeeded', type: 'success' });
         } else {
           actions.addAlert({ message: `Failed: ${json.error}`, type: 'danger' });
         }
       } catch (err) {
         actions.addAlert({ message: 'Error calling backend', type: 'danger' });
       }
     };

     return (
       <Flex direction="column" gap="small">
         <Text>My Card Content</Text>
         <Button variant="primary" onClick={handleAction}>
           Trigger Action
         </Button>
       </Flex>
     );
   }
   ```
2. Update backend URL in `hubspot.fetch()` call
3. Update UI content as needed

## Task 7: Build and Deploy Extension

1. Build extension (if using build tool):
   ```bash
   npm run build
   ```
2. Use HubSpot CLI to upload extension:
   ```bash
   npx @hubspot/cli extensions upload
   ```
3. Or use HubSpot Developer Portal:
   - Go to app settings
   - Go to "Extensions" section
   - Upload extension files
4. Mark extension version as "live" in app settings

## Task 8: Implement Backend OAuth Handler

1. Create OAuth callback endpoint: `/oauth/callback`
2. Extract `code` from query parameters
3. Exchange code for tokens:
   - POST to `https://api.hubapi.com/oauth/v1/token`
   - Body: `client_id`, `client_secret`, `redirect_uri`, `code`, `grant_type: "authorization_code"`
4. Store tokens with `hub_id`:
   - Extract `hub_id` from token metadata (call `/oauth/v1/access-tokens/{token}`)
   - Store `access_token`, `refresh_token`, `expires_in`, `hub_id`
5. Redirect user to success page

## Task 9: Implement Backend Signature Validation

1. Create middleware to validate HubSpot signatures
2. Extract signature from request headers (`X-HubSpot-Signature-v3` or version)
3. Extract query parameters: `userId`, `portalId`, `userEmail`, `appId`, `timestamp`
4. Reconstruct signature string:
   - Sort query parameters alphabetically
   - Build string: `method + uri + sorted_params + body`
   - Use `client_secret` as key
5. Compare computed signature with provided signature
6. Check timestamp (reject if older than 5 minutes)
7. Reject request if signature invalid

## Task 10: Implement Backend Action Endpoint

1. Create endpoint: `/action` (or as configured in UI Extension)
2. Validate HubSpot signature (from Task 9)
3. Extract payload from request body:
   - `objectType`
   - `objectId`
   - `hubId`
   - Any custom data
4. Forward to n8n:
   - POST to n8n webhook URL
   - Include payload data
   - Include `hub_id` for scoping
5. Return JSON response:
   ```json
   {
     "success": true,
     "message": "Action completed"
   }
   ```

## Task 11: Implement Schema Discovery (Backend)

1. Create endpoint: `/api/schemas` (internal, not exposed to UI)
2. Get access token for `hub_id` (from stored tokens)
3. Call HubSpot API:
   - GET `https://api.hubapi.com/crm-object-schemas/v3/schemas`
   - Header: `Authorization: Bearer {access_token}`
4. Filter schemas:
   - Exclude archived schemas
   - Include only needed object types
5. Cache results per `hub_id`
6. Return schema list

## Task 12: Implement Property Discovery (Backend)

1. Create endpoint: `/api/properties/{objectType}` (internal, not exposed to UI)
2. Get access token for `hub_id`
3. Call HubSpot API:
   - GET `https://api.hubapi.com/crm/v3/properties/{objectType}`
   - Header: `Authorization: Bearer {access_token}`
4. Filter properties:
   - `archived: false`
   - `calculated: false`
   - `readOnlyValue: false` (for readable)
   - Additional filters as needed
5. Cache results per `hub_id` and `objectType`
6. Return property list with metadata

## Task 13: Generate Install URL

1. Build install URL:
   ```
   https://app.hubspot.com/oauth/authorize?
     client_id={client_id}&
     redirect_uri={redirect_uri}&
     scope={scope}&
     optional_scope={optional_scope}&
     state={state}
   ```
2. URL encode all parameters
3. Send URL to user for installation

## Task 14: Test Installation

1. Use install URL from Task 13
2. User clicks install URL
3. User authorizes app in HubSpot
4. User redirected to callback URL
5. Backend receives authorization code
6. Backend exchanges code for tokens
7. Backend stores tokens with `hub_id`
8. Verify tokens are stored correctly

## Task 15: Test UI Extension

1. Navigate to HubSpot CRM
2. Open a record of type configured in `objectTypes`
3. Verify card appears in sidebar/tab/preview
4. Click action button
5. Verify POST request sent to backend
6. Verify backend validates signature
7. Verify backend forwards to n8n
8. Verify UI shows success/error alert

## Task 16: Switch Between Portals

1. User switches portal in HubSpot UI (account menu)
2. Verify `hub_id` changes in context
3. Backend must use correct tokens for new `hub_id`
4. UI Extension must send correct `hub_id` in requests
5. Verify no cross-portal data access

## Task 17: Handle Token Refresh

1. Monitor token expiration (`expires_in` from OAuth response)
2. Before expiration, refresh token:
   - POST to `https://api.hubapi.com/oauth/v1/token`
   - Body: `client_id`, `client_secret`, `refresh_token`, `grant_type: "refresh_token"`
3. Store new `access_token` and `expires_in`
4. Retry failed API calls with new token

## Task 18: Production Deployment

1. Ensure all URLs use HTTPS (no `localhost`)
2. Update `permittedUrls.fetch` with production backend URL
3. Update OAuth redirect URL to production URL
4. Deploy backend to production
5. Deploy UI Extension (mark as "live" version)
6. Test installation in production portal
7. Monitor for errors and rate limits

## Notes

- All tasks must be completed in order
- Each task depends on previous tasks
- Test after each major task
- Keep `client_secret` secure (never expose to UI)
- Support multiple portals from the start
- Cache schema/property data to reduce API calls
- Handle rate limits (429 status) with retry logic
