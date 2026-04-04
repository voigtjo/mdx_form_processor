import { withDb } from "../../db/pool.js";

export type CustomerOrderRecord = {
  documentId: string;
  orderNumber?: string;
  customerName?: string;
  serviceLocation?: string;
  material?: string;
  laborHours?: string;
  travelHours?: string;
  breakMinutes?: string;
  workDescriptionHtml?: string;
  workSignatureAt?: string;
  approvalStatus?: string;
  status?: string;
  serviceDate?: string;
  technician?: string;
};

export type ProductionRecord = {
  documentId: string;
  batchId?: string;
  serialNumber?: string;
  productName?: string;
  productionLine?: string;
  processStepsJson?: unknown;
  workSignatureAt?: string;
  approvalStatus?: string;
  status?: string;
};

export type QualificationRecord = {
  documentId: string;
  qualificationRecordNumber?: string;
  qualificationTitle?: string;
  ownerUserId?: string;
  validUntil?: string;
  qualificationResult?: string;
  qualificationTopicsJson?: unknown;
  evaluationStatus?: string;
  scoreValue?: number;
  passed?: boolean;
  evaluatedAt?: string;
  approvalStatus?: string;
  status?: string;
};

export type GenericFormRecord = {
  documentId: string;
  formTitle?: string;
  description?: string;
  note?: string;
  approvalStatus?: string;
  status?: string;
  payloadJson: Record<string, unknown>;
};

export type TypedRecordSummary = {
  tableName: "customer_orders" | "production_records" | "qualification_records" | "generic_form_records";
  isPresent: boolean;
  record: CustomerOrderRecord | ProductionRecord | QualificationRecord | GenericFormRecord | null;
};

const mapCustomerOrderRecord = (row: {
  document_id: string;
  order_number: string | null;
  customer_name: string | null;
  service_location: string | null;
  material: string | null;
  labor_hours: string | null;
  travel_hours: string | null;
  break_minutes: string | null;
  work_description_html: string | null;
  work_signature_at: Date | null;
  approval_status: string | null;
  status: string | null;
  service_date: string | null;
  technician: string | null;
}): CustomerOrderRecord => ({
  documentId: row.document_id,
  ...(row.order_number ? { orderNumber: row.order_number } : {}),
  ...(row.customer_name ? { customerName: row.customer_name } : {}),
  ...(row.service_location ? { serviceLocation: row.service_location } : {}),
  ...(row.material ? { material: row.material } : {}),
  ...(row.labor_hours ? { laborHours: row.labor_hours } : {}),
  ...(row.travel_hours ? { travelHours: row.travel_hours } : {}),
  ...(row.break_minutes ? { breakMinutes: row.break_minutes } : {}),
  ...(row.work_description_html ? { workDescriptionHtml: row.work_description_html } : {}),
  ...(row.work_signature_at ? { workSignatureAt: row.work_signature_at.toISOString() } : {}),
  ...(row.approval_status ? { approvalStatus: row.approval_status } : {}),
  ...(row.status ? { status: row.status } : {}),
  ...(row.service_date ? { serviceDate: row.service_date } : {}),
  ...(row.technician ? { technician: row.technician } : {}),
});

const mapProductionRecord = (row: {
  document_id: string;
  batch_id: string | null;
  serial_number: string | null;
  product_name: string | null;
  production_line: string | null;
  process_steps_json: unknown;
  work_signature_at: Date | null;
  approval_status: string | null;
  status: string | null;
}): ProductionRecord => ({
  documentId: row.document_id,
  ...(row.batch_id ? { batchId: row.batch_id } : {}),
  ...(row.serial_number ? { serialNumber: row.serial_number } : {}),
  ...(row.product_name ? { productName: row.product_name } : {}),
  ...(row.production_line ? { productionLine: row.production_line } : {}),
  ...(row.process_steps_json !== null && row.process_steps_json !== undefined ? { processStepsJson: row.process_steps_json } : {}),
  ...(row.work_signature_at ? { workSignatureAt: row.work_signature_at.toISOString() } : {}),
  ...(row.approval_status ? { approvalStatus: row.approval_status } : {}),
  ...(row.status ? { status: row.status } : {}),
});

const mapQualificationRecord = (row: {
  document_id: string;
  qualification_record_number: string | null;
  qualification_title: string | null;
  owner_user_id: string | null;
  valid_until: string | null;
  qualification_result: string | null;
  qualification_topics_json: unknown;
  evaluation_status: string | null;
  score_value: number | null;
  passed: boolean | null;
  evaluated_at: Date | null;
  approval_status: string | null;
  status: string | null;
}): QualificationRecord => ({
  documentId: row.document_id,
  ...(row.qualification_record_number ? { qualificationRecordNumber: row.qualification_record_number } : {}),
  ...(row.qualification_title ? { qualificationTitle: row.qualification_title } : {}),
  ...(row.owner_user_id ? { ownerUserId: row.owner_user_id } : {}),
  ...(row.valid_until ? { validUntil: row.valid_until } : {}),
  ...(row.qualification_result ? { qualificationResult: row.qualification_result } : {}),
  ...(row.qualification_topics_json !== null && row.qualification_topics_json !== undefined ? { qualificationTopicsJson: row.qualification_topics_json } : {}),
  ...(row.evaluation_status ? { evaluationStatus: row.evaluation_status } : {}),
  ...(typeof row.score_value === "number" ? { scoreValue: row.score_value } : {}),
  ...(typeof row.passed === "boolean" ? { passed: row.passed } : {}),
  ...(row.evaluated_at ? { evaluatedAt: row.evaluated_at.toISOString() } : {}),
  ...(row.approval_status ? { approvalStatus: row.approval_status } : {}),
  ...(row.status ? { status: row.status } : {}),
});

const mapGenericFormRecord = (row: {
  document_id: string;
  form_title: string | null;
  description: string | null;
  note: string | null;
  approval_status: string | null;
  status: string | null;
  payload_json: Record<string, unknown> | null;
}): GenericFormRecord => ({
  documentId: row.document_id,
  ...(row.form_title ? { formTitle: row.form_title } : {}),
  ...(row.description ? { description: row.description } : {}),
  ...(row.note ? { note: row.note } : {}),
  ...(row.approval_status ? { approvalStatus: row.approval_status } : {}),
  ...(row.status ? { status: row.status } : {}),
  payloadJson: row.payload_json ?? {},
});

export const findCustomerOrderRecord = async (documentId: string): Promise<CustomerOrderRecord | null> => {
  return withDb(async (client) => {
    const result = await client.query<{
      document_id: string;
      order_number: string | null;
      customer_name: string | null;
      service_location: string | null;
      material: string | null;
      labor_hours: string | null;
      travel_hours: string | null;
      break_minutes: string | null;
      work_description_html: string | null;
      work_signature_at: Date | null;
      approval_status: string | null;
      status: string | null;
      service_date: string | null;
      technician: string | null;
    }>(
      `select document_id, order_number, customer_name, service_location, material, labor_hours, travel_hours, break_minutes, work_description_html, work_signature_at, approval_status, status, service_date, technician
       from customer_orders
       where document_id = $1
       limit 1`,
      [documentId],
    );
    const row = result.rows[0];
    return row ? mapCustomerOrderRecord(row) : null;
  });
};

export const listCustomerOrderRecordsVisibleToUser = async (userId: string): Promise<CustomerOrderRecord[]> => {
  return withDb(async (client) => {
    const result = await client.query<{
      document_id: string;
      order_number: string | null;
      customer_name: string | null;
      service_location: string | null;
      material: string | null;
      labor_hours: string | null;
      travel_hours: string | null;
      break_minutes: string | null;
      work_description_html: string | null;
      work_signature_at: Date | null;
      approval_status: string | null;
      status: string | null;
      service_date: string | null;
      technician: string | null;
    }>(
      `select distinct co.document_id, co.order_number, co.customer_name, co.service_location, co.material, co.labor_hours, co.travel_hours, co.break_minutes, co.work_description_html, co.work_signature_at, co.approval_status, co.status, co.service_date, co.technician
       from customer_orders co
       inner join documents d on d.id = co.document_id
       inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
       inner join memberships m on m.group_id = ta.group_id and m.user_id = $1 and position('r' in m.rights) > 0
       order by co.document_id`,
      [userId],
    );

    return result.rows.map(mapCustomerOrderRecord);
  });
};

export const findProductionRecord = async (documentId: string): Promise<ProductionRecord | null> => {
  return withDb(async (client) => {
    const result = await client.query<{
      document_id: string;
      batch_id: string | null;
      serial_number: string | null;
      product_name: string | null;
      production_line: string | null;
      process_steps_json: unknown;
      work_signature_at: Date | null;
      approval_status: string | null;
      status: string | null;
    }>(
      `select document_id, batch_id, serial_number, product_name, production_line, process_steps_json, work_signature_at, approval_status, status
       from production_records
       where document_id = $1
       limit 1`,
      [documentId],
    );
    const row = result.rows[0];
    return row ? mapProductionRecord(row) : null;
  });
};

export const listProductionRecordsVisibleToUser = async (userId: string): Promise<ProductionRecord[]> => {
  return withDb(async (client) => {
    const result = await client.query<{
      document_id: string;
      batch_id: string | null;
      serial_number: string | null;
      product_name: string | null;
      production_line: string | null;
      process_steps_json: unknown;
      work_signature_at: Date | null;
      approval_status: string | null;
      status: string | null;
    }>(
      `select distinct pr.document_id, pr.batch_id, pr.serial_number, pr.product_name, pr.production_line, pr.process_steps_json, pr.work_signature_at, pr.approval_status, pr.status
       from production_records pr
       inner join documents d on d.id = pr.document_id
       inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
       inner join memberships m on m.group_id = ta.group_id and m.user_id = $1 and position('r' in m.rights) > 0
       order by pr.document_id`,
      [userId],
    );

    return result.rows.map(mapProductionRecord);
  });
};

export const findQualificationRecord = async (documentId: string): Promise<QualificationRecord | null> => {
  return withDb(async (client) => {
    const result = await client.query<{
      document_id: string;
      qualification_record_number: string | null;
      qualification_title: string | null;
      owner_user_id: string | null;
      valid_until: string | null;
      qualification_result: string | null;
      qualification_topics_json: unknown;
      evaluation_status: string | null;
      score_value: number | null;
      passed: boolean | null;
      evaluated_at: Date | null;
      approval_status: string | null;
      status: string | null;
    }>(
      `select document_id, qualification_record_number, qualification_title, owner_user_id, valid_until, qualification_result, qualification_topics_json, evaluation_status, score_value, passed, evaluated_at, approval_status, status
       from qualification_records
       where document_id = $1
       limit 1`,
      [documentId],
    );
    const row = result.rows[0];
    return row ? mapQualificationRecord(row) : null;
  });
};

export const listQualificationRecordsVisibleToUser = async (userId: string): Promise<QualificationRecord[]> => {
  return withDb(async (client) => {
    const result = await client.query<{
      document_id: string;
      qualification_record_number: string | null;
      qualification_title: string | null;
      owner_user_id: string | null;
      valid_until: string | null;
      qualification_result: string | null;
      qualification_topics_json: unknown;
      evaluation_status: string | null;
      score_value: number | null;
      passed: boolean | null;
      evaluated_at: Date | null;
      approval_status: string | null;
      status: string | null;
    }>(
      `select distinct qr.document_id, qr.qualification_record_number, qr.qualification_title, qr.owner_user_id, qr.valid_until, qr.qualification_result, qr.qualification_topics_json, qr.evaluation_status, qr.score_value, qr.passed, qr.evaluated_at, qr.approval_status, qr.status
       from qualification_records qr
       inner join documents d on d.id = qr.document_id
       inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
       inner join memberships m on m.group_id = ta.group_id and m.user_id = $1 and position('r' in m.rights) > 0
       order by qr.document_id`,
      [userId],
    );

    return result.rows.map(mapQualificationRecord);
  });
};

export const findGenericFormRecord = async (documentId: string): Promise<GenericFormRecord | null> => {
  return withDb(async (client) => {
    const result = await client.query<{
      document_id: string;
      form_title: string | null;
      description: string | null;
      note: string | null;
      approval_status: string | null;
      status: string | null;
      payload_json: Record<string, unknown> | null;
    }>(
      `select document_id, form_title, description, note, approval_status, status, payload_json
       from generic_form_records
       where document_id = $1
       limit 1`,
      [documentId],
    );
    const row = result.rows[0];
    return row ? mapGenericFormRecord(row) : null;
  });
};

export const listGenericFormRecordsVisibleToUser = async (userId: string): Promise<GenericFormRecord[]> => {
  return withDb(async (client) => {
    const result = await client.query<{
      document_id: string;
      form_title: string | null;
      description: string | null;
      note: string | null;
      approval_status: string | null;
      status: string | null;
      payload_json: Record<string, unknown> | null;
    }>(
      `select distinct gr.document_id, gr.form_title, gr.description, gr.note, gr.approval_status, gr.status, gr.payload_json
       from generic_form_records gr
       inner join documents d on d.id = gr.document_id
       inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
       inner join memberships m on m.group_id = ta.group_id and m.user_id = $1 and position('r' in m.rights) > 0
       order by gr.document_id`,
      [userId],
    );

    return result.rows.map(mapGenericFormRecord);
  });
};

export const findTypedRecordSummary = async (
  documentId: string,
  formType: "customer_order" | "production_record" | "qualification_record" | "generic_form",
): Promise<TypedRecordSummary> => {
  if (formType === "customer_order") {
    const record = await findCustomerOrderRecord(documentId);
    return {
      tableName: "customer_orders",
      isPresent: record !== null,
      record,
    };
  }

  if (formType === "production_record") {
    const record = await findProductionRecord(documentId);
    return {
      tableName: "production_records",
      isPresent: record !== null,
      record,
    };
  }

  if (formType === "qualification_record") {
    const record = await findQualificationRecord(documentId);
    return {
      tableName: "qualification_records",
      isPresent: record !== null,
      record,
    };
  }

  const record = await findGenericFormRecord(documentId);
  return {
    tableName: "generic_form_records",
    isPresent: record !== null,
    record,
  };
};
