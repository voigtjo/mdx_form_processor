import { env } from "../config/env.js";
import {
  sampleDocuments,
  sampleGroups,
  sampleMemberships,
  sampleTasks,
  sampleTemplates,
  sampleUsers,
  sampleWorkflows,
} from "./sample-data.js";
import type { Document, FormTemplate, Group, Task, User, WorkflowTemplate } from "../types/domain.js";
import type { NavItem } from "../types/navigation.js";

type SectionKey = "workspace" | "templates" | "workflows" | "documents" | "admin";

const buildHref = (path: string, activeUserKey: string): string => `${path}?user=${encodeURIComponent(activeUserKey)}`;

export const getActiveUser = (userKey: string | undefined): User => {
  const fallbackUser = sampleUsers[0];

  if (!fallbackUser) {
    throw new Error("No sample users available for initial user selection.");
  }

  return sampleUsers.find((user) => user.key === userKey) ?? fallbackUser;
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

const groupIdsForUser = (userId: string): string[] => {
  return sampleMemberships.filter((membership) => membership.userId === userId).map((membership) => membership.groupId);
};

const groupsForUser = (userId: string): Group[] => {
  const groupIds = new Set(groupIdsForUser(userId));
  return sampleGroups.filter((group) => groupIds.has(group.id));
};

const templatesForUser = (userId: string): FormTemplate[] => {
  const groupIds = new Set(groupIdsForUser(userId));
  return sampleTemplates.filter((template) => template.groupIds.some((groupId) => groupIds.has(groupId)));
};

const documentsForUser = (userId: string): Document[] => {
  return sampleDocuments.filter((document) => document.assignedUserIds.includes(userId));
};

const tasksForUser = (userId: string): Task[] => {
  return sampleTasks.filter((task) => task.userId === userId && task.status === "open");
};

const workflowsForTemplates = (templates: FormTemplate[]): WorkflowTemplate[] => {
  const workflowIds = new Set(templates.map((template) => template.workflowTemplateId));
  return sampleWorkflows.filter((workflow) => workflowIds.has(workflow.id));
};

export const createBaseViewModel = (section: SectionKey, userKey: string | undefined) => {
  const activeUser = getActiveUser(userKey);
  const userGroups = groupsForUser(activeUser.id);
  const userTemplates = templatesForUser(activeUser.id);
  const userDocuments = documentsForUser(activeUser.id);
  const userTasks = tasksForUser(activeUser.id);

  return {
    appName: env.appName,
    pageSection: section,
    activeUser,
    users: sampleUsers,
    navigation: getNavigation(section, activeUser.key),
    workspaceSummary: {
      groups: userGroups,
      tasks: userTasks,
      templates: userTemplates,
      documents: userDocuments,
      workflows: workflowsForTemplates(userTemplates),
    },
    catalog: {
      groups: sampleGroups,
      templates: sampleTemplates,
      workflows: sampleWorkflows,
      documents: sampleDocuments,
      tasks: sampleTasks,
    },
  };
};
