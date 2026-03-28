import { withDb, withDbTransaction } from "../../db/pool.js";

type StartableTemplateRow = {
  template_id: string;
  template_key: string;
  template_name: string;
  template_version: number;
  workflow_template_id: string;
  workflow_template_version: number;
  workflow_initial_status: string | null;
};

type StartDocumentInput = {
  templateId: string;
  userId: string;
};

type StartDocumentSuccess = {
  ok: true;
  documentId: string;
};

type StartDocumentFailure = {
  ok: false;
  reason: "template_not_startable";
};

export type StartDocumentResult = StartDocumentSuccess | StartDocumentFailure;

const findStartableTemplate = async (
  userId: string,
  templateId: string,
): Promise<StartableTemplateRow | null> => {
  return withDb(async (client) => {
    const result = await client.query<StartableTemplateRow>(
      `
      select
        ft.id as template_id,
        ft.key as template_key,
        ft.name as template_name,
        ft.version as template_version,
        wt.id as workflow_template_id,
        wt.version as workflow_template_version,
        wt.workflow_json->>'initialStatus' as workflow_initial_status
      from form_templates ft
      inner join workflow_templates wt on wt.id = ft.workflow_template_id
      inner join template_assignments ta on ta.template_id = ft.id and ta.status = 'active'
      inner join memberships m on m.group_id = ta.group_id
      where ft.id = $1
        and m.user_id = $2
        and ft.status = 'published'
        and wt.status = 'published'
      limit 1
      `,
      [templateId, userId],
    );

    return result.rows[0] ?? null;
  });
};

export const startDocumentForUser = async ({ templateId, userId }: StartDocumentInput): Promise<StartDocumentResult> => {
  const template = await findStartableTemplate(userId, templateId);

  if (!template) {
    return {
      ok: false,
      reason: "template_not_startable",
    };
  }

  const initialStatus = template.workflow_initial_status ?? "created";

  return withDbTransaction(async (client) => {
    const insertedDocument = await client.query<{ id: string }>(
      `
      insert into documents (
        template_id,
        template_version,
        workflow_template_id,
        workflow_template_version,
        status,
        data_json,
        created_by
      )
      values ($1, $2, $3, $4, $5, '{}'::jsonb, $6)
      returning id
      `,
      [
        template.template_id,
        template.template_version,
        template.workflow_template_id,
        template.workflow_template_version,
        initialStatus,
        userId,
      ],
    );

    const documentId = insertedDocument.rows[0]?.id;

    if (!documentId) {
      throw new Error("Document insert did not return an id.");
    }

    await client.query(
      `
      insert into document_assignments (document_id, user_id, role, assigned_by, active)
      values ($1, $2, 'editor', $2, true)
      `,
      [documentId, userId],
    );

    await client.query(
      `
      insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
      values
        ($1, 'created', $2, $3, $4::jsonb),
        ($1, 'assigned', $2, $5, $6::jsonb)
      `,
      [
        documentId,
        userId,
        `Document created from template ${template.template_name}.`,
        JSON.stringify({
          templateId: template.template_id,
          templateKey: template.template_key,
          status: initialStatus,
        }),
        "Creator assigned as initial editor.",
        JSON.stringify({
          userId,
          role: "editor",
        }),
      ],
    );

    return {
      ok: true,
      documentId,
    };
  });
};
