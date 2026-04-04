import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, getDocumentEditStateForUser } from "./access.js";
import {
  parseFormRuntimeSource,
  type FormRuntimeActionState,
  type FormRuntimeFieldValues,
} from "../forms/index.js";
import { isFormRuntimeReferenceTemplate, mapDocumentDataToFormRuntimeValues, mergeFormRuntimeValuesIntoDocumentData } from "../forms/document-bridge.js";
import { getReferenceFormRuntimeEditState } from "../forms/document-ui.js";
import { executePublishedOperationByKey } from "../operations/runtime.js";
import { sanitizeRichTextHtml } from "../forms/rich-text.js";
import {
  getQualificationCurrentUserState,
  synchronizeQualificationAssignments,
  writeQualificationParticipantState,
} from "../qualification/progress.js";
import { applyQualificationEvaluationToData } from "../qualification/evaluation.js";
import { normalizeQualificationPageIndex } from "../qualification/pages.js";
import { syncTypedRecordForDocument } from "./typed-records.js";

const normalizeFieldValues = (values: Record<string, unknown>): FormRuntimeFieldValues => {
  const normalized: FormRuntimeFieldValues = {};

  const candidateValues = {
    order_number: values.order_number,
    service_date: values.service_date,
    technician: values.technician,
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
    qualification_current_page: values.qualification_current_page,
    approval_status: values.approval_status,
    labor_hours: values.labor_hours,
    travel_hours: values.travel_hours,
    break_minutes: values.break_minutes,
    generic_form_title: values.generic_form_title,
    generic_form_description: values.generic_form_description,
    generic_form_note: typeof values.generic_form_note === "string" ? sanitizeRichTextHtml(values.generic_form_note) : values.generic_form_note,
  };

  for (const [key, value] of Object.entries(candidateValues)) {
    if (typeof value === "string") {
      normalized[key] = value;
    }
  }

  return normalized;
};

type FormRuntimeDocumentFailureReason =
  | "document_not_visible"
  | "form_runtime_not_supported"
  | "edit_not_allowed"
  | "action_not_supported";

type FormRuntimeDocumentFailure = {
  ok: false;
  reason: FormRuntimeDocumentFailureReason;
  details: string;
};

type FormRuntimeDocumentActionSuccess = {
  ok: true;
  fieldValues: FormRuntimeFieldValues;
  actionState: FormRuntimeActionState;
};

type FormRuntimeDocumentSaveSuccess = {
  ok: true;
  documentId: string;
  savedFieldNames: string[];
  signatureApplied: boolean;
};

export type RunDocumentFormRuntimeActionResult = FormRuntimeDocumentActionSuccess | FormRuntimeDocumentFailure;
export type SaveDocumentFormRuntimeResult = FormRuntimeDocumentSaveSuccess | FormRuntimeDocumentFailure;

const getVisibleFormRuntimeDocumentContext = async (documentId: string, userId: string) => {
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

  if (!isFormRuntimeReferenceTemplate(context.templateKey)) {
    return {
      ok: false as const,
      error: {
        ok: false as const,
        reason: "form_runtime_not_supported" as const,
        details: "Der .form.md-Arbeitsbereich ist fuer diesen Dokumenttyp aktuell nicht verfuegbar.",
      },
    };
  }

  return {
    ok: true as const,
    context,
  };
};

export const runDocumentFormRuntimeActionForUser = async (input: {
  documentId: string;
  userId: string;
  actionName: string;
  submittedValues: Record<string, unknown>;
}): Promise<RunDocumentFormRuntimeActionResult> => {
  const visible = await getVisibleFormRuntimeDocumentContext(input.documentId, input.userId);

  if (!visible.ok) {
    return visible.error;
  }

  const baseEditState = await getDocumentEditStateForUser(input.documentId, input.userId);
  const editState = getReferenceFormRuntimeEditState({
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

  const parsedForm = parseFormRuntimeSource(visible.context.templateMdxBody);
  const action = parsedForm.actions.find((entry) => entry.name === input.actionName);

  if (!action) {
    return {
      ok: false,
      reason: "action_not_supported",
      details: `Die Action ${input.actionName} ist in der aktuellen Formularquelle nicht definiert.`,
    };
  }

  const baseFieldValues: FormRuntimeFieldValues = {
    ...mapDocumentDataToFormRuntimeValues(visible.context.templateKey, visible.context.dataJson, {
      currentUserId: input.userId,
    }),
    ...normalizeFieldValues(input.submittedValues),
  };

  if (!action.ref) {
    return {
      ok: false,
      reason: "action_not_supported",
      details: `Die Action ${input.actionName} hat keine API-Referenz.`,
    };
  }

  const result = await executePublishedOperationByKey({
    operationKey: action.ref,
    executionInput: {
      action,
      fieldValues: baseFieldValues,
      documentId: input.documentId,
      userId: input.userId,
      templateKey: visible.context.templateKey,
    },
  });

  return {
    ok: true,
    fieldValues: result.fieldValues,
    actionState: result.actionState,
  };
};

export const saveDocumentFormRuntimeValuesForUser = async (input: {
  documentId: string;
  userId: string;
  activeUserDisplayName: string;
  submittedValues: Record<string, unknown>;
  navigationPage?: number;
}): Promise<SaveDocumentFormRuntimeResult> => {
  const visible = await getVisibleFormRuntimeDocumentContext(input.documentId, input.userId);

  if (!visible.ok) {
    return visible.error;
  }

  const baseEditState = await getDocumentEditStateForUser(input.documentId, input.userId);
  const editState = getReferenceFormRuntimeEditState({
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

  const fieldValues: FormRuntimeFieldValues = {
    ...mapDocumentDataToFormRuntimeValues(visible.context.templateKey, visible.context.dataJson, {
      currentUserId: input.userId,
    }),
    ...normalizeFieldValues(input.submittedValues),
  };
  const effectiveFieldValues: FormRuntimeFieldValues = signatureRequested
    ? {
        ...fieldValues,
        work_signature: input.activeUserDisplayName,
        work_signature_at: new Date().toISOString(),
      }
    : fieldValues;
  const mergedDocumentDataBase = mergeFormRuntimeValuesIntoDocumentData(
    visible.context.templateKey,
    visible.context.dataJson,
    effectiveFieldValues,
    { currentUserId: input.userId },
  );
  const mergedDocumentDataWithPage = visible.context.templateKey === "qualification-record"
    ? writeQualificationParticipantState({
        data: mergedDocumentDataBase,
        userId: input.userId,
        patch: {
          savedAt: new Date().toISOString(),
          ...(typeof input.navigationPage === "number"
            ? { currentPage: normalizeQualificationPageIndex(input.navigationPage) }
            : {}),
          ...(signatureRequested
            ? {
                signature: input.activeUserDisplayName,
                signatureAt: effectiveFieldValues.work_signature_at,
              }
            : {}),
          fieldValues: {
            ...(getQualificationCurrentUserState(mergedDocumentDataBase, input.userId).fieldValues ?? {}),
            ...(Object.prototype.hasOwnProperty.call(effectiveFieldValues, "qualification_result")
              ? { qualification_result: effectiveFieldValues.qualification_result ?? "" }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(effectiveFieldValues, "qualification_topics")
              ? {
                  qualification_topics: (effectiveFieldValues.qualification_topics ?? "")
                    .split(",")
                    .map((entry) => entry.trim())
                    .filter((entry) => entry.length > 0),
                }
              : {}),
          },
        },
      })
    : mergedDocumentDataBase;
  const mergedDocumentData = visible.context.templateKey === "qualification-record"
    ? applyQualificationEvaluationToData(mergedDocumentDataWithPage)
    : mergedDocumentDataWithPage;

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

    await syncTypedRecordForDocument(client, {
      documentId: input.documentId,
      formType: visible.context.formType,
      templateName: visible.context.templateName,
      status: visible.context.status,
      dataJson: mergedDocumentData,
    });

    await client.query(
      `
      insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
      values ($1, 'saved', $2, $3, $4::jsonb)
      `,
      [
        input.documentId,
        input.userId,
        "Form runtime document slice saved.",
        JSON.stringify({
          source: "form-runtime-document-slice",
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
            evaluation_status: mergedDocumentData.evaluation_status,
            score_value: mergedDocumentData.score_value,
            passed: mergedDocumentData.passed,
            evaluated_at: mergedDocumentData.evaluated_at,
            batch_id: mergedDocumentData.batch_id,
            serial_number: mergedDocumentData.serial_number,
            product_name: mergedDocumentData.product_name,
            production_line: mergedDocumentData.production_line,
            process_steps: mergedDocumentData.process_steps,
            approval_status: mergedDocumentData.approval_status,
            generic_form_title: mergedDocumentData.generic_form_title,
            generic_form_description: mergedDocumentData.generic_form_description,
            generic_form_note: mergedDocumentData.generic_form_note,
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
        "evaluation_status",
        "score_value",
        "passed",
        "evaluated_at",
        "batch_id",
        "serial_number",
        "product_name",
        "production_line",
        "process_steps",
        "approval_status",
        "generic_form_title",
        "generic_form_description",
        "generic_form_note",
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
