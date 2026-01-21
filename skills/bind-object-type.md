# Skill: Bind Object Type to UI Card

## Goal
Configure a UI Extension card to display on specific CRM object types (standard or custom).

## Preconditions
- UI Extension card exists (card.json file)
- Object type names are known (standard or custom)
- Schema discovery has been completed (to verify object types exist)
- Card component is ready to handle multiple object types

## Steps

1. **Open Card Configuration**
   - Open `card.json` file
   - Locate `objectTypes` field (array)

2. **Identify Object Type Names**
   - For standard objects, use uppercase names:
     - `"CONTACT"` for contacts
     - `"COMPANY"` for companies
     - `"DEAL"` for deals
     - `"TICKET"` for tickets
     - `"PRODUCT"` for products
     - `"LINE_ITEM"` for line items
     - `"QUOTE"` for quotes
     - `"CALL"` for calls
     - `"EMAIL"` for emails
     - `"MEETING"` for meetings
     - `"NOTE"` for notes
     - `"TASK"` for tasks
   - For custom objects, use the object type name from schema discovery
     - Format may vary (e.g., `"custom_object_1"` or schema `name` field)

3. **Verify Object Types Exist**
   - Check schema discovery results
   - Verify each object type exists in the portal
   - If custom object, verify it's not archived
   - If object type doesn't exist, remove from list or return error

4. **Update objectTypes Array**
   - Add or modify `objectTypes` array in `card.json`:
     ```json
     {
       "objectTypes": ["CONTACT", "COMPANY", "DEAL"]
     }
     ```
   - Include all object types where card should appear
   - Use exact object type names (case-sensitive for standard objects)

5. **Update Card Component (if needed)**
   - Open `card.jsx` file
   - Verify component handles multiple object types
   - Access object type from context:
     ```jsx
     const context = useExtensionContext();
     const objectType = context.objectType;
     ```
   - Use `objectType` to customize behavior if needed
   - Example: Different properties for different object types

6. **Handle Object-Specific Logic (Optional)**
   - If card behavior differs by object type:
     ```jsx
     const context = useExtensionContext();
     const objectType = context.objectType;
     
     if (objectType === 'CONTACT') {
       // Contact-specific logic
     } else if (objectType === 'COMPANY') {
       // Company-specific logic
     }
     ```
   - Or use property discovery per object type
   - Or use different property lists per object type

7. **Save Configuration**
   - Save `card.json` with updated `objectTypes`
   - Save `card.jsx` if modified

8. **Verify Configuration**
   - Check JSON syntax is valid
   - Check all object types are valid
   - Check component handles all object types
   - Check no hardcoded object type assumptions

## Expected Output Artifacts

- **Updated card.json**:
  ```json
  {
    "type": "crm-card",
    "location": "crm.record.sidebar",
    "objectTypes": ["CONTACT", "COMPANY", "DEAL"],
    "module": {
      "file": "card.jsx"
    },
    "title": "My Card",
    "description": "Card description",
    "permittedUrls": {
      "fetch": [
        "https://backend.example.com"
      ]
    }
  }
  ```

- **Updated card.jsx** (if object-specific logic needed):
  ```jsx
  import React from 'react';
  import { hubspot } from '@hubspot/ui-extensions';
  import { Text, Flex } from '@hubspot/ui-extensions';
  import { useExtensionContext, useCrmProperties } from '@hubspot/ui-extensions';

  hubspot.extend(() => <MyCard />);

  function MyCard() {
    const context = useExtensionContext();
    const objectType = context.objectType;
    
    // Object-specific property lists
    const contactProps = ['email', 'firstname', 'lastname'];
    const companyProps = ['name', 'domain', 'industry'];
    const dealProps = ['dealname', 'amount', 'dealstage'];
    
    let propertiesToFetch = [];
    if (objectType === 'CONTACT') {
      propertiesToFetch = contactProps;
    } else if (objectType === 'COMPANY') {
      propertiesToFetch = companyProps;
    } else if (objectType === 'DEAL') {
      propertiesToFetch = dealProps;
    }
    
    const properties = useCrmProperties(propertiesToFetch);

    return (
      <Flex direction="column" gap="small">
        <Text>Object Type: {objectType}</Text>
        {/* Render properties based on object type */}
      </Flex>
    );
  }
  ```

## Standard Object Types

Common standard object types (uppercase in `objectTypes` array):
- `CONTACT`
- `COMPANY`
- `DEAL`
- `TICKET`
- `PRODUCT`
- `LINE_ITEM`
- `QUOTE`
- `CALL`
- `EMAIL`
- `MEETING`
- `NOTE`
- `TASK`

## Custom Object Types

- Use the exact `name` field from schema discovery
- Format may vary (e.g., `"custom_object_1"`, `"2-123456"`)
- Case-sensitive (use exact value from schema)
- Must exist in portal (not archived)

## Error Handling

- **Invalid Object Type**: Remove from `objectTypes` array or return error
- **Object Type Not Found**: Verify schema discovery, check object type name
- **Archived Custom Object**: Remove from `objectTypes` array
- **Component Error**: Ensure component handles all object types gracefully

## Constraints

- `objectTypes` must be an array
- Array cannot be empty (card won't appear anywhere)
- Object type names are case-sensitive for standard objects
- Custom object names must match schema exactly
- Card appears on all specified object types

## Assumptions

- Schema discovery has been completed
- Object type names are known and valid
- Card component can handle multiple object types
- Standard object types are always available
- Custom objects may not exist in all portals

## Notes

- Card will appear on all object types in the array
- Component receives `objectType` in context
- Can customize behavior per object type in component
- Can use different property lists per object type
- Must handle cases where object type-specific data is missing
