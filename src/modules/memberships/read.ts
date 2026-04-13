import { withDb } from "../../db/pool.js";
import type { Membership } from "../../types/domain.js";
import { parseMembershipRights } from "./rights.js";

type MembershipRow = {
  id: string;
  user_id: string;
  group_id: string;
  rights: string;
};

const mapMembership = (row: MembershipRow): Membership => ({
  id: row.id,
  userId: row.user_id,
  groupId: row.group_id,
  rights: parseMembershipRights(row.rights),
});

export const listMemberships = async (): Promise<Membership[]> => {
  return withDb(async (client) => {
    const result = await client.query<MembershipRow>(
      `select id, user_id, group_id, rights
       from memberships
       order by user_id asc, group_id asc`,
    );

    return result.rows.map(mapMembership);
  });
};

export const listMembershipsForUser = async (userId: string): Promise<Membership[]> => {
  return withDb(async (client) => {
    const result = await client.query<MembershipRow>(
      `select id, user_id, group_id, rights
       from memberships
       where user_id = $1
       order by group_id asc`,
      [userId],
    );

    return result.rows.map(mapMembership);
  });
};

export const listMembershipsForGroup = async (groupId: string): Promise<Membership[]> => {
  return withDb(async (client) => {
    const result = await client.query<MembershipRow>(
      `select id, user_id, group_id, rights
       from memberships
       where group_id = $1
       order by user_id asc`,
      [groupId],
    );

    return result.rows.map(mapMembership);
  });
};
