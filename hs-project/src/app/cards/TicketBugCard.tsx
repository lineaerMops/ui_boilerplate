import React from "react";
import { Button, Flex, Text } from "@hubspot/ui-extensions";
import { hubspot } from "@hubspot/ui-extensions";
import { useAssociations, useCrmProperties } from "@hubspot/ui-extensions/crm";

hubspot.extend<"crm.record.sidebar">(({ context, actions }) => (
  <TicketBugCard context={context} actions={actions} />
));

const TicketBugCard = ({ context, actions }) => {
  const [loading, setLoading] = React.useState(false);
  const properties = useCrmProperties(["hs_pipeline_stage", "hs_pipeline"]);
  const { data: contactAssociations } = useAssociations({
    objectTypeId: "0-1",
    properties: ["firstname", "lastname", "email"]
  });

  const recordId =
    context.crm?.objectId ||
    context.objectId ||
    context.recordId ||
    context.crmObjectId ||
    context?.crm?.recordId;

  const pipelineStage = properties?.properties?.hs_pipeline_stage || "-";
  const pipelineId = properties?.properties?.hs_pipeline || "-";
  const firstContact = contactAssociations?.results?.[0];
  const contactId = firstContact?.id || "-";
  const contactName = `${firstContact?.properties?.firstname || ""} ${firstContact?.properties?.lastname || ""}`.trim();
  const contactEmail = firstContact?.properties?.email || "";
  const contactLabel =
    contactName || contactEmail || (contactId !== "-" ? `Contact ${contactId}` : "-");

  const handleCreateBug = async () => {
    setLoading(true);
    try {
      const response = await hubspot.fetch(
        "https://embed.lineaer.dk/api/action",
        {
          method: "POST",
          body: {
            objectType: context.objectType,
            objectId: recordId,
            hubId: context.portal?.id,
            type: "create bug"
          },
          timeout: 10000
        }
      );

      const json = await response.json();
      if (response.ok) {
        actions.addAlert({ message: "Bug oprettet", type: "success" });
      } else {
        actions.addAlert({
          message: `Fejl: ${json.error || "Ukendt fejl"}`,
          type: "danger"
        });
      }
    } catch (err) {
      actions.addAlert({ message: "Request fejlede", type: "danger" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="small">
      <Text format={{ fontWeight: "bold" }}>Ticket ID</Text>
      <Text>{recordId || "-"}</Text>
      <Text format={{ fontWeight: "bold" }}>Pipeline stage</Text>
      <Text>{pipelineStage}</Text>
      <Text format={{ color: "secondary" }}>Pipeline: {pipelineId}</Text>
      <Text format={{ fontWeight: "bold" }}>Associated contact</Text>
      <Text>{contactLabel}</Text>
      <Button variant="primary" onClick={handleCreateBug} disabled={loading}>
        {loading ? "Opretter..." : "Opret bug"}
      </Button>
    </Flex>
  );
};
