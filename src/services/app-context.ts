import { env } from "../config/env.js";
import { getAttachmentUploadStateForUser } from "../modules/attachments/upload.js";
import { listAttachmentsForDocument } from "../modules/attachments/read.js";
import { listAssignments } from "../modules/assignments/read.js";
import { listAssignmentsForDocument } from "../modules/assignments/read.js";
import { listAuditEvents } from "../modules/audit/read.js";
import { listAuditEventsForDocument } from "../modules/audit/read.js";
import { getDocumentEditStateForUser } from "../modules/documents/access.js";
import { getDocumentAssignStateForUser } from "../modules/documents/assign.js";
import { listDocumentAssignableEditorsForUser } from "../modules/documents/assign.js";
import { getDocumentApproveStateForUser } from "../modules/documents/approve.js";
import { getDocumentArchiveStateForUser } from "../modules/documents/archive.js";
import { getDocumentReassignStateForUser } from "../modules/documents/reassign.js";
import {
  findDocumentDetailVisibleToUser,
  listDocumentsAssignedToUser,
  listDocumentsVisibleToUser,
  listTasks,
  listTasksForDocument,
  listTasksForUser,
} from "../modules/documents/read.js";
import { findTypedRecordSummary } from "../modules/documents/typed-records-read.js";
import { getDocumentRejectStateForUser } from "../modules/documents/reject.js";
import { getDocumentSubmitStateForUser } from "../modules/documents/submit.js";
import { findGroupById, listGroups, listGroupsForUser } from "../modules/groups/read.js";
import { listMemberships, listMembershipsForGroup, listMembershipsForUser } from "../modules/memberships/read.js";
import { getDocumentJournalWriteStateForUser } from "../modules/journal/add.js";
import { buildReferenceFormRuntimeJournalDefinition } from "../modules/journal/reference.js";
import { findOperationById, listOperations } from "../modules/operations/read.js";
import { sanitizeOperationSchemaJson } from "../modules/operations/schema.js";
import { listFormRuntimeApiBindings, listFormRuntimeApiDefinitions } from "../modules/forms/api-bindings.js";
import {
  buildReferenceFormRuntimeActionUi,
  buildReferenceFormRuntimeFieldUi,
  buildReferenceFormRuntimeMasterDataSections,
  getReferenceFormRuntimeRequiredFieldNamesForStatus,
  getReferenceFormRuntimeEditState,
  getReferenceFormRuntimeHiddenFieldNames,
  getReferenceFormRuntimeSubmitRequiredFieldNames,
} from "../modules/forms/document-ui.js";
import { findVisibleProductionBatchReferenceByMaterial } from "../modules/forms/form-reference.js";
import { parseFormRuntimeSource } from "../modules/forms/read.js";
import { buildQualificationProgressView, getQualificationOwnerUserId } from "../modules/qualification/progress.js";
import { evaluateQualificationDocumentData } from "../modules/qualification/evaluation.js";
import { getQualificationPageDefinition, normalizeQualificationPageIndex, qualificationPageCount } from "../modules/qualification/pages.js";
import { listReferenceEntities } from "../modules/entities/read.js";
import { executePublishedOperationByKey } from "../modules/operations/runtime.js";
import { readTemplateFeatureToggles } from "../modules/templates/features.js";
import { isFormRuntimeReferenceTemplate, mapDocumentDataToFormRuntimeValues } from "../modules/forms/document-bridge.js";
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
import type { FormRuntimeDefinition } from "../modules/forms/types.js";
import { translate, type SupportedLocale, type TranslationKey } from "../i18n/translations.js";
import {
  canManageAdmins,
  canManageGroup,
  canViewAdmin,
  canViewApis,
  canViewAllFunctionalTabs,
  canViewGroupScopedAdminTabs,
  canEditApis,
  canEditTemplatesAndWorkflows,
  canViewGroups,
  canViewTemplatesAndWorkflows,
  getMembershipForGroup,
  getVisibleSections,
  type AppSectionKey,
} from "./permissions.js";

type SectionKey = AppSectionKey;

const buildHref = (
  path: string,
  activeUserKey: string,
  selectedGroupKey?: string,
  extraParams?: Record<string, string | number | undefined>,
): string => {
  const url = new URL(path, "http://localhost");
  url.searchParams.set("user", activeUserKey);

  if (selectedGroupKey) {
    url.searchParams.set("group", selectedGroupKey);
  }

  Object.entries(extraParams ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return `${url.pathname}${url.search}`;
};

const normalizeSelectedGroupKey = (groupKey?: string): string | undefined => {
  if (!groupKey) {
    return undefined;
  }

  return groupKey === "__all__" ? "" : groupKey;
};

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

export const getNavigation = (
  section: SectionKey,
  activeUserKey: string,
  locale: SupportedLocale,
  visibleSections: SectionKey[],
  selectedGroupKey?: string,
): NavItem[] => {
  const items = [
    { key: "workspace" as const, label: translate(locale, "nav.workspace"), path: "/workspace" },
    { key: "documents" as const, label: translate(locale, "nav.documents"), path: "/documents" },
    { key: "templates" as const, label: translate(locale, "nav.templates"), path: "/templates" },
    { key: "workflows" as const, label: translate(locale, "nav.workflows"), path: "/workflows" },
    { key: "apis" as const, label: translate(locale, "nav.apis"), path: "/apis" },
    { key: "groups" as const, label: translate(locale, "nav.groups"), path: "/groups" },
    { key: "admin" as const, label: translate(locale, "nav.admin"), path: "/admin" },
  ];

  return items
    .filter((item) => visibleSections.includes(item.key))
    .map((item) => ({
    label: item.label,
    href: buildHref(item.path, activeUserKey, selectedGroupKey),
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

const createShellContext = async (section: SectionKey, userKey: string | undefined, groupKey?: string | undefined) => {
  const users = await listUsers();
  const activeUser = await getActiveUser(userKey, users);
  const normalizedGroupKey = normalizeSelectedGroupKey(groupKey);
  const [memberships, allGroups, userGroups] = await Promise.all([
    listMembershipsForUser(activeUser.id),
    listGroups(),
    listGroupsForUser(activeUser.id),
  ]);
  const canSeeAllGroups = canViewAdmin(activeUser) || canViewAllFunctionalTabs(activeUser);
  const availableGroups = (canSeeAllGroups ? allGroups : userGroups).filter((group) => group.status === "active");
  const preferredGroup =
    activeUser.preferredGroupId
      ? availableGroups.find((group) => group.id === activeUser.preferredGroupId)
      : undefined;
  const selectedGroup =
    normalizedGroupKey === ""
      ? undefined
      : (normalizedGroupKey ? availableGroups.find((group) => group.key === normalizedGroupKey) : undefined)
        ?? (groupKey === undefined ? preferredGroup : undefined)
        ?? undefined;
  const selectedMembership = getMembershipForGroup(memberships, selectedGroup?.id);
  const activeGroupContextKey = groupKey === "__all__" ? "__all__" : selectedGroup?.key;
  const locale = activeUser.locale ?? "de";
  const t = (key: TranslationKey): string => translate(locale, key);
  const visibleSections = getVisibleSections({
    user: activeUser,
    ...(selectedGroup ? { selectedGroup } : {}),
    ...(selectedMembership ? { selectedMembership } : {}),
  });
  const membershipRights = selectedMembership?.rights;

  return {
    appName: env.appName,
    activeUser,
    availableGroups,
    selectedGroup,
    selectedMembership,
    currentUserMemberships: memberships,
    locale,
    t,
    users,
    hrefWithContext: (path: string, extraParams?: Record<string, string | number | undefined>) =>
      buildHref(path, activeUser.key, activeGroupContextKey, extraParams),
    contextQuery: buildHref("/", activeUser.key, activeGroupContextKey).slice(1),
    navigation: getNavigation(section, activeUser.key, locale, visibleSections, activeGroupContextKey),
    visibleSections,
    permissions: {
      canViewAdmin: canViewAdmin(activeUser),
      canManageAdmins: canManageAdmins(activeUser),
      canViewAllFunctionalTabs: canViewAllFunctionalTabs(activeUser),
      canViewGroupScopedAdminTabs: canViewGroupScopedAdminTabs(selectedMembership?.rights),
      canManageGroup: canManageGroup(activeUser, selectedMembership?.rights),
      canViewTemplatesAndWorkflows: canViewTemplatesAndWorkflows(activeUser, membershipRights),
      canEditTemplatesAndWorkflows: canEditTemplatesAndWorkflows(activeUser, membershipRights),
      canViewGroups: canViewGroups(activeUser, membershipRights),
      canViewApis: canViewApis(activeUser, membershipRights),
      canEditApis: canEditApis(activeUser),
    },
  };
};

export const createTemplateDetailViewModel = async (
  userKey: string | undefined,
  groupKey: string | undefined,
  templateId: string,
  input?: {
    sourceText?: string | undefined;
    workflowTemplateId?: string | undefined;
    selectedVersionId?: string | undefined;
    editMode?: boolean;
  },
) => {
  const shellContext = await createShellContext("templates", userKey, groupKey);
  const { activeUser } = shellContext;

  const unrestrictedTemplate = await findFormTemplateById(templateId);
  if (!unrestrictedTemplate) {
    return null;
  }

  const [groups, workflows, documents, versions, operations, availableOperations] = await Promise.all([
    listGroups(),
    listWorkflowTemplates(),
    listDocumentsVisibleToUser(activeUser.id),
    listFormTemplateVersions(unrestrictedTemplate.key),
    listOperations(),
    listOperations({ statuses: ["published"] }),
  ]);
  const selectedTemplateSummary =
    (input?.selectedVersionId ? versions.find((version) => version.id === input.selectedVersionId) : undefined)
    ?? versions.find((version) => version.status === "published")
    ?? versions.find((version) => version.status === "draft")
    ?? versions.find((version) => version.id === unrestrictedTemplate.id)
    ?? versions[0];

  if (!selectedTemplateSummary) {
    return null;
  }

  const template =
    selectedTemplateSummary.status === "published"
      ? await findVisiblePublishedFormTemplateById(selectedTemplateSummary.id, activeUser.id)
      : await findFormTemplateById(selectedTemplateSummary.id);

  if (!template) {
    return null;
  }

  const templateAssignments = await listTemplateAssignmentsForTemplate(template.id);
  const draftVersion = versions.find((version) => version.status === "draft");
  const publishedVersion = versions.find((version) => version.status === "published");
  const isEditable =
    shellContext.permissions.canEditTemplatesAndWorkflows
    && Boolean(input?.editMode)
    && template.status === "draft";

  const selectedWorkflowTemplateId = input?.workflowTemplateId ?? template.workflowTemplateId;
  const workflow = workflows.find((item) => item.id === selectedWorkflowTemplateId) ?? null;
  const relatedAssignments = templateAssignments;
  const relatedGroups = groups.filter((group) => relatedAssignments.some((assignment) => assignment.groupId === group.id));
  const assignmentsWithGroups = relatedAssignments.map((assignment) => ({
    assignment,
    group: groups.find((group) => group.id === assignment.groupId) ?? null,
  }));
  const relatedDocuments = documents.filter((document) => document.templateId === template.id);
  const sourceTextForReference = isFormRuntimeReferenceTemplate(template.key)
    ? input?.sourceText ?? template.mdxBody
    : template.mdxBody;
  const workflowPublishBlockedReason = workflow
    ? workflow.status === "archived"
      ? "Archivierte Workflow-Versionen koennen Templates nicht zugeordnet werden."
      : undefined
    : "Bitte ordne dem Template eine Workflow-Version zu.";
  const canPublishVersion = template.status === "draft" && !workflowPublishBlockedReason;
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
  let formRuntimeReference:
    | {
        sourceFilePath: string;
      sourceText: string;
      apiDefinitions: Array<{
        ref: string;
        request?: string[];
        response?: string[];
        operationTitle?: string;
        operationStatus?: string;
        labels: string[];
      }>;
      apiBindings: Array<{
        actionName: string;
        label: string;
          controlType: "action" | "lookup";
          operationRef?: string;
          args?: string[];
          bind?: string[];
          operationTitle?: string;
          operationStatus?: string;
        }>;
        parsedForm?: FormRuntimeDefinition;
        parseError?: string;
      }
    | undefined;

  if (isFormRuntimeReferenceTemplate(template.key)) {
    formRuntimeReference = {
      sourceFilePath: "form_templates.mdx_body",
      sourceText: sourceTextForReference,
      apiDefinitions: [],
      apiBindings: [],
    };

    try {
      formRuntimeReference.parsedForm = parseFormRuntimeSource(sourceTextForReference);
      formRuntimeReference.apiDefinitions = listFormRuntimeApiDefinitions(formRuntimeReference.parsedForm).map((definition) => {
        const selectedOperation = operations.find((operation) => operation.key === definition.ref);
        const labels = formRuntimeReference?.parsedForm?.actions
          .filter((action) => action.ref === definition.ref)
          .map((action) => action.label ?? action.name) ?? [];

        return {
          ...definition,
          labels,
          ...(selectedOperation?.title ? { operationTitle: selectedOperation.title } : {}),
          ...(selectedOperation?.status ? { operationStatus: selectedOperation.status } : {}),
        };
      });
      formRuntimeReference.apiBindings = listFormRuntimeApiBindings(formRuntimeReference.parsedForm).map((binding) => {
        const actionDefinition = formRuntimeReference?.parsedForm?.actions.find((action) => action.name === binding.actionName);
        const selectedOperation = operations.find((operation) => operation.key === binding.operationRef);

        return {
          ...binding,
          ...(actionDefinition?.args ? { args: actionDefinition.args } : {}),
          ...(actionDefinition?.bind ? { bind: actionDefinition.bind } : {}),
          ...(selectedOperation?.title ? { operationTitle: selectedOperation.title } : {}),
          ...(selectedOperation?.status ? { operationStatus: selectedOperation.status } : {}),
        };
      });
    } catch (error: unknown) {
      formRuntimeReference.parseError = error instanceof Error ? error.message : "Die neue Formularquelle konnte nicht gelesen werden.";
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
      draftVersion,
      publishedVersion,
      selectedVersionId: template.id,
      isEditMode: Boolean(input?.editMode) && template.status === "draft",
      relatedDocuments,
      availableWorkflows: workflows,
      selectedWorkflowTemplateId,
      canPublishVersion,
      canStartEdit: shellContext.permissions.canEditTemplatesAndWorkflows,
      workflowPublishBlockedReason,
      formDefinition,
      templateFeatures,
      ...(formRuntimeReference ? { formRuntimeReference } : {}),
      availableOperations,
      isEditable,
      integrations: {
        actions: formDefinition.actions.filter((action) => action.operationRef),
        fields: formDefinition.fields.filter((field) => field.operationRef),
      },
    },
  };
};

export const createTemplateNewViewModel = async (userKey: string | undefined, groupKey?: string | undefined) => {
  const shellContext = await createShellContext("templates", userKey, groupKey);
  const workflows = await listWorkflowTemplates();

  return {
    ...shellContext,
    title: "New Template",
    pageSection: "templates" as const,
    availableWorkflows: workflows,
    availableFormTypes: [
      { value: "customer_order", label: "customer_order · Kundenservice-Dokumentation" },
      { value: "production_record", label: "production_record · Produktionsdokumentation" },
      { value: "qualification_record", label: "qualification_record · Qualifikationsnachweis" },
      { value: "generic_form", label: "generic_form · Generisches Formular" },
    ],
  };
};

export const createWorkflowDetailViewModel = async (
  userKey: string | undefined,
  groupKey: string | undefined,
  workflowId: string,
  input?: {
    sourceText?: string | undefined;
    selectedVersionId?: string | undefined;
    editMode?: boolean;
  },
) => {
  const shellContext = await createShellContext("workflows", userKey, groupKey);
  const { activeUser } = shellContext;
  const initialWorkflow = await findWorkflowTemplateById(workflowId);

  if (!initialWorkflow) {
    return null;
  }

  const [templates, allTemplates, versions, documents, operations, availableOperations] = await Promise.all([
    listFormTemplates(),
    listFormTemplates({ includeArchived: true }),
    listWorkflowTemplateVersions(initialWorkflow.key),
    listDocumentsVisibleToUser(activeUser.id),
    listOperations(),
    listOperations({ statuses: ["published"] }),
  ]);
  const selectedWorkflowSummary =
    (input?.selectedVersionId ? versions.find((version) => version.id === input.selectedVersionId) : undefined)
    ?? versions.find((version) => version.status === "published")
    ?? versions.find((version) => version.status === "draft")
    ?? versions.find((version) => version.id === initialWorkflow.id)
    ?? versions[0];

  if (!selectedWorkflowSummary) {
    return null;
  }

  const workflow = await findWorkflowTemplateById(selectedWorkflowSummary.id);

  if (!workflow) {
    return null;
  }

  const relatedTemplates = templates.filter((template) => template.workflowTemplateId === workflow.id);
  const publishedTemplateUsages = allTemplates.filter(
    (template) => template.workflowTemplateId === workflow.id && template.status === "published",
  );
  const relatedDocuments = documents.filter((document) => relatedTemplates.some((template) => template.id === document.templateId));
  const currentDraftVersion = versions.find((version) => version.status === "draft");
  const currentPublishedVersion = versions.find((version) => version.status === "published");
  const isEditable =
    shellContext.permissions.canEditTemplatesAndWorkflows
    && Boolean(input?.editMode)
    && workflow.status === "draft";
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
  const canPublishVersion = workflow.status === "draft";
  const statusEditorRows = sourceStatuses.length > 0 ? sourceStatuses : [""];

  return {
    ...shellContext,
    title: workflow.name,
    pageSection: "workflows" as const,
    workflowDetail: {
      workflow,
      versions,
      selectedVersionId: workflow.id,
      isEditMode: Boolean(input?.editMode) && workflow.status === "draft",
      relatedTemplates,
      relatedDocuments,
      lifecycleLabel: getWorkflowLifecycleLabel(workflow.status),
      currentDraftVersion,
      currentPublishedVersion,
      nextDraftVersion,
      publishTargetVersion,
      canPublishVersion,
      publishedTemplateUsages,
      canUnpublish: workflow.status === "published" && publishedTemplateUsages.length === 0,
      unpublishBlockedReason,
      canArchive: workflow.status === "inactive",
      archiveBlockedReason,
      transitionRows,
      statusEditorRows,
      availableStatusOptions: sourceStatuses,
      availableRoleOptions: [
        { value: "editor", label: "editor (w: write)" },
        { value: "approver", label: "approver (x: execute)" },
      ],
      sourceStatuses,
      workflowSourceText,
      sourceError,
      availableOperations,
      canStartEdit: shellContext.permissions.canEditTemplatesAndWorkflows,
      isEditable,
    },
  };
};

export const createWorkflowNewViewModel = async (userKey: string | undefined, groupKey?: string | undefined) => {
  const shellContext = await createShellContext("workflows", userKey, groupKey);

  return {
    ...shellContext,
    title: "New Workflow",
    pageSection: "workflows" as const,
  };
};

const readFormRuntimeOperationRefs = (templateKey: string, sourceText: string): string[] => {
  if (!isFormRuntimeReferenceTemplate(templateKey)) {
    return [];
  }

  try {
    const parsedForm = parseFormRuntimeSource(sourceText);
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

const loadApiUsageData = async (activeUserId: string, selectedGroupId?: string) => {
  const [operations, visibleTemplates, visibleWorkflows, documents, importedCustomers, importedProducts, templateAssignments] = await Promise.all([
    listOperations(),
    listFormTemplatesForUser(activeUserId),
    listWorkflowTemplates(),
    listDocumentsVisibleToUser(activeUserId),
    listReferenceEntities("customer"),
    listReferenceEntities("product"),
    listTemplateAssignments(),
  ]);
  const filteredTemplateIds = selectedGroupId
    ? new Set(
        templateAssignments
          .filter((assignment) => assignment.groupId === selectedGroupId && assignment.status === "active")
          .map((assignment) => assignment.templateId),
      )
    : null;
  const templates = (
    await Promise.all(visibleTemplates.map((template) => findFormTemplateById(template.id)))
  )
    .filter((template): template is NonNullable<typeof template> => Boolean(template))
    .filter((template) => !filteredTemplateIds || filteredTemplateIds.has(template.id));
  const templateIdSet = new Set(templates.map((template) => template.id));
  const workflows = (
    await Promise.all(visibleWorkflows.map((workflow) => findWorkflowTemplateById(workflow.id)))
  )
    .filter((workflow): workflow is NonNullable<typeof workflow> => Boolean(workflow))
    .filter((workflow) => templates.some((template) => template.workflowTemplateId === workflow.id));
  const filteredDocuments = selectedGroupId
    ? documents.filter((document) => templateIdSet.has(document.templateId))
    : documents;

  return {
    operations,
    templates,
    workflows,
    documents: filteredDocuments,
    importedCustomers,
    importedProducts,
  };
};

const buildOperationUsageSummary = (input: {
  operations: Awaited<ReturnType<typeof listOperations>>;
  templates: NonNullable<Awaited<ReturnType<typeof findFormTemplateById>>>[];
  workflows: NonNullable<Awaited<ReturnType<typeof findWorkflowTemplateById>>>[];
  documents: Awaited<ReturnType<typeof listDocumentsVisibleToUser>>;
}) => {
  return input.operations.map((operation) => {
    const templateUsages = input.templates
      .filter((template) => readFormRuntimeOperationRefs(template.key, template.mdxBody).includes(operation.key))
      .map((template) => ({
        id: template.id,
        key: template.key,
        name: template.name,
        version: template.version,
        status: template.status,
        documentCount: input.documents.filter((document) => document.templateId === template.id).length,
      }));
    const workflowUsages = input.workflows
      .filter((workflow) => readWorkflowOperationRefs(workflow.workflowJson).includes(operation.key))
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
};

export const createApiCatalogViewModel = async (userKey: string | undefined, groupKey?: string | undefined) => {
  const shellContext = await createShellContext("apis", userKey, groupKey);
  const { activeUser, selectedGroup } = shellContext;
  const usageData = await loadApiUsageData(activeUser.id, selectedGroup?.id);
  const operationsWithUsage = buildOperationUsageSummary(usageData)
    .filter((entry) => !selectedGroup || entry.templateUsages.length > 0 || entry.workflowUsages.length > 0);
  const visibleTemplateFamilies = Array.from(new Map(usageData.templates.map((template) => [template.key, template])).values())
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((template) => ({
      id: template.id,
      key: template.key,
      name: template.name,
      version: template.version,
      status: template.status,
      tableFields: template.tableFields,
      documentCount: usageData.documents.filter((document) => document.templateId === template.id).length,
    }));
  const typedRecordApis = [
    {
      label: "Kundenservice-Dokumentation",
      familyKey: "customer-orders",
      tableName: "customer_orders",
      count: usageData.documents.filter((document) => document.formType === "customer_order").length,
    },
    {
      label: "Production Records",
      familyKey: "production-records",
      tableName: "production_records",
      count: usageData.documents.filter((document) => document.formType === "production_record").length,
    },
    {
      label: "Qualification Records",
      familyKey: "qualification-records",
      tableName: "qualification_records",
      count: usageData.documents.filter((document) => document.formType === "qualification_record").length,
    },
    {
      label: "Generic Form Records",
      familyKey: "generic-form-records",
      tableName: "generic_form_records",
      count: usageData.documents.filter((document) => document.formType === "generic_form").length,
    },
  ];
  const totalImportedMasterData = usageData.importedCustomers.length + usageData.importedProducts.length;
  const totalTypedRecordCount = typedRecordApis.reduce((count, family) => count + family.count, 0);
  const hasFormDataApis = visibleTemplateFamilies.length > 0;
  const hasTypedRecordApis = env.appName !== "Service-Report" && (totalTypedRecordCount > 0 || visibleTemplateFamilies.length > 0);
  const hasMasterDataApis = totalImportedMasterData > 0;

  return {
    ...shellContext,
    title: "APIs",
    pageSection: "apis" as const,
    apiCatalog: {
      operations: operationsWithUsage,
      visibleTemplateFamilies,
      typedRecordApis: env.appName === "Service-Report" ? [] : typedRecordApis,
      importedCustomers: usageData.importedCustomers,
      importedProducts: usageData.importedProducts,
      totalImportedMasterData,
      totalTypedRecordCount,
      hasFormDataApis,
      hasTypedRecordApis,
      hasMasterDataApis,
    },
  };
};

const buildOperationEditorState = (input?: {
  operation?: Awaited<ReturnType<typeof findOperationById>>;
  values?: {
    key?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    connector?: string | undefined;
    authMode?: string | undefined;
    requestSchemaText?: string | undefined;
    responseSchemaText?: string | undefined;
    handlerTsSource?: string | undefined;
    tagsText?: string | undefined;
  };
}) => {
  const operation = input?.operation;
  const values = input?.values;
  const formatOptionalSchemaText = (schema: Record<string, unknown> | undefined): string => {
    const sanitized = sanitizeOperationSchemaJson(schema);
    return Object.keys(sanitized).length > 0 ? JSON.stringify(sanitized, null, 2) : "";
  };

  return {
    key: values?.key ?? operation?.key ?? "",
    title: values?.title ?? operation?.title ?? "",
    description: values?.description ?? operation?.description ?? "",
    connector: values?.connector ?? operation?.connector ?? "typescript",
    authMode: values?.authMode ?? operation?.authMode ?? "none",
    requestSchemaText: values?.requestSchemaText ?? formatOptionalSchemaText(operation?.requestSchemaJson),
    responseSchemaText: values?.responseSchemaText ?? formatOptionalSchemaText(operation?.responseSchemaJson),
    handlerTsSource: values?.handlerTsSource ?? operation?.handlerTsSource ?? "export default defineApi(async ({ info }) => {\n  return info(\"API ausgefuehrt\", \"Noch keine Logik hinterlegt.\");\n});\n",
    tagsText: values?.tagsText ?? (operation?.tags ?? []).join(", "),
  };
};

type ApiEditorInput = NonNullable<Parameters<typeof buildOperationEditorState>[0]>["values"];

export const createApiDetailViewModel = async (
  userKey: string | undefined,
  groupKey: string | undefined,
  operationId: string,
  input?: ApiEditorInput & { editMode?: boolean },
) => {
  const shellContext = await createShellContext("apis", userKey, groupKey);
  const { activeUser, selectedGroup } = shellContext;
  const [operation, usageData] = await Promise.all([
    findOperationById(operationId),
    loadApiUsageData(activeUser.id, selectedGroup?.id),
  ]);

  if (!operation) {
    return null;
  }

  const operationUsage = buildOperationUsageSummary(usageData).find((entry) => entry.operation.id === operation.id);

  return {
    ...shellContext,
    title: operation.title,
    pageSection: "apis" as const,
    apiDetail: {
      operation,
      isEditable: canEditApis(activeUser) && Boolean(input?.editMode) && operation.status !== "archived",
      isEditMode: Boolean(input?.editMode) && operation.status !== "archived",
      canStartEdit: canEditApis(activeUser) && operation.status !== "archived",
      canSavePublish: canEditApis(activeUser) && Boolean(input?.editMode) && operation.status !== "archived",
      editor: buildOperationEditorState({
        operation,
        ...(input ? { values: input } : {}),
      }),
      usage: operationUsage,
    },
  };
};

export const createApiNewViewModel = async (
  userKey: string | undefined,
  groupKey?: string | undefined,
  input?: ApiEditorInput,
) => {
  const shellContext = await createShellContext("apis", userKey, groupKey);

  return {
    ...shellContext,
    title: "New API",
    pageSection: "apis" as const,
    apiDetail: {
      operation: null,
      isEditable: canEditApis(shellContext.activeUser),
      canSavePublish: canEditApis(shellContext.activeUser),
      editor: buildOperationEditorState(input ? { values: input } : undefined),
      usage: null,
    },
  };
};

export const createAdminUserNewViewModel = async (userKey: string | undefined, groupKey?: string | undefined) => {
  const shellContext = await createShellContext("admin", userKey, groupKey);

  return {
    ...shellContext,
    title: "New User",
    pageSection: "admin" as const,
  };
};

export const createAdminGroupNewViewModel = async (userKey: string | undefined, groupKey?: string | undefined) => {
  const shellContext = await createShellContext("admin", userKey, groupKey);

  return {
    ...shellContext,
    title: "New Group",
    pageSection: "admin" as const,
  };
};

export const createAdminUserDetailViewModel = async (userKey: string | undefined, groupKey: string | undefined, targetUserId: string) => {
  const shellContext = await createShellContext("admin", userKey, groupKey);
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

export const createAdminUserEditViewModel = async (userKey: string | undefined, groupKey: string | undefined, targetUserId: string) => {
  const shellContext = await createShellContext("admin", userKey, groupKey);
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

export const createAdminGroupDetailViewModel = async (userKey: string | undefined, groupKey: string | undefined, groupId: string) => {
  const shellContext = await createShellContext("admin", userKey, groupKey);
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

export const createAdminGroupEditViewModel = async (userKey: string | undefined, groupKey: string | undefined, groupId: string) => {
  const shellContext = await createShellContext("admin", userKey, groupKey);
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

export const createBaseViewModel = async (section: SectionKey, userKey: string | undefined, groupKey?: string | undefined) => {
  const shellContext = await createShellContext(section, userKey, groupKey);
  const { activeUser, users, selectedGroup } = shellContext;

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

  const selectedGroupId = selectedGroup?.id;
  const filterTemplatesByGroup = <T extends { id: string }>(items: T[]): T[] => {
    if (!selectedGroupId) {
      return items;
    }

    const allowedTemplateIds = new Set(
      templateAssignments
        .filter((assignment) => assignment.groupId === selectedGroupId && assignment.status === "active")
        .map((assignment) => assignment.templateId),
    );

    return items.filter((item) => allowedTemplateIds.has(item.id));
  };
  const filteredUserTemplates = filterTemplatesByGroup(userTemplates);
  const filteredTemplates = filterTemplatesByGroup(templates);
  const visibleTemplateIds = new Set(filteredTemplates.map((template) => template.id));
  const filteredVisibleDocuments = selectedGroupId
    ? visibleDocuments.filter((document) => visibleTemplateIds.has(document.templateId))
    : visibleDocuments;
  const filteredUserDocuments = selectedGroupId
    ? userDocuments.filter((document) => visibleTemplateIds.has(document.templateId))
    : userDocuments;
  const filteredUserTasks = selectedGroupId
    ? userTasks.filter((task) => filteredVisibleDocuments.some((document) => document.id === task.documentId))
    : userTasks;
  const filteredTasks = selectedGroupId
    ? tasks.filter((task) => filteredVisibleDocuments.some((document) => document.id === task.documentId))
    : tasks;

  const catalogTemplates = section === "admin" ? filteredTemplates : filteredUserTemplates;
  const catalogTemplateIds = new Set(catalogTemplates.map((template) => template.id));
  const catalogWorkflows = section === "admin" ? workflows : workflowsForTemplates(catalogTemplates, workflows);
  const catalogTemplateAssignments =
    section === "admin"
      ? templateAssignments
      : templateAssignments.filter((assignment) => catalogTemplateIds.has(assignment.templateId));
  const workspaceDocuments = filteredUserDocuments.filter((document) => document.status !== "archived");
  const activeMemberships = memberships.filter((membership) => membership.userId === activeUser.id);
  const executableGroupIds = new Set(
    activeMemberships
      .filter((membership) => membership.rights.execute)
      .map((membership) => membership.groupId),
  );
  const startableTemplateIds = new Set(
    filteredUserTemplates
      .filter((template) => {
        const workflow = workflows.find((item) => item.id === template.workflowTemplateId);
        const isAssignedToExecutableGroup = templateAssignments.some(
          (assignment) =>
            assignment.templateId === template.id
            && assignment.status === "active"
            && executableGroupIds.has(assignment.groupId)
            && (!selectedGroupId || assignment.groupId === selectedGroupId),
        );

        return template.status === "published" && workflow?.status === "published" && isAssignedToExecutableGroup;
      })
      .map((template) => template.id),
  );

  return {
    ...shellContext,
    pageSection: section,
    workspaceSummary: {
      groups: userGroups,
      tasks: filteredUserTasks,
      templates: filteredUserTemplates,
      startableTemplateIds: Array.from(startableTemplateIds),
      preferredTemplateKey: activeUser.preferredTemplateKey,
      preferredGroupId: activeUser.preferredGroupId,
      documents: workspaceDocuments,
      workflows: workflowsForTemplates(filteredUserTemplates, workflows),
    },
    catalog: {
      groups,
      memberships,
      templates: catalogTemplates,
      templateAssignments: catalogTemplateAssignments,
      workflows: catalogWorkflows,
      allWorkflows: workflows,
      documents: filteredVisibleDocuments,
      tasks: filteredTasks,
      assignments,
      auditEvents,
    },
  };
};

export const createAdminOverviewViewModel = async (
  userKey: string | undefined,
  groupKey?: string | undefined,
  selectedUserId?: string | undefined,
) => {
  const baseViewModel = await createBaseViewModel("admin", userKey, groupKey);
  const targetUser = selectedUserId
    ? baseViewModel.users.find((user) => user.id === selectedUserId)
    : baseViewModel.users[0];

  const membershipsForUser = targetUser
    ? baseViewModel.catalog.memberships.filter((membership) => membership.userId === targetUser.id)
    : [];
  const assignedGroupIds = new Set(membershipsForUser.map((membership) => membership.groupId));
  const availableGroups = baseViewModel.catalog.groups.filter((group) => !assignedGroupIds.has(group.id));

  return {
    ...baseViewModel,
    title: "Admin",
    selectedAdminUserId: targetUser?.id,
    adminOverview: {
      selectedUser: targetUser,
      memberships: membershipsForUser.map((membership) => ({
        membership,
        group: baseViewModel.catalog.groups.find((group) => group.id === membership.groupId) ?? null,
      })),
      availableGroups,
    },
  };
};

export const createGroupsViewModel = async (
  userKey: string | undefined,
  groupKey?: string | undefined,
) => {
  const baseViewModel = await createBaseViewModel("groups", userKey, groupKey);
  const visibleGroups = baseViewModel.permissions.canViewAdmin || baseViewModel.permissions.canViewAllFunctionalTabs
    ? baseViewModel.catalog.groups
    : baseViewModel.workspaceSummary.groups;
  const effectiveGroup = baseViewModel.selectedGroup ?? visibleGroups[0];
  const membershipsForGroup = effectiveGroup
    ? baseViewModel.catalog.memberships.filter((membership) => membership.groupId === effectiveGroup.id)
    : [];
  const assignedUserIds = new Set(membershipsForGroup.map((membership) => membership.userId));
  const availableUsers = baseViewModel.users.filter((user) => !assignedUserIds.has(user.id));

  return {
    ...baseViewModel,
    title: "Gruppen",
    groupsView: {
      visibleGroups,
      selectedGroup: effectiveGroup,
      memberships: membershipsForGroup.map((membership) => ({
        membership,
        user: baseViewModel.users.find((user) => user.id === membership.userId) ?? null,
      })),
      availableUsers,
    },
  };
};

export const createDocumentDetailViewModel = async (
  userKey: string | undefined,
  groupKey: string | undefined,
  documentId: string,
  input?: {
    formRuntimeFieldValues?: Record<string, string | undefined>;
    selectedEditorUserIds?: string[];
  },
) => {
  const shellContext = await createShellContext("documents", userKey, groupKey);
  const { activeUser, users } = shellContext;

  const document = await findDocumentDetailVisibleToUser(documentId, activeUser.id);

  if (!document) {
    return null;
  }

  const [assignments, tasks, attachments, auditEvents, attachmentUploadState, editState, journalWriteState, assignState, assignableEditors, submitState, approveState, rejectState, reassignState, archiveState, workflowDetail, typedRecordSummary] = await Promise.all([
    listAssignmentsForDocument(document.id),
    listTasksForDocument(document.id),
    listAttachmentsForDocument(document.id),
    listAuditEventsForDocument(document.id),
    getAttachmentUploadStateForUser(document.id, activeUser.id),
    getDocumentEditStateForUser(document.id, activeUser.id),
    getDocumentJournalWriteStateForUser(document.id, activeUser.id),
    getDocumentAssignStateForUser(document.id, activeUser.id),
    listDocumentAssignableEditorsForUser(document.id, activeUser.id),
    getDocumentSubmitStateForUser(document.id, activeUser.id),
    getDocumentApproveStateForUser(document.id, activeUser.id),
    getDocumentRejectStateForUser(document.id, activeUser.id),
    getDocumentReassignStateForUser(document.id, activeUser.id),
    getDocumentArchiveStateForUser(document.id, activeUser.id),
    findWorkflowTemplateById(document.workflowTemplateId),
    findTypedRecordSummary(document.id, document.formType),
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
  let formRuntimeReference:
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
        qualificationPaging?: {
          currentPage: number;
          totalPages: number;
          currentPageTitle: string;
          visibleSectionTitles: string[];
          previousPage?: number;
          nextPage?: number;
        };
        qualificationEvaluation?: {
          evaluationStatus: string;
          scoreValue: number;
          passed: boolean;
          evaluatedAt?: string;
        };
        submitRequiredFieldNames: string[];
        currentStatusRequiredFieldNames: string[];
        missingCurrentStatusRequiredFieldNames: string[];
        missingCurrentStatusRequiredFieldLabels: string[];
        bootstrapError?: string;
        parsedForm?: FormRuntimeDefinition;
        parseError?: string;
      }
    | undefined;

  if (isFormRuntimeReferenceTemplate(document.templateKey)) {
    const formRuntimeEditState = getReferenceFormRuntimeEditState({
      documentStatus: document.status,
      canPrepareDraft: document.status === "draft" && assignState.isAvailable,
      baseEditState: editState,
    });
    let parsedFormForRuntime: FormRuntimeDefinition | undefined;
    let formRuntimeFieldValues = {
      ...mapDocumentDataToFormRuntimeValues(document.templateKey, document.documentDataJson, {
        currentUserId: activeUser.id,
      }),
      ...Object.fromEntries(
        Object.entries(input?.formRuntimeFieldValues ?? {}).map(([key, value]) => [key, value?.toString() ?? ""]),
      ),
    };

    try {
      parsedFormForRuntime = parseFormRuntimeSource(document.formTemplateMdxBody);
    } catch {
      parsedFormForRuntime = undefined;
    }

    const bootstrapActions = (parsedFormForRuntime?.actions ?? []).filter((action) => {
      if (action.controlType !== "lookup") {
        return false;
      }

      if (!action.ref || !Array.isArray(action.args) || action.args.length === 0) {
        return false;
      }

      return action.args.some((fieldName) => {
        const control = parsedFormForRuntime?.controls.find((entry) => entry.name === fieldName);
        return control?.controlType === "select";
      });
    });
    let bootstrapError: string | undefined;

    for (const action of bootstrapActions) {
      try {
        const bootstrapResult = await executePublishedOperationByKey({
          operationKey: action.ref!,
          executionInput: {
            action,
            fieldValues: formRuntimeFieldValues,
            documentId: document.id,
            userId: activeUser.id,
            templateKey: document.templateKey,
          },
        });
        formRuntimeFieldValues = bootstrapResult.fieldValues;
      } catch (error) {
        bootstrapError = error instanceof Error ? error.message : "Auftragsdaten konnten nicht vorbereitet werden.";
        break;
      }
    }
    const formRuntimeFieldUi = buildReferenceFormRuntimeFieldUi({
      templateKey: document.templateKey,
      canEdit: formRuntimeEditState.isAvailable,
      documentStatus: document.status,
      fieldValues: formRuntimeFieldValues,
      availableUsers: users,
      ...(parsedFormForRuntime ? { parsedForm: parsedFormForRuntime } : {}),
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
        const field = formRuntimeFieldUi[fieldName];

        if (field) {
          field.isEditable = false;
          field.isReadOnly = true;
          field.state = "readonly";
        }
      }
    }
    const formRuntimeActionUi = buildReferenceFormRuntimeActionUi({
      ...(parsedFormForRuntime ? { parsedForm: parsedFormForRuntime } : {}),
      canEdit: formRuntimeEditState.isAvailable,
      documentStatus: document.status,
    });
    const linkedProductionBatchReference = await findVisibleProductionBatchReferenceByMaterial({
      userId: activeUser.id,
      activeUserKey: activeUser.key,
      materialName: formRuntimeFieldValues.material ?? "",
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
    const qualificationPaging = document.templateKey === "qualification-record"
      ? (() => {
          const currentPage = normalizeQualificationPageIndex(document.documentDataJson.qualification_participant_states
            && typeof document.documentDataJson.qualification_participant_states === "object"
            && !Array.isArray(document.documentDataJson.qualification_participant_states)
            ? ((document.documentDataJson.qualification_participant_states as Record<string, unknown>)[activeUser.id] as Record<string, unknown> | undefined)?.currentPage
            : undefined);
          const page = getQualificationPageDefinition(currentPage);

          return {
            currentPage,
            totalPages: qualificationPageCount,
            currentPageTitle: page.title,
            visibleSectionTitles: page.sectionTitles,
            ...(currentPage > 1 ? { previousPage: currentPage - 1 } : {}),
            ...(currentPage < qualificationPageCount ? { nextPage: currentPage + 1 } : {}),
          };
        })()
      : undefined;
    const qualificationEvaluation = document.templateKey === "qualification-record"
      ? evaluateQualificationDocumentData(document.documentDataJson)
      : undefined;
    const currentStatusRequiredFieldNames = getReferenceFormRuntimeRequiredFieldNamesForStatus({
      templateKey: document.templateKey,
      documentStatus: document.status,
      ...(parsedFormForRuntime ? { parsedForm: parsedFormForRuntime } : {}),
    });
    const missingCurrentStatusRequiredFieldNames = currentStatusRequiredFieldNames.filter((fieldName) => {
      const value = formRuntimeFieldValues[fieldName];
      return typeof value !== "string" || value.trim().length === 0;
    });
    const missingCurrentStatusRequiredFieldLabels = missingCurrentStatusRequiredFieldNames.map((fieldName) => {
      const control = parsedFormForRuntime?.controls.find((entry) => entry.name === fieldName);
      return control?.label ?? fieldName;
    });

    const currentFormRuntimeReference: NonNullable<typeof formRuntimeReference> = {
      sourceFilePath: "documents.template_mdx_body",
      sourceText: document.formTemplateMdxBody,
      fieldValues: formRuntimeFieldValues,
      fieldUi: formRuntimeFieldUi,
      actionUi: formRuntimeActionUi,
      hiddenFieldNames: getReferenceFormRuntimeHiddenFieldNames(document.templateKey),
      editState: formRuntimeEditState,
      masterDataSections: buildReferenceFormRuntimeMasterDataSections({
        templateKey: document.templateKey,
        fieldValues: formRuntimeFieldValues,
      }),
      linkedFormReferences: linkedProductionBatchReference ? [linkedProductionBatchReference] : [],
      ...(participantProgress ? { participantProgress } : {}),
      ...(qualificationPaging ? { qualificationPaging } : {}),
      ...(qualificationEvaluation ? { qualificationEvaluation } : {}),
      submitRequiredFieldNames: getReferenceFormRuntimeSubmitRequiredFieldNames(document.templateKey),
      currentStatusRequiredFieldNames,
      missingCurrentStatusRequiredFieldNames,
      missingCurrentStatusRequiredFieldLabels,
      ...(bootstrapError ? { bootstrapError } : {}),
    };

    if (parsedFormForRuntime) {
      currentFormRuntimeReference.parsedForm = parsedFormForRuntime;
    } else {
      try {
        currentFormRuntimeReference.parsedForm = parseFormRuntimeSource(document.formTemplateMdxBody);
      } catch (error: unknown) {
        currentFormRuntimeReference.parseError = error instanceof Error ? error.message : "Die neue Formularquelle konnte nicht gelesen werden.";
      }
    }

    formRuntimeReference = currentFormRuntimeReference;
  }

  return {
    ...shellContext,
    title: document.title,
    pageSection: "documents" as const,
    documentDetail: {
      document,
      typedRecordSummary,
      formDefinition,
      templateFeatures,
      ...(formRuntimeReference ? { formRuntimeReference } : {}),
      editableFields: formDefinition.fields.filter((field) => field.isSavable && editState.isAvailable),
      journals: templateFeatures.journal.enabled
        ? (
          formDefinition.journals.length > 0
            ? formDefinition.journals.map((journal) => ({
              ...journal,
              isEditable: journal.isEditable && journalWriteState.isAvailable,
            }))
            : isFormRuntimeReferenceTemplate(document.templateKey)
              ? [buildReferenceFormRuntimeJournalDefinition({
                documentData: document.documentDataJson,
                isEditable: journalWriteState.isAvailable,
              })]
              : []
        )
        : [],
      editState,
      attachmentUploadState,
      assignState,
      assignableEditors: assignableEditors.map((editor) => ({
        ...editor,
        isSelected: Array.isArray(input?.selectedEditorUserIds)
          ? input.selectedEditorUserIds.includes(editor.userId)
          : assignments.some((assignment) => assignment.active && assignment.role === "editor" && assignment.userId === editor.userId),
      })),
      submitState,
      approveState,
      rejectState,
      reassignState,
      archiveState,
      assignments,
      tasks,
      attachments,
      auditEvents,
    },
    users,
  };
};
