import type { ReadOnlyJournalDefinition, ReadOnlyJournalEntry } from "../../types/domain.js";

export const referenceFormRuntimeJournalFieldName = "work_journal";

const normalizeExistingJournalEntries = (value: unknown): ReadOnlyJournalEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry))
    .map((entry) => ({
      values: {
        at: typeof entry.at === "string" ? entry.at : "",
        text: typeof entry.text === "string" ? entry.text : "",
        by: typeof entry.by === "string" ? entry.by : "",
      },
    }));
};

export const buildReferenceFormRuntimeJournalDefinition = (input: {
  documentData: Record<string, unknown>;
  isEditable: boolean;
}): ReadOnlyJournalDefinition => {
  return {
    name: referenceFormRuntimeJournalFieldName,
    label: "Nachrichten",
    helpText: "Separater Dokumentbereich ausserhalb des Formulars. Abgesendete Nachrichten bleiben unveraenderlich bestehen.",
    columns: [
      { key: "at", label: "At", type: "text" },
      { key: "text", label: "Entry", type: "text" },
      { key: "by", label: "By", type: "text" },
    ],
    entries: normalizeExistingJournalEntries(input.documentData[referenceFormRuntimeJournalFieldName]),
    isEditable: input.isEditable,
  };
};
