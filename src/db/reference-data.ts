import { readFile } from "node:fs/promises";
import path from "node:path";

const specsDirectory = path.join(process.cwd(), "specs");

const loadSpecFile = async (fileName: string): Promise<string> => {
  return readFile(path.join(specsDirectory, fileName), "utf8");
};

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
  operationRef: string;
  name: string;
  connector: string;
  modulePath: string;
  authStrategy: string;
  description: string;
  tags: string[];
  inputSchema?: {
    fields: Array<{
      name: string;
      type: string;
      required?: boolean;
      description?: string;
    }>;
  };
  outputSchema?: {
    fields: Array<{
      name: string;
      type: string;
      required?: boolean;
      description?: string;
    }>;
  };
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

export const getReferenceSeedData = async (): Promise<ReferenceSeedData> => {
  const customerOrderMdx = await loadSpecFile("21_example_form_template.mdx");
  const productionBatchMdx = await loadSpecFile("24_example_production_batch_form_template.mdx");
  const qualificationRecordMdx = await loadSpecFile("23_example_qualification_form_template.mdx");
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
        operationRef: "customers.lookup",
        name: "Customer Lookup",
        connector: "internal-reference",
        modulePath: "src/modules/next-form/load-customer.ts",
        authStrategy: "none",
        description: "Liest Kundenauftrag und Einsatzort aus den internen Customer-Stammdaten.",
        tags: ["typescript-api", "lookup", "forms", "customers"],
        inputSchema: {
          fields: [
            {
              name: "order_number",
              type: "string",
              required: true,
              description: "Auftragsnummer fuer den internen Kundenauftrag-Lookup.",
            },
          ],
        },
        outputSchema: {
          fields: [
            { name: "customer", type: "string", description: "Angezeigter Kundenname." },
            { name: "service_location", type: "string", description: "Einsatzort fuer den Serviceeinsatz." },
            { name: "customer_master_id", type: "string", description: "Technischer Stammdatenschluessel." },
            { name: "customer_master_status", type: "string", description: "Stammdatenstatus." },
            { name: "customer_order_status", type: "string", description: "Auftragsstatus." },
            { name: "customer_order_created_at", type: "string", description: "Anlagezeitpunkt des Auftrags." },
          ],
        },
      },
      {
        operationRef: "products.suggest",
        name: "Product Suggest",
        connector: "internal-reference",
        modulePath: "src/modules/next-form/suggest-material.ts",
        authStrategy: "none",
        description: "Schlaegt ein internes Produkt oder Wartungsset aus den Product-Stammdaten vor.",
        tags: ["typescript-api", "lookup", "forms", "products"],
        inputSchema: {
          fields: [
            {
              name: "work_description",
              type: "html|string",
              required: true,
              description: "Taetigkeitsbeschreibung als Grundlage fuer den Vorschlag.",
            },
          ],
        },
        outputSchema: {
          fields: [
            { name: "material", type: "string", description: "Vorgeschlagenes Produkt oder Material." },
            { name: "product_master_id", type: "string", description: "Technischer Stammdatenschluessel." },
            { name: "product_master_type", type: "string", description: "Produkttyp." },
            { name: "product_master_status", type: "string", description: "Stammdatenstatus." },
          ],
        },
      },
      {
        operationRef: "customers.list",
        name: "Customers List",
        connector: "internal-reference",
        modulePath: "src/modules/entities/read.ts",
        authStrategy: "none",
        description: "Liefert interne Customer-Stammdaten fuer API und CSV-basierte Referenzwelt.",
        tags: ["typescript-api", "read", "customers"],
      },
      {
        operationRef: "products.list",
        name: "Products List",
        connector: "internal-reference",
        modulePath: "src/modules/entities/read.ts",
        authStrategy: "none",
        description: "Liefert interne Product-Stammdaten fuer API und CSV-basierte Referenzwelt.",
        tags: ["typescript-api", "read", "products"],
      },
    ],
    workflows: [
      {
        id: "88888888-8888-8888-8888-888888888881",
        key: "customer-order.group-submit.v1",
        name: "Kundenauftrag Freigabe",
        description: "Workflow fuer Kundenauftrag, Service-Durchfuehrung und Freigabe.",
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
    ],
    templates: [
      {
        id: "99999999-9999-9999-9999-999999999991",
        key: "customer-order-test",
        name: "Kundenauftrag",
        description: "Serviceauftrag mit internem Customer- und Product-Lookup.",
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
        description: "Mehrbenutzer-Nachweis fuer Service und Produktion mit Fragen und per-User Submit.",
        version: 1,
        status: "published",
        workflowTemplateId: "88888888-8888-8888-8888-888888888883",
        mdxBody: qualificationRecordMdx,
        templateKeys: [],
        documentKeys: ["qualification_record_number"],
        tableFields: ["qualification_record_number", "qualification_title", "owner_user_id", "valid_until"],
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
    ],
    tasks: [
      {
        id: "cccccccc-cccc-cccc-cccc-ccccccccccc1",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1",
        userId: "22222222-2222-2222-2222-222222222222",
        title: "Kundenauftrag KD-2026-1007 freigeben",
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
        message: "Kundenauftrag KD-2026-1007 angelegt.",
        payloadJson: {},
        createdAt: "2026-04-03T08:30:00.000Z",
      },
      {
        id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee2",
        documentId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeee1",
        eventType: "saved",
        actorUserId: "33333333-3333-3333-3333-333333333333",
        message: "Kundenauftrag KD-2026-1007 gespeichert.",
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
