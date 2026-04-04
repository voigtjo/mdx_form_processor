import type { User } from "../../types/domain.js";
import type { NextFormControlType, NextFormFieldControlType } from "./types.js";

export type ReferenceNextFormFieldRuntimeRole =
  | "lookup_input"
  | "lookup_prefill"
  | "manual_input"
  | "derived_readonly"
  | "workflow_readonly";

export type ReferenceNextFormLookupRole = "none" | "input" | "result" | "masterdata";

export type ReferenceNextFormOptionItem = {
  value: string;
  label: string;
};

export type ReferenceNextFormFieldSemantic = {
  controlType: NextFormFieldControlType;
  runtimeRole: ReferenceNextFormFieldRuntimeRole;
  lookupRole: ReferenceNextFormLookupRole;
  isSubmitRequired: boolean;
  isEditableWhenOpen: boolean;
  emptyValueLabel?: string;
  helpText?: string;
};

export type ReferenceNextFormActionSemantic = {
  controlType: Extract<NextFormControlType, "action" | "lookup">;
  runtimeRole: "lookup_trigger";
  lookupRole: "trigger";
  args: string[];
  bind: string[];
  hint?: string;
};

type ReferenceNextFormTemplateConfig = {
  fieldSemantics: Record<string, ReferenceNextFormFieldSemantic>;
  actionSemantics: Record<string, ReferenceNextFormActionSemantic>;
  hiddenFieldNames: string[];
  buildMasterDataSections?: (fieldValues: Record<string, string>) => ReferenceNextFormMasterDataSection[];
};

const buildUserOptionItems = (users: User[]): ReferenceNextFormOptionItem[] => {
  return users
    .filter((user) => user.status === "active")
    .map((user) => ({
      value: user.id,
      label: user.displayName,
    }));
};

const resolveSingleUserDisplayValue = (
  value: string,
  optionItems: ReferenceNextFormOptionItem[],
): string => optionItems.find((item) => item.value === value)?.label ?? value;

const resolveMultiUserDisplayValue = (
  value: string,
  optionItems: ReferenceNextFormOptionItem[],
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
} as const satisfies Record<string, ReferenceNextFormFieldSemantic>;

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
} as const satisfies Record<string, ReferenceNextFormFieldSemantic>;

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
} as const satisfies Record<string, ReferenceNextFormFieldSemantic>;

export const referenceNextFormActionSemantics = {
  load_customer: {
    controlType: "action",
    runtimeRole: "lookup_trigger",
    lookupRole: "trigger",
    args: ["order_number"],
    bind: ["customer", "service_location"],
    hint: "Fuellt Kunde und schlaegt Einsatzort vor.",
  },
  suggest_material: {
    controlType: "lookup",
    runtimeRole: "lookup_trigger",
    lookupRole: "trigger",
    args: ["work_description"],
    bind: ["material"],
    hint: "Fuellt Material aus dem Produktvorschlag.",
  },
} as const satisfies Record<string, ReferenceNextFormActionSemantic>;

const nextFormTemplateConfigs = {
  "customer-order-test": {
    fieldSemantics: customerOrderFieldSemantics,
    actionSemantics: referenceNextFormActionSemantics,
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
  "qualification-record": {
    fieldSemantics: qualificationFieldSemantics,
    actionSemantics: {},
    hiddenFieldNames: [],
  },
  "production-batch": {
    fieldSemantics: productionBatchFieldSemantics,
    actionSemantics: {},
    hiddenFieldNames: [],
  },
} as const satisfies Record<string, ReferenceNextFormTemplateConfig>;

export const referenceNextFormSubmitRequiredFieldNames = Object.fromEntries(
  Object.entries(nextFormTemplateConfigs).map(([templateKey, config]) => [
    templateKey,
    Object.entries(config.fieldSemantics)
      .filter(([, definition]) => definition.isSubmitRequired)
      .map(([name]) => name),
  ]),
) as Record<string, string[]>;

const nextFormLockedStatuses = new Set(["submitted", "approved", "rejected", "archived"]);

export type ReferenceNextFormEditState = {
  isAvailable: boolean;
  reason?: string;
};

type ReferenceNextFormFieldUi = {
  controlType: NextFormFieldControlType;
  runtimeRole: ReferenceNextFormFieldRuntimeRole;
  lookupRole: ReferenceNextFormLookupRole;
  isSubmitRequired: boolean;
  isEditable: boolean;
  isReadOnly: boolean;
  state: "editable" | "readonly";
  emptyValueLabel?: string;
  helpText?: string;
  optionItems?: ReferenceNextFormOptionItem[];
  displayValue?: string;
};

type ReferenceNextFormActionUi = {
  controlType: Extract<NextFormControlType, "action" | "lookup">;
  runtimeRole: "lookup_trigger";
  lookupRole: "trigger";
  args: string[];
  bind: string[];
  isEnabled: boolean;
  hint?: string;
};

export type ReferenceNextFormMasterDataEntry = {
  label: string;
  value: string;
  emptyValueLabel: string;
};

export type ReferenceNextFormMasterDataSection = {
  key: "customer" | "product";
  title: string;
  summary: string;
  entries: ReferenceNextFormMasterDataEntry[];
};

const getTemplateConfig = (templateKey: string): ReferenceNextFormTemplateConfig | null => {
  return nextFormTemplateConfigs[templateKey as keyof typeof nextFormTemplateConfigs] ?? null;
};

export const getReferenceNextFormHiddenFieldNames = (templateKey: string): string[] => {
  const config = getTemplateConfig(templateKey);
  return config ? [...config.hiddenFieldNames] : [];
};

export const getReferenceNextFormSubmitRequiredFieldNames = (templateKey: string): string[] => {
  return [...(referenceNextFormSubmitRequiredFieldNames[templateKey] ?? [])];
};

export const getReferenceNextFormEditState = (input: {
  documentStatus: string;
  baseEditState: {
    isAvailable: boolean;
    reason?: string;
  };
}): ReferenceNextFormEditState => {
  const { documentStatus, baseEditState } = input;

  if (!baseEditState.isAvailable) {
    return baseEditState;
  }

  if (!nextFormLockedStatuses.has(documentStatus)) {
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

export const buildReferenceNextFormFieldUi = (input: {
  templateKey: string;
  canEdit: boolean;
  fieldValues: Record<string, string>;
  availableUsers: User[];
}): Record<string, ReferenceNextFormFieldUi> => {
  const { templateKey, canEdit, fieldValues, availableUsers } = input;
  const config = getTemplateConfig(templateKey);

  if (!config) {
    return {};
  }

  const userOptionItems = buildUserOptionItems(availableUsers);

  return Object.fromEntries(
    Object.entries(config.fieldSemantics).map(([name, definition]) => {
      const isEditable = definition.isEditableWhenOpen && canEdit;
      const isReadOnly = !isEditable;
      const fieldValue = fieldValues[name] ?? "";
      const emptyValueLabel = "emptyValueLabel" in definition ? definition.emptyValueLabel : undefined;
      const helpText = "helpText" in definition ? definition.helpText : undefined;
      const optionItems = definition.controlType === "user-select" || definition.controlType === "user-multiselect"
        ? userOptionItems
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

export const buildReferenceNextFormActionUi = (input: {
  templateKey: string;
  canEdit: boolean;
}): Record<string, ReferenceNextFormActionUi> => {
  const { templateKey, canEdit } = input;
  const config = getTemplateConfig(templateKey);

  if (!config) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(config.actionSemantics).map(([name, definition]) => [
      name,
      {
        controlType: definition.controlType,
        runtimeRole: definition.runtimeRole,
        lookupRole: definition.lookupRole,
        args: [...definition.args],
        bind: [...definition.bind],
        isEnabled: canEdit,
        ...(definition.hint ? { hint: definition.hint } : {}),
      },
    ]),
  );
};

export const buildReferenceNextFormMasterDataSections = (input: {
  templateKey: string;
  fieldValues: Record<string, string>;
}): ReferenceNextFormMasterDataSection[] => {
  const config = getTemplateConfig(input.templateKey);

  if (!config?.buildMasterDataSections) {
    return [];
  }

  return config.buildMasterDataSections(input.fieldValues);
};
