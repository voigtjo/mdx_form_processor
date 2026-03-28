import { withDb, withDbTransaction } from "../../db/pool.js";

type WorkflowJson = {
  actions?: Record<
    string,
    {
      from?: string[];
      to?: string;
    }
  >;
};

type RejectableDocumentRow = {
  id: string;
  status: string;
  title: string;
  workflow_json: WorkflowJson;
};

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
};

export type RejectDocumentResult = RejectDocumentSuccess | RejectDocumentFailure;

const findVisibleDocumentForReject = async (
  documentId: string,
  userId: string,
): Promise<RejectableDocumentRow | null> => {
  return withDb(async (client) => {
    const result = await client.query<RejectableDocumentRow>(
      `
      select distinct on (d.id)
        d.id,
        d.status,
        case
          when ft.key = 'customer-order-test' and d.data_json->>'customer_order_number' is not null then 'Customer Order ' || (d.data_json->>'customer_order_number')
          when ft.key = 'production-batch' and d.data_json->>'batch_id' is not null then 'Batch ' || (d.data_json->>'batch_id')
          when ft.key = 'evidence-basic' and d.data_json->>'evidence_number' is not null then 'Evidence ' || (d.data_json->>'evidence_number')
          else ft.name
        end as title,
        wt.workflow_json
      from documents d
      inner join form_templates ft on ft.id = d.template_id
      inner join workflow_templates wt on wt.id = d.workflow_template_id
      inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
      inner join memberships m on m.group_id = ta.group_id
      where d.id = $1
        and m.user_id = $2
      order by d.id
      `,
      [documentId, userId],
    );

    return result.rows[0] ?? null;
  });
};

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
  const document = await findVisibleDocumentForReject(documentId, userId);

  if (!document) {
    return {
      isAvailable: false,
      reason: "Dokument ist nicht sichtbar.",
    };
  }

  const rejectTransition = readRejectTransition(document.workflow_json);

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
  const document = await findVisibleDocumentForReject(documentId, userId);

  if (!document) {
    return {
      ok: false,
      reason: "document_not_visible",
    };
  }

  const rejectTransition = readRejectTransition(document.workflow_json);

  if (!rejectTransition || !rejectTransition.from.includes(document.status)) {
    return {
      ok: false,
      reason: "reject_not_allowed",
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
      [documentId, rejectTransition.to],
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
