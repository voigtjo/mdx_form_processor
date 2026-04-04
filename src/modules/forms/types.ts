export type FormRuntimePropertyMap = Record<string, string | boolean>;
export type FormRuntimeFieldValues = Record<string, string>;

export type FormRuntimeActionState = {
  type: "info" | "error";
  title: string;
  message: string;
  actionName: string;
};

export const formRuntimeControlTypes = [
  "text",
  "date",
  "textarea",
  "html-editor",
  "grid",
  "number",
  "select",
  "radio-group",
  "checkbox-group",
  "user-select",
  "user-multiselect",
  "signature",
  "action",
  "lookup",
] as const;

export type FormRuntimeControlType = (typeof formRuntimeControlTypes)[number];
export type FormRuntimeElementKind = "field" | "action" | "lookup";
export type FormRuntimeFieldControlType = Exclude<FormRuntimeControlType, "action" | "lookup">;

export type FormRuntimeElement = {
  kind: FormRuntimeElementKind;
  controlType: FormRuntimeControlType;
  name: string;
  label?: string;
  properties: FormRuntimePropertyMap;
  ref?: string;
  args?: string[];
  bind?: string[];
};

export type FormRuntimeSlot = {
  source: string;
  element: FormRuntimeElement;
};

export type FormRuntimeRow = {
  source: string;
  slots: FormRuntimeSlot[];
};

export type FormRuntimeSection = {
  title: string;
  rows: FormRuntimeRow[];
};

export type FormRuntimeMeta = {
  title: string;
  key: string;
  version: string;
};

export type FormRuntimeDefinition = {
  meta: FormRuntimeMeta;
  source: string;
  sections: FormRuntimeSection[];
  controls: FormRuntimeElement[];
  actions: FormRuntimeElement[];
};
