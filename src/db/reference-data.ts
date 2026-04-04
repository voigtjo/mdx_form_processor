import { readFile } from "node:fs/promises";
import path from "node:path";

const specsDirectory = path.join(process.cwd(), "specs");

const loadSpecFile = async (fileName: string): Promise<string> => {
  return readFile(path.join(specsDirectory, fileName), "utf8");
};

const customerLookupHandlerSource = [
  "export default async function handler(input, runtime) {",
  "  const orderNumberField = input.action.args?.[0] ?? 'order_number';",
  "  const orderNumber = String(input.fieldValues[orderNumberField] ?? '').trim();",
  "",
  "  if (!orderNumber) {",
  "    return {",
  "      fieldValues: input.fieldValues,",
  "      actionState: runtime.createErrorActionState({",
  "        title: 'Auftragsnummer fehlt',",
  "        message: 'Bitte zuerst eine Auftragsnummer eingeben, bevor Kundendaten geladen werden.',",
  "        actionName: input.action.name,",
  "      }),",
  "    };",
  "  }",
  "",
  "  const matchedCustomer = await runtime.findActiveReferenceEntityByDataField({",
  "    entityType: 'customer',",
  "    field: 'order_number',",
  "    value: orderNumber,",
  "  });",
  "",
  "  if (!matchedCustomer) {",
  "    return {",
  "      fieldValues: input.fieldValues,",
  "      actionState: runtime.createInfoActionState({",
  "        title: 'Kein Kundentreffer',",
  "        message: 'In den internen Stammdaten wurde kein Serviceeinsatz mit dieser Nummer gefunden.',",
  "        actionName: input.action.name,",
  "      }),",
  "    };",
  "  }",
  "",
  "  const nextFieldValues = { ...input.fieldValues };",
  "",
  "  for (const bindTarget of input.action.bind ?? []) {",
  "    if (bindTarget === 'customer') {",
  "      nextFieldValues.customer = matchedCustomer.displayName;",
  "    }",
  "",
  "    if (bindTarget === 'service_location') {",
  "      nextFieldValues.service_location = typeof matchedCustomer.dataJson.service_location === 'string'",
  "        ? matchedCustomer.dataJson.service_location",
  "        : '';",
  "    }",
  "  }",
  "",
  "  nextFieldValues.customer_master_id = matchedCustomer.entityKey;",
  "  nextFieldValues.customer_master_status = matchedCustomer.status === 'active' ? 'Aktiv' : 'Inaktiv';",
  "  nextFieldValues.customer_order_status = typeof matchedCustomer.dataJson.order_status === 'string'",
  "    ? matchedCustomer.dataJson.order_status",
  "    : 'offen';",
  "  nextFieldValues.customer_order_created_at = typeof matchedCustomer.dataJson.order_created_at === 'string'",
  "    ? matchedCustomer.dataJson.order_created_at",
  "    : '';",
  "",
  "  return {",
  "    fieldValues: nextFieldValues,",
  "    actionState: runtime.createInfoActionState({",
  "      title: 'Kundendaten geladen',",
  "      message: 'Kundendaten wurden aus den internen Stammdaten geladen.',",
  "      actionName: input.action.name,",
  "    }),",
  "  };",
  "}",
].join("\n");

const productSuggestHandlerSource = [
  "const tokenize = (value) => String(value ?? '')",
  "  .trim()",
  "  .toLowerCase()",
  "  .split(/[^a-z0-9]+/i)",
  "  .map((token) => token.trim())",
  "  .filter((token) => token.length > 1);",
  "",
  "const scoreProductMatch = (description, product) => {",
  "  const descriptionTokens = new Set(tokenize(description));",
  "  const keywordTokens = tokenize([",
  "    product.displayName,",
  "    typeof product.dataJson.product_type === 'string' ? product.dataJson.product_type : '',",
  "    typeof product.dataJson.match_terms === 'string' ? product.dataJson.match_terms : '',",
  "  ].join(' '));",
  "  let score = 0;",
  "",
  "  for (const token of keywordTokens) {",
  "    if (descriptionTokens.has(token)) {",
  "      score += 2;",
  "    }",
  "  }",
  "",
  "  if (descriptionTokens.has('wartung') && keywordTokens.includes('wartung')) score += 3;",
  "  if (descriptionTokens.has('pruefung') && keywordTokens.includes('pruefung')) score += 3;",
  "  if (descriptionTokens.has('montage') && keywordTokens.includes('montage')) score += 3;",
  "",
  "  return score;",
  "};",
  "",
  "export default async function handler(input, runtime) {",
  "  const workDescriptionField = input.action.args?.[0] ?? 'work_description';",
  "  const workDescription = runtime.richTextHtmlToPlainText(input.fieldValues[workDescriptionField]);",
  "",
  "  if (!workDescription) {",
  "    return {",
  "      fieldValues: input.fieldValues,",
  "      actionState: runtime.createErrorActionState({",
  "        title: 'Taetigkeitsbeschreibung fehlt',",
  "        message: 'Bitte zuerst eine Taetigkeitsbeschreibung eingeben, bevor ein Produktvorschlag geholt wird.',",
  "        actionName: input.action.name,",
  "      }),",
  "    };",
  "  }",
  "",
  "  const activeProducts = (await runtime.listReferenceEntities('product')).filter((product) => product.status === 'active');",
  "  const matchedProduct = activeProducts",
  "    .map((product) => ({ product, score: scoreProductMatch(workDescription, product) }))",
  "    .sort((left, right) => right.score - left.score || left.product.displayName.localeCompare(right.product.displayName))",
  "    .find((entry) => entry.score > 0)?.product;",
  "",
  "  if (!matchedProduct) {",
  "    return {",
  "      fieldValues: input.fieldValues,",
  "      actionState: runtime.createInfoActionState({",
  "        title: 'Kein Produktvorschlag',",
  "        message: 'In den internen Produktstammdaten wurde kein passendes Produkt gefunden.',",
  "        actionName: input.action.name,",
  "      }),",
  "    };",
  "  }",
  "",
  "  const nextFieldValues = { ...input.fieldValues };",
  "",
  "  for (const bindTarget of input.action.bind ?? []) {",
  "    if (bindTarget === 'material') {",
  "      nextFieldValues.material = matchedProduct.displayName;",
  "    }",
  "  }",
  "",
  "  nextFieldValues.product_master_id = matchedProduct.entityKey;",
  "  nextFieldValues.product_master_type = typeof matchedProduct.dataJson.product_type === 'string'",
  "    ? matchedProduct.dataJson.product_type",
  "    : '';",
  "  nextFieldValues.product_master_status = matchedProduct.status === 'active' ? 'Aktiv' : 'Inaktiv';",
  "",
  "  return {",
  "    fieldValues: nextFieldValues,",
  "    actionState: runtime.createInfoActionState({",
  "      title: 'Produktvorschlag geladen',",
  "      message: 'Produktvorschlag wurde aus den internen Produktstammdaten geladen.',",
  "      actionName: input.action.name,",
  "    }),",
  "  };",
  "}",
].join("\n");

const customerListHandlerSource = [
  "export default async function handler(input, runtime) {",
  "  return {",
  "    items: await runtime.listReferenceEntities('customer'),",
  "  };",
  "}",
].join("\n");

const productListHandlerSource = [
  "export default async function handler(input, runtime) {",
  "  return {",
  "    items: await runtime.listReferenceEntities('product'),",
  "  };",
  "}",
].join("\n");

type SeedUser = {
  id: string;
  key: string;
  displayName: string;
  email: string;
  description?: string;
  status: "active" | "inactive";
};

type SeedGroup = {
  id: string;
  key: string;
  name: string;
  description: string;
  status: "active" | "inactive";
};

type SeedMembership = {
  id: string;
  userId: string;
  groupId: string;
  rights: string;
};

type SeedOperation = {
  id: string;
  key: string;
  title: string;
  status: "draft" | "published" | "inactive" | "archived";
  connector: string;
  authMode: string;
  description: string;
  requestSchemaJson?: {
    fields: Array<{
      name: string;
      type: string;
      required?: boolean;
      description?: string;
    }>;
  };
  responseSchemaJson?: {
    fields: Array<{
      name: string;
      type: string;
      required?: boolean;
      description?: string;
    }>;
  };
  handlerTsSource: string;
  tags: string[];
};

type SeedWorkflow = {
  id: string;
  key: string;
  name: string;
  description: string;
  version: number;
  status: "published";
  workflowJson: Record<string, unknown>;
};

type SeedTemplate = {
  id: string;
  key: string;
  name: string;
  formType: "customer_order" | "production_record" | "qualification_record" | "generic_form";
  description: string;
  version: number;
  status: "published";
  workflowTemplateId: string;
  mdxBody: string;
  templateKeys: string[];
  documentKeys: string[];
  tableFields: string[];
};

type SeedTemplateAssignment = {
  id: string;
  templateId: string;
  groupId: string;
  status: "active";
  assignedAt: string;
};

type SeedDocument = {
  id: string;
  templateId: string;
  templateVersion: number;
  workflowTemplateId: string;
  workflowTemplateVersion: number;
  status: string;
  dataJson: Record<string, unknown>;
  externalJson: Record<string, unknown>;
  snapshotJson: Record<string, unknown>;
  integrationContextJson: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type SeedDocumentAssignment = {
  id: string;
  documentId: string;
  userId: string;
  role: "editor" | "approver";
  assignedBy: string;
  assignedAt: string;
  active: boolean;
};

type SeedTask = {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  action: string;
  status: "open" | "closed";
  role: "editor" | "approver";
  createdAt: string;
  updatedAt: string;
};

type SeedAttachment = {
  id: string;
  documentId: string;
  filename: string;
  mimeType: string;
  size: number;
  storageKey: string;
  uploadedBy: string;
  createdAt: string;
};

type SeedAuditEvent = {
  id: string;
  documentId: string;
  eventType: string;
  actorUserId?: string;
  message: string;
  payloadJson: Record<string, unknown>;
  createdAt: string;
};

type SeedReferenceEntityImport = {
  entityType: "customer" | "product";
  csvText: string;
};

export type ReferenceSeedData = {
  users: SeedUser[];
  groups: SeedGroup[];
  memberships: SeedMembership[];
  operations: SeedOperation[];
  workflows: SeedWorkflow[];
  templates: SeedTemplate[];
  templateAssignments: SeedTemplateAssignment[];
  documents: SeedDocument[];
  documentAssignments: SeedDocumentAssignment[];
  tasks: SeedTask[];
  attachments: SeedAttachment[];
  auditEvents: SeedAuditEvent[];
  entityImports: SeedReferenceEntityImport[];
};

const customerOrderWorkflowJson = {
  initialStatus: "created",
  statuses: ["created", "assigned", "started", "progressed", "submitted", "approved", "rejected", "archived"],
  actions: {
    assign: {
      from: ["created"],
      to: "assigned",
      allowedRoles: ["editor"],
      completionMode: "single",
    },
    start: {
      from: ["assigned"],
      to: "started",
      allowedRoles: ["editor"],
      completionMode: "single",
    },
    save: {
      from: ["started", "progressed"],
      to: "progressed",
      allowedRoles: ["editor"],
      completionMode: "single",
    },
    submit: {
      from: ["assigned", "started", "progressed"],
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
    reject: {
      from: ["submitted"],
      to: "progressed",
      allowedRoles: ["approver"],
      completionMode: "single",
    },
    archive: {
      from: ["approved", "rejected"],
      to: "archived",
      allowedRoles: ["approver"],
      completionMode: "single",
    },
  },
  fieldRules: {
    submitted: {
      editable: [],
      readonly: ["order_number", "customer", "service_location", "work_description", "material", "work_signature"],
    },
    approved: {
      editable: [],
      readonly: ["order_number", "customer", "service_location", "work_description", "material", "work_signature"],
    },
    archived: {
      editable: [],
      readonly: ["order_number", "customer", "service_location", "work_description", "material", "work_signature"],
    },
  },
  approval: {
    editors: "single",
    approvers: "single",
    submitMode: "single",
    approvalMode: "single",
  },
  hooks: [],
};

const productionWorkflowJson = {
  initialStatus: "created",
  statuses: ["created", "assigned", "started", "progressed", "submitted", "approved", "rejected", "archived"],
  actions: {
    assign: {
      from: ["created"],
      to: "assigned",
      allowedRoles: ["editor"],
      completionMode: "single",
    },
    start: {
      from: ["assigned"],
      to: "started",
      allowedRoles: ["editor"],
      completionMode: "single",
    },
    save: {
      from: ["started", "progressed"],
      to: "progressed",
      allowedRoles: ["editor"],
      completionMode: "single",
    },
    submit: {
      from: ["assigned", "started", "progressed"],
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
    reject: {
      from: ["submitted"],
      to: "progressed",
      allowedRoles: ["approver"],
      completionMode: "single",
    },
    archive: {
      from: ["approved", "rejected"],
      to: "archived",
      allowedRoles: ["approver"],
      completionMode: "single",
    },
  },
  fieldRules: {
    submitted: {
      editable: [],
      readonly: ["batch_id", "serial_number", "product_name", "production_line", "process_steps", "work_signature"],
    },
    approved: {
      editable: [],
      readonly: ["batch_id", "serial_number", "product_name", "production_line", "process_steps", "work_signature"],
    },
    archived: {
      editable: [],
      readonly: ["batch_id", "serial_number", "product_name", "production_line", "process_steps", "work_signature"],
    },
  },
  approval: {
    editors: "single",
    approvers: "single",
    submitMode: "single",
    approvalMode: "single",
  },
  hooks: [],
};

const qualificationWorkflowJson = {
  initialStatus: "created",
  statuses: ["created", "assigned", "submitted", "approved", "rejected", "archived"],
  actions: {
    assign: {
      from: ["created"],
      to: "assigned",
      allowedRoles: ["editor"],
      completionMode: "single",
    },
    submit: {
      from: ["assigned"],
      to: "submitted",
      allowedRoles: ["editor"],
      completionMode: "all",
    },
    approve: {
      from: ["submitted"],
      to: "approved",
      allowedRoles: ["approver"],
      completionMode: "single",
    },
    reject: {
      from: ["submitted"],
      to: "rejected",
      allowedRoles: ["approver"],
      completionMode: "single",
    },
    archive: {
      from: ["approved", "rejected"],
      to: "archived",
      allowedRoles: ["approver"],
      completionMode: "single",
    },
  },
  fieldRules: {
    submitted: {
      editable: [],
      readonly: [
        "qualification_record_number",
        "qualification_title",
        "owner_user_id",
        "attendee_user_ids",
        "valid_until",
        "qualification_result",
        "qualification_topics",
        "work_signature",
      ],
    },
    approved: {
      editable: [],
      readonly: [
        "qualification_record_number",
        "qualification_title",
        "owner_user_id",
        "attendee_user_ids",
        "valid_until",
        "qualification_result",
        "qualification_topics",
        "work_signature",
      ],
    },
    archived: {
      editable: [],
      readonly: [
        "qualification_record_number",
        "qualification_title",
        "owner_user_id",
        "attendee_user_ids",
        "valid_until",
        "qualification_result",
        "qualification_topics",
        "work_signature",
      ],
    },
  },
  approval: {
    editors: "multiple",
    approvers: "single",
    submitMode: "all",
    approvalMode: "single",
  },
  hooks: [],
};

const genericFormWorkflowJson = {
  initialStatus: "created",
  statuses: ["created", "assigned", "submitted", "approved", "rejected", "archived"],
  actions: {
    assign: {
      from: ["created"],
      to: "assigned",
      allowedRoles: ["editor"],
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
    reject: {
      from: ["submitted"],
      to: "rejected",
      allowedRoles: ["approver"],
      completionMode: "single",
    },
    archive: {
      from: ["approved", "rejected"],
      to: "archived",
      allowedRoles: ["approver"],
      completionMode: "single",
    },
  },
  fieldRules: {
    submitted: {
      editable: [],
      readonly: ["generic_form_title", "generic_form_description", "generic_form_note", "work_signature"],
    },
    approved: {
      editable: [],
      readonly: ["generic_form_title", "generic_form_description", "generic_form_note", "work_signature"],
    },
    archived: {
      editable: [],
      readonly: ["generic_form_title", "generic_form_description", "generic_form_note", "work_signature"],
    },
  },
  approval: {
    editors: "single",
    approvers: "single",
    submitMode: "single",
    approvalMode: "single",
  },
  hooks: [],
};

export const getReferenceSeedData = async (): Promise<ReferenceSeedData> => {
  const customerOrderMdx = await loadSpecFile("21_example_form_template.mdx");
  const productionBatchMdx = await loadSpecFile("24_example_production_batch_form_template.mdx");
  const qualificationRecordMdx = await loadSpecFile("23_example_qualification_form_template.mdx");
  const genericFormMdx = await loadSpecFile("26_example_generic_form_template.mdx");
  const customersCsv = await loadSpecFile("next/examples/customers_import.csv");
  const productsCsv = await loadSpecFile("next/examples/products_import.csv");

  return {
    users: [
      {
        id: "11111111-1111-1111-1111-111111111111",
        key: "admin",
        displayName: "Admin",
        email: "admin@example.local",
        description: "Plattform-Admin fuer Referenz- und Freigabefluss.",
        status: "active",
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        key: "service-auftrag-freigabe",
        displayName: "Service Auftrag / Freigabe",
        email: "service-lead@example.local",
        status: "active",
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        key: "service-durchfuehrung-dokumentation",
        displayName: "Service Durchfuehrung / Dokumentation",
        email: "service-worker@example.local",
        status: "active",
      },
      {
        id: "44444444-4444-4444-4444-444444444444",
        key: "produktion-auftrag-freigabe",
        displayName: "Produktion Auftrag / Freigabe",
        email: "production-lead@example.local",
        status: "active",
      },
      {
        id: "55555555-5555-5555-5555-555555555555",
        key: "produktion-durchfuehrung-dokumentation",
        displayName: "Produktion Durchfuehrung / Dokumentation",
        email: "production-worker@example.local",
        status: "active",
      },
    ],
    groups: [
      {
        id: "66666666-6666-6666-6666-666666666661",
        key: "kundenservice",
        name: "Kundenservice",
        description: "Service-Auftraege, Durchfuehrung und Freigabe beim Kunden.",
        status: "active",
      },
      {
        id: "66666666-6666-6666-6666-666666666662",
        key: "produktion",
        name: "Produktion",
        description: "Produktionsauftraege, Dokumentation und Freigabe.",
        status: "active",
      },
    ],
    memberships: [
      {
        id: "77777777-7777-7777-7777-777777777771",
        userId: "11111111-1111-1111-1111-111111111111",
        groupId: "66666666-6666-6666-6666-666666666661",
        rights: "rwx",
      },
      {
        id: "77777777-7777-7777-7777-777777777772",
        userId: "11111111-1111-1111-1111-111111111111",
        groupId: "66666666-6666-6666-6666-666666666662",
        rights: "rwx",
      },
      {
        id: "77777777-7777-7777-7777-777777777773",
        userId: "22222222-2222-2222-2222-222222222222",
        groupId: "66666666-6666-6666-6666-666666666661",
        rights: "rwx",
      },
      {
        id: "77777777-7777-7777-7777-777777777774",
        userId: "33333333-3333-3333-3333-333333333333",
        groupId: "66666666-6666-6666-6666-666666666661",
        rights: "rwx",
      },
      {
        id: "77777777-7777-7777-7777-777777777775",
        userId: "44444444-4444-4444-4444-444444444444",
        groupId: "66666666-6666-6666-6666-666666666662",
        rights: "rwx",
      },
      {
        id: "77777777-7777-7777-7777-777777777776",
        userId: "55555555-5555-5555-5555-555555555555",
        groupId: "66666666-6666-6666-6666-666666666662",
        rights: "rwx",
      },
    ],
    operations: [
      {
        id: "12121212-1212-1212-1212-121212121211",
        key: "customers.lookup",
        title: "Customer Lookup",
        status: "published",
        connector: "typescript",
        authMode: "none",
        description: "Liest Einsatzdaten und Kundenadresse aus den internen Customer-Stammdaten.",
        tags: ["typescript-api", "lookup", "forms", "customers"],
        requestSchemaJson: {
          fields: [
            {
              name: "order_number",
              type: "string",
              required: true,
              description: "Einsatznummer fuer den internen Kundenservice-Lookup.",
            },
          ],
        },
        responseSchemaJson: {
          fields: [
            { name: "customer", type: "string", description: "Angezeigter Kundenname." },
            { name: "service_location", type: "string", description: "Einsatzort fuer den Serviceeinsatz." },
            { name: "customer_master_id", type: "string", description: "Technischer Stammdatenschluessel." },
            { name: "customer_master_status", type: "string", description: "Stammdatenstatus." },
            { name: "customer_order_status", type: "string", description: "Status des Einsatzvorgangs." },
            { name: "customer_order_created_at", type: "string", description: "Anlagezeitpunkt des Einsatzes." },
          ],
        },
        handlerTsSource: customerLookupHandlerSource,
      },
      {
        id: "12121212-1212-1212-1212-121212121212",
        key: "products.suggest",
        title: "Product Suggest",
        status: "published",
        connector: "typescript",
        authMode: "none",
        description: "Schlaegt ein internes Produkt oder Wartungsset aus den Product-Stammdaten vor.",
        tags: ["typescript-api", "lookup", "forms", "products"],
        requestSchemaJson: {
          fields: [
            {
              name: "work_description",
              type: "html|string",
              required: true,
              description: "Taetigkeitsbeschreibung als Grundlage fuer den Vorschlag.",
            },
          ],
        },
        responseSchemaJson: {
          fields: [
            { name: "material", type: "string", description: "Vorgeschlagenes Produkt oder Material." },
            { name: "product_master_id", type: "string", description: "Technischer Stammdatenschluessel." },
            { name: "product_master_type", type: "string", description: "Produkttyp." },
            { name: "product_master_status", type: "string", description: "Stammdatenstatus." },
          ],
        },
        handlerTsSource: productSuggestHandlerSource,
      },
      {
        id: "12121212-1212-1212-1212-121212121213",
        key: "customers.list",
        title: "Customers List",
        status: "published",
        connector: "typescript",
        authMode: "none",
        description: "Liefert interne Customer-Stammdaten fuer API und CSV-basierte Referenzwelt.",
        tags: ["typescript-api", "read", "customers"],
        handlerTsSource: customerListHandlerSource,
      },
      {
        id: "12121212-1212-1212-1212-121212121214",
        key: "products.list",
        title: "Products List",
        status: "published",
        connector: "typescript",
        authMode: "none",
        description: "Liefert interne Product-Stammdaten fuer API und CSV-basierte Referenzwelt.",
        tags: ["typescript-api", "read", "products"],
        handlerTsSource: productListHandlerSource,
      },
    ],
    workflows: [
      {
        id: "88888888-8888-8888-8888-888888888881",
        key: "customer-order.group-submit.v1",
        name: "Kundenservice-Dokumentation Freigabe",
        description: "Workflow fuer Serviceeinsaetze, Dokumentation und Freigabe.",
        version: 1,
        status: "published",
        workflowJson: customerOrderWorkflowJson,
      },
      {
        id: "88888888-8888-8888-8888-888888888882",
        key: "production.standard.v1",
        name: "Produktionsdokumentation Freigabe",
        description: "Workflow fuer batch- und serienbezogene Produktionsdokumentation.",
        version: 1,
        status: "published",
        workflowJson: productionWorkflowJson,
      },
      {
        id: "88888888-8888-8888-8888-888888888883",
        key: "qualification.review.v1",
        name: "Qualifikationsnachweis Review",
        description: "Workflow fuer Mehrbenutzer-Nachweise mit per-User Submit und Review.",
        version: 1,
        status: "published",
        workflowJson: qualificationWorkflowJson,
      },
      {
        id: "88888888-8888-8888-8888-888888888884",
        key: "generic.form.review.v1",
        name: "Generisches Formular Freigabe",
        description: "Kleiner Standardworkflow fuer einfache generische Formulare.",
        version: 1,
        status: "published",
        workflowJson: genericFormWorkflowJson,
      },
    ],
    templates: [
      {
        id: "99999999-9999-9999-9999-999999999991",
        key: "customer-order-test",
        name: "Kundenservice-Dokumentation",
        formType: "customer_order",
        description: "Serviceeinsatz mit internem Customer- und Product-Lookup.",
        version: 1,
        status: "published",
        workflowTemplateId: "88888888-8888-8888-8888-888888888881",
        mdxBody: customerOrderMdx,
        templateKeys: ["order_number"],
        documentKeys: ["customer_order_number"],
        tableFields: ["customer_order_number", "customer_name", "service_location", "material", "approval_status"],
      },
      {
        id: "99999999-9999-9999-9999-999999999992",
        key: "production-batch",
        name: "Produktionsdokumentation",
        formType: "production_record",
        description: "Batch- und serienbezogene Produktionsdokumentation mit Grid fuer Schritte.",
        version: 1,
        status: "published",
        workflowTemplateId: "88888888-8888-8888-8888-888888888882",
        mdxBody: productionBatchMdx,
        templateKeys: ["product_name"],
        documentKeys: ["batch_id"],
        tableFields: ["batch_id", "serial_number", "product_name", "production_line"],
      },
      {
        id: "99999999-9999-9999-9999-999999999993",
        key: "qualification-record",
        name: "Qualifikationsnachweis",
        formType: "qualification_record",
        description: "Mehrbenutzer-Nachweis fuer Service und Produktion mit Fragen und per-User Submit.",
        version: 1,
        status: "published",
        workflowTemplateId: "88888888-8888-8888-8888-888888888883",
        mdxBody: qualificationRecordMdx,
        templateKeys: [],
        documentKeys: ["qualification_record_number"],
        tableFields: ["qualification_record_number", "qualification_title", "owner_user_id", "valid_until"],
      },
      {
        id: "99999999-9999-9999-9999-999999999994",
        key: "generic-form",
        name: "Generisches Formular",
        formType: "generic_form",
        description: "Einfaches generisches Formular fuer interne Freigaben.",
        version: 1,
        status: "published",
        workflowTemplateId: "88888888-8888-8888-8888-888888888884",
        mdxBody: genericFormMdx,
        templateKeys: [],
        documentKeys: ["generic_form_title"],
        tableFields: ["generic_form_title", "approval_status"],
      },
    ],
    templateAssignments: [
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
        templateId: "99999999-9999-9999-9999-999999999991",
        groupId: "66666666-6666-6666-6666-666666666661",
        status: "active",
        assignedAt: "2026-04-03T08:00:00.000Z",
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
        templateId: "99999999-9999-9999-9999-999999999992",
        groupId: "66666666-6666-6666-6666-666666666662",
        status: "active",
        assignedAt: "2026-04-03T08:00:00.000Z",
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
        templateId: "99999999-9999-9999-9999-999999999993",
        groupId: "66666666-6666-6666-6666-666666666661",
        status: "active",
        assignedAt: "2026-04-03T08:00:00.000Z",
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4",
        templateId: "99999999-9999-9999-9999-999999999993",
        groupId: "66666666-6666-6666-6666-666666666662",
        status: "active",
        assignedAt: "2026-04-03T08:00:00.000Z",
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5",
        templateId: "99999999-9999-9999-9999-999999999994",
        groupId: "66666666-6666-6666-6666-666666666661",
        status: "active",
        assignedAt: "2026-04-03T08:00:00.000Z",
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6",
        templateId: "99999999-9999-9999-9999-999999999994",
        groupId: "66666666-6666-6666-6666-666666666662",
        status: "active",
        assignedAt: "2026-04-03T08:00:00.000Z",
      },
    ],
    documents: [
      {
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1",
        templateId: "99999999-9999-9999-9999-999999999991",
        templateVersion: 1,
        workflowTemplateId: "88888888-8888-8888-8888-888888888881",
        workflowTemplateVersion: 1,
        status: "progressed",
        dataJson: {
          customer_order_number: "KD-2026-1007",
          customer_name: "Baukontor Nord",
          service_location: "Lagerhalle 2 Bremen",
          customer_master_id: "customer-baukontor",
          customer_master_status: "Aktiv",
          customer_order_status: "in_bearbeitung",
          customer_order_created_at: "2026-04-02T08:15:00.000Z",
          work_description: "<p>Wartung der Hallenheizung mit Filterwechsel und Funktionspruefung.</p>",
          material: "Wartungsset Heizung",
          product_master_id: "product-heating-maintenance-kit",
          product_master_type: "Wartungsset",
          product_master_status: "Aktiv",
          labor_hours: "2.50",
          travel_hours: "0.75",
          break_minutes: "15",
          approval_status: "pruefung",
          work_signature: "Service Durchfuehrung / Dokumentation",
          work_signature_at: "2026-04-03T10:15:00.000Z",
        },
        externalJson: {},
        snapshotJson: {
          masterdataSource: "csv",
        },
        integrationContextJson: {},
        createdBy: "22222222-2222-2222-2222-222222222222",
        createdAt: "2026-04-03T08:30:00.000Z",
        updatedAt: "2026-04-03T10:15:00.000Z",
      },
      {
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2",
        templateId: "99999999-9999-9999-9999-999999999992",
        templateVersion: 1,
        workflowTemplateId: "88888888-8888-8888-8888-888888888882",
        workflowTemplateVersion: 1,
        status: "progressed",
        dataJson: {
          batch_id: "PB-2026-0042",
          serial_number: "SN-2026-0042-A",
          product_name: "Steuerkasten Serie S2",
          production_line: "Linie 3",
          process_steps: [
            {
              step: "Vorbereitung",
              station: "Linie 3",
              target_qty: "12",
              actual_qty: "12",
              result: "Material bereitgestellt",
            },
            {
              step: "Endpruefung",
              station: "QS",
              target_qty: "12",
              actual_qty: "12",
              result: "Freigabe vorbereitet",
            },
          ],
          approval_status: "pruefung",
          work_signature: "Produktion Durchfuehrung / Dokumentation",
          work_signature_at: "2026-04-03T09:55:00.000Z",
        },
        externalJson: {},
        snapshotJson: {
          gridSlice: "live",
        },
        integrationContextJson: {},
        createdBy: "44444444-4444-4444-4444-444444444444",
        createdAt: "2026-04-03T08:40:00.000Z",
        updatedAt: "2026-04-03T09:55:00.000Z",
      },
      {
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3",
        templateId: "99999999-9999-9999-9999-999999999993",
        templateVersion: 1,
        workflowTemplateId: "88888888-8888-8888-8888-888888888883",
        workflowTemplateVersion: 1,
        status: "assigned",
        dataJson: {
          qualification_record_number: "QN-2026-001",
          qualification_title: "Arbeitsschutz und digitale Dokumentation",
          owner_user_id: "11111111-1111-1111-1111-111111111111",
          attendee_user_ids: [
            "33333333-3333-3333-3333-333333333333",
            "55555555-5555-5555-5555-555555555555",
          ],
          valid_until: "2027-03-31",
          approval_status: "offen",
          qualification_participant_states: {
            "33333333-3333-3333-3333-333333333333": {
              savedAt: "2026-04-03T09:10:00.000Z",
              fieldValues: {
                qualification_result: "sicher",
                qualification_topics: ["Arbeitsschutz", "Dokumentation"],
              },
              signature: "Service Durchfuehrung / Dokumentation",
              signatureAt: "2026-04-03T09:10:00.000Z",
            },
          },
        },
        externalJson: {},
        snapshotJson: {},
        integrationContextJson: {},
        createdBy: "11111111-1111-1111-1111-111111111111",
        createdAt: "2026-04-03T09:00:00.000Z",
        updatedAt: "2026-04-03T09:10:00.000Z",
      },
      {
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4",
        templateId: "99999999-9999-9999-9999-999999999994",
        templateVersion: 1,
        workflowTemplateId: "88888888-8888-8888-8888-888888888884",
        workflowTemplateVersion: 1,
        status: "assigned",
        dataJson: {
          generic_form_title: "Generisches Formular GF-2026-001",
          generic_form_description: "Interner Referenzfall fuer einen bewusst einfachen vierten Formulartyp.",
          generic_form_note: "<p>Kurzer Nachweis fuer einen generischen Freigabefall.</p>",
          approval_status: "offen",
        },
        externalJson: {},
        snapshotJson: {},
        integrationContextJson: {},
        createdBy: "11111111-1111-1111-1111-111111111111",
        createdAt: "2026-04-03T09:20:00.000Z",
        updatedAt: "2026-04-03T09:20:00.000Z",
      },
    ],
    documentAssignments: [
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1",
        userId: "33333333-3333-3333-3333-333333333333",
        role: "editor",
        assignedBy: "22222222-2222-2222-2222-222222222222",
        assignedAt: "2026-04-03T08:35:00.000Z",
        active: true,
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1",
        userId: "22222222-2222-2222-2222-222222222222",
        role: "approver",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-04-03T08:35:00.000Z",
        active: true,
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2",
        userId: "55555555-5555-5555-5555-555555555555",
        role: "editor",
        assignedBy: "44444444-4444-4444-4444-444444444444",
        assignedAt: "2026-04-03T08:45:00.000Z",
        active: true,
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2",
        userId: "44444444-4444-4444-4444-444444444444",
        role: "approver",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-04-03T08:45:00.000Z",
        active: true,
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb5",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3",
        userId: "33333333-3333-3333-3333-333333333333",
        role: "editor",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-04-03T09:00:00.000Z",
        active: true,
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb6",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3",
        userId: "55555555-5555-5555-5555-555555555555",
        role: "editor",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-04-03T09:00:00.000Z",
        active: true,
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb7",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3",
        userId: "11111111-1111-1111-1111-111111111111",
        role: "approver",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-04-03T09:00:00.000Z",
        active: true,
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb8",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4",
        userId: "33333333-3333-3333-3333-333333333333",
        role: "editor",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-04-03T09:20:00.000Z",
        active: true,
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb9",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4",
        userId: "11111111-1111-1111-1111-111111111111",
        role: "approver",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-04-03T09:20:00.000Z",
        active: true,
      },
    ],
    tasks: [
      {
        id: "cccccccc-cccc-cccc-cccc-ccccccccccc1",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1",
        userId: "22222222-2222-2222-2222-222222222222",
        title: "Serviceeinsatz KD-2026-1007 freigeben",
        action: "approve",
        status: "open",
        role: "approver",
        createdAt: "2026-04-03T10:15:00.000Z",
        updatedAt: "2026-04-03T10:15:00.000Z",
      },
      {
        id: "cccccccc-cccc-cccc-cccc-ccccccccccc2",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2",
        userId: "55555555-5555-5555-5555-555555555555",
        title: "Produktionsdokumentation PB-2026-0042 weiterfuehren",
        action: "save",
        status: "open",
        role: "editor",
        createdAt: "2026-04-03T09:55:00.000Z",
        updatedAt: "2026-04-03T09:55:00.000Z",
      },
      {
        id: "cccccccc-cccc-cccc-cccc-ccccccccccc3",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3",
        userId: "33333333-3333-3333-3333-333333333333",
        title: "Qualifikationsnachweis QN-2026-001 submitten",
        action: "submit",
        status: "open",
        role: "editor",
        createdAt: "2026-04-03T09:10:00.000Z",
        updatedAt: "2026-04-03T09:10:00.000Z",
      },
      {
        id: "cccccccc-cccc-cccc-cccc-ccccccccccc4",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3",
        userId: "55555555-5555-5555-5555-555555555555",
        title: "Qualifikationsnachweis QN-2026-001 submitten",
        action: "submit",
        status: "open",
        role: "editor",
        createdAt: "2026-04-03T09:10:00.000Z",
        updatedAt: "2026-04-03T09:10:00.000Z",
      },
      {
        id: "cccccccc-cccc-cccc-cccc-ccccccccccc5",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4",
        userId: "33333333-3333-3333-3333-333333333333",
        title: "Generisches Formular GF-2026-001 weiterbearbeiten",
        action: "save",
        status: "open",
        role: "editor",
        createdAt: "2026-04-03T09:20:00.000Z",
        updatedAt: "2026-04-03T09:20:00.000Z",
      },
    ],
    attachments: [
      {
        id: "dddddddd-dddd-dddd-dddd-ddddddddddd1",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1",
        filename: "kundenauftrag-checkliste.pdf",
        mimeType: "application/pdf",
        size: 148320,
        storageKey: "reference/kundenauftrag/kd-2026-1007/checkliste.pdf",
        uploadedBy: "33333333-3333-3333-3333-333333333333",
        createdAt: "2026-04-03T09:40:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-ddddddddddd2",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2",
        filename: "linienfoto.jpg",
        mimeType: "image/jpeg",
        size: 214220,
        storageKey: "reference/produktion/pb-2026-0042/linienfoto.jpg",
        uploadedBy: "55555555-5555-5555-5555-555555555555",
        createdAt: "2026-04-03T09:20:00.000Z",
      },
    ],
    auditEvents: [
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee1",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1",
        eventType: "created",
        actorUserId: "22222222-2222-2222-2222-222222222222",
        message: "Serviceeinsatz KD-2026-1007 angelegt.",
        payloadJson: {},
        createdAt: "2026-04-03T08:30:00.000Z",
      },
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1",
        eventType: "saved",
        actorUserId: "33333333-3333-3333-3333-333333333333",
        message: "Serviceeinsatz KD-2026-1007 gespeichert.",
        payloadJson: {},
        createdAt: "2026-04-03T10:15:00.000Z",
      },
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee3",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2",
        eventType: "created",
        actorUserId: "44444444-4444-4444-4444-444444444444",
        message: "Produktionsdokumentation PB-2026-0042 angelegt.",
        payloadJson: {},
        createdAt: "2026-04-03T08:40:00.000Z",
      },
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee4",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee2",
        eventType: "saved",
        actorUserId: "55555555-5555-5555-5555-555555555555",
        message: "Produktionsdokumentation PB-2026-0042 gespeichert.",
        payloadJson: {},
        createdAt: "2026-04-03T09:55:00.000Z",
      },
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee5",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3",
        eventType: "created",
        actorUserId: "11111111-1111-1111-1111-111111111111",
        message: "Qualifikationsnachweis QN-2026-001 angelegt.",
        payloadJson: {},
        createdAt: "2026-04-03T09:00:00.000Z",
      },
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee6",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee3",
        eventType: "saved",
        actorUserId: "33333333-3333-3333-3333-333333333333",
        message: "Teilnehmerstand fuer QN-2026-001 gespeichert.",
        payloadJson: {},
        createdAt: "2026-04-03T09:10:00.000Z",
      },
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee7",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee4",
        eventType: "created",
        actorUserId: "11111111-1111-1111-1111-111111111111",
        message: "Generisches Formular GF-2026-001 angelegt.",
        payloadJson: {},
        createdAt: "2026-04-03T09:20:00.000Z",
      },
    ],
    entityImports: [
      {
        entityType: "customer",
        csvText: customersCsv,
      },
      {
        entityType: "product",
        csvText: productsCsv,
      },
    ],
  };
};
