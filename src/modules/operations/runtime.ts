import ts from "typescript";
import { findActiveReferenceEntityByDataField, listReferenceEntities } from "../entities/read.js";
import { richTextHtmlToPlainText } from "../forms/rich-text.js";
import type { FormRuntimeActionState, FormRuntimeElement, FormRuntimeFieldValues } from "../forms/types.js";
import { findOperationByKey } from "./read.js";

export type OperationExecutionInput = {
  action: FormRuntimeElement;
  fieldValues: FormRuntimeFieldValues;
  documentId?: string;
  userId?: string;
  templateKey?: string;
};

export type OperationExecutionResult = {
  fieldValues: FormRuntimeFieldValues;
  actionState: FormRuntimeActionState;
};

type OperationHandler = (
  input: OperationExecutionInput,
  runtime: OperationRuntimeHelpers,
) => Promise<OperationExecutionResult> | OperationExecutionResult;

type OperationRuntimeHelpers = {
  findActiveReferenceEntityByDataField: typeof findActiveReferenceEntityByDataField;
  listReferenceEntities: typeof listReferenceEntities;
  richTextHtmlToPlainText: typeof richTextHtmlToPlainText;
  createInfoActionState: (input: { title: string; message: string; actionName: string }) => FormRuntimeActionState;
  createErrorActionState: (input: { title: string; message: string; actionName: string }) => FormRuntimeActionState;
};

type CompiledHandlerRecord = {
  cacheKey: string;
  handler: OperationHandler;
};

const compiledHandlerCache = new Map<string, CompiledHandlerRecord>();

const operationRuntimeHelpers: OperationRuntimeHelpers = {
  findActiveReferenceEntityByDataField,
  listReferenceEntities,
  richTextHtmlToPlainText,
  createInfoActionState: ({ title, message, actionName }) => ({
    type: "info",
    title,
    message,
    actionName,
  }),
  createErrorActionState: ({ title, message, actionName }) => ({
    type: "error",
    title,
    message,
    actionName,
  }),
};

const extractHandlerExport = (moduleExports: Record<string, unknown>): OperationHandler => {
  const directHandler = typeof moduleExports.handler === "function" ? moduleExports.handler : undefined;
  const defaultHandler = typeof moduleExports.default === "function" ? moduleExports.default : undefined;
  const exportedHandler = defaultHandler ?? directHandler;

  if (!exportedHandler) {
    throw new Error("Handler Source muss `export default async function ...` oder `export const handler = ...` bereitstellen.");
  }

  return exportedHandler as OperationHandler;
};

export const transpileOperationHandlerSource = (source: string): string => {
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });

  const diagnostics = result.diagnostics ?? [];

  if (diagnostics.length > 0) {
    const message = diagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
      .join("\n");
    throw new Error(`Handler Source konnte nicht transpiliert werden.\n${message}`);
  }

  return result.outputText;
};

const compileOperationHandler = (source: string): OperationHandler => {
  const transpiledSource = transpileOperationHandlerSource(source);
  const module = { exports: {} as Record<string, unknown> };
  const evaluator = new Function(
    "module",
    "exports",
    `${transpiledSource}\nreturn module.exports;`,
  ) as (module: { exports: Record<string, unknown> }, exports: Record<string, unknown>) => Record<string, unknown>;

  const moduleExports = evaluator(module, module.exports);
  return extractHandlerExport(moduleExports);
};

const loadCompiledHandler = (input: { operationId: string; updatedAt: string; handlerTsSource: string }): OperationHandler => {
  const cacheKey = `${input.operationId}:${input.updatedAt}`;
  const cached = compiledHandlerCache.get(input.operationId);

  if (cached && cached.cacheKey === cacheKey) {
    return cached.handler;
  }

  const compiledHandler = compileOperationHandler(input.handlerTsSource);
  compiledHandlerCache.set(input.operationId, {
    cacheKey,
    handler: compiledHandler,
  });
  return compiledHandler;
};

export const executePublishedOperationByKey = async (input: {
  operationKey: string;
  executionInput: OperationExecutionInput;
}): Promise<OperationExecutionResult> => {
  const operation = await findOperationByKey(input.operationKey, {
    publishedOnly: true,
  });

  if (!operation) {
    throw new Error(`Die publizierte API ${input.operationKey} wurde nicht gefunden.`);
  }

  const handler = loadCompiledHandler({
    operationId: operation.id,
    updatedAt: operation.updatedAt,
    handlerTsSource: operation.handlerTsSource,
  });

  return handler(input.executionInput, operationRuntimeHelpers);
};
