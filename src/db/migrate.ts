import { closePool } from "./pool.js";
import { runMigrations } from "./schema.js";

const main = async (): Promise<void> => {
  const applied = await runMigrations();
  console.log(`Applied SQL files: ${applied.join(", ")}`);
};

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Migration failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
