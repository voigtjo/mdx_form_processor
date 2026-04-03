export type NextFormPropertyMap = Record<string, string | boolean>;

export const nextFormControlTypes = [
  "text",
  "date",
  "textarea",
  "number",
  "select",
  "action",
  "lookup",
] as const;

export type NextFormControlType = (typeof nextFormControlTypes)[number];
export type NextFormElementKind = "field" | "action" | "lookup";
export type NextFormFieldControlType = Exclude<NextFormControlType, "action" | "lookup">;

export type NextFormElement = {
  kind: NextFormElementKind;
  controlType: NextFormControlType;
  name: string;
  label?: string;
  properties: NextFormPropertyMap;
  ref?: string;
  args?: string[];
  bind?: string[];
};

export type NextFormSlot = {
  source: string;
  element: NextFormElement;
};

export type NextFormRow = {
  source: string;
  slots: NextFormSlot[];
};

export type NextFormSection = {
  title: string;
  rows: NextFormRow[];
};

export type NextFormMeta = {
  title: string;
  key: string;
  version: string;
};

export type NextFormDefinition = {
  meta: NextFormMeta;
  source: string;
  sections: NextFormSection[];
  controls: NextFormElement[];
  actions: NextFormElement[];
};
