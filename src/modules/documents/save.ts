import { withDb, withDbTransaction } from "../../db/pool.js";
import { buildReadOnlyFormDefinition } from "../templates/form-read.js";
import type { ReadOnlyFormField, WorkflowFieldRules } from "../../types/domain.js";

type SaveDocumentInput = {
  documentId: string;
  userId: string;
  submittedValues: Record<string, unknown>;
};

type SaveableDocumentRow = {
  id: string;
  status: string;
  data_json: Record<string, unknown> | null;
  template_id: string;
  template_key: string;
  template_name: string;
  template_description: string | null;
  template_status: "active" | "inactive" | "draft" | "published" | "archived";
  template_version: number;
  template_mdx_body: string;
  workflow_field_rules: WorkflowFieldRules | null;
};

type SaveDocumentSuccess = {
  ok: true;
  documentId: string;
  savedFieldNames: string[];
};

type SaveDocumentFailure = {
  ok: false;
  reason: "document_not_visible" | "no_saveable_fields";
};

export type SaveDocumentResult = SaveDocumentSuccess | SaveDocumentFailure;

const findSaveableDocument = async (
  documentId: string,
  userId: string,
): Promise<SaveableDocumentRow | null> => {
  return withDb(async (client) => {
    const result = await client.query<SaveableDocumentRow>(
      `
      select distinct on (d.id)
        d.id,
        d.status,
        d.data_json,
        d.template_id,
        ft.key as template_key,
        ft.name as template_name,
        ft.description as template_description,
        ft.status as template_status,
        d.template_version,
        ft.mdx_body as template_mdx_body,
        wt.workflow_json->'fieldRules' as workflow_field_rules
      from documents d
      inner join form_templates ft on ft.id = d.template_id
      inner join workflow_templates wt on wt.id = d.workflow_template_id
      inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
      inner join memberships m on m.group_id = ta.group_id
      where d.id = $1
        and m.user_id = $2
      order by d.id
      `,
      [documentId, userId],
    );

    return result.rows[0] ?? null;
  });
};

const normalizeTextValue = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.find((entry): entry is string => typeof entry === "string");
  }

  return undefined;
};

const normalizeCheckboxValues = (value: unknown): string[] => {
  if (typeof value === "string") {
    return value.length > 0 ? [value] : [];
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  }

  return [];
};

const collectUpdatedFieldValues = (
  fields: ReadOnlyFormField[],
  submittedValues: Record<string, unknown>,
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.type === "checkboxGroup") {
      updates[field.name] = normalizeCheckboxValues(submittedValues[field.name]);
      continue;
    }

    if (field.type === "text" || field.type === "textarea") {
      const normalized = normalizeTextValue(submittedValues[field.name]);

      if (normalized !== undefined) {
        updates[field.name] = normalized;
      }
    }
  }

  return updates;
};

export const saveDocumentValuesForUser = async ({
  documentId,
  userId,
  submittedValues,
}: SaveDocumentInput): Promise<SaveDocumentResult> => {
  const visibleDocument = await findSaveableDocument(documentId, userId);

  if (!visibleDocument) {
    return {
      ok: false,
      reason: "document_not_visible",
    };
  }

  const formDefinition = buildReadOnlyFormDefinition({
    templateId: visibleDocument.template_id,
    templateKey: visibleDocument.template_key,
    templateName: visibleDocument.template_name,
    templateVersion: visibleDocument.template_version,
    templateStatus: visibleDocument.template_status,
    ...(visibleDocument.template_description ? { templateDescription: visibleDocument.template_description } : {}),
    mdxBody: visibleDocument.template_mdx_body,
    documentStatus: visibleDocument.status,
    documentData: visibleDocument.data_json ?? {},
    workflowFieldRules: visibleDocument.workflow_field_rules ?? {},
  });

  const saveableFields = formDefinition.fields.filter((field) => field.isSavable);

  if (saveableFields.length === 0) {
    return {
      ok: false,
      reason: "no_saveable_fields",
    };
  }

  const updatedFieldValues = collectUpdatedFieldValues(saveableFields, submittedValues);
  const mergedDocumentData = {
    ...(visibleDocument.data_json ?? {}),
    ...updatedFieldValues,
  };

  return withDbTransaction(async (client) => {
    await client.query(
      `
      update documents
      set data_json = $2::jsonb,
          updated_at = now()
      where id = $1
      `,
      [documentId, JSON.stringify(mergedDocumentData)],
    );

    await client.query(
      `
      insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
      values ($1, 'saved', $2, $3, $4::jsonb)
      `,
      [
        documentId,
        userId,
        "Document values saved.",
        JSON.stringify({
          savedFieldNames: Object.keys(updatedFieldValues),
          savedValues: updatedFieldValues,
        }),
      ],
    );

    return {
      ok: true,
      documentId,
      savedFieldNames: Object.keys(updatedFieldValues),
    };
  });
};
