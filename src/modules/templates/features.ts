export type TemplateFeatureToggle = {
  enabled: boolean;
  source: "template-meta" | "legacy-mdx" | "reference-default" | "default-off";
};

export type TemplateFeatureToggles = {
  attachments: TemplateFeatureToggle;
  journal: TemplateFeatureToggle;
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

const readBooleanMeta = (value: string | undefined): boolean | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (["true", "yes", "ja", "on", "1"].includes(normalized)) {
    return true;
  }

  if (["false", "no", "nein", "off", "0"].includes(normalized)) {
    return false;
  }

  return undefined;
};

const hasLegacyAttachmentSupport = (body: string): boolean => {
  return /type="attachmentArea"|<AttachmentAreaRef\b/.test(body);
};

const hasLegacyJournalSupport = (body: string): boolean => {
  return /type="journal"|<JournalRef\b/.test(body);
};

export const readTemplateFeatureToggles = (input: {
  templateKey: string;
  mdxBody: string;
}): TemplateFeatureToggles => {
  const { meta, body } = extractFrontmatter(input.mdxBody);
  const attachmentsMeta = readBooleanMeta(meta.attachmentsEnabled ?? meta.attachments_enabled);
  const journalMeta = readBooleanMeta(meta.journalEnabled ?? meta.journal_enabled);

  if (attachmentsMeta !== undefined || journalMeta !== undefined) {
    return {
      attachments: {
        enabled: attachmentsMeta ?? false,
        source: "template-meta",
      },
      journal: {
        enabled: journalMeta ?? false,
        source: "template-meta",
      },
    };
  }

  if (input.templateKey === "customer-order-test") {
    return {
      attachments: {
        enabled: true,
        source: "reference-default",
      },
      journal: {
        enabled: true,
        source: "reference-default",
      },
    };
  }

  return {
    attachments: {
      enabled: hasLegacyAttachmentSupport(body),
      source: hasLegacyAttachmentSupport(body) ? "legacy-mdx" : "default-off",
    },
    journal: {
      enabled: hasLegacyJournalSupport(body),
      source: hasLegacyJournalSupport(body) ? "legacy-mdx" : "default-off",
    },
  };
};
