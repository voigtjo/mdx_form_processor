import { withDb } from "../../db/pool.js";
import type { ReferenceEntity } from "../../types/domain.js";

type ReferenceEntityRow = {
  id: string;
  entity_type: ReferenceEntity["entityType"];
  entity_key: string;
  display_name: string;
  status: ReferenceEntity["status"];
  source: string;
  data_json: Record<string, unknown>;
  updated_at: Date;
};

const mapReferenceEntity = (row: ReferenceEntityRow): ReferenceEntity => ({
  id: row.id,
  entityType: row.entity_type,
  entityKey: row.entity_key,
  displayName: row.display_name,
  status: row.status,
  source: row.source,
  dataJson: row.data_json ?? {},
  updatedAt: row.updated_at.toISOString(),
});

export const listReferenceEntities = async (entityType?: ReferenceEntity["entityType"]): Promise<ReferenceEntity[]> => {
  return withDb(async (client) => {
    const result = entityType
      ? await client.query<ReferenceEntityRow>(
          `select id, entity_type, entity_key, display_name, status, source, data_json, updated_at
           from reference_entities
           where entity_type = $1
           order by display_name asc, entity_key asc`,
          [entityType],
        )
      : await client.query<ReferenceEntityRow>(
          `select id, entity_type, entity_key, display_name, status, source, data_json, updated_at
           from reference_entities
           order by entity_type asc, display_name asc, entity_key asc`,
        );

    return result.rows.map(mapReferenceEntity);
  });
};

export const findReferenceEntityByKey = async (input: {
  entityType: ReferenceEntity["entityType"];
  entityKey: string;
}): Promise<ReferenceEntity | null> => {
  return withDb(async (client) => {
    const result = await client.query<ReferenceEntityRow>(
      `select id, entity_type, entity_key, display_name, status, source, data_json, updated_at
       from reference_entities
       where entity_type = $1
         and entity_key = $2
       limit 1`,
      [input.entityType, input.entityKey],
    );

    const row = result.rows[0];
    return row ? mapReferenceEntity(row) : null;
  });
};

export const findActiveReferenceEntityByDataField = async (input: {
  entityType: ReferenceEntity["entityType"];
  field: string;
  value: string;
}): Promise<ReferenceEntity | null> => {
  return withDb(async (client) => {
    const result = await client.query<ReferenceEntityRow>(
      `select id, entity_type, entity_key, display_name, status, source, data_json, updated_at
       from reference_entities
       where entity_type = $1
         and status = 'active'
         and lower(coalesce(data_json ->> $2, '')) = lower($3)
       order by display_name asc, entity_key asc
       limit 1`,
      [input.entityType, input.field, input.value],
    );

    const row = result.rows[0];
    return row ? mapReferenceEntity(row) : null;
  });
};
