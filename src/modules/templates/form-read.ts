import type {
  ReadOnlyFormAction,
  ReadOnlyFormDefinition,
  ReadOnlyFormField,
  ReadOnlyJournalColumn,
  ReadOnlyJournalDefinition,
  ReadOnlyJournalEntry,
  WorkflowFieldRules,
} from "../../types/domain.js";

const savableFieldTypes = new Set(["text", "textarea", "checkboxGroup"]);
const lockedDocumentStatuses = new Set(["submitted", "approved", "rejected", "archived"]);
const defaultJournalColumnLabels: Record<string, string> = {
  at: "At",
  text: "Entry",
  by: "By",
};

const extractFrontmatter = (mdxBody: string): { meta: Record<string, string>; body: string } => {
  const match = mdxBody.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);

  if (!match) {
    return {
      meta: {},
      body: mdxBody,
    };
  }

  const meta: Record<string, string> = {};
  const frontmatter = match[1] ?? "";

  for (const line of frontmatter.split("\n")) {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key) {
      meta[key] = value;
    }
  }

  return {
    meta,
    body: mdxBody.slice(match[0].length),
  };
};

const readQuotedAttribute = (source: string, attribute: string): string | undefined => {
  const match = source.match(new RegExp(`${attribute}="([^"]+)"`));
  return match?.[1];
};

const readArrayAttribute = (source: string, attribute: string): string[] | undefined => {
  const match = source.match(new RegExp(`${attribute}=\\{\\[([^\\]]*)\\]\\}`));
  const raw = match?.[1];

  if (!raw) {
    return undefined;
  }

  const values = raw
    .split(",")
    .map((part) => part.trim().replace(/^"(.*)"$/, "$1"))
    .filter((value) => value.length > 0);

  return values.length > 0 ? values : undefined;
};

const hasBooleanAttribute = (source: string, attribute: string): boolean => {
  return new RegExp(`(^|\\s)${attribute}(\\s|$|[/>])`).test(source);
};

const isEditableForStatus = (input: {
  documentStatus: string;
  fieldName: string;
  editableIn?: string[];
  readonlyIn?: string[];
  workflowFieldRules?: WorkflowFieldRules;
}): boolean => {
  const { documentStatus, fieldName, editableIn, readonlyIn, workflowFieldRules } = input;

  if (editableIn && editableIn.length > 0) {
    return editableIn.includes(documentStatus);
  }

  if (readonlyIn && readonlyIn.length > 0) {
    return !readonlyIn.includes(documentStatus);
  }

  const statusRule = workflowFieldRules?.[documentStatus];

  if (statusRule?.editable?.includes(fieldName)) {
    return true;
  }

  if (statusRule?.readonly?.includes(fieldName)) {
    return false;
  }

  if (lockedDocumentStatuses.has(documentStatus)) {
    return false;
  }

  return true;
};

export const isFieldSavableInStatus = (
  field: Pick<ReadOnlyFormField, "name" | "type" | "editableIn" | "readonlyIn">,
  documentStatus: string,
  workflowFieldRules?: WorkflowFieldRules,
): boolean => {
  return (
    savableFieldTypes.has(field.type)
    && isEditableForStatus({
      documentStatus,
      fieldName: field.name,
      ...(field.editableIn ? { editableIn: field.editableIn } : {}),
      ...(field.readonlyIn ? { readonlyIn: field.readonlyIn } : {}),
      ...(workflowFieldRules ? { workflowFieldRules } : {}),
    })
  );
};

const readCurrentValue = (data: Record<string, unknown>, name: string): string | string[] | undefined => {
  const value = data[name];

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const stringValues = value.filter((entry): entry is string => typeof entry === "string");
    return stringValues;
  }

  return undefined;
};

const parseField = (
  source: string,
  context: {
    documentStatus: string;
    documentData: Record<string, unknown>;
    workflowFieldRules?: WorkflowFieldRules;
  },
): ReadOnlyFormField | null => {
  const name = readQuotedAttribute(source, "name");
  const type = readQuotedAttribute(source, "type");
  const label = readQuotedAttribute(source, "label");

  if (!name || !type || !label) {
    return null;
  }

  const flags = [
    hasBooleanAttribute(source, "required") ? "required" : null,
    hasBooleanAttribute(source, "templateKey") ? "templateKey" : null,
    hasBooleanAttribute(source, "documentKey") ? "documentKey" : null,
    hasBooleanAttribute(source, "tableField") ? "tableField" : null,
  ].filter((value): value is string => value !== null);
  const operationRef = readQuotedAttribute(source, "operationRef");
  const helpText = readQuotedAttribute(source, "helpText");
  const options = readArrayAttribute(source, "options");
  const editableIn = readArrayAttribute(source, "editableIn");
  const readonlyIn = readArrayAttribute(source, "readonlyIn");
  const currentValue = readCurrentValue(context.documentData, name);
  const isEditable = isEditableForStatus({
    documentStatus: context.documentStatus,
    fieldName: name,
    ...(editableIn ? { editableIn } : {}),
    ...(readonlyIn ? { readonlyIn } : {}),
    ...(context.workflowFieldRules ? { workflowFieldRules: context.workflowFieldRules } : {}),
  });
  const isSavable = isFieldSavableInStatus(
    {
      name,
      type,
      ...(editableIn ? { editableIn } : {}),
      ...(readonlyIn ? { readonlyIn } : {}),
    },
    context.documentStatus,
    context.workflowFieldRules,
  );

  return {
    name,
    type,
    label,
    ...(operationRef ? { operationRef } : {}),
    ...(helpText ? { helpText } : {}),
    flags,
    ...(options ? { options } : {}),
    ...(editableIn ? { editableIn } : {}),
    ...(readonlyIn ? { readonlyIn } : {}),
    ...(currentValue !== undefined ? { currentValue } : {}),
    isEditable,
    isSavable,
  };
};

const parseAction = (source: string): ReadOnlyFormAction | null => {
  const name = readQuotedAttribute(source, "name");

  if (!name) {
    return null;
  }
  const label = readQuotedAttribute(source, "label");
  const operationRef = readQuotedAttribute(source, "operationRef");

  return {
    name,
    ...(label ? { label } : {}),
    ...(operationRef ? { operationRef } : {}),
  };
};

const parseSections = (mdxBody: string): string[] => {
  return [...mdxBody.matchAll(/<Section\s+title="([^"]+)"/g)].flatMap((match) => {
    const title = match[1];
    return title ? [title] : [];
  });
};

const parseFields = (
  mdxBody: string,
  context: {
    documentStatus: string;
    documentData: Record<string, unknown>;
    workflowFieldRules?: WorkflowFieldRules;
  },
): ReadOnlyFormField[] => {
  return [...mdxBody.matchAll(/<Field\s+([\s\S]*?)\/>/g)]
    .flatMap((match) => {
      const source = match[1];
      return source ? [source] : [];
    })
    .map((source) => parseField(source, context))
    .filter((value): value is ReadOnlyFormField => value !== null);
};

const parseActions = (mdxBody: string): ReadOnlyFormAction[] => {
  return [...mdxBody.matchAll(/<Action\s+([\s\S]*?)\/>/g)]
    .flatMap((match) => {
      const source = match[1];
      return source ? [source] : [];
    })
    .map((source) => parseAction(source))
    .filter((value): value is ReadOnlyFormAction => value !== null);
};

const parseColumnDefs = (source: string): ReadOnlyJournalColumn[] => {
  return [...source.matchAll(/<ColumnDef\s+([\s\S]*?)\/>/g)]
    .flatMap((match) => {
      const columnSource = match[1];
      return columnSource ? [columnSource] : [];
    })
    .flatMap((columnSource) => {
      const key = readQuotedAttribute(columnSource, "key");
      const label = readQuotedAttribute(columnSource, "label");
      const type = readQuotedAttribute(columnSource, "type");

      if (!key) {
        return [];
      }

      return [
        {
          key,
          label: label ?? defaultJournalColumnLabels[key] ?? key,
          type: type ?? "text",
        },
      ];
    });
};

const parseJournalEntries = (value: unknown): ReadOnlyJournalEntry[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (typeof entry === "string") {
      return [
        {
          values: {
            text: entry,
          },
        },
      ];
    }

    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return [];
    }

    const values = Object.entries(entry).reduce<Record<string, string>>((result, [key, rawValue]) => {
      if (typeof rawValue === "string") {
        result[key] = rawValue;
        return result;
      }

      if (typeof rawValue === "number" || typeof rawValue === "boolean") {
        result[key] = String(rawValue);
      }

      return result;
    }, {});

    return Object.keys(values).length > 0 ? [{ values }] : [];
  });
};

const deriveJournalColumns = (entries: ReadOnlyJournalEntry[]): ReadOnlyJournalColumn[] => {
  const seenKeys = new Set<string>();

  for (const preferredKey of ["at", "text", "by"]) {
    if (entries.some((entry) => preferredKey in entry.values)) {
      seenKeys.add(preferredKey);
    }
  }

  for (const entry of entries) {
    for (const key of Object.keys(entry.values)) {
      seenKeys.add(key);
    }
  }

  if (seenKeys.size === 0) {
    return [
      { key: "at", label: "At", type: "text" },
      { key: "text", label: "Entry", type: "text" },
    ];
  }

  return Array.from(seenKeys).map((key) => ({
    key,
    label: defaultJournalColumnLabels[key] ?? key,
    type: "text",
  }));
};

const parseJournals = (
  mdxBody: string,
  context: {
    documentStatus: string;
    documentData: Record<string, unknown>;
    workflowFieldRules?: WorkflowFieldRules;
  },
): ReadOnlyJournalDefinition[] => {
  const journals: ReadOnlyJournalDefinition[] = [];
  const seenNames = new Set<string>();

  for (const match of mdxBody.matchAll(/<Field\s+([^>]*type="journal"[^>]*)>([\s\S]*?)<\/Field>/g)) {
    const source = match[1];
    const innerSource = match[2] ?? "";
    const name = source ? readQuotedAttribute(source, "name") : undefined;
    const label = source ? readQuotedAttribute(source, "label") : undefined;

    if (!source || !name || !label || seenNames.has(name)) {
      continue;
    }

    const editableIn = readArrayAttribute(source, "editableIn");
    const readonlyIn = readArrayAttribute(source, "readonlyIn");
    const helpText = readQuotedAttribute(source, "helpText");
    const entries = parseJournalEntries(context.documentData[name]);
    const columns = parseColumnDefs(innerSource);

    journals.push({
      name,
      label,
      ...(helpText ? { helpText } : {}),
      columns: columns.length > 0 ? columns : deriveJournalColumns(entries),
      entries,
      isEditable: isEditableForStatus({
        documentStatus: context.documentStatus,
        fieldName: name,
        ...(editableIn ? { editableIn } : {}),
        ...(readonlyIn ? { readonlyIn } : {}),
        ...(context.workflowFieldRules ? { workflowFieldRules: context.workflowFieldRules } : {}),
      }),
    });
    seenNames.add(name);
  }

  for (const match of mdxBody.matchAll(/<Field\s+([^>]*type="journal"[^>]*)\/>/g)) {
    const source = match[1];
    const name = source ? readQuotedAttribute(source, "name") : undefined;
    const label = source ? readQuotedAttribute(source, "label") : undefined;

    if (!source || !name || !label || seenNames.has(name)) {
      continue;
    }

    const editableIn = readArrayAttribute(source, "editableIn");
    const readonlyIn = readArrayAttribute(source, "readonlyIn");
    const helpText = readQuotedAttribute(source, "helpText");
    const entries = parseJournalEntries(context.documentData[name]);

    journals.push({
      name,
      label,
      ...(helpText ? { helpText } : {}),
      columns: deriveJournalColumns(entries),
      entries,
      isEditable: isEditableForStatus({
        documentStatus: context.documentStatus,
        fieldName: name,
        ...(editableIn ? { editableIn } : {}),
        ...(readonlyIn ? { readonlyIn } : {}),
        ...(context.workflowFieldRules ? { workflowFieldRules: context.workflowFieldRules } : {}),
      }),
    });
    seenNames.add(name);
  }

  return journals;
};

export const buildReadOnlyFormDefinition = (input: {
  templateId: string;
  templateKey: string;
  templateName: string;
  templateVersion: number;
  templateStatus: ReadOnlyFormDefinition["templateStatus"];
  templateDescription?: string;
  mdxBody: string;
  documentStatus: string;
  documentData: Record<string, unknown>;
  workflowFieldRules?: WorkflowFieldRules;
}): ReadOnlyFormDefinition => {
  const { meta, body } = extractFrontmatter(input.mdxBody);

  return {
    templateId: input.templateId,
    templateKey: input.templateKey,
    templateName: input.templateName,
    templateVersion: input.templateVersion,
    templateStatus: input.templateStatus,
    ...(input.templateDescription ? { templateDescription: input.templateDescription } : {}),
    mdxBody: input.mdxBody.trim(),
    sourceMeta: meta,
    sections: parseSections(body),
    fields: parseFields(body, {
      documentStatus: input.documentStatus,
      documentData: input.documentData,
      ...(input.workflowFieldRules ? { workflowFieldRules: input.workflowFieldRules } : {}),
    }),
    journals: parseJournals(body, {
      documentStatus: input.documentStatus,
      documentData: input.documentData,
      ...(input.workflowFieldRules ? { workflowFieldRules: input.workflowFieldRules } : {}),
    }),
    actions: parseActions(body),
  };
};
