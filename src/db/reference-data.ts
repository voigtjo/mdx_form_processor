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
    created: {
      editable: ["product_id"],
      readonly: ["batch_id"],
    },
    assigned: {
      editable: ["batch_id"],
      readonly: ["product_id"],
    },
    started: {
      editable: ["fulfillment_flags", "inspection_steps"],
      readonly: ["product_id", "batch_id"],
    },
    progressed: {
      editable: ["fulfillment_flags", "inspection_steps"],
      readonly: ["product_id", "batch_id"],
    },
    submitted: {
      editable: [],
      readonly: ["product_id", "batch_id", "fulfillment_flags", "inspection_steps"],
    },
    rejected: {
      editable: [],
      readonly: ["product_id", "batch_id", "fulfillment_flags", "inspection_steps"],
    },
    archived: {
      editable: [],
      readonly: ["product_id", "batch_id", "fulfillment_flags", "inspection_steps"],
    },
  },
  approval: {
    editors: "multiple",
    approvers: "single",
    submitMode: "single",
    approvalMode: "single",
  },
  hooks: [],
};

const evidenceWorkflowJson = {
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
    assigned: {
      editable: ["evidence_number", "evidence_notes", "evidence_steps"],
      readonly: [],
    },
    submitted: {
      editable: [],
      readonly: ["evidence_number", "evidence_notes", "evidence_steps"],
    },
    rejected: {
      editable: [],
      readonly: ["evidence_number", "evidence_notes", "evidence_steps"],
    },
    archived: {
      editable: [],
      readonly: ["evidence_number", "evidence_notes", "evidence_steps"],
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

const productionBatchMdx = `---
key: production-batch
name: Production Batch
version: 1
status: published
workflowTemplateKey: production.standard.v1
description: Reference MDX form template for production batch documentation.
---

<Fields>
  <Field name="product_id" type="lookup" label="Product" operationRef="products.listValid" valueKey="id" labelKey="name" templateKey tableField required />
  <Field name="batch_id" type="text" label="Batch ID" documentKey tableField />
  <Field name="fulfillment_flags" type="checkboxGroup" label="Fulfillment Flags" options={["prepared", "checked", "released"]} />
  <Field name="inspection_steps" type="journal" label="Inspection Steps" />
  <Field name="attachments_main" type="attachmentArea" label="Attachments" />
</Fields>

<Action name="create_batch" label="Create Batch" operationRef="batches.create" visibleIn={["started", "progressed"]} enabledIn={["started", "progressed"]} />

# Production Batch

<Section title="Batch">
  <Row>
    <Column width={6}><FieldRef name="product_id" /></Column>
    <Column width={6}><FieldRef name="batch_id" /></Column>
  </Row>
</Section>

<Section title="Execution">
  <FieldRef name="fulfillment_flags" />
  <JournalRef name="inspection_steps" />
</Section>

<Section title="Attachments">
  <AttachmentAreaRef name="attachments_main" />
</Section>
`;

const evidenceBasicMdx = `---
key: evidence-basic
name: Evidence Basic
version: 1
status: published
workflowTemplateKey: evidence.group-submit.v1
description: Reference MDX form template for a compact evidence process.
---

<Fields>
  <Field name="evidence_number" type="text" label="Evidence Number" documentKey tableField required />
  <Field name="evidence_notes" type="textarea" label="Evidence Notes" tableField />
  <Field name="evidence_steps" type="journal" label="Evidence Steps" />
  <Field name="attachments_main" type="attachmentArea" label="Attachments" />
</Fields>

# Evidence Basic

<Section title="Evidence">
  <Row>
    <Column width={6}><FieldRef name="evidence_number" /></Column>
    <Column width={6}><FieldRef name="evidence_notes" /></Column>
  </Row>
</Section>

<Section title="Journal">
  <JournalRef name="evidence_steps" />
</Section>

<Section title="Attachments">
  <AttachmentAreaRef name="attachments_main" />
</Section>
`;

export const getReferenceSeedData = async (): Promise<ReferenceSeedData> => {
  const customerOrderMdx = await loadSpecFile("21_example_form_template.mdx");
  const customerOrderWorkflowJson = JSON.parse(await loadSpecFile("22_example_workflow_template.json")) as Record<string, unknown>;

  return {
    users: [
      {
        id: "11111111-1111-1111-1111-111111111111",
        key: "alice",
        displayName: "Alice",
        email: "alice@example.local",
        status: "active",
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        key: "bob",
        displayName: "Bob",
        email: "bob@example.local",
        status: "active",
      },
    ],
    groups: [
      {
        id: "33333333-3333-3333-3333-333333333333",
        key: "ops",
        name: "Ops",
        description: "Operations team",
        status: "active",
      },
      {
        id: "44444444-4444-4444-4444-444444444444",
        key: "quality",
        name: "Quality",
        description: "Quality team",
        status: "active",
      },
    ],
    memberships: [
      {
        id: "55555555-5555-5555-5555-555555555551",
        userId: "11111111-1111-1111-1111-111111111111",
        groupId: "33333333-3333-3333-3333-333333333333",
        rights: "rwx",
      },
      {
        id: "55555555-5555-5555-5555-555555555552",
        userId: "22222222-2222-2222-2222-222222222222",
        groupId: "33333333-3333-3333-3333-333333333333",
        rights: "rwx",
      },
      {
        id: "55555555-5555-5555-5555-555555555553",
        userId: "22222222-2222-2222-2222-222222222222",
        groupId: "44444444-4444-4444-4444-444444444444",
        rights: "r",
      },
    ],
    operations: [
      {
        operationRef: "products.listValid",
        name: "Products List Valid",
        connector: "reference",
        modulePath: "src/modules/operations/reference/products.ts",
        authStrategy: "none",
        description: "Reference lookup for valid products.",
        tags: ["reference", "lookup"],
      },
      {
        operationRef: "customers.listValid",
        name: "Customers List Valid",
        connector: "reference",
        modulePath: "src/modules/operations/reference/customers.ts",
        authStrategy: "none",
        description: "Reference lookup for valid customers.",
        tags: ["reference", "lookup"],
      },
      {
        operationRef: "batches.create",
        name: "Create Batch",
        connector: "reference",
        modulePath: "src/modules/operations/reference/batches.ts",
        authStrategy: "none",
        description: "Reference batch creation action.",
        tags: ["reference", "action"],
      },
      {
        operationRef: "customerOrders.create",
        name: "Create Customer Order",
        connector: "reference",
        modulePath: "src/modules/operations/reference/customer-orders.ts",
        authStrategy: "none",
        description: "Reference customer order creation action.",
        tags: ["reference", "action"],
      },
      {
        operationRef: "customerOrders.setStatus",
        name: "Set Customer Order Status",
        connector: "reference",
        modulePath: "src/modules/operations/reference/customer-orders.ts",
        authStrategy: "none",
        description: "Reference customer order status sync.",
        tags: ["reference", "hook"],
      },
      {
        operationRef: "customerOrders.setStatusFromContext",
        name: "Set Customer Order Status From Context",
        connector: "reference",
        modulePath: "src/modules/operations/reference/customer-orders.ts",
        authStrategy: "none",
        description: "Reference hook for syncing customer order status from integration context.",
        tags: ["reference", "hook"],
      },
    ],
    workflows: [
      {
        id: "66666666-6666-6666-6666-666666666661",
        key: "customer-order.group-submit.v1",
        name: "Customer Order Group Submit",
        description: "Reference workflow for customer order submit and approval.",
        version: 1,
        status: "published",
        workflowJson: customerOrderWorkflowJson,
      },
      {
        id: "66666666-6666-6666-6666-666666666662",
        key: "production.standard.v1",
        name: "Production Standard",
        description: "Reference workflow for production batch work including journal and attachments.",
        version: 1,
        status: "published",
        workflowJson: productionWorkflowJson,
      },
      {
        id: "66666666-6666-6666-6666-666666666663",
        key: "evidence.group-submit.v1",
        name: "Evidence Group Submit",
        description: "Reference workflow for compact evidence review and approval.",
        version: 1,
        status: "published",
        workflowJson: evidenceWorkflowJson,
      },
    ],
    templates: [
      {
        id: "77777777-7777-7777-7777-777777777771",
        key: "customer-order-test",
        name: "Customer Order Test",
        description: "Reference template for customer order processing.",
        version: 1,
        status: "published",
        workflowTemplateId: "66666666-6666-6666-6666-666666666661",
        mdxBody: customerOrderMdx,
        templateKeys: ["customer_id"],
        documentKeys: ["customer_order_number"],
        tableFields: ["customer_id", "customer_order_number", "fulfillment_flags"],
      },
      {
        id: "77777777-7777-7777-7777-777777777772",
        key: "production-batch",
        name: "Production Batch",
        description: "Reference template for production batch documentation.",
        version: 1,
        status: "published",
        workflowTemplateId: "66666666-6666-6666-6666-666666666662",
        mdxBody: productionBatchMdx,
        templateKeys: ["product_id"],
        documentKeys: ["batch_id"],
        tableFields: ["product_id", "batch_id", "fulfillment_flags"],
      },
      {
        id: "77777777-7777-7777-7777-777777777773",
        key: "evidence-basic",
        name: "Evidence Basic",
        description: "Reference template for compact evidence documentation.",
        version: 1,
        status: "published",
        workflowTemplateId: "66666666-6666-6666-6666-666666666663",
        mdxBody: evidenceBasicMdx,
        templateKeys: [],
        documentKeys: ["evidence_number"],
        tableFields: ["evidence_number", "evidence_notes"],
      },
    ],
    templateAssignments: [
      {
        id: "88888888-8888-8888-8888-888888888881",
        templateId: "77777777-7777-7777-7777-777777777771",
        groupId: "33333333-3333-3333-3333-333333333333",
        status: "active",
        assignedAt: "2026-03-24T08:00:00.000Z",
      },
      {
        id: "88888888-8888-8888-8888-888888888882",
        templateId: "77777777-7777-7777-7777-777777777772",
        groupId: "33333333-3333-3333-3333-333333333333",
        status: "active",
        assignedAt: "2026-03-24T08:00:00.000Z",
      },
      {
        id: "88888888-8888-8888-8888-888888888883",
        templateId: "77777777-7777-7777-7777-777777777773",
        groupId: "33333333-3333-3333-3333-333333333333",
        status: "active",
        assignedAt: "2026-03-24T08:00:00.000Z",
      },
    ],
    documents: [
      {
        id: "99999999-9999-9999-9999-999999999991",
        templateId: "77777777-7777-7777-7777-777777777771",
        templateVersion: 1,
        workflowTemplateId: "66666666-6666-6666-6666-666666666661",
        workflowTemplateVersion: 1,
        status: "submitted",
        dataJson: {
          customer_id: "customer-acme",
          customer_name: "Acme Retail",
          customer_order_number: "4711",
          fulfillment_flags: ["packed", "reviewed"],
          review_notes: "Awaiting final approval.",
        },
        externalJson: {
          customer_order_number: "4711",
        },
        snapshotJson: {
          customer_order_created_ok: true,
        },
        integrationContextJson: {
          customer_order_id: "CO-4711",
        },
        createdBy: "11111111-1111-1111-1111-111111111111",
        createdAt: "2026-03-24T08:10:00.000Z",
        updatedAt: "2026-03-24T09:10:00.000Z",
      },
      {
        id: "99999999-9999-9999-9999-999999999992",
        templateId: "77777777-7777-7777-7777-777777777772",
        templateVersion: 1,
        workflowTemplateId: "66666666-6666-6666-6666-666666666662",
        workflowTemplateVersion: 1,
        status: "progressed",
        dataJson: {
          product_id: "product-42",
          product_name: "Widget 42",
          batch_id: "B-2026-0042",
          fulfillment_flags: ["prepared", "checked"],
          inspection_steps: [
            { at: "2026-03-24T08:15:00.000Z", text: "Visual inspection completed." },
            { at: "2026-03-24T08:45:00.000Z", text: "Packaging verified." },
          ],
        },
        externalJson: {},
        snapshotJson: {
          attachments_visible: true,
        },
        integrationContextJson: {},
        createdBy: "11111111-1111-1111-1111-111111111111",
        createdAt: "2026-03-24T08:15:00.000Z",
        updatedAt: "2026-03-24T09:05:00.000Z",
      },
      {
        id: "99999999-9999-9999-9999-999999999993",
        templateId: "77777777-7777-7777-7777-777777777773",
        templateVersion: 1,
        workflowTemplateId: "66666666-6666-6666-6666-666666666663",
        workflowTemplateVersion: 1,
        status: "assigned",
        dataJson: {
          evidence_number: "2026-101",
          evidence_notes: "Initial evidence package prepared.",
          evidence_steps: [
            { at: "2026-03-24T08:50:00.000Z", text: "Evidence request created." },
          ],
        },
        externalJson: {},
        snapshotJson: {},
        integrationContextJson: {},
        createdBy: "22222222-2222-2222-2222-222222222222",
        createdAt: "2026-03-24T08:50:00.000Z",
        updatedAt: "2026-03-24T09:00:00.000Z",
      },
      {
        id: "99999999-9999-9999-9999-999999999994",
        templateId: "77777777-7777-7777-7777-777777777771",
        templateVersion: 1,
        workflowTemplateId: "66666666-6666-6666-6666-666666666661",
        workflowTemplateVersion: 1,
        status: "approved",
        dataJson: {
          customer_id: "customer-northwind",
          customer_name: "Northwind",
          customer_order_number: "4709",
          fulfillment_flags: ["packed", "reviewed", "released"],
          review_notes: "Approved and synced.",
        },
        externalJson: {
          customer_order_number: "4709",
        },
        snapshotJson: {
          customer_order_sync_ok: true,
        },
        integrationContextJson: {
          customer_order_id: "CO-4709",
          synced_status: "approved",
        },
        createdBy: "11111111-1111-1111-1111-111111111111",
        createdAt: "2026-03-24T07:30:00.000Z",
        updatedAt: "2026-03-24T08:40:00.000Z",
      },
    ],
    documentAssignments: [
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1",
        documentId: "99999999-9999-9999-9999-999999999991",
        userId: "11111111-1111-1111-1111-111111111111",
        role: "editor",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-03-24T08:20:00.000Z",
        active: true,
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2",
        documentId: "99999999-9999-9999-9999-999999999991",
        userId: "22222222-2222-2222-2222-222222222222",
        role: "approver",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-03-24T08:20:00.000Z",
        active: true,
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3",
        documentId: "99999999-9999-9999-9999-999999999992",
        userId: "11111111-1111-1111-1111-111111111111",
        role: "editor",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-03-24T08:15:00.000Z",
        active: true,
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa4",
        documentId: "99999999-9999-9999-9999-999999999993",
        userId: "22222222-2222-2222-2222-222222222222",
        role: "editor",
        assignedBy: "22222222-2222-2222-2222-222222222222",
        assignedAt: "2026-03-24T08:55:00.000Z",
        active: true,
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa5",
        documentId: "99999999-9999-9999-9999-999999999994",
        userId: "11111111-1111-1111-1111-111111111111",
        role: "editor",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-03-24T07:35:00.000Z",
        active: true,
      },
      {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa6",
        documentId: "99999999-9999-9999-9999-999999999994",
        userId: "22222222-2222-2222-2222-222222222222",
        role: "approver",
        assignedBy: "11111111-1111-1111-1111-111111111111",
        assignedAt: "2026-03-24T07:35:00.000Z",
        active: true,
      },
    ],
    tasks: [
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1",
        documentId: "99999999-9999-9999-9999-999999999991",
        userId: "22222222-2222-2222-2222-222222222222",
        title: "Approve Customer Order 4711",
        action: "approve",
        status: "open",
        role: "approver",
        createdAt: "2026-03-24T09:10:00.000Z",
        updatedAt: "2026-03-24T09:10:00.000Z",
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2",
        documentId: "99999999-9999-9999-9999-999999999992",
        userId: "11111111-1111-1111-1111-111111111111",
        title: "Submit Batch B-2026-0042",
        action: "submit",
        status: "open",
        role: "editor",
        createdAt: "2026-03-24T09:05:00.000Z",
        updatedAt: "2026-03-24T09:05:00.000Z",
      },
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3",
        documentId: "99999999-9999-9999-9999-999999999993",
        userId: "22222222-2222-2222-2222-222222222222",
        title: "Continue Evidence 2026-101",
        action: "save",
        status: "open",
        role: "editor",
        createdAt: "2026-03-24T09:00:00.000Z",
        updatedAt: "2026-03-24T09:00:00.000Z",
      },
    ],
    attachments: [
      {
        id: "cccccccc-cccc-cccc-cccc-ccccccccccc1",
        documentId: "99999999-9999-9999-9999-999999999991",
        filename: "contract.pdf",
        mimeType: "application/pdf",
        size: 182345,
        storageKey: "reference/customer-order-4711/contract.pdf",
        uploadedBy: "11111111-1111-1111-1111-111111111111",
        createdAt: "2026-03-24T08:35:00.000Z",
      },
      {
        id: "cccccccc-cccc-cccc-cccc-ccccccccccc2",
        documentId: "99999999-9999-9999-9999-999999999992",
        filename: "batch-photo.jpg",
        mimeType: "image/jpeg",
        size: 248120,
        storageKey: "reference/batch-b-2026-0042/batch-photo.jpg",
        uploadedBy: "11111111-1111-1111-1111-111111111111",
        createdAt: "2026-03-24T08:55:00.000Z",
      },
    ],
    auditEvents: [
      {
        id: "dddddddd-dddd-dddd-dddd-ddddddddddd1",
        documentId: "99999999-9999-9999-9999-999999999991",
        eventType: "created",
        actorUserId: "11111111-1111-1111-1111-111111111111",
        message: "Customer Order 4711 created.",
        payloadJson: {},
        createdAt: "2026-03-24T08:10:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-ddddddddddd2",
        documentId: "99999999-9999-9999-9999-999999999991",
        eventType: "assigned",
        actorUserId: "11111111-1111-1111-1111-111111111111",
        message: "Alice and Bob assigned to Customer Order 4711.",
        payloadJson: { roles: ["editor", "approver"] },
        createdAt: "2026-03-24T08:20:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-ddddddddddd3",
        documentId: "99999999-9999-9999-9999-999999999991",
        eventType: "saved",
        actorUserId: "11111111-1111-1111-1111-111111111111",
        message: "Customer Order 4711 saved.",
        payloadJson: {},
        createdAt: "2026-03-24T08:45:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-ddddddddddd4",
        documentId: "99999999-9999-9999-9999-999999999991",
        eventType: "submitted",
        actorUserId: "11111111-1111-1111-1111-111111111111",
        message: "Customer Order 4711 submitted for approval.",
        payloadJson: {},
        createdAt: "2026-03-24T09:10:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-ddddddddddd5",
        documentId: "99999999-9999-9999-9999-999999999992",
        eventType: "created",
        actorUserId: "11111111-1111-1111-1111-111111111111",
        message: "Batch B-2026-0042 created.",
        payloadJson: {},
        createdAt: "2026-03-24T08:15:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-ddddddddddd6",
        documentId: "99999999-9999-9999-9999-999999999992",
        eventType: "started",
        actorUserId: "11111111-1111-1111-1111-111111111111",
        message: "Batch B-2026-0042 started.",
        payloadJson: {},
        createdAt: "2026-03-24T08:30:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-ddddddddddd7",
        documentId: "99999999-9999-9999-9999-999999999992",
        eventType: "saved",
        actorUserId: "11111111-1111-1111-1111-111111111111",
        message: "Batch B-2026-0042 saved.",
        payloadJson: {},
        createdAt: "2026-03-24T09:05:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-ddddddddddd8",
        documentId: "99999999-9999-9999-9999-999999999992",
        eventType: "attachment_uploaded",
        actorUserId: "11111111-1111-1111-1111-111111111111",
        message: "Batch photo uploaded.",
        payloadJson: { filename: "batch-photo.jpg" },
        createdAt: "2026-03-24T08:55:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-ddddddddddd9",
        documentId: "99999999-9999-9999-9999-999999999993",
        eventType: "created",
        actorUserId: "22222222-2222-2222-2222-222222222222",
        message: "Evidence 2026-101 created.",
        payloadJson: {},
        createdAt: "2026-03-24T08:50:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-dddddddddd10",
        documentId: "99999999-9999-9999-9999-999999999993",
        eventType: "assigned",
        actorUserId: "22222222-2222-2222-2222-222222222222",
        message: "Evidence 2026-101 assigned.",
        payloadJson: {},
        createdAt: "2026-03-24T08:55:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-dddddddddd11",
        documentId: "99999999-9999-9999-9999-999999999994",
        eventType: "approved",
        actorUserId: "22222222-2222-2222-2222-222222222222",
        message: "Customer Order 4709 approved.",
        payloadJson: {},
        createdAt: "2026-03-24T08:35:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-dddddddddd12",
        documentId: "99999999-9999-9999-9999-999999999994",
        eventType: "workflow_hook_executed",
        actorUserId: "22222222-2222-2222-2222-222222222222",
        message: "Customer order status synced from integration context.",
        payloadJson: { operationRef: "customerOrders.setStatusFromContext" },
        createdAt: "2026-03-24T08:40:00.000Z",
      },
      {
        id: "dddddddd-dddd-dddd-dddd-dddddddddd13",
        documentId: "99999999-9999-9999-9999-999999999991",
        eventType: "action_executed",
        actorUserId: "11111111-1111-1111-1111-111111111111",
        message: "Create Customer Order action executed.",
        payloadJson: { operationRef: "customerOrders.create" },
        createdAt: "2026-03-24T08:40:00.000Z",
      },
    ],
  };
};
