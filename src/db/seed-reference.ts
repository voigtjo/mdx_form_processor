import type { PoolClient } from "pg";
import { pathToFileURL } from "node:url";
import { closePool, withDbTransaction } from "./pool.js";
import { getReferenceSeedData } from "./reference-data.js";
import { importReferenceEntitiesFromCsv } from "../modules/entities/import.js";
import { syncTypedRecordForDocument } from "../modules/documents/typed-records.js";

const upsertUser = async (client: PoolClient, row: Awaited<ReturnType<typeof getReferenceSeedData>>["users"][number]): Promise<void> => {
  await client.query(
    `insert into users (id, key, display_name, email, description, status)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do update
       set key = excluded.key,
           display_name = excluded.display_name,
           email = excluded.email,
           description = excluded.description,
           status = excluded.status,
           updated_at = now()`,
    [row.id, row.key, row.displayName, row.email, row.description ?? null, row.status],
  );
};

const upsertGroup = async (client: PoolClient, row: Awaited<ReturnType<typeof getReferenceSeedData>>["groups"][number]): Promise<void> => {
  await client.query(
    `insert into groups (id, key, name, description, status)
     values ($1, $2, $3, $4, $5)
     on conflict (id) do update
       set key = excluded.key,
           name = excluded.name,
           description = excluded.description,
           status = excluded.status,
           updated_at = now()`,
    [row.id, row.key, row.name, row.description, row.status],
  );
};

const upsertMembership = async (
  client: PoolClient,
  row: Awaited<ReturnType<typeof getReferenceSeedData>>["memberships"][number],
): Promise<void> => {
  await client.query(
    `insert into memberships (id, user_id, group_id, rights)
     values ($1, $2, $3, $4)
     on conflict (id) do update
       set user_id = excluded.user_id,
           group_id = excluded.group_id,
           rights = excluded.rights,
           updated_at = now()`,
    [row.id, row.userId, row.groupId, row.rights],
  );
};

const upsertOperation = async (
  client: PoolClient,
  row: Awaited<ReturnType<typeof getReferenceSeedData>>["operations"][number],
): Promise<void> => {
  await client.query(
    `insert into operations (
       id,
       operation_ref,
       key,
       title,
       name,
       status,
       description,
       connector,
       auth_mode,
       auth_strategy,
       request_schema_json,
       input_schema,
       response_schema_json,
       output_schema,
       handler_ts_source,
       tags_json,
       tags,
       module_path,
       published_at,
       archived_at
     )
     values (
       $1, $2, $2, $3, $3, $4, $5, $6, $7, $7,
       $8::jsonb, $8::jsonb, $9::jsonb, $9::jsonb, $10, $11::jsonb, $11::jsonb,
       'db:handler_ts_source',
       case when $4 = 'published' then now() else null end,
       case when $4 = 'archived' then now() else null end
     )
     on conflict (key) do update
       set operation_ref = excluded.operation_ref,
           title = excluded.title,
           name = excluded.name,
           status = excluded.status,
           description = excluded.description,
           connector = excluded.connector,
           auth_mode = excluded.auth_mode,
           auth_strategy = excluded.auth_strategy,
           request_schema_json = excluded.request_schema_json,
           input_schema = excluded.input_schema,
           response_schema_json = excluded.response_schema_json,
           output_schema = excluded.output_schema,
           handler_ts_source = excluded.handler_ts_source,
           tags_json = excluded.tags_json,
           tags = excluded.tags,
           module_path = excluded.module_path,
           published_at = excluded.published_at,
           archived_at = excluded.archived_at,
           updated_at = now()`,
    [
      row.id,
      row.key,
      row.title,
      row.status,
      row.description,
      row.connector,
      row.authMode,
      JSON.stringify(row.requestSchemaJson ?? {}),
      JSON.stringify(row.responseSchemaJson ?? {}),
      row.handlerTsSource,
      JSON.stringify(row.tags),
    ],
  );
};

const upsertWorkflow = async (
  client: PoolClient,
  row: Awaited<ReturnType<typeof getReferenceSeedData>>["workflows"][number],
): Promise<void> => {
  await client.query(
    `insert into workflow_templates (id, key, name, description, version, status, workflow_json, published_at)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, now())
     on conflict (id) do update
       set key = excluded.key,
           name = excluded.name,
           description = excluded.description,
           version = excluded.version,
           status = excluded.status,
           workflow_json = excluded.workflow_json,
           published_at = excluded.published_at,
           updated_at = now()`,
    [row.id, row.key, row.name, row.description, row.version, row.status, JSON.stringify(row.workflowJson)],
  );
};

const upsertTemplate = async (
  client: PoolClient,
  row: Awaited<ReturnType<typeof getReferenceSeedData>>["templates"][number],
): Promise<void> => {
  await client.query(
    `insert into form_templates (
       id, key, name, description, version, status, workflow_template_id, mdx_body,
       form_type,
       template_keys, document_keys, table_fields, visibility_rules, published_at
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb, '{}'::jsonb, now())
     on conflict (id) do update
       set key = excluded.key,
           name = excluded.name,
           form_type = excluded.form_type,
           description = excluded.description,
           version = excluded.version,
           status = excluded.status,
           workflow_template_id = excluded.workflow_template_id,
           mdx_body = excluded.mdx_body,
           template_keys = excluded.template_keys,
           document_keys = excluded.document_keys,
           table_fields = excluded.table_fields,
           visibility_rules = excluded.visibility_rules,
           published_at = excluded.published_at,
           updated_at = now()`,
    [
      row.id,
      row.key,
      row.name,
      row.description,
      row.version,
      row.status,
      row.workflowTemplateId,
      row.mdxBody,
      row.formType,
      JSON.stringify(row.templateKeys),
      JSON.stringify(row.documentKeys),
      JSON.stringify(row.tableFields),
    ],
  );
};

const upsertTemplateAssignment = async (
  client: PoolClient,
  row: Awaited<ReturnType<typeof getReferenceSeedData>>["templateAssignments"][number],
): Promise<void> => {
  await client.query(
    `insert into template_assignments (id, template_id, group_id, status, assigned_at)
     values ($1, $2, $3, $4, $5)
     on conflict (id) do update
       set template_id = excluded.template_id,
           group_id = excluded.group_id,
           status = excluded.status,
           assigned_at = excluded.assigned_at`,
    [row.id, row.templateId, row.groupId, row.status, row.assignedAt],
  );
};

const upsertDocument = async (
  client: PoolClient,
  row: Awaited<ReturnType<typeof getReferenceSeedData>>["documents"][number],
): Promise<void> => {
  await client.query(
    `insert into documents (
       id, template_id, template_version, workflow_template_id, workflow_template_version, status,
       data_json, external_json, snapshot_json, integration_context_json, created_by, created_at, updated_at
     )
     values ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9::jsonb, $10::jsonb, $11, $12, $13)
     on conflict (id) do update
       set template_id = excluded.template_id,
           template_version = excluded.template_version,
           workflow_template_id = excluded.workflow_template_id,
           workflow_template_version = excluded.workflow_template_version,
           status = excluded.status,
           data_json = excluded.data_json,
           external_json = excluded.external_json,
           snapshot_json = excluded.snapshot_json,
           integration_context_json = excluded.integration_context_json,
           created_by = excluded.created_by,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at`,
    [
      row.id,
      row.templateId,
      row.templateVersion,
      row.workflowTemplateId,
      row.workflowTemplateVersion,
      row.status,
      JSON.stringify(row.dataJson),
      JSON.stringify(row.externalJson),
      JSON.stringify(row.snapshotJson),
      JSON.stringify(row.integrationContextJson),
      row.createdBy,
      row.createdAt,
      row.updatedAt,
    ],
  );
};

const upsertDocumentAssignment = async (
  client: PoolClient,
  row: Awaited<ReturnType<typeof getReferenceSeedData>>["documentAssignments"][number],
): Promise<void> => {
  await client.query(
    `insert into document_assignments (id, document_id, user_id, role, assigned_by, assigned_at, active)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (id) do update
       set document_id = excluded.document_id,
           user_id = excluded.user_id,
           role = excluded.role,
           assigned_by = excluded.assigned_by,
           assigned_at = excluded.assigned_at,
           active = excluded.active`,
    [row.id, row.documentId, row.userId, row.role, row.assignedBy, row.assignedAt, row.active],
  );
};

const upsertTask = async (client: PoolClient, row: Awaited<ReturnType<typeof getReferenceSeedData>>["tasks"][number]): Promise<void> => {
  await client.query(
    `insert into tasks (id, document_id, user_id, title, action, status, role, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     on conflict (id) do update
       set document_id = excluded.document_id,
           user_id = excluded.user_id,
           title = excluded.title,
           action = excluded.action,
           status = excluded.status,
           role = excluded.role,
           created_at = excluded.created_at,
           updated_at = excluded.updated_at`,
    [row.id, row.documentId, row.userId, row.title, row.action, row.status, row.role, row.createdAt, row.updatedAt],
  );
};

const upsertAttachment = async (
  client: PoolClient,
  row: Awaited<ReturnType<typeof getReferenceSeedData>>["attachments"][number],
): Promise<void> => {
  await client.query(
    `insert into attachments (id, document_id, filename, mime_type, size, storage_key, uploaded_by, created_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     on conflict (id) do update
       set document_id = excluded.document_id,
           filename = excluded.filename,
           mime_type = excluded.mime_type,
           size = excluded.size,
           storage_key = excluded.storage_key,
           uploaded_by = excluded.uploaded_by,
           created_at = excluded.created_at`,
    [row.id, row.documentId, row.filename, row.mimeType, row.size, row.storageKey, row.uploadedBy, row.createdAt],
  );
};

const upsertAuditEvent = async (
  client: PoolClient,
  row: Awaited<ReturnType<typeof getReferenceSeedData>>["auditEvents"][number],
): Promise<void> => {
  await client.query(
    `insert into audit_events (id, document_id, event_type, actor_user_id, message, payload_json, created_at)
     values ($1, $2, $3, $4, $5, $6::jsonb, $7)
     on conflict (id) do update
       set document_id = excluded.document_id,
           event_type = excluded.event_type,
           actor_user_id = excluded.actor_user_id,
           message = excluded.message,
           payload_json = excluded.payload_json,
           created_at = excluded.created_at`,
    [row.id, row.documentId, row.eventType, row.actorUserId ?? null, row.message, JSON.stringify(row.payloadJson), row.createdAt],
  );
};

export const seedReferenceData = async (): Promise<void> => {
  const data = await getReferenceSeedData();

  await withDbTransaction(async (client) => {
    const templateRowsById = new Map(data.templates.map((template) => [template.id, template]));

    for (const row of data.users) await upsertUser(client, row);
    for (const row of data.groups) await upsertGroup(client, row);
    for (const row of data.memberships) await upsertMembership(client, row);
    for (const row of data.operations) await upsertOperation(client, row);
    for (const row of data.workflows) await upsertWorkflow(client, row);
    for (const row of data.templates) await upsertTemplate(client, row);
    for (const row of data.templateAssignments) await upsertTemplateAssignment(client, row);
    for (const row of data.documents) {
      await upsertDocument(client, row);
      const template = templateRowsById.get(row.templateId);

      if (template) {
        await syncTypedRecordForDocument(client, {
          documentId: row.id,
          formType: template.formType,
          templateName: template.name,
          status: row.status,
          dataJson: row.dataJson,
        });
      }
    }
    for (const row of data.documentAssignments) await upsertDocumentAssignment(client, row);
    for (const row of data.tasks) await upsertTask(client, row);
    for (const row of data.attachments) await upsertAttachment(client, row);
    for (const row of data.auditEvents) await upsertAuditEvent(client, row);
  });

  for (const row of data.entityImports) {
    await importReferenceEntitiesFromCsv({
      entityType: row.entityType,
      csvText: row.csvText,
    });
  }
};

const main = async (): Promise<void> => {
  await seedReferenceData();
  console.log("Reference seed upserted.");
};

const entryPoint = process.argv[1];

if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  main()
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Reference seed failed: ${message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await closePool();
    });
}
