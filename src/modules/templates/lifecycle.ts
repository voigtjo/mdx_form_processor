import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";
import { parseNextFormSource } from "../next-form/read.js";
import { isNextFormReferenceTemplate } from "../next-form/document-bridge.js";
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

const loadTemplateBase = async (client: Parameters<Parameters<typeof withDbTransaction>[0]>[0], templateId: string) => {
  const result = await client.query<TemplateBaseRow>(
    `select
       id,
       key,
       name,
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

  if (!isNextFormReferenceTemplate(template.key)) {
    throw new Error("Dieser Lifecycle-Schnitt ist in diesem Schritt nur fuer das Referenztemplate aktiv.");
  }

  return template;
};

const normalizeReferenceSource = (sourceText: string, version: number): string => {
  parseNextFormSource(sourceText);
  return setTemplateSourceFrontmatterValue(sourceText, "version", String(version));
};

export const saveReferenceTemplateDraft = async (input: {
  templateId: string;
  sourceText: string;
}): Promise<TemplateLifecycleResult> => {
  return withDbTransaction(async (client) => {
    const template = ensureReferenceTemplate(await loadTemplateBase(client, input.templateId));

    if (template.status === "draft") {
      const normalizedSource = normalizeReferenceSource(input.sourceText, template.version);

      await client.query(
        `update form_templates
         set mdx_body = $2,
             updated_at = now()
         where id = $1`,
        [template.id, normalizedSource],
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
         id, key, name, description, version, status, workflow_template_id, mdx_body,
         template_keys, document_keys, table_fields, visibility_rules
       )
       values ($1, $2, $3, $4, $5, 'draft', $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, '{}'::jsonb)`,
      [
        draftId,
        template.key,
        template.name,
        template.description,
        nextVersion,
        template.workflow_template_id,
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
}): Promise<TemplateLifecycleResult> => {
  return withDbTransaction(async (client) => {
    const template = ensureReferenceTemplate(await loadTemplateBase(client, input.templateId));

    if (template.status === "draft") {
      const normalizedSource = normalizeReferenceSource(input.sourceText, template.version);

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
             status = 'published',
             published_at = now(),
             updated_at = now()
         where id = $1`,
        [template.id, normalizedSource],
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
         id, key, name, description, version, status, workflow_template_id, mdx_body,
         template_keys, document_keys, table_fields, visibility_rules, published_at
       )
       values ($1, $2, $3, $4, $5, 'published', $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, '{}'::jsonb, now())`,
      [
        publishedId,
        template.key,
        template.name,
        template.description,
        nextVersion,
        template.workflow_template_id,
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
