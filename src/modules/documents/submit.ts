import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, type DocumentAccessContext, type WorkflowJson } from "./access.js";
import { buildReadOnlyFormDefinition } from "../templates/form-read.js";

type SubmitDocumentInput = {
  documentId: string;
  userId: string;
};

type SubmitState = {
  isAvailable: boolean;
  nextStatus?: string;
  reason?: string;
};

type SubmitDocumentSuccess = {
  ok: true;
  documentId: string;
  nextStatus: string;
};

type SubmitDocumentFailure = {
  ok: false;
  reason: "document_not_visible" | "submit_not_allowed" | "minimal_data_missing";
  details?: string;
};

export type SubmitDocumentResult = SubmitDocumentSuccess | SubmitDocumentFailure;

const readSubmitTransition = (workflowJson: WorkflowJson): { from: string[]; to: string } | null => {
  const submitAction = workflowJson.actions?.submit;

  if (!submitAction?.to) {
    return null;
  }

  return {
    from: submitAction.from ?? [],
    to: submitAction.to,
  };
};

const isMissingRequiredValue = (value: unknown): boolean => {
  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return value === null || value === undefined;
};

const getMissingRequiredFieldLabels = (document: DocumentAccessContext): string[] => {
  const formDefinition = buildReadOnlyFormDefinition({
    templateId: document.templateId,
    templateKey: document.templateKey,
    templateName: document.templateName,
    templateVersion: document.templateVersion,
    templateStatus: document.templateStatus,
    ...(document.templateDescription ? { templateDescription: document.templateDescription } : {}),
    mdxBody: document.templateMdxBody,
    documentStatus: document.status,
    documentData: document.dataJson,
    workflowFieldRules: document.workflowFieldRules,
  });

  return formDefinition.fields
    .filter((field) => field.flags.includes("required") && field.isSavable)
    .filter((field) => isMissingRequiredValue(document.dataJson[field.name]))
    .map((field) => field.label);
};

export const getDocumentSubmitStateForUser = async (documentId: string, userId: string): Promise<SubmitState> => {
  const document = await findDocumentAccessContextForUser(documentId, userId);

  if (!document || !document.canRead) {
    return {
      isAvailable: false,
      reason: "Dokument ist nicht sichtbar.",
    };
  }

  if (!document.hasEditorAssignment) {
    return {
      isAvailable: false,
      reason: "Submit setzt eine aktive Editor-Zuweisung voraus.",
    };
  }

  if (!document.canExecute) {
    return {
      isAvailable: false,
      reason: "Submit setzt Membership-Recht x voraus.",
    };
  }

  const submitTransition = readSubmitTransition(document.workflowJson);

  if (!submitTransition || !submitTransition.from.includes(document.status)) {
    return {
      isAvailable: false,
      reason: "Submit ist im aktuellen Status nicht verfuegbar.",
    };
  }

  const missingFieldLabels = getMissingRequiredFieldLabels(document);

  if (missingFieldLabels.length > 0) {
    return {
      isAvailable: false,
      reason: `Pflichtfelder fehlen: ${missingFieldLabels.join(", ")}.`,
    };
  }

  return {
    isAvailable: true,
    nextStatus: submitTransition.to,
  };
};

export const submitDocumentForUser = async ({ documentId, userId }: SubmitDocumentInput): Promise<SubmitDocumentResult> => {
  const document = await findDocumentAccessContextForUser(documentId, userId);

  if (!document || !document.canRead) {
    return {
      ok: false,
      reason: "document_not_visible",
    };
  }

  if (!document.hasEditorAssignment) {
    return {
      ok: false,
      reason: "submit_not_allowed",
      details: "Submit setzt eine aktive Editor-Zuweisung voraus.",
    };
  }

  if (!document.canExecute) {
    return {
      ok: false,
      reason: "submit_not_allowed",
      details: "Submit setzt Membership-Recht x voraus.",
    };
  }

  const submitTransition = readSubmitTransition(document.workflowJson);

  if (!submitTransition || !submitTransition.from.includes(document.status)) {
    return {
      ok: false,
      reason: "submit_not_allowed",
      details: "Submit ist im aktuellen Status nicht verfuegbar.",
    };
  }

  const missingFieldLabels = getMissingRequiredFieldLabels(document);

  if (missingFieldLabels.length > 0) {
    return {
      ok: false,
      reason: "minimal_data_missing",
      details: `Pflichtfelder fehlen: ${missingFieldLabels.join(", ")}.`,
    };
  }

  return withDbTransaction(async (client) => {
    await client.query(
      `
      update documents
      set status = $2,
          updated_at = now()
      where id = $1
      `,
      [documentId, submitTransition.to],
    );

    await client.query(
      `
      update tasks
      set status = 'closed',
          updated_at = now()
      where document_id = $1
        and status = 'open'
        and role = 'editor'
      `,
      [documentId],
    );

    await client.query(
      `
      insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
      values ($1, 'submitted', $2, $3, $4::jsonb)
      `,
      [
        documentId,
        userId,
        `${document.title} submitted.`,
        JSON.stringify({
          fromStatus: document.status,
          toStatus: submitTransition.to,
        }),
      ],
    );

    return {
      ok: true,
      documentId,
      nextStatus: submitTransition.to,
    };
  });
};
