import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";

export const createGroup = async (input: {
  name: string;
  key: string;
  description?: string;
}): Promise<{ id: string }> => {
  const name = input.name.trim();
  const key = input.key.trim();
  const description = input.description?.trim() ?? "";

  if (!name || !key) {
    throw new Error("Name und Key sind fuer neue Groups erforderlich.");
  }

  return withDbTransaction(async (client) => {
    const existingGroup = await client.query<{ id: string }>(
      `select id from groups where key = $1 limit 1`,
      [key],
    );

    if (existingGroup.rowCount) {
      throw new Error("Der Group-Key ist bereits vergeben.");
    }

    const id = randomUUID();

    await client.query(
      `insert into groups (id, key, name, description, status)
       values ($1, $2, $3, $4, 'active')`,
      [id, key, name, description || null],
    );

    return { id };
  });
};
