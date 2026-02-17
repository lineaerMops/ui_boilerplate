import React from "react";
import { Button, Divider, Select, Flex, Text, DescriptionList, DescriptionListItem, Tile, Box, Icon, Illustration, Tag } from "@hubspot/ui-extensions";
import { hubspot } from "@hubspot/ui-extensions";
import { useAssociations, useCrmProperties } from "@hubspot/ui-extensions/crm";

hubspot.extend<"crm.record.sidebar">(({ context, actions }) => (
  <TicketBugCard context={context} actions={actions} />
));

const TicketBugCard = ({ context, actions }) => {
  const [loading, setLoading] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState("bug");
  const properties = useCrmProperties(["hs_pipeline_stage", "hs_pipeline"]);
  const {
    results: contactResults,
    isLoading: contactsLoading,
    error: contactsError
  } = useAssociations({
    toObjectType: "0-1",
    properties: ["firstname", "lastname", "email"],
    pageLength: 10
  });

  const recordId =
    context.crm?.objectId ||
    context.objectId ||
    context.recordId ||
    context.crmObjectId ||
    context?.crm?.recordId;

  const pipelineStage = properties?.properties?.hs_pipeline_stage || "-";
  const pipelineId = properties?.properties?.hs_pipeline || "-";
  const contacts = contactResults || [];
  const isCreateStage = pipelineStage === "1";
  const typeOptions = [
    { label: "Task", value: "task" },
    { label: "PBI", value: "pbi" },
    { label: "Bug", value: "bug" },
    { label: "Feature", value: "feature" }
  ];
  const selectedTypeLabel =
    typeOptions.find((option) => option.value === selectedType)?.label ||
    selectedType;


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
            type: "create bug",
            workItemType: selectedType
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
      <Tile>
        <Flex direction="column" gap="small" align="stretch">
          {isCreateStage ? (
            <Box flex="auto" direction="column" gap="small">
              <Illustration
                name="emptyStateCharts"
                alt="Lock icon indicating content is currently restricted or inaccessible"
                width={100}
                height={100}
              />

               
              <Box direction="column" gap="small">
              <Divider />
                <Flex direction="column" gap="small" align="stretch">
              <Select
                label="Vælg type"
                required={true}
                value={selectedType}
                options={typeOptions}
                name="type"
                onChange={(value) => setSelectedType(value)}
              />

              <Button variant="primary" onClick={handleCreateBug} disabled={loading}>
                {loading
                  ? "Opretter..."
                  : `Opret ${(selectedTypeLabel || "").toLowerCase()} i TFS`}
              </Button>
              </Flex>
              </Box>
            </Box>
          ) : (
            <Box direction="column" gap="medium">
              <Tag
                variant="success">
                <Icon name="trophy" /> Done
              </Tag>
              <DescriptionList direction="row">
                <DescriptionListItem label={"Ticket ID"}>
                  <Text>{recordId || "-"}</Text>
                </DescriptionListItem>
              </DescriptionList>
              <Flex direction="column" gap="small" align="stretch">
                <Button variant="secondary" disabled={loading} href={{
                  url: "https://lineaer.dk",
                  external: true,
                }}>

                  {loading
                    ? "Opretter..."
                    : "Gå til TFS"}
                </Button>
              </Flex>
            </Box>
          )}
        </Flex>
      </Tile>

      <Tile>
        <Flex direction="column" gap="small">
          <Text format={{ fontWeight: "bold" }}>Associated contact</Text>
          {contacts.length === 0 ? (
            <Text>-</Text>
          ) : (
            contacts.map((contact) => {
              const name = `${contact?.properties?.firstname || ""} ${contact?.properties?.lastname || ""}`.trim();
              const email = contact?.properties?.email || "";
              const label = name || email || `Contact ${contact?.toObjectId || contact?.id}`;
              return <Text key={contact?.toObjectId || contact?.id}>{label}</Text>;
            })
          )}
        </Flex>
      </Tile>
    </Flex>
  );
};
