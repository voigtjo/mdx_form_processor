import type { FormRuntimeActionState, FormRuntimeElement, FormRuntimeFieldValues } from "../forms/types.js";

export type OperationScriptInput = {
  action: FormRuntimeElement;
  fieldValues: FormRuntimeFieldValues;
  documentId?: string;
  userId?: string;
  templateKey?: string;
};

export type OperationScriptResult = {
  fieldValues: FormRuntimeFieldValues;
  actionState: FormRuntimeActionState;
};

export type OperationScriptFetchJson = (input: { url: string; init?: RequestInit }) => Promise<unknown>;

export type OperationScriptApi = {
  action: FormRuntimeElement;
  documentId?: string;
  userId?: string;
  templateKey?: string;
  arg: (index: number, fallback?: string) => string;
  selected: (nameOrArgFallback?: string) => string;
  getField: (name: string) => string;
  setField: (name: string, value: unknown) => void;
  setFields: (values: Record<string, unknown>) => void;
  setJson: (name: string, value: unknown) => void;
  setOptions: (name: string, options: Array<{ value: string; label: string }>) => void;
  option: (value: string, label: string) => { value: string; label: string };
  text: (value: unknown) => string;
  items: <T = unknown>(value: unknown) => T[];
  records: (value: unknown) => Array<Record<string, unknown>>;
  sortByText: <T extends Record<string, unknown>>(items: T[], key: keyof T) => T[];
  fetchJson: (url: string, init?: RequestInit) => Promise<unknown>;
  erpJson: (path: string, init?: RequestInit) => Promise<unknown>;
  listCustomers: () => Promise<Array<Record<string, unknown>>>;
  listCustomerOrders: (customerId: string) => Promise<Array<Record<string, unknown>>>;
  info: (title: string, message: string) => OperationScriptResult;
  error: (title: string, message: string) => OperationScriptResult;
  result: (actionState: FormRuntimeActionState) => OperationScriptResult;
};

type OperationScriptDependencies = {
  erpSimBaseUrl: string;
  fetchJson: OperationScriptFetchJson;
  createInfoActionState: (input: { title: string; message: string; actionName: string }) => FormRuntimeActionState;
  createErrorActionState: (input: { title: string; message: string; actionName: string }) => FormRuntimeActionState;
};

type CreateOperationScriptApiInput = {
  input: OperationScriptInput;
  dependencies: OperationScriptDependencies;
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

const toItems = <T = unknown>(value: unknown): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object" && Array.isArray((value as { items?: unknown[] }).items)) {
    return (value as { items: T[] }).items;
  }

  return [];
};

const sortByTextValue = <T extends Record<string, unknown>>(items: T[], key: keyof T): T[] => {
  items.sort((left, right) => normalizeFieldValue(left[key]).localeCompare(normalizeFieldValue(right[key])));
  return items;
};

export const createOperationScriptApi = (input: CreateOperationScriptApiInput): OperationScriptApi => {
  const fields: FormRuntimeFieldValues = { ...input.input.fieldValues };

  const result = (actionState: FormRuntimeActionState): OperationScriptResult => ({
    fieldValues: { ...fields },
    actionState,
  });

  return {
    action: input.input.action,
    ...(input.input.documentId ? { documentId: input.input.documentId } : {}),
    ...(input.input.userId ? { userId: input.input.userId } : {}),
    ...(input.input.templateKey ? { templateKey: input.input.templateKey } : {}),
    arg: (index, fallback = "") => input.input.action.args?.[index] ?? fallback,
    selected: (nameOrArgFallback = input.input.action.args?.[0] ?? "") => fields[nameOrArgFallback]?.trim() ?? "",
    getField: (name) => fields[name] ?? "",
    setField: (name, value) => {
      fields[name] = normalizeFieldValue(value);
    },
    setFields: (values) => {
      Object.entries(values).forEach(([name, value]) => {
        fields[name] = normalizeFieldValue(value);
      });
    },
    setJson: (name, value) => {
      fields[name] = JSON.stringify(value);
    },
    setOptions: (name, options) => {
      fields[name] = JSON.stringify(options);
    },
    option: (value, label) => ({ value, label }),
    text: normalizeFieldValue,
    items: toItems,
    records: (value) =>
      toItems<Record<string, unknown>>(value).filter(
        (entry): entry is Record<string, unknown> =>
          Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
      ),
    sortByText: sortByTextValue,
    fetchJson: async (url, init) => input.dependencies.fetchJson(
      init ? { url, init } : { url },
    ),
    erpJson: async (path, init) => input.dependencies.fetchJson(
      init
        ? { url: `${input.dependencies.erpSimBaseUrl}${path}`, init }
        : { url: `${input.dependencies.erpSimBaseUrl}${path}` },
    ),
    listCustomers: async () => toItems<Record<string, unknown>>(await input.dependencies.fetchJson({
      url: `${input.dependencies.erpSimBaseUrl}/api/customers`,
    })).filter(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
    ),
    listCustomerOrders: async (customerId) => toItems<Record<string, unknown>>(await input.dependencies.fetchJson({
      url: `${input.dependencies.erpSimBaseUrl}/api/customer-orders?customer_id=${encodeURIComponent(customerId)}`,
    })).filter(
      (entry): entry is Record<string, unknown> =>
        Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
    ),
    info: (title, message) => result(input.dependencies.createInfoActionState({
      title,
      message,
      actionName: input.input.action.name,
    })),
    error: (title, message) => result(input.dependencies.createErrorActionState({
      title,
      message,
      actionName: input.input.action.name,
    })),
    result,
  };
};
