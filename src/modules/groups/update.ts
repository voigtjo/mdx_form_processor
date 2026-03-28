import { withDbTransaction } from "../../db/pool.js";

export const updateGroup = async (input: {
  id: string;
  name: string;
  description?: string;
  status: "active" | "inactive";
}): Promise<void> => {
  const name = input.name.trim();
  const description = input.description?.trim() ?? "";

  if (!name) {
    throw new Error("Name ist fuer die Bearbeitung erforderlich.");
  }

  await withDbTransaction(async (client) => {
    const result = await client.query(
      `update groups
       set name = $2,
           description = $3,
           status = $4,
           updated_at = now()
       where id = $1`,
      [input.id, name, description || null, input.status],
    );

    if (result.rowCount === 0) {
      throw new Error("Die angeforderte Group wurde nicht gefunden.");
    }
  });
};
