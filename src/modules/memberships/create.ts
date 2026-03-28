import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";

const normalizeRights = (input: {
  read?: boolean;
  write?: boolean;
  execute?: boolean;
}): string => {
  const rights = [
    input.read ? "r" : "",
    input.write ? "w" : "",
    input.execute ? "x" : "",
  ].join("");

  if (!rights) {
    throw new Error("Bitte mindestens ein Membership-Recht auswaehlen.");
  }

  return rights;
};

export const createMembership = async (input: {
  userId: string;
  groupId: string;
  rights: {
    read?: boolean;
    write?: boolean;
    execute?: boolean;
  };
}): Promise<{ id: string }> => {
  const userId = input.userId.trim();
  const groupId = input.groupId.trim();
  const rights = normalizeRights(input.rights);

  if (!userId || !groupId) {
    throw new Error("User und Group sind fuer eine Membership erforderlich.");
  }

  return withDbTransaction(async (client) => {
    const userResult = await client.query<{ id: string }>(`select id from users where id = $1 limit 1`, [userId]);
    const groupResult = await client.query<{ id: string }>(`select id from groups where id = $1 limit 1`, [groupId]);
    const existingMembership = await client.query<{ id: string }>(
      `select id from memberships where user_id = $1 and group_id = $2 limit 1`,
      [userId, groupId],
    );

    if (!userResult.rowCount) {
      throw new Error("Der ausgewaehlte User wurde nicht gefunden.");
    }

    if (!groupResult.rowCount) {
      throw new Error("Die ausgewaehlte Group wurde nicht gefunden.");
    }

    if (existingMembership.rowCount) {
      throw new Error("Diese Membership existiert bereits.");
    }

    const id = randomUUID();

    await client.query(
      `insert into memberships (id, user_id, group_id, rights)
       values ($1, $2, $3, $4)`,
      [id, userId, groupId, rights],
    );

    return { id };
  });
};
