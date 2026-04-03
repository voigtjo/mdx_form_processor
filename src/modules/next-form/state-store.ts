import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export type NextFormSavedState = {
  formKey: string;
  values: Record<string, string>;
  savedAt: string;
};

export const nextFormSavedStatePath = new URL("../../../storage/next-form/craftsman-order-state.json", import.meta.url);

const normalizeValues = (values: Record<string, string | undefined>): Record<string, string> => {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value?.toString() ?? ""]));
};

export const saveNextFormState = async (input: {
  formKey: string;
  values: Record<string, string | undefined>;
}): Promise<NextFormSavedState> => {
  const payload: NextFormSavedState = {
    formKey: input.formKey,
    values: normalizeValues(input.values),
    savedAt: new Date().toISOString(),
  };

  await mkdir(fileURLToPath(new URL(".", nextFormSavedStatePath)), { recursive: true });
  await writeFile(nextFormSavedStatePath, JSON.stringify(payload, null, 2), "utf8");

  return payload;
};

export const loadNextFormState = async (): Promise<NextFormSavedState | undefined> => {
  try {
    const raw = await readFile(nextFormSavedStatePath, "utf8");
    return JSON.parse(raw) as NextFormSavedState;
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";

    if (code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
};
