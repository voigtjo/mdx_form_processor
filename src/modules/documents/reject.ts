import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, type WorkflowJson } from "./access.js";
import { synchronizeQualificationAssignments } from "../qualification/progress.js";

type RejectDocumentInput = {
  documentId: string;
  userId: string;
};

type RejectState = {
  isAvailable: boolean;
  nextStatus?: string;
  reason?: string;
};

type RejectDocumentSuccess = {
  ok: true;
  documentId: string;
  nextStatus: string;
};

type RejectDocumentFailure = {
  ok: false;
  reason: "document_not_visible" | "reject_not_allowed";
  details?: string;
};

export type RejectDocumentResult = RejectDocumentSuccess | RejectDocumentFailure;

const readRejectTransition = (workflowJson: WorkflowJson): { from: string[]; to: string } | null => {
  const rejectAction = workflowJson.actions?.reject;

  if (!rejectAction?.to) {
    return null;
  }

  return {
    from: rejectAction.from ?? [],
    to: rejectAction.to,
  };
};

export const getDocumentRejectStateForUser = async (documentId: string, userId: string): Promise<RejectState> => {
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
      reason: "Reject setzt eine aktive Approver-Zuweisung voraus.",
    };
  }

  if (!document.canExecute) {
    return {
      isAvailable: false,
      reason: "Reject setzt Membership-Recht x voraus.",
    };
  }

  const rejectTransition = readRejectTransition(document.workflowJson);

  if (!rejectTransition || !rejectTransition.from.includes(document.status)) {
    return {
      isAvailable: false,
      reason: "Reject ist im aktuellen Status nicht verfuegbar.",
    };
  }

  return {
    isAvailable: true,
    nextStatus: rejectTransition.to,
  };
};

export const rejectDocumentForUser = async ({ documentId, userId }: RejectDocumentInput): Promise<RejectDocumentResult> => {
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
      reason: "reject_not_allowed",
      details: "Reject setzt eine aktive Approver-Zuweisung voraus.",
    };
  }

  if (!document.canExecute) {
    return {
      ok: false,
      reason: "reject_not_allowed",
      details: "Reject setzt Membership-Recht x voraus.",
    };
  }

  const rejectTransition = readRejectTransition(document.workflowJson);

  if (!rejectTransition || !rejectTransition.from.includes(document.status)) {
    return {
      ok: false,
      reason: "reject_not_allowed",
      details: "Reject ist im aktuellen Status nicht verfuegbar.",
    };
  }

  return withDbTransaction(async (client) => {
    const nextDocumentData = document.templateKey === "qualification-record"
      ? {
          ...document.dataJson,
          approval_status: "offen",
        }
      : document.dataJson;

    await client.query(
      `
      update documents
      set status = $2,
          data_json = $3::jsonb,
          updated_at = now()
      where id = $1
      `,
      [documentId, rejectTransition.to, JSON.stringify(nextDocumentData)],
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
        documentStatus: rejectTransition.to,
        data: nextDocumentData,
      });
    }

    await client.query(
      `
      insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
      values ($1, 'rejected', $2, $3, $4::jsonb)
      `,
      [
        documentId,
        userId,
        `${document.title} rejected.`,
        JSON.stringify({
          fromStatus: document.status,
          toStatus: rejectTransition.to,
        }),
      ],
    );

    return {
      ok: true,
      documentId,
      nextStatus: rejectTransition.to,
    };
  });
};
