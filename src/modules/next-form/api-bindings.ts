import type { NextFormDefinition } from "./types.js";

export type NextFormApiBinding = {
  actionName: string;
  label: string;
  controlType: "action" | "lookup";
  operationRef?: string;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const listNextFormApiBindings = (parsedForm: NextFormDefinition): NextFormApiBinding[] => {
  return parsedForm.actions.map((action) => ({
    actionName: action.name,
    label: action.label ?? action.name,
    controlType: action.controlType === "lookup" ? "lookup" : "action",
    ...(action.ref ? { operationRef: action.ref } : {}),
  }));
};

const replaceRefInActionSource = (source: string, actionName: string, operationRef: string): string => {
  const actionPattern = new RegExp(
    `\\b(action|lookup)\\(${escapeRegExp(actionName)}((?:[^"\\)]|"[^"]*")*)\\)`,
    "g",
  );

  return source.replace(actionPattern, (match, controlType, rawArgs) => {
    const argsText = typeof rawArgs === "string" ? rawArgs : "";
    const nextArgs = /(?:^|,\s*)ref="/.test(argsText)
      ? argsText.replace(/ref="[^"]*"/, `ref="${operationRef}"`)
      : `${argsText.trim().length > 0 ? `${argsText}, ` : ", "}ref=\"${operationRef}\"`;

    return `${controlType}(${actionName}${nextArgs})`;
  });
};

const removeRefFromActionSource = (source: string, actionName: string): string => {
  const actionPattern = new RegExp(
    `\\b(action|lookup)\\(${escapeRegExp(actionName)}((?:[^"\\)]|"[^"]*")*)\\)`,
    "g",
  );

  return source.replace(actionPattern, (match, controlType, rawArgs) => {
    const argsText = typeof rawArgs === "string" ? rawArgs : "";
    const nextArgs = argsText
      .replace(/,\s*ref="[^"]*"/, "")
      .replace(/ref="[^"]*"\s*,\s*/, ", ")
      .replace(/ref="[^"]*"/, "");

    return `${controlType}(${actionName}${nextArgs})`;
  });
};

export const applyNextFormApiBindings = (input: {
  sourceText: string;
  bindings: Record<string, string>;
}): string => {
  let nextSource = input.sourceText;

  for (const [actionName, operationRef] of Object.entries(input.bindings)) {
    const normalizedOperationRef = operationRef.trim();

    nextSource = normalizedOperationRef
      ? replaceRefInActionSource(nextSource, actionName, normalizedOperationRef)
      : removeRefFromActionSource(nextSource, actionName);
  }

  return nextSource;
};
