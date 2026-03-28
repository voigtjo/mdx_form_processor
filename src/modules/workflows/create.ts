import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";

const buildDraftWorkflowJson = () => ({
  initialStatus: "created",
  statuses: ["created", "submitted"],
  actions: {
    submit: {
      from: ["created"],
      to: "submitted",
      allowedRoles: ["editor"],
      completionMode: "single",
    },
  },
  fieldRules: {
    created: {
      editable: [],
      readonly: [],
    },
    submitted: {
      editable: [],
      readonly: [],
    },
  },
  approval: {
    editors: "single",
    approvers: "single",
    submitMode: "single",
    approvalMode: "single",
  },
  hooks: [],
});

export const createWorkflowDraft = async (input: {
  name: string;
  key: string;
  description?: string;
}): Promise<{ id: string }> => {
  const name = input.name.trim();
  const key = input.key.trim();

  if (!name || !key) {
    throw new Error("Name und Key sind fuer neue Workflows erforderlich.");
  }

  return withDbTransaction(async (client) => {
    const existingWorkflow = await client.query<{ id: string }>(
      `select id from workflow_templates where key = $1 limit 1`,
      [key],
    );

    if (existingWorkflow.rowCount) {
      throw new Error("Der Workflow-Key ist bereits vergeben. Neue Versionen folgen in einem spaeteren Schritt.");
    }

    const id = randomUUID();

    await client.query(
      `insert into workflow_templates (id, key, name, description, version, status, workflow_json)
       values ($1, $2, $3, $4, 1, 'draft', $5::jsonb)`,
      [id, key, name, input.description?.trim() || null, JSON.stringify(buildDraftWorkflowJson())],
    );

    return { id };
  });
};
