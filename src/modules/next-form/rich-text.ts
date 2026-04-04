const allowedTags = new Set(["p", "br", "strong", "em", "u", "ul", "ol", "li", "a"]);

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const decodeBasicEntities = (value: string): string =>
  value
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");

const normalizeTagName = (tagName: string): string => {
  const normalized = tagName.trim().toLowerCase();

  if (normalized === "b") {
    return "strong";
  }

  if (normalized === "i") {
    return "em";
  }

  return normalized;
};

const sanitizeHref = (value: string): string | undefined => {
  const normalized = value.trim();

  if (
    normalized.startsWith("https://") ||
    normalized.startsWith("http://") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("/") ||
    normalized.startsWith("#")
  ) {
    return normalized;
  }

  return undefined;
};

const sanitizeTag = (token: string): string => {
  const closingMatch = token.match(/^<\s*\/\s*([a-zA-Z0-9_-]+)\s*>$/);

  if (closingMatch) {
    const tagName = normalizeTagName(closingMatch[1] ?? "");

    if (!allowedTags.has(tagName) || tagName === "br") {
      return "";
    }

    return `</${tagName}>`;
  }

  const openingMatch = token.match(/^<\s*([a-zA-Z0-9_-]+)([\s\S]*?)\/?\s*>$/);

  if (!openingMatch) {
    return "";
  }

  const tagName = normalizeTagName(openingMatch[1] ?? "");
  const attributes = openingMatch[2] ?? "";

  if (!allowedTags.has(tagName)) {
    return "";
  }

  if (tagName === "br") {
    return "<br>";
  }

  if (tagName === "a") {
    const hrefMatch = attributes.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const href = sanitizeHref(hrefMatch?.[1] ?? hrefMatch?.[2] ?? hrefMatch?.[3] ?? "");

    if (!href) {
      return "<a>";
    }

    return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">`;
  }

  return `<${tagName}>`;
};

export const sanitizeRichTextHtml = (value: string | undefined): string => {
  const input = value?.trim() ?? "";

  if (!input) {
    return "";
  }

  const withoutDangerousBlocks = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");

  const tagPattern = /<\/?[^>]+>/g;
  let cursor = 0;
  let html = "";

  for (const match of withoutDangerousBlocks.matchAll(tagPattern)) {
    const index = match.index ?? 0;
    const token = match[0] ?? "";
    html += escapeHtml(withoutDangerousBlocks.slice(cursor, index));
    html += sanitizeTag(token);
    cursor = index + token.length;
  }

  html += escapeHtml(withoutDangerousBlocks.slice(cursor));

  return html
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n");
};

export const richTextHtmlToPlainText = (value: string | undefined): string => {
  const sanitized = sanitizeRichTextHtml(value);

  return decodeBasicEntities(
    sanitized
      .replace(/<br>/gi, "\n")
      .replace(/<\/(p|li|ul|ol)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n"),
  ).trim();
};

export const hasVisibleRichTextContent = (value: string | undefined): boolean => {
  return richTextHtmlToPlainText(value).length > 0;
};
