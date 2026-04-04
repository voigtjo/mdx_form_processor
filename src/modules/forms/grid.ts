export type FormRuntimeGridColumn = {
  name: string;
  label: string;
  inputMode: "text" | "number";
};

export type FormRuntimeGridRow = Record<string, string>;

const normalizeText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const splitPipeSeparated = (value: string): string[] =>
  value
    .split("|")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const splitCommaSeparated = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

export const parseFormRuntimeGridColumns = (input: {
  columnsText?: string | undefined;
  numberColumnsText?: string | undefined;
}): FormRuntimeGridColumn[] => {
  const columnDefinitions = splitPipeSeparated(input.columnsText ?? "");
  const numberColumns = new Set(splitCommaSeparated(input.numberColumnsText));

  return columnDefinitions
    .map((definition) => {
      const [namePart, labelPart] = definition.split(":");
      const name = normalizeText(namePart);
      const label = normalizeText(labelPart) || name;

      if (!name) {
        return null;
      }

      return {
        name,
        label,
        inputMode: numberColumns.has(name) ? "number" : "text",
      } satisfies FormRuntimeGridColumn;
    })
    .filter((entry): entry is FormRuntimeGridColumn => entry !== null);
};

export const readFormRuntimeGridMinRows = (rawValue: unknown, fallback = 3): number => {
  const parsed = Number.parseInt(normalizeText(rawValue), 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

export const parseFormRuntimeGridRows = (input: {
  value: unknown;
  columns: FormRuntimeGridColumn[];
}): FormRuntimeGridRow[] => {
  const { value, columns } = input;
  const columnNames = columns.map((column) => column.name);

  let candidate: unknown = value;

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return [];
    }

    try {
      candidate = JSON.parse(trimmed);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(candidate)) {
    return [];
  }

  return candidate
    .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
    .map((row) => Object.fromEntries(
      columnNames.map((columnName) => [columnName, normalizeText(row[columnName])]),
    ))
    .filter((row) => Object.values(row).some((valueText) => valueText.length > 0));
};

export const serializeFormRuntimeGridRows = (input: {
  rows: FormRuntimeGridRow[];
  columns: FormRuntimeGridColumn[];
}): string => {
  const sanitizedRows = input.rows
    .map((row) => Object.fromEntries(
      input.columns.map((column) => [column.name, normalizeText(row[column.name])]),
    ))
    .filter((row) => Object.values(row).some((valueText) => valueText.length > 0));

  return JSON.stringify(sanitizedRows);
};

export const hasVisibleFormRuntimeGridRows = (input: {
  value: unknown;
  columns: FormRuntimeGridColumn[];
}): boolean => parseFormRuntimeGridRows(input).length > 0;
