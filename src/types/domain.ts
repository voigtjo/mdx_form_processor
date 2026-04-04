export type EntityStatus = "active" | "inactive" | "draft" | "published" | "archived";

export type MembershipRights = {
  read: boolean;
  write: boolean;
  execute: boolean;
};

export type User = {
  id: string;
  key: string;
  displayName: string;
  email?: string;
  description?: string;
  status: EntityStatus;
};

export type Group = {
  id: string;
  key: string;
  name: string;
  description?: string;
  status: EntityStatus;
};

export type Membership = {
  id: string;
  userId: string;
  groupId: string;
  rights: MembershipRights;
};

export type TemplateAssignment = {
  id: string;
  templateId: string;
  groupId: string;
  status: string;
  assignedAt: string;
};

export type Task = {
  id: string;
  documentId: string;
  userId: string;
  title: string;
  action: string;
  status: "open" | "closed";
  role: "editor" | "approver";
  updatedAt: string;
};

export type WorkflowActionSummary = {
  name: string;
  from: string[];
  to: string;
  allowedRoles: Array<"editor" | "approver">;
};

export type WorkflowTemplate = {
  id: string;
  key: string;
  name: string;
  version: number;
  status: EntityStatus;
  description?: string;
  initialStatus: string;
  statuses: string[];
  actions: WorkflowActionSummary[];
};

export type WorkflowHookSummary = {
  trigger: string;
  operationRef?: string;
  description?: string;
};

export type WorkflowTemplateDetail = WorkflowTemplate & {
  workflowJson: Record<string, unknown>;
  hooks: WorkflowHookSummary[];
  publishedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkflowFieldRule = {
  editable?: string[];
  readonly?: string[];
};

export type WorkflowFieldRules = Record<string, WorkflowFieldRule>;

export type FormTemplate = {
  id: string;
  key: string;
  name: string;
  version: number;
  status: EntityStatus;
  description?: string;
  workflowTemplateId: string;
  groupIds: string[];
  templateKeys: string[];
  documentKeys: string[];
  tableFields: string[];
};

export type FormTemplateDetail = FormTemplate & {
  mdxBody: string;
  publishedAt?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReadOnlyFormField = {
  name: string;
  type: string;
  label: string;
  operationRef?: string;
  helpText?: string;
  flags: string[];
  options?: string[];
  editableIn?: string[];
  readonlyIn?: string[];
  currentValue?: string | string[];
  isEditable: boolean;
  isSavable: boolean;
};

export type ReadOnlyFormAction = {
  name: string;
  label?: string;
  operationRef?: string;
};

export type ReadOnlyJournalColumn = {
  key: string;
  label: string;
  type: string;
};

export type ReadOnlyJournalEntry = {
  values: Record<string, string>;
};

export type ReadOnlyJournalDefinition = {
  name: string;
  label: string;
  helpText?: string;
  columns: ReadOnlyJournalColumn[];
  entries: ReadOnlyJournalEntry[];
  isEditable: boolean;
};

export type ReadOnlyFormDefinition = {
  templateId: string;
  templateKey: string;
  templateName: string;
  templateVersion: number;
  templateStatus: EntityStatus;
  templateDescription?: string;
  mdxBody: string;
  sourceMeta: Record<string, string>;
  sections: string[];
  fields: ReadOnlyFormField[];
  journals: ReadOnlyJournalDefinition[];
  actions: ReadOnlyFormAction[];
};

export type Document = {
  id: string;
  templateId: string;
  title: string;
  status: string;
  updatedAt: string;
  assignedUserIds: string[];
};

export type DocumentDetail = {
  id: string;
  templateId: string;
  templateKey: string;
  templateName: string;
  templateVersion: number;
  workflowTemplateId: string;
  workflowTemplateKey: string;
  workflowTemplateName: string;
  workflowTemplateVersion: number;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  formTemplateDescription?: string;
  formTemplateStatus: EntityStatus;
  formTemplateMdxBody: string;
  documentDataJson: Record<string, unknown>;
  workflowFieldRules: WorkflowFieldRules;
};

export type Assignment = {
  id: string;
  documentId: string;
  userId: string;
  role: "editor" | "approver";
  active: boolean;
};

export type AuditEvent = {
  id: string;
  documentId: string;
  eventType: string;
  actorUserId?: string;
  message: string;
  createdAt: string;
};

export type Attachment = {
  id: string;
  documentId: string;
  filename: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  createdAt: string;
};

export type AttachmentAsset = {
  id: string;
  documentId: string;
  filename: string;
  mimeType: string;
  storageKey: string;
};

export type Operation = {
  operationRef: string;
  modulePath: string;
  authStrategy: string;
  connector?: string;
  name: string;
  description?: string;
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

export type ReferenceEntity = {
  id: string;
  entityType: "customer" | "product";
  entityKey: string;
  displayName: string;
  status: "active" | "inactive";
  source: string;
  dataJson: Record<string, unknown>;
  updatedAt: string;
};

export type WorkspaceContext = {
  activeUser: User;
  users: User[];
  groups: Group[];
  memberships: Membership[];
  tasks: Task[];
  templates: FormTemplate[];
  documents: Document[];
};
