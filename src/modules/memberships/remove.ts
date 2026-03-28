import { withDbTransaction } from "../../db/pool.js";

export const removeMembership = async (input: {
  membershipId: string;
  userId: string;
}): Promise<void> => {
  const membershipId = input.membershipId.trim();
  const userId = input.userId.trim();

  if (!membershipId || !userId) {
    throw new Error("Membership und User sind fuer das Entfernen erforderlich.");
  }

  await withDbTransaction(async (client) => {
    const result = await client.query(
      `delete from memberships
       where id = $1 and user_id = $2`,
      [membershipId, userId],
    );

    if (!result.rowCount) {
      throw new Error("Die Membership konnte nicht entfernt werden.");
    }
  });
};
