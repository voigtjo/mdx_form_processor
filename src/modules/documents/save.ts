import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, getDocumentEditStateForUser } from "./access.js";
import { buildReadOnlyFormDefinition } from "../templates/form-read.js";
import type { ReadOnlyFormField } from "../../types/domain.js";

type SaveDocumentInput = {
  documentId: string;
  userId: string;
  submittedValues: Record<string, unknown>;
};

type SaveDocumentSuccess = {
  ok: true;
  documentId: string;
  savedFieldNames: string[];
};

type SaveDocumentFailure = {
  ok: false;
  reason: "document_not_visible" | "save_not_allowed" | "no_saveable_fields";
  details?: string;
};

export type SaveDocumentResult = SaveDocumentSuccess | SaveDocumentFailure;

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
  const visibleDocument = await findDocumentAccessContextForUser(documentId, userId);

  if (!visibleDocument || !visibleDocument.canRead) {
    return {
      ok: false,
      reason: "document_not_visible",
    };
  }

  const editState = await getDocumentEditStateForUser(documentId, userId);

  if (!editState.isAvailable) {
    return {
      ok: false,
      reason: "save_not_allowed",
      ...(editState.reason ? { details: editState.reason } : {}),
    };
  }

  const formDefinition = buildReadOnlyFormDefinition({
    templateId: visibleDocument.templateId,
    templateKey: visibleDocument.templateKey,
    templateName: visibleDocument.templateName,
    templateVersion: visibleDocument.templateVersion,
    templateStatus: visibleDocument.templateStatus,
    ...(visibleDocument.templateDescription ? { templateDescription: visibleDocument.templateDescription } : {}),
    mdxBody: visibleDocument.templateMdxBody,
    documentStatus: visibleDocument.status,
    documentData: visibleDocument.dataJson,
    workflowFieldRules: visibleDocument.workflowFieldRules,
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
    ...visibleDocument.dataJson,
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
