import type { User } from "../../types/domain.js";
import type { FormRuntimeControlType, FormRuntimeDefinition, FormRuntimeFieldControlType } from "./types.js";

export type ReferenceFormRuntimeFieldRuntimeRole =
  | "lookup_input"
  | "lookup_prefill"
  | "manual_input"
  | "derived_readonly"
  | "workflow_readonly";

export type ReferenceFormRuntimeLookupRole = "none" | "input" | "result" | "masterdata";

export type ReferenceFormRuntimeOptionItem = {
  value: string;
  label: string;
};

export type ReferenceFormRuntimeFieldSemantic = {
  controlType: FormRuntimeFieldControlType;
  runtimeRole: ReferenceFormRuntimeFieldRuntimeRole;
  lookupRole: ReferenceFormRuntimeLookupRole;
  isSubmitRequired: boolean;
  isEditableWhenOpen: boolean;
  optionsSourceField?: string;
  emptyValueLabel?: string;
  helpText?: string;
};

export type ReferenceFormRuntimeActionSemantic = {
  controlType: Extract<FormRuntimeControlType, "action" | "lookup">;
  runtimeRole: "lookup_trigger";
  lookupRole: "trigger";
  args: string[];
  bind: string[];
  hint?: string;
};

type ReferenceFormRuntimeTemplateConfig = {
  fieldSemantics: Record<string, ReferenceFormRuntimeFieldSemantic>;
  hiddenFieldNames: string[];
  buildMasterDataSections?: (fieldValues: Record<string, string>) => ReferenceFormRuntimeMasterDataSection[];
};

const buildUserOptionItems = (users: User[]): ReferenceFormRuntimeOptionItem[] => {
  return users
    .filter((user) => user.status === "active")
    .map((user) => ({
      value: user.id,
      label: user.displayName,
    }));
};

const resolveSingleUserDisplayValue = (
  value: string,
  optionItems: ReferenceFormRuntimeOptionItem[],
): string => optionItems.find((item) => item.value === value)?.label ?? value;

const resolveMultiUserDisplayValue = (
  value: string,
  optionItems: ReferenceFormRuntimeOptionItem[],
): string => value
  .split(",")
  .map((entry) => entry.trim())
  .filter((entry) => entry.length > 0)
  .map((entry) => resolveSingleUserDisplayValue(entry, optionItems))
  .join(", ");

const customerOrderFieldSemantics = {
  order_number: {
    controlType: "text",
    runtimeRole: "lookup_input",
    lookupRole: "input",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
  },
  service_date: {
    controlType: "date",
    runtimeRole: "derived_readonly",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
  },
  customer: {
    controlType: "text",
    runtimeRole: "derived_readonly",
    lookupRole: "result",
    isSubmitRequired: true,
    isEditableWhenOpen: false,
    emptyValueLabel: "Wird durch Kundendaten laden gefuellt",
  },
  technician: {
    controlType: "text",
    runtimeRole: "derived_readonly",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
  },
  service_location: {
    controlType: "textarea",
    runtimeRole: "lookup_prefill",
    lookupRole: "result",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
    emptyValueLabel: "Kann aus Kundendaten uebernommen und angepasst werden",
  },
  work_description: {
    controlType: "html-editor",
    runtimeRole: "manual_input",
    lookupRole: "input",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
    helpText: "Steuert den Materialvorschlag.",
  },
  material: {
    controlType: "textarea",
    runtimeRole: "derived_readonly",
    lookupRole: "result",
    isSubmitRequired: true,
    isEditableWhenOpen: false,
    emptyValueLabel: "Wird durch Materialvorschlag holen gefuellt",
  },
  labor_hours: {
    controlType: "number",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  travel_hours: {
    controlType: "number",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  break_minutes: {
    controlType: "number",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  approval_status: {
    controlType: "select",
    runtimeRole: "workflow_readonly",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
  },
  work_signature: {
    controlType: "signature",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
    emptyValueLabel: "Noch nicht signiert",
    helpText: "Setzt Nutzer und Zeitstempel fuer den Arbeitsbericht.",
  },
} as const satisfies Record<string, ReferenceFormRuntimeFieldSemantic>;

const serviceReportFieldSemantics = {
  order_number: {
    controlType: "select",
    runtimeRole: "lookup_input",
    lookupRole: "input",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
    optionsSourceField: "service_order_options_json",
    emptyValueLabel: "Bitte einen Auftrag aus ERP-SIM waehlen",
  },
  customer_order_status: {
    controlType: "text",
    runtimeRole: "derived_readonly",
    lookupRole: "result",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
    emptyValueLabel: "Wird durch Auftragsdaten laden gefuellt",
  },
  customer: {
    controlType: "text",
    runtimeRole: "derived_readonly",
    lookupRole: "result",
    isSubmitRequired: true,
    isEditableWhenOpen: false,
    emptyValueLabel: "Wird durch Auftragsdaten laden gefuellt",
  },
  customer_master_status: {
    controlType: "text",
    runtimeRole: "derived_readonly",
    lookupRole: "result",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
    emptyValueLabel: "Wird durch Auftragsdaten laden gefuellt",
  },
  service_date: {
    controlType: "date",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  technician: {
    controlType: "text",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  work_description: {
    controlType: "textarea",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
    emptyValueLabel: "Sachverhalt, Befund und getroffene Massnahmen",
  },
  customer_information_flags: {
    controlType: "checkbox-group",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
    emptyValueLabel: "Keine zusaetzlichen Kundeninformationen gewaehlt",
  },
  service_result_status: {
    controlType: "radio-group",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
    emptyValueLabel: "Bitte einen Status waehlen",
  },
  follow_up_date: {
    controlType: "date",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
    emptyValueLabel: "Kein Folgetermin gesetzt",
  },
  labor_hours: {
    controlType: "number",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  travel_hours: {
    controlType: "number",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  break_minutes: {
    controlType: "number",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  approval_status: {
    controlType: "select",
    runtimeRole: "workflow_readonly",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
  },
  work_signature: {
    controlType: "signature",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
    emptyValueLabel: "Noch nicht signiert",
  },
} as const satisfies Record<string, ReferenceFormRuntimeFieldSemantic>;

const productionReportFieldSemantics = {
  product_number: {
    controlType: "select",
    runtimeRole: "lookup_input",
    lookupRole: "input",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
    optionsSourceField: "product_options_json",
    emptyValueLabel: "Bitte ein Produkt aus ERP-SIM waehlen",
  },
  product_name: {
    controlType: "text",
    runtimeRole: "derived_readonly",
    lookupRole: "result",
    isSubmitRequired: true,
    isEditableWhenOpen: false,
    emptyValueLabel: "Wird durch Produktdaten laden gefuellt",
  },
  production_line: {
    controlType: "text",
    runtimeRole: "derived_readonly",
    lookupRole: "result",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
    emptyValueLabel: "Wird durch Produktdaten laden gefuellt",
  },
  product_status: {
    controlType: "text",
    runtimeRole: "derived_readonly",
    lookupRole: "result",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
    emptyValueLabel: "Wird durch Produktdaten laden gefuellt",
  },
  batch_id: {
    controlType: "text",
    runtimeRole: "derived_readonly",
    lookupRole: "result",
    isSubmitRequired: true,
    isEditableWhenOpen: false,
    emptyValueLabel: "Wird durch Batchnummer erzeugen gefuellt",
  },
  batch_status: {
    controlType: "text",
    runtimeRole: "derived_readonly",
    lookupRole: "result",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
    emptyValueLabel: "Wird durch Batchnummer erzeugen gefuellt",
  },
  serial_number: {
    controlType: "text",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  status: {
    controlType: "radio-group",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
    emptyValueLabel: "Bitte einen Produktionsstatus waehlen",
  },
  process_steps: {
    controlType: "grid",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
    emptyValueLabel: "Noch keine Arbeitsschritte erfasst",
  },
  approval_status: {
    controlType: "select",
    runtimeRole: "workflow_readonly",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
  },
  work_signature: {
    controlType: "signature",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
    emptyValueLabel: "Noch nicht signiert",
  },
} as const satisfies Record<string, ReferenceFormRuntimeFieldSemantic>;

const qualificationFieldSemantics = {
  qualification_record_number: {
    controlType: "text",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
  },
  qualification_title: {
    controlType: "text",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
  },
  owner_user_id: {
    controlType: "user-select",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
    emptyValueLabel: "Bitte einen verantwortlichen Nutzer waehlen",
  },
  attendee_user_ids: {
    controlType: "user-multiselect",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
    emptyValueLabel: "Bitte mindestens einen Nutzer waehlen",
  },
  qualification_result: {
    controlType: "radio-group",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
    emptyValueLabel: "Bitte eine Antwort waehlen",
  },
  qualification_topics: {
    controlType: "checkbox-group",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
    emptyValueLabel: "Bitte mindestens ein Thema bestaetigen",
  },
  valid_until: {
    controlType: "date",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  approval_status: {
    controlType: "select",
    runtimeRole: "workflow_readonly",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
  },
  work_signature: {
    controlType: "signature",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
    emptyValueLabel: "Noch nicht signiert",
    helpText: "Bestaetigt den Nachweis mit aktuellem Nutzer und Zeitstempel.",
  },
} as const satisfies Record<string, ReferenceFormRuntimeFieldSemantic>;

const productionBatchFieldSemantics = {
  batch_id: {
    controlType: "text",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
  },
  serial_number: {
    controlType: "text",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  product_name: {
    controlType: "text",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
  },
  production_line: {
    controlType: "text",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  process_steps: {
    controlType: "grid",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
    emptyValueLabel: "Noch keine Produktionsschritte erfasst",
  },
  approval_status: {
    controlType: "select",
    runtimeRole: "workflow_readonly",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
  },
  work_signature: {
    controlType: "signature",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
    emptyValueLabel: "Noch nicht signiert",
  },
} as const satisfies Record<string, ReferenceFormRuntimeFieldSemantic>;

const genericFormFieldSemantics = {
  generic_form_title: {
    controlType: "text",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
  },
  generic_form_description: {
    controlType: "textarea",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
  },
  generic_form_note: {
    controlType: "html-editor",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: true,
    isEditableWhenOpen: true,
  },
  approval_status: {
    controlType: "select",
    runtimeRole: "workflow_readonly",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: false,
  },
  work_signature: {
    controlType: "signature",
    runtimeRole: "manual_input",
    lookupRole: "none",
    isSubmitRequired: false,
    isEditableWhenOpen: true,
    emptyValueLabel: "Noch nicht signiert",
  },
} as const satisfies Record<string, ReferenceFormRuntimeFieldSemantic>;

const formRuntimeTemplateConfigs = {
  "customer-order-test": {
    fieldSemantics: customerOrderFieldSemantics,
    hiddenFieldNames: [
      "customer_master_id",
      "customer_master_status",
      "customer_order_status",
      "customer_order_created_at",
      "product_master_id",
      "product_master_type",
      "product_master_status",
    ],
    buildMasterDataSections: (fieldValues) => {
      const customerName = fieldValues.customer?.trim() ?? "";
      const materialName = fieldValues.material?.trim() ?? "";

      return [
        {
          key: "customer",
          title: "Kunde",
          summary: customerName || "Noch keine Kundendaten geladen.",
          entries: [
            {
              label: "Kunden-ID",
              value: fieldValues.customer_master_id ?? "",
              emptyValueLabel: "Wird durch Kundendaten laden gefuellt",
            },
            {
              label: "Kundenstatus",
              value: fieldValues.customer_master_status ?? "",
              emptyValueLabel: "Wird durch Kundendaten laden gefuellt",
            },
            {
              label: "Auftragstatus",
              value: fieldValues.customer_order_status ?? "",
              emptyValueLabel: "Wird durch Kundendaten laden gefuellt",
            },
            {
              label: "Auftrag angelegt",
              value: fieldValues.customer_order_created_at ?? "",
              emptyValueLabel: "Wird durch Kundendaten laden gefuellt",
            },
          ],
        },
        {
          key: "product",
          title: "Produkt",
          summary: materialName || "Noch kein Produkt geladen.",
          entries: [
            {
              label: "Produkt-ID",
              value: fieldValues.product_master_id ?? "",
              emptyValueLabel: "Wird durch Materialvorschlag holen gefuellt",
            },
            {
              label: "Produkttyp",
              value: fieldValues.product_master_type ?? "",
              emptyValueLabel: "Wird durch Materialvorschlag holen gefuellt",
            },
            {
              label: "Produktstatus",
              value: fieldValues.product_master_status ?? "",
              emptyValueLabel: "Wird durch Materialvorschlag holen gefuellt",
            },
          ],
        },
      ];
    },
  },
  "service-report": {
    fieldSemantics: serviceReportFieldSemantics,
    hiddenFieldNames: ["service_order_options_json"],
  },
  "production-report": {
    fieldSemantics: productionReportFieldSemantics,
    hiddenFieldNames: ["product_options_json"],
  },
  "qualification-record": {
    fieldSemantics: qualificationFieldSemantics,
    hiddenFieldNames: [],
  },
  "production-batch": {
    fieldSemantics: productionBatchFieldSemantics,
    hiddenFieldNames: [],
  },
  "generic-form": {
    fieldSemantics: genericFormFieldSemantics,
    hiddenFieldNames: [],
  },
} as const satisfies Record<string, ReferenceFormRuntimeTemplateConfig>;

export const referenceFormRuntimeSubmitRequiredFieldNames = Object.fromEntries(
  Object.entries(formRuntimeTemplateConfigs).map(([templateKey, config]) => [
    templateKey,
    Object.entries(config.fieldSemantics)
      .filter(([, definition]) => definition.isSubmitRequired)
      .map(([name]) => name),
  ]),
) as Record<string, string[]>;

const formRuntimeLockedStatuses = new Set(["submitted", "approved", "rejected", "archived"]);

const workflowStatusAliases: Record<string, string> = {
  created: "draft",
};

const normalizeWorkflowStatus = (value: string): string => {
  const normalized = value.trim().toLowerCase();
  return workflowStatusAliases[normalized] ?? normalized;
};

const buildFormRuntimeEditableStatusMaps = (parsedForm?: FormRuntimeDefinition) => {
  const fieldStatuses = new Map<string, string[]>();
  const actionStatuses = new Map<string, string[]>();
  let hasScopedEditability = false;

  for (const section of parsedForm?.sections ?? []) {
    const sectionStatuses = section.editableIn?.map(normalizeWorkflowStatus) ?? [];

    if (sectionStatuses.length > 0) {
      hasScopedEditability = true;
    }

    for (const row of section.rows) {
      for (const slot of row.slots) {
        const ownStatuses = slot.element.editableIn?.map(normalizeWorkflowStatus) ?? [];
        const effectiveStatuses = ownStatuses.length > 0 ? ownStatuses : sectionStatuses;

        if (ownStatuses.length > 0) {
          hasScopedEditability = true;
        }

        if (effectiveStatuses.length === 0) {
          continue;
        }

        const targetMap = slot.element.kind === "field" ? fieldStatuses : actionStatuses;
        const existingStatuses = targetMap.get(slot.element.name) ?? [];
        targetMap.set(slot.element.name, Array.from(new Set([...existingStatuses, ...effectiveStatuses])));
      }
    }
  }

  return {
    fieldStatuses,
    actionStatuses,
    hasScopedEditability,
  };
};

const isEditableInDocumentStatus = (editableStatuses: string[] | undefined, documentStatus: string): boolean => {
  if (!editableStatuses || editableStatuses.length === 0) {
    return false;
  }

  const normalizedDocumentStatus = normalizeWorkflowStatus(documentStatus);
  return editableStatuses.some((status) => normalizeWorkflowStatus(status) === normalizedDocumentStatus);
};

export type ReferenceFormRuntimeEditState = {
  isAvailable: boolean;
  reason?: string;
};

type ReferenceFormRuntimeFieldUi = {
  controlType: FormRuntimeFieldControlType;
  runtimeRole: ReferenceFormRuntimeFieldRuntimeRole;
  lookupRole: ReferenceFormRuntimeLookupRole;
  isSubmitRequired: boolean;
  isEditable: boolean;
  isReadOnly: boolean;
  state: "editable" | "readonly";
  emptyValueLabel?: string;
  helpText?: string;
  optionItems?: ReferenceFormRuntimeOptionItem[];
  displayValue?: string;
};

type ReferenceFormRuntimeActionUi = {
  controlType: Extract<FormRuntimeControlType, "action" | "lookup">;
  runtimeRole: "lookup_trigger";
  lookupRole: "trigger";
  args: string[];
  bind: string[];
  isEnabled: boolean;
  hint?: string;
};

export type ReferenceFormRuntimeMasterDataEntry = {
  label: string;
  value: string;
  emptyValueLabel: string;
};

export type ReferenceFormRuntimeMasterDataSection = {
  key: "customer" | "product";
  title: string;
  summary: string;
  entries: ReferenceFormRuntimeMasterDataEntry[];
};

const parseDynamicOptionItems = (value: string | undefined): ReferenceFormRuntimeOptionItem[] | undefined => {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return undefined;
    }

    const items = parsed.flatMap((entry) => {
      if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        return [];
      }

      const option = entry as Record<string, unknown>;
      const itemValue = typeof option.value === "string" ? option.value.trim() : "";
      const itemLabel = typeof option.label === "string" ? option.label.trim() : itemValue;

      if (!itemValue || !itemLabel) {
        return [];
      }

      return [{
        value: itemValue,
        label: itemLabel,
      }];
    });

    return items.length > 0 ? items : undefined;
  } catch {
    return undefined;
  }
};

const getTemplateConfig = (templateKey: string): ReferenceFormRuntimeTemplateConfig | null => {
  return formRuntimeTemplateConfigs[templateKey as keyof typeof formRuntimeTemplateConfigs] ?? null;
};

export const getReferenceFormRuntimeHiddenFieldNames = (templateKey: string): string[] => {
  const config = getTemplateConfig(templateKey);
  return config ? [...config.hiddenFieldNames] : [];
};

export const getReferenceFormRuntimeSubmitRequiredFieldNames = (templateKey: string): string[] => {
  return [...(referenceFormRuntimeSubmitRequiredFieldNames[templateKey] ?? [])];
};

export const getReferenceFormRuntimeRequiredFieldNamesForStatus = (input: {
  templateKey: string;
  documentStatus: string;
  parsedForm?: FormRuntimeDefinition;
}): string[] => {
  const { templateKey, documentStatus, parsedForm } = input;
  const config = getTemplateConfig(templateKey);

  if (!config) {
    return [];
  }

  const editableStatusMaps = buildFormRuntimeEditableStatusMaps(parsedForm);

  return Object.entries(config.fieldSemantics)
    .filter(([, definition]) => definition.isSubmitRequired)
    .filter(([name, definition]) => {
      if (!editableStatusMaps.hasScopedEditability) {
        return definition.isEditableWhenOpen;
      }

      return isEditableInDocumentStatus(editableStatusMaps.fieldStatuses.get(name), documentStatus);
    })
    .map(([name]) => name);
};

export const getReferenceFormRuntimeEditState = (input: {
  documentStatus: string;
  canPrepareDraft?: boolean;
  baseEditState: {
    isAvailable: boolean;
    reason?: string;
  };
}): ReferenceFormRuntimeEditState => {
  const { documentStatus, canPrepareDraft = false, baseEditState } = input;

  if (!baseEditState.isAvailable) {
    if (canPrepareDraft && normalizeWorkflowStatus(documentStatus) === "draft") {
      return {
        isAvailable: true,
      };
    }

    return baseEditState;
  }

  if (!formRuntimeLockedStatuses.has(documentStatus)) {
    return {
      isAvailable: true,
    };
  }

  if (documentStatus === "submitted") {
    return {
      isAvailable: false,
      reason: "Nach Submit ist das Formular bis zur Entscheidung read-only.",
    };
  }

  return {
    isAvailable: false,
    reason: "Im aktuellen Dokumentstatus ist das Formular read-only.",
  };
};

export const buildReferenceFormRuntimeFieldUi = (input: {
  templateKey: string;
  canEdit: boolean;
  documentStatus: string;
  fieldValues: Record<string, string>;
  availableUsers: User[];
  parsedForm?: FormRuntimeDefinition;
}): Record<string, ReferenceFormRuntimeFieldUi> => {
  const { templateKey, canEdit, documentStatus, fieldValues, availableUsers, parsedForm } = input;
  const config = getTemplateConfig(templateKey);

  if (!config) {
    return {};
  }

  const userOptionItems = buildUserOptionItems(availableUsers);
  const editableStatusMaps = buildFormRuntimeEditableStatusMaps(parsedForm);

  return Object.fromEntries(
    Object.entries(config.fieldSemantics).map(([name, definition]) => {
      const scopedStatuses = editableStatusMaps.fieldStatuses.get(name);
      const isEditableByWorkflow = editableStatusMaps.hasScopedEditability
        ? isEditableInDocumentStatus(scopedStatuses, documentStatus)
        : definition.isEditableWhenOpen;
      const isEditable = definition.isEditableWhenOpen && canEdit && isEditableByWorkflow;
      const isReadOnly = !isEditable;
      const fieldValue = fieldValues[name] ?? "";
      const emptyValueLabel = "emptyValueLabel" in definition ? definition.emptyValueLabel : undefined;
      const helpText = "helpText" in definition ? definition.helpText : undefined;
      const optionItems = definition.controlType === "user-select" || definition.controlType === "user-multiselect"
        ? userOptionItems
        : definition.optionsSourceField
          ? parseDynamicOptionItems(fieldValues[definition.optionsSourceField])
          : undefined;
      const displayValue = definition.controlType === "user-select"
        ? resolveSingleUserDisplayValue(fieldValue, userOptionItems)
        : definition.controlType === "user-multiselect"
          ? resolveMultiUserDisplayValue(fieldValue, userOptionItems)
          : definition.controlType === "radio-group"
            ? fieldValue
            : definition.controlType === "checkbox-group"
              ? fieldValue
                  .split(",")
                  .map((entry) => entry.trim())
                  .filter((entry) => entry.length > 0)
                  .join(", ")
              : undefined;

      return [name, {
        controlType: definition.controlType,
        runtimeRole: definition.runtimeRole,
        lookupRole: definition.lookupRole,
        isSubmitRequired: definition.isSubmitRequired,
        isEditable,
        isReadOnly,
        state: isEditable ? "editable" : "readonly",
        ...(emptyValueLabel ? { emptyValueLabel } : {}),
        ...(helpText ? { helpText } : {}),
        ...(optionItems ? { optionItems } : {}),
        ...(displayValue ? { displayValue } : {}),
      }];
    }),
  );
};

export const buildReferenceFormRuntimeActionUi = (input: {
  parsedForm?: FormRuntimeDefinition;
  canEdit: boolean;
  documentStatus: string;
}): Record<string, ReferenceFormRuntimeActionUi> => {
  const { parsedForm, canEdit, documentStatus } = input;

  if (!parsedForm) {
    return {};
  }

  const editableStatusMaps = buildFormRuntimeEditableStatusMaps(parsedForm);

  return Object.fromEntries(
    parsedForm.actions.map((action) => [
      action.name,
      {
        controlType: action.controlType === "lookup" ? "lookup" : "action",
        runtimeRole: "lookup_trigger",
        lookupRole: "trigger",
        args: [...(action.args ?? [])],
        bind: [...(action.bind ?? [])],
        isEnabled: canEdit && (
          !editableStatusMaps.hasScopedEditability
          || isEditableInDocumentStatus(editableStatusMaps.actionStatuses.get(action.name), documentStatus)
        ),
        ...(typeof action.properties.hint === "string" && action.properties.hint.trim().length > 0
          ? { hint: action.properties.hint.trim() }
          : {}),
      },
    ]),
  );
};

export const buildReferenceFormRuntimeMasterDataSections = (input: {
  templateKey: string;
  fieldValues: Record<string, string>;
}): ReferenceFormRuntimeMasterDataSection[] => {
  const config = getTemplateConfig(input.templateKey);

  if (!config?.buildMasterDataSections) {
    return [];
  }

  return config.buildMasterDataSections(input.fieldValues);
};
