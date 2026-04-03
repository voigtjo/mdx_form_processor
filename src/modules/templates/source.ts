const frontmatterMatch = (source: string): RegExpMatchArray | null => {
  return source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
};

export const readTemplateSourceFrontmatter = (source: string): { meta: Record<string, string>; body: string } => {
  const match = frontmatterMatch(source);

  if (!match) {
    return {
      meta: {},
      body: source,
    };
  }

  const meta: Record<string, string> = {};
  const frontmatter = match[1] ?? "";

  for (const line of frontmatter.split(/\r?\n/)) {
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
    body: source.slice(match[0].length),
  };
};

export const setTemplateSourceFrontmatterValue = (source: string, key: string, value: string): string => {
  const match = frontmatterMatch(source);
  const nextLine = `${key}: ${value}`;

  if (!match) {
    return `---\n${nextLine}\n---\n\n${source}`;
  }

  const currentLines = (match[1] ?? "").split(/\r?\n/);
  let replaced = false;
  const nextLines = currentLines.map((line) => {
    const separatorIndex = line.indexOf(":");

    if (separatorIndex < 0) {
      return line;
    }

    const currentKey = line.slice(0, separatorIndex).trim();

    if (currentKey !== key) {
      return line;
    }

    replaced = true;
    return nextLine;
  });

  if (!replaced) {
    nextLines.push(nextLine);
  }

  const body = source.slice(match[0].length);
  return `---\n${nextLines.join("\n")}\n---\n\n${body}`;
};
