import { withDbTransaction } from "../../db/pool.js";
import { parseCsvWithHeader } from "../data-exchange/csv.js";
import type { ReferenceEntity } from "../../types/domain.js";

type ImportReferenceEntitiesInput = {
  entityType: ReferenceEntity["entityType"];
  csvText: string;
};

const requiredHeaders = ["entity_key", "display_name", "status"] as const;

export const importReferenceEntitiesFromCsv = async (input: ImportReferenceEntitiesInput): Promise<{ importedCount: number }> => {
  const table = parseCsvWithHeader(input.csvText);

  for (const header of requiredHeaders) {
    if (!table.headers.includes(header)) {
      throw new Error(`CSV-Import erwartet den Header ${header}.`);
    }
  }

  return withDbTransaction(async (client) => {
    for (const row of table.rows) {
      const entityKey = row.entity_key?.trim();
      const displayName = row.display_name?.trim();
      const status = row.status?.trim() === "inactive" ? "inactive" : "active";

      if (!entityKey || !displayName) {
        throw new Error("CSV-Import erwartet pro Zeile entity_key und display_name.");
      }

      const dataJson = Object.fromEntries(
        Object.entries(row).filter(([key]) => !requiredHeaders.includes(key as (typeof requiredHeaders)[number])),
      );

      await client.query(
        `insert into reference_entities (entity_type, entity_key, display_name, status, source, data_json)
         values ($1, $2, $3, $4, 'csv', $5::jsonb)
         on conflict (entity_type, entity_key) do update
           set display_name = excluded.display_name,
               status = excluded.status,
               source = excluded.source,
               data_json = excluded.data_json,
               updated_at = now()`,
        [input.entityType, entityKey, displayName, status, JSON.stringify(dataJson)],
      );
    }

    return {
      importedCount: table.rows.length,
    };
  });
};
