export const formRuntimeModule = {
  name: "forms",
  purpose: "Formularruntime fuer das .form.md-Modell im normalen Produktpfad.",
};

export {
  hasVisibleFormRuntimeGridRows,
  parseFormRuntimeGridColumns,
  parseFormRuntimeGridRows,
  readFormRuntimeGridMinRows,
  serializeFormRuntimeGridRows,
} from "./grid.js";
export {
  isFormRuntimeReferenceTemplate,
  mapDocumentDataToFormRuntimeValues,
  mergeFormRuntimeValuesIntoDocumentData,
} from "./document-bridge.js";
export {
  parseFormRuntimeSource,
  readFormRuntimeFile,
  readReferenceCustomerOrderForm,
  referenceCustomerOrderFormPath,
} from "./read.js";
export type { FormRuntimeGridColumn, FormRuntimeGridRow } from "./grid.js";
export type {
  FormRuntimeActionState,
  FormRuntimeControlType,
  FormRuntimeElement,
  FormRuntimeElementKind,
  FormRuntimeFieldValues,
  FormRuntimeFieldControlType,
  FormRuntimeDefinition,
  FormRuntimeMeta,
  FormRuntimePropertyMap,
  FormRuntimeRow,
  FormRuntimeSection,
  FormRuntimeSlot,
} from "./types.js";
export { formRuntimeControlTypes } from "./types.js";
