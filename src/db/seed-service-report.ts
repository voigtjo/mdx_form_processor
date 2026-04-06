import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { closePool, withDbTransaction } from "./pool.js";
import { runMigrations } from "./schema.js";

const specsDirectory = path.join(process.cwd(), "specs");

const loadSpecFile = async (fileName: string): Promise<string> => {
  return readFile(path.join(specsDirectory, fileName), "utf8");
};

const serviceReportOrderLookupHandlerSource = [
  "const buildOrderLabel = (entry) => [",
  "  entry.orderNumber,",
  "  entry.orderStatus,",
  "  entry.customerName,",
  "  entry.customerValid ? 'gueltig' : 'ungueltig',",
  "].join(' · ');",
  "",
  "export default defineApi(async ({ listCustomers, listCustomerOrders, text, selected, option, sortByText, setOptions, setFields, info, error }) => {",
  "    const customers = await listCustomers();",
  "    const orderEntries = [];",
  "",
  "    for (const customer of customers) {",
  "      const customerId = text(customer.id);",
  "",
  "      if (!customerId) {",
  "        continue;",
  "      }",
  "",
  "      const orders = await listCustomerOrders(customerId);",
  "",
  "      for (const order of orders) {",
  "        const orderNumber = text(order.order_number);",
  "",
  "        if (!orderNumber) {",
  "          continue;",
  "        }",
  "",
  "        orderEntries.push({",
  "          orderNumber,",
  "          orderStatus: text(order.status) || 'offen',",
  "          customerName: text(customer.name) || 'Unbekannter Kunde',",
  "          customerValid: customer.valid === true,",
  "        });",
  "      }",
  "    }",
  "",
  "    sortByText(orderEntries, 'orderNumber');",
  "    setOptions('service_order_options_json', orderEntries.map((entry) => option(entry.orderNumber, buildOrderLabel(entry))));",
  "",
  "    const selectedOrderNumber = selected('order_number');",
  "",
  "    if (!selectedOrderNumber) {",
  "      return info(",
  "        'Auftragsliste geladen',",
  "        orderEntries.length > 0",
  "          ? 'ERP-SIM-Auftraege stehen im Dropdown zur Auswahl bereit.'",
  "          : 'ERP-SIM liefert aktuell keine verfuegbaren Auftraege.',",
  "      );",
  "    }",
  "",
  "    const matchedOrder = orderEntries.find((entry) => entry.orderNumber === selectedOrderNumber);",
  "",
  "    if (!matchedOrder) {",
  "      return error(",
  "        'Auftrag nicht gefunden',",
  "        'Der gewaehlte Auftrag ist in ERP-SIM aktuell nicht verfuegbar.',",
  "      );",
  "    }",
  "",
  "    setFields({",
  "      order_number: matchedOrder.orderNumber,",
  "      customer: matchedOrder.customerName,",
  "      customer_order_status: matchedOrder.orderStatus,",
  "      customer_master_status: matchedOrder.customerValid ? 'gueltig' : 'ungueltig',",
  "    });",
  "",
  "    return info(",
  "      'Auftragsdaten geladen',",
  "      'Auftragsstatus und Kundendaten wurden aus ERP-SIM uebernommen.',",
  "    );",
  "}, { errorTitle: 'ERP-SIM nicht erreichbar', fallbackMessage: 'ERP-SIM ist aktuell nicht erreichbar.' });",
].join("\n");

const adminUser = {
  id: "11111111-1111-1111-1111-111111111111",
  key: "admin",
  displayName: "Admin",
  email: null,
  description: "Initialer Admin fuer Service-Report.",
  status: "active",
} as const;

const serviceReportUsers = [
  {
    id: "21111111-1111-1111-1111-111111111111",
    key: "frank",
    displayName: "Frank",
    email: "frank@service-report.local",
    description: "Kundenservice im Feldeinsatz.",
    status: "active",
  },
  {
    id: "22222222-1111-1111-1111-111111111111",
    key: "thomas",
    displayName: "Thomas",
    email: "thomas@service-report.local",
    description: "Kundenservice im Feldeinsatz.",
    status: "active",
  },
  {
    id: "33333333-1111-1111-1111-111111111111",
    key: "stefan",
    displayName: "Stefan",
    email: "stefan@service-report.local",
    description: "Bauauftrag im Feldeinsatz.",
    status: "active",
  },
  {
    id: "44444444-1111-1111-1111-111111111111",
    key: "markus",
    displayName: "Markus",
    email: "markus@service-report.local",
    description: "Bauauftrag im Feldeinsatz.",
    status: "active",
  },
  {
    id: "55555555-1111-1111-1111-111111111111",
    key: "chef",
    displayName: "Chef",
    email: "chef@service-report.local",
    description: "Assigner und Approver fuer Service- und Bauauftraege.",
    status: "active",
  },
] as const;

const groups = [
  {
    id: "61111111-1111-1111-1111-111111111111",
    key: "kundenservice",
    name: "Kundenservice",
    description: "Operative Serviceeinsaetze beim Kunden.",
    status: "active",
  },
  {
    id: "62222222-1111-1111-1111-111111111111",
    key: "bauauftrag",
    name: "Bauauftrag",
    description: "Operative Bauauftraege im Feld.",
    status: "active",
  },
] as const;

const memberships = [
  {
    id: "71111111-1111-1111-1111-111111111111",
    userId: "21111111-1111-1111-1111-111111111111",
    groupId: "61111111-1111-1111-1111-111111111111",
    rights: "rw",
  },
  {
    id: "72222222-1111-1111-1111-111111111111",
    userId: "22222222-1111-1111-1111-111111111111",
    groupId: "61111111-1111-1111-1111-111111111111",
    rights: "rw",
  },
  {
    id: "73333333-1111-1111-1111-111111111111",
    userId: "33333333-1111-1111-1111-111111111111",
    groupId: "62222222-1111-1111-1111-111111111111",
    rights: "rw",
  },
  {
    id: "74444444-1111-1111-1111-111111111111",
    userId: "44444444-1111-1111-1111-111111111111",
    groupId: "62222222-1111-1111-1111-111111111111",
    rights: "rw",
  },
  {
    id: "75555555-1111-1111-1111-111111111111",
    userId: "55555555-1111-1111-1111-111111111111",
    groupId: "61111111-1111-1111-1111-111111111111",
    rights: "rx",
  },
  {
    id: "76666666-1111-1111-1111-111111111111",
    userId: "55555555-1111-1111-1111-111111111111",
    groupId: "62222222-1111-1111-1111-111111111111",
    rights: "rx",
  },
] as const;

const workflowTemplate = {
  id: "81111111-1111-1111-1111-111111111111",
  key: "service-report.review",
  name: "Service-Report Freigabe",
  description: "Einfacher Dokumentworkflow fuer Service-Reports mit einer Approver-Stufe.",
  version: 1,
  status: "published",
  workflowJson: {
    initialStatus: "draft",
    statuses: ["draft", "assigned", "submitted", "approved", "archived"],
    actions: {
      assign: {
        from: ["draft"],
        to: "assigned",
        allowedRoles: ["approver"],
        completionMode: "single",
      },
      submit: {
        from: ["assigned"],
        to: "submitted",
        allowedRoles: ["editor"],
        completionMode: "single",
      },
      approve: {
        from: ["submitted"],
        to: "approved",
        allowedRoles: ["approver"],
        completionMode: "single",
      },
      reassign: {
        from: ["submitted"],
        to: "assigned",
        allowedRoles: ["approver"],
        completionMode: "single",
      },
      archive: {
        from: ["approved"],
        to: "archived",
        allowedRoles: ["approver"],
        completionMode: "single",
      },
    },
    fieldRules: {
      submitted: {
        editable: [],
        readonly: [
          "order_number",
          "customer_order_status",
          "customer",
          "customer_master_status",
          "work_description",
          "customer_information_flags",
          "service_result_status",
          "follow_up_date",
          "service_date",
          "technician",
          "labor_hours",
          "travel_hours",
          "break_minutes",
        ],
      },
      approved: {
        editable: [],
        readonly: [
          "order_number",
          "customer_order_status",
          "customer",
          "customer_master_status",
          "work_description",
          "customer_information_flags",
          "service_result_status",
          "follow_up_date",
          "service_date",
          "technician",
          "labor_hours",
          "travel_hours",
          "break_minutes",
        ],
      },
      archived: {
        editable: [],
        readonly: [
          "order_number",
          "customer_order_status",
          "customer",
          "customer_master_status",
          "work_description",
          "customer_information_flags",
          "service_result_status",
          "follow_up_date",
          "service_date",
          "technician",
          "labor_hours",
          "travel_hours",
          "break_minutes",
        ],
      },
    },
    approval: {
      editors: "single",
      approvers: "single",
      submitMode: "single",
      approvalMode: "single",
    },
    hooks: [],
  },
} as const;

const template = {
  id: "91111111-1111-1111-1111-111111111111",
  key: "service-report",
  name: "Service-Report",
  formType: "customer_order",
  description: "Erster Formularentwurf fuer operative Service-Reports mit ERP-SIM-Auftragsauswahl.",
  version: 1,
  status: "published",
  workflowTemplateId: workflowTemplate.id,
  templateKeys: ["order_number"],
  documentKeys: ["customer_order_number"],
  tableFields: ["customer_order_number", "customer_name", "approval_status"],
} as const;

const templateAssignment = {
  id: "92111111-1111-1111-1111-111111111111",
  templateId: template.id,
  groupId: "61111111-1111-1111-1111-111111111111",
  status: "active",
} as const;

const operation = {
  id: "93111111-1111-1111-1111-111111111111",
  key: "service-report.erp-orders",
  title: "ERP-SIM Auftragsliste",
  status: "published",
  connector: "typescript",
  authMode: "none",
  description: "Liest Auftraege aus ERP-SIM und verbindet customer_orders mit customers fuer das Service-Report-Dropdown.",
  requestSchemaJson: {
    fields: [
      {
        name: "order_number",
        type: "string",
      },
    ],
  },
  responseSchemaJson: {
    fields: [
      {
        name: "service_order_options_json",
        type: "json",
      },
      {
        name: "customer",
        type: "string",
      },
      {
        name: "customer_order_status",
        type: "string",
      },
      {
        name: "customer_master_status",
        type: "string",
      },
    ],
  },
  tagsJson: ["service-report", "erp-sim", "customer-orders"],
} as const;

const upsertUser = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  user: {
    id: string;
    key: string;
    displayName: string;
    email: string | null;
    description: string;
    status: string;
  },
) => {
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
    [user.id, user.key, user.displayName, user.email, user.description, user.status],
  );
};

export const seedServiceReportInstance = async (): Promise<void> => {
  await runMigrations();
  const serviceReportTemplateSource = await loadSpecFile("27_example_service_report_template.mdx");

  await withDbTransaction(async (client) => {
    await client.query(`delete from attachments where document_id in (select id from documents)`);
    await client.query(`delete from audit_events where document_id in (select id from documents)`);
    await client.query(`delete from tasks where document_id in (select id from documents)`);
    await client.query(`delete from document_assignments where document_id in (select id from documents)`);
    await client.query(`delete from documents`);

    await client.query(`delete from template_assignments`);
    await client.query(`delete from form_templates where id <> $1`, [template.id]);
    await client.query(`delete from workflow_templates where id <> $1`, [workflowTemplate.id]);
    await client.query(`delete from operations where id <> $1`, [operation.id]);

    await upsertUser(client, adminUser);

    for (const user of serviceReportUsers) {
      await upsertUser(client, user);
    }

    for (const group of groups) {
      await client.query(
        `insert into groups (id, key, name, description, status)
         values ($1, $2, $3, $4, $5)
         on conflict (id) do update
           set key = excluded.key,
               name = excluded.name,
               description = excluded.description,
               status = excluded.status,
               updated_at = now()`,
        [group.id, group.key, group.name, group.description, group.status],
      );
    }

    for (const membership of memberships) {
      await client.query(
        `insert into memberships (id, user_id, group_id, rights)
         values ($1, $2, $3, $4)
         on conflict (user_id, group_id) do update
           set rights = excluded.rights,
               updated_at = now()`,
        [membership.id, membership.userId, membership.groupId, membership.rights],
      );
    }

    await client.query(
      `insert into operations (
         operation_ref,
         id,
         key,
         title,
         name,
         status,
         description,
         connector,
         auth_mode,
         auth_strategy,
         request_schema_json,
         input_schema,
         response_schema_json,
         output_schema,
         handler_ts_source,
         tags_json,
         tags,
         module_path,
         published_at
       )
       values (
         $1, $2, $1, $3, $3, $4, $5, $6, $7, $7,
         $8::jsonb, $8::jsonb, $9::jsonb, $9::jsonb, $10, $11::jsonb, $11::jsonb,
         'db:handler_ts_source',
         now()
       )
       on conflict (operation_ref) do update
         set id = excluded.id,
             key = excluded.key,
             title = excluded.title,
             name = excluded.name,
             status = excluded.status,
             description = excluded.description,
             connector = excluded.connector,
             auth_mode = excluded.auth_mode,
             auth_strategy = excluded.auth_strategy,
             request_schema_json = excluded.request_schema_json,
             input_schema = excluded.input_schema,
             response_schema_json = excluded.response_schema_json,
             output_schema = excluded.output_schema,
             handler_ts_source = excluded.handler_ts_source,
             tags_json = excluded.tags_json,
             tags = excluded.tags,
             module_path = excluded.module_path,
             published_at = coalesce(operations.published_at, now()),
             archived_at = null,
             updated_at = now()`,
      [
        operation.key,
        operation.id,
        operation.title,
        operation.status,
        operation.description,
        operation.connector,
        operation.authMode,
        JSON.stringify(operation.requestSchemaJson),
        JSON.stringify(operation.responseSchemaJson),
        serviceReportOrderLookupHandlerSource,
        JSON.stringify(operation.tagsJson),
      ],
    );

    await client.query(
      `insert into workflow_templates (
         id, key, name, description, version, status, workflow_json, published_at
       )
       values ($1, $2, $3, $4, $5, $6, $7::jsonb, now())
       on conflict (id) do update
         set key = excluded.key,
             name = excluded.name,
             description = excluded.description,
             version = excluded.version,
             status = excluded.status,
             workflow_json = excluded.workflow_json,
             published_at = coalesce(workflow_templates.published_at, now()),
             archived_at = null,
             updated_at = now()`,
      [
        workflowTemplate.id,
        workflowTemplate.key,
        workflowTemplate.name,
        workflowTemplate.description,
        workflowTemplate.version,
        workflowTemplate.status,
        JSON.stringify(workflowTemplate.workflowJson),
      ],
    );

    await client.query(
      `insert into form_templates (
         id, key, name, description, version, status, workflow_template_id, mdx_body,
         template_keys, document_keys, table_fields, visibility_rules, published_at, form_type
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, '{}'::jsonb, now(), $12)
       on conflict (id) do update
         set key = excluded.key,
             name = excluded.name,
             description = excluded.description,
             version = excluded.version,
             status = excluded.status,
             workflow_template_id = excluded.workflow_template_id,
             mdx_body = excluded.mdx_body,
             template_keys = excluded.template_keys,
             document_keys = excluded.document_keys,
             table_fields = excluded.table_fields,
             visibility_rules = excluded.visibility_rules,
             published_at = coalesce(form_templates.published_at, now()),
             archived_at = null,
             form_type = excluded.form_type,
             updated_at = now()`,
      [
        template.id,
        template.key,
        template.name,
        template.description,
        template.version,
        template.status,
        template.workflowTemplateId,
        serviceReportTemplateSource,
        JSON.stringify(template.templateKeys),
        JSON.stringify(template.documentKeys),
        JSON.stringify(template.tableFields),
        template.formType,
      ],
    );

    await client.query(
      `insert into template_assignments (id, template_id, group_id, status, assigned_at)
       values ($1, $2, $3, $4, now())
       on conflict (template_id, group_id) do update
         set status = excluded.status,
             assigned_at = now()`,
      [templateAssignment.id, templateAssignment.templateId, templateAssignment.groupId, templateAssignment.status],
    );

    await client.query(
      `
      update document_assignments da
      set active = false,
          assigned_at = now()
      from documents d
      inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
      inner join memberships m on m.group_id = ta.group_id
      where da.document_id = d.id
        and m.user_id = da.user_id
        and d.template_id = $1
        and da.role = 'approver'
        and da.active = true
        and position('w' in m.rights) > 0
      `,
      [template.id],
    );

    await client.query(
      `
      update tasks t
      set status = 'closed',
          updated_at = now()
      from documents d
      inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
      inner join memberships m on m.group_id = ta.group_id
      where t.document_id = d.id
        and m.user_id = t.user_id
        and d.template_id = $1
        and t.role = 'approver'
        and t.status = 'open'
        and position('w' in m.rights) > 0
      `,
      [template.id],
    );
  });
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedServiceReportInstance()
    .then(() => {
      console.log("Service-Report Seed eingespielt.");
    })
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Service-Report Seed fehlgeschlagen: ${message}`);
      process.exitCode = 1;
    })
    .finally(async () => {
      await closePool();
    });
}
