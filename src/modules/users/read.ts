import { withDb } from "../../db/pool.js";
import type { User } from "../../types/domain.js";

type UserRow = {
  id: string;
  key: string;
  display_name: string;
  email: string | null;
  description: string | null;
  status: User["status"];
};

const mapUser = (row: UserRow): User => ({
  id: row.id,
  key: row.key,
  displayName: row.display_name,
  ...(row.email ? { email: row.email } : {}),
  ...(row.description ? { description: row.description } : {}),
  status: row.status,
});

export const listUsers = async (): Promise<User[]> => {
  return withDb(async (client) => {
    const result = await client.query<UserRow>(
      `select id, key, display_name, email, description, status
       from users
       order by display_name asc`,
    );

    return result.rows.map(mapUser);
  });
};

export const findUserByKey = async (key: string): Promise<User | null> => {
  return withDb(async (client) => {
    const result = await client.query<UserRow>(
      `select id, key, display_name, email, description, status
       from users
       where key = $1
       limit 1`,
      [key],
    );

    const row = result.rows[0];
    return row ? mapUser(row) : null;
  });
};

export const findUserById = async (id: string): Promise<User | null> => {
  return withDb(async (client) => {
    const result = await client.query<UserRow>(
      `select id, key, display_name, email, description, status
       from users
       where id = $1
       limit 1`,
      [id],
    );

    const row = result.rows[0];
    return row ? mapUser(row) : null;
  });
};
