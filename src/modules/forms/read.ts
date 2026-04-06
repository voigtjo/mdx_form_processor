import { readFile } from "node:fs/promises";
import type {
  FormRuntimeElement,
  FormRuntimeControlType,
  FormRuntimeDefinition,
  FormRuntimeMeta,
  FormRuntimePropertyMap,
  FormRuntimeRow,
  FormRuntimeSection,
  FormRuntimeSlot,
} from "./types.js";
import { formRuntimeControlTypes } from "./types.js";

const metaKeys = ["title", "key", "version"] as const;

const isCommentOrEmpty = (line: string): boolean => {
  const trimmed = line.trim();
  return trimmed.length === 0 || trimmed.startsWith("//");
};

const splitRowIntoSlots = (source: string): string[] => {
  const slots: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const character of source) {
    if (character === "\"") {
      inQuotes = !inQuotes;
      current += character;
      continue;
    }

    if (character === "|" && !inQuotes) {
      const slot = current.trim();

      if (slot.length > 0) {
        slots.push(slot);
      }

      current = "";
      continue;
    }

    current += character;
  }

  const finalSlot = current.trim();

  if (finalSlot.length > 0) {
    slots.push(finalSlot);
  }

  return slots;
};

const readSectionTitle = (line: string): string | null => {
  const heading = line.match(/^##\s+(.+)$/);
  return heading?.[1]?.trim() ?? null;
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

const splitCommaSeparatedValue = (value: string | undefined): string[] | undefined => {
  if (!value) {
    return undefined;
  }

  const parts = value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return parts.length > 0 ? parts : undefined;
};

const parsePropertyToken = (token: string, properties: FormRuntimePropertyMap): void => {
  const separatorIndex = token.indexOf("=");

  if (separatorIndex < 0) {
    properties[token] = true;
    return;
  }

  const key = token.slice(0, separatorIndex).trim();
  const rawValue = token.slice(separatorIndex + 1).trim();
  const value = rawValue.replace(/^"(.*)"$/, "$1");

  properties[key] = value;
};

const isFormRuntimeControlType = (value: string): value is FormRuntimeControlType =>
  (formRuntimeControlTypes as readonly string[]).includes(value);

const parseControlSlot = (
  source: string,
  context: {
    nextGeneratedActionName: (controlType: Extract<FormRuntimeControlType, "action" | "lookup">) => string;
  },
): FormRuntimeSlot => {
  const match = source.match(/^(.+?):\s*([a-zA-Z][a-zA-Z0-9_-]*)\((.*)\)$/);

  if (!match) {
    throw new Error(`Ungueltiger Control-Slot: "${source}"`);
  }

  const rawLabel = match[1]?.trim();
  const controlType = match[2]?.trim();
  const rawArgs = match[3]?.trim() ?? "";

  if (!rawLabel || !controlType || rawArgs.length === 0) {
    throw new Error(`Control-Slot unvollstaendig: "${source}"`);
  }

  if (!isFormRuntimeControlType(controlType)) {
    throw new Error(`Control-Typ ${controlType} wird im vereinfachten Formularmodell aktuell nicht unterstuetzt.`);
  }

  const propertyTokens = splitPropertyList(rawArgs);
  const properties: FormRuntimePropertyMap = {};
  const kind = controlType === "action" ? "action" : controlType === "lookup" ? "lookup" : "field";
  let name = "";
  let authoredName: string | undefined;

  if (kind === "action" || kind === "lookup") {
    const firstToken = propertyTokens[0];
    const hasExplicitName = typeof firstToken === "string" && !firstToken.includes("=");
    const actionControlType = kind;

    if (hasExplicitName) {
      authoredName = propertyTokens.shift()?.trim();
    }

    name = authoredName || context.nextGeneratedActionName(actionControlType);
  } else {
    const controlName = propertyTokens.shift();

    if (!controlName) {
      throw new Error(`Control-Name fehlt: "${source}"`);
    }

    name = controlName;
  }

  for (const token of propertyTokens) {
    parsePropertyToken(token, properties);
  }

  const args = splitCommaSeparatedValue(typeof properties.args === "string" ? properties.args : undefined);
  const bind = splitCommaSeparatedValue(typeof properties.bind === "string" ? properties.bind : undefined);
  const control: FormRuntimeElement = {
    kind,
    controlType,
    name,
    ...(authoredName ? { authoredName } : {}),
    label: rawLabel,
    properties,
    ...(typeof properties.ref === "string" ? { ref: properties.ref } : {}),
    ...(args ? { args } : {}),
    ...(bind ? { bind } : {}),
    sourceText: source,
  };

  return {
    source,
    element: control,
  };
};

const parseMetaLine = (line: string, meta: Partial<FormRuntimeMeta>): boolean => {
  const separatorIndex = line.indexOf(":");

  if (separatorIndex < 0) {
    return false;
  }

  const key = line.slice(0, separatorIndex).trim();
  const rawValue = line.slice(separatorIndex + 1).trim();

  if (!metaKeys.includes(key as (typeof metaKeys)[number])) {
    return false;
  }

  if (key === "title") {
    meta.title = rawValue;
    return true;
  }

  if (key === "key") {
    meta.key = rawValue;
    return true;
  }

  meta.version = rawValue;
  return true;
};

const extractFrontmatter = (source: string): { metaLines: string[]; body: string } => {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);

  if (!match) {
    throw new Error("Das neue Formularformat erwartet einen Frontmatter-Kopf mit title, key und version.");
  }

  return {
    metaLines: match[1]?.split(/\r?\n/) ?? [],
    body: source.slice(match[0].length),
  };
};

const finalizeMeta = (meta: Partial<FormRuntimeMeta>): FormRuntimeMeta => {
  if (!meta.title || !meta.key || !meta.version) {
    throw new Error("Das vereinfachte Formular braucht title, key und version.");
  }

  return {
    title: meta.title,
    key: meta.key,
    version: meta.version,
  };
};

export const parseFormRuntimeSource = (source: string): FormRuntimeDefinition => {
  const { metaLines, body } = extractFrontmatter(source);
  const meta: Partial<FormRuntimeMeta> = {};
  const sections: FormRuntimeSection[] = [];
  const controls: FormRuntimeElement[] = [];
  const actions: FormRuntimeElement[] = [];
  const lines = body.split(/\r?\n/);
  let currentSection: FormRuntimeSection | null = null;
  let generatedActionCounter = 0;

  for (const line of metaLines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    parseMetaLine(trimmed, meta);
  }

  for (const line of lines) {
    if (isCommentOrEmpty(line)) {
      continue;
    }

    const trimmed = line.trim();

    const sectionTitle = readSectionTitle(trimmed);

    if (sectionTitle) {
      currentSection = {
        title: sectionTitle,
        rows: [],
      };
      sections.push(currentSection);
      continue;
    }

    if (!currentSection) {
      throw new Error(`Zeile ausserhalb einer Section: "${trimmed}"`);
    }

    const rowSource = trimmed.replace(/^-+\s*/, "");
    const slots = splitRowIntoSlots(rowSource).map((slotSource) => parseControlSlot(slotSource, {
      nextGeneratedActionName: (controlType) => {
        generatedActionCounter += 1;
        return `${controlType}_${generatedActionCounter}`;
      },
    }));
    const row: FormRuntimeRow = {
      source: rowSource,
      slots,
    };

    currentSection.rows.push(row);
    const rowElements = slots.map((slot) => slot.element);
    controls.push(...rowElements.filter((element) => element.kind === "field"));
    actions.push(...rowElements.filter((element) => element.kind !== "field"));
  }

  if (sections.length === 0) {
    throw new Error("Das vereinfachte Formular braucht mindestens eine Section.");
  }

  return {
    meta: finalizeMeta(meta),
    source,
    sections,
    controls,
    actions,
  };
};

export const referenceCustomerOrderFormPath = new URL(
  "../../../specs/next/examples/customer_order.form.md",
  import.meta.url,
);

export const readFormRuntimeSourceText = async (fileUrl: URL): Promise<string> => {
  return readFile(fileUrl, "utf8");
};

export const readFormRuntimeFile = async (fileUrl: URL): Promise<FormRuntimeDefinition> => {
  const source = await readFormRuntimeSourceText(fileUrl);
  return parseFormRuntimeSource(source);
};

export const readReferenceCustomerOrderForm = async (): Promise<FormRuntimeDefinition> => {
  return readFormRuntimeFile(referenceCustomerOrderFormPath);
};
