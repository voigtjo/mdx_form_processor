import { withDb } from "../../db/pool.js";
import type { Operation } from "../../types/domain.js";
import { readSchemaFields, sanitizeOperationSchemaJson } from "./schema.js";

type OperationRow = {
  id: string;
  key: string;
  title: string;
  status: Operation["status"];
  description: string | null;
  connector: string;
  auth_mode: string;
  request_schema_json: Record<string, unknown> | null;
  response_schema_json: Record<string, unknown> | null;
  handler_ts_source: string;
  tags_json: string[] | null;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
  archived_at: Date | null;
};

const mapOperation = (row: OperationRow): Operation => ({
  id: row.id,
  key: row.key,
  title: row.title,
  status: row.status,
  connector: row.connector,
  authMode: row.auth_mode,
  requestSchemaJson: sanitizeOperationSchemaJson(row.request_schema_json),
  responseSchemaJson: sanitizeOperationSchemaJson(row.response_schema_json),
  handlerTsSource: row.handler_ts_source,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
  ...(row.published_at ? { publishedAt: row.published_at.toISOString() } : {}),
  ...(row.archived_at ? { archivedAt: row.archived_at.toISOString() } : {}),
  operationRef: row.key,
  modulePath: "db:handler_ts_source",
  authStrategy: row.auth_mode,
  name: row.title,
  ...(row.description ? { description: row.description } : {}),
  tags: row.tags_json ?? [],
  ...(row.request_schema_json ? { inputSchema: { fields: readSchemaFields(row.request_schema_json) } } : {}),
  ...(row.response_schema_json ? { outputSchema: { fields: readSchemaFields(row.response_schema_json) } } : {}),
});

const baseSelect = `
  select
    id,
    key,
    title,
    status,
    description,
    connector,
    auth_mode,
    request_schema_json,
    response_schema_json,
    handler_ts_source,
    tags_json,
    created_at,
    updated_at,
    published_at,
    archived_at
  from operations
`;

export const listOperations = async (input?: {
  includeArchived?: boolean;
  statuses?: Operation["status"][];
}): Promise<Operation[]> => {
  return withDb(async (client) => {
    const whereParts: string[] = [];
    const values: unknown[] = [];

    if (!input?.includeArchived) {
      whereParts.push(`status <> 'archived'`);
    }

    if (input?.statuses && input.statuses.length > 0) {
      values.push(input.statuses);
      whereParts.push(`status = any($${values.length}::text[])`);
    }

    const result = await client.query<OperationRow>(
      `${baseSelect}
       ${whereParts.length > 0 ? `where ${whereParts.join(" and ")}` : ""}
       order by title asc, key asc`,
      values,
    );

    return result.rows.map(mapOperation);
  });
};

export const findOperationById = async (id: string): Promise<Operation | null> => {
  return withDb(async (client) => {
    const result = await client.query<OperationRow>(
      `${baseSelect}
       where id = $1
       limit 1`,
      [id],
    );

    const row = result.rows[0];
    return row ? mapOperation(row) : null;
  });
};

export const findOperationByKey = async (key: string, input?: {
  publishedOnly?: boolean;
  includeArchived?: boolean;
}): Promise<Operation | null> => {
  return withDb(async (client) => {
    const whereParts = ["key = $1"];
    const values: unknown[] = [key];

    if (input?.publishedOnly) {
      whereParts.push(`status = 'published'`);
    } else if (!input?.includeArchived) {
      whereParts.push(`status <> 'archived'`);
    }

    const result = await client.query<OperationRow>(
      `${baseSelect}
       where ${whereParts.join(" and ")}
       order by
         case
           when status = 'published' then 0
           when status = 'draft' then 1
           when status = 'inactive' then 2
           else 3
         end,
         updated_at desc
       limit 1`,
      values,
    );

    const row = result.rows[0];
    return row ? mapOperation(row) : null;
  });
};
