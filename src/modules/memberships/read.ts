import { withDb } from "../../db/pool.js";
import type { Membership, MembershipRights } from "../../types/domain.js";

type MembershipRow = {
  id: string;
  user_id: string;
  group_id: string;
  rights: string;
};

const parseRights = (value: string): MembershipRights => ({
  read: value.includes("r"),
  write: value.includes("w"),
  execute: value.includes("x"),
});

const mapMembership = (row: MembershipRow): Membership => ({
  id: row.id,
  userId: row.user_id,
  groupId: row.group_id,
  rights: parseRights(row.rights),
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
