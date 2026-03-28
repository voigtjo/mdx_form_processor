import { withDb } from "../../db/pool.js";
import type { WorkflowActionSummary, WorkflowTemplate } from "../../types/domain.js";

type WorkflowRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  version: number;
  status: WorkflowTemplate["status"];
  workflow_json: {
    initialStatus?: string;
    statuses?: string[];
    actions?: Record<
      string,
      {
        from?: string[];
        to?: string;
        allowedRoles?: Array<"editor" | "approver">;
      }
    >;
  };
};

const toActionSummaries = (workflowJson: WorkflowRow["workflow_json"]): WorkflowActionSummary[] => {
  const actions = workflowJson.actions ?? {};

  return Object.entries(actions).map(([name, action]) => ({
    name,
    from: action.from ?? [],
    to: action.to ?? "",
    allowedRoles: action.allowedRoles ?? [],
  }));
};

const mapWorkflow = (row: WorkflowRow): WorkflowTemplate => ({
  id: row.id,
  key: row.key,
  name: row.name,
  ...(row.description ? { description: row.description } : {}),
  version: row.version,
  status: row.status,
  initialStatus: row.workflow_json.initialStatus ?? "",
  statuses: row.workflow_json.statuses ?? [],
  actions: toActionSummaries(row.workflow_json),
});

export const listWorkflowTemplates = async (): Promise<WorkflowTemplate[]> => {
  return withDb(async (client) => {
    const result = await client.query<WorkflowRow>(
      `select id, key, name, description, version, status, workflow_json
       from workflow_templates
       order by name asc, version desc`,
    );

    return result.rows.map(mapWorkflow);
  });
};
