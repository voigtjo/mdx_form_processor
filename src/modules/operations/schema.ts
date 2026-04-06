export const sanitizeOperationSchemaJson = (value: Record<string, unknown> | null | undefined): Record<string, unknown> => {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const fields = Array.isArray(source.fields) ? source.fields : [];

  return {
    ...source,
    fields: fields.flatMap((field) => {
      if (!field || typeof field !== "object" || Array.isArray(field)) {
        return [];
      }

      const record = field as Record<string, unknown>;
      const name = typeof record.name === "string" ? record.name : "";
      const type = typeof record.type === "string" ? record.type : "";

      if (!name || !type) {
        return [];
      }

      return [{
        name,
        type,
        ...(typeof record.required === "boolean" ? { required: record.required } : {}),
      }];
    }),
  };
};

export const readSchemaFields = (value: Record<string, unknown> | null): Array<{
  name: string;
  type: string;
  required?: boolean;
}> => {
  const normalized = sanitizeOperationSchemaJson(value);
  const fields = Array.isArray(normalized.fields) ? normalized.fields : [];

  return fields.flatMap((field) => {
    if (!field || typeof field !== "object" || Array.isArray(field)) {
      return [];
    }

    const record = field as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name : "";
    const type = typeof record.type === "string" ? record.type : "";

    if (!name || !type) {
      return [];
    }

    return [{
      name,
      type,
      ...(typeof record.required === "boolean" ? { required: record.required } : {}),
    }];
  });
};
