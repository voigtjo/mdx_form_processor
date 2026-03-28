export const nextFormModule = {
  name: "next-form",
  purpose: "Isolierter Parallel-Slice fuer das vereinfachte Formmodell der naechsten Richtung.",
};

export {
  parseNextFormSource,
  readNextFormFile,
  readReferenceCraftsmanOrderForm,
  referenceCraftsmanOrderFormPath,
} from "./read.js";
export type {
  NextFormElement,
  NextFormElementKind,
  NextFormDefinition,
  NextFormMeta,
  NextFormPropertyMap,
  NextFormRow,
  NextFormSection,
  NextFormSlot,
} from "./types.js";
