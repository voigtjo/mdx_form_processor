import { withDb } from "../../db/pool.js";

export type ReferenceFormDocumentLink = {
  key: "production_batch";
  title: string;
  href: string;
  sourceLabel: string;
  summary: string;
  entries: Array<{
    label: string;
    value: string;
    emptyValueLabel: string;
  }>;
};

type ProductionBatchReferenceRow = {
  id: string;
  template_name: string;
  template_version: number;
  status: string;
  data_json: Record<string, unknown>;
};

const normalizeText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const readStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
};

const readLatestInspectionStep = (value: unknown): string => {
  if (!Array.isArray(value) || value.length === 0) {
    return "";
  }

  const latestEntry = value[value.length - 1];

  if (!latestEntry || typeof latestEntry !== "object") {
    return "";
  }

  const text = "text" in latestEntry ? normalizeText((latestEntry as Record<string, unknown>).text) : "";
  const at = "at" in latestEntry ? normalizeText((latestEntry as Record<string, unknown>).at) : "";

  return text && at ? `${text} (${at})` : text || at;
};

export const findVisibleProductionBatchReferenceByMaterial = async (input: {
  userId: string;
  materialName: string;
  activeUserKey: string;
}): Promise<ReferenceFormDocumentLink | null> => {
  const materialName = input.materialName.trim();

  if (!materialName) {
    return null;
  }

  return withDb(async (client) => {
    const result = await client.query<ProductionBatchReferenceRow>(
      `
      select distinct on (d.id)
        d.id,
        ft.name as template_name,
        d.template_version,
        d.status,
        d.data_json
      from documents d
      inner join form_templates ft on ft.id = d.template_id
      inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
      inner join memberships m on m.group_id = ta.group_id and m.user_id = $1 and position('r' in m.rights) > 0
      where ft.key = 'production-batch'
        and d.status <> 'archived'
        and lower(coalesce(d.data_json->>'product_name', '')) = lower($2)
      order by d.id, d.updated_at desc
      limit 1
      `,
      [input.userId, materialName],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    const batchId = normalizeText(row.data_json.batch_id);
    const productName = normalizeText(row.data_json.product_name);
    const fulfillmentFlags = readStringArray(row.data_json.fulfillment_flags).join(", ");
    const latestInspectionStep = readLatestInspectionStep(row.data_json.inspection_steps);
    const title = batchId ? `Batch ${batchId}` : row.template_name;

    return {
      key: "production_batch",
      title: "Produktionsbatch",
      href: `/documents/${row.id}?user=${input.activeUserKey}`,
      sourceLabel: `${row.template_name} v${row.template_version}`,
      summary: `Aus anderem Formular: ${title}`,
      entries: [
        {
          label: "Formular",
          value: title,
          emptyValueLabel: "Kein referenziertes Formular gefunden",
        },
        {
          label: "Status",
          value: row.status,
          emptyValueLabel: "Kein Status vorhanden",
        },
        {
          label: "Batch-ID",
          value: batchId,
          emptyValueLabel: "Keine Batch-ID vorhanden",
        },
        {
          label: "Produkt",
          value: productName,
          emptyValueLabel: "Kein Produkt vorhanden",
        },
        {
          label: "Fulfillment Flags",
          value: fulfillmentFlags,
          emptyValueLabel: "Keine Flags vorhanden",
        },
        {
          label: "Letzter Prüfschritt",
          value: latestInspectionStep,
          emptyValueLabel: "Noch kein Prüfschritt vorhanden",
        },
      ],
    };
  });
};
