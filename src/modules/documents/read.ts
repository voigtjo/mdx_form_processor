import { withDb } from "../../db/pool.js";
import type { Document, DocumentDetail, Task, WorkflowFieldRules } from "../../types/domain.js";

type DocumentRow = {
  id: string;
  template_id: string;
  template_key: string;
  template_name: string;
  template_form_type: Document["formType"];
  customer_order_number: string | null;
  production_batch_id: string | null;
  qualification_record_number: string | null;
  generic_form_title: string | null;
  typed_record_present: boolean;
  status: string;
  updated_at: Date;
  data_json: Record<string, unknown>;
  assigned_user_ids: string[];
};

type TaskRow = {
  id: string;
  document_id: string;
  user_id: string;
  title: string;
  action: string;
  status: "open" | "closed";
  role: "editor" | "approver";
  updated_at: Date;
};

type DocumentDetailRow = {
  id: string;
  template_id: string;
  template_key: string;
  template_name: string;
  template_form_type: DocumentDetail["formType"];
  template_description: string | null;
  template_status: DocumentDetail["formTemplateStatus"];
  template_mdx_body: string;
  template_version: number;
  workflow_template_id: string;
  workflow_template_key: string;
  workflow_template_name: string;
  workflow_template_version: number;
  status: string;
  created_at: Date;
  updated_at: Date;
  data_json: Record<string, unknown>;
  workflow_field_rules: WorkflowFieldRules | null;
};

const documentBaseQuery = `
  select
    d.id,
    d.template_id,
    ft.key as template_key,
    ft.name as template_name,
    ft.form_type as template_form_type,
    co.order_number as customer_order_number,
    pr.batch_id as production_batch_id,
    qr.qualification_record_number,
    gr.form_title as generic_form_title,
    (co.document_id is not null or pr.document_id is not null or qr.document_id is not null or gr.document_id is not null) as typed_record_present,
    d.status,
    d.updated_at,
    d.data_json,
    coalesce(array_agg(distinct da.user_id) filter (where da.user_id is not null and da.active = true), '{}'::uuid[])::text[] as assigned_user_ids
  from documents d
  inner join form_templates ft on ft.id = d.template_id
  left join customer_orders co on co.document_id = d.id
  left join production_records pr on pr.document_id = d.id
  left join qualification_records qr on qr.document_id = d.id
  left join generic_form_records gr on gr.document_id = d.id
  left join document_assignments da on da.document_id = d.id
`;

const typedTableNameByFormType: Record<Document["formType"], string> = {
  customer_order: "customer_orders",
  production_record: "production_records",
  qualification_record: "qualification_records",
  generic_form: "generic_form_records",
};

const typedLeadFieldByFormType: Record<Document["formType"], string> = {
  customer_order: "order_number",
  production_record: "batch_id",
  qualification_record: "qualification_record_number",
  generic_form: "form_title",
};

const readTypedLeadValue = (row: DocumentRow): string | undefined => {
  if (row.template_form_type === "customer_order") {
    return row.customer_order_number ?? undefined;
  }

  if (row.template_form_type === "production_record") {
    return row.production_batch_id ?? undefined;
  }

  if (row.template_form_type === "qualification_record") {
    return row.qualification_record_number ?? undefined;
  }

  return row.generic_form_title ?? undefined;
};

export const formatDocumentTitle = (templateKey: string, dataJson: Record<string, unknown>, templateName: string): string => {
  if (templateKey === "customer-order-test") {
    const orderNumber = dataJson.customer_order_number;
    return typeof orderNumber === "string" ? `Serviceeinsatz ${orderNumber}` : templateName;
  }

  if (templateKey === "production-batch") {
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

const mapDocument = (row: DocumentRow): Document => {
  const typedLeadValue = readTypedLeadValue(row);

  return {
    id: row.id,
    templateId: row.template_id,
    formType: row.template_form_type,
    title: formatDocumentTitle(row.template_key, row.data_json ?? {}, row.template_name),
    typedTableName: typedTableNameByFormType[row.template_form_type],
    typedLeadField: typedLeadFieldByFormType[row.template_form_type],
    ...(typedLeadValue ? { typedLeadValue } : {}),
    typedRecordPresent: row.typed_record_present,
    status: row.status,
    updatedAt: row.updated_at.toISOString(),
    assignedUserIds: row.assigned_user_ids ?? [],
  };
};

const mapDocumentDetail = (row: DocumentDetailRow): DocumentDetail => ({
  id: row.id,
  templateId: row.template_id,
  formType: row.template_form_type,
  templateKey: row.template_key,
  templateName: row.template_name,
  ...(row.template_description ? { formTemplateDescription: row.template_description } : {}),
  formTemplateStatus: row.template_status,
  formTemplateMdxBody: row.template_mdx_body,
  templateVersion: row.template_version,
  workflowTemplateId: row.workflow_template_id,
  workflowTemplateKey: row.workflow_template_key,
  workflowTemplateName: row.workflow_template_name,
  workflowTemplateVersion: row.workflow_template_version,
  title: formatDocumentTitle(row.template_key, row.data_json ?? {}, row.template_name),
  status: row.status,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
  documentDataJson: row.data_json ?? {},
  workflowFieldRules: row.workflow_field_rules ?? {},
});

export const listDocumentsVisibleToUser = async (userId: string): Promise<Document[]> => {
  return withDb(async (client) => {
    const result = await client.query<DocumentRow>(
      `
      ${documentBaseQuery}
      inner join template_assignments ta on ta.template_id = d.template_id
      inner join memberships m on m.group_id = ta.group_id
      where m.user_id = $1
        and ta.status = 'active'
        and m.rights like '%r%'
      group by d.id, ft.key, ft.name, ft.form_type, co.order_number, pr.batch_id, qr.qualification_record_number, gr.form_title, co.document_id, pr.document_id, qr.document_id, gr.document_id
      order by d.updated_at desc
      `,
      [userId],
    );

    return result.rows.map(mapDocument);
  });
};

export const listDocumentsAssignedToUser = async (userId: string): Promise<Document[]> => {
  return withDb(async (client) => {
    const result = await client.query<DocumentRow>(
      `
      ${documentBaseQuery}
      inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
      inner join memberships m on m.group_id = ta.group_id and m.user_id = $1 and m.rights like '%r%'
      inner join document_assignments current_assignment
        on current_assignment.document_id = d.id
       and current_assignment.user_id = $1
       and current_assignment.active = true
      group by d.id, ft.key, ft.name, ft.form_type, co.order_number, pr.batch_id, qr.qualification_record_number, gr.form_title, co.document_id, pr.document_id, qr.document_id, gr.document_id
      order by d.updated_at desc
      `,
      [userId],
    );

    return result.rows.map(mapDocument);
  });
};

export const findDocumentDetailVisibleToUser = async (
  documentId: string,
  userId: string,
): Promise<DocumentDetail | null> => {
  return withDb(async (client) => {
    const result = await client.query<DocumentDetailRow>(
      `
      select
        d.id,
        d.template_id,
        ft.key as template_key,
        ft.name as template_name,
        ft.form_type as template_form_type,
        ft.description as template_description,
        ft.status as template_status,
        ft.mdx_body as template_mdx_body,
        d.template_version,
        d.workflow_template_id,
        wt.key as workflow_template_key,
        wt.name as workflow_template_name,
        d.workflow_template_version,
        d.status,
        d.created_at,
        d.updated_at,
        d.data_json,
        wt.workflow_json->'fieldRules' as workflow_field_rules
      from documents d
      inner join form_templates ft on ft.id = d.template_id
      inner join workflow_templates wt on wt.id = d.workflow_template_id
      inner join template_assignments ta on ta.template_id = d.template_id
      inner join memberships m on m.group_id = ta.group_id
      where d.id = $1
        and m.user_id = $2
        and ta.status = 'active'
        and m.rights like '%r%'
      limit 1
      `,
      [documentId, userId],
    );

    const row = result.rows[0];
    return row ? mapDocumentDetail(row) : null;
  });
};

const mapTask = (row: TaskRow): Task => ({
  id: row.id,
  documentId: row.document_id,
  userId: row.user_id,
  title: row.title,
  action: row.action,
  status: row.status,
  role: row.role,
  updatedAt: row.updated_at.toISOString(),
});

export const listTasks = async (): Promise<Task[]> => {
  return withDb(async (client) => {
    const result = await client.query<TaskRow>(
      `select id, document_id, user_id, title, action, status, role, updated_at
       from tasks
       order by updated_at desc`,
    );

    return result.rows.map(mapTask);
  });
};

export const listTasksForUser = async (userId: string): Promise<Task[]> => {
  return withDb(async (client) => {
    const result = await client.query<TaskRow>(
      `select distinct t.id, t.document_id, t.user_id, t.title, t.action, t.status, t.role, t.updated_at
       from tasks t
       inner join documents d on d.id = t.document_id
       inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
       inner join memberships m on m.group_id = ta.group_id and m.user_id = $1 and position('r' in m.rights) > 0
       where t.user_id = $1
       order by updated_at desc`,
      [userId],
    );

    return result.rows.map(mapTask);
  });
};

export const listTasksForDocument = async (documentId: string): Promise<Task[]> => {
  return withDb(async (client) => {
    const result = await client.query<TaskRow>(
      `select id, document_id, user_id, title, action, status, role, updated_at
       from tasks
       where document_id = $1
       order by updated_at desc`,
      [documentId],
    );

    return result.rows.map(mapTask);
  });
};
