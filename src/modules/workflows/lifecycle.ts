import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";
import { parseWorkflowSourceText, serializeWorkflowSource } from "./source.js";

type WorkflowLifecycleResult = {
  id: string;
  version: number;
  status: "draft" | "published" | "inactive" | "archived";
};

type WorkflowBaseRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  version: number;
  status: "draft" | "published" | "inactive" | "archived";
  workflow_json: Record<string, unknown>;
  published_at: Date | null;
  archived_at: Date | null;
};

type TemplateUsageRow = {
  id: string;
  name: string;
  version: number;
};

const loadWorkflowBase = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  workflowId: string,
) => {
  const result = await client.query<WorkflowBaseRow>(
    `select id, key, name, description, version, status, workflow_json, published_at, archived_at
     from workflow_templates
     where id = $1
     limit 1`,
    [workflowId],
  );

  return result.rows[0] ?? null;
};

const loadPublishedTemplateUsages = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  workflowId: string,
) => {
  const result = await client.query<TemplateUsageRow>(
    `select id, name, version
     from form_templates
     where workflow_template_id = $1
       and status = 'published'
     order by version desc, updated_at desc`,
    [workflowId],
  );

  return result.rows;
};

const ensureWorkflow = (workflow: WorkflowBaseRow | null): WorkflowBaseRow => {
  if (!workflow) {
    throw new Error("Der angeforderte Workflow wurde nicht gefunden.");
  }

  return workflow;
};

const normalizeWorkflowSource = (sourceText: string): string => {
  const parsed = parseWorkflowSourceText(sourceText);
  return serializeWorkflowSource(parsed.workflowJson);
};

export const publishWorkflowVersion = async (input: {
  workflowId: string;
  sourceText?: string;
}): Promise<WorkflowLifecycleResult> => {
  return withDbTransaction(async (client) => {
    const workflow = ensureWorkflow(await loadWorkflowBase(client, input.workflowId));
    const normalizedSource = normalizeWorkflowSource(
      input.sourceText ?? serializeWorkflowSource(workflow.workflow_json),
    );

    if (workflow.status === "draft") {
      await client.query(
        `update workflow_templates
         set workflow_json = $2::jsonb,
             status = 'published',
             published_at = coalesce(published_at, now()),
             updated_at = now()
         where id = $1`,
        [workflow.id, normalizedSource],
      );

      return {
        id: workflow.id,
        version: workflow.version,
        status: "published",
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
             status = 'published',
             published_at = coalesce(published_at, now()),
             updated_at = now()
         where id = $1`,
        [existingDraft.id, normalizedSource],
      );

      return {
        id: existingDraft.id,
        version: existingDraft.version,
        status: "published",
      };
    }

    const versionResult = await client.query<{ next_version: number }>(
      `select coalesce(max(version), 0) + 1 as next_version
       from workflow_templates
       where key = $1`,
      [workflow.key],
    );
    const nextVersion = Number(versionResult.rows[0]?.next_version ?? workflow.version + 1);
    const publishedId = randomUUID();

    await client.query(
      `insert into workflow_templates (id, key, name, description, version, status, workflow_json, published_at)
       values ($1, $2, $3, $4, $5, 'published', $6::jsonb, now())`,
      [publishedId, workflow.key, workflow.name, workflow.description, nextVersion, normalizedSource],
    );

    return {
      id: publishedId,
      version: nextVersion,
      status: "published",
    };
  });
};

export const unpublishWorkflowVersion = async (input: {
  workflowId: string;
}): Promise<WorkflowLifecycleResult> => {
  return withDbTransaction(async (client) => {
    const workflow = ensureWorkflow(await loadWorkflowBase(client, input.workflowId));

    if (workflow.status !== "published") {
      throw new Error("Unpublish ist in diesem Schritt nur fuer publizierte Workflow-Versionen verfuegbar.");
    }

    const publishedTemplateUsages = await loadPublishedTemplateUsages(client, workflow.id);

    if (publishedTemplateUsages.length > 0) {
      const templateLabel = publishedTemplateUsages
        .slice(0, 3)
        .map((template) => `${template.name} v${template.version}`)
        .join(", ");
      const suffix = publishedTemplateUsages.length > 3 ? ", ..." : "";
      throw new Error(
        `Unpublish ist nicht moeglich, solange publizierte Templates diese Workflow-Version nutzen: ${templateLabel}${suffix}`,
      );
    }

    await client.query(
      `update workflow_templates
       set status = 'inactive',
           updated_at = now()
       where id = $1`,
      [workflow.id],
    );

    return {
      id: workflow.id,
      version: workflow.version,
      status: "inactive",
    };
  });
};

export const archiveWorkflowVersion = async (input: {
  workflowId: string;
}): Promise<WorkflowLifecycleResult> => {
  return withDbTransaction(async (client) => {
    const workflow = ensureWorkflow(await loadWorkflowBase(client, input.workflowId));

    if (workflow.status !== "inactive") {
      throw new Error("Archive ist in diesem Schritt erst moeglich, wenn die betrachtete Version unveroeffentlicht ist.");
    }

    await client.query(
      `update workflow_templates
       set status = 'archived',
           archived_at = coalesce(archived_at, now()),
           updated_at = now()
       where id = $1`,
      [workflow.id],
    );

    return {
      id: workflow.id,
      version: workflow.version,
      status: "archived",
    };
  });
};
