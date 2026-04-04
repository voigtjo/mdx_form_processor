import { env } from "../config/env.js";
import { fileURLToPath } from "node:url";
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
import { buildReferenceNextFormJournalDefinition } from "../modules/journal/reference.js";
import { listOperations } from "../modules/operations/read.js";
import { listNextFormApiBindings } from "../modules/next-form/api-bindings.js";
import {
  buildReferenceNextFormActionUi,
  buildReferenceNextFormFieldUi,
  buildReferenceNextFormMasterDataSections,
  getReferenceNextFormEditState,
  getReferenceNextFormHiddenFieldNames,
  getReferenceNextFormSubmitRequiredFieldNames,
} from "../modules/next-form/document-ui.js";
import { findVisibleProductionBatchReferenceByMaterial } from "../modules/next-form/form-reference.js";
import { parseNextFormSource, readNextFormSourceText, referenceCraftsmanOrderFormPath } from "../modules/next-form/read.js";
import { buildQualificationProgressView, getQualificationOwnerUserId } from "../modules/qualification/progress.js";
import { executeLoadCustomerAction } from "../modules/next-form/load-customer.js";
import { executeSuggestMaterialAction } from "../modules/next-form/suggest-material.js";
import { loadNextFormState, saveNextFormState } from "../modules/next-form/state-store.js";
import { listReferenceEntities } from "../modules/entities/read.js";
import { readTemplateFeatureToggles } from "../modules/templates/features.js";
import { isNextFormReferenceTemplate, mapDocumentDataToNextFormValues } from "../modules/next-form/document-bridge.js";
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
import { parseWorkflowSourceText, serializeWorkflowSource } from "../modules/workflows/source.js";
import type { User } from "../types/domain.js";
import type { NavItem } from "../types/navigation.js";
import type { NextFormDefinition } from "../modules/next-form/types.js";

type SectionKey = "workspace" | "templates" | "workflows" | "documents" | "apis" | "admin" | "next-form";

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
    { key: "apis" as const, label: "APIs", path: "/apis" },
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

const getWorkflowLifecycleLabel = (status: string): string => {
  return status === "inactive" ? "unpublished" : status;
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

export const createTemplateDetailViewModel = async (
  userKey: string | undefined,
  templateId: string,
  input?: {
    sourceText?: string | undefined;
    workflowTemplateId?: string | undefined;
  },
) => {
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

  const [groups, templateAssignments, workflows, documents, versions, operations] = await Promise.all([
    listGroups(),
    listTemplateAssignmentsForTemplate(template.id),
    listWorkflowTemplates(),
    listDocumentsVisibleToUser(activeUser.id),
    listFormTemplateVersions(template.key),
    listOperations(),
  ]);

  const selectedWorkflowTemplateId = input?.workflowTemplateId ?? template.workflowTemplateId;
  const workflow = workflows.find((item) => item.id === selectedWorkflowTemplateId) ?? null;
  const relatedAssignments = templateAssignments;
  const relatedGroups = groups.filter((group) => relatedAssignments.some((assignment) => assignment.groupId === group.id));
  const assignmentsWithGroups = relatedAssignments.map((assignment) => ({
    assignment,
    group: groups.find((group) => group.id === assignment.groupId) ?? null,
  }));
  const relatedDocuments = documents.filter((document) => document.templateId === template.id);
  const sourceTextForReference = isNextFormReferenceTemplate(template.key)
    ? input?.sourceText ?? template.mdxBody
    : template.mdxBody;
  const workflowPublishBlockedReason = workflow
    ? workflow.status === "archived"
      ? "Archivierte Workflow-Versionen koennen nicht zugeordnet oder publiziert werden."
      : workflow.status !== "published"
        ? "Die zugeordnete Workflow-Version ist noch nicht publiziert."
        : undefined
    : "Bitte ordne dem Template eine Workflow-Version zu.";
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
  const templateFeatures = readTemplateFeatureToggles({
    templateKey: template.key,
    mdxBody: sourceTextForReference,
  });
  let nextFormReference:
    | {
        sourceFilePath: string;
        sourceText: string;
        apiBindings: Array<{
          actionName: string;
          label: string;
          controlType: "action" | "lookup";
          operationRef?: string;
        }>;
        parsedForm?: NextFormDefinition;
        parseError?: string;
      }
    | undefined;

  if (isNextFormReferenceTemplate(template.key)) {
    nextFormReference = {
      sourceFilePath: "form_templates.mdx_body",
      sourceText: sourceTextForReference,
      apiBindings: [],
    };

    try {
      nextFormReference.parsedForm = parseNextFormSource(sourceTextForReference);
      nextFormReference.apiBindings = listNextFormApiBindings(nextFormReference.parsedForm);
    } catch (error: unknown) {
      nextFormReference.parseError = error instanceof Error ? error.message : "Die neue Formularquelle konnte nicht gelesen werden.";
    }
  }

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
      availableWorkflows: workflows,
      selectedWorkflowTemplateId,
      workflowPublishBlockedReason,
      formDefinition,
      templateFeatures,
      ...(nextFormReference ? { nextFormReference } : {}),
      availableOperations: operations,
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

export const createWorkflowDetailViewModel = async (
  userKey: string | undefined,
  workflowId: string,
  input?: {
    sourceText?: string | undefined;
  },
) => {
  const shellContext = await createShellContext("workflows", userKey);
  const { activeUser } = shellContext;

  const workflow = await findWorkflowTemplateById(workflowId);

  if (!workflow) {
    return null;
  }

  const [templates, allTemplates, versions, documents] = await Promise.all([
    listFormTemplates(),
    listFormTemplates({ includeArchived: true }),
    listWorkflowTemplateVersions(workflow.key),
    listDocumentsVisibleToUser(activeUser.id),
  ]);

  const relatedTemplates = templates.filter((template) => template.workflowTemplateId === workflow.id);
  const publishedTemplateUsages = allTemplates.filter(
    (template) => template.workflowTemplateId === workflow.id && template.status === "published",
  );
  const relatedDocuments = documents.filter((document) => relatedTemplates.some((template) => template.id === document.templateId));
  const currentDraftVersion = versions.find((version) => version.status === "draft");
  const currentPublishedVersion = versions.find((version) => version.status === "published");
  const workflowSourceText = input?.sourceText ?? serializeWorkflowSource(workflow.workflowJson);
  let transitionRows = [] as ReturnType<typeof parseWorkflowSourceText>["transitionRows"];
  let sourceStatuses = Array.isArray(workflow.statuses) ? workflow.statuses : [];
  let sourceError: string | undefined;

  try {
    const persistedParsedSource = parseWorkflowSourceText(serializeWorkflowSource(workflow.workflowJson));
    transitionRows = persistedParsedSource.transitionRows;
    sourceStatuses = persistedParsedSource.statuses;
  } catch (error) {
    sourceError = error instanceof Error ? error.message : "Die gespeicherte Workflow-Quelle konnte nicht gelesen werden.";
  }

  if (input?.sourceText !== undefined) {
    try {
      const parsedSource = parseWorkflowSourceText(workflowSourceText);
      transitionRows = parsedSource.transitionRows;
      sourceStatuses = parsedSource.statuses;
      sourceError = undefined;
    } catch (error) {
      sourceError = error instanceof Error ? error.message : "Die Workflow-Quelle konnte nicht gelesen werden.";
    }
  }

  const highestKnownVersion = versions.reduce((maxVersion, version) => Math.max(maxVersion, version.version), workflow.version);
  const nextDraftVersion = workflow.status === "draft"
    ? workflow.version
    : currentDraftVersion
      ? currentDraftVersion.version
      : highestKnownVersion + 1;
  const publishTargetVersion = workflow.status === "draft"
    ? workflow.version
    : currentDraftVersion
      ? currentDraftVersion.version
      : highestKnownVersion + 1;
  const unpublishBlockedReason = workflow.status !== "published"
    ? "Unpublish ist nur fuer publizierte Workflow-Versionen verfuegbar."
    : publishedTemplateUsages.length > 0
      ? `Nicht moeglich, solange publizierte Templates diese Version nutzen: ${publishedTemplateUsages.map((template) => `${template.name} v${template.version}`).join(", ")}`
      : undefined;
  const archiveBlockedReason = workflow.status !== "inactive"
    ? "Archive ist erst moeglich, wenn die betrachtete Version unveroeffentlicht ist."
    : undefined;

  return {
    ...shellContext,
    title: workflow.name,
    pageSection: "workflows" as const,
    workflowDetail: {
      workflow,
      versions,
      relatedTemplates,
      relatedDocuments,
      lifecycleLabel: getWorkflowLifecycleLabel(workflow.status),
      currentDraftVersion,
      currentPublishedVersion,
      nextDraftVersion,
      publishTargetVersion,
      publishedTemplateUsages,
      canUnpublish: workflow.status === "published" && publishedTemplateUsages.length === 0,
      unpublishBlockedReason,
      canArchive: workflow.status === "inactive",
      archiveBlockedReason,
      transitionRows,
      sourceStatuses,
      workflowSourceText,
      sourceError,
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

const readNextFormOperationRefs = (templateKey: string, sourceText: string): string[] => {
  if (!isNextFormReferenceTemplate(templateKey)) {
    return [];
  }

  try {
    const parsedForm = parseNextFormSource(sourceText);
    return parsedForm.actions.flatMap((action) => (action.ref ? [action.ref] : []));
  } catch {
    return [];
  }
};

const readWorkflowOperationRefs = (workflowJson: Record<string, unknown>): string[] => {
  try {
    const parsedSource = parseWorkflowSourceText(serializeWorkflowSource(workflowJson));
    const tableRefs = parsedSource.transitionRows.flatMap((row) =>
      (row.apiLabel ?? "")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value.length > 0 && value !== "—"),
    );
    const hooks = Array.isArray((workflowJson as { hooks?: unknown }).hooks) ? (workflowJson as { hooks: unknown[] }).hooks : [];
    const hookRefs = hooks.flatMap((hook) => {
      if (!hook || typeof hook !== "object" || Array.isArray(hook)) {
        return [];
      }

      const record = hook as Record<string, unknown>;
      return typeof record.operationRef === "string" ? [record.operationRef] : [];
    });

    return Array.from(new Set([...tableRefs, ...hookRefs]));
  } catch {
    return [];
  }
};

export const createApiCatalogViewModel = async (userKey: string | undefined) => {
  const shellContext = await createShellContext("apis", userKey);
  const { activeUser } = shellContext;

  const [operations, visibleTemplates, visibleWorkflows, documents, importedCustomers, importedProducts] = await Promise.all([
    listOperations(),
    listFormTemplatesForUser(activeUser.id),
    listWorkflowTemplates(),
    listDocumentsVisibleToUser(activeUser.id),
    listReferenceEntities("customer"),
    listReferenceEntities("product"),
  ]);
  const templates = (
    await Promise.all(visibleTemplates.map((template) => findFormTemplateById(template.id)))
  ).filter((template): template is NonNullable<typeof template> => Boolean(template));
  const workflows = (
    await Promise.all(visibleWorkflows.map((workflow) => findWorkflowTemplateById(workflow.id)))
  ).filter((workflow): workflow is NonNullable<typeof workflow> => Boolean(workflow));

  const operationsWithUsage = operations.map((operation) => {
    const templateUsages = templates
      .filter((template) => readNextFormOperationRefs(template.key, template.mdxBody).includes(operation.operationRef))
      .map((template) => ({
        id: template.id,
        key: template.key,
        name: template.name,
        version: template.version,
        status: template.status,
        documentCount: documents.filter((document) => document.templateId === template.id).length,
      }));
    const workflowUsages = workflows
      .filter((workflow) => readWorkflowOperationRefs(workflow.workflowJson).includes(operation.operationRef))
      .map((workflow) => ({
        id: workflow.id,
        key: workflow.key,
        name: workflow.name,
        version: workflow.version,
        status: workflow.status,
      }));

    return {
      operation,
      templateUsages,
      workflowUsages,
      documentCount: templateUsages.reduce((count, usage) => count + usage.documentCount, 0),
      requestFields: operation.inputSchema?.fields ?? [],
      responseFields: operation.outputSchema?.fields ?? [],
    };
  });

  const visibleTemplateFamilies = Array.from(new Map(templates.map((template) => [template.key, template])).values())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((template) => ({
      id: template.id,
      key: template.key,
      name: template.name,
      version: template.version,
      status: template.status,
      tableFields: template.tableFields,
      documentCount: documents.filter((document) => document.templateId === template.id).length,
    }));

  return {
    ...shellContext,
    title: "APIs",
    pageSection: "apis" as const,
    apiCatalog: {
      operations: operationsWithUsage,
      visibleTemplateFamilies,
      importedCustomers,
      importedProducts,
    },
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
    listFormTemplates({ includeArchived: section === "admin" }),
    listTemplateAssignments(),
    listWorkflowTemplates({ includeArchived: section === "admin" }),
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

export const createNextFormPreviewViewModel = async (input: {
  userKey?: string | undefined;
  sourceText?: string | undefined;
  fieldValues?: Record<string, string | undefined>;
  intent?: string | undefined;
  actionName?: string | undefined;
}) => {
  const fileSourceText = await readNextFormSourceText(referenceCraftsmanOrderFormPath);
  const sourceText = input.sourceText ?? fileSourceText;
  let fieldValues = Object.fromEntries(
    Object.entries(input.fieldValues ?? {}).map(([key, value]) => [key, value?.toString() ?? ""]),
  );
  const previewUser = {
    id: "next-form-preview-user",
    key: input.userKey?.trim() || "preview",
    displayName: "Next Form Preview",
    status: "active" as const,
  };
  let parsedForm;
  let parseError: string | undefined;
  let actionState:
    | {
        type: "info" | "error";
        title: string;
        message: string;
        actionName: string;
      }
    | undefined;
  let savedState:
    | {
        savedAt: string;
      }
    | undefined;

  try {
    parsedForm = parseNextFormSource(sourceText);

    if (input.intent === "load-state") {
      try {
        const persistedState = await loadNextFormState();

        if (!persistedState) {
          actionState = {
            type: "info",
            title: "Kein gespeicherter Zustand",
            message: "Fuer dieses Referenzformular wurde bisher noch kein gespeicherter Zustand gefunden.",
            actionName: "load-state",
          };
        } else {
          fieldValues = { ...fieldValues, ...persistedState.values };
          savedState = {
            savedAt: persistedState.savedAt,
          };
          actionState = {
            type: "info",
            title: "Gespeicherter Zustand geladen",
            message: "Der zuletzt gespeicherte Formularzustand wurde in die isolierte Formularansicht uebernommen.",
            actionName: "load-state",
          };
        }
      } catch (error: unknown) {
        actionState = {
          type: "error",
          title: "Laden fehlgeschlagen",
          message: error instanceof Error ? error.message : "Der gespeicherte Zustand konnte nicht geladen werden.",
          actionName: "load-state",
        };
      }
    }

    if (input.intent === "run-action" && (input.actionName === "load_customer" || input.actionName === "suggest_material")) {
      const action = parsedForm.actions.find((element) => element.name === input.actionName);

      if (action) {
        const result = action.name === "suggest_material"
          ? await executeSuggestMaterialAction({
              action,
              fieldValues,
            })
          : await executeLoadCustomerAction({
              action,
              fieldValues,
            });

        fieldValues = result.fieldValues;
        actionState = result.actionState;
      }
    }

    if (input.intent === "save-state") {
      try {
        const persistedState = await saveNextFormState({
          formKey: parsedForm.meta.key,
          values: fieldValues,
        });

        savedState = {
          savedAt: persistedState.savedAt,
        };
        actionState = {
          type: "info",
          title: "Formularzustand gespeichert",
          message: "Der aktuelle isolierte Formularzustand wurde lokal gespeichert und kann spaeter wieder geladen werden.",
          actionName: "save-state",
        };
      } catch (error: unknown) {
        actionState = {
          type: "error",
          title: "Speichern fehlgeschlagen",
          message: error instanceof Error ? error.message : "Der Formularzustand konnte nicht gespeichert werden.",
          actionName: "save-state",
        };
      }
    }
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
      sourceFilePath: fileURLToPath(referenceCraftsmanOrderFormPath),
      fieldValues,
      ...(parsedForm ? { parsedForm } : {}),
      ...(actionState ? { actionState } : {}),
      ...(savedState ? { savedState } : {}),
      ...(parseError ? { parseError } : {}),
    },
  };
};

export const createDocumentDetailViewModel = async (
  userKey: string | undefined,
  documentId: string,
  input?: {
    nextFormFieldValues?: Record<string, string | undefined>;
  },
) => {
  const shellContext = await createShellContext("documents", userKey);
  const { activeUser, users } = shellContext;

  const document = await findDocumentDetailVisibleToUser(documentId, activeUser.id);

  if (!document) {
    return null;
  }

  const [assignments, tasks, attachments, auditEvents, attachmentUploadState, editState, submitState, approveState, rejectState, archiveState, workflowDetail] = await Promise.all([
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
    findWorkflowTemplateById(document.workflowTemplateId),
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
  const templateFeatures = readTemplateFeatureToggles({
    templateKey: document.templateKey,
    mdxBody: document.formTemplateMdxBody,
  });
  let nextFormReference:
    | {
        sourceFilePath: string;
        sourceText: string;
        fieldValues: Record<string, string>;
        fieldUi: Record<string, {
          controlType: "text" | "date" | "textarea" | "html-editor" | "grid" | "number" | "select" | "radio-group" | "checkbox-group" | "user-select" | "user-multiselect" | "signature";
          runtimeRole: "lookup_input" | "lookup_prefill" | "manual_input" | "derived_readonly" | "workflow_readonly";
          lookupRole: "none" | "input" | "result" | "masterdata";
          isSubmitRequired: boolean;
          isEditable: boolean;
          isReadOnly: boolean;
          state: "editable" | "readonly";
          emptyValueLabel?: string;
          helpText?: string;
          optionItems?: Array<{
            value: string;
            label: string;
          }>;
          displayValue?: string;
        }>;
        actionUi: Record<string, {
          controlType: "action" | "lookup";
          runtimeRole: "lookup_trigger";
          lookupRole: "trigger";
          args: string[];
          bind: string[];
          isEnabled: boolean;
          hint?: string;
        }>;
        hiddenFieldNames: string[];
        editState: {
          isAvailable: boolean;
          reason?: string;
        };
        masterDataSections: Array<{
          key: "customer" | "product";
          title: string;
          summary: string;
          entries: Array<{
            label: string;
            value: string;
            emptyValueLabel: string;
          }>;
        }>;
        linkedFormReferences: Array<{
          key: "production_batch";
          title: string;
          href: string;
          sourceLabel: string;
          summary: string;
          entries: Array<{
            label: string;
            value: string;
            emptyValueLabel: string;
          }>;
        }>;
        participantProgress?: {
          rows: Array<{
            userId: string;
            userKey?: string;
            displayName: string;
            participationLabel: string;
            workflowRoles: Array<"editor" | "approver">;
            saved: boolean;
            submitted: boolean;
            signed: boolean;
            lastUpdatedAt?: string;
            isCurrentUser: boolean;
          }>;
          submitModeLabel: "AND" | "OR";
          approvalModeLabel: "AND" | "OR";
          submitProgressLabel: string;
          submitCount: number;
          submitRequiredCount: number;
          currentUserRoles: Array<"editor" | "approver">;
        };
        submitRequiredFieldNames: string[];
        parsedForm?: NextFormDefinition;
        parseError?: string;
      }
    | undefined;

  if (isNextFormReferenceTemplate(document.templateKey)) {
    const nextFormEditState = getReferenceNextFormEditState({
      documentStatus: document.status,
      baseEditState: editState,
    });
    const nextFormFieldValues = {
      ...mapDocumentDataToNextFormValues(document.templateKey, document.documentDataJson, {
        currentUserId: activeUser.id,
      }),
      ...Object.fromEntries(
        Object.entries(input?.nextFormFieldValues ?? {}).map(([key, value]) => [key, value?.toString() ?? ""]),
      ),
    };
    const nextFormFieldUi = buildReferenceNextFormFieldUi({
      templateKey: document.templateKey,
      canEdit: nextFormEditState.isAvailable,
      fieldValues: nextFormFieldValues,
      availableUsers: users,
    });
    if (document.templateKey === "qualification-record" && activeUser.id !== getQualificationOwnerUserId(document.documentDataJson)) {
      for (const fieldName of [
        "qualification_record_number",
        "qualification_title",
        "owner_user_id",
        "attendee_user_ids",
        "valid_until",
        "approval_status",
      ]) {
        const field = nextFormFieldUi[fieldName];

        if (field) {
          field.isEditable = false;
          field.isReadOnly = true;
          field.state = "readonly";
        }
      }
    }
    const nextFormActionUi = buildReferenceNextFormActionUi({
      templateKey: document.templateKey,
      canEdit: nextFormEditState.isAvailable,
    });
    const linkedProductionBatchReference = await findVisibleProductionBatchReferenceByMaterial({
      userId: activeUser.id,
      activeUserKey: activeUser.key,
      materialName: nextFormFieldValues.material ?? "",
    });
    const participantProgress = document.templateKey === "qualification-record"
      ? buildQualificationProgressView({
          data: document.documentDataJson,
          assignments,
          users,
          currentUserId: activeUser.id,
          workflowJson: (workflowDetail?.workflowJson ?? {}) as Parameters<typeof buildQualificationProgressView>[0]["workflowJson"],
        })
      : undefined;

    const currentNextFormReference: NonNullable<typeof nextFormReference> = {
      sourceFilePath: "documents.template_mdx_body",
      sourceText: document.formTemplateMdxBody,
      fieldValues: nextFormFieldValues,
      fieldUi: nextFormFieldUi,
      actionUi: nextFormActionUi,
      hiddenFieldNames: getReferenceNextFormHiddenFieldNames(document.templateKey),
      editState: nextFormEditState,
      masterDataSections: buildReferenceNextFormMasterDataSections({
        templateKey: document.templateKey,
        fieldValues: nextFormFieldValues,
      }),
      linkedFormReferences: linkedProductionBatchReference ? [linkedProductionBatchReference] : [],
      ...(participantProgress ? { participantProgress } : {}),
      submitRequiredFieldNames: getReferenceNextFormSubmitRequiredFieldNames(document.templateKey),
    };

    try {
      currentNextFormReference.parsedForm = parseNextFormSource(document.formTemplateMdxBody);
    } catch (error: unknown) {
      currentNextFormReference.parseError = error instanceof Error ? error.message : "Die neue Formularquelle konnte nicht gelesen werden.";
    }

    nextFormReference = currentNextFormReference;
  }

  return {
    ...shellContext,
    title: document.title,
    pageSection: "documents" as const,
    documentDetail: {
      document,
      formDefinition,
      templateFeatures,
      ...(nextFormReference ? { nextFormReference } : {}),
      editableFields: formDefinition.fields.filter((field) => field.isSavable && editState.isAvailable),
      journals: templateFeatures.journal.enabled
        ? (
          formDefinition.journals.length > 0
            ? formDefinition.journals.map((journal) => ({
              ...journal,
              isEditable: journal.isEditable && editState.isAvailable,
            }))
            : isNextFormReferenceTemplate(document.templateKey)
              ? [buildReferenceNextFormJournalDefinition({
                documentData: document.documentDataJson,
                isEditable: editState.isAvailable,
              })]
              : []
        )
        : [],
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
