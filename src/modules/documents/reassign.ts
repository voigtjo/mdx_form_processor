import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, type WorkflowJson } from "./access.js";
import { syncTypedRecordForDocument } from "./typed-records.js";

type ReassignDocumentInput = {
  documentId: string;
  userId: string;
  editorUserIds: string[];
};

type ReassignState = {
  isAvailable: boolean;
  nextStatus?: string;
  reason?: string;
};

type ReassignDocumentSuccess = {
  ok: true;
  documentId: string;
  nextStatus: string;
};

type ReassignDocumentFailure = {
  ok: false;
  reason: "document_not_visible" | "reassign_not_allowed";
  details?: string;
};

export type ReassignDocumentResult = ReassignDocumentSuccess | ReassignDocumentFailure;

const readReassignTransition = (workflowJson: WorkflowJson): { from: string[]; to: string } | null => {
  const reassignAction = workflowJson.actions?.reassign;

  if (!reassignAction?.to) {
    return null;
  }

  return {
    from: reassignAction.from ?? [],
    to: reassignAction.to,
  };
};

export const getDocumentReassignStateForUser = async (documentId: string, userId: string): Promise<ReassignState> => {
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
      reason: "Neu zuweisen setzt eine aktive Approver-Zuweisung voraus.",
    };
  }

  if (!document.canExecute) {
    return {
      isAvailable: false,
      reason: "Neu zuweisen setzt Membership-Recht x voraus.",
    };
  }

  const reassignTransition = readReassignTransition(document.workflowJson);

  if (!reassignTransition || !reassignTransition.from.includes(document.status)) {
    return {
      isAvailable: false,
      reason: "Neu zuweisen ist im aktuellen Status nicht verfuegbar.",
    };
  }

  return {
    isAvailable: true,
    nextStatus: reassignTransition.to,
  };
};

export const reassignDocumentForUser = async ({ documentId, userId, editorUserIds }: ReassignDocumentInput): Promise<ReassignDocumentResult> => {
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
      reason: "reassign_not_allowed",
      details: "Neu zuweisen setzt eine aktive Approver-Zuweisung voraus.",
    };
  }

  if (!document.canExecute) {
    return {
      ok: false,
      reason: "reassign_not_allowed",
      details: "Neu zuweisen setzt Membership-Recht x voraus.",
    };
  }

  const reassignTransition = readReassignTransition(document.workflowJson);

  if (!reassignTransition || !reassignTransition.from.includes(document.status)) {
    return {
      ok: false,
      reason: "reassign_not_allowed",
      details: "Neu zuweisen ist im aktuellen Status nicht verfuegbar.",
    };
  }

  return withDbTransaction(async (client) => {
    const editorUsers = await client.query<{ user_id: string }>(
      `
      select distinct m.user_id
      from template_assignments ta
      inner join memberships m on m.group_id = ta.group_id
      where ta.template_id = $1
        and ta.status = 'active'
        and position('w' in m.rights) > 0
      order by m.user_id asc
      `,
      [document.templateId],
    );
    const allowedEditorIds = new Set(editorUsers.rows.map((row) => row.user_id));
    const normalizedEditorIds = Array.from(new Set(editorUserIds.map((entry) => entry.trim()).filter((entry) => entry.length > 0)));

    if (normalizedEditorIds.length === 0) {
      return {
        ok: false,
        reason: "reassign_not_allowed",
        details: "Bitte mindestens einen Editor fuer die Zuweisung auswaehlen.",
      };
    }

    if (normalizedEditorIds.some((editorUserId) => !allowedEditorIds.has(editorUserId))) {
      return {
        ok: false,
        reason: "reassign_not_allowed",
        details: "Die Editor-Auswahl ist nicht gueltig.",
      };
    }

    await client.query(
      `
      update documents
      set status = $2,
          updated_at = now()
      where id = $1
      `,
      [documentId, reassignTransition.to],
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

    await client.query(
      `
      update document_assignments
      set active = false
      where document_id = $1
        and role = 'approver'
      `,
      [documentId],
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
      update document_assignments
      set active = false
      where document_id = $1
        and role = 'editor'
      `,
      [documentId],
    );

    for (const editorUserId of normalizedEditorIds) {
      await client.query(
        `
        insert into document_assignments (document_id, user_id, role, assigned_by, active)
        values ($1, $2, 'editor', $3, true)
        on conflict (document_id, user_id, role)
        do update set
          active = true,
          assigned_by = excluded.assigned_by,
          assigned_at = now()
        `,
        [documentId, editorUserId, userId],
      );

      await client.query(
        `
        insert into tasks (document_id, user_id, title, action, status, role)
        values ($1, $2, $3, 'submit', 'open', 'editor')
        `,
        [documentId, editorUserId, `Bearbeite ${document.title}`],
      );
    }

    await syncTypedRecordForDocument(client, {
      documentId,
      formType: document.formType,
      templateName: document.templateName,
      status: reassignTransition.to,
      dataJson: document.dataJson,
    });

    await client.query(
      `
      insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
      values ($1, 'reassigned', $2, $3, $4::jsonb)
      `,
      [
        documentId,
        userId,
        `${document.title} reassigned.`,
        JSON.stringify({
          fromStatus: document.status,
          toStatus: reassignTransition.to,
          editorCount: normalizedEditorIds.length,
          editorUserIds: normalizedEditorIds,
        }),
      ],
    );

    return {
      ok: true,
      documentId,
      nextStatus: reassignTransition.to,
    };
  });
};
