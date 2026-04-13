import type { FormRuntimeApiDefinition, FormRuntimeDefinition } from "./types.js";
import { parseFormRuntimeSource } from "./read.js";

export type FormRuntimeApiBinding = {
  actionName: string;
  authoredName?: string;
  label: string;
  controlType: "action" | "lookup";
  operationRef?: string;
  args?: string[];
  bind?: string[];
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listFormRuntimeApiBindings = (parsedForm: FormRuntimeDefinition): FormRuntimeApiBinding[] => {
  return parsedForm.actions.map((action) => ({
    actionName: action.name,
    ...(action.authoredName ? { authoredName: action.authoredName } : {}),
    label: action.label ?? action.name,
    controlType: action.controlType === "lookup" ? "lookup" : "action",
    ...(action.ref ? { operationRef: action.ref } : {}),
    ...(action.args ? { args: action.args } : {}),
    ...(action.bind ? { bind: action.bind } : {}),
  }));
};

export const listFormRuntimeApiDefinitions = (parsedForm: FormRuntimeDefinition): FormRuntimeApiDefinition[] => {
  const definitions: FormRuntimeApiDefinition[] = [];
  const seenRefs = new Set<string>();

  for (const action of parsedForm.actions) {
    if (!action.ref || seenRefs.has(action.ref)) {
      continue;
    }

    seenRefs.add(action.ref);
    definitions.push({
      ref: action.ref,
      ...(action.args && action.args.length > 0 ? { request: action.args } : {}),
      ...(action.bind && action.bind.length > 0 ? { response: action.bind } : {}),
    });
  }

  return definitions;
};

const splitPropertyList = (source: string): string[] => {
  const parts: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const character of source) {
    if (character === "\"") {
      inQuotes = !inQuotes;
      current += character;
      continue;
    }

    if (character === "," && !inQuotes) {
      const part = current.trim();

      if (part.length > 0) {
        parts.push(part);
      }

      current = "";
      continue;
    }

    current += character;
  }

  const finalPart = current.trim();

  if (finalPart.length > 0) {
    parts.push(finalPart);
  }

  return parts;
};

const replaceFirstExact = (source: string, needle: string, replacement: string): string => {
  const startIndex = source.indexOf(needle);

  if (startIndex < 0) {
    return source;
  }

  return source.slice(0, startIndex) + replacement + source.slice(startIndex + needle.length);
};

const rewriteActionSlotSource = (input: {
  slotSource: string;
  actionName: string;
  operationRef: string;
  authoredName?: string;
}): string => {
  const match = input.slotSource.match(/^(.+?):\s*([a-zA-Z][a-zA-Z0-9_-]*)\((.*)\)$/);

  if (!match) {
    return input.slotSource;
  }

  const rawLabel = match[1]?.trim() ?? "";
  const controlType = match[2]?.trim() ?? "action";
  const rawArgs = match[3]?.trim() ?? "";
  const propertyTokens = splitPropertyList(rawArgs);
  const hasExplicitName = Boolean(input.authoredName) && propertyTokens[0] === input.authoredName;

  if (hasExplicitName) {
    propertyTokens.shift();
  }

  const nextPropertyTokens = propertyTokens.filter((token) => !/^ref="[^"]*"$/.test(token));
  const normalizedOperationRef = input.operationRef.trim();

  if (normalizedOperationRef) {
    nextPropertyTokens.push(`ref="${normalizedOperationRef}"`);
  }

  const nextArgs = [
    ...(input.authoredName ? [input.authoredName] : []),
    ...nextPropertyTokens,
  ];

  return `${rawLabel}: ${controlType}(${nextArgs.join(", ")})`;
};

export const applyFormRuntimeApiBindings = (input: {
  sourceText: string;
  bindings: Record<string, string>;
}): string => {
  let nextSource = input.sourceText;
  let parsedForm: FormRuntimeDefinition;

  try {
    parsedForm = parseFormRuntimeSource(input.sourceText);
  } catch {
    return nextSource;
  }

  const actionsByName = new Map(parsedForm.actions.map((action) => [action.name, action] as const));

  for (const [actionName, operationRef] of Object.entries(input.bindings)) {
    const action = actionsByName.get(actionName);

    if (!action?.sourceText) {
      continue;
    }

    const nextSlotSource = rewriteActionSlotSource({
      slotSource: action.sourceText,
      actionName,
      operationRef,
      ...(action.authoredName ? { authoredName: action.authoredName } : {}),
    });

    nextSource = replaceFirstExact(nextSource, action.sourceText, nextSlotSource);
  }

  return nextSource;
};

export const normalizeFormRuntimeApiActionCalls = (input: {
  sourceText: string;
  parsedForm?: FormRuntimeDefinition;
}): string => {
  const parsedForm = input.parsedForm ?? (() => {
    try {
      return parseFormRuntimeSource(input.sourceText);
    } catch {
      return null;
    }
  })();

  if (!parsedForm) {
    return input.sourceText;
  }

  let nextSource = input.sourceText;

  for (const action of parsedForm.actions) {
    if (!action.sourceText || !action.ref) {
      continue;
    }

    const propertyKeys = Object.keys(action.properties);
    const onlyApiBindingProperties = propertyKeys.every((key) => ["ref", "args", "bind", "request", "response"].includes(key));

    if (!onlyApiBindingProperties) {
      continue;
    }

    const normalizedSlotSource = `${action.label ?? action.name}: ${action.controlType}("${action.ref}")`;
    nextSource = replaceFirstExact(nextSource, action.sourceText, normalizedSlotSource);
  }

  return nextSource;
};
