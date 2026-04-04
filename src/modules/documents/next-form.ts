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
import { sanitizeRichTextHtml } from "../next-form/rich-text.js";
import {
  getQualificationCurrentUserState,
  synchronizeQualificationAssignments,
  writeQualificationParticipantState,
} from "../qualification/progress.js";

const normalizeFieldValues = (values: Record<string, unknown>): NextFormFieldValues => {
  const normalized: NextFormFieldValues = {};

  const candidateValues = {
    order_number: values.order_number,
    customer: values.customer,
    service_location: values.service_location,
    customer_master_id: values.customer_master_id,
    customer_master_status: values.customer_master_status,
    customer_order_status: values.customer_order_status,
    customer_order_created_at: values.customer_order_created_at,
    work_description: typeof values.work_description === "string" ? sanitizeRichTextHtml(values.work_description) : values.work_description,
    material: values.material,
    product_master_id: values.product_master_id,
    product_master_type: values.product_master_type,
    product_master_status: values.product_master_status,
    work_signature: values.work_signature,
    work_signature_at: values.work_signature_at,
    batch_id: values.batch_id,
    serial_number: values.serial_number,
    product_name: values.product_name,
    production_line: values.production_line,
    process_steps: values.process_steps,
    qualification_record_number: values.qualification_record_number,
    qualification_title: values.qualification_title,
    owner_user_id: values.owner_user_id,
    attendee_user_ids: values.attendee_user_ids,
    valid_until: values.valid_until,
    qualification_result: values.qualification_result,
    qualification_topics: values.qualification_topics,
    approval_status: values.approval_status,
    labor_hours: values.labor_hours,
    travel_hours: values.travel_hours,
    break_minutes: values.break_minutes,
  };

  for (const [key, value] of Object.entries(candidateValues)) {
    if (typeof value === "string") {
      normalized[key] = value;
    }
  }

  return normalized;
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
  signatureApplied: boolean;
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

  const baseFieldValues: NextFormFieldValues = {
    ...mapDocumentDataToNextFormValues(visible.context.templateKey, visible.context.dataJson, {
      currentUserId: input.userId,
    }),
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
  activeUserDisplayName: string;
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

  const signatureRequested = typeof input.submittedValues.work_signature_requested === "string"
    ? input.submittedValues.work_signature_requested === "sign"
    : false;

  const fieldValues: NextFormFieldValues = {
    ...mapDocumentDataToNextFormValues(visible.context.templateKey, visible.context.dataJson, {
      currentUserId: input.userId,
    }),
    ...normalizeFieldValues(input.submittedValues),
  };
  const effectiveFieldValues: NextFormFieldValues = signatureRequested
    ? {
        ...fieldValues,
        work_signature: input.activeUserDisplayName,
        work_signature_at: new Date().toISOString(),
      }
    : fieldValues;
  const mergedDocumentDataBase = mergeNextFormValuesIntoDocumentData(
    visible.context.templateKey,
    visible.context.dataJson,
    effectiveFieldValues,
    { currentUserId: input.userId },
  );
  const mergedDocumentData = visible.context.templateKey === "qualification-record"
    ? writeQualificationParticipantState({
        data: mergedDocumentDataBase,
        userId: input.userId,
        patch: {
          savedAt: new Date().toISOString(),
          ...(signatureRequested
            ? {
                signature: input.activeUserDisplayName,
                signatureAt: effectiveFieldValues.work_signature_at,
              }
            : {}),
          fieldValues: {
            ...(getQualificationCurrentUserState(mergedDocumentDataBase, input.userId).fieldValues ?? {}),
            qualification_result: effectiveFieldValues.qualification_result ?? "",
            qualification_topics: (effectiveFieldValues.qualification_topics ?? "")
              .split(",")
              .map((entry) => entry.trim())
              .filter((entry) => entry.length > 0),
          },
        },
      })
    : mergedDocumentDataBase;

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

    if (visible.context.templateKey === "qualification-record") {
      await synchronizeQualificationAssignments({
        client,
        documentId: input.documentId,
        actorUserId: input.userId,
        documentTitle: visible.context.title,
        documentStatus: visible.context.status,
        data: mergedDocumentData,
      });
    }

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
            "qualification_record_number",
            "qualification_title",
            "owner_user_id",
            "attendee_user_ids",
            "valid_until",
            "batch_id",
            "serial_number",
            "product_name",
            "production_line",
            "process_steps",
            "approval_status",
            "work_signature",
            "work_signature_at",
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
            qualification_record_number: mergedDocumentData.qualification_record_number,
            qualification_title: mergedDocumentData.qualification_title,
            owner_user_id: mergedDocumentData.owner_user_id,
            attendee_user_ids: mergedDocumentData.attendee_user_ids,
            valid_until: mergedDocumentData.valid_until,
            batch_id: mergedDocumentData.batch_id,
            serial_number: mergedDocumentData.serial_number,
            product_name: mergedDocumentData.product_name,
            production_line: mergedDocumentData.production_line,
            process_steps: mergedDocumentData.process_steps,
            approval_status: mergedDocumentData.approval_status,
            work_signature: effectiveFieldValues.work_signature,
            work_signature_at: effectiveFieldValues.work_signature_at,
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
        "qualification_record_number",
        "qualification_title",
        "owner_user_id",
        "attendee_user_ids",
        "valid_until",
        "batch_id",
        "serial_number",
        "product_name",
        "production_line",
        "process_steps",
        "approval_status",
        "work_signature",
        "work_signature_at",
        "labor_hours",
        "travel_hours",
        "break_minutes",
      ],
      signatureApplied: signatureRequested,
    };
  });
};
