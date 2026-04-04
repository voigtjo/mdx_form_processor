export type CsvTable = {
  headers: string[];
  rows: Array<Record<string, string>>;
};

const parseCsvRow = (source: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const nextCharacter = source[index + 1];

    if (character === "\"") {
      if (inQuotes && nextCharacter === "\"") {
        current += "\"";
        index += 1;
        continue;
      }

      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values.map((value) => value.trim());
};

export const parseCsvWithHeader = (sourceText: string): CsvTable => {
  const normalizedLines = sourceText
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (normalizedLines.length < 2) {
    throw new Error("CSV-Import erwartet mindestens einen Header und eine Datenzeile.");
  }

  const headerLine = normalizedLines[0];

  if (!headerLine) {
    throw new Error("CSV-Header fehlt.");
  }

  const headers = parseCsvRow(headerLine).map((header) => header.trim());

  if (headers.some((header) => header.length === 0)) {
    throw new Error("CSV-Header duerfen nicht leer sein.");
  }

  const rows = normalizedLines.slice(1).map((line) => {
    const values = parseCsvRow(line);

    if (values.length !== headers.length) {
      throw new Error("CSV-Zeile passt nicht zur Header-Struktur.");
    }

    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  return {
    headers,
    rows,
  };
};

const serializeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = typeof value === "string" ? value : JSON.stringify(value);

  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }

  return normalized;
};

export const serializeCsv = (headers: string[], rows: Array<Record<string, unknown>>): string => {
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => serializeCsvCell(row[header])).join(",")),
  ];

  return `${lines.join("\n")}\n`;
};
