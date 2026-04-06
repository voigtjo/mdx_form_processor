import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, getDocumentEditStateForUser } from "../documents/access.js";
import { buildReferenceFormRuntimeJournalDefinition, referenceFormRuntimeJournalFieldName } from "./reference.js";
import { isFormRuntimeReferenceTemplate } from "../forms/document-bridge.js";
import { readTemplateFeatureToggles } from "../templates/features.js";
import { buildReadOnlyFormDefinition } from "../templates/form-read.js";

type AddJournalEntryInput = {
  documentId: string;
  userId: string;
  userDisplayName: string;
  journalFieldName: string;
  entryText: string;
};

type AddJournalEntrySuccess = {
  ok: true;
  documentId: string;
  journalFieldName: string;
};

type AddJournalEntryFailure = {
  ok: false;
  reason: "document_not_visible" | "journal_not_editable" | "invalid_entry";
  details?: string;
};

export type AddJournalEntryResult = AddJournalEntrySuccess | AddJournalEntryFailure;

type DocumentJournalWriteState = {
  isAvailable: boolean;
  reason?: string;
};

const normalizeExistingJournalEntries = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry));
};

const getDocumentJournalWriteState = async (documentId: string, userId: string): Promise<DocumentJournalWriteState> => {
  const visibleDocument = await findDocumentAccessContextForUser(documentId, userId);

  if (!visibleDocument || !visibleDocument.canRead) {
    return {
      isAvailable: false,
      reason: "Dokument ist nicht sichtbar.",
    };
  }

  const templateFeatures = readTemplateFeatureToggles({
    templateKey: visibleDocument.templateKey,
    mdxBody: visibleDocument.templateMdxBody,
  });

  if (!templateFeatures.journal.enabled) {
    return {
      isAvailable: false,
      reason: "Journal ist im aktuellen Template nicht aktiviert.",
    };
  }

  const editState = await getDocumentEditStateForUser(documentId, userId);

  if (editState.isAvailable) {
    return {
      isAvailable: true,
    };
  }

  if (
    visibleDocument.hasApproverAssignment &&
    visibleDocument.canExecute &&
    ["submitted", "approved"].includes(visibleDocument.status)
  ) {
    return {
      isAvailable: true,
    };
  }

  return {
    isAvailable: false,
    ...(editState.reason ? { reason: editState.reason } : {}),
  };
};

export const getDocumentJournalWriteStateForUser = getDocumentJournalWriteState;

export const addJournalEntryForUser = async ({
  documentId,
  userId,
  userDisplayName,
  journalFieldName,
  entryText,
}: AddJournalEntryInput): Promise<AddJournalEntryResult> => {
  const visibleDocument = await findDocumentAccessContextForUser(documentId, userId);

  if (!visibleDocument || !visibleDocument.canRead) {
    return {
      ok: false,
      reason: "document_not_visible",
    };
  }

  const journalWriteState = await getDocumentJournalWriteState(documentId, userId);

  if (!journalWriteState.isAvailable) {
    return {
      ok: false,
      reason: "journal_not_editable",
      ...(journalWriteState.reason ? { details: journalWriteState.reason } : {}),
    };
  }

  const trimmedEntryText = entryText.trim();

  if (trimmedEntryText.length === 0) {
    return {
      ok: false,
      reason: "invalid_entry",
      details: "Bitte einen Journal-Eintrag erfassen.",
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
  const templateFeatures = readTemplateFeatureToggles({
    templateKey: visibleDocument.templateKey,
    mdxBody: visibleDocument.templateMdxBody,
  });

  const journal = formDefinition.journals.find((entry) => entry.name === journalFieldName)
    ?? (
      isFormRuntimeReferenceTemplate(visibleDocument.templateKey) && journalFieldName === referenceFormRuntimeJournalFieldName
        ? buildReferenceFormRuntimeJournalDefinition({
          documentData: visibleDocument.dataJson,
          isEditable: journalWriteState.isAvailable,
        })
        : undefined
    );

  if (!journal || !journal.isEditable) {
    return {
      ok: false,
      reason: "journal_not_editable",
      details: "Journal ist im aktuellen Status nicht bearbeitbar.",
    };
  }

  const existingEntries = normalizeExistingJournalEntries(visibleDocument.dataJson[journalFieldName]);
  const nextEntry = {
    at: new Date().toISOString(),
    text: trimmedEntryText,
    by: userDisplayName,
    by_user_id: userId,
  };
  const mergedDocumentData = {
    ...visibleDocument.dataJson,
    [journalFieldName]: [...existingEntries, nextEntry],
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
      values ($1, 'journal_added', $2, $3, $4::jsonb)
      `,
      [
        documentId,
        userId,
        `Journal entry added to ${journal.label}.`,
        JSON.stringify({
          journalFieldName,
          entryText: trimmedEntryText,
        }),
      ],
    );

    return {
      ok: true,
      documentId,
      journalFieldName,
    };
  });
};
