import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, type WorkflowJson } from "./access.js";
import { synchronizeQualificationAssignments } from "../qualification/progress.js";
import { applyQualificationEvaluationToData } from "../qualification/evaluation.js";
import { syncTypedRecordForDocument } from "./typed-records.js";

type ApproveDocumentInput = {
  documentId: string;
  userId: string;
};

type ApproveState = {
  isAvailable: boolean;
  nextStatus?: string;
  reason?: string;
};

type ApproveDocumentSuccess = {
  ok: true;
  documentId: string;
  nextStatus: string;
};

type ApproveDocumentFailure = {
  ok: false;
  reason: "document_not_visible" | "approve_not_allowed";
  details?: string;
};

export type ApproveDocumentResult = ApproveDocumentSuccess | ApproveDocumentFailure;

const readApproveTransition = (workflowJson: WorkflowJson): { from: string[]; to: string } | null => {
  const approveAction = workflowJson.actions?.approve;

  if (!approveAction?.to) {
    return null;
  }

  return {
    from: approveAction.from ?? [],
    to: approveAction.to,
  };
};

export const getDocumentApproveStateForUser = async (documentId: string, userId: string): Promise<ApproveState> => {
  const document = await findDocumentAccessContextForUser(documentId, userId);

  if (!document || !document.canRead) {
    return {
      isAvailable: false,
      reason: "Dokument ist nicht sichtbar.",
    };
  }

  if (!document.hasApproverAssignment) {
    return {
      isAvailable: false,
      reason: "Approve setzt eine aktive Approver-Zuweisung voraus.",
    };
  }

  if (!document.canExecute) {
    return {
      isAvailable: false,
      reason: "Approve setzt Membership-Recht x voraus.",
    };
  }

  const approveTransition = readApproveTransition(document.workflowJson);

  if (!approveTransition || !approveTransition.from.includes(document.status)) {
    return {
      isAvailable: false,
      reason: "Approve ist im aktuellen Status nicht verfuegbar.",
    };
  }

  return {
    isAvailable: true,
    nextStatus: approveTransition.to,
  };
};

export const approveDocumentForUser = async ({ documentId, userId }: ApproveDocumentInput): Promise<ApproveDocumentResult> => {
  const document = await findDocumentAccessContextForUser(documentId, userId);

  if (!document || !document.canRead) {
    return {
      ok: false,
      reason: "document_not_visible",
    };
  }

  if (!document.hasApproverAssignment) {
    return {
      ok: false,
      reason: "approve_not_allowed",
      details: "Approve setzt eine aktive Approver-Zuweisung voraus.",
    };
  }

  if (!document.canExecute) {
    return {
      ok: false,
      reason: "approve_not_allowed",
      details: "Approve setzt Membership-Recht x voraus.",
    };
  }

  const approveTransition = readApproveTransition(document.workflowJson);

  if (!approveTransition || !approveTransition.from.includes(document.status)) {
    return {
      ok: false,
      reason: "approve_not_allowed",
      details: "Approve ist im aktuellen Status nicht verfuegbar.",
    };
  }

  return withDbTransaction(async (client) => {
    const nextDocumentData = document.templateKey === "qualification-record"
      ? applyQualificationEvaluationToData({
          ...document.dataJson,
          approval_status: "freigegeben",
        })
      : document.dataJson;

    await client.query(
      `
      update documents
      set status = $2,
          data_json = $3::jsonb,
          updated_at = now()
      where id = $1
      `,
      [documentId, approveTransition.to, JSON.stringify(nextDocumentData)],
    );

    await client.query(
      `
      update tasks
      set status = 'closed',
          updated_at = now()
      where document_id = $1
        and status = 'open'
        and role = 'approver'
      `,
      [documentId],
    );

    if (document.templateKey === "qualification-record") {
      await synchronizeQualificationAssignments({
        client,
        documentId,
        actorUserId: userId,
        documentTitle: document.title,
        documentStatus: approveTransition.to,
        data: nextDocumentData,
      });
    }

    await syncTypedRecordForDocument(client, {
      documentId,
      formType: document.formType,
      templateName: document.templateName,
      status: approveTransition.to,
      dataJson: nextDocumentData,
    });

    await client.query(
      `
      insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
      values ($1, 'approved', $2, $3, $4::jsonb)
      `,
      [
        documentId,
        userId,
        `${document.title} approved.`,
        JSON.stringify({
          fromStatus: document.status,
          toStatus: approveTransition.to,
        }),
      ],
    );

    return {
      ok: true,
      documentId,
      nextStatus: approveTransition.to,
    };
  });
};
