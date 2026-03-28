import { env } from "../config/env.js";
import { getAttachmentUploadStateForUser } from "../modules/attachments/upload.js";
import { listAttachmentsForDocument } from "../modules/attachments/read.js";
import { listAssignments } from "../modules/assignments/read.js";
import { listAssignmentsForDocument } from "../modules/assignments/read.js";
import { listAuditEvents } from "../modules/audit/read.js";
import { listAuditEventsForDocument } from "../modules/audit/read.js";
import { getDocumentEditStateForUser } from "../modules/documents/access.js";
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
import { findGroupById, listGroups, listGroupsForUser } from "../modules/groups/read.js";
import { listMemberships, listMembershipsForGroup, listMembershipsForUser } from "../modules/memberships/read.js";
import { parseNextFormSource, readNextFormSourceText, referenceCraftsmanOrderFormPath } from "../modules/next-form/read.js";
import { buildReadOnlyFormDefinition } from "../modules/templates/form-read.js";
import {
  findFormTemplateById,
  findVisiblePublishedFormTemplateById,
  listFormTemplateVersions,
  listFormTemplates,
  listFormTemplatesForUser,
  listTemplateAssignments,
  listTemplateAssignmentsForGroup,
  listTemplateAssignmentsForTemplate,
} from "../modules/templates/read.js";
import { findUserById, findUserByKey, listUsers } from "../modules/users/read.js";
import {
  findWorkflowTemplateById,
  listWorkflowTemplateVersions,
  listWorkflowTemplates,
} from "../modules/workflows/read.js";
import type { User } from "../types/domain.js";
import type { NavItem } from "../types/navigation.js";

type SectionKey = "workspace" | "templates" | "workflows" | "documents" | "admin" | "next-form";

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

export const createTemplateDetailViewModel = async (userKey: string | undefined, templateId: string) => {
  const shellContext = await createShellContext("templates", userKey);
  const { activeUser } = shellContext;

  const unrestrictedTemplate = await findFormTemplateById(templateId);
  const template =
    unrestrictedTemplate?.status === "published"
      ? await findVisiblePublishedFormTemplateById(templateId, activeUser.id)
      : unrestrictedTemplate;

  if (!template) {
    return null;
  }

  const [groups, templateAssignments, workflows, documents, versions] = await Promise.all([
    listGroups(),
    listTemplateAssignmentsForTemplate(template.id),
    listWorkflowTemplates(),
    listDocumentsVisibleToUser(activeUser.id),
    listFormTemplateVersions(template.key),
  ]);

  const workflow = workflows.find((item) => item.id === template.workflowTemplateId) ?? null;
  const relatedAssignments = templateAssignments;
  const relatedGroups = groups.filter((group) => relatedAssignments.some((assignment) => assignment.groupId === group.id));
  const assignmentsWithGroups = relatedAssignments.map((assignment) => ({
    assignment,
    group: groups.find((group) => group.id === assignment.groupId) ?? null,
  }));
  const relatedDocuments = documents.filter((document) => document.templateId === template.id);
  const formDefinition = buildReadOnlyFormDefinition({
    templateId: template.id,
    templateKey: template.key,
    templateName: template.name,
    templateVersion: template.version,
    templateStatus: template.status,
    ...(template.description ? { templateDescription: template.description } : {}),
    mdxBody: template.mdxBody,
    documentStatus: "template-review",
    documentData: {},
  });

  return {
    ...shellContext,
    title: template.name,
    pageSection: "templates" as const,
    templateDetail: {
      template,
      workflow,
      groups: relatedGroups,
      assignments: relatedAssignments,
      assignmentsWithGroups,
      versions,
      relatedDocuments,
      formDefinition,
      integrations: {
        actions: formDefinition.actions.filter((action) => action.operationRef),
        fields: formDefinition.fields.filter((field) => field.operationRef),
      },
    },
  };
};

export const createTemplateNewViewModel = async (userKey: string | undefined) => {
  const shellContext = await createShellContext("templates", userKey);
  const workflows = await listWorkflowTemplates();

  return {
    ...shellContext,
    title: "New Template",
    pageSection: "templates" as const,
    availableWorkflows: workflows,
  };
};

export const createWorkflowDetailViewModel = async (userKey: string | undefined, workflowId: string) => {
  const shellContext = await createShellContext("workflows", userKey);
  const { activeUser } = shellContext;

  const workflow = await findWorkflowTemplateById(workflowId);

  if (!workflow) {
    return null;
  }

  const [templates, versions, documents] = await Promise.all([
    listFormTemplates(),
    listWorkflowTemplateVersions(workflow.key),
    listDocumentsVisibleToUser(activeUser.id),
  ]);

  const relatedTemplates = templates.filter((template) => template.workflowTemplateId === workflow.id);
  const relatedDocuments = documents.filter((document) => relatedTemplates.some((template) => template.id === document.templateId));

  return {
    ...shellContext,
    title: workflow.name,
    pageSection: "workflows" as const,
    workflowDetail: {
      workflow,
      versions,
      relatedTemplates,
      relatedDocuments,
    },
  };
};

export const createWorkflowNewViewModel = async (userKey: string | undefined) => {
  const shellContext = await createShellContext("workflows", userKey);

  return {
    ...shellContext,
    title: "New Workflow",
    pageSection: "workflows" as const,
  };
};

export const createAdminUserNewViewModel = async (userKey: string | undefined) => {
  const shellContext = await createShellContext("admin", userKey);

  return {
    ...shellContext,
    title: "New User",
    pageSection: "admin" as const,
  };
};

export const createAdminGroupNewViewModel = async (userKey: string | undefined) => {
  const shellContext = await createShellContext("admin", userKey);

  return {
    ...shellContext,
    title: "New Group",
    pageSection: "admin" as const,
  };
};

export const createAdminUserDetailViewModel = async (userKey: string | undefined, targetUserId: string) => {
  const shellContext = await createShellContext("admin", userKey);
  const targetUser = await findUserById(targetUserId);

  if (!targetUser) {
    return null;
  }

  const [groups, memberships] = await Promise.all([
    listGroups(),
    listMembershipsForUser(targetUser.id),
  ]);
  const membershipGroupIds = new Set(memberships.map((membership) => membership.groupId));
  const availableGroups = groups.filter((group) => !membershipGroupIds.has(group.id));
  const membershipsWithGroups = memberships.map((membership) => ({
    membership,
    group: groups.find((group) => group.id === membership.groupId) ?? null,
  }));

  return {
    ...shellContext,
    title: targetUser.displayName,
    pageSection: "admin" as const,
    adminUserDetail: {
      user: targetUser,
      memberships: membershipsWithGroups,
      availableGroups,
    },
  };
};

export const createAdminUserEditViewModel = async (userKey: string | undefined, targetUserId: string) => {
  const shellContext = await createShellContext("admin", userKey);
  const targetUser = await findUserById(targetUserId);

  if (!targetUser) {
    return null;
  }

  return {
    ...shellContext,
    title: `Edit ${targetUser.displayName}`,
    pageSection: "admin" as const,
    adminUserEdit: {
      user: targetUser,
    },
  };
};

export const createAdminGroupDetailViewModel = async (userKey: string | undefined, groupId: string) => {
  const shellContext = await createShellContext("admin", userKey);
  const group = await findGroupById(groupId);

  if (!group) {
    return null;
  }

  const [users, memberships, templates, templateAssignments] = await Promise.all([
    listUsers(),
    listMembershipsForGroup(group.id),
    listFormTemplates(),
    listTemplateAssignmentsForGroup(group.id),
  ]);
  const membershipsWithUsers = memberships.map((membership) => ({
    membership,
    user: users.find((user) => user.id === membership.userId) ?? null,
  }));
  const assignedTemplateIds = new Set(templateAssignments.map((assignment) => assignment.templateId));
  const availableTemplates = templates.filter((template) => !assignedTemplateIds.has(template.id));
  const templateAssignmentsWithTemplates = templateAssignments.map((assignment) => ({
    assignment,
    template: templates.find((template) => template.id === assignment.templateId) ?? null,
  }));

  return {
    ...shellContext,
    title: group.name,
    pageSection: "admin" as const,
    adminGroupDetail: {
      group,
      memberships: membershipsWithUsers,
      templateAssignments: templateAssignmentsWithTemplates,
      availableTemplates,
    },
  };
};

export const createAdminGroupEditViewModel = async (userKey: string | undefined, groupId: string) => {
  const shellContext = await createShellContext("admin", userKey);
  const group = await findGroupById(groupId);

  if (!group) {
    return null;
  }

  return {
    ...shellContext,
    title: `Edit ${group.name}`,
    pageSection: "admin" as const,
    adminGroupEdit: {
      group,
    },
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

  const catalogTemplates = section === "admin" ? templates : userTemplates;
  const catalogTemplateIds = new Set(catalogTemplates.map((template) => template.id));
  const catalogWorkflows = section === "admin" ? workflows : workflowsForTemplates(catalogTemplates, workflows);
  const catalogTemplateAssignments =
    section === "admin"
      ? templateAssignments
      : templateAssignments.filter((assignment) => catalogTemplateIds.has(assignment.templateId));
  const workspaceDocuments = userDocuments.filter((document) => document.status !== "archived");

  return {
    ...shellContext,
    pageSection: section,
    workspaceSummary: {
      groups: userGroups,
      tasks: userTasks,
      templates: userTemplates,
      documents: workspaceDocuments,
      workflows: workflowsForTemplates(userTemplates, workflows),
    },
    catalog: {
      groups,
      memberships,
      templates: catalogTemplates,
      templateAssignments: catalogTemplateAssignments,
      workflows: catalogWorkflows,
      documents: visibleDocuments,
      tasks,
      assignments,
      auditEvents,
    },
  };
};

export const createNextFormPreviewViewModel = async (input: { userKey?: string | undefined; sourceText?: string | undefined }) => {
  const referenceSourceText = await readNextFormSourceText(referenceCraftsmanOrderFormPath);
  const sourceText = input.sourceText ?? referenceSourceText;
  const previewUser = {
    id: "next-form-preview-user",
    key: input.userKey?.trim() || "preview",
    displayName: "Next Form Preview",
    status: "active" as const,
  };
  let parsedForm;
  let parseError: string | undefined;

  try {
    parsedForm = parseNextFormSource(sourceText);
  } catch (error: unknown) {
    parseError = error instanceof Error ? error.message : "Die Quelle konnte nicht gelesen werden.";
  }

  return {
    appName: env.appName,
    activeUser: previewUser,
    users: [previewUser],
    navigation: [],
    title: "Next Form Preview",
    pageSection: "next-form" as const,
    nextFormPreview: {
      sourceText,
      referenceSourceText,
      ...(parsedForm ? { parsedForm } : {}),
      ...(parseError ? { parseError } : {}),
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

  const [assignments, tasks, attachments, auditEvents, attachmentUploadState, editState, submitState, approveState, rejectState, archiveState] = await Promise.all([
    listAssignmentsForDocument(document.id),
    listTasksForDocument(document.id),
    listAttachmentsForDocument(document.id),
    listAuditEventsForDocument(document.id),
    getAttachmentUploadStateForUser(document.id, activeUser.id),
    getDocumentEditStateForUser(document.id, activeUser.id),
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
      editableFields: formDefinition.fields.filter((field) => field.isSavable && editState.isAvailable),
      journals: formDefinition.journals.map((journal) => ({
        ...journal,
        isEditable: journal.isEditable && editState.isAvailable,
      })),
      editState,
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
