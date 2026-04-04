import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";
import { parseFormRuntimeSource } from "../forms/read.js";
import { isFormRuntimeReferenceTemplate } from "../forms/document-bridge.js";
import { findOperationByKey } from "../operations/read.js";
import { publishWorkflowVersion } from "../workflows/lifecycle.js";
import { setTemplateSourceFrontmatterValue } from "./source.js";

type TemplateLifecycleResult = {
  id: string;
  version: number;
  status: "draft" | "published" | "inactive" | "archived";
};

type TemplateBaseRow = {
  id: string;
  key: string;
  name: string;
  form_type: "customer_order" | "production_record" | "qualification_record" | "generic_form";
  description: string | null;
  version: number;
  status: "draft" | "published" | "inactive" | "archived";
  workflow_template_id: string;
  mdx_body: string;
  template_keys: string[];
  document_keys: string[];
  table_fields: string[];
};

type TemplateAssignmentRow = {
  group_id: string;
  status: string;
  assigned_at: Date;
};

type WorkflowTemplateRow = {
  id: string;
  key: string;
  version: number;
  status: "draft" | "published" | "inactive" | "archived";
};

const loadTemplateBase = async (client: Parameters<Parameters<typeof withDbTransaction>[0]>[0], templateId: string) => {
  const result = await client.query<TemplateBaseRow>(
    `select
       id,
       key,
       name,
       form_type,
       description,
       version,
       status,
       workflow_template_id,
       mdx_body,
       template_keys,
       document_keys,
       table_fields
     from form_templates
     where id = $1
     limit 1`,
    [templateId],
  );

  return result.rows[0] ?? null;
};

const loadTemplateAssignments = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  templateId: string,
) => {
  const result = await client.query<TemplateAssignmentRow>(
    `select group_id, status, assigned_at
     from template_assignments
     where template_id = $1`,
    [templateId],
  );

  return result.rows;
};

const loadWorkflowBase = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  workflowId: string,
) => {
  const result = await client.query<WorkflowTemplateRow>(
    `select id, key, version, status
     from workflow_templates
     where id = $1
     limit 1`,
    [workflowId],
  );

  return result.rows[0] ?? null;
};

const copyTemplateAssignments = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  sourceTemplateId: string,
  targetTemplateId: string,
) => {
  const assignments = await loadTemplateAssignments(client, sourceTemplateId);

  for (const assignment of assignments) {
    await client.query(
      `insert into template_assignments (id, template_id, group_id, status, assigned_at)
       values ($1, $2, $3, $4, $5)`,
      [randomUUID(), targetTemplateId, assignment.group_id, assignment.status, assignment.assigned_at],
    );
  }
};

const ensureReferenceTemplate = (template: TemplateBaseRow | null): TemplateBaseRow => {
  if (!template) {
    throw new Error("Das angeforderte Template wurde nicht gefunden.");
  }

  if (!isFormRuntimeReferenceTemplate(template.key)) {
    throw new Error("Dieser Lifecycle-Schnitt ist in diesem Schritt nur fuer das Referenztemplate aktiv.");
  }

  return template;
};

const normalizeReferenceSource = (sourceText: string, version: number): string => {
  parseFormRuntimeSource(sourceText);
  return setTemplateSourceFrontmatterValue(sourceText, "version", String(version));
};

const validateReferencedOperations = async (sourceText: string, input: { requirePublished: boolean }) => {
  const parsedForm = parseFormRuntimeSource(sourceText);
  const operationRefs = Array.from(new Set(parsedForm.actions.flatMap((action) => (action.ref ? [action.ref] : []))));

  for (const operationRef of operationRefs) {
    const operation = await findOperationByKey(operationRef, {
      ...(input.requirePublished ? { publishedOnly: true } : {}),
    });

    if (!operation) {
      throw new Error(
        input.requirePublished
          ? `Die referenzierte API ${operationRef} ist nicht publiziert.`
          : `Die referenzierte API ${operationRef} wurde nicht gefunden.`,
      );
    }
  }
};

const resolveTemplateWorkflowVersion = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  workflowTemplateId: string,
  cascadePublishWorkflow: boolean,
) => {
  const workflow = await loadWorkflowBase(client, workflowTemplateId);

  if (!workflow) {
    throw new Error("Der zugeordnete Workflow wurde nicht gefunden.");
  }

  if (workflow.status === "archived") {
    throw new Error("Archivierte Workflow-Versionen koennen Templates nicht zugeordnet werden.");
  }

  if (workflow.status === "published") {
    return workflow.id;
  }

  if (!cascadePublishWorkflow) {
    throw new Error("Das Template kann nur publiziert werden, wenn die zugeordnete Workflow-Version publiziert ist oder Cascade Publish aktiv ist.");
  }

  const publishedWorkflow = await publishWorkflowVersion({
    workflowId: workflow.id,
  });

  return publishedWorkflow.id;
};

export const saveReferenceTemplateDraft = async (input: {
  templateId: string;
  sourceText: string;
  workflowTemplateId: string;
}): Promise<TemplateLifecycleResult> => {
  await validateReferencedOperations(input.sourceText, { requirePublished: false });

  return withDbTransaction(async (client) => {
    const template = ensureReferenceTemplate(await loadTemplateBase(client, input.templateId));
    const workflow = await loadWorkflowBase(client, input.workflowTemplateId);

    if (!workflow || workflow.status === "archived") {
      throw new Error("Bitte ordne dem Template eine aktive Workflow-Version zu.");
    }

    if (template.status === "draft") {
      const normalizedSource = normalizeReferenceSource(input.sourceText, template.version);

      await client.query(
        `update form_templates
         set mdx_body = $2,
             workflow_template_id = $3,
             updated_at = now()
         where id = $1`,
        [template.id, normalizedSource, input.workflowTemplateId],
      );

      return {
        id: template.id,
        version: template.version,
        status: "draft",
      };
    }

    const existingDraftResult = await client.query<Pick<TemplateBaseRow, "id" | "version">>(
      `select id, version
       from form_templates
       where key = $1
         and status = 'draft'
       order by version desc
       limit 1`,
      [template.key],
    );
    const existingDraft = existingDraftResult.rows[0];

    if (existingDraft) {
      const normalizedSource = normalizeReferenceSource(input.sourceText, existingDraft.version);

      await client.query(
        `update form_templates
         set mdx_body = $2,
             workflow_template_id = $3,
             updated_at = now()
         where id = $1`,
        [existingDraft.id, normalizedSource, input.workflowTemplateId],
      );

      return {
        id: existingDraft.id,
        version: existingDraft.version,
        status: "draft",
      };
    }

    const versionResult = await client.query<{ next_version: number }>(
      `select coalesce(max(version), 0) + 1 as next_version
       from form_templates
       where key = $1`,
      [template.key],
    );
    const nextVersion = Number(versionResult.rows[0]?.next_version ?? template.version + 1);
    const normalizedSource = normalizeReferenceSource(input.sourceText, nextVersion);
    const draftId = randomUUID();

    await client.query(
      `insert into form_templates (
         id, key, name, description, version, form_type, status, workflow_template_id, mdx_body,
         template_keys, document_keys, table_fields, visibility_rules
       )
       values ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, '{}'::jsonb)`,
      [
        draftId,
        template.key,
        template.name,
        template.description,
        nextVersion,
        template.form_type,
        input.workflowTemplateId,
        normalizedSource,
        JSON.stringify(template.template_keys ?? []),
        JSON.stringify(template.document_keys ?? []),
        JSON.stringify(template.table_fields ?? []),
      ],
    );

    await copyTemplateAssignments(client, template.id, draftId);

    return {
      id: draftId,
      version: nextVersion,
      status: "draft",
    };
  });
};

export const publishReferenceTemplateVersion = async (input: {
  templateId: string;
  sourceText: string;
  workflowTemplateId: string;
  cascadePublishWorkflow: boolean;
}): Promise<TemplateLifecycleResult> => {
  await validateReferencedOperations(input.sourceText, { requirePublished: true });

  return withDbTransaction(async (client) => {
    const template = ensureReferenceTemplate(await loadTemplateBase(client, input.templateId));

    if (template.status === "draft") {
      const normalizedSource = normalizeReferenceSource(input.sourceText, template.version);
      const targetWorkflowTemplateId = await resolveTemplateWorkflowVersion(
        client,
        input.workflowTemplateId,
        input.cascadePublishWorkflow,
      );

      await client.query(
        `update form_templates
         set status = 'inactive',
             updated_at = now()
         where key = $1
           and status = 'published'`,
        [template.key],
      );

      await client.query(
        `update form_templates
         set mdx_body = $2,
             workflow_template_id = $3,
             status = 'published',
             published_at = now(),
             updated_at = now()
         where id = $1`,
        [template.id, normalizedSource, targetWorkflowTemplateId],
      );

      return {
        id: template.id,
        version: template.version,
        status: "published",
      };
    }

    const versionResult = await client.query<{ next_version: number }>(
      `select coalesce(max(version), 0) + 1 as next_version
       from form_templates
       where key = $1`,
      [template.key],
    );
    const nextVersion = Number(versionResult.rows[0]?.next_version ?? template.version + 1);
    const normalizedSource = normalizeReferenceSource(input.sourceText, nextVersion);
    const targetWorkflowTemplateId = await resolveTemplateWorkflowVersion(
      client,
      input.workflowTemplateId,
      input.cascadePublishWorkflow,
    );
    const publishedId = randomUUID();

    await client.query(
      `update form_templates
       set status = 'inactive',
           updated_at = now()
       where key = $1
         and status = 'published'`,
      [template.key],
    );

    await client.query(
      `insert into form_templates (
         id, key, name, form_type, description, version, status, workflow_template_id, mdx_body,
         template_keys, document_keys, table_fields, visibility_rules, published_at
       )
       values ($1, $2, $3, $4, $5, $6, 'published', $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, '{}'::jsonb, now())`,
      [
        publishedId,
        template.key,
        template.name,
        template.form_type,
        template.description,
        nextVersion,
        targetWorkflowTemplateId,
        normalizedSource,
        JSON.stringify(template.template_keys ?? []),
        JSON.stringify(template.document_keys ?? []),
        JSON.stringify(template.table_fields ?? []),
      ],
    );

    await copyTemplateAssignments(client, template.id, publishedId);

    return {
      id: publishedId,
      version: nextVersion,
      status: "published",
    };
  });
};

export const unpublishReferenceTemplateVersion = async (input: {
  templateId: string;
}): Promise<TemplateLifecycleResult> => {
  return withDbTransaction(async (client) => {
    const template = ensureReferenceTemplate(await loadTemplateBase(client, input.templateId));

    if (template.status !== "published") {
      throw new Error("Unpublish ist in diesem Schritt nur fuer publizierte Referenz-Templates verfuegbar.");
    }

    await client.query(
      `update form_templates
       set status = 'inactive',
           updated_at = now()
       where id = $1`,
      [template.id],
    );

    return {
      id: template.id,
      version: template.version,
      status: "inactive",
    };
  });
};

export const archiveReferenceTemplateFamily = async (input: {
  templateId: string;
}): Promise<TemplateLifecycleResult> => {
  return withDbTransaction(async (client) => {
    const template = ensureReferenceTemplate(await loadTemplateBase(client, input.templateId));

    if (template.status !== "inactive") {
      throw new Error("Archive ist in diesem Schritt erst moeglich, wenn die betrachtete Version unveroeffentlicht ist.");
    }

    await client.query(
      `update form_templates
       set status = 'archived',
           archived_at = coalesce(archived_at, now()),
           updated_at = now()
       where key = $1
         and status <> 'archived'`,
      [template.key],
    );

    return {
      id: template.id,
      version: template.version,
      status: "archived",
    };
  });
};
