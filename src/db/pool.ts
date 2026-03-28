import { Pool, type PoolClient } from "pg";
import { env } from "../config/env.js";

let pool: Pool | null = null;

export const getPool = (): Pool | null => {
  if (!env.databaseUrl) {
    return null;
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
    });
  }

  return pool;
};

export const withDb = async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => {
  const activePool = getPool();

  if (!activePool) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const client = await activePool.connect();

  try {
    return await fn(client);
  } finally {
    client.release();
  }
};

export const withDbTransaction = async <T>(fn: (client: PoolClient) => Promise<T>): Promise<T> => {
  return withDb(async (client) => {
    await client.query("begin");

    try {
      const result = await fn(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  });
};

export const closePool = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};
