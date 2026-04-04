import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";
import { transpileOperationHandlerSource } from "./runtime.js";

type OperationStatus = "draft" | "published" | "inactive" | "archived";

type OperationMutationInput = {
  operationId?: string;
  key: string;
  title: string;
  description?: string;
  connector: string;
  authMode: string;
  requestSchemaText: string;
  responseSchemaText: string;
  handlerTsSource: string;
  tagsText?: string;
  intent: "save_draft" | "publish";
};

type OperationMutationResult = {
  id: string;
  key: string;
  status: OperationStatus;
};

const parseJsonText = (label: string, value: string): Record<string, unknown> => {
  const normalized = value.trim();

  if (!normalized) {
    return {};
  }

  try {
    const parsed = JSON.parse(normalized) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`${label} muss ein JSON-Objekt sein.`);
    }

    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof Error && error.message === `${label} muss ein JSON-Objekt sein.`) {
      throw error;
    }

    throw new Error(`${label} ist kein gueltiges JSON.`);
  }
};

const normalizeTags = (value: string | undefined): string[] => {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const normalizeString = (value: string, label: string): string => {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${label} darf nicht leer sein.`);
  }

  return normalized;
};

const ensureOperationKeyUnique = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  key: string,
  operationId?: string,
) => {
  const result = await client.query<{ id: string }>(
    `select id
     from operations
     where key = $1
       and ($2::uuid is null or id <> $2::uuid)
     limit 1`,
    [key, operationId ?? null],
  );

  if (result.rows[0]) {
    throw new Error(`Eine API mit dem Key ${key} existiert bereits.`);
  }
};

const loadOperationStatus = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  operationId: string,
) => {
  const result = await client.query<{ status: OperationStatus }>(
    `select status
     from operations
     where id = $1
     limit 1`,
    [operationId],
  );

  return result.rows[0]?.status ?? null;
};

export const saveOperationDraft = async (input: OperationMutationInput): Promise<OperationMutationResult> => {
  const key = normalizeString(input.key, "API-Key");
  const title = normalizeString(input.title, "API-Titel");
  const connector = normalizeString(input.connector, "Connector");
  const authMode = normalizeString(input.authMode, "Auth Mode");
  const handlerTsSource = normalizeString(input.handlerTsSource, "Handler Source");
  const requestSchemaJson = parseJsonText("Request Schema", input.requestSchemaText);
  const responseSchemaJson = parseJsonText("Response Schema", input.responseSchemaText);
  const tagsJson = normalizeTags(input.tagsText);

  if (input.intent === "publish") {
    transpileOperationHandlerSource(handlerTsSource);
  }

  return withDbTransaction(async (client) => {
    await ensureOperationKeyUnique(client, key, input.operationId);

    const nextStatus: OperationStatus = input.intent === "publish" ? "published" : "draft";

    if (input.operationId) {
      const currentStatus = await loadOperationStatus(client, input.operationId);

      if (!currentStatus) {
        throw new Error("Die angeforderte API wurde nicht gefunden.");
      }

      await client.query(
        `update operations
         set key = $2,
             operation_ref = $2,
             title = $3,
             name = $3,
             status = $4,
             description = $5,
             connector = $6,
             auth_mode = $7,
             auth_strategy = $7,
             request_schema_json = $8::jsonb,
             input_schema = $8::jsonb,
             response_schema_json = $9::jsonb,
             output_schema = $9::jsonb,
             handler_ts_source = $10,
             tags_json = $11::jsonb,
             tags = $11::jsonb,
             module_path = 'db:handler_ts_source',
             published_at = case when $4 = 'published' then now() else published_at end,
             archived_at = case when $4 = 'archived' then now() else archived_at end,
             updated_at = now()
         where id = $1`,
        [
          input.operationId,
          key,
          title,
          nextStatus,
          input.description?.trim() || null,
          connector,
          authMode,
          JSON.stringify(requestSchemaJson),
          JSON.stringify(responseSchemaJson),
          handlerTsSource,
          JSON.stringify(tagsJson),
        ],
      );

      return {
        id: input.operationId,
        key,
        status: nextStatus,
      };
    }

    const id = randomUUID();

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
         published_at
       )
       values (
         $1, $2, $2, $3, $3, $4, $5, $6, $7, $7,
         $8::jsonb, $8::jsonb, $9::jsonb, $9::jsonb, $10, $11::jsonb, $11::jsonb,
         'db:handler_ts_source',
         case when $4 = 'published' then now() else null end
       )`,
      [
        id,
        key,
        title,
        nextStatus,
        input.description?.trim() || null,
        connector,
        authMode,
        JSON.stringify(requestSchemaJson),
        JSON.stringify(responseSchemaJson),
        handlerTsSource,
        JSON.stringify(tagsJson),
      ],
    );

    return {
      id,
      key,
      status: nextStatus,
    };
  });
};

const transitionOperationStatus = async (operationId: string, status: OperationStatus): Promise<OperationMutationResult> => {
  return withDbTransaction(async (client) => {
    const result = await client.query<{ id: string; key: string }>(
      `update operations
       set status = $2,
           published_at = case when $2 = 'published' then now() else published_at end,
           archived_at = case when $2 = 'archived' then now() else archived_at end,
           updated_at = now()
       where id = $1
       returning id, key`,
      [operationId, status],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error("Die angeforderte API wurde nicht gefunden.");
    }

    return {
      id: row.id,
      key: row.key,
      status,
    };
  });
};

export const publishOperation = async (input: { operationId: string }): Promise<OperationMutationResult> => {
  return withDbTransaction(async (client) => {
    const result = await client.query<{ handler_ts_source: string }>(
      `select handler_ts_source
       from operations
       where id = $1
       limit 1`,
      [input.operationId],
    );

    const row = result.rows[0];

    if (!row) {
      throw new Error("Die angeforderte API wurde nicht gefunden.");
    }

    transpileOperationHandlerSource(row.handler_ts_source);
    return transitionOperationStatus(input.operationId, "published");
  });
};

export const unpublishOperation = async (input: { operationId: string }): Promise<OperationMutationResult> => {
  return transitionOperationStatus(input.operationId, "inactive");
};

export const archiveOperation = async (input: { operationId: string }): Promise<OperationMutationResult> => {
  return transitionOperationStatus(input.operationId, "archived");
};
