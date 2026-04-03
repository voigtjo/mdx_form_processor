import type { NextFormControlType, NextFormFieldControlType } from "./types.js";

export type ReferenceNextFormFieldRuntimeRole =
  | "lookup_input"
  | "lookup_prefill"
  | "manual_input"
  | "derived_readonly"
  | "workflow_readonly";

export type ReferenceNextFormLookupRole = "none" | "input" | "result" | "masterdata";

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

export const referenceNextFormFieldSemantics = {
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
    controlType: "textarea",
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

export const referenceNextFormSubmitRequiredFieldNames = Object.entries(referenceNextFormFieldSemantics)
  .filter(([, definition]) => definition.isSubmitRequired)
  .map(([name]) => name) as Array<keyof typeof referenceNextFormFieldSemantics>;

export const referenceNextFormLookupMetaFieldNames = [
  "customer_master_id",
  "customer_master_status",
  "customer_order_status",
  "customer_order_created_at",
  "product_master_id",
  "product_master_type",
  "product_master_status",
] as const;

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
  canEdit: boolean;
}): Record<string, ReferenceNextFormFieldUi> => {
  const { canEdit } = input;

  return Object.fromEntries(
    Object.entries(referenceNextFormFieldSemantics).map(([name, definition]) => {
      const isEditable = definition.isEditableWhenOpen && canEdit;
      const isReadOnly = !isEditable;
      const emptyValueLabel = "emptyValueLabel" in definition ? definition.emptyValueLabel : undefined;
      const helpText = "helpText" in definition ? definition.helpText : undefined;

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
      }];
    }),
  );
};

export const buildReferenceNextFormActionUi = (input: {
  canEdit: boolean;
}): Record<string, ReferenceNextFormActionUi> => {
  const { canEdit } = input;

  return Object.fromEntries(
    Object.entries(referenceNextFormActionSemantics).map(([name, definition]) => [
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
  fieldValues: Record<string, string>;
}): ReferenceNextFormMasterDataSection[] => {
  const { fieldValues } = input;
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
};
