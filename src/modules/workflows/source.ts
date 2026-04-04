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

type WorkflowTableRowInput = {
  actionName: string;
  fromText: string;
  to: string;
  rolesText: string;
  mode: string;
  api: string;
  condition: string;
};

type WorkflowTableInput = {
  baselineSourceText?: string;
  initialStatus: string;
  statusesText: string;
  rows: WorkflowTableRowInput[];
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

const parseStatusList = (value: string): string[] => {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const parseRoles = (value: string): string[] => {
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const parseConditionInput = (value: string): Record<string, unknown> | undefined => {
  const normalized = value.trim();

  if (!normalized || normalized === "—") {
    return undefined;
  }

  if (normalized.startsWith("requiredFields:")) {
    const requiredFields = normalized
      .slice("requiredFields:".length)
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);

    if (requiredFields.length === 0) {
      throw new Error("Condition requiredFields braucht mindestens ein Feld.");
    }

    return {
      requiredFields,
    };
  }

  try {
    const parsed = JSON.parse(normalized) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("Condition muss ein JSON-Objekt sein.");
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.message === "Condition muss ein JSON-Objekt sein.") {
      throw error;
    }

    throw new Error("Condition muss leer, requiredFields: ... oder ein JSON-Objekt sein.");
  }
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

export const buildWorkflowSourceTextFromTableInput = (input: WorkflowTableInput): string => {
  let workflowJson: Record<string, unknown> = {};

  if (input.baselineSourceText?.trim()) {
    try {
      workflowJson = JSON.parse(input.baselineSourceText) as Record<string, unknown>;
    } catch {
      workflowJson = {};
    }
  }

  const statuses = parseStatusList(input.statusesText);
  const initialStatus = input.initialStatus.trim();

  if (!initialStatus) {
    throw new Error("Initialstatus darf nicht leer sein.");
  }

  if (statuses.length === 0) {
    throw new Error("Statusfolge darf nicht leer sein.");
  }

  const normalizedRows = input.rows
    .map((row) => ({
      actionName: row.actionName.trim(),
      from: parseStatusList(row.fromText),
      to: row.to.trim(),
      roles: parseRoles(row.rolesText),
      mode: row.mode.trim().toUpperCase() === "AND" ? "all" : "single",
      api: row.api.trim(),
      condition: row.condition.trim(),
    }))
    .filter((row) => row.actionName.length > 0 || row.to.length > 0 || row.from.length > 0 || row.roles.length > 0 || row.api.length > 0 || row.condition.length > 0);

  if (!statuses.includes(initialStatus)) {
    throw new Error("Initialstatus muss in der Statusfolge enthalten sein.");
  }

  if (normalizedRows.length === 0) {
    throw new Error("Mindestens eine Workflow-Action ist erforderlich.");
  }

  const existingHooks = Array.isArray(workflowJson.hooks)
    ? workflowJson.hooks.filter((hook): hook is Record<string, unknown> => Boolean(hook) && typeof hook === "object" && !Array.isArray(hook))
    : [];
  const hookEntries = existingHooks.flatMap((hook) => {
    const trigger = typeof hook.trigger === "string" ? hook.trigger : "";
    return trigger.length > 0 ? [[trigger, hook] as const] : [];
  });
  const hooksByTrigger = new Map<string, Record<string, unknown>>(hookEntries);
  const updatedHooks = existingHooks.filter((hook) => {
    const trigger = typeof hook.trigger === "string" ? hook.trigger : "";
    return !normalizedRows.some((row) => row.actionName === trigger);
  });
  const actions: Record<string, Record<string, unknown>> = {};

  for (const row of normalizedRows) {
    if (!row.actionName) {
      throw new Error("Jede gepflegte Workflow-Zeile braucht einen Action-Namen.");
    }

    if (row.from.length === 0) {
      throw new Error(`Action ${row.actionName} braucht mindestens einen From-Status.`);
    }

    if (!row.to) {
      throw new Error(`Action ${row.actionName} braucht einen To-Status.`);
    }

    if (row.roles.length === 0) {
      throw new Error(`Action ${row.actionName} braucht mindestens eine Rolle.`);
    }

    if (row.from.some((status) => !statuses.includes(status)) || !statuses.includes(row.to)) {
      throw new Error(`Action ${row.actionName} referenziert unbekannte Status.`);
    }

    if (row.roles.some((role) => !allowedRoles.has(role))) {
      throw new Error(`Action ${row.actionName} enthaelt ungueltige Rollen.`);
    }

    const actionRecord: Record<string, unknown> = {
      from: row.from,
      to: row.to,
      allowedRoles: row.roles,
      completionMode: row.mode,
    };
    const condition = parseConditionInput(row.condition);

    if (condition) {
      actionRecord.validation = condition;
    }

    actions[row.actionName] = actionRecord;

    if (row.api) {
      const existingHook = hooksByTrigger.get(row.actionName);
      updatedHooks.push({
        ...(existingHook ?? {}),
        trigger: row.actionName,
        operationRef: row.api,
      });
    }
  }

  workflowJson = {
    ...workflowJson,
    initialStatus,
    statuses,
    actions,
    hooks: updatedHooks,
  };

  parseWorkflowSourceText(JSON.stringify(workflowJson));
  return serializeWorkflowSource(workflowJson);
};

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
