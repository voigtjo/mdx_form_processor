import type { PoolClient } from "pg";
import { rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { closePool, withDbTransaction } from "./pool.js";
import { runMigrations } from "./schema.js";
import { seedReferenceData } from "./seed-reference.js";

const truncateReferenceData = async (client: PoolClient): Promise<void> => {
  await client.query(`
    truncate table
      tasks,
      audit_events,
      attachments,
      document_assignments,
      documents,
      customer_orders,
      production_records,
      qualification_records,
      generic_form_records,
      reference_entities,
      template_assignments,
      form_templates,
      workflow_templates,
      memberships,
      groups,
      users,
      operations
    restart identity
    cascade
  `);
};

const resetAttachmentStorage = async (): Promise<void> => {
  await rm(path.join(process.cwd(), "storage", "attachments"), {
    recursive: true,
    force: true,
  });
};

export const rebuildReferenceData = async (): Promise<void> => {
  await runMigrations();
  await withDbTransaction(truncateReferenceData);
  await resetAttachmentStorage();
  await seedReferenceData();
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  rebuildReferenceData()
    .then(() => {
      console.log("Reference data rebuilt.");
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Reference rebuild failed: ${message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await closePool();
    });
}
