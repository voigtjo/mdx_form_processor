import { env } from "../config/env.js";
import { getAttachmentUploadStateForUser } from "../modules/attachments/upload.js";
import { listAttachmentsForDocument } from "../modules/attachments/read.js";
import { listAssignments } from "../modules/assignments/read.js";
import { listAssignmentsForDocument } from "../modules/assignments/read.js";
import { listAuditEvents } from "../modules/audit/read.js";
import { listAuditEventsForDocument } from "../modules/audit/read.js";
import { getDocumentApproveStateForUser } from "../modules/documents/approve.js";
import { getDocumentArchiveStateForUser } from "../modules/documents/archive.js";
import {
  findDocumentDetailVisibleToUser,
  listDocumentsAssignedToUser,
  listDocumentsVisibleToUser,
  listTasks,
  listTasksForDocument,
  listTasksForUser,
} from "../modules/documents/read.js";
import { getDocumentRejectStateForUser } from "../modules/documents/reject.js";
import { getDocumentSubmitStateForUser } from "../modules/documents/submit.js";
import { listGroups, listGroupsForUser } from "../modules/groups/read.js";
import { listMemberships } from "../modules/memberships/read.js";
import { buildReadOnlyFormDefinition } from "../modules/templates/form-read.js";
import { listFormTemplates, listFormTemplatesForUser, listTemplateAssignments } from "../modules/templates/read.js";
import { findUserByKey, listUsers } from "../modules/users/read.js";
import { listWorkflowTemplates } from "../modules/workflows/read.js";
import type { User } from "../types/domain.js";
import type { NavItem } from "../types/navigation.js";

type SectionKey = "workspace" | "templates" | "workflows" | "documents" | "admin";

const buildHref = (path: string, activeUserKey: string): string => `${path}?user=${encodeURIComponent(activeUserKey)}`;

export const getActiveUser = async (userKey: string | undefined, users: User[]): Promise<User> => {
  const fallbackUser = users[0];

  if (!fallbackUser) {
    throw new Error("No users available in the database for user selection.");
  }

  if (!userKey) {
    return fallbackUser;
  }

  return (await findUserByKey(userKey)) ?? fallbackUser;
};

export const getNavigation = (section: SectionKey, activeUserKey: string): NavItem[] => {
  const items = [
    { key: "workspace" as const, label: "My Workspace", path: "/workspace" },
    { key: "templates" as const, label: "Templates", path: "/templates" },
    { key: "workflows" as const, label: "Workflows", path: "/workflows" },
    { key: "documents" as const, label: "Documents", path: "/documents" },
    { key: "admin" as const, label: "Admin", path: "/admin" },
  ];

  return items.map((item) => ({
    label: item.label,
    href: buildHref(item.path, activeUserKey),
    isActive: item.key === section,
  }));
};

const workflowsForTemplates = (templates: { workflowTemplateId: string }[], workflows: { id: string }[]) => {
  const workflowIds = new Set(templates.map((template) => template.workflowTemplateId));
  return workflows.filter((workflow) => workflowIds.has(workflow.id));
};

const createShellContext = async (section: SectionKey, userKey: string | undefined) => {
  const users = await listUsers();
  const activeUser = await getActiveUser(userKey, users);

  return {
    appName: env.appName,
    activeUser,
    users,
    navigation: getNavigation(section, activeUser.key),
  };
};

export const createBaseViewModel = async (section: SectionKey, userKey: string | undefined) => {
  const shellContext = await createShellContext(section, userKey);
  const { activeUser, users } = shellContext;

  const [
    userGroups,
    userTemplates,
    userDocuments,
    visibleDocuments,
    userTasks,
    groups,
    memberships,
    templates,
    templateAssignments,
    workflows,
    tasks,
    assignments,
    auditEvents,
  ] = await Promise.all([
    listGroupsForUser(activeUser.id),
    listFormTemplatesForUser(activeUser.id),
    listDocumentsAssignedToUser(activeUser.id),
    listDocumentsVisibleToUser(activeUser.id),
    listTasksForUser(activeUser.id),
    listGroups(),
    listMemberships(),
    listFormTemplates(),
    listTemplateAssignments(),
    listWorkflowTemplates(),
    listTasks(),
    listAssignments(),
    listAuditEvents(),
  ]);

  return {
    ...shellContext,
    pageSection: section,
    workspaceSummary: {
      groups: userGroups,
      tasks: userTasks,
      templates: userTemplates,
      documents: userDocuments,
      workflows: workflowsForTemplates(userTemplates, workflows),
    },
    catalog: {
      groups,
      memberships,
      templates,
      templateAssignments,
      workflows,
      documents: visibleDocuments,
      tasks,
      assignments,
      auditEvents,
    },
  };
};

export const createDocumentDetailViewModel = async (userKey: string | undefined, documentId: string) => {
  const shellContext = await createShellContext("documents", userKey);
  const { activeUser, users } = shellContext;

  const document = await findDocumentDetailVisibleToUser(documentId, activeUser.id);

  if (!document) {
    return null;
  }

  const [assignments, tasks, attachments, auditEvents, attachmentUploadState, submitState, approveState, rejectState, archiveState] = await Promise.all([
    listAssignmentsForDocument(document.id),
    listTasksForDocument(document.id),
    listAttachmentsForDocument(document.id),
    listAuditEventsForDocument(document.id),
    getAttachmentUploadStateForUser(document.id, activeUser.id),
    getDocumentSubmitStateForUser(document.id, activeUser.id),
    getDocumentApproveStateForUser(document.id, activeUser.id),
    getDocumentRejectStateForUser(document.id, activeUser.id),
    getDocumentArchiveStateForUser(document.id, activeUser.id),
  ]);

  const formDefinition = buildReadOnlyFormDefinition({
    templateId: document.templateId,
    templateKey: document.templateKey,
    templateName: document.templateName,
    templateVersion: document.templateVersion,
    templateStatus: document.formTemplateStatus,
    ...(document.formTemplateDescription ? { templateDescription: document.formTemplateDescription } : {}),
    mdxBody: document.formTemplateMdxBody,
    documentStatus: document.status,
    documentData: document.documentDataJson,
    workflowFieldRules: document.workflowFieldRules,
  });

  return {
    ...shellContext,
    title: document.title,
    pageSection: "documents" as const,
    documentDetail: {
      document,
      formDefinition,
      editableFields: formDefinition.fields.filter((field) => field.isSavable),
      attachmentUploadState,
      submitState,
      approveState,
      rejectState,
      archiveState,
      assignments,
      tasks,
      attachments,
      auditEvents,
    },
    users,
  };
};
