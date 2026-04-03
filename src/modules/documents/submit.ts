import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, type DocumentAccessContext, type WorkflowJson } from "./access.js";
import { buildReadOnlyFormDefinition } from "../templates/form-read.js";
import { isNextFormReferenceTemplate, mapDocumentDataToNextFormValues } from "../next-form/document-bridge.js";
import { referenceNextFormSubmitRequiredFieldNames } from "../next-form/document-ui.js";

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

const getAllowedSubmitFromStatuses = (
  document: DocumentAccessContext,
  submitTransition: { from: string[]; to: string },
): string[] => {
  const allowedStatuses = [...submitTransition.from];

  // The reference next-form slice deliberately works as a compact primary work area.
  // For this slice we allow the first submit directly from "created" once the
  // required next-form values have been filled and saved into the document.
  if (isNextFormReferenceTemplate(document.templateKey) && document.status === "created" && !allowedStatuses.includes("created")) {
    allowedStatuses.push("created");
  }

  return allowedStatuses;
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

const getReferenceNextFormMissingFieldLabels = (document: DocumentAccessContext): string[] => {
  const nextFormValues = mapDocumentDataToNextFormValues(document.templateKey, document.dataJson);
  const fieldLabels: Record<string, string> = {
    order_number: "Auftragsnummer",
    customer: "Kunde",
    work_description: "Taetigkeitsbeschreibung",
    material: "Material",
  };
  const requiredFields = referenceNextFormSubmitRequiredFieldNames.map((name) => ({
    name,
    label: fieldLabels[name] ?? name,
  }));

  return requiredFields
    .filter((field) => isMissingRequiredValue(nextFormValues[field.name]))
    .map((field) => field.label);
};

const getMissingRequiredFieldLabels = (document: DocumentAccessContext): string[] => {
  if (isNextFormReferenceTemplate(document.templateKey)) {
    return getReferenceNextFormMissingFieldLabels(document);
  }

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
  const allowedSubmitStatuses = submitTransition ? getAllowedSubmitFromStatuses(document, submitTransition) : [];

  if (!submitTransition || !allowedSubmitStatuses.includes(document.status)) {
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
  const allowedSubmitStatuses = submitTransition ? getAllowedSubmitFromStatuses(document, submitTransition) : [];

  if (!submitTransition || !allowedSubmitStatuses.includes(document.status)) {
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

    if (isNextFormReferenceTemplate(document.templateKey)) {
      const approverUsers = await client.query<{ user_id: string }>(
        `
        select distinct m.user_id
        from template_assignments ta
        inner join memberships m on m.group_id = ta.group_id
        where ta.template_id = $1
          and ta.status = 'active'
          and position('x' in m.rights) > 0
          and m.user_id <> $2
        `,
        [document.templateId, userId],
      );

      for (const approver of approverUsers.rows) {
        await client.query(
          `
          insert into document_assignments (document_id, user_id, role, assigned_by, active)
          values ($1, $2, 'approver', $3, true)
          on conflict (document_id, user_id, role)
          do update set
            active = true,
            assigned_by = excluded.assigned_by,
            assigned_at = now()
          `,
          [documentId, approver.user_id, userId],
        );

        await client.query(
          `
          insert into tasks (document_id, user_id, title, action, status, role)
          values ($1, $2, $3, 'approve', 'open', 'approver')
          `,
          [documentId, approver.user_id, `Approve ${document.title}`],
        );
      }
    }

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
