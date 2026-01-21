# Skill: Add Action Button to UI Card

## Goal
Add an action button to an existing UI Extension card that POSTs payload to an external backend endpoint.

## Preconditions
- UI Extension card exists (card.json and card.jsx files)
- Backend endpoint exists and accepts POST requests
- Backend URL is declared in `permittedUrls.fetch` in card.json
- Backend validates HubSpot request signatures
- Card component is using `@hubspot/ui-extensions` package

## Steps

1. **Verify Backend URL in Configuration**
   - Open `card.json`
   - Check `permittedUrls.fetch` array
   - Verify backend URL is included
   - If missing, add backend URL to array
   - Save `card.json`

2. **Open Card Component**
   - Open `card.jsx` file
   - Locate component function (e.g., `MyCard()`)
   - Verify imports include `Button` from `@hubspot/ui-extensions`
   - Verify `useExtensionActions` and `useExtensionContext` are imported

3. **Create Action Handler Function**
   - Inside component function, create async handler:
     ```jsx
     const handleAction = async () => {
       // Implementation
     };
     ```
   - Handler must be async to use `await` with `hubspot.fetch()`

4. **Implement POST Request**
   - Inside handler, call `hubspot.fetch()`:
     ```jsx
     const response = await hubspot.fetch('{backendUrl}/{endpoint}', {
       method: 'POST',
       body: {
         objectType: context.objectType,
         objectId: context.objectId,
         hubId: context.portal.id,
         // Add custom data as needed
       },
       timeout: 10000
     });
     ```
   - Replace `{backendUrl}` with actual backend URL
   - Replace `{endpoint}` with actual endpoint path
   - Include required context data: `objectType`, `objectId`, `hubId`
   - Add any custom data fields as needed
   - Set timeout (max 15 seconds, recommended 10 seconds)

5. **Handle Response**
   - Parse JSON response:
     ```jsx
     const json = await response.json();
     ```
   - Check response status:
     ```jsx
     if (response.ok) {
       // Success handling
     } else {
       // Error handling
     }
     ```

6. **Show User Feedback**
   - On success, show success alert:
     ```jsx
     actions.addAlert({ 
       message: 'Action completed successfully', 
       type: 'success' 
     });
     ```
   - On error, show error alert:
     ```jsx
     actions.addAlert({ 
       message: `Error: ${json.error || 'Unknown error'}`, 
       type: 'danger' 
     });
     ```
   - On exception, show error alert:
     ```jsx
     catch (err) {
       actions.addAlert({ 
         message: 'Request failed', 
         type: 'danger' 
       });
     }
     ```

7. **Add Button to UI**
   - In component return statement, add `Button` component:
     ```jsx
     <Button 
       variant="primary" 
       onClick={handleAction}
     >
       {buttonLabel}
     </Button>
     ```
   - Set `variant` as needed (`"primary"`, `"secondary"`, `"destructive"`)
   - Set `onClick` to handler function
   - Set button label text

8. **Add Loading State (Optional)**
   - Add state for loading:
     ```jsx
     const [loading, setLoading] = React.useState(false);
     ```
   - Set loading before request:
     ```jsx
     setLoading(true);
     ```
   - Clear loading after request:
     ```jsx
     setLoading(false);
     ```
   - Disable button when loading:
     ```jsx
     <Button 
       variant="primary" 
       onClick={handleAction}
       disabled={loading}
     >
       {loading ? 'Processing...' : buttonLabel}
     </Button>
     ```

9. **Wrap in Try-Catch**
   - Wrap `hubspot.fetch()` call in try-catch:
     ```jsx
     try {
       // fetch and handling
     } catch (err) {
       actions.addAlert({ 
         message: 'Request failed', 
         type: 'danger' 
       });
       setLoading(false);
     }
     ```

10. **Verify Implementation**
    - Check all imports are present
    - Check backend URL is in `permittedUrls.fetch`
    - Check handler is async
    - Check error handling is complete
    - Check button is added to UI
    - Verify no direct HubSpot API calls

## Expected Output Artifacts

- **Updated card.jsx** with action button:
  ```jsx
  import React from 'react';
  import { hubspot } from '@hubspot/ui-extensions';
  import { Button, Text, Flex } from '@hubspot/ui-extensions';
  import { useExtensionActions, useExtensionContext } from '@hubspot/ui-extensions';

  hubspot.extend(() => <MyCard />);

  function MyCard() {
    const actions = useExtensionActions();
    const context = useExtensionContext();
    const [loading, setLoading] = React.useState(false);

    const handleAction = async () => {
      setLoading(true);
      try {
        const response = await hubspot.fetch('https://backend.example.com/action', {
          method: 'POST',
          body: {
            objectType: context.objectType,
            objectId: context.objectId,
            hubId: context.portal.id,
            customData: 'value'
          },
          timeout: 10000
        });
        
        const json = await response.json();
        if (response.ok) {
          actions.addAlert({ 
            message: 'Action completed successfully', 
            type: 'success' 
          });
        } else {
          actions.addAlert({ 
            message: `Error: ${json.error || 'Unknown error'}`, 
            type: 'danger' 
          });
        }
      } catch (err) {
        actions.addAlert({ 
          message: 'Request failed', 
          type: 'danger' 
        });
      } finally {
        setLoading(false);
      }
    };

    return (
      <Flex direction="column" gap="small">
        <Text>Card Content</Text>
        <Button 
          variant="primary" 
          onClick={handleAction}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Trigger Action'}
        </Button>
      </Flex>
    );
  }
  ```

- **Updated card.json** (if backend URL was added):
  ```json
  {
    "type": "crm-card",
    "location": "crm.record.sidebar",
    "objectTypes": ["CONTACT"],
    "module": {
      "file": "card.jsx"
    },
    "title": "My Card",
    "description": "Card with action button",
    "permittedUrls": {
      "fetch": [
        "https://backend.example.com"
      ]
    }
  }
  ```

## Payload Structure

The POST body sent to backend must include:
- `objectType`: CRM object type (e.g., `"CONTACT"`, `"COMPANY"`)
- `objectId`: HubSpot object ID (string)
- `hubId`: HubSpot portal ID (number)
- Custom data fields as needed

Example payload:
```json
{
  "objectType": "CONTACT",
  "objectId": "12345",
  "hubId": 12345678,
  "customData": "value"
}
```

## Error Handling

- **Network Error**: Caught by try-catch, show error alert
- **Timeout**: Caught by try-catch, show error alert
- **429 Rate Limit**: Backend should handle, UI shows error if backend returns error
- **Invalid Response**: Check `response.ok`, show error alert
- **Missing Context**: Verify `context` is available, handle gracefully

## Constraints

- Maximum request body size: 1 MB
- Maximum response size: 1 MB
- Maximum timeout: 15 seconds (recommended 10 seconds)
- Maximum concurrent requests: 20 per account
- Must use HTTPS URLs only
- Backend URL must be in `permittedUrls.fetch`

## Assumptions

- Backend endpoint exists and is accessible
- Backend validates HubSpot request signatures
- Backend returns JSON responses
- Backend handles forwarding to n8n (not UI responsibility)
- Card component is already functional

## Notes

- Action button only POSTs to backend
- Backend is responsible for all business logic
- Backend forwards to n8n (UI doesn't know about n8n)
- UI is pure renderer with user feedback
- No direct HubSpot API calls from button handler
