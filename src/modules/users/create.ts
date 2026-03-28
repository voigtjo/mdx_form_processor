import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";

export const createUser = async (input: {
  displayName: string;
  key: string;
  email?: string;
}): Promise<{ id: string }> => {
  const displayName = input.displayName.trim();
  const key = input.key.trim();
  const email = input.email?.trim() ?? "";

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
      `insert into users (id, key, display_name, email, status)
       values ($1, $2, $3, $4, 'active')`,
      [id, key, displayName, email || null],
    );

    return { id };
  });
};
