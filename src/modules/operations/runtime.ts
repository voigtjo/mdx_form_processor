import ts from "typescript";
import { env } from "../../config/env.js";
import { findActiveReferenceEntityByDataField, listReferenceEntities } from "../entities/read.js";
import { richTextHtmlToPlainText } from "../forms/rich-text.js";
import type { FormRuntimeActionState, FormRuntimeElement, FormRuntimeFieldValues } from "../forms/types.js";
import { findOperationByKey } from "./read.js";
import { createOperationScriptApi, type OperationScriptApi } from "./script-api.js";

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

export type ApiExecutionContext = {
  action: FormRuntimeElement;
  fields: FormRuntimeFieldValues;
  documentId?: string;
  userId?: string;
  templateKey?: string;
  erpSimBaseUrl: string;
  fetchJson: OperationRuntimeHelpers["fetchJson"];
  getField: (name: string) => string;
  setField: (name: string, value: unknown) => ApiExecutionContext;
  setFields: (values: Record<string, unknown>) => ApiExecutionContext;
  setJsonField: (name: string, value: unknown) => ApiExecutionContext;
  setOptionsField: (name: string, options: Array<{ value: string; label: string }>) => ApiExecutionContext;
  info: (title: string, message: string) => OperationExecutionResult;
  error: (title: string, message: string) => OperationExecutionResult;
  result: (actionState: FormRuntimeActionState) => OperationExecutionResult;
};

type OperationHandler = (
  input: OperationExecutionInput,
  runtime: OperationRuntimeHelpers,
) => Promise<OperationExecutionResult> | OperationExecutionResult;

type OperationRuntimeHelpers = {
  findActiveReferenceEntityByDataField: typeof findActiveReferenceEntityByDataField;
  listReferenceEntities: typeof listReferenceEntities;
  richTextHtmlToPlainText: typeof richTextHtmlToPlainText;
  erpSimBaseUrl: string;
  fetchJson: (input: { url: string; init?: RequestInit }) => Promise<unknown>;
  createInfoActionState: (input: { title: string; message: string; actionName: string }) => FormRuntimeActionState;
  createErrorActionState: (input: { title: string; message: string; actionName: string }) => FormRuntimeActionState;
  createApiContext: (input: OperationExecutionInput) => ApiExecutionContext;
  createScriptApi: (input: OperationExecutionInput) => OperationScriptApi;
};

type CompiledHandlerRecord = {
  cacheKey: string;
  handler: OperationHandler;
};

const compiledHandlerCache = new Map<string, CompiledHandlerRecord>();

type OperationRuntimeOverrides = Partial<Pick<
  OperationRuntimeHelpers,
  "findActiveReferenceEntityByDataField" | "listReferenceEntities" | "richTextHtmlToPlainText" | "erpSimBaseUrl" | "fetchJson"
>>;

const defaultFetchJson: OperationRuntimeHelpers["fetchJson"] = async ({ url, init }) => {
  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`Externe API ${url} antwortete mit ${response.status}.`);
  }

  return response.json();
};

const normalizeFieldValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const createOperationRuntimeHelpers = (overrides?: OperationRuntimeOverrides): OperationRuntimeHelpers => {
  const findEntityHelper = overrides?.findActiveReferenceEntityByDataField ?? findActiveReferenceEntityByDataField;
  const listEntitiesHelper = overrides?.listReferenceEntities ?? listReferenceEntities;
  const richTextHelper = overrides?.richTextHtmlToPlainText ?? richTextHtmlToPlainText;
  const erpSimBaseUrl = overrides?.erpSimBaseUrl ?? env.erpSimBaseUrl;
  const fetchJson = overrides?.fetchJson ?? defaultFetchJson;
  const createInfoActionState: OperationRuntimeHelpers["createInfoActionState"] = ({ title, message, actionName }) => ({
    type: "info",
    title,
    message,
    actionName,
  });
  const createErrorActionState: OperationRuntimeHelpers["createErrorActionState"] = ({ title, message, actionName }) => ({
    type: "error",
    title,
    message,
    actionName,
  });

  const createApiContext = (input: OperationExecutionInput): ApiExecutionContext => {
    const fields: FormRuntimeFieldValues = { ...input.fieldValues };

    const buildResult = (actionState: FormRuntimeActionState): OperationExecutionResult => ({
      fieldValues: { ...fields },
      actionState,
    });

    const setField = (name: string, value: unknown): ApiExecutionContext => {
      fields[name] = normalizeFieldValue(value);
      return apiContext;
    };

    const setFields = (values: Record<string, unknown>): ApiExecutionContext => {
      Object.entries(values).forEach(([name, value]) => {
        setField(name, value);
      });
      return apiContext;
    };

    const apiContext: ApiExecutionContext = {
      action: input.action,
      fields,
      ...(input.documentId ? { documentId: input.documentId } : {}),
      ...(input.userId ? { userId: input.userId } : {}),
      ...(input.templateKey ? { templateKey: input.templateKey } : {}),
      erpSimBaseUrl,
      fetchJson,
      getField: (name: string) => fields[name] ?? "",
      setField,
      setFields,
      setJsonField: (name: string, value: unknown) => setField(name, JSON.stringify(value)),
      setOptionsField: (name: string, options: Array<{ value: string; label: string }>) => setField(name, JSON.stringify(options)),
      info: (title: string, message: string) => buildResult(createInfoActionState({
        title,
        message,
        actionName: input.action.name,
      })),
      error: (title: string, message: string) => buildResult(createErrorActionState({
        title,
        message,
        actionName: input.action.name,
      })),
      result: buildResult,
    };

    return apiContext;
  };

  const createScriptApi: OperationRuntimeHelpers["createScriptApi"] = (input) => createOperationScriptApi({
    input,
    dependencies: {
      erpSimBaseUrl,
      fetchJson,
      createInfoActionState,
      createErrorActionState,
    },
  });

  return {
    findActiveReferenceEntityByDataField: findEntityHelper,
    listReferenceEntities: listEntitiesHelper,
    richTextHtmlToPlainText: richTextHelper,
    erpSimBaseUrl,
    fetchJson,
    createInfoActionState,
    createErrorActionState,
    createApiContext,
    createScriptApi,
  };
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
  type DefineApiOptions = {
    errorTitle?: string;
    fallbackMessage?: string;
  };
  type DefineApi = (
    script: (api: OperationScriptApi) => Promise<OperationExecutionResult> | OperationExecutionResult,
    options?: DefineApiOptions,
  ) => OperationHandler;
  const defineApi: DefineApi = (script, options) => {
    return async (input, runtime) => {
      try {
        return await script(runtime.createScriptApi(input));
      } catch (cause) {
        const api = runtime.createScriptApi(input);
        const message = cause instanceof Error
          ? cause.message
          : options?.fallbackMessage ?? "Die API konnte nicht ausgefuehrt werden.";
        return api.error(options?.errorTitle ?? "API-Fehler", message);
      }
    };
  };
  const evaluator = new Function(
    "module",
    "exports",
    "defineApi",
    `${transpiledSource}\nreturn module.exports;`,
  ) as (
    module: { exports: Record<string, unknown> },
    exports: Record<string, unknown>,
    defineApi: DefineApi,
  ) => Record<string, unknown>;

  const moduleExports = evaluator(module, module.exports, defineApi);
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
  runtimeOverrides?: OperationRuntimeOverrides;
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

  return handler(input.executionInput, createOperationRuntimeHelpers(input.runtimeOverrides));
};
