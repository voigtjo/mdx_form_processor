import { pathToFileURL } from "node:url";
import { closePool, withDbTransaction } from "./pool.js";
import { runMigrations } from "./schema.js";

const adminUser = {
  id: "11111111-1111-1111-1111-111111111111",
  key: "admin",
  displayName: "Admin",
  email: null,
  description: "Initialer Admin fuer die leere Service-Report-Instanz.",
  status: "active",
} as const;

const countRows = async (client: Parameters<Parameters<typeof withDbTransaction>[0]>[0], tableName: string): Promise<number> => {
  const result = await client.query<{ count: string }>(`select count(*)::text as count from ${tableName}`);
  return Number(result.rows[0]?.count ?? "0");
};

const validateEmptyServiceReportInstance = async (client: Parameters<Parameters<typeof withDbTransaction>[0]>[0]): Promise<void> => {
  const forbiddenTables = [
    "groups",
    "memberships",
    "form_templates",
    "workflow_templates",
    "documents",
    "document_assignments",
    "tasks",
    "attachments",
    "audit_events",
    "operations",
    "reference_entities",
    "customer_orders",
    "production_records",
    "qualification_records",
    "generic_form_records",
    "template_assignments",
  ] as const;
  const forbiddenCounts: number[] = [];

  for (const tableName of forbiddenTables) {
    forbiddenCounts.push(await countRows(client, tableName));
  }

  const hasUnexpectedData = forbiddenCounts.some((count) => count > 0);

  if (hasUnexpectedData) {
    throw new Error("Die Service-Report-Instanz ist nicht leer genug fuer den Minimal-Init. Bitte nur auf eine leere oder bereits minimal initialisierte DB anwenden.");
  }

  const existingUsers = await client.query<{
    id: string;
    key: string;
    display_name: string;
    status: string;
  }>(
    `select id, key, display_name, status
     from users
     order by display_name asc`,
  );

  if (existingUsers.rows.length === 0) {
    return;
  }

  if (existingUsers.rows.length > 1) {
    throw new Error("Es sind bereits mehrere User vorhanden. Der Minimal-Init erwartet hoechstens einen bestehenden Admin.");
  }

  const existingAdmin = existingUsers.rows[0];

  if (!existingAdmin) {
    throw new Error("Der vorhandene Admin konnte nicht gelesen werden.");
  }

  if (
    existingAdmin.id !== adminUser.id
    || existingAdmin.key !== adminUser.key
    || existingAdmin.display_name !== adminUser.displayName
    || existingAdmin.status !== adminUser.status
  ) {
    throw new Error("Der vorhandene User entspricht nicht dem erwarteten Minimal-Admin.");
  }
};

const upsertAdminUser = async (client: Parameters<Parameters<typeof withDbTransaction>[0]>[0]): Promise<void> => {
  await client.query(
    `insert into users (id, key, display_name, email, description, status)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do update
       set key = excluded.key,
           display_name = excluded.display_name,
           email = excluded.email,
           description = excluded.description,
           status = excluded.status,
           updated_at = now()`,
    [adminUser.id, adminUser.key, adminUser.displayName, adminUser.email, adminUser.description, adminUser.status],
  );
};

export const initServiceReportInstance = async (): Promise<void> => {
  await runMigrations();

  await withDbTransaction(async (client) => {
    await validateEmptyServiceReportInstance(client);
    await upsertAdminUser(client);
  });
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  initServiceReportInstance()
    .then(() => {
      console.log("Service-Report DB initialisiert.");
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Service-Report Init fehlgeschlagen: ${message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await closePool();
    });
}
