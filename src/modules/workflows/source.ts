import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";

type WorkflowBaseRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  version: number;
  status: "draft" | "published" | "inactive" | "archived";
  workflow_json: Record<string, unknown>;
};

type ParsedWorkflowAction = {
  actionName: string;
  from: string[];
  to: string;
  roles: string[];
  rolesLabel: string;
  modeLabel: string;
  apiLabel: string;
  conditionLabel: string;
};

type ParsedWorkflowSource = {
  workflowJson: Record<string, unknown>;
  statuses: string[];
  transitionRows: ParsedWorkflowAction[];
};

const allowedRoles = new Set(["editor", "approver"]);

const normalizeMode = (value: unknown): string => {
  if (value === "all") {
    return "AND";
  }

  return "OR";
};

const formatCondition = (value: unknown): string => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "—";
  }

  const record = value as Record<string, unknown>;
  const requiredFields = Array.isArray(record.requiredFields)
    ? record.requiredFields.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];

  if (requiredFields.length > 0) {
    return `requiredFields: ${requiredFields.join(", ")}`;
  }

  const compactJson = JSON.stringify(record);
  return compactJson && compactJson !== "{}" ? compactJson : "—";
};

const extractHooks = (workflowJson: Record<string, unknown>) => {
  const rawHooks = Array.isArray(workflowJson.hooks) ? workflowJson.hooks : [];

  return rawHooks.flatMap((hook) => {
    if (!hook || typeof hook !== "object" || Array.isArray(hook)) {
      return [];
    }

    const record = hook as Record<string, unknown>;
    const trigger = typeof record.trigger === "string" ? record.trigger : "";
    const operationRef = typeof record.operationRef === "string" ? record.operationRef : "";

    if (!trigger) {
      return [];
    }

    return [{
      trigger,
      operationRef,
    }];
  });
};

const validateWorkflowJson = (workflowJson: Record<string, unknown>): string[] => {
  const statuses = Array.isArray(workflowJson.statuses)
    ? workflowJson.statuses.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
    : [];
  const initialStatus = typeof workflowJson.initialStatus === "string" ? workflowJson.initialStatus : "";
  const actions = workflowJson.actions;

  if (!initialStatus) {
    throw new Error("initialStatus muss als String vorhanden sein.");
  }

  if (statuses.length === 0) {
    throw new Error("statuses muss mindestens einen gueltigen Status enthalten.");
  }

  if (!statuses.includes(initialStatus)) {
    throw new Error("initialStatus muss in statuses enthalten sein.");
  }

  if (!actions || typeof actions !== "object" || Array.isArray(actions)) {
    throw new Error("actions muss als Objekt vorhanden sein.");
  }

  for (const [actionName, actionValue] of Object.entries(actions as Record<string, unknown>)) {
    if (!actionValue || typeof actionValue !== "object" || Array.isArray(actionValue)) {
      throw new Error(`Action ${actionName} ist ungueltig.`);
    }

    const action = actionValue as Record<string, unknown>;
    const from = Array.isArray(action.from)
      ? action.from.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];
    const to = typeof action.to === "string" ? action.to : "";
    const roles = Array.isArray(action.allowedRoles)
      ? action.allowedRoles.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];

    if (from.length === 0) {
      throw new Error(`Action ${actionName} braucht mindestens einen from-Status.`);
    }

    if (!to) {
      throw new Error(`Action ${actionName} braucht einen to-Status.`);
    }

    if (!statuses.includes(to) || from.some((status) => !statuses.includes(status))) {
      throw new Error(`Action ${actionName} referenziert unbekannte Status.`);
    }

    if (roles.length === 0 || roles.some((role) => !allowedRoles.has(role))) {
      throw new Error(`Action ${actionName} braucht gueltige allowedRoles.`);
    }
  }

  return statuses;
};

export const parseWorkflowSourceText = (sourceText: string): ParsedWorkflowSource => {
  let workflowJson: Record<string, unknown>;

  try {
    workflowJson = JSON.parse(sourceText) as Record<string, unknown>;
  } catch {
    throw new Error("Workflow Source ist kein gueltiges JSON.");
  }

  const statuses = validateWorkflowJson(workflowJson);

  const hooks = extractHooks(workflowJson);
  const rawActions = workflowJson.actions as Record<string, Record<string, unknown>>;
  const transitionRows = Object.entries(rawActions).map(([actionName, action]) => {
    const from = Array.isArray(action.from)
      ? action.from.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];
    const to = typeof action.to === "string" ? action.to : "—";
    const roles = Array.isArray(action.allowedRoles)
      ? action.allowedRoles.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];
    const matchingHooks = hooks.filter((hook) => {
      if (hook.trigger === actionName) {
        return true;
      }

      return from.some((status) => hook.trigger === `${status}->${to}`);
    });

    return {
      actionName,
      from,
      to,
      roles,
      rolesLabel: roles.length > 0 ? roles.join(", ") : "—",
      modeLabel: normalizeMode(action.completionMode),
      apiLabel: matchingHooks.length > 0
        ? matchingHooks.map((hook) => hook.operationRef || hook.trigger).join(", ")
        : "—",
      conditionLabel: formatCondition(action.validation),
    };
  });

  return {
    workflowJson,
    statuses,
    transitionRows,
  };
};

export const serializeWorkflowSource = (workflowJson: Record<string, unknown>): string => JSON.stringify(workflowJson, null, 2);

const loadWorkflowBase = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  workflowId: string,
) => {
  const result = await client.query<WorkflowBaseRow>(
    `select id, key, name, description, version, status, workflow_json
     from workflow_templates
     where id = $1
     limit 1`,
    [workflowId],
  );

  return result.rows[0] ?? null;
};

export const saveWorkflowDraftSource = async (input: {
  workflowId: string;
  sourceText: string;
}): Promise<{ id: string; version: number; status: "draft" }> => {
  const parsed = parseWorkflowSourceText(input.sourceText);
  const normalizedSource = serializeWorkflowSource(parsed.workflowJson);

  return withDbTransaction(async (client) => {
    const workflow = await loadWorkflowBase(client, input.workflowId);

    if (!workflow) {
      throw new Error("Der angeforderte Workflow wurde nicht gefunden.");
    }

    if (workflow.status === "draft") {
      await client.query(
        `update workflow_templates
         set workflow_json = $2::jsonb,
             updated_at = now()
         where id = $1`,
        [workflow.id, normalizedSource],
      );

      return {
        id: workflow.id,
        version: workflow.version,
        status: "draft",
      };
    }

    const existingDraftResult = await client.query<Pick<WorkflowBaseRow, "id" | "version">>(
      `select id, version
       from workflow_templates
       where key = $1
         and status = 'draft'
       order by version desc
       limit 1`,
      [workflow.key],
    );
    const existingDraft = existingDraftResult.rows[0];

    if (existingDraft) {
      await client.query(
        `update workflow_templates
         set workflow_json = $2::jsonb,
             updated_at = now()
         where id = $1`,
        [existingDraft.id, normalizedSource],
      );

      return {
        id: existingDraft.id,
        version: existingDraft.version,
        status: "draft",
      };
    }

    const nextVersionResult = await client.query<{ next_version: number }>(
      `select coalesce(max(version), 0) + 1 as next_version
       from workflow_templates
       where key = $1`,
      [workflow.key],
    );
    const nextVersion = Number(nextVersionResult.rows[0]?.next_version ?? workflow.version + 1);
    const draftId = randomUUID();

    await client.query(
      `insert into workflow_templates (id, key, name, description, version, status, workflow_json)
       values ($1, $2, $3, $4, $5, 'draft', $6::jsonb)`,
      [draftId, workflow.key, workflow.name, workflow.description, nextVersion, normalizedSource],
    );

    return {
      id: draftId,
      version: nextVersion,
      status: "draft",
    };
  });
};
