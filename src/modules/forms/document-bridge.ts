import type { FormRuntimeFieldValues } from "./types.js";
import { parseFormRuntimeGridColumns, parseFormRuntimeGridRows, serializeFormRuntimeGridRows } from "./grid.js";
import { sanitizeRichTextHtml } from "./rich-text.js";
import {
  getQualificationCurrentUserState,
  writeQualificationParticipantState,
} from "../qualification/progress.js";

const normalizeText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
};

const supportedFormRuntimeTemplateKeys = new Set([
  "customer-order-test",
  "service-report",
  "production-batch",
  "qualification-record",
  "generic-form",
]);

const hasOwnFieldValue = (fieldValues: FormRuntimeFieldValues, fieldName: string): boolean =>
  Object.prototype.hasOwnProperty.call(fieldValues, fieldName);

const productionProcessGridColumns = parseFormRuntimeGridColumns({
  columnsText: "step:Arbeitsschritt|station:Station|target_qty:Sollmenge|actual_qty:Istmenge|result:Ergebnis",
  numberColumnsText: "target_qty,actual_qty",
});

export const isFormRuntimeReferenceTemplate = (templateKey: string): boolean => supportedFormRuntimeTemplateKeys.has(templateKey);

const mapCustomerOrderDocumentDataToFormRuntimeValues = (data: Record<string, unknown>): FormRuntimeFieldValues => {
  return {
    order_number: normalizeText(data.customer_order_number),
    service_date: normalizeText(data.service_date),
    technician: normalizeText(data.technician),
    customer: normalizeText(data.customer_name),
    service_location: normalizeText(data.service_location),
    customer_master_id: normalizeText(data.customer_master_id),
    customer_master_status: normalizeText(data.customer_master_status),
    customer_order_status: normalizeText(data.customer_order_status),
    customer_order_created_at: normalizeText(data.customer_order_created_at),
    work_description: sanitizeRichTextHtml(normalizeText(data.work_description)),
    material: normalizeText(data.material),
    product_master_id: normalizeText(data.product_master_id),
    product_master_type: normalizeText(data.product_master_type),
    product_master_status: normalizeText(data.product_master_status),
    work_signature: normalizeText(data.work_signature),
    work_signature_at: normalizeText(data.work_signature_at),
    labor_hours: normalizeText(data.labor_hours),
    travel_hours: normalizeText(data.travel_hours),
    break_minutes: normalizeText(data.break_minutes),
    customer_information_flags: normalizeStringArray(data.customer_information_flags).join(","),
    service_result_status: normalizeText(data.service_result_status),
    follow_up_date: normalizeText(data.follow_up_date),
    service_order_options_json: normalizeText(data.service_order_options_json),
    approval_status: normalizeText(data.approval_status),
  };
};

const mapQualificationDocumentDataToFormRuntimeValues = (data: Record<string, unknown>): FormRuntimeFieldValues => {
  const currentUserState = getQualificationCurrentUserState(data, normalizeText(data.__current_user_id));
  const currentUserFieldValues = currentUserState.fieldValues ?? {};

  return {
    qualification_record_number: normalizeText(data.qualification_record_number),
    qualification_title: normalizeText(data.qualification_title),
    owner_user_id: normalizeText(data.owner_user_id),
    attendee_user_ids: normalizeStringArray(data.attendee_user_ids).join(","),
    valid_until: normalizeText(data.valid_until),
    qualification_result: normalizeText(currentUserFieldValues.qualification_result),
    qualification_topics: normalizeStringArray(currentUserFieldValues.qualification_topics).join(","),
    approval_status: normalizeText(data.approval_status),
    work_signature: currentUserState.signature ?? "",
    work_signature_at: currentUserState.signatureAt ?? "",
    qualification_current_page: typeof currentUserState.currentPage === "number" ? String(currentUserState.currentPage) : "1",
  };
};

const mapGenericFormDocumentDataToFormRuntimeValues = (data: Record<string, unknown>): FormRuntimeFieldValues => {
  return {
    generic_form_title: normalizeText(data.generic_form_title),
    generic_form_description: normalizeText(data.generic_form_description),
    generic_form_note: sanitizeRichTextHtml(normalizeText(data.generic_form_note)),
    approval_status: normalizeText(data.approval_status),
    work_signature: normalizeText(data.work_signature),
    work_signature_at: normalizeText(data.work_signature_at),
  };
};

const mapProductionBatchDocumentDataToFormRuntimeValues = (data: Record<string, unknown>): FormRuntimeFieldValues => {
  return {
    batch_id: normalizeText(data.batch_id),
    serial_number: normalizeText(data.serial_number),
    product_name: normalizeText(data.product_name),
    production_line: normalizeText(data.production_line),
    process_steps: serializeFormRuntimeGridRows({
      rows: parseFormRuntimeGridRows({
        value: data.process_steps,
        columns: productionProcessGridColumns,
      }),
      columns: productionProcessGridColumns,
    }),
    approval_status: normalizeText(data.approval_status),
    work_signature: normalizeText(data.work_signature),
    work_signature_at: normalizeText(data.work_signature_at),
  };
};

export const mapDocumentDataToFormRuntimeValues = (
  templateKey: string,
  data: Record<string, unknown>,
  options?: {
    currentUserId?: string;
  },
): FormRuntimeFieldValues => {
  const dataForRead = options?.currentUserId
    ? {
        ...data,
        __current_user_id: options.currentUserId,
      }
    : data;

  if (templateKey === "customer-order-test") {
    return mapCustomerOrderDocumentDataToFormRuntimeValues(dataForRead);
  }

  if (templateKey === "service-report") {
    return mapCustomerOrderDocumentDataToFormRuntimeValues(dataForRead);
  }

  if (templateKey === "qualification-record") {
    return mapQualificationDocumentDataToFormRuntimeValues(dataForRead);
  }

  if (templateKey === "production-batch") {
    return mapProductionBatchDocumentDataToFormRuntimeValues(dataForRead);
  }

  if (templateKey === "generic-form") {
    return mapGenericFormDocumentDataToFormRuntimeValues(dataForRead);
  }

  return {};
};

const mergeCustomerOrderFormRuntimeValues = (
  existingData: Record<string, unknown>,
  fieldValues: FormRuntimeFieldValues,
): Record<string, unknown> => {
  return {
    ...existingData,
    customer_order_number: hasOwnFieldValue(fieldValues, "order_number") ? normalizeText(fieldValues.order_number) : existingData.customer_order_number,
    service_date: hasOwnFieldValue(fieldValues, "service_date") ? normalizeText(fieldValues.service_date) : existingData.service_date,
    technician: hasOwnFieldValue(fieldValues, "technician") ? normalizeText(fieldValues.technician) : existingData.technician,
    customer_name: hasOwnFieldValue(fieldValues, "customer") ? normalizeText(fieldValues.customer) : existingData.customer_name,
    service_location: hasOwnFieldValue(fieldValues, "service_location") ? normalizeText(fieldValues.service_location) : existingData.service_location,
    customer_master_id: hasOwnFieldValue(fieldValues, "customer_master_id") ? normalizeText(fieldValues.customer_master_id) : existingData.customer_master_id,
    customer_master_status: hasOwnFieldValue(fieldValues, "customer_master_status") ? normalizeText(fieldValues.customer_master_status) : existingData.customer_master_status,
    customer_order_status: hasOwnFieldValue(fieldValues, "customer_order_status") ? normalizeText(fieldValues.customer_order_status) : existingData.customer_order_status,
    customer_order_created_at: hasOwnFieldValue(fieldValues, "customer_order_created_at") ? normalizeText(fieldValues.customer_order_created_at) : existingData.customer_order_created_at,
    work_description: hasOwnFieldValue(fieldValues, "work_description") ? sanitizeRichTextHtml(fieldValues.work_description) : existingData.work_description,
    material: hasOwnFieldValue(fieldValues, "material") ? normalizeText(fieldValues.material) : existingData.material,
    product_master_id: hasOwnFieldValue(fieldValues, "product_master_id") ? normalizeText(fieldValues.product_master_id) : existingData.product_master_id,
    product_master_type: hasOwnFieldValue(fieldValues, "product_master_type") ? normalizeText(fieldValues.product_master_type) : existingData.product_master_type,
    product_master_status: hasOwnFieldValue(fieldValues, "product_master_status") ? normalizeText(fieldValues.product_master_status) : existingData.product_master_status,
    work_signature: hasOwnFieldValue(fieldValues, "work_signature") ? normalizeText(fieldValues.work_signature) : existingData.work_signature,
    work_signature_at: hasOwnFieldValue(fieldValues, "work_signature_at") ? normalizeText(fieldValues.work_signature_at) : existingData.work_signature_at,
    labor_hours: hasOwnFieldValue(fieldValues, "labor_hours") ? normalizeText(fieldValues.labor_hours) : existingData.labor_hours,
    travel_hours: hasOwnFieldValue(fieldValues, "travel_hours") ? normalizeText(fieldValues.travel_hours) : existingData.travel_hours,
    break_minutes: hasOwnFieldValue(fieldValues, "break_minutes") ? normalizeText(fieldValues.break_minutes) : existingData.break_minutes,
    customer_information_flags: hasOwnFieldValue(fieldValues, "customer_information_flags")
      ? normalizeStringArray(fieldValues.customer_information_flags)
      : existingData.customer_information_flags,
    service_result_status: hasOwnFieldValue(fieldValues, "service_result_status")
      ? normalizeText(fieldValues.service_result_status)
      : existingData.service_result_status,
    follow_up_date: hasOwnFieldValue(fieldValues, "follow_up_date")
      ? normalizeText(fieldValues.follow_up_date)
      : existingData.follow_up_date,
    service_order_options_json: hasOwnFieldValue(fieldValues, "service_order_options_json")
      ? normalizeText(fieldValues.service_order_options_json)
      : existingData.service_order_options_json,
    approval_status: hasOwnFieldValue(fieldValues, "approval_status") ? normalizeText(fieldValues.approval_status) : existingData.approval_status,
  };
};

const mergeQualificationFormRuntimeValues = (
  existingData: Record<string, unknown>,
  fieldValues: FormRuntimeFieldValues,
  currentUserId?: string,
): Record<string, unknown> => {
  const sharedData = {
    ...existingData,
    qualification_record_number:
      hasOwnFieldValue(fieldValues, "qualification_record_number")
        ? normalizeText(fieldValues.qualification_record_number)
        : existingData.qualification_record_number,
    qualification_title:
      hasOwnFieldValue(fieldValues, "qualification_title")
        ? normalizeText(fieldValues.qualification_title)
        : existingData.qualification_title,
    owner_user_id:
      hasOwnFieldValue(fieldValues, "owner_user_id")
        ? normalizeText(fieldValues.owner_user_id)
        : existingData.owner_user_id,
    attendee_user_ids:
      hasOwnFieldValue(fieldValues, "attendee_user_ids")
        ? normalizeStringArray(fieldValues.attendee_user_ids)
        : existingData.attendee_user_ids,
    valid_until:
      hasOwnFieldValue(fieldValues, "valid_until")
        ? normalizeText(fieldValues.valid_until)
        : existingData.valid_until,
    approval_status:
      hasOwnFieldValue(fieldValues, "approval_status")
        ? normalizeText(fieldValues.approval_status)
        : existingData.approval_status,
  };

  if (!currentUserId) {
    return sharedData;
  }

  return writeQualificationParticipantState({
    data: sharedData,
    userId: currentUserId,
    patch: {
      fieldValues: {
        ...(getQualificationCurrentUserState(sharedData, currentUserId).fieldValues ?? {}),
        ...(hasOwnFieldValue(fieldValues, "qualification_result")
          ? { qualification_result: normalizeText(fieldValues.qualification_result) }
          : {}),
        ...(hasOwnFieldValue(fieldValues, "qualification_topics")
          ? { qualification_topics: normalizeStringArray(fieldValues.qualification_topics) }
          : {}),
      },
      ...(hasOwnFieldValue(fieldValues, "work_signature") ? { signature: normalizeText(fieldValues.work_signature) } : {}),
      ...(hasOwnFieldValue(fieldValues, "work_signature_at") ? { signatureAt: normalizeText(fieldValues.work_signature_at) } : {}),
    },
  });
};

const mergeProductionBatchFormRuntimeValues = (
  existingData: Record<string, unknown>,
  fieldValues: FormRuntimeFieldValues,
): Record<string, unknown> => {
  return {
    ...existingData,
    batch_id: hasOwnFieldValue(fieldValues, "batch_id") ? normalizeText(fieldValues.batch_id) : existingData.batch_id,
    serial_number: hasOwnFieldValue(fieldValues, "serial_number") ? normalizeText(fieldValues.serial_number) : existingData.serial_number,
    product_name: hasOwnFieldValue(fieldValues, "product_name") ? normalizeText(fieldValues.product_name) : existingData.product_name,
    production_line: hasOwnFieldValue(fieldValues, "production_line") ? normalizeText(fieldValues.production_line) : existingData.production_line,
    process_steps: hasOwnFieldValue(fieldValues, "process_steps")
      ? parseFormRuntimeGridRows({
          value: fieldValues.process_steps,
          columns: productionProcessGridColumns,
        })
      : existingData.process_steps,
    approval_status: hasOwnFieldValue(fieldValues, "approval_status") ? normalizeText(fieldValues.approval_status) : existingData.approval_status,
    work_signature: hasOwnFieldValue(fieldValues, "work_signature") ? normalizeText(fieldValues.work_signature) : existingData.work_signature,
    work_signature_at: hasOwnFieldValue(fieldValues, "work_signature_at") ? normalizeText(fieldValues.work_signature_at) : existingData.work_signature_at,
  };
};

const mergeGenericFormRuntimeValues = (
  existingData: Record<string, unknown>,
  fieldValues: FormRuntimeFieldValues,
): Record<string, unknown> => {
  return {
    ...existingData,
    generic_form_title: hasOwnFieldValue(fieldValues, "generic_form_title")
      ? normalizeText(fieldValues.generic_form_title)
      : existingData.generic_form_title,
    generic_form_description: hasOwnFieldValue(fieldValues, "generic_form_description")
      ? normalizeText(fieldValues.generic_form_description)
      : existingData.generic_form_description,
    generic_form_note: hasOwnFieldValue(fieldValues, "generic_form_note")
      ? sanitizeRichTextHtml(fieldValues.generic_form_note)
      : existingData.generic_form_note,
    approval_status: hasOwnFieldValue(fieldValues, "approval_status")
      ? normalizeText(fieldValues.approval_status)
      : existingData.approval_status,
    work_signature: hasOwnFieldValue(fieldValues, "work_signature")
      ? normalizeText(fieldValues.work_signature)
      : existingData.work_signature,
    work_signature_at: hasOwnFieldValue(fieldValues, "work_signature_at")
      ? normalizeText(fieldValues.work_signature_at)
      : existingData.work_signature_at,
  };
};

export const mergeFormRuntimeValuesIntoDocumentData = (
  templateKey: string,
  existingData: Record<string, unknown>,
  fieldValues: FormRuntimeFieldValues,
  options?: {
    currentUserId?: string;
  },
): Record<string, unknown> => {
  if (templateKey === "customer-order-test") {
    return mergeCustomerOrderFormRuntimeValues(existingData, fieldValues);
  }

  if (templateKey === "service-report") {
    return mergeCustomerOrderFormRuntimeValues(existingData, fieldValues);
  }

  if (templateKey === "qualification-record") {
    return mergeQualificationFormRuntimeValues(existingData, fieldValues, options?.currentUserId);
  }

  if (templateKey === "production-batch") {
    return mergeProductionBatchFormRuntimeValues(existingData, fieldValues);
  }

  if (templateKey === "generic-form") {
    return mergeGenericFormRuntimeValues(existingData, fieldValues);
  }

  return existingData;
};
