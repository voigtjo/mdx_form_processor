import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { PoolClient } from "pg";
import { withDbTransaction } from "./pool.js";

const sqlDirectory = path.join(process.cwd(), "sql");

const getSqlFiles = async (): Promise<string[]> => {
  const entries = await readdir(sqlDirectory, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
};

const runSqlFile = async (client: PoolClient, fileName: string): Promise<void> => {
  const sql = await readFile(path.join(sqlDirectory, fileName), "utf8");
  await client.query(sql);
};

export const runMigrations = async (): Promise<string[]> => {
  const sqlFiles = await getSqlFiles();

  await withDbTransaction(async (client) => {
    for (const fileName of sqlFiles) {
      await runSqlFile(client, fileName);
    }
  });

  return sqlFiles;
};

