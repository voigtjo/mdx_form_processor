import { withDbTransaction } from "../../db/pool.js";
import { serializeGlobalRoles } from "./roles.js";

export const updateUser = async (input: {
  id: string;
  displayName: string;
  email?: string;
  status: "active" | "inactive";
  locale: "de" | "en";
  globalRoles?: {
    admin?: boolean;
    developer?: boolean;
    chef?: boolean;
  };
}): Promise<void> => {
  const displayName = input.displayName.trim();
  const email = input.email?.trim() ?? "";

  if (!displayName) {
    throw new Error("Display Name ist fuer die Bearbeitung erforderlich.");
  }

  await withDbTransaction(async (client) => {
    const result = await client.query(
      `update users
       set display_name = $2,
           email = $3,
           status = $4,
           locale = $5,
           global_roles = $6,
           updated_at = now()
       where id = $1`,
      [input.id, displayName, email || null, input.status, input.locale, serializeGlobalRoles(input.globalRoles)],
    );

    if (result.rowCount === 0) {
      throw new Error("Der angeforderte User wurde nicht gefunden.");
    }
  });
};

export const updateUserPreferences = async (input: {
  id: string;
  preferredTemplateKey?: string;
  preferredGroupId?: string;
}): Promise<void> => {
  const preferredTemplateKey = input.preferredTemplateKey?.trim() ?? "";
  const preferredGroupId = input.preferredGroupId?.trim() ?? "";

  await withDbTransaction(async (client) => {
    const result = await client.query(
      `update users
       set preferred_template_key = $2,
           preferred_group_id = $3,
           updated_at = now()
       where id = $1`,
      [input.id, preferredTemplateKey || null, preferredGroupId || null],
    );

    if (result.rowCount === 0) {
      throw new Error("Der angeforderte User wurde nicht gefunden.");
    }
  });
};
