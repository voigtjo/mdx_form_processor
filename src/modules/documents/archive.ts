import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, type WorkflowJson } from "./access.js";

type ArchiveDocumentInput = {
  documentId: string;
  userId: string;
};

type ArchiveState = {
  isAvailable: boolean;
  nextStatus?: string;
  reason?: string;
};

type ArchiveDocumentSuccess = {
  ok: true;
  documentId: string;
  nextStatus: string;
};

type ArchiveDocumentFailure = {
  ok: false;
  reason: "document_not_visible" | "archive_not_allowed";
  details?: string;
};

export type ArchiveDocumentResult = ArchiveDocumentSuccess | ArchiveDocumentFailure;

const readArchiveTransition = (workflowJson: WorkflowJson): { from: string[]; to: string } | null => {
  const archiveAction = workflowJson.actions?.archive;

  if (!archiveAction?.to) {
    return null;
  }

  return {
    from: archiveAction.from ?? [],
    to: archiveAction.to,
  };
};

export const getDocumentArchiveStateForUser = async (documentId: string, userId: string): Promise<ArchiveState> => {
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
      reason: "Archive setzt eine aktive Approver-Zuweisung voraus.",
    };
  }

  if (!document.canExecute) {
    return {
      isAvailable: false,
      reason: "Archive setzt Membership-Recht x voraus.",
    };
  }

  const archiveTransition = readArchiveTransition(document.workflowJson);

  if (!archiveTransition || !archiveTransition.from.includes(document.status)) {
    return {
      isAvailable: false,
      reason: "Archive ist im aktuellen Status nicht verfuegbar.",
    };
  }

  return {
    isAvailable: true,
    nextStatus: archiveTransition.to,
  };
};

export const archiveDocumentForUser = async ({ documentId, userId }: ArchiveDocumentInput): Promise<ArchiveDocumentResult> => {
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
      reason: "archive_not_allowed",
      details: "Archive setzt eine aktive Approver-Zuweisung voraus.",
    };
  }

  if (!document.canExecute) {
    return {
      ok: false,
      reason: "archive_not_allowed",
      details: "Archive setzt Membership-Recht x voraus.",
    };
  }

  const archiveTransition = readArchiveTransition(document.workflowJson);

  if (!archiveTransition || !archiveTransition.from.includes(document.status)) {
    return {
      ok: false,
      reason: "archive_not_allowed",
      details: "Archive ist im aktuellen Status nicht verfuegbar.",
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
      [documentId, archiveTransition.to],
    );

    await client.query(
      `
      update tasks
      set status = 'closed',
          updated_at = now()
      where document_id = $1
        and status = 'open'
      `,
      [documentId],
    );

    await client.query(
      `
      insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
      values ($1, 'archived', $2, $3, $4::jsonb)
      `,
      [
        documentId,
        userId,
        `${document.title} archived.`,
        JSON.stringify({
          fromStatus: document.status,
          toStatus: archiveTransition.to,
        }),
      ],
    );

    return {
      ok: true,
      documentId,
      nextStatus: archiveTransition.to,
    };
  });
};
