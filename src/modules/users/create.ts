import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";
import { serializeGlobalRoles } from "./roles.js";

export const createUser = async (input: {
  displayName: string;
  key: string;
  email?: string;
  locale?: "de" | "en";
  globalRoles?: {
    admin?: boolean;
    developer?: boolean;
    chef?: boolean;
  };
}): Promise<{ id: string }> => {
  const displayName = input.displayName.trim();
  const key = input.key.trim();
  const email = input.email?.trim() ?? "";
  const locale = input.locale === "en" ? "en" : "de";

  if (!displayName || !key) {
    throw new Error("Display Name und Key sind fuer neue Users erforderlich.");
  }

  return withDbTransaction(async (client) => {
    const existingUser = await client.query<{ id: string }>(
      `select id from users where key = $1 limit 1`,
      [key],
    );

    if (existingUser.rowCount) {
      throw new Error("Der User-Key ist bereits vergeben.");
    }

    const id = randomUUID();

    await client.query(
      `insert into users (id, key, display_name, email, status, locale, global_roles)
       values ($1, $2, $3, $4, 'active', $5, $6)`,
      [id, key, displayName, email || null, locale, serializeGlobalRoles(input.globalRoles)],
    );

    return { id };
  });
};
