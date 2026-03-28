import { withDbTransaction } from "../../db/pool.js";

export const updateUser = async (input: {
  id: string;
  displayName: string;
  email?: string;
  status: "active" | "inactive";
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
           updated_at = now()
       where id = $1`,
      [input.id, displayName, email || null, input.status],
    );

    if (result.rowCount === 0) {
      throw new Error("Der angeforderte User wurde nicht gefunden.");
    }
  });
};
