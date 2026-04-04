import type {
  Assignment,
  AuditEvent,
  Attachment,
  Document,
  FormTemplate,
  Group,
  Membership,
  Operation,
  Task,
  User,
  WorkflowTemplate,
} from "../types/domain.js";

export const sampleUsers: User[] = [
  {
    id: "usr-anna",
    key: "anna_schmidt",
    displayName: "Anna Schmidt",
    email: "anna@example.test",
    status: "active",
  },
  {
    id: "usr-luca",
    key: "luca_keller",
    displayName: "Luca Keller",
    email: "luca@example.test",
    status: "active",
  },
  {
    id: "usr-samira",
    key: "samira_rahman",
    displayName: "Samira Rahman",
    email: "samira@example.test",
    status: "active",
  },
];

export const sampleGroups: Group[] = [
  {
    id: "grp-quality",
    key: "quality",
    name: "Quality Operations",
    description: "Dokumentiert Nachweise und Freigaben fuer operative Qualitaetsprozesse.",
    status: "active",
  },
  {
    id: "grp-logistics",
    key: "logistics",
    name: "Logistics",
    description: "Arbeitet an Auslieferungs- und Freigabeprozessen.",
    status: "active",
  },
];

export const sampleMemberships: Membership[] = [
  {
    id: "mem-1",
    userId: "usr-anna",
    groupId: "grp-quality",
    rights: { read: true, write: true, execute: true },
  },
  {
    id: "mem-2",
    userId: "usr-luca",
    groupId: "grp-quality",
    rights: { read: true, write: true, execute: false },
  },
  {
    id: "mem-3",
    userId: "usr-samira",
    groupId: "grp-logistics",
    rights: { read: true, write: true, execute: true },
  },
];

export const sampleWorkflows: WorkflowTemplate[] = [
  {
    id: "wf-customer-order",
    key: "customer_order_release",
    name: "Customer Order Release",
    version: 1,
    status: "published",
    description: "Einfacher Workflow fuer Dokumentation, Submit und Approval.",
    initialStatus: "new",
    statuses: ["new", "assigned", "submitted", "approved", "rejected", "archived"],
    actions: [
      { name: "assign", from: ["new"], to: "assigned", allowedRoles: ["editor"] },
      { name: "submit", from: ["assigned"], to: "submitted", allowedRoles: ["editor"] },
      { name: "approve", from: ["submitted"], to: "approved", allowedRoles: ["approver"] },
    ],
  },
  {
    id: "wf-evidence",
    key: "evidence_capture",
    name: "Evidence Capture",
    version: 1,
    status: "draft",
    description: "Arbeitsworkflow fuer laufende Dokumentation mit Attachments und Journal.",
    initialStatus: "new",
    statuses: ["new", "in_progress", "submitted", "approved"],
    actions: [
      { name: "start", from: ["new"], to: "in_progress", allowedRoles: ["editor"] },
      { name: "submit", from: ["in_progress"], to: "submitted", allowedRoles: ["editor"] },
    ],
  },
];

export const sampleTemplates: FormTemplate[] = [
  {
    id: "tpl-customer-order",
    key: "customer_order_form",
    name: "Customer Order Form",
    version: 1,
    status: "published",
    description: "MDX-basiertes Template fuer die Auftragsfreigabe.",
    workflowTemplateId: "wf-customer-order",
    groupIds: ["grp-quality"],
    templateKeys: ["product_id"],
    documentKeys: ["customer_order_number"],
    tableFields: ["customer_order_number", "customer_name", "status"],
  },
  {
    id: "tpl-evidence",
    key: "evidence_record",
    name: "Evidence Record",
    version: 1,
    status: "draft",
    description: "Template fuer Nachweise mit Journal und Attachments.",
    workflowTemplateId: "wf-evidence",
    groupIds: ["grp-logistics"],
    templateKeys: ["batch_id"],
    documentKeys: ["evidence_number"],
    tableFields: ["evidence_number", "batch_id", "status"],
  },
];

export const sampleDocuments: Document[] = [
  {
    id: "doc-1001",
    templateId: "tpl-customer-order",
    title: "Customer Order 4711",
    status: "submitted",
    updatedAt: "2026-03-23 20:15",
    assignedUserIds: ["usr-anna", "usr-luca"],
  },
  {
    id: "doc-1002",
    templateId: "tpl-customer-order",
    title: "Customer Order 4712",
    status: "assigned",
    updatedAt: "2026-03-23 18:30",
    assignedUserIds: ["usr-anna"],
  },
  {
    id: "doc-2001",
    templateId: "tpl-evidence",
    title: "Evidence B-2026-0042",
    status: "in_progress",
    updatedAt: "2026-03-22 16:45",
    assignedUserIds: ["usr-samira"],
  },
];

export const sampleTasks: Task[] = [
  {
    id: "tsk-1",
    documentId: "doc-1001",
    userId: "usr-luca",
    title: "Approve Customer Order 4711",
    action: "approve",
    status: "open",
    role: "approver",
    updatedAt: "2026-03-23 20:15",
  },
  {
    id: "tsk-2",
    documentId: "doc-1002",
    userId: "usr-anna",
    title: "Submit Customer Order 4712",
    action: "submit",
    status: "open",
    role: "editor",
    updatedAt: "2026-03-23 18:30",
  },
  {
    id: "tsk-3",
    documentId: "doc-2001",
    userId: "usr-samira",
    title: "Continue Evidence B-2026-0042",
    action: "save",
    status: "open",
    role: "editor",
    updatedAt: "2026-03-22 16:45",
  },
];

export const sampleAssignments: Assignment[] = [
  { id: "asn-1", documentId: "doc-1001", userId: "usr-luca", role: "approver", active: true },
  { id: "asn-2", documentId: "doc-1002", userId: "usr-anna", role: "editor", active: true },
  { id: "asn-3", documentId: "doc-2001", userId: "usr-samira", role: "editor", active: true },
];

export const sampleAuditEvents: AuditEvent[] = [
  {
    id: "aud-1",
    documentId: "doc-1001",
    eventType: "submitted",
    actorUserId: "usr-anna",
    message: "Document wurde zur Freigabe eingereicht.",
    createdAt: "2026-03-23 20:15",
  },
];

export const sampleAttachments: Attachment[] = [
  {
    id: "att-1",
    documentId: "doc-2001",
    filename: "inspection-photo-1.jpg",
    mimeType: "image/jpeg",
    size: 348221,
    uploadedBy: "usr-samira",
    createdAt: "2026-03-22 16:00",
  },
];

export const sampleOperations: Operation[] = [
  {
    operationRef: "customerOrders.create",
    modulePath: "src/modules/operations/customer-orders.ts",
    authStrategy: "none",
    connector: "reference",
    name: "Create Customer Order",
    description: "Platzhalter fuer spaetere TypeScript-Operationen im App-Kontext.",
    tags: ["reference", "action"],
  },
];
