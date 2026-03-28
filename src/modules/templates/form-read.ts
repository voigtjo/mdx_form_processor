import type { ReadOnlyFormAction, ReadOnlyFormDefinition, ReadOnlyFormField, WorkflowFieldRules } from "../../types/domain.js";

const savableFieldTypes = new Set(["text", "textarea", "checkboxGroup"]);
const lockedDocumentStatuses = new Set(["submitted", "approved", "rejected", "archived"]);

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
    actions: parseActions(body),
  };
};
