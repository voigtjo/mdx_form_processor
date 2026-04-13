import { withDb } from "../../db/pool.js";
import type { EntityStatus, FormType, WorkflowFieldRules } from "../../types/domain.js";

export type WorkflowJson = {
  approval?: {
    submitMode?: string;
    approvalMode?: string;
  };
  actions?: Record<
    string,
    {
      from?: string[];
      to?: string;
      allowedRoles?: Array<"editor" | "approver">;
      completionMode?: string;
    }
  >;
};

export type DocumentAccessContext = {
  id: string;
  status: string;
  title: string;
  dataJson: Record<string, unknown>;
  templateId: string;
  templateKey: string;
  templateName: string;
  formType: FormType;
  templateDescription?: string;
  templateStatus: EntityStatus;
  templateVersion: number;
  templateMdxBody: string;
  workflowJson: WorkflowJson;
  workflowFieldRules: WorkflowFieldRules;
  canRead: boolean;
  canWrite: boolean;
  canExecute: boolean;
  hasEditorAssignment: boolean;
  hasApproverAssignment: boolean;
};

type DocumentAccessRow = {
  id: string;
  status: string;
  data_json: Record<string, unknown> | null;
  template_id: string;
  template_key: string;
  template_name: string;
  template_form_type: FormType;
  template_description: string | null;
  template_status: EntityStatus;
  template_version: number;
  template_mdx_body: string;
  workflow_json: WorkflowJson | null;
  workflow_field_rules: WorkflowFieldRules | null;
  can_read: boolean;
  can_write: boolean;
  can_execute: boolean;
  has_editor_assignment: boolean;
  has_approver_assignment: boolean;
};

const formatDocumentTitle = (templateKey: string, dataJson: Record<string, unknown>, templateName: string): string => {
  if (templateKey === "customer-order-test") {
    const orderNumber = dataJson.customer_order_number;
    return typeof orderNumber === "string" ? `Kundenauftrag ${orderNumber}` : templateName;
  }

  if (templateKey === "service-report") {
    const orderNumber = dataJson.customer_order_number;
    return typeof orderNumber === "string" ? `Service-Report ${orderNumber}` : templateName;
  }

  if (templateKey === "production-batch") {
    const batchId = dataJson.batch_id;
    return typeof batchId === "string" ? `Produktion ${batchId}` : templateName;
  }

  if (templateKey === "production-report") {
    const batchId = dataJson.batch_id;
    return typeof batchId === "string" ? `Produktion ${batchId}` : templateName;
  }

  if (templateKey === "qualification-record") {
    const qualificationRecordNumber = dataJson.qualification_record_number;
    const qualificationTitle = dataJson.qualification_title;

    if (typeof qualificationRecordNumber === "string" && qualificationRecordNumber.trim().length > 0) {
      return `Qualifikationsnachweis ${qualificationRecordNumber}`;
    }

    return typeof qualificationTitle === "string" && qualificationTitle.trim().length > 0
      ? qualificationTitle
      : templateName;
  }

  if (templateKey === "generic-form") {
    const genericTitle = dataJson.generic_form_title;
    return typeof genericTitle === "string" && genericTitle.trim().length > 0
      ? genericTitle
      : templateName;
  }

  return templateName;
};

const mapDocumentAccess = (row: DocumentAccessRow): DocumentAccessContext => ({
  id: row.id,
  status: row.status,
  title: formatDocumentTitle(row.template_key, row.data_json ?? {}, row.template_name),
  dataJson: row.data_json ?? {},
  templateId: row.template_id,
  templateKey: row.template_key,
  templateName: row.template_name,
  formType: row.template_form_type,
  ...(row.template_description ? { templateDescription: row.template_description } : {}),
  templateStatus: row.template_status,
  templateVersion: row.template_version,
  templateMdxBody: row.template_mdx_body,
  workflowJson: row.workflow_json ?? {},
  workflowFieldRules: row.workflow_field_rules ?? {},
  canRead: row.can_read,
  canWrite: row.can_write,
  canExecute: row.can_execute,
  hasEditorAssignment: row.has_editor_assignment,
  hasApproverAssignment: row.has_approver_assignment,
});

export const findDocumentAccessContextForUser = async (
  documentId: string,
  userId: string,
): Promise<DocumentAccessContext | null> => {
  return withDb(async (client) => {
    const result = await client.query<DocumentAccessRow>(
      `
      select
        d.id,
        d.status,
        d.data_json,
        d.template_id,
        ft.key as template_key,
        ft.name as template_name,
        ft.form_type as template_form_type,
        ft.description as template_description,
        ft.status as template_status,
        d.template_version,
        ft.mdx_body as template_mdx_body,
        wt.workflow_json,
        wt.workflow_json->'fieldRules' as workflow_field_rules,
        coalesce(bool_or(position('r' in m.rights) > 0), false) as can_read,
        coalesce(bool_or(position('w' in m.rights) > 0), false) as can_write,
        coalesce(bool_or(position('x' in m.rights) > 0), false) as can_execute,
        coalesce(bool_or(da.user_id = $2 and da.active = true and da.role = 'editor'), false) as has_editor_assignment,
        coalesce(bool_or(da.user_id = $2 and da.active = true and da.role = 'approver'), false) as has_approver_assignment
      from documents d
      inner join form_templates ft on ft.id = d.template_id
      inner join workflow_templates wt on wt.id = d.workflow_template_id
      inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
      inner join memberships m on m.group_id = ta.group_id and m.user_id = $2
      left join document_assignments da on da.document_id = d.id
      where d.id = $1
      group by d.id, ft.id, wt.id
      `,
      [documentId, userId],
    );

    const row = result.rows[0];
    return row ? mapDocumentAccess(row) : null;
  });
};

type DocumentActionState = {
  isAvailable: boolean;
  reason?: string;
};

export const getDocumentEditStateForUser = async (
  documentId: string,
  userId: string,
): Promise<DocumentActionState> => {
  const context = await findDocumentAccessContextForUser(documentId, userId);

  if (!context || !context.canRead) {
    return {
      isAvailable: false,
      reason: "Dokument ist nicht sichtbar.",
    };
  }

  if (!context.hasEditorAssignment) {
    return {
      isAvailable: false,
      reason: "Bearbeitung setzt eine aktive Editor-Zuweisung voraus.",
    };
  }

  if (!context.canWrite) {
    return {
      isAvailable: false,
      reason: "Bearbeitung setzt Membership-Recht w voraus.",
    };
  }

  return {
    isAvailable: true,
  };
};
