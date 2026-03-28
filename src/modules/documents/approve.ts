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

type ApprovableDocumentRow = {
  id: string;
  status: string;
  title: string;
  workflow_json: WorkflowJson;
};

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
};

export type ApproveDocumentResult = ApproveDocumentSuccess | ApproveDocumentFailure;

const findVisibleDocumentForApprove = async (
  documentId: string,
  userId: string,
): Promise<ApprovableDocumentRow | null> => {
  return withDb(async (client) => {
    const result = await client.query<ApprovableDocumentRow>(
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
  const document = await findVisibleDocumentForApprove(documentId, userId);

  if (!document) {
    return {
      isAvailable: false,
      reason: "Dokument ist nicht sichtbar.",
    };
  }

  const approveTransition = readApproveTransition(document.workflow_json);

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
  const document = await findVisibleDocumentForApprove(documentId, userId);

  if (!document) {
    return {
      ok: false,
      reason: "document_not_visible",
    };
  }

  const approveTransition = readApproveTransition(document.workflow_json);

  if (!approveTransition || !approveTransition.from.includes(document.status)) {
    return {
      ok: false,
      reason: "approve_not_allowed",
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
      [documentId, approveTransition.to],
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
