import type { NextFormFieldValues } from "./load-customer.js";

const normalizeText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

export const isNextFormReferenceTemplate = (templateKey: string): boolean => templateKey === "customer-order-test";

export const mapDocumentDataToNextFormValues = (
  templateKey: string,
  data: Record<string, unknown>,
): NextFormFieldValues => {
  if (!isNextFormReferenceTemplate(templateKey)) {
    return {};
  }

  return {
    order_number: normalizeText(data.customer_order_number),
    customer: normalizeText(data.customer_name),
    service_location: normalizeText(data.service_location),
    customer_master_id: normalizeText(data.customer_master_id),
    customer_master_status: normalizeText(data.customer_master_status),
    customer_order_status: normalizeText(data.customer_order_status),
    customer_order_created_at: normalizeText(data.customer_order_created_at),
    work_description: normalizeText(data.work_description),
    material: normalizeText(data.material),
    product_master_id: normalizeText(data.product_master_id),
    product_master_type: normalizeText(data.product_master_type),
    product_master_status: normalizeText(data.product_master_status),
    labor_hours: normalizeText(data.labor_hours),
    travel_hours: normalizeText(data.travel_hours),
    break_minutes: normalizeText(data.break_minutes),
  };
};

export const mergeNextFormValuesIntoDocumentData = (
  templateKey: string,
  existingData: Record<string, unknown>,
  fieldValues: NextFormFieldValues,
): Record<string, unknown> => {
  if (!isNextFormReferenceTemplate(templateKey)) {
    return existingData;
  }

  return {
    ...existingData,
    customer_order_number: normalizeText(fieldValues.order_number),
    customer_name: normalizeText(fieldValues.customer),
    service_location: normalizeText(fieldValues.service_location),
    customer_master_id: normalizeText(fieldValues.customer_master_id),
    customer_master_status: normalizeText(fieldValues.customer_master_status),
    customer_order_status: normalizeText(fieldValues.customer_order_status),
    customer_order_created_at: normalizeText(fieldValues.customer_order_created_at),
    work_description: normalizeText(fieldValues.work_description),
    material: normalizeText(fieldValues.material),
    product_master_id: normalizeText(fieldValues.product_master_id),
    product_master_type: normalizeText(fieldValues.product_master_type),
    product_master_status: normalizeText(fieldValues.product_master_status),
    labor_hours: normalizeText(fieldValues.labor_hours),
    travel_hours: normalizeText(fieldValues.travel_hours),
    break_minutes: normalizeText(fieldValues.break_minutes),
  };
};
