import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, type DocumentAccessContext, type WorkflowJson } from "./access.js";
import { buildReadOnlyFormDefinition } from "../templates/form-read.js";
import { isFormRuntimeReferenceTemplate, mapDocumentDataToFormRuntimeValues } from "../forms/document-bridge.js";
import { getReferenceFormRuntimeSubmitRequiredFieldNames } from "../forms/document-ui.js";
import { hasVisibleRichTextContent } from "../forms/rich-text.js";
import {
  getQualificationCurrentUserState,
  getQualificationRequiredEditorUserIds,
  getQualificationSubmitModeLabel,
  getQualificationSubmittedEditorUserIds,
  synchronizeQualificationAssignments,
  writeQualificationParticipantState,
} from "../qualification/progress.js";
import { applyQualificationEvaluationToData } from "../qualification/evaluation.js";
import { syncTypedRecordForDocument } from "./typed-records.js";

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
  message?: string;
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

const isQualificationRecord = (document: DocumentAccessContext): boolean => document.templateKey === "qualification-record";

const getAllowedSubmitFromStatuses = (
  document: DocumentAccessContext,
  submitTransition: { from: string[]; to: string },
): string[] => {
  const allowedStatuses = [...submitTransition.from];

  // The reference form runtime works as a compact primary work area.
  // For this slice we allow the first submit directly from "created" once the
  // required form values have been filled and saved into the document.
  if (isFormRuntimeReferenceTemplate(document.templateKey) && document.status === "created" && !allowedStatuses.includes("created")) {
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

const getReferenceFormRuntimeMissingFieldLabels = (document: DocumentAccessContext, userId?: string): string[] => {
  const formRuntimeValues = mapDocumentDataToFormRuntimeValues(document.templateKey, document.dataJson, {
    ...(userId ? { currentUserId: userId } : {}),
  });
  const fieldLabels: Record<string, string> = {
    order_number: "Einsatznummer",
    customer: "Kunde",
    customer_order_status: "Auftragsstatus",
    work_description: "Taetigkeitsbeschreibung",
    service_result_status: "Statusmeldung",
    material: "Material",
    qualification_record_number: "Nachweisnummer",
    qualification_title: "Qualifikation / Schulung",
    owner_user_id: "Verantwortlich",
    attendee_user_ids: "Teilnehmende",
    qualification_result: "Selbsteinschaetzung",
    qualification_topics: "Bestaetigte Themen",
    batch_id: "Batch-ID",
    product_name: "Produkt",
    generic_form_title: "Titel",
    generic_form_note: "Notiz",
  };
  const requiredFields = getReferenceFormRuntimeSubmitRequiredFieldNames(document.templateKey).map((name) => ({
    name,
    label: fieldLabels[name] ?? name,
  }));

  return requiredFields
    .filter((field) => {
      if (field.name === "work_description") {
        return !hasVisibleRichTextContent(formRuntimeValues[field.name]);
      }

      return isMissingRequiredValue(formRuntimeValues[field.name]);
    })
    .map((field) => field.label);
};

const getMissingRequiredFieldLabels = (document: DocumentAccessContext): string[] => {
  if (isFormRuntimeReferenceTemplate(document.templateKey)) {
    return getReferenceFormRuntimeMissingFieldLabels(document);
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

  if (!document.canWrite) {
    return {
      isAvailable: false,
      reason: "Submit setzt Membership-Recht w voraus.",
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

  const missingFieldLabels = isQualificationRecord(document)
    ? getReferenceFormRuntimeMissingFieldLabels(document, userId)
    : getMissingRequiredFieldLabels(document);

  if (missingFieldLabels.length > 0) {
    return {
      isAvailable: false,
      reason: `Pflichtfelder fehlen: ${missingFieldLabels.join(", ")}.`,
    };
  }

  if (isQualificationRecord(document)) {
    const currentUserState = getQualificationCurrentUserState(document.dataJson, userId);

    if (typeof currentUserState.submittedAt === "string") {
      return {
        isAvailable: false,
        reason: "Dein Nachweis ist bereits submitted.",
      };
    }

    const requiredEditorUserIds = getQualificationRequiredEditorUserIds(document.dataJson);
    const submittedEditorUserIds = getQualificationSubmittedEditorUserIds({
      data: document.dataJson,
      requiredEditorUserIds,
    });
    const submitModeLabel = getQualificationSubmitModeLabel(document.workflowJson);
    const nextStatus = submitModeLabel === "AND" && submittedEditorUserIds.length + 1 < requiredEditorUserIds.length
      ? document.status
      : submitTransition.to;

    return {
      isAvailable: true,
      nextStatus,
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

  if (!document.canWrite) {
    return {
      ok: false,
      reason: "submit_not_allowed",
      details: "Submit setzt Membership-Recht w voraus.",
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

  const missingFieldLabels = isQualificationRecord(document)
    ? getReferenceFormRuntimeMissingFieldLabels(document, userId)
    : getMissingRequiredFieldLabels(document);

  if (missingFieldLabels.length > 0) {
    return {
      ok: false,
      reason: "minimal_data_missing",
      details: `Pflichtfelder fehlen: ${missingFieldLabels.join(", ")}.`,
    };
  }

  if (isQualificationRecord(document)) {
    const currentUserState = getQualificationCurrentUserState(document.dataJson, userId);

    if (typeof currentUserState.submittedAt === "string") {
      return {
        ok: false,
        reason: "submit_not_allowed",
        details: "Dieser Nutzer hat den Nachweis bereits submitted.",
      };
    }
  }

  return withDbTransaction(async (client) => {
    if (isQualificationRecord(document)) {
      const submittedAt = new Date().toISOString();
      const nextDocumentDataBase = writeQualificationParticipantState({
        data: document.dataJson,
        userId,
        patch: {
          savedAt: submittedAt,
          submittedAt,
        },
      });
      const requiredEditorUserIds = getQualificationRequiredEditorUserIds(nextDocumentDataBase);
      const submittedEditorUserIds = getQualificationSubmittedEditorUserIds({
        data: nextDocumentDataBase,
        requiredEditorUserIds,
      });
      const submitModeLabel = getQualificationSubmitModeLabel(document.workflowJson);
      const isComplete =
        submitModeLabel === "AND"
          ? requiredEditorUserIds.length > 0 && submittedEditorUserIds.length >= requiredEditorUserIds.length
          : submittedEditorUserIds.length > 0;
      const nextStatus = isComplete ? submitTransition.to : document.status;
      const nextDocumentData = applyQualificationEvaluationToData({
        ...nextDocumentDataBase,
        approval_status: isComplete ? "pruefung" : (typeof nextDocumentDataBase.approval_status === "string" && nextDocumentDataBase.approval_status.length > 0
          ? nextDocumentDataBase.approval_status
          : "offen"),
      });

      await client.query(
        `
        update documents
        set status = $2,
            data_json = $3::jsonb,
            updated_at = now()
        where id = $1
        `,
        [documentId, nextStatus, JSON.stringify(nextDocumentData)],
      );

      await synchronizeQualificationAssignments({
        client,
        documentId,
        actorUserId: userId,
        documentTitle: document.title,
        documentStatus: nextStatus,
        data: nextDocumentData,
      });

      await syncTypedRecordForDocument(client, {
        documentId,
        formType: document.formType,
        templateName: document.templateName,
        status: nextStatus,
        dataJson: nextDocumentData,
      });

      await client.query(
        `
        insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
        values ($1, $2, $3, $4, $5::jsonb)
        `,
        [
          documentId,
          isComplete ? "submitted" : "participant_submitted",
          userId,
          isComplete
            ? `${document.title} submitted.`
            : `${document.title}: participant submit stored.`,
          JSON.stringify({
            fromStatus: document.status,
            toStatus: nextStatus,
            submitMode: submitModeLabel,
            submittedCount: submittedEditorUserIds.length,
            requiredCount: requiredEditorUserIds.length,
          }),
        ],
      );

      return {
        ok: true,
        documentId,
        nextStatus,
        ...(isComplete
          ? { message: `Dokument wurde nach ${nextStatus} ueberfuehrt.` }
          : { message: `Dein Stand ist submitted. Weitere Beteiligte sind noch offen (${submittedEditorUserIds.length}/${requiredEditorUserIds.length}).` }),
      };
    }

    await client.query(
      `
      update documents
      set status = $2,
          updated_at = now()
      where id = $1
      `,
      [documentId, submitTransition.to],
    );

    await syncTypedRecordForDocument(client, {
      documentId,
      formType: document.formType,
      templateName: document.templateName,
      status: submitTransition.to,
      dataJson: document.dataJson,
    });

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

    if (isFormRuntimeReferenceTemplate(document.templateKey)) {
      await client.query(
        `
        update document_assignments
        set active = false
        where document_id = $1
          and role = 'approver'
        `,
        [documentId],
      );

      const approverUsers = await client.query<{ user_id: string }>(
        `
        select distinct m.user_id
        from template_assignments ta
        inner join memberships m on m.group_id = ta.group_id
        where ta.template_id = $1
          and ta.status = 'active'
          and position('x' in m.rights) > 0
          and position('w' in m.rights) = 0
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
      message: `Dokument wurde nach ${submitTransition.to} ueberfuehrt.`,
    };
  });
};
