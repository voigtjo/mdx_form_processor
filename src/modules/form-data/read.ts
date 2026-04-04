import { withDb } from "../../db/pool.js";
import { formatDocumentTitle } from "../documents/read.js";

type FormDataRecordRow = {
  id: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  data_json: Record<string, unknown>;
  template_id: string;
  template_key: string;
  template_name: string;
  template_version: number;
  table_fields: string[];
  workflow_template_id: string;
  workflow_template_key: string;
  workflow_template_name: string;
  workflow_template_version: number;
};

export type FormDataRecord = {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  template: {
    id: string;
    key: string;
    name: string;
    version: number;
    tableFields: string[];
  };
  workflow: {
    id: string;
    key: string;
    name: string;
    version: number;
  };
  data: Record<string, unknown>;
};

const pickFields = (data: Record<string, unknown>, fields?: string[]): Record<string, unknown> => {
  if (!fields || fields.length === 0) {
    return data;
  }

  return Object.fromEntries(fields.map((field) => [field, data[field] ?? null]));
};

const mapFormDataRecord = (row: FormDataRecordRow, fields?: string[]): FormDataRecord => ({
  id: row.id,
  title: formatDocumentTitle(row.template_key, row.data_json ?? {}, row.template_name),
  status: row.status,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
  template: {
    id: row.template_id,
    key: row.template_key,
    name: row.template_name,
    version: row.template_version,
    tableFields: row.table_fields ?? [],
  },
  workflow: {
    id: row.workflow_template_id,
    key: row.workflow_template_key,
    name: row.workflow_template_name,
    version: row.workflow_template_version,
  },
  data: pickFields(row.data_json ?? {}, fields),
});

const baseQuery = `
  select
    d.id,
    d.status,
    d.created_at,
    d.updated_at,
    d.data_json,
    ft.id as template_id,
    ft.key as template_key,
    ft.name as template_name,
    d.template_version,
    ft.table_fields,
    wt.id as workflow_template_id,
    wt.key as workflow_template_key,
    wt.name as workflow_template_name,
    d.workflow_template_version
  from documents d
  inner join form_templates ft on ft.id = d.template_id
  inner join workflow_templates wt on wt.id = d.workflow_template_id
  inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
  inner join memberships m on m.group_id = ta.group_id and position('r' in m.rights) > 0
`;

export const listTemplateFormDataRecordsVisibleToUser = async (input: {
  userId: string;
  templateKey: string;
  fields?: string[];
}): Promise<FormDataRecord[]> => {
  return withDb(async (client) => {
    const result = await client.query<FormDataRecordRow>(
      `${baseQuery}
       where m.user_id = $1
         and ft.key = $2
       group by d.id, ft.id, wt.id
       order by d.updated_at desc`,
      [input.userId, input.templateKey],
    );

    return result.rows.map((row) => mapFormDataRecord(row, input.fields));
  });
};

export const findTemplateFormDataRecordVisibleToUser = async (input: {
  userId: string;
  templateKey: string;
  documentId: string;
  fields?: string[];
}): Promise<FormDataRecord | null> => {
  return withDb(async (client) => {
    const result = await client.query<FormDataRecordRow>(
      `${baseQuery}
       where m.user_id = $1
         and ft.key = $2
         and d.id = $3
       group by d.id, ft.id, wt.id
       limit 1`,
      [input.userId, input.templateKey, input.documentId],
    );

    const row = result.rows[0];
    return row ? mapFormDataRecord(row, input.fields) : null;
  });
};
