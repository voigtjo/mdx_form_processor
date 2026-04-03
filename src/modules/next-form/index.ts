export const nextFormModule = {
  name: "next-form",
  purpose: "Isolierter Parallel-Slice fuer das vereinfachte Formmodell der naechsten Richtung.",
};

export { executeLoadCustomerAction } from "./load-customer.js";
export { executeSuggestMaterialAction } from "./suggest-material.js";
export { loadNextFormState, nextFormSavedStatePath, saveNextFormState } from "./state-store.js";
export {
  isNextFormReferenceTemplate,
  mapDocumentDataToNextFormValues,
  mergeNextFormValuesIntoDocumentData,
} from "./document-bridge.js";
export {
  parseNextFormSource,
  readNextFormFile,
  readReferenceCraftsmanOrderForm,
  referenceCraftsmanOrderFormPath,
} from "./read.js";
export type { NextFormActionState, NextFormFieldValues } from "./load-customer.js";
export type { NextFormSavedState } from "./state-store.js";
export type {
  NextFormControlType,
  NextFormElement,
  NextFormElementKind,
  NextFormFieldControlType,
  NextFormDefinition,
  NextFormMeta,
  NextFormPropertyMap,
  NextFormRow,
  NextFormSection,
  NextFormSlot,
} from "./types.js";
export { nextFormControlTypes } from "./types.js";
