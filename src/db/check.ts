import { closePool, withDb } from "./pool.js";

const run = async (): Promise<void> => {
  const row = await withDb(async (client) => {
    const result = await client.query<{ now: string }>("select now()::text as now");
    return result.rows[0];
  });

  console.log(`Database reachable: ${row?.now ?? "unknown"}`);
};

run()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Database check failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });

