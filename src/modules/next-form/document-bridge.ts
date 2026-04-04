import type { NextFormFieldValues } from "./load-customer.js";
import { parseNextFormGridColumns, parseNextFormGridRows, serializeNextFormGridRows } from "./grid.js";
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

const supportedNextFormTemplateKeys = new Set([
  "customer-order-test",
  "production-batch",
  "qualification-record",
]);

const productionProcessGridColumns = parseNextFormGridColumns({
  columnsText: "step:Arbeitsschritt|station:Station|target_qty:Sollmenge|actual_qty:Istmenge|result:Ergebnis",
  numberColumnsText: "target_qty,actual_qty",
});

export const isNextFormReferenceTemplate = (templateKey: string): boolean => supportedNextFormTemplateKeys.has(templateKey);

const mapCustomerOrderDocumentDataToNextFormValues = (data: Record<string, unknown>): NextFormFieldValues => {
  return {
    order_number: normalizeText(data.customer_order_number),
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
    approval_status: normalizeText(data.approval_status),
  };
};

const mapQualificationDocumentDataToNextFormValues = (data: Record<string, unknown>): NextFormFieldValues => {
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
  };
};

const mapProductionBatchDocumentDataToNextFormValues = (data: Record<string, unknown>): NextFormFieldValues => {
  return {
    batch_id: normalizeText(data.batch_id),
    serial_number: normalizeText(data.serial_number),
    product_name: normalizeText(data.product_name),
    production_line: normalizeText(data.production_line),
    process_steps: serializeNextFormGridRows({
      rows: parseNextFormGridRows({
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

export const mapDocumentDataToNextFormValues = (
  templateKey: string,
  data: Record<string, unknown>,
  options?: {
    currentUserId?: string;
  },
): NextFormFieldValues => {
  const dataForRead = options?.currentUserId
    ? {
        ...data,
        __current_user_id: options.currentUserId,
      }
    : data;

  if (templateKey === "customer-order-test") {
    return mapCustomerOrderDocumentDataToNextFormValues(dataForRead);
  }

  if (templateKey === "qualification-record") {
    return mapQualificationDocumentDataToNextFormValues(dataForRead);
  }

  if (templateKey === "production-batch") {
    return mapProductionBatchDocumentDataToNextFormValues(dataForRead);
  }

  return {};
};

const mergeCustomerOrderNextFormValues = (
  existingData: Record<string, unknown>,
  fieldValues: NextFormFieldValues,
): Record<string, unknown> => {
  return {
    ...existingData,
    customer_order_number: normalizeText(fieldValues.order_number),
    customer_name: normalizeText(fieldValues.customer),
    service_location: normalizeText(fieldValues.service_location),
    customer_master_id: normalizeText(fieldValues.customer_master_id),
    customer_master_status: normalizeText(fieldValues.customer_master_status),
    customer_order_status: normalizeText(fieldValues.customer_order_status),
    customer_order_created_at: normalizeText(fieldValues.customer_order_created_at),
    work_description: sanitizeRichTextHtml(fieldValues.work_description),
    material: normalizeText(fieldValues.material),
    product_master_id: normalizeText(fieldValues.product_master_id),
    product_master_type: normalizeText(fieldValues.product_master_type),
    product_master_status: normalizeText(fieldValues.product_master_status),
    work_signature: normalizeText(fieldValues.work_signature),
    work_signature_at: normalizeText(fieldValues.work_signature_at),
    labor_hours: normalizeText(fieldValues.labor_hours),
    travel_hours: normalizeText(fieldValues.travel_hours),
    break_minutes: normalizeText(fieldValues.break_minutes),
    approval_status: normalizeText(fieldValues.approval_status),
  };
};

const mergeQualificationNextFormValues = (
  existingData: Record<string, unknown>,
  fieldValues: NextFormFieldValues,
  currentUserId?: string,
): Record<string, unknown> => {
  const sharedData = {
    ...existingData,
    qualification_record_number: normalizeText(fieldValues.qualification_record_number),
    qualification_title: normalizeText(fieldValues.qualification_title),
    owner_user_id: normalizeText(fieldValues.owner_user_id),
    attendee_user_ids: normalizeStringArray(fieldValues.attendee_user_ids),
    valid_until: normalizeText(fieldValues.valid_until),
    approval_status: normalizeText(fieldValues.approval_status),
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
        qualification_result: normalizeText(fieldValues.qualification_result),
        qualification_topics: normalizeStringArray(fieldValues.qualification_topics),
      },
      signature: normalizeText(fieldValues.work_signature),
      signatureAt: normalizeText(fieldValues.work_signature_at),
    },
  });
};

const mergeProductionBatchNextFormValues = (
  existingData: Record<string, unknown>,
  fieldValues: NextFormFieldValues,
): Record<string, unknown> => {
  return {
    ...existingData,
    batch_id: normalizeText(fieldValues.batch_id),
    serial_number: normalizeText(fieldValues.serial_number),
    product_name: normalizeText(fieldValues.product_name),
    production_line: normalizeText(fieldValues.production_line),
    process_steps: parseNextFormGridRows({
      value: fieldValues.process_steps,
      columns: productionProcessGridColumns,
    }),
    approval_status: normalizeText(fieldValues.approval_status),
    work_signature: normalizeText(fieldValues.work_signature),
    work_signature_at: normalizeText(fieldValues.work_signature_at),
  };
};

export const mergeNextFormValuesIntoDocumentData = (
  templateKey: string,
  existingData: Record<string, unknown>,
  fieldValues: NextFormFieldValues,
  options?: {
    currentUserId?: string;
  },
): Record<string, unknown> => {
  if (templateKey === "customer-order-test") {
    return mergeCustomerOrderNextFormValues(existingData, fieldValues);
  }

  if (templateKey === "qualification-record") {
    return mergeQualificationNextFormValues(existingData, fieldValues, options?.currentUserId);
  }

  if (templateKey === "production-batch") {
    return mergeProductionBatchNextFormValues(existingData, fieldValues);
  }

  return existingData;
};
