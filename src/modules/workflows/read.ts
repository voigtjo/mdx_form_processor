import { withDb } from "../../db/pool.js";
import type {
  WorkflowActionSummary,
  WorkflowHookSummary,
  WorkflowTemplate,
  WorkflowTemplateDetail,
} from "../../types/domain.js";

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
  published_at?: Date | null;
  archived_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
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

const toHookSummaries = (workflowJson: WorkflowRow["workflow_json"]): WorkflowHookSummary[] => {
  const hooks = Array.isArray((workflowJson as { hooks?: unknown }).hooks) ? (workflowJson as { hooks: unknown[] }).hooks : [];

  return hooks.flatMap((hook) => {
    if (!hook || typeof hook !== "object" || Array.isArray(hook)) {
      return [];
    }

    const record = hook as Record<string, unknown>;
    const trigger = typeof record.trigger === "string" ? record.trigger : undefined;

    if (!trigger) {
      return [];
    }

    return [
      {
        trigger,
        ...(typeof record.operationRef === "string" ? { operationRef: record.operationRef } : {}),
        ...(typeof record.description === "string" ? { description: record.description } : {}),
      },
    ];
  });
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

const mapWorkflowDetail = (row: WorkflowRow): WorkflowTemplateDetail => ({
  ...mapWorkflow(row),
  workflowJson: row.workflow_json as Record<string, unknown>,
  hooks: toHookSummaries(row.workflow_json),
  ...(row.published_at ? { publishedAt: row.published_at.toISOString() } : {}),
  ...(row.archived_at ? { archivedAt: row.archived_at.toISOString() } : {}),
  createdAt: (row.created_at ?? new Date()).toISOString(),
  updatedAt: (row.updated_at ?? new Date()).toISOString(),
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

export const findWorkflowTemplateById = async (workflowId: string): Promise<WorkflowTemplateDetail | null> => {
  return withDb(async (client) => {
    const result = await client.query<WorkflowRow>(
      `select id, key, name, description, version, status, workflow_json, published_at, archived_at, created_at, updated_at
       from workflow_templates
       where id = $1`,
      [workflowId],
    );

    const row = result.rows[0];
    return row ? mapWorkflowDetail(row) : null;
  });
};

export const listWorkflowTemplateVersions = async (workflowKey: string): Promise<WorkflowTemplate[]> => {
  return withDb(async (client) => {
    const result = await client.query<WorkflowRow>(
      `select id, key, name, description, version, status, workflow_json
       from workflow_templates
       where key = $1
       order by version desc, updated_at desc`,
      [workflowKey],
    );

    return result.rows.map(mapWorkflow);
  });
};
