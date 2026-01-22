import React from 'react';
import { hubspot } from '@hubspot/ui-extensions';
import { Button, Flex, Text } from '@hubspot/ui-extensions';
import { useExtensionActions, useExtensionContext } from '@hubspot/ui-extensions';

hubspot.extend(() => <TicketBugCard />);

function TicketBugCard() {
  const actions = useExtensionActions();
  const context = useExtensionContext();
  const [loading, setLoading] = React.useState(false);

  const handleCreateBug = async () => {
    setLoading(true);
    try {
      const response = await hubspot.fetch('https://your-backend.example.com/action', {
        method: 'POST',
        body: {
          objectType: context.objectType,
          objectId: context.objectId,
          hubId: context.portal.id,
          type: 'create bug'
        },
        timeout: 10000
      });

      const json = await response.json();
      if (response.ok) {
        actions.addAlert({ message: 'Bug oprettet', type: 'success' });
      } else {
        actions.addAlert({
          message: `Fejl: ${json.error || 'Ukendt fejl'}`,
          type: 'danger'
        });
      }
    } catch (err) {
      actions.addAlert({ message: 'Request fejlede', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="small">
      <Text format={{ fontWeight: 'bold' }}>Ticket ID</Text>
      <Text>{context.objectId || '-'}</Text>
      <Button variant="primary" onClick={handleCreateBug} disabled={loading}>
        {loading ? 'Opretter...' : 'Opret bug'}
      </Button>
    </Flex>
  );
}
