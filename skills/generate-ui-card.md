# Skill: Generate UI Card from Schema + Config

## Goal
Generate a UI Extension card configuration and React component from discovered CRM schema and user-provided configuration.

## Preconditions
- Schema discovery completed for target object type(s)
- Property discovery completed for target object type(s)
- User provides configuration:
  - Object types to bind
  - Card location (sidebar, tab, or preview)
  - Card title and description
  - Which properties to display
  - Action button configuration (if any)
- Backend URL is known and configured

## Steps

1. **Load Schema Data**
   - Load schema for each object type from cache or discovery
   - Verify schema exists for all configured object types
   - If schema missing, trigger schema discovery first

2. **Load Property Data**
   - Load properties for each object type from cache or discovery
   - Verify properties exist for all configured object types
   - If properties missing, trigger property discovery first

3. **Filter Properties for Display**
   - Use property list from discovery
   - Apply user's property selection (if specified)
   - If no selection, use all readable properties
   - Exclude calculated and archived properties (already filtered in discovery)
   - Limit to reasonable number (e.g., top 20 by importance or user selection)

4. **Generate Card JSON Configuration**
   - Create `card.json` file structure:
     ```json
     {
       "type": "crm-card",
       "location": "{location}",
       "objectTypes": ["{objectType1}", "{objectType2}"],
       "module": {
         "file": "card.jsx"
       },
       "title": "{title}",
       "description": "{description}",
       "permittedUrls": {
         "fetch": [
           "{backendUrl}"
         ]
       }
     }
     ```
   - Set `location` from config (e.g., `"crm.record.sidebar"`, `"crm.record.tab"`, `"crm.preview"`)
   - Set `objectTypes` array from config
   - Set `title` and `description` from config
   - Set `permittedUrls.fetch` with backend URL(s)

5. **Generate React Component Structure**
   - Create `card.jsx` file structure:
     ```jsx
     import React from 'react';
     import { hubspot } from '@hubspot/ui-extensions';
     import { ... } from '@hubspot/ui-extensions';
     import { useExtensionActions, useExtensionContext } from '@hubspot/ui-extensions';

     hubspot.extend(() => <MyCard />);

     function MyCard() {
       const actions = useExtensionActions();
       const context = useExtensionContext();
       // Component implementation
     }
     ```

6. **Generate Property Display**
   - For each property to display:
     - Determine UI component based on `fieldType`:
       - `text`, `textarea` → `Text` component
       - `select`, `radio` → `Select` or `ToggleGroup`
       - `date`, `datetime` → `DateInput` or formatted text
       - `number` → `Text` with number formatting
       - `bool` → `Checkbox` or `Toggle`
     - Use `useCrmProperties()` hook to fetch property values
     - Render property label and value

7. **Generate Action Buttons (if configured)**
   - For each action button:
     - Create `Button` component
     - Add `onClick` handler that calls `hubspot.fetch()`
     - POST to backend endpoint with:
       - `objectType`: from `context.objectType`
       - `objectId`: from `context.objectId`
       - `hubId`: from `context.portal.id`
       - Any custom data from config
     - Handle response and show alert via `actions.addAlert()`

8. **Assemble Complete Component**
   - Combine property displays
   - Add action buttons
   - Add layout components (`Flex`, `Box`, `AutoGrid`)
   - Add error handling
   - Add loading states (if using async data)

9. **Write Files**
   - Write `card.json` to file system
   - Write `card.jsx` to file system
   - Ensure proper file paths match `module.file` in JSON

10. **Validate Generated Code**
    - Verify JSON is valid
    - Verify JSX syntax is valid
    - Verify all imports are from `@hubspot/ui-extensions`
    - Verify no direct HubSpot API calls
    - Verify all external URLs are in `permittedUrls.fetch`

## Expected Output Artifacts

- **Card JSON Configuration** (`card.json`):
  ```json
  {
    "type": "crm-card",
    "location": "crm.record.sidebar",
    "objectTypes": ["CONTACT", "COMPANY"],
    "module": {
      "file": "card.jsx"
    },
    "title": "Custom Card",
    "description": "Displays contact information",
    "permittedUrls": {
      "fetch": [
        "https://backend.example.com"
      ]
    }
  }
  ```

- **React Component** (`card.jsx`):
  ```jsx
  import React from 'react';
  import { hubspot } from '@hubspot/ui-extensions';
  import { Text, Button, Flex, Divider } from '@hubspot/ui-extensions';
  import { useExtensionActions, useExtensionContext, useCrmProperties } from '@hubspot/ui-extensions';

  hubspot.extend(() => <MyCard />);

  function MyCard() {
    const actions = useExtensionActions();
    const context = useExtensionContext();
    const properties = useCrmProperties(['email', 'firstname', 'lastname']);

    const handleAction = async () => {
      try {
        const response = await hubspot.fetch('https://backend.example.com/action', {
          method: 'POST',
          body: {
            objectType: context.objectType,
            objectId: context.objectId,
            hubId: context.portal.id
          }
        });
        const json = await response.json();
        if (response.ok) {
          actions.addAlert({ message: 'Success', type: 'success' });
        } else {
          actions.addAlert({ message: `Error: ${json.error}`, type: 'danger' });
        }
      } catch (err) {
        actions.addAlert({ message: 'Request failed', type: 'danger' });
      }
    };

    return (
      <Flex direction="column" gap="medium">
        <Text format={{ fontWeight: 'bold' }}>Contact Info</Text>
        <Divider />
        <Text>Email: {properties.email}</Text>
        <Text>Name: {properties.firstname} {properties.lastname}</Text>
        <Button variant="primary" onClick={handleAction}>
          Trigger Action
        </Button>
      </Flex>
    );
  }
  ```

## Configuration Input Format

```json
{
  "objectTypes": ["CONTACT", "COMPANY"],
  "location": "crm.record.sidebar",
  "title": "Custom Card",
  "description": "Card description",
  "properties": [
    {
      "name": "email",
      "display": true
    },
    {
      "name": "firstname",
      "display": true
    }
  ],
  "actions": [
    {
      "label": "Trigger Action",
      "endpoint": "/action",
      "method": "POST"
    }
  ],
  "backendUrl": "https://backend.example.com"
}
```

## Error Handling

- **Missing Schema**: Trigger schema discovery, then retry
- **Missing Properties**: Trigger property discovery, then retry
- **Invalid Object Type**: Return error, list valid object types
- **Invalid Location**: Return error, list valid locations
- **Invalid Backend URL**: Validate URL format, return error if invalid

## Assumptions

- Schema and property discovery have been completed
- User configuration is valid JSON
- Backend URL is accessible and supports POST
- All required properties exist in discovered property list
- Object types are valid (standard or custom)

## Notes

- Generated code must follow UI Extensions rules (no direct API calls)
- All external URLs must be declared in `permittedUrls.fetch`
- Component must use only `@hubspot/ui-extensions` package
- Action buttons must POST to backend, not call HubSpot APIs
- Property display uses `useCrmProperties()` hook for data
