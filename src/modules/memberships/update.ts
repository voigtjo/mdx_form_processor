import { withDbTransaction } from "../../db/pool.js";
import { serializeMembershipRights } from "./rights.js";

export const updateMembershipRights = async (input: {
  membershipId: string;
  rights: {
    read?: boolean;
    write?: boolean;
    execute?: boolean;
    groupAdmin?: boolean;
  };
}): Promise<void> => {
  const membershipId = input.membershipId.trim();
  const rights = serializeMembershipRights(input.rights);

  if (!membershipId) {
    throw new Error("Die Membership wurde nicht uebergeben.");
  }

  if (!rights) {
    throw new Error("Bitte mindestens ein Gruppenrecht auswaehlen.");
  }

  await withDbTransaction(async (client) => {
    const result = await client.query(
      `update memberships
       set rights = $2,
           updated_at = now()
       where id = $1`,
      [membershipId, rights],
    );

    if (result.rowCount === 0) {
      throw new Error("Die Membership wurde nicht gefunden.");
    }
  });
};
