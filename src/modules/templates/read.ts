import { withDb } from "../../db/pool.js";
import type { FormTemplate, TemplateAssignment } from "../../types/domain.js";

type TemplateRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  version: number;
  status: FormTemplate["status"];
  workflow_template_id: string;
  template_keys: string[];
  document_keys: string[];
  table_fields: string[];
  group_ids: string[];
};

type TemplateAssignmentRow = {
  id: string;
  template_id: string;
  group_id: string;
  status: string;
  assigned_at: Date;
};

const templateQuery = `
  select
    ft.id,
    ft.key,
    ft.name,
    ft.description,
    ft.version,
    ft.status,
    ft.workflow_template_id,
    ft.template_keys,
    ft.document_keys,
    ft.table_fields,
    coalesce(array_agg(distinct ta.group_id) filter (where ta.group_id is not null), '{}'::uuid[])::text[] as group_ids
  from form_templates ft
  left join template_assignments ta on ta.template_id = ft.id
`;

const mapTemplate = (row: TemplateRow): FormTemplate => ({
  id: row.id,
  key: row.key,
  name: row.name,
  ...(row.description ? { description: row.description } : {}),
  version: row.version,
  status: row.status,
  workflowTemplateId: row.workflow_template_id,
  groupIds: row.group_ids,
  templateKeys: row.template_keys ?? [],
  documentKeys: row.document_keys ?? [],
  tableFields: row.table_fields ?? [],
});

export const listFormTemplates = async (): Promise<FormTemplate[]> => {
  return withDb(async (client) => {
    const result = await client.query<TemplateRow>(`
      ${templateQuery}
      group by ft.id
      order by ft.name asc, ft.version desc
    `);

    return result.rows.map(mapTemplate);
  });
};

export const listFormTemplatesForUser = async (userId: string): Promise<FormTemplate[]> => {
  return withDb(async (client) => {
    const result = await client.query<TemplateRow>(
      `
      ${templateQuery}
      inner join memberships m on m.group_id = ta.group_id
      where m.user_id = $1
      group by ft.id
      order by ft.name asc, ft.version desc
      `,
      [userId],
    );

    return result.rows.map(mapTemplate);
  });
};

const mapTemplateAssignment = (row: TemplateAssignmentRow): TemplateAssignment => ({
  id: row.id,
  templateId: row.template_id,
  groupId: row.group_id,
  status: row.status,
  assignedAt: row.assigned_at.toISOString(),
});

export const listTemplateAssignments = async (): Promise<TemplateAssignment[]> => {
  return withDb(async (client) => {
    const result = await client.query<TemplateAssignmentRow>(
      `select id, template_id, group_id, status, assigned_at
       from template_assignments
       order by assigned_at asc`,
    );

    return result.rows.map(mapTemplateAssignment);
  });
};
