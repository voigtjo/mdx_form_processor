import { withDb } from "../../db/pool.js";
import type { Group } from "../../types/domain.js";

type GroupRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: Group["status"];
};

const mapGroup = (row: GroupRow): Group => ({
  id: row.id,
  key: row.key,
  name: row.name,
  ...(row.description ? { description: row.description } : {}),
  status: row.status,
});

export const listGroups = async (): Promise<Group[]> => {
  return withDb(async (client) => {
    const result = await client.query<GroupRow>(
      `select id, key, name, description, status
       from groups
       order by name asc`,
    );

    return result.rows.map(mapGroup);
  });
};

export const listGroupsForUser = async (userId: string): Promise<Group[]> => {
  return withDb(async (client) => {
    const result = await client.query<GroupRow>(
      `select g.id, g.key, g.name, g.description, g.status
       from groups g
       inner join memberships m on m.group_id = g.id
       where m.user_id = $1
       order by g.name asc`,
      [userId],
    );

    return result.rows.map(mapGroup);
  });
};
