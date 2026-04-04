import type { PoolClient } from "pg";
import { evaluateQualificationDocumentData } from "../qualification/evaluation.js";

export type FormType = "customer_order" | "production_record" | "qualification_record" | "generic_form";

const normalizeText = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

const normalizePayload = (value: Record<string, unknown>): Record<string, unknown> => value;
const normalizeTimestamp = (value: unknown): string | null => normalizeText(value);

const normalizeJsonValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    const normalized = value.trim();

    if (normalized.length === 0) {
      return [];
    }

    try {
      return JSON.parse(normalized);
    } catch {
      return normalized
        .split(",")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }
  }

  return value;
};

const readQualificationResult = (dataJson: Record<string, unknown>): string | null => {
  const directValue = normalizeText(dataJson.qualification_result);

  if (directValue) {
    return directValue;
  }

  const participantStates = dataJson.qualification_participant_states;

  if (!participantStates || typeof participantStates !== "object" || Array.isArray(participantStates)) {
    return null;
  }

  for (const state of Object.values(participantStates as Record<string, unknown>)) {
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      continue;
    }

    const fieldValues = (state as Record<string, unknown>).fieldValues;

    if (!fieldValues || typeof fieldValues !== "object" || Array.isArray(fieldValues)) {
      continue;
    }

    const currentValue = normalizeText((fieldValues as Record<string, unknown>).qualification_result);

    if (currentValue) {
      return currentValue;
    }
  }

  return null;
};

const readQualificationTopics = (dataJson: Record<string, unknown>): string[] => {
  const values = new Set<string>();
  const collectTopics = (value: unknown) => {
    const normalized = normalizeJsonValue(value);

    if (Array.isArray(normalized)) {
      normalized
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0)
        .forEach((entry) => values.add(entry));
    }
  };

  collectTopics(dataJson.qualification_topics);

  const participantStates = dataJson.qualification_participant_states;

  if (participantStates && typeof participantStates === "object" && !Array.isArray(participantStates)) {
    for (const state of Object.values(participantStates as Record<string, unknown>)) {
      if (!state || typeof state !== "object" || Array.isArray(state)) {
        continue;
      }

      const fieldValues = (state as Record<string, unknown>).fieldValues;

      if (!fieldValues || typeof fieldValues !== "object" || Array.isArray(fieldValues)) {
        continue;
      }

      collectTopics((fieldValues as Record<string, unknown>).qualification_topics);
    }
  }

  return Array.from(values);
};

export const syncTypedRecordForDocument = async (client: PoolClient, input: {
  documentId: string;
  formType: FormType;
  templateName: string;
  status: string;
  dataJson: Record<string, unknown>;
}): Promise<void> => {
  const approvalStatus = input.status === "approved"
    ? "freigegeben"
    : input.status === "submitted"
      ? "pruefung"
      : input.status === "rejected"
        ? "offen"
        : normalizeText(input.dataJson.approval_status) ?? input.status;

  if (input.formType === "customer_order") {
    await client.query(
      `insert into customer_orders (
         document_id,
         order_number,
         customer_name,
         service_location,
         material,
         work_description_html,
         work_signature_at,
         approval_status,
         status,
         service_date,
         technician
       )
       values ($1, $2, $3, $4, $5, $6, $7::timestamptz, $8, $9, $10, $11)
       on conflict (document_id) do update
         set order_number = excluded.order_number,
             customer_name = excluded.customer_name,
             service_location = excluded.service_location,
             material = excluded.material,
             work_description_html = excluded.work_description_html,
             work_signature_at = excluded.work_signature_at,
             approval_status = excluded.approval_status,
             status = excluded.status,
             service_date = excluded.service_date,
             technician = excluded.technician,
             updated_at = now()`,
      [
        input.documentId,
        normalizeText(input.dataJson.customer_order_number),
        normalizeText(input.dataJson.customer_name),
        normalizeText(input.dataJson.service_location),
        normalizeText(input.dataJson.material),
        normalizeText(input.dataJson.work_description),
        normalizeTimestamp(input.dataJson.work_signature_at),
        approvalStatus,
        input.status,
        normalizeText(input.dataJson.service_date),
        normalizeText(input.dataJson.technician),
      ],
    );

    return;
  }

  if (input.formType === "production_record") {
    await client.query(
      `insert into production_records (
         document_id,
         batch_id,
         serial_number,
         product_name,
         production_line,
         process_steps_json,
         work_signature_at,
         approval_status,
         status
       )
       values ($1, $2, $3, $4, $5, $6::jsonb, $7::timestamptz, $8, $9)
       on conflict (document_id) do update
         set batch_id = excluded.batch_id,
             serial_number = excluded.serial_number,
             product_name = excluded.product_name,
             production_line = excluded.production_line,
             process_steps_json = excluded.process_steps_json,
             work_signature_at = excluded.work_signature_at,
             approval_status = excluded.approval_status,
             status = excluded.status,
             updated_at = now()`,
      [
        input.documentId,
        normalizeText(input.dataJson.batch_id),
        normalizeText(input.dataJson.serial_number),
        normalizeText(input.dataJson.product_name),
        normalizeText(input.dataJson.production_line),
        JSON.stringify(normalizeJsonValue(input.dataJson.process_steps)),
        normalizeTimestamp(input.dataJson.work_signature_at),
        approvalStatus,
        input.status,
      ],
    );

    return;
  }

  if (input.formType === "qualification_record") {
    const evaluation = evaluateQualificationDocumentData(input.dataJson);

    await client.query(
      `insert into qualification_records (
         document_id,
         qualification_record_number,
         qualification_title,
         owner_user_id,
         valid_until,
         qualification_result,
         qualification_topics_json,
         evaluation_status,
         score_value,
         passed,
         evaluated_at,
         approval_status,
         status
       )
       values ($1, $2, $3, $4::uuid, $5, $6, $7::jsonb, $8, $9, $10, $11::timestamptz, $12, $13)
       on conflict (document_id) do update
         set qualification_record_number = excluded.qualification_record_number,
             qualification_title = excluded.qualification_title,
             owner_user_id = excluded.owner_user_id,
             valid_until = excluded.valid_until,
             qualification_result = excluded.qualification_result,
             qualification_topics_json = excluded.qualification_topics_json,
             evaluation_status = excluded.evaluation_status,
             score_value = excluded.score_value,
             passed = excluded.passed,
             evaluated_at = excluded.evaluated_at,
             approval_status = excluded.approval_status,
             status = excluded.status,
             updated_at = now()`,
      [
        input.documentId,
        normalizeText(input.dataJson.qualification_record_number),
        normalizeText(input.dataJson.qualification_title),
        normalizeText(input.dataJson.owner_user_id),
        normalizeText(input.dataJson.valid_until),
        readQualificationResult(input.dataJson),
        JSON.stringify(readQualificationTopics(input.dataJson)),
        evaluation.evaluationStatus,
        evaluation.scoreValue,
        evaluation.passed,
        evaluation.evaluatedAt,
        approvalStatus,
        input.status,
      ],
    );

    return;
  }

  await client.query(
    `insert into generic_form_records (
       document_id,
       form_title,
       description,
       note,
       approval_status,
       status,
       payload_json
     )
     values ($1, $2, $3, $4, $5, $6, $7::jsonb)
     on conflict (document_id) do update
       set form_title = excluded.form_title,
           description = excluded.description,
           note = excluded.note,
           approval_status = excluded.approval_status,
           status = excluded.status,
           payload_json = excluded.payload_json,
           updated_at = now()`,
    [
      input.documentId,
      normalizeText(input.dataJson.generic_form_title) ?? input.templateName,
      normalizeText(input.dataJson.generic_form_description),
      normalizeText(input.dataJson.generic_form_note),
      approvalStatus,
      input.status,
      JSON.stringify(normalizePayload(input.dataJson)),
    ],
  );
};
