import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, type WorkflowJson } from "./access.js";
import { syncTypedRecordForDocument } from "./typed-records.js";

type AssignDocumentInput = {
  documentId: string;
  userId: string;
  editorUserIds: string[];
};

type AssignState = {
  isAvailable: boolean;
  nextStatus?: string;
  reason?: string;
};

type AssignDocumentSuccess = {
  ok: true;
  documentId: string;
  nextStatus: string;
};

type AssignDocumentFailure = {
  ok: false;
  reason: "document_not_visible" | "assign_not_allowed";
  details?: string;
};

export type AssignDocumentResult = AssignDocumentSuccess | AssignDocumentFailure;

export type AssignableEditorOption = {
  userId: string;
  displayName: string;
  groupNames: string[];
};

const readAssignTransition = (workflowJson: WorkflowJson): { from: string[]; to: string } | null => {
  const assignAction = workflowJson.actions?.assign;

  if (!assignAction?.to) {
    return null;
  }

  return {
    from: assignAction.from ?? [],
    to: assignAction.to,
  };
};

const isAssignerContext = (input: {
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
}): boolean => input.canRead && input.canExecute && !input.canWrite;

const loadAssignableEditorOptions = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  templateId: string,
): Promise<AssignableEditorOption[]> => {
  const result = await client.query<{
    user_id: string;
    display_name: string;
    group_names: string[];
  }>(
    `
    select
      u.id as user_id,
      u.display_name,
      array_agg(distinct g.name order by g.name asc)::text[] as group_names
    from template_assignments ta
    inner join memberships m on m.group_id = ta.group_id
    inner join users u on u.id = m.user_id
    inner join groups g on g.id = ta.group_id
    where ta.template_id = $1
      and ta.status = 'active'
      and position('w' in m.rights) > 0
      and u.status = 'active'
    group by u.id, u.display_name
    order by u.display_name asc
    `,
    [templateId],
  );

  return result.rows.map((row) => ({
    userId: row.user_id,
    displayName: row.display_name,
    groupNames: row.group_names ?? [],
  }));
};

export const listDocumentAssignableEditorsForUser = async (
  documentId: string,
  userId: string,
): Promise<AssignableEditorOption[]> => {
  const document = await findDocumentAccessContextForUser(documentId, userId);

  if (!document || !document.canRead) {
    return [];
  }

  return withDbTransaction(async (client) => loadAssignableEditorOptions(client, document.templateId));
};

export const getDocumentAssignStateForUser = async (documentId: string, userId: string): Promise<AssignState> => {
  const document = await findDocumentAccessContextForUser(documentId, userId);

  if (!document || !document.canRead) {
    return {
      isAvailable: false,
      reason: "Dokument ist nicht sichtbar.",
    };
  }

  if (!isAssignerContext(document)) {
    return {
      isAvailable: false,
      reason: "Assign ist fuer die aktuelle Membership nicht freigegeben.",
    };
  }

  const assignTransition = readAssignTransition(document.workflowJson);

  if (!assignTransition || !assignTransition.from.includes(document.status)) {
    return {
      isAvailable: false,
      reason: "Assign ist im aktuellen Status nicht verfuegbar.",
    };
  }

  return {
    isAvailable: true,
    nextStatus: assignTransition.to,
  };
};

export const assignDocumentForUser = async ({ documentId, userId, editorUserIds }: AssignDocumentInput): Promise<AssignDocumentResult> => {
  const document = await findDocumentAccessContextForUser(documentId, userId);

  if (!document || !document.canRead) {
    return {
      ok: false,
      reason: "document_not_visible",
    };
  }

  if (!isAssignerContext(document)) {
    return {
      ok: false,
      reason: "assign_not_allowed",
      details: "Assign ist nur fuer ausfuehrende Freigabe-Rollen ohne Schreibrecht verfuegbar.",
    };
  }

  const assignTransition = readAssignTransition(document.workflowJson);

  if (!assignTransition || !assignTransition.from.includes(document.status)) {
    return {
      ok: false,
      reason: "assign_not_allowed",
      details: "Assign ist im aktuellen Status nicht verfuegbar.",
    };
  }

  return withDbTransaction(async (client) => {
    const assignableEditors = await loadAssignableEditorOptions(client, document.templateId);
    const allowedEditorIds = new Set(assignableEditors.map((editor) => editor.userId));
    const normalizedEditorIds = Array.from(new Set(editorUserIds.map((entry) => entry.trim()).filter((entry) => entry.length > 0)));

    if (normalizedEditorIds.length === 0) {
      return {
        ok: false,
        reason: "assign_not_allowed",
        details: "Bitte mindestens einen Editor fuer die Zuweisung auswaehlen.",
      };
    }

    if (normalizedEditorIds.some((editorUserId) => !allowedEditorIds.has(editorUserId))) {
      return {
        ok: false,
        reason: "assign_not_allowed",
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
      [documentId, assignTransition.to],
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

    await client.query(
      `
      insert into document_assignments (document_id, user_id, role, assigned_by, active)
      values ($1, $2, 'approver', $2, true)
      on conflict (document_id, user_id, role)
      do update set
        active = true,
        assigned_by = excluded.assigned_by,
        assigned_at = now()
      `,
      [documentId, userId],
    );

    await syncTypedRecordForDocument(client, {
      documentId,
      formType: document.formType,
      templateName: document.templateName,
      status: assignTransition.to,
      dataJson: document.dataJson,
    });

    await client.query(
      `
      insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
      values ($1, 'assigned', $2, $3, $4::jsonb)
      `,
      [
        documentId,
        userId,
        `${document.title} assigned.`,
        JSON.stringify({
          fromStatus: document.status,
          toStatus: assignTransition.to,
          editorCount: normalizedEditorIds.length,
          editorUserIds: normalizedEditorIds,
          approverUserId: userId,
        }),
      ],
    );

    return {
      ok: true,
      documentId,
      nextStatus: assignTransition.to,
    };
  });
};
