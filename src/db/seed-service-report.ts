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

const productionProductLookupHandlerSource = [
  "const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() || '';",
  "",
  "const buildProductLabel = (entry) => [entry.productNumber, entry.productName, entry.productType, entry.productValid ? 'gueltig' : 'ungueltig'].filter(Boolean).join(' · ');",
  "",
  "export default defineApi(async ({ erpJson, records, selected, option, sortByText, setOptions, setFields, info, error }) => {",
  "  const productEntries = records(await erpJson('/api/products?valid=true'))",
  "    .map((entry) => ({",
  "      productNumber: pickText(entry.id),",
  "      productName: pickText(entry.name),",
  "      productType: pickText(entry.product_type),",
  "      productValid: entry.valid === true,",
  "      productStatus: entry.valid === true ? 'gueltig' : 'ungueltig',",
  "    }))",
  "    .filter((entry) => entry.productNumber.length > 0 && entry.productType === 'batch');",
  "",
  "  sortByText(productEntries, 'productName');",
  "  setOptions('product_options_json', productEntries.map((entry) => option(entry.productNumber, buildProductLabel(entry))));",
  "",
  "  const selectedProductNumber = selected('product_number');",
  "",
  "  if (!selectedProductNumber) {",
  "    return info(",
  "      'Produktliste geladen',",
  "      productEntries.length > 0",
  "        ? 'ERP-SIM-Batchprodukte stehen im Dropdown zur Auswahl bereit.'",
  "        : 'ERP-SIM liefert aktuell keine batchfaehigen Produkte.',",
  "    );",
  "  }",
  "",
  "  const matchedProduct = productEntries.find((entry) => entry.productNumber === selectedProductNumber);",
  "",
  "  if (!matchedProduct) {",
  "    return error(",
  "      'Produkt nicht gefunden',",
  "      'Das gewaehlte Produkt ist in ERP-SIM aktuell nicht als Batchprodukt verfuegbar.',",
  "    );",
  "  }",
  "",
  "  setFields({",
  "    product_number: matchedProduct.productNumber,",
  "    product_name: matchedProduct.productName,",
  "    production_line: matchedProduct.productType,",
  "    product_status: matchedProduct.productStatus,",
  "  });",
  "",
  "  return info(",
  "    'Produktdaten geladen',",
  "    'Produktname und Produkttyp wurden aus ERP-SIM uebernommen.',",
  "  );",
  "}, { errorTitle: 'ERP-SIM nicht erreichbar', fallbackMessage: 'ERP-SIM ist aktuell nicht erreichbar.' });",
].join("\n");

const productionBatchCreateHandlerSource = [
  "const pickText = (...values) => values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() || '';",
  "",
  "export default defineApi(async ({ erpJson, selected, records, setFields, info, error }) => {",
  "  const productNumber = selected('product_number');",
  "",
  "  if (!productNumber) {",
  "    return error(",
  "      'Produktnummer fehlt',",
  "      'Bitte zuerst eine Produktnummer waehlen, bevor eine Batchnummer erzeugt wird.',",
  "    );",
  "  }",
  "",
  "  const productEntries = records(await erpJson('/api/products?valid=true'));",
  "  const selectedProduct = productEntries.find((entry) => pickText(entry.id) === productNumber);",
  "  const productType = pickText(selectedProduct?.product_type);",
  "",
  "  if (!selectedProduct || productType !== 'batch') {",
  "    return error(",
  "      'Batchnummer nicht moeglich',",
  "      'Fuer das gewaehlte Produkt kann in ERP-SIM keine Batchnummer erzeugt werden.',",
  "    );",
  "  }",
  "",
  "  const payload = await erpJson('/api/batches', {",
  "    method: 'POST',",
  "    headers: { 'content-type': 'application/json' },",
  "    body: JSON.stringify({ product_id: productNumber }),",
  "  });",
  "  const batchEntry = payload && typeof payload === 'object' && !Array.isArray(payload)",
  "    ? payload",
  "    : {};",
  "  const batchNumber = pickText(batchEntry.batch_number, batchEntry.batchNumber);",
  "",
  "  if (!batchNumber) {",
  "    return error(",
  "      'Batchnummer nicht erzeugt',",
  "      'ERP-SIM hat keine gueltige Batchnummer zurueckgegeben.',",
  "    );",
  "  }",
  "",
  "  setFields({",
  "    batch_id: batchNumber,",
  "    batch_status: pickText(batchEntry.status, batchEntry.batch_status) || 'ordered',",
  "  });",
  "",
  "  return info(",
  "    'Batchnummer erzeugt',",
  "    'Batchnummer und Batchdaten wurden aus ERP-SIM uebernommen.',",
  "  );",
  "}, { errorTitle: 'ERP-SIM nicht erreichbar', fallbackMessage: 'ERP-SIM ist aktuell nicht erreichbar.' });",
].join("\n");

const adminUser = {
  id: "11111111-1111-1111-1111-111111111111",
  key: "admin",
  displayName: "Admin",
  email: null,
  description: "Initialer Admin fuer Service-Report.",
  status: "active",
  globalRoles: "a",
} as const;

const serviceReportUsers = [
  {
    id: "20000000-1111-1111-1111-111111111111",
    key: "dev",
    displayName: "Dev",
    email: "dev@service-report.local",
    description: "Entwickler fuer Formulare, Workflows und APIs.",
    status: "active",
    globalRoles: "d",
  },
  {
    id: "21111111-1111-1111-1111-111111111111",
    key: "frank",
    displayName: "Frank",
    email: "frank@service-report.local",
    description: "Kundenservice im Feldeinsatz.",
    status: "active",
    globalRoles: "",
  },
  {
    id: "22222222-1111-1111-1111-111111111111",
    key: "thomas",
    displayName: "Thomas",
    email: "thomas@service-report.local",
    description: "Kundenservice im Feldeinsatz.",
    status: "active",
    globalRoles: "",
  },
  {
    id: "33333333-1111-1111-1111-111111111111",
    key: "stefan",
    displayName: "Stefan",
    email: "stefan@service-report.local",
    description: "Bauauftrag im Feldeinsatz.",
    status: "active",
    globalRoles: "",
  },
  {
    id: "44444444-1111-1111-1111-111111111111",
    key: "markus",
    displayName: "Markus",
    email: "markus@service-report.local",
    description: "Bauauftrag im Feldeinsatz.",
    status: "active",
    globalRoles: "",
  },
  {
    id: "55555555-1111-1111-1111-111111111111",
    key: "chef",
    displayName: "Chef",
    email: "chef@service-report.local",
    description: "Assigner und Approver fuer Service- und Bauauftraege.",
    status: "active",
    globalRoles: "c",
  },
  {
    id: "66666666-1111-1111-1111-111111111111",
    key: "petra",
    displayName: "Petra",
    email: "petra@service-report.local",
    description: "Produktionsmitarbeiterin fuer Chargen- und Serienbearbeitung.",
    status: "active",
    globalRoles: "",
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
  {
    id: "63333333-1111-1111-1111-111111111111",
    key: "produktion",
    name: "Produktion",
    description: "Operative Produktionsauftraege mit Batchfuehrung.",
    status: "active",
  },
] as const;

const memberships = [
  {
    id: "71111111-1111-1111-1111-111111111111",
    userId: "21111111-1111-1111-1111-111111111111",
    groupId: "61111111-1111-1111-1111-111111111111",
    rights: "rwg",
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
  {
    id: "77777777-1111-1111-1111-111111111111",
    userId: "66666666-1111-1111-1111-111111111111",
    groupId: "63333333-1111-1111-1111-111111111111",
    rights: "rw",
  },
  {
    id: "78888888-1111-1111-1111-111111111111",
    userId: "55555555-1111-1111-1111-111111111111",
    groupId: "63333333-1111-1111-1111-111111111111",
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
    approval: {
      editors: "single",
      approvers: "single",
      submitMode: "single",
      approvalMode: "single",
    },
    hooks: [],
  },
} as const;

const productionWorkflowTemplate = {
  id: "81222222-1111-1111-1111-111111111111",
  key: "production-report.review",
  name: "Produktionsauftrag Freigabe",
  description: "Produktionsworkflow fuer Produktdaten, Batchnummern und Freigabe mit einer Approver-Stufe.",
  version: 1,
  status: "published",
  workflowJson: workflowTemplate.workflowJson,
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

const productionTemplate = {
  id: "91222222-1111-1111-1111-111111111111",
  key: "production-report",
  name: "Produktionsauftrag",
  formType: "production_record",
  description: "Produktionsformular fuer ERP-SIM-Produktdaten und Batchnummern.",
  version: 1,
  status: "published",
  workflowTemplateId: productionWorkflowTemplate.id,
  templateKeys: ["product_number"],
  documentKeys: ["batch_id"],
  tableFields: ["batch_id", "product_name", "production_line", "status"],
} as const;

const templateAssignments = [
  {
    id: "92111111-1111-1111-1111-111111111111",
    templateId: template.id,
    groupId: "61111111-1111-1111-1111-111111111111",
    status: "active",
  },
  {
    id: "92222222-1111-1111-1111-111111111111",
    templateId: productionTemplate.id,
    groupId: "63333333-1111-1111-1111-111111111111",
    status: "active",
  },
] as const;

const operations = [
  {
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
    handlerTsSource: serviceReportOrderLookupHandlerSource,
  },
  {
    id: "93222222-1111-1111-1111-111111111111",
    key: "service-report.erp-products",
    title: "ERP-SIM Produktliste",
    status: "published",
    connector: "typescript",
    authMode: "none",
    description: "Liest Produkte aus ERP-SIM und fuellt das Produktionsformular mit Produktdaten.",
    requestSchemaJson: {
      fields: [
        {
          name: "product_number",
          type: "string",
        },
      ],
    },
    responseSchemaJson: {
      fields: [
        {
          name: "product_options_json",
          type: "json",
        },
        {
          name: "product_name",
          type: "string",
        },
        {
          name: "production_line",
          type: "string",
        },
        {
          name: "product_status",
          type: "string",
        },
      ],
    },
    tagsJson: ["service-report", "erp-sim", "products"],
    handlerTsSource: productionProductLookupHandlerSource,
  },
  {
    id: "93333333-1111-1111-1111-111111111111",
    key: "service-report.erp-batches",
    title: "ERP-SIM Batchgenerator",
    status: "published",
    connector: "typescript",
    authMode: "none",
    description: "Erzeugt in ERP-SIM eine Batchnummer fuer den gewaelten Produktionsauftrag und uebernimmt die Batchdaten ins Formular.",
    requestSchemaJson: {
      fields: [
        {
          name: "product_number",
          type: "string",
        },
      ],
    },
    responseSchemaJson: {
      fields: [
        {
          name: "batch_id",
          type: "string",
        },
        {
          name: "batch_status",
          type: "string",
        },
      ],
    },
    tagsJson: ["service-report", "erp-sim", "batches"],
    handlerTsSource: productionBatchCreateHandlerSource,
  },
] as const;

const upsertUser = async (
  client: Parameters<Parameters<typeof withDbTransaction>[0]>[0],
  user: {
    id: string;
    key: string;
    displayName: string;
    email: string | null;
    description: string;
    status: string;
    globalRoles: string;
  },
) => {
  await client.query(
    `insert into users (id, key, display_name, email, description, status, global_roles)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (id) do update
       set key = excluded.key,
           display_name = excluded.display_name,
           email = excluded.email,
           description = excluded.description,
           status = excluded.status,
           global_roles = excluded.global_roles,
           updated_at = now()`,
    [user.id, user.key, user.displayName, user.email, user.description, user.status, user.globalRoles],
  );
};

export const seedServiceReportInstance = async (): Promise<void> => {
  await runMigrations();
  const serviceReportTemplateSource = await loadSpecFile("27_example_service_report_template.mdx");
  const productionTemplateSource = await loadSpecFile("28_example_production_report_template.mdx");
  const workflowTemplates = [workflowTemplate, productionWorkflowTemplate] as const;
  const formTemplates = [
    { ...template, mdxBody: serviceReportTemplateSource },
    { ...productionTemplate, mdxBody: productionTemplateSource },
  ] as const;

  await withDbTransaction(async (client) => {
    await client.query(`delete from attachments where document_id in (select id from documents)`);
    await client.query(`delete from audit_events where document_id in (select id from documents)`);
    await client.query(`delete from tasks where document_id in (select id from documents)`);
    await client.query(`delete from document_assignments where document_id in (select id from documents)`);
    await client.query(`delete from documents`);

    await client.query(`delete from template_assignments`);
    await client.query(`delete from form_templates where id <> all($1::uuid[])`, [formTemplates.map((entry) => entry.id)]);
    await client.query(`delete from workflow_templates where id <> all($1::uuid[])`, [workflowTemplates.map((entry) => entry.id)]);
    await client.query(`delete from operations where id <> all($1::uuid[])`, [operations.map((entry) => entry.id)]);

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

    for (const operation of operations) {
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
          operation.handlerTsSource,
          JSON.stringify(operation.tagsJson),
        ],
      );
    }

    for (const workflowTemplate of workflowTemplates) {
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
    }

    for (const formTemplate of formTemplates) {
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
          formTemplate.id,
          formTemplate.key,
          formTemplate.name,
          formTemplate.description,
          formTemplate.version,
          formTemplate.status,
          formTemplate.workflowTemplateId,
          formTemplate.mdxBody,
          JSON.stringify(formTemplate.templateKeys),
          JSON.stringify(formTemplate.documentKeys),
          JSON.stringify(formTemplate.tableFields),
          formTemplate.formType,
        ],
      );
    }

    for (const templateAssignment of templateAssignments) {
      await client.query(
        `insert into template_assignments (id, template_id, group_id, status, assigned_at)
         values ($1, $2, $3, $4, now())
         on conflict (template_id, group_id) do update
           set status = excluded.status,
               assigned_at = now()`,
        [templateAssignment.id, templateAssignment.templateId, templateAssignment.groupId, templateAssignment.status],
      );
    }

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
