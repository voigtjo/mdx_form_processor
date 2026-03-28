export type NextFormPropertyMap = Record<string, string | boolean>;

export type NextFormElementKind = "field" | "action" | "lookup";

export type NextFormElement = {
  kind: NextFormElementKind;
  controlType: string;
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
