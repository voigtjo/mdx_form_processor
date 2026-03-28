import { withDb, withDbTransaction } from "../../db/pool.js";
import { buildReadOnlyFormDefinition } from "../templates/form-read.js";
import type { WorkflowFieldRules } from "../../types/domain.js";

type WorkflowJson = {
  actions?: Record<
    string,
    {
      from?: string[];
      to?: string;
    }
  >;
};

type SubmittableDocumentRow = {
  id: string;
  status: string;
  title: string;
  data_json: Record<string, unknown> | null;
  template_id: string;
  template_key: string;
  template_name: string;
  template_description: string | null;
  template_status: "active" | "inactive" | "draft" | "published" | "archived";
  template_version: number;
  template_mdx_body: string;
  workflow_field_rules: WorkflowFieldRules | null;
  workflow_json: WorkflowJson;
};

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

const findVisibleDocumentForSubmit = async (
  documentId: string,
  userId: string,
): Promise<SubmittableDocumentRow | null> => {
  return withDb(async (client) => {
    const result = await client.query<SubmittableDocumentRow>(
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
        d.data_json,
        d.template_id,
        ft.key as template_key,
        ft.name as template_name,
        ft.description as template_description,
        ft.status as template_status,
        d.template_version,
        ft.mdx_body as template_mdx_body,
        wt.workflow_json->'fieldRules' as workflow_field_rules,
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

const getMissingRequiredFieldLabels = (document: SubmittableDocumentRow): string[] => {
  const formDefinition = buildReadOnlyFormDefinition({
    templateId: document.template_id,
    templateKey: document.template_key,
    templateName: document.template_name,
    templateVersion: document.template_version,
    templateStatus: document.template_status,
    ...(document.template_description ? { templateDescription: document.template_description } : {}),
    mdxBody: document.template_mdx_body,
    documentStatus: document.status,
    documentData: document.data_json ?? {},
    workflowFieldRules: document.workflow_field_rules ?? {},
  });

  return formDefinition.fields
    .filter((field) => field.flags.includes("required") && field.isSavable)
    .filter((field) => isMissingRequiredValue((document.data_json ?? {})[field.name]))
    .map((field) => field.label);
};

export const getDocumentSubmitStateForUser = async (documentId: string, userId: string): Promise<SubmitState> => {
  const document = await findVisibleDocumentForSubmit(documentId, userId);

  if (!document) {
    return {
      isAvailable: false,
      reason: "Dokument ist nicht sichtbar.",
    };
  }

  const submitTransition = readSubmitTransition(document.workflow_json);

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
  const document = await findVisibleDocumentForSubmit(documentId, userId);

  if (!document) {
    return {
      ok: false,
      reason: "document_not_visible",
    };
  }

  const submitTransition = readSubmitTransition(document.workflow_json);

  if (!submitTransition || !submitTransition.from.includes(document.status)) {
    return {
      ok: false,
      reason: "submit_not_allowed",
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
