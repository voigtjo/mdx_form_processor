import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, getDocumentEditStateForUser } from "./access.js";
import {
  executeLoadCustomerAction,
  executeSuggestMaterialAction,
  parseNextFormSource,
  type NextFormActionState,
  type NextFormFieldValues,
} from "../next-form/index.js";
import { isNextFormReferenceTemplate, mapDocumentDataToNextFormValues, mergeNextFormValuesIntoDocumentData } from "../next-form/document-bridge.js";
import { getReferenceNextFormEditState } from "../next-form/document-ui.js";

const normalizeFieldValues = (values: Record<string, unknown>): NextFormFieldValues => {
  return {
    order_number: typeof values.order_number === "string" ? values.order_number : "",
    customer: typeof values.customer === "string" ? values.customer : "",
    service_location: typeof values.service_location === "string" ? values.service_location : "",
    customer_master_id: typeof values.customer_master_id === "string" ? values.customer_master_id : "",
    customer_master_status: typeof values.customer_master_status === "string" ? values.customer_master_status : "",
    customer_order_status: typeof values.customer_order_status === "string" ? values.customer_order_status : "",
    customer_order_created_at: typeof values.customer_order_created_at === "string" ? values.customer_order_created_at : "",
    work_description: typeof values.work_description === "string" ? values.work_description : "",
    material: typeof values.material === "string" ? values.material : "",
    product_master_id: typeof values.product_master_id === "string" ? values.product_master_id : "",
    product_master_type: typeof values.product_master_type === "string" ? values.product_master_type : "",
    product_master_status: typeof values.product_master_status === "string" ? values.product_master_status : "",
    labor_hours: typeof values.labor_hours === "string" ? values.labor_hours : "",
    travel_hours: typeof values.travel_hours === "string" ? values.travel_hours : "",
    break_minutes: typeof values.break_minutes === "string" ? values.break_minutes : "",
  };
};

type NextFormDocumentFailureReason =
  | "document_not_visible"
  | "next_form_not_supported"
  | "edit_not_allowed"
  | "action_not_supported";

type NextFormDocumentFailure = {
  ok: false;
  reason: NextFormDocumentFailureReason;
  details: string;
};

type NextFormDocumentActionSuccess = {
  ok: true;
  fieldValues: NextFormFieldValues;
  actionState: NextFormActionState;
};

type NextFormDocumentSaveSuccess = {
  ok: true;
  documentId: string;
  savedFieldNames: string[];
};

export type RunDocumentNextFormActionResult = NextFormDocumentActionSuccess | NextFormDocumentFailure;
export type SaveDocumentNextFormResult = NextFormDocumentSaveSuccess | NextFormDocumentFailure;

const getVisibleNextFormDocumentContext = async (documentId: string, userId: string) => {
  const context = await findDocumentAccessContextForUser(documentId, userId);

  if (!context || !context.canRead) {
    return {
      ok: false as const,
      error: {
        ok: false as const,
        reason: "document_not_visible" as const,
        details: "Dokument ist nicht sichtbar.",
      },
    };
  }

  if (!isNextFormReferenceTemplate(context.templateKey)) {
    return {
      ok: false as const,
      error: {
        ok: false as const,
        reason: "next_form_not_supported" as const,
        details: "Der .form.md-Arbeitsbereich ist fuer diesen Dokumenttyp aktuell nicht verfuegbar.",
      },
    };
  }

  return {
    ok: true as const,
    context,
  };
};

export const runDocumentNextFormActionForUser = async (input: {
  documentId: string;
  userId: string;
  actionName: string;
  submittedValues: Record<string, unknown>;
}): Promise<RunDocumentNextFormActionResult> => {
  const visible = await getVisibleNextFormDocumentContext(input.documentId, input.userId);

  if (!visible.ok) {
    return visible.error;
  }

  const baseEditState = await getDocumentEditStateForUser(input.documentId, input.userId);
  const editState = getReferenceNextFormEditState({
    documentStatus: visible.context.status,
    baseEditState,
  });

  if (!editState.isAvailable) {
    return {
      ok: false,
      reason: "edit_not_allowed",
      details: editState.reason ?? "Der neue Modellbereich ist im aktuellen Dokumentstatus nicht bearbeitbar.",
    };
  }

  const parsedForm = parseNextFormSource(visible.context.templateMdxBody);
  const action = parsedForm.actions.find((entry) => entry.name === input.actionName);

  if (!action) {
    return {
      ok: false,
      reason: "action_not_supported",
      details: `Die Action ${input.actionName} ist in der aktuellen Formularquelle nicht definiert.`,
    };
  }

  const baseFieldValues = {
    ...mapDocumentDataToNextFormValues(visible.context.templateKey, visible.context.dataJson),
    ...normalizeFieldValues(input.submittedValues),
  };

  const result = action.name === "suggest_material"
    ? await executeSuggestMaterialAction({
        action,
        fieldValues: baseFieldValues,
      })
    : await executeLoadCustomerAction({
        action,
        fieldValues: baseFieldValues,
      });

  return {
    ok: true,
    fieldValues: result.fieldValues,
    actionState: result.actionState,
  };
};

export const saveDocumentNextFormValuesForUser = async (input: {
  documentId: string;
  userId: string;
  submittedValues: Record<string, unknown>;
}): Promise<SaveDocumentNextFormResult> => {
  const visible = await getVisibleNextFormDocumentContext(input.documentId, input.userId);

  if (!visible.ok) {
    return visible.error;
  }

  const baseEditState = await getDocumentEditStateForUser(input.documentId, input.userId);
  const editState = getReferenceNextFormEditState({
    documentStatus: visible.context.status,
    baseEditState,
  });

  if (!editState.isAvailable) {
    return {
      ok: false,
      reason: "edit_not_allowed",
      details: editState.reason ?? "Der neue Modellbereich ist im aktuellen Dokumentstatus nicht bearbeitbar.",
    };
  }

  const fieldValues = {
    ...mapDocumentDataToNextFormValues(visible.context.templateKey, visible.context.dataJson),
    ...normalizeFieldValues(input.submittedValues),
  };
  const mergedDocumentData = mergeNextFormValuesIntoDocumentData(visible.context.templateKey, visible.context.dataJson, fieldValues);

  return withDbTransaction(async (client) => {
    await client.query(
      `
      update documents
      set data_json = $2::jsonb,
          updated_at = now()
      where id = $1
      `,
      [input.documentId, JSON.stringify(mergedDocumentData)],
    );

    await client.query(
      `
      insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
      values ($1, 'saved', $2, $3, $4::jsonb)
      `,
      [
        input.documentId,
        input.userId,
        "Next-form document slice saved.",
        JSON.stringify({
          source: "next-form-document-slice",
          savedFieldNames: [
            "customer_order_number",
            "customer_name",
            "service_location",
            "customer_master_id",
            "customer_master_status",
            "customer_order_status",
            "customer_order_created_at",
            "work_description",
            "material",
            "product_master_id",
            "product_master_type",
            "product_master_status",
            "labor_hours",
            "travel_hours",
            "break_minutes",
          ],
          savedValues: {
            customer_order_number: mergedDocumentData.customer_order_number,
            customer_name: mergedDocumentData.customer_name,
            service_location: mergedDocumentData.service_location,
            customer_master_id: mergedDocumentData.customer_master_id,
            customer_master_status: mergedDocumentData.customer_master_status,
            customer_order_status: mergedDocumentData.customer_order_status,
            customer_order_created_at: mergedDocumentData.customer_order_created_at,
            work_description: mergedDocumentData.work_description,
            material: mergedDocumentData.material,
            product_master_id: mergedDocumentData.product_master_id,
            product_master_type: mergedDocumentData.product_master_type,
            product_master_status: mergedDocumentData.product_master_status,
            labor_hours: mergedDocumentData.labor_hours,
            travel_hours: mergedDocumentData.travel_hours,
            break_minutes: mergedDocumentData.break_minutes,
          },
        }),
      ],
    );

    return {
      ok: true,
      documentId: input.documentId,
      savedFieldNames: [
        "customer_order_number",
        "customer_name",
        "service_location",
        "customer_master_id",
        "customer_master_status",
        "customer_order_status",
        "customer_order_created_at",
        "work_description",
        "material",
        "product_master_id",
        "product_master_type",
        "product_master_status",
        "labor_hours",
        "travel_hours",
        "break_minutes",
      ],
    };
  });
};
