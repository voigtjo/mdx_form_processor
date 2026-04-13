import type { FormRuntimeApiDefinition, FormRuntimeMeta } from "../forms/types.js";

type FrontmatterEntry = {
  key: string;
  value: string;
};

const frontmatterMatch = (source: string): RegExpMatchArray | null => {
  return source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
};

const parseFrontmatterEntries = (source: string): { entries: FrontmatterEntry[]; body: string } => {
  const match = frontmatterMatch(source);

  if (!match) {
    return {
      entries: [],
      body: source,
    };
  }

  const entries = (match[1] ?? "")
    .split(/\r?\n/)
    .map((line) => {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex < 0) {
        return null;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      return key ? { key, value } : null;
    })
    .filter((entry): entry is FrontmatterEntry => Boolean(entry));

  return {
    entries,
    body: source.slice(match[0].length),
  };
};

export const readTemplateSourceFrontmatter = (source: string): { meta: Record<string, string>; body: string } => {
  const { entries, body } = parseFrontmatterEntries(source);
  const meta: Record<string, string> = {};

  for (const entry of entries) {
    meta[entry.key] = entry.value;
  }

  return {
    meta,
    body,
  };
};

export const setTemplateSourceFrontmatterValue = (source: string, key: string, value: string): string => {
  const { entries, body } = parseFrontmatterEntries(source);
  const nextLine = { key, value };
  let replaced = false;
  const nextEntries = entries.map((entry) => {
    if (entry.key !== key) {
      return entry;
    }

    replaced = true;
    return nextLine;
  });

  if (!replaced) {
    nextEntries.push(nextLine);
  }

  return `---\n${nextEntries.map((entry) => `${entry.key}: ${entry.value}`).join("\n")}\n---\n\n${body}`;
};

const stringifyApiDefinition = (definition: FormRuntimeApiDefinition): string => {
  const parts = [`ref="${definition.ref}"`];

  if (definition.request && definition.request.length > 0) {
    parts.push(`request="${definition.request.join(",")}"`);
  }

  if (definition.response && definition.response.length > 0) {
    parts.push(`response="${definition.response.join(",")}"`);
  }

  return parts.join(", ");
};

export const rewriteFormRuntimeTemplateHeader = (input: {
  source: string;
  meta: FormRuntimeMeta;
  attachmentsEnabled: boolean;
  journalEnabled: boolean;
}): string => {
  const { entries, body } = parseFrontmatterEntries(input.source);
  const managedKeys = new Set([
    "key",
    "version",
    "form-key",
    "form-version",
    "workflow_key",
    "workflow_version",
    "workflow-key",
    "workflow-version",
    "attachments_enabled",
    "attachmentsEnabled",
    "journal_enabled",
    "journalEnabled",
    "API",
    "api",
  ]);
  const unmanagedEntries = entries.filter((entry) => !managedKeys.has(entry.key));
  const titleEntry = unmanagedEntries.find((entry) => entry.key === "title");
  const remainingEntries = unmanagedEntries.filter((entry) => entry.key !== "title");

  const nextEntries: FrontmatterEntry[] = [
    {
      key: "title",
      value: input.meta.title || titleEntry?.value || "",
    },
    {
      key: "form-key",
      value: input.meta.key,
    },
    {
      key: "form-version",
      value: input.meta.version,
    },
    ...(input.meta.workflowKey ? [{ key: "workflow-key", value: input.meta.workflowKey }] : []),
    ...(input.meta.workflowVersion ? [{ key: "workflow-version", value: input.meta.workflowVersion }] : []),
    {
      key: "attachments_enabled",
      value: input.attachmentsEnabled ? "true" : "false",
    },
    {
      key: "journal_enabled",
      value: input.journalEnabled ? "true" : "false",
    },
    ...input.meta.apiDefinitions.map((definition) => ({
      key: "API",
      value: stringifyApiDefinition(definition),
    })),
    ...remainingEntries,
  ];

  return `---\n${nextEntries.map((entry) => `${entry.key}: ${entry.value}`).join("\n")}\n---\n\n${body}`;
};
