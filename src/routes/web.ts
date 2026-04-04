import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyError } from "fastify";
import ejs from "ejs";
import type { Document, FormTemplate, User } from "../types/domain.js";
import {
  createApiCatalogViewModel,
  createAdminGroupDetailViewModel,
  createAdminGroupEditViewModel,
  createAdminGroupNewViewModel,
  createAdminUserDetailViewModel,
  createAdminUserEditViewModel,
  createAdminUserNewViewModel,
  createBaseViewModel,
  createDocumentDetailViewModel,
  createNextFormPreviewViewModel,
  createTemplateDetailViewModel,
  createTemplateNewViewModel,
  createWorkflowDetailViewModel,
  createWorkflowNewViewModel,
} from "../services/app-context.js";
import { findAttachmentAssetVisibleToUser } from "../modules/attachments/read.js";
import { parseSingleAttachmentUpload, uploadAttachmentForUser } from "../modules/attachments/upload.js";
import { createGroup } from "../modules/groups/create.js";
import { updateGroup } from "../modules/groups/update.js";
import { createMembership } from "../modules/memberships/create.js";
import { removeMembership } from "../modules/memberships/remove.js";
import { approveDocumentForUser } from "../modules/documents/approve.js";
import { archiveDocumentForUser } from "../modules/documents/archive.js";
import { runDocumentNextFormActionForUser, saveDocumentNextFormValuesForUser } from "../modules/documents/next-form.js";
import { rejectDocumentForUser } from "../modules/documents/reject.js";
import { saveDocumentValuesForUser } from "../modules/documents/save.js";
import { startDocumentForUser } from "../modules/documents/start.js";
import { submitDocumentForUser } from "../modules/documents/submit.js";
import { addJournalEntryForUser } from "../modules/journal/add.js";
import { getActiveUser } from "../services/app-context.js";
import { serializeCsv } from "../modules/data-exchange/csv.js";
import { importReferenceEntitiesFromCsv } from "../modules/entities/import.js";
import { findReferenceEntityByKey, listReferenceEntities } from "../modules/entities/read.js";
import { findTemplateFormDataRecordVisibleToUser, listTemplateFormDataRecordsVisibleToUser } from "../modules/form-data/read.js";
import { createTemplateDraft } from "../modules/templates/create.js";
import { applyNextFormApiBindings } from "../modules/next-form/api-bindings.js";
import { createTemplateAssignment, removeTemplateAssignment } from "../modules/templates/assign.js";
import {
  archiveReferenceTemplateFamily,
  publishReferenceTemplateVersion,
  saveReferenceTemplateDraft,
  unpublishReferenceTemplateVersion,
} from "../modules/templates/lifecycle.js";
import { createUser } from "../modules/users/create.js";
import { listUsers } from "../modules/users/read.js";
import { updateUser } from "../modules/users/update.js";
import { createWorkflowDraft } from "../modules/workflows/create.js";
import {
  archiveWorkflowVersion,
  publishWorkflowVersion,
  unpublishWorkflowVersion,
} from "../modules/workflows/lifecycle.js";
import { buildWorkflowSourceTextFromTableInput, saveWorkflowDraftSource } from "../modules/workflows/source.js";

type UserQuery = {
  user?: string;
  q?: string;
  fields?: string;
  template?: string;
  workflow?: string;
  status?: string;
  showArchived?: string;
  startError?: string;
  saveError?: string;
  saveStatus?: string;
  journalError?: string;
  journalStatus?: string;
  submitError?: string;
  submitStatus?: string;
  approveError?: string;
  approveStatus?: string;
  rejectError?: string;
  rejectStatus?: string;
  archiveError?: string;
  archiveStatus?: string;
  nextFormError?: string;
  nextFormStatus?: string;
  uploadError?: string;
  uploadStatus?: string;
  dialogType?: "error" | "info";
  dialogTitle?: string;
  dialogMessage?: string;
  intent?: string;
  actionName?: string;
};

const query = (request: FastifyRequest): UserQuery => request.query as UserQuery;

const queryValue = (request: FastifyRequest): string | undefined => query(request).user;
const searchValue = (request: FastifyRequest): string | undefined => query(request).q;
const statusFilterValue = (request: FastifyRequest): string | undefined => query(request).status;
const showArchivedValue = (request: FastifyRequest): string | undefined => query(request).showArchived;
const startErrorValue = (request: FastifyRequest): string | undefined => query(request).startError;
const saveErrorValue = (request: FastifyRequest): string | undefined => query(request).saveError;
const saveStatusValue = (request: FastifyRequest): string | undefined => query(request).saveStatus;
const journalErrorValue = (request: FastifyRequest): string | undefined => query(request).journalError;
const journalStatusValue = (request: FastifyRequest): string | undefined => query(request).journalStatus;
const submitErrorValue = (request: FastifyRequest): string | undefined => query(request).submitError;
const submitStatusValue = (request: FastifyRequest): string | undefined => query(request).submitStatus;
const approveErrorValue = (request: FastifyRequest): string | undefined => query(request).approveError;
const approveStatusValue = (request: FastifyRequest): string | undefined => query(request).approveStatus;
const rejectErrorValue = (request: FastifyRequest): string | undefined => query(request).rejectError;
const rejectStatusValue = (request: FastifyRequest): string | undefined => query(request).rejectStatus;
const archiveErrorValue = (request: FastifyRequest): string | undefined => query(request).archiveError;
const archiveStatusValue = (request: FastifyRequest): string | undefined => query(request).archiveStatus;
const nextFormErrorValue = (request: FastifyRequest): string | undefined => query(request).nextFormError;
const nextFormStatusValue = (request: FastifyRequest): string | undefined => query(request).nextFormStatus;
const uploadErrorValue = (request: FastifyRequest): string | undefined => query(request).uploadError;
const uploadStatusValue = (request: FastifyRequest): string | undefined => query(request).uploadStatus;
const dialogTypeValue = (request: FastifyRequest): UserQuery["dialogType"] => query(request).dialogType;
const dialogTitleValue = (request: FastifyRequest): string | undefined => query(request).dialogTitle;
const dialogMessageValue = (request: FastifyRequest): string | undefined => query(request).dialogMessage;

const dialogState = (request: FastifyRequest) => {
  const type = dialogTypeValue(request);
  const title = dialogTitleValue(request);
  const message = dialogMessageValue(request);

  if (!type || !title || !message) {
    return undefined;
  }

  return { type, title, message };
};

const viewsRoot = path.join(process.cwd(), "src", "views");

const isHtmxRequest = (request: FastifyRequest): boolean => request.headers["hx-request"] === "true";

type DocumentFeedbackState = {
  saveError: string | undefined;
  saveStatus: string | undefined;
  journalError: string | undefined;
  journalStatus: string | undefined;
  submitError: string | undefined;
  submitStatus: string | undefined;
  approveError: string | undefined;
  approveStatus: string | undefined;
  rejectError: string | undefined;
  rejectStatus: string | undefined;
  archiveError: string | undefined;
  archiveStatus: string | undefined;
  nextFormError: string | undefined;
  nextFormStatus: string | undefined;
  uploadError: string | undefined;
  uploadStatus: string | undefined;
};

type DocumentRenderModel = Awaited<ReturnType<typeof createDocumentDetailViewModel>>;

const buildDocumentFeedbackStateFromRequest = (request: FastifyRequest): DocumentFeedbackState => ({
  saveError: saveErrorValue(request),
  saveStatus: saveStatusValue(request),
  journalError: journalErrorValue(request),
  journalStatus: journalStatusValue(request),
  submitError: submitErrorValue(request),
  submitStatus: submitStatusValue(request),
  approveError: approveErrorValue(request),
  approveStatus: approveStatusValue(request),
  rejectError: rejectErrorValue(request),
  rejectStatus: rejectStatusValue(request),
  archiveError: archiveErrorValue(request),
  archiveStatus: archiveStatusValue(request),
  nextFormError: nextFormErrorValue(request),
  nextFormStatus: nextFormStatusValue(request),
  uploadError: uploadErrorValue(request),
  uploadStatus: uploadStatusValue(request),
});

const renderEjsTemplate = async (templatePath: string, data: Record<string, unknown>): Promise<string> => {
  return ejs.renderFile(path.join(viewsRoot, templatePath), data, { async: true }) as Promise<string>;
};

const buildDocumentFragmentLocals = (viewModel: NonNullable<DocumentRenderModel> & DocumentFeedbackState) => {
  const assignmentSummary = viewModel.documentDetail.assignments
    .slice(0, 2)
    .map((assignment) => {
      const user = viewModel.users.find((entry) => entry.id === assignment.userId);
      return `${user?.displayName ?? assignment.userId} (${assignment.role})`;
    })
    .join(", ");
  const activeAssignments = viewModel.documentDetail.assignments.filter((assignment) => assignment.active);
  const activeApproverNames = viewModel.documentDetail.assignments
    .filter((assignment) => assignment.active && assignment.role === "approver")
    .map((assignment) => viewModel.users.find((entry) => entry.id === assignment.userId)?.displayName ?? assignment.userId);
  const workflowStepsForHeader = ["created", "submitted", "approved"];
  let nextStepLabel = "Kein weiterer direkter Schritt fuer den aktuellen User.";

  if (viewModel.documentDetail.submitState.isAvailable) {
    nextStepLabel = "Naechster Schritt: Submit";
  }

  if (viewModel.documentDetail.approveState.isAvailable || viewModel.documentDetail.rejectState.isAvailable) {
    nextStepLabel = "Naechster Schritt: Approve oder Reject";
  }

  if (
    !viewModel.documentDetail.approveState.isAvailable &&
    !viewModel.documentDetail.rejectState.isAvailable &&
    viewModel.documentDetail.document.status === "submitted" &&
    activeApproverNames.length > 0
  ) {
    nextStepLabel = `Naechster Schritt: Approve oder Reject durch ${activeApproverNames.join(", ")}`;
  }

  return {
    ...viewModel,
    assignmentSummary,
    activeAssignments,
    activeApproverNames,
    workflowStepsForHeader,
    nextStepLabel,
    latestAuditEvent: viewModel.documentDetail.auditEvents.at(-1),
  };
};

const renderFragmentShell = (
  tagName: "section" | "div",
  fragmentId: string,
  fragmentName: string,
  html: string,
  options?: { oob?: boolean },
): string => {
  const oobAttribute = options?.oob ? ` hx-swap-oob="outerHTML"` : "";
  return `<${tagName} id="${fragmentId}" data-fragment="${fragmentName}"${oobAttribute}>${html}</${tagName}>`;
};

const renderDocumentHeaderFragment = async (
  viewModel: NonNullable<DocumentRenderModel> & DocumentFeedbackState,
  options?: { oob?: boolean },
): Promise<string> => {
  const locals = buildDocumentFragmentLocals(viewModel);
  const headerHtml = await renderEjsTemplate("partials/document-detail/document-header.ejs", {
    documentDetail: viewModel.documentDetail,
    activeUser: viewModel.activeUser,
    users: viewModel.users,
    assignmentSummary: locals.assignmentSummary,
    activeAssignments: locals.activeAssignments,
    workflowStepsForHeader: locals.workflowStepsForHeader,
    nextStepLabel: locals.nextStepLabel,
  });

  return renderFragmentShell("section", "document-header-fragment", "document-header", headerHtml, options);
};

const renderDocumentHistoryFragment = async (
  viewModel: NonNullable<DocumentRenderModel> & DocumentFeedbackState,
  options?: { oob?: boolean },
): Promise<string> => {
  const locals = buildDocumentFragmentLocals(viewModel);
  const historyHtml = await renderEjsTemplate("partials/document-detail/history-panel.ejs", {
    documentDetail: viewModel.documentDetail,
    users: viewModel.users,
    latestAuditEvent: locals.latestAuditEvent,
  });

  return renderFragmentShell("section", "document-history-fragment", "document-history", historyHtml, options);
};

const renderDocumentWorkflowZoneFragment = async (
  viewModel: NonNullable<DocumentRenderModel> & DocumentFeedbackState,
  options?: { oob?: boolean },
): Promise<string> => {
  const locals = buildDocumentFragmentLocals(viewModel);
  const workflowZoneHtml = await renderEjsTemplate("partials/document-detail/next-form-workflow-zone.ejs", {
    documentDetail: viewModel.documentDetail,
    activeUser: viewModel.activeUser,
    nextFormStatus: viewModel.nextFormStatus,
    nextFormError: viewModel.nextFormError,
    submitStatus: viewModel.submitStatus,
    submitError: viewModel.submitError,
    approveStatus: viewModel.approveStatus,
    approveError: viewModel.approveError,
    rejectStatus: viewModel.rejectStatus,
    rejectError: viewModel.rejectError,
    archiveStatus: viewModel.archiveStatus,
    archiveError: viewModel.archiveError,
    activeApproverNames: locals.activeApproverNames,
  });

  return renderFragmentShell("div", "document-workflow-zone-fragment", "document-workflow-zone", workflowZoneHtml, options);
};

const renderDocumentWorkspaceFragment = async (
  viewModel: NonNullable<DocumentRenderModel> & DocumentFeedbackState,
  options?: { includeHeaderOob?: boolean; includeHistoryOob?: boolean },
): Promise<string> => {
  const [workflowZoneHtml, formBodyHtml, headerFragment, historyFragment] = await Promise.all([
    renderDocumentWorkflowZoneFragment(viewModel),
    renderEjsTemplate("partials/document-detail/next-form-form-body.ejs", {
      documentDetail: viewModel.documentDetail,
      activeUser: viewModel.activeUser,
    }),
    options?.includeHeaderOob ? renderDocumentHeaderFragment(viewModel, { oob: true }) : Promise.resolve(""),
    options?.includeHistoryOob ? renderDocumentHistoryFragment(viewModel, { oob: true }) : Promise.resolve(""),
  ]);

  const workspaceHtml = await renderEjsTemplate("partials/document-detail/next-form-workspace.ejs", {
    documentDetail: viewModel.documentDetail,
    activeUser: viewModel.activeUser,
    users: viewModel.users,
    nextFormStatus: viewModel.nextFormStatus,
    nextFormError: viewModel.nextFormError,
    submitStatus: viewModel.submitStatus,
    submitError: viewModel.submitError,
    approveStatus: viewModel.approveStatus,
    approveError: viewModel.approveError,
    rejectStatus: viewModel.rejectStatus,
    rejectError: viewModel.rejectError,
    archiveStatus: viewModel.archiveStatus,
    archiveError: viewModel.archiveError,
    workflowZoneHtml,
    formBodyHtml,
  });

  return [
    renderFragmentShell("section", "document-workspace-fragment", "document-workspace", workspaceHtml),
    headerFragment,
    historyFragment,
  ].join("");
};

const renderDocumentFormBodyFragment = async (
  viewModel: NonNullable<DocumentRenderModel> & DocumentFeedbackState,
  options?: { includeWorkflowZoneOob?: boolean; includeHeaderOob?: boolean; includeHistoryOob?: boolean },
): Promise<string> => {
  const [formBodyHtml, workflowZoneFragment, headerFragment, historyFragment] = await Promise.all([
    renderEjsTemplate("partials/document-detail/next-form-form-body.ejs", {
      documentDetail: viewModel.documentDetail,
      activeUser: viewModel.activeUser,
    }),
    options?.includeWorkflowZoneOob ? renderDocumentWorkflowZoneFragment(viewModel, { oob: true }) : Promise.resolve(""),
    options?.includeHeaderOob ? renderDocumentHeaderFragment(viewModel, { oob: true }) : Promise.resolve(""),
    options?.includeHistoryOob ? renderDocumentHistoryFragment(viewModel, { oob: true }) : Promise.resolve(""),
  ]);

  return [
    renderFragmentShell("div", "document-form-body-fragment", "document-form-body", formBodyHtml),
    workflowZoneFragment,
    headerFragment,
    historyFragment,
  ].join("");
};

const renderDocumentJournalFragment = async (
  viewModel: NonNullable<DocumentRenderModel> & DocumentFeedbackState,
  options?: { includeHeaderOob?: boolean; includeHistoryOob?: boolean },
): Promise<string> => {
  const journalHtml = await renderEjsTemplate("partials/document-detail/journal-panel.ejs", {
    documentDetail: viewModel.documentDetail,
    activeUser: viewModel.activeUser,
    journalStatus: viewModel.journalStatus,
    journalError: viewModel.journalError,
  });

  const [headerFragment, historyFragment] = await Promise.all([
    options?.includeHeaderOob ? renderDocumentHeaderFragment(viewModel, { oob: true }) : Promise.resolve(""),
    options?.includeHistoryOob ? renderDocumentHistoryFragment(viewModel, { oob: true }) : Promise.resolve(""),
  ]);

  return [
    renderFragmentShell("section", "document-journal-fragment", "document-journal", journalHtml),
    headerFragment,
    historyFragment,
  ].join("");
};

const renderDocumentAttachmentsFragment = async (
  viewModel: NonNullable<DocumentRenderModel> & DocumentFeedbackState,
  options?: { includeHistoryOob?: boolean },
): Promise<string> => {
  const attachmentsHtml = await renderEjsTemplate("partials/document-detail/attachments-panel.ejs", {
    documentDetail: viewModel.documentDetail,
    activeUser: viewModel.activeUser,
    users: viewModel.users,
    uploadStatus: viewModel.uploadStatus,
    uploadError: viewModel.uploadError,
  });

  const historyFragment = options?.includeHistoryOob ? await renderDocumentHistoryFragment(viewModel, { oob: true }) : "";

  return [
    renderFragmentShell("section", "document-attachments-fragment", "document-attachments", attachmentsHtml),
    historyFragment,
  ].join("");
};

const withDialog = async (request: FastifyRequest, input: Record<string, unknown>) => {
  const appDialog = dialogState(request);
  return appDialog ? { ...input, appDialog } : input;
};

const normalizeSearchTerm = (value: string | undefined): string => value?.trim() ?? "";
const parseFieldSelection = (request: FastifyRequest): string[] | undefined => {
  const rawValue = query(request).fields?.trim();

  if (!rawValue) {
    return undefined;
  }

  const fields = rawValue
    .split(",")
    .map((field) => field.trim())
    .filter((field) => field.length > 0);

  return fields.length > 0 ? fields : undefined;
};

const toEntityType = (value: string): "customer" | "product" | null => {
  if (value === "customers") {
    return "customer";
  }

  if (value === "products") {
    return "product";
  }

  return null;
};

const serializeFormDataExportValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
};

const collectIndexedWorkflowRowKeys = (body: Record<string, unknown>, prefix: string) => {
  return Object.keys(body)
    .filter((key) => key.startsWith(`${prefix}__`))
    .map((key) => {
      const index = Number(key.slice(prefix.length + 2));
      return Number.isFinite(index) ? index : -1;
    })
    .filter((index) => index >= 0)
    .sort((left, right) => left - right);
};

const resolveWorkflowSourceFromRequestBody = (body: Record<string, unknown>) => {
  const sourceMode = typeof body.sourceMode === "string" ? body.sourceMode : "table";

  if (sourceMode === "json") {
    return typeof body.source === "string" ? body.source : "";
  }

  return buildWorkflowSourceTextFromTableInput({
    baselineSourceText: typeof body.source === "string" ? body.source : "",
    initialStatus: typeof body.initialStatus === "string" ? body.initialStatus : "",
    statusesText: typeof body.statusesText === "string" ? body.statusesText : "",
    rows: collectIndexedWorkflowRowKeys(body, "actionName").map((index) => ({
      actionName: typeof body[`actionName__${index}`] === "string" ? String(body[`actionName__${index}`]) : "",
      fromText: typeof body[`actionFrom__${index}`] === "string" ? String(body[`actionFrom__${index}`]) : "",
      to: typeof body[`actionTo__${index}`] === "string" ? String(body[`actionTo__${index}`]) : "",
      rolesText: typeof body[`actionRoles__${index}`] === "string" ? String(body[`actionRoles__${index}`]) : "",
      mode: typeof body[`actionMode__${index}`] === "string" ? String(body[`actionMode__${index}`]) : "",
      api: typeof body[`actionApi__${index}`] === "string" ? String(body[`actionApi__${index}`]) : "",
      condition: typeof body[`actionCondition__${index}`] === "string" ? String(body[`actionCondition__${index}`]) : "",
    })),
  });
};

const normalizeShowArchived = (value: string | undefined): boolean => {
  return value === "1" || value === "true" || value === "yes";
};

const filterDocumentsViewModel = (input: {
  documents: Document[];
  templates: FormTemplate[];
  workflows: Array<{ id: string; key?: string; name?: string }>;
  users: User[];
  searchTerm: string;
  statusFilter: string | undefined;
  showArchived: boolean;
}) => {
  const templateById = new Map(input.templates.map((template) => [template.id, template]));
  const workflowById = new Map(input.workflows.map((workflow) => [workflow.id, workflow]));
  const normalizedSearch = input.searchTerm.toLowerCase();
  const validStatuses = Array.from(new Set(input.documents.map((document) => document.status))).sort();
  const normalizedStatusFilter = input.statusFilter && validStatuses.includes(input.statusFilter) ? input.statusFilter : "";
  const filteredDocuments = input.documents.filter((document) => {
    if (!input.showArchived && document.status === "archived") {
      return false;
    }

    if (normalizedStatusFilter && document.status !== normalizedStatusFilter) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const template = templateById.get(document.templateId);
    const workflow = template ? workflowById.get(template.workflowTemplateId) : undefined;
    const assignedUsers = input.users
      .filter((user) => document.assignedUserIds.includes(user.id))
      .map((user) => user.displayName)
      .join(" ");
    const haystack = [
      document.title,
      template?.name ?? "",
      template?.key ?? "",
      workflow?.name ?? "",
      workflow?.key ?? "",
      assignedUsers,
      document.status,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  return {
    documents: filteredDocuments,
    availableStatuses: validStatuses,
    filterState: {
      q: input.searchTerm,
      status: normalizedStatusFilter,
      showArchived: input.showArchived,
    },
    summary: {
      totalVisible: input.documents.length,
      activeCount: input.documents.filter((document) => document.status !== "archived").length,
      archivedCount: input.documents.filter((document) => document.status === "archived").length,
      filteredCount: filteredDocuments.length,
    },
  };
};

const buildDialogRedirect = (targetUrl: string, input: { type?: "error" | "info"; title: string; message: string }) => {
  const nextUrl = new URL(targetUrl, "http://localhost");
  nextUrl.searchParams.set("dialogType", input.type ?? "error");
  nextUrl.searchParams.set("dialogTitle", input.title);
  nextUrl.searchParams.set("dialogMessage", input.message);
  return `${nextUrl.pathname}${nextUrl.search}`;
};

const renderPage = async (
  request: FastifyRequest,
  reply: FastifyReply,
  section: "workspace" | "templates" | "workflows" | "documents" | "apis" | "admin",
  page: string,
  title: string,
) => {
  return reply.view(`pages/${page}.ejs`, await withDialog(request, {
    title,
    ...(await createBaseViewModel(section, queryValue(request))),
  }));
};

export const registerWebRoutes = async (app: FastifyInstance): Promise<void> => {
  app.setErrorHandler(async (error: FastifyError, request, reply) => {
    const referer = request.headers.referer;
    const acceptHeader = request.headers.accept;
    const acceptsHtml = typeof acceptHeader === "string" && acceptHeader.includes("text/html");
    const shouldRedirectToDialog = Boolean(referer) && (request.method !== "GET" || acceptsHtml);

    if (shouldRedirectToDialog && referer && !reply.sent) {
      const dialogMessage =
        error.code === "FST_ERR_CTP_BODY_TOO_LARGE"
          ? "Die hochgeladene Datei oder Anfrage ist zu gross. In diesem MVP-Schritt sind maximal 3 MB pro Datei erlaubt."
          : "Die Anfrage konnte nicht verarbeitet werden. Bitte pruefe deine Eingaben und versuche es erneut.";

      return reply.redirect(
        buildDialogRedirect(referer, {
          title: "Aktion fehlgeschlagen",
          message: dialogMessage,
        }),
        303,
      );
    }

    const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
    return reply.code(statusCode).send({
      statusCode,
      code: error.code ?? "APP_ERROR",
      error: error.name,
      message: error.message,
    });
  });

  app.get("/", async (request, reply) => {
    const user = queryValue(request);
    const suffix = user ? `?user=${encodeURIComponent(user)}` : "";
    return reply.redirect(`/workspace${suffix}`);
  });

  app.get("/health", async () => ({
    ok: true,
  }));

  app.get("/next-form-preview/craftsman-order", async (request, reply) => {
    return reply.view(
      "pages/next-form-preview.ejs",
      await withDialog(request, await createNextFormPreviewViewModel({ userKey: queryValue(request) })),
    );
  });

  app.post<{
    Body: {
      source?: string;
      intent?: string;
      actionName?: string;
      order_number?: string;
      customer?: string;
      service_location?: string;
      customer_master_id?: string;
      customer_master_status?: string;
      customer_order_status?: string;
      customer_order_created_at?: string;
      work_description?: string;
      material?: string;
      product_master_id?: string;
      product_master_type?: string;
      product_master_status?: string;
      work_signature?: string;
      work_signature_at?: string;
    };
  }>("/next-form-preview/craftsman-order", async (request, reply) => {
    return reply.view(
      "pages/next-form-preview.ejs",
      await withDialog(
        request,
        await createNextFormPreviewViewModel({
          userKey: queryValue(request),
          sourceText: request.body.source,
          intent: request.body.intent,
          actionName: request.body.actionName,
          fieldValues: {
            order_number: request.body.order_number,
            customer: request.body.customer,
            service_location: request.body.service_location,
            customer_master_id: request.body.customer_master_id,
            customer_master_status: request.body.customer_master_status,
            customer_order_status: request.body.customer_order_status,
            customer_order_created_at: request.body.customer_order_created_at,
            work_description: request.body.work_description,
            material: request.body.material,
            product_master_id: request.body.product_master_id,
            product_master_type: request.body.product_master_type,
            product_master_status: request.body.product_master_status,
            work_signature: request.body.work_signature,
            work_signature_at: request.body.work_signature_at,
          },
        }),
      ),
    );
  });

  app.get("/workspace", async (request, reply) => {
    return renderPage(request, reply, "workspace", "workspace", "My Workspace");
  });

  app.get("/templates", async (request, reply) => {
    return renderPage(request, reply, "templates", "templates", "Templates");
  });

  app.get("/templates/new", async (request, reply) => {
    return reply.view("pages/template-new.ejs", await withDialog(request, await createTemplateNewViewModel(queryValue(request))));
  });

  app.post<{ Body: { name?: string; key?: string; description?: string; workflowTemplateId?: string } }>("/templates/new", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);

    try {
      const result = await createTemplateDraft({
        name: request.body?.name ?? "",
        key: request.body?.key ?? "",
        ...(request.body?.description ? { description: request.body.description } : {}),
        workflowTemplateId: request.body?.workflowTemplateId ?? "",
      });

      return reply.redirect(
        buildDialogRedirect(`/templates/${result.id}?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: "Template angelegt",
          message: "Ein neues Template-Draft wurde angelegt.",
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Das Template konnte nicht angelegt werden.";
      return reply.redirect(
        buildDialogRedirect(`/templates/new?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Template konnte nicht angelegt werden",
          message,
        }),
        303,
      );
    }
  });

  app.get("/templates/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const viewModel = await createTemplateDetailViewModel(queryValue(request), params.id);

    if (!viewModel) {
      return reply.code(404).view("pages/template-not-found.ejs", await withDialog(request, {
        title: "Template Not Found",
        ...(await createBaseViewModel("templates", queryValue(request))),
      }));
    }

    return reply.view("pages/template-detail.ejs", await withDialog(request, viewModel));
  });

  app.post<{
    Body: {
      source?: string;
      intent?: string;
      workflowTemplateId?: string;
      cascadePublishWorkflow?: string;
      [key: string]: string | undefined;
    };
  }>("/templates/:id/source", async (request, reply) => {
    const params = request.params as { id: string };
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const requestedSourceText = request.body?.source ?? "";
    const intent = request.body?.intent ?? "save_draft";
    const workflowTemplateId = request.body?.workflowTemplateId ?? "";
    const cascadePublishWorkflow = request.body?.cascadePublishWorkflow === "on";
    const apiBindingEntries = Object.entries(request.body ?? {})
      .filter(([key]) => key.startsWith("apiBinding."))
      .map(([key, value]) => [key.replace(/^apiBinding\./, ""), value ?? ""] as const);
    const sourceText = apiBindingEntries.length > 0
      ? applyNextFormApiBindings({
          sourceText: requestedSourceText,
          bindings: Object.fromEntries(apiBindingEntries),
        })
      : requestedSourceText;

    try {
      const result = intent === "publish"
        ? await publishReferenceTemplateVersion({
            templateId: params.id,
            sourceText,
            workflowTemplateId,
            cascadePublishWorkflow,
          })
        : intent === "unpublish"
          ? await unpublishReferenceTemplateVersion({
              templateId: params.id,
            })
          : intent === "archive"
            ? await archiveReferenceTemplateFamily({
                templateId: params.id,
              })
            : await saveReferenceTemplateDraft({
                templateId: params.id,
                sourceText,
                workflowTemplateId,
              });

      const dialogTitle =
        intent === "publish"
          ? "Template publiziert"
          : intent === "unpublish"
            ? "Template unveroeffentlicht"
            : intent === "archive"
              ? "Template archiviert"
              : "Draft gespeichert";
      const dialogMessage =
        intent === "publish"
          ? `Version v${result.version} wurde als publizierte Template-Version bereitgestellt.`
          : intent === "unpublish"
            ? `Version v${result.version} ist nicht mehr fuer neue Dokumentstarts freigegeben.`
            : intent === "archive"
              ? "Die Template-Version wurde aus den normalen Standarduebersichten herausgenommen."
              : `Draft-Stand v${result.version} wurde gespeichert.`;

      return reply.redirect(
        buildDialogRedirect(`/templates/${result.id}?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: dialogTitle,
          message: dialogMessage,
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Die Template-Quelle konnte nicht verarbeitet werden.";
      const viewModel = await createTemplateDetailViewModel(queryValue(request), params.id, {
        sourceText,
        workflowTemplateId,
      });

      if (!viewModel) {
        return reply.code(404).view("pages/template-not-found.ejs", await withDialog(request, {
          title: "Template Not Found",
          ...(await createBaseViewModel("templates", queryValue(request))),
        }));
      }

      return reply.code(400).view("pages/template-detail.ejs", {
        ...viewModel,
        appDialog: {
          type: "error" as const,
          title:
            intent === "publish"
              ? "Publish fehlgeschlagen"
              : intent === "unpublish"
                ? "Unpublish fehlgeschlagen"
                : intent === "archive"
                  ? "Archive fehlgeschlagen"
                  : "Save Draft fehlgeschlagen",
          message,
        },
      });
    }
  });

  app.get("/workflows", async (request, reply) => {
    return renderPage(request, reply, "workflows", "workflows", "Workflows");
  });

  app.get("/workflows/new", async (request, reply) => {
    return reply.view("pages/workflow-new.ejs", await withDialog(request, await createWorkflowNewViewModel(queryValue(request))));
  });

  app.post<{ Body: { name?: string; key?: string; description?: string } }>("/workflows/new", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);

    try {
      const result = await createWorkflowDraft({
        name: request.body?.name ?? "",
        key: request.body?.key ?? "",
        ...(request.body?.description ? { description: request.body.description } : {}),
      });

      return reply.redirect(
        buildDialogRedirect(`/workflows/${result.id}?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: "Workflow angelegt",
          message: "Ein neues Workflow-Draft wurde angelegt.",
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Der Workflow konnte nicht angelegt werden.";
      return reply.redirect(
        buildDialogRedirect(`/workflows/new?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Workflow konnte nicht angelegt werden",
          message,
        }),
        303,
      );
    }
  });

  app.get("/workflows/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const viewModel = await createWorkflowDetailViewModel(queryValue(request), params.id);

    if (!viewModel) {
      return reply.code(404).view("pages/workflow-not-found.ejs", await withDialog(request, {
        title: "Workflow Not Found",
        ...(await createBaseViewModel("workflows", queryValue(request))),
      }));
    }

    return reply.view("pages/workflow-detail.ejs", await withDialog(request, viewModel));
  });

  app.post<{
    Body: {
      source?: string;
      intent?: string;
      sourceMode?: string;
      initialStatus?: string;
      statusesText?: string;
      actionName?: string | string[];
      actionFrom?: string | string[];
      actionTo?: string | string[];
      actionRoles?: string | string[];
      actionMode?: string | string[];
      actionApi?: string | string[];
      actionCondition?: string | string[];
    };
  }>("/workflows/:id/source", async (request, reply) => {
    const params = request.params as { id: string };
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const intent = request.body?.intent ?? "save_draft";

    try {
      const sourceText = intent === "unpublish" || intent === "archive"
        ? typeof request.body?.source === "string" ? request.body.source : ""
        : resolveWorkflowSourceFromRequestBody((request.body ?? {}) as Record<string, unknown>);
      const result = intent === "publish"
        ? await publishWorkflowVersion({
            workflowId: params.id,
            sourceText,
          })
        : intent === "unpublish"
          ? await unpublishWorkflowVersion({
              workflowId: params.id,
            })
          : intent === "archive"
            ? await archiveWorkflowVersion({
                workflowId: params.id,
              })
            : await saveWorkflowDraftSource({
                workflowId: params.id,
                sourceText,
              });

      return reply.redirect(
        buildDialogRedirect(`/workflows/${result.id}?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title:
            intent === "publish"
              ? "Workflow publiziert"
              : intent === "unpublish"
                ? "Workflow unveroeffentlicht"
                : intent === "archive"
                  ? "Workflow archiviert"
                  : "Draft gespeichert",
          message:
            intent === "publish"
              ? `Workflow-Version v${result.version} wurde publiziert.`
              : intent === "unpublish"
                ? `Workflow-Version v${result.version} ist nicht mehr fuer neue publizierte Nutzungen freigegeben.`
                : intent === "archive"
                  ? `Workflow-Version v${result.version} wurde aus den normalen Standarduebersichten herausgenommen.`
                  : `Workflow-Draft v${result.version} wurde gespeichert.`,
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Die Workflow-Quelle konnte nicht verarbeitet werden.";
      const fallbackSourceText = typeof request.body?.source === "string" ? request.body.source : "";
      const viewModel = await createWorkflowDetailViewModel(queryValue(request), params.id, {
        sourceText: fallbackSourceText,
      });

      if (!viewModel) {
        return reply.code(404).view("pages/workflow-not-found.ejs", await withDialog(request, {
          title: "Workflow Not Found",
          ...(await createBaseViewModel("workflows", queryValue(request))),
        }));
      }

      return reply.code(400).view("pages/workflow-detail.ejs", {
        ...viewModel,
        appDialog: {
          type: "error" as const,
          title:
            intent === "publish"
              ? "Publish fehlgeschlagen"
              : intent === "unpublish"
                ? "Unpublish fehlgeschlagen"
                : intent === "archive"
                  ? "Archive fehlgeschlagen"
                  : "Save Draft fehlgeschlagen",
          message,
        },
      });
    }
  });

  app.get("/apis", async (request, reply) => {
    const viewModel = await createApiCatalogViewModel(queryValue(request));
    return reply.view("pages/apis.ejs", await withDialog(request, viewModel));
  });

  app.post<{ Params: { entityType: string }; Body: { csvText?: string } }>("/apis/import/:entityType", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const entityType = toEntityType(request.params.entityType);

    if (!entityType) {
      return reply.redirect(
        buildDialogRedirect(`/apis?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Import nicht moeglich",
          message: "Der CSV-Import ist aktuell nur fuer Customers und Products verfuegbar.",
        }),
        303,
      );
    }

    try {
      const result = await importReferenceEntitiesFromCsv({
        entityType,
        csvText: request.body?.csvText ?? "",
      });

      return reply.redirect(
        buildDialogRedirect(`/apis?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: "CSV importiert",
          message: `${result.importedCount} ${entityType === "customer" ? "Customer" : "Product"}-Zeilen wurden importiert.`,
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Der CSV-Import konnte nicht verarbeitet werden.";
      return reply.redirect(
        buildDialogRedirect(`/apis?user=${encodeURIComponent(activeUser.key)}`, {
          title: "CSV-Import fehlgeschlagen",
          message,
        }),
        303,
      );
    }
  });

  app.get("/api/form-data/templates/:templateKey/export.csv", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const params = request.params as { templateKey: string };
    const fields = parseFieldSelection(request);
    const records = await listTemplateFormDataRecordsVisibleToUser({
      userId: activeUser.id,
      templateKey: params.templateKey,
      ...(fields ? { fields } : {}),
    });
    const exportFields = fields ?? records[0]?.template.tableFields ?? [];
    const csvText = serializeCsv(
      ["document_id", "document_title", "status", "created_at", "updated_at", ...exportFields],
      records.map((record) => ({
        document_id: record.id,
        document_title: record.title,
        status: record.status,
        created_at: record.createdAt,
        updated_at: record.updatedAt,
        ...Object.fromEntries(exportFields.map((field) => [field, serializeFormDataExportValue(record.data[field])])),
      })),
    );

    return reply
      .type("text/csv; charset=utf-8")
      .header("content-disposition", `attachment; filename="${params.templateKey}.csv"`)
      .send(csvText);
  });

  app.get("/api/form-data/templates/:templateKey/:documentId", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const params = request.params as { templateKey: string; documentId: string };
    const fields = parseFieldSelection(request);
    const record = await findTemplateFormDataRecordVisibleToUser({
      userId: activeUser.id,
      templateKey: params.templateKey,
      documentId: params.documentId,
      ...(fields ? { fields } : {}),
    });

    if (!record) {
      return reply.code(404).send({
        error: "not_found",
        message: "Formulardatensatz nicht gefunden oder nicht sichtbar.",
      });
    }

    return reply.type("application/json").send({
      templateKey: params.templateKey,
      ...(fields ? { fields } : {}),
      item: record,
    });
  });

  app.get("/api/form-data/templates/:templateKey", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const params = request.params as { templateKey: string };
    const fields = parseFieldSelection(request);
    const records = await listTemplateFormDataRecordsVisibleToUser({
      userId: activeUser.id,
      templateKey: params.templateKey,
      ...(fields ? { fields } : {}),
    });

    return reply.type("application/json").send({
      templateKey: params.templateKey,
      ...(fields ? { fields } : {}),
      count: records.length,
      items: records,
    });
  });

  app.get("/api/entities/:entityType", async (request, reply) => {
    const params = request.params as { entityType: string };
    const entityType = toEntityType(params.entityType);

    if (!entityType) {
      return reply.code(404).send({
        error: "not_found",
        message: "Entitaetentyp nicht gefunden.",
      });
    }

    const items = await listReferenceEntities(entityType);

    return reply.type("application/json").send({
      entityType,
      count: items.length,
      items,
    });
  });

  app.get("/api/entities/:entityType/:entityKey", async (request, reply) => {
    const params = request.params as { entityType: string; entityKey: string };
    const entityType = toEntityType(params.entityType);

    if (!entityType) {
      return reply.code(404).send({
        error: "not_found",
        message: "Entitaetentyp nicht gefunden.",
      });
    }

    const item = await findReferenceEntityByKey({
      entityType,
      entityKey: params.entityKey,
    });

    if (!item) {
      return reply.code(404).send({
        error: "not_found",
        message: "Entitaet nicht gefunden.",
      });
    }

    return reply.type("application/json").send({
      entityType,
      item,
    });
  });

  app.get("/documents", async (request, reply) => {
    const baseViewModel = await createBaseViewModel("documents", queryValue(request));
    const documentsList = filterDocumentsViewModel({
      documents: baseViewModel.catalog.documents,
      templates: baseViewModel.catalog.templates,
      workflows: baseViewModel.catalog.workflows,
      users: baseViewModel.users,
      searchTerm: normalizeSearchTerm(searchValue(request)),
      statusFilter: statusFilterValue(request),
      showArchived: normalizeShowArchived(showArchivedValue(request)),
    });

    return reply.view("pages/documents.ejs", await withDialog(request, {
      title: "Documents",
      ...baseViewModel,
      documentsList,
      startError: startErrorValue(request),
    }));
  });

  app.get("/admin/users/new", async (request, reply) => {
    return reply.view("pages/admin-user-new.ejs", await withDialog(request, await createAdminUserNewViewModel(queryValue(request))));
  });

  app.post<{ Body: { displayName?: string; key?: string; email?: string } }>("/admin/users/new", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);

    try {
      await createUser({
        displayName: request.body?.displayName ?? "",
        key: request.body?.key ?? "",
        ...(request.body?.email ? { email: request.body.email } : {}),
      });

      return reply.redirect(
        buildDialogRedirect(`/admin?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: "User angelegt",
          message: "Ein neuer User wurde angelegt.",
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Der User konnte nicht angelegt werden.";
      return reply.redirect(
        buildDialogRedirect(`/admin/users/new?user=${encodeURIComponent(activeUser.key)}`, {
          title: "User konnte nicht angelegt werden",
          message,
        }),
        303,
      );
    }
  });

  app.get("/admin/users/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const viewModel = await createAdminUserDetailViewModel(queryValue(request), params.id);

    if (!viewModel) {
      return reply.code(404).view("pages/admin-user-not-found.ejs", await withDialog(request, {
        title: "User Not Found",
        ...(await createBaseViewModel("admin", queryValue(request))),
      }));
    }

    return reply.view("pages/admin-user-detail.ejs", await withDialog(request, viewModel));
  });

  app.get("/admin/users/:id/edit", async (request, reply) => {
    const params = request.params as { id: string };
    const viewModel = await createAdminUserEditViewModel(queryValue(request), params.id);

    if (!viewModel) {
      return reply.code(404).view("pages/admin-user-not-found.ejs", await withDialog(request, {
        title: "User Not Found",
        ...(await createBaseViewModel("admin", queryValue(request))),
      }));
    }

    return reply.view("pages/admin-user-edit.ejs", await withDialog(request, viewModel));
  });

  app.post<{ Body: { displayName?: string; email?: string; status?: string } }>("/admin/users/:id/edit", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const params = request.params as { id: string };
    const status = request.body?.status === "inactive" ? "inactive" : "active";

    try {
      await updateUser({
        id: params.id,
        displayName: request.body?.displayName ?? "",
        ...(request.body?.email ? { email: request.body.email } : {}),
        status,
      });

      return reply.redirect(
        buildDialogRedirect(`/admin/users/${params.id}?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: "User aktualisiert",
          message: "Der User wurde aktualisiert.",
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Der User konnte nicht aktualisiert werden.";
      return reply.redirect(
        buildDialogRedirect(`/admin/users/${params.id}/edit?user=${encodeURIComponent(activeUser.key)}`, {
          title: "User konnte nicht aktualisiert werden",
          message,
        }),
        303,
      );
    }
  });

  app.post<{ Body: { groupId?: string; rights?: string | string[] } }>("/admin/users/:id/memberships", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const params = request.params as { id: string };
    const rights = Array.isArray(request.body?.rights)
      ? request.body.rights
      : request.body?.rights
        ? [request.body.rights]
        : [];

    try {
      await createMembership({
        userId: params.id,
        groupId: request.body?.groupId ?? "",
        rights: {
          read: rights.includes("r"),
          write: rights.includes("w"),
          execute: rights.includes("x"),
        },
      });

      return reply.redirect(
        buildDialogRedirect(`/admin/users/${params.id}?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: "Membership angelegt",
          message: "Die Membership wurde angelegt.",
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Die Membership konnte nicht angelegt werden.";
      return reply.redirect(
        buildDialogRedirect(`/admin/users/${params.id}?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Membership konnte nicht angelegt werden",
          message,
        }),
        303,
      );
    }
  });

  app.post("/admin/users/:id/memberships/:membershipId/remove", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const params = request.params as { id: string; membershipId: string };

    try {
      await removeMembership({
        membershipId: params.membershipId,
        userId: params.id,
      });

      return reply.redirect(
        buildDialogRedirect(`/admin/users/${params.id}?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: "Membership entfernt",
          message: "Die Membership wurde entfernt.",
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Die Membership konnte nicht entfernt werden.";
      return reply.redirect(
        buildDialogRedirect(`/admin/users/${params.id}?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Membership konnte nicht entfernt werden",
          message,
        }),
        303,
      );
    }
  });

  app.get("/admin/groups/new", async (request, reply) => {
    return reply.view("pages/admin-group-new.ejs", await withDialog(request, await createAdminGroupNewViewModel(queryValue(request))));
  });

  app.post<{ Body: { name?: string; key?: string; description?: string } }>("/admin/groups/new", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);

    try {
      await createGroup({
        name: request.body?.name ?? "",
        key: request.body?.key ?? "",
        ...(request.body?.description ? { description: request.body.description } : {}),
      });

      return reply.redirect(
        buildDialogRedirect(`/admin?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: "Group angelegt",
          message: "Eine neue Group wurde angelegt.",
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Die Group konnte nicht angelegt werden.";
      return reply.redirect(
        buildDialogRedirect(`/admin/groups/new?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Group konnte nicht angelegt werden",
          message,
        }),
        303,
      );
    }
  });

  app.get("/admin/groups/:id", async (request, reply) => {
    const params = request.params as { id: string };
    const viewModel = await createAdminGroupDetailViewModel(queryValue(request), params.id);

    if (!viewModel) {
      return reply.code(404).view("pages/admin-group-not-found.ejs", await withDialog(request, {
        title: "Group Not Found",
        ...(await createBaseViewModel("admin", queryValue(request))),
      }));
    }

    return reply.view("pages/admin-group-detail.ejs", await withDialog(request, viewModel));
  });

  app.get("/admin/groups/:id/edit", async (request, reply) => {
    const params = request.params as { id: string };
    const viewModel = await createAdminGroupEditViewModel(queryValue(request), params.id);

    if (!viewModel) {
      return reply.code(404).view("pages/admin-group-not-found.ejs", await withDialog(request, {
        title: "Group Not Found",
        ...(await createBaseViewModel("admin", queryValue(request))),
      }));
    }

    return reply.view("pages/admin-group-edit.ejs", await withDialog(request, viewModel));
  });

  app.post<{ Body: { name?: string; description?: string; status?: string } }>("/admin/groups/:id/edit", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const params = request.params as { id: string };
    const status = request.body?.status === "inactive" ? "inactive" : "active";

    try {
      await updateGroup({
        id: params.id,
        name: request.body?.name ?? "",
        ...(request.body?.description ? { description: request.body.description } : {}),
        status,
      });

      return reply.redirect(
        buildDialogRedirect(`/admin/groups/${params.id}?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: "Group aktualisiert",
          message: "Die Group wurde aktualisiert.",
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Die Group konnte nicht aktualisiert werden.";
      return reply.redirect(
        buildDialogRedirect(`/admin/groups/${params.id}/edit?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Group konnte nicht aktualisiert werden",
          message,
        }),
        303,
      );
    }
  });

  app.post<{ Body: { templateId?: string } }>("/admin/groups/:id/template-assignments", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const params = request.params as { id: string };

    try {
      await createTemplateAssignment({
        groupId: params.id,
        templateId: request.body?.templateId ?? "",
      });

      return reply.redirect(
        buildDialogRedirect(`/admin/groups/${params.id}?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: "Template Assignment angelegt",
          message: "Das Template wurde der Group zugeordnet.",
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Das Template Assignment konnte nicht angelegt werden.";
      return reply.redirect(
        buildDialogRedirect(`/admin/groups/${params.id}?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Template Assignment konnte nicht angelegt werden",
          message,
        }),
        303,
      );
    }
  });

  app.post("/admin/groups/:id/template-assignments/:assignmentId/remove", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const params = request.params as { id: string; assignmentId: string };

    try {
      await removeTemplateAssignment({
        assignmentId: params.assignmentId,
        groupId: params.id,
      });

      return reply.redirect(
        buildDialogRedirect(`/admin/groups/${params.id}?user=${encodeURIComponent(activeUser.key)}`, {
          type: "info",
          title: "Template Assignment entfernt",
          message: "Das Template Assignment wurde entfernt.",
        }),
        303,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Das Template Assignment konnte nicht entfernt werden.";
      return reply.redirect(
        buildDialogRedirect(`/admin/groups/${params.id}?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Template Assignment konnte nicht entfernt werden",
          message,
        }),
        303,
      );
    }
  });

  app.post<{ Body: { templateId?: string } }>("/documents/start", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const templateId = request.body?.templateId;

    if (!templateId) {
      return reply.redirect(`/documents?user=${encodeURIComponent(activeUser.key)}&startError=${encodeURIComponent("Bitte ein Template auswaehlen.")}`);
    }

    const result = await startDocumentForUser({
      templateId,
      userId: activeUser.id,
    });

    if (!result.ok) {
      return reply.redirect(
        `/documents?user=${encodeURIComponent(activeUser.key)}&startError=${encodeURIComponent("Template ist nicht fuer neue Dokumentstarts freigegeben. Startbar sind nur publizierte, nicht archivierte Template-Staende mit publiziertem Workflow.")}`,
      );
    }

    return reply.redirect(`/documents/${result.documentId}?user=${encodeURIComponent(activeUser.key)}`, 303);
  });

  app.get<{ Params: { id: string } }>("/documents/:id", async (request, reply) => {
    const viewModel = await createDocumentDetailViewModel(queryValue(request), request.params.id);

    if (!viewModel) {
      return reply.code(404).view("pages/document-not-found.ejs", {
        ...(await withDialog(request, {})),
        title: "Document Not Found",
        ...(await createBaseViewModel("documents", queryValue(request))),
        missingDocumentId: request.params.id,
      });
    }

    return reply.view("pages/document-detail.ejs", await withDialog(request, {
      ...viewModel,
      saveError: saveErrorValue(request),
      saveStatus: saveStatusValue(request),
      journalError: journalErrorValue(request),
      journalStatus: journalStatusValue(request),
      submitError: submitErrorValue(request),
      submitStatus: submitStatusValue(request),
      approveError: approveErrorValue(request),
      approveStatus: approveStatusValue(request),
      rejectError: rejectErrorValue(request),
      rejectStatus: rejectStatusValue(request),
      archiveError: archiveErrorValue(request),
      archiveStatus: archiveStatusValue(request),
      nextFormError: nextFormErrorValue(request),
      nextFormStatus: nextFormStatusValue(request),
      uploadError: uploadErrorValue(request),
      uploadStatus: uploadStatusValue(request),
    }));
  });

  app.post<{
    Params: { id: string };
    Body: {
      intent?: string;
      actionName?: string;
      order_number?: string;
      customer?: string;
      service_location?: string;
      customer_master_id?: string;
      customer_master_status?: string;
      customer_order_status?: string;
      customer_order_created_at?: string;
      work_description?: string;
      material?: string;
      product_master_id?: string;
      product_master_type?: string;
      product_master_status?: string;
      work_signature?: string;
      work_signature_at?: string;
      work_signature_requested?: string;
      qualification_record_number?: string;
      qualification_title?: string;
      owner_user_id?: string;
      attendee_user_ids?: string;
      valid_until?: string;
      qualification_result?: string;
      qualification_topics?: string;
      batch_id?: string;
      serial_number?: string;
      product_name?: string;
      production_line?: string;
      process_steps?: string;
      approval_status?: string;
      labor_hours?: string;
      travel_hours?: string;
      break_minutes?: string;
    };
  }>("/documents/:id/next-form", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const nextFormIntent = request.body.intent ?? query(request).intent;
    const nextFormActionName = request.body.actionName ?? query(request).actionName;
    const nextFormFieldValues = {
      order_number: request.body.order_number,
      customer: request.body.customer,
      service_location: request.body.service_location,
      customer_master_id: request.body.customer_master_id,
      customer_master_status: request.body.customer_master_status,
      customer_order_status: request.body.customer_order_status,
      customer_order_created_at: request.body.customer_order_created_at,
      work_description: request.body.work_description,
      material: request.body.material,
      product_master_id: request.body.product_master_id,
      product_master_type: request.body.product_master_type,
      product_master_status: request.body.product_master_status,
      work_signature: request.body.work_signature,
      work_signature_at: request.body.work_signature_at,
      work_signature_requested: request.body.work_signature_requested,
      qualification_record_number: request.body.qualification_record_number,
      qualification_title: request.body.qualification_title,
      owner_user_id: request.body.owner_user_id,
      attendee_user_ids: request.body.attendee_user_ids,
      valid_until: request.body.valid_until,
      qualification_result: request.body.qualification_result,
      qualification_topics: request.body.qualification_topics,
      batch_id: request.body.batch_id,
      serial_number: request.body.serial_number,
      product_name: request.body.product_name,
      production_line: request.body.production_line,
      process_steps: request.body.process_steps,
      approval_status: request.body.approval_status,
      labor_hours: request.body.labor_hours,
      travel_hours: request.body.travel_hours,
      break_minutes: request.body.break_minutes,
    };

    if (nextFormIntent === "run-action") {
      const result = await runDocumentNextFormActionForUser({
        documentId: request.params.id,
        userId: activeUser.id,
        actionName: nextFormActionName ?? "",
        submittedValues: nextFormFieldValues,
      });

      if (!result.ok && result.reason === "document_not_visible") {
        return reply.code(404).view("pages/document-not-found.ejs", {
          ...(await withDialog(request, {})),
          title: "Document Not Found",
          ...(await createBaseViewModel("documents", queryValue(request))),
          missingDocumentId: request.params.id,
        });
      }

      const viewModel = await createDocumentDetailViewModel(queryValue(request), request.params.id, {
        nextFormFieldValues: result.ok ? result.fieldValues : nextFormFieldValues,
      });

      if (!viewModel) {
        return reply.code(404).view("pages/document-not-found.ejs", {
          ...(await withDialog(request, {})),
          title: "Document Not Found",
          ...(await createBaseViewModel("documents", queryValue(request))),
          missingDocumentId: request.params.id,
        });
      }

      const responseModel = {
        ...viewModel,
        saveError: saveErrorValue(request),
        saveStatus: saveStatusValue(request),
        journalError: journalErrorValue(request),
        journalStatus: journalStatusValue(request),
        submitError: submitErrorValue(request),
        submitStatus: submitStatusValue(request),
        approveError: approveErrorValue(request),
        approveStatus: approveStatusValue(request),
        rejectError: rejectErrorValue(request),
        rejectStatus: rejectStatusValue(request),
        archiveError: archiveErrorValue(request),
        archiveStatus: archiveStatusValue(request),
        nextFormStatus:
          result.ok && result.actionState.type === "info"
            ? `${result.actionState.title}: ${result.actionState.message}`
            : undefined,
        nextFormError: !result.ok || result.actionState.type === "error"
          ? (result.ok ? `${result.actionState.title}: ${result.actionState.message}` : result.details)
          : undefined,
        uploadError: uploadErrorValue(request),
        uploadStatus: uploadStatusValue(request),
      };

      if (isHtmxRequest(request)) {
        return reply.type("text/html").send(await renderDocumentFormBodyFragment(responseModel, {
          includeWorkflowZoneOob: true,
        }));
      }

      return reply.view("pages/document-detail.ejs", await withDialog(request, responseModel));
    }

    const saveResult = await saveDocumentNextFormValuesForUser({
      documentId: request.params.id,
      userId: activeUser.id,
      activeUserDisplayName: activeUser.displayName,
      submittedValues: nextFormFieldValues,
    });

    if (!saveResult.ok && saveResult.reason === "document_not_visible") {
      return reply.code(404).view("pages/document-not-found.ejs", {
        ...(await withDialog(request, {})),
        title: "Document Not Found",
        ...(await createBaseViewModel("documents", queryValue(request))),
        missingDocumentId: request.params.id,
      });
    }

    if (!saveResult.ok) {
      if (isHtmxRequest(request)) {
        const viewModel = await createDocumentDetailViewModel(queryValue(request), request.params.id, {
          nextFormFieldValues,
        });

        if (!viewModel) {
          return reply.code(404).view("pages/document-not-found.ejs", {
            ...(await withDialog(request, {})),
            title: "Document Not Found",
            ...(await createBaseViewModel("documents", queryValue(request))),
            missingDocumentId: request.params.id,
          });
        }

        return reply
          .code(400)
          .type("text/html")
          .send(await renderDocumentFormBodyFragment({
            ...viewModel,
            saveError: saveErrorValue(request),
            saveStatus: saveStatusValue(request),
            journalError: journalErrorValue(request),
            journalStatus: journalStatusValue(request),
            submitError: submitErrorValue(request),
            submitStatus: submitStatusValue(request),
            approveError: approveErrorValue(request),
            approveStatus: approveStatusValue(request),
            rejectError: rejectErrorValue(request),
            rejectStatus: rejectStatusValue(request),
            archiveError: archiveErrorValue(request),
            archiveStatus: archiveStatusValue(request),
            nextFormError: saveResult.details,
            nextFormStatus: nextFormStatusValue(request),
            uploadError: uploadErrorValue(request),
            uploadStatus: uploadStatusValue(request),
          }, {
            includeWorkflowZoneOob: true,
          }));
      }

      return reply.redirect(
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&nextFormError=${encodeURIComponent(saveResult.details)}`,
        303,
      );
    }

    if (isHtmxRequest(request)) {
      const viewModel = await createDocumentDetailViewModel(queryValue(request), saveResult.documentId);

      if (!viewModel) {
        return reply.code(404).view("pages/document-not-found.ejs", {
          ...(await withDialog(request, {})),
          title: "Document Not Found",
          ...(await createBaseViewModel("documents", queryValue(request))),
          missingDocumentId: saveResult.documentId,
        });
      }

      return reply.type("text/html").send(await renderDocumentFormBodyFragment({
        ...viewModel,
        saveError: saveErrorValue(request),
        saveStatus: saveStatusValue(request),
        journalError: journalErrorValue(request),
        journalStatus: journalStatusValue(request),
        submitError: submitErrorValue(request),
        submitStatus: submitStatusValue(request),
        approveError: approveErrorValue(request),
        approveStatus: approveStatusValue(request),
        rejectError: rejectErrorValue(request),
        rejectStatus: rejectStatusValue(request),
        archiveError: archiveErrorValue(request),
        archiveStatus: archiveStatusValue(request),
        nextFormError: nextFormErrorValue(request),
        nextFormStatus: saveResult.signatureApplied ? "Werte gespeichert. Signatur gesetzt." : "Werte gespeichert.",
        uploadError: uploadErrorValue(request),
        uploadStatus: uploadStatusValue(request),
      }, {
        includeWorkflowZoneOob: true,
        includeHeaderOob: true,
        includeHistoryOob: true,
      }));
    }

    return reply.redirect(
      `/documents/${encodeURIComponent(saveResult.documentId)}?user=${encodeURIComponent(activeUser.key)}&nextFormStatus=${encodeURIComponent(saveResult.signatureApplied ? "Werte gespeichert. Signatur gesetzt." : "Werte gespeichert.")}`,
      303,
    );
  });

  app.post<{ Params: { id: string }; Body: Record<string, unknown> }>("/documents/:id/save", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const result = await saveDocumentValuesForUser({
      documentId: request.params.id,
      userId: activeUser.id,
      submittedValues: request.body ?? {},
    });

    if (!result.ok && result.reason === "document_not_visible") {
      return reply.code(404).view("pages/document-not-found.ejs", {
        ...(await withDialog(request, {})),
        title: "Document Not Found",
        ...(await createBaseViewModel("documents", queryValue(request))),
        missingDocumentId: request.params.id,
      });
    }

    if (!result.ok) {
      return reply.redirect(
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&saveError=${encodeURIComponent(result.details ?? "Keine speicherbaren Felder im aktuellen Status verfuegbar.")}`,
        303,
      );
    }

    return reply.redirect(
      `/documents/${encodeURIComponent(result.documentId)}?user=${encodeURIComponent(activeUser.key)}&saveStatus=${encodeURIComponent("Werte gespeichert.")}`,
      303,
    );
  });

  app.post<{ Params: { id: string }; Body: { journalFieldName?: string; entryText?: string } }>("/documents/:id/journal", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const result = await addJournalEntryForUser({
      documentId: request.params.id,
      userId: activeUser.id,
      userDisplayName: activeUser.displayName,
      journalFieldName: request.body?.journalFieldName ?? "",
      entryText: request.body?.entryText ?? "",
    });

    if (!result.ok && result.reason === "document_not_visible") {
      return reply.code(404).view("pages/document-not-found.ejs", {
        ...(await withDialog(request, {})),
        title: "Document Not Found",
        ...(await createBaseViewModel("documents", queryValue(request))),
        missingDocumentId: request.params.id,
      });
    }

    if (!result.ok) {
      if (isHtmxRequest(request)) {
        const viewModel = await createDocumentDetailViewModel(queryValue(request), request.params.id);

        if (!viewModel) {
          return reply.code(404).view("pages/document-not-found.ejs", {
            ...(await withDialog(request, {})),
            title: "Document Not Found",
            ...(await createBaseViewModel("documents", queryValue(request))),
            missingDocumentId: request.params.id,
          });
        }

        return reply
          .code(400)
          .type("text/html")
          .send(await renderDocumentJournalFragment({
            ...viewModel,
            saveError: saveErrorValue(request),
            saveStatus: saveStatusValue(request),
            journalError: result.details ?? "Journal-Eintrag konnte nicht hinzugefuegt werden.",
            journalStatus: journalStatusValue(request),
            submitError: submitErrorValue(request),
            submitStatus: submitStatusValue(request),
            approveError: approveErrorValue(request),
            approveStatus: approveStatusValue(request),
            rejectError: rejectErrorValue(request),
            rejectStatus: rejectStatusValue(request),
            archiveError: archiveErrorValue(request),
            archiveStatus: archiveStatusValue(request),
            nextFormError: nextFormErrorValue(request),
            nextFormStatus: nextFormStatusValue(request),
            uploadError: uploadErrorValue(request),
            uploadStatus: uploadStatusValue(request),
          }));
      }

      return reply.redirect(
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&journalError=${encodeURIComponent(result.details ?? "Journal-Eintrag konnte nicht hinzugefuegt werden.")}`,
        303,
      );
    }

    if (isHtmxRequest(request)) {
      const viewModel = await createDocumentDetailViewModel(queryValue(request), result.documentId);

      if (!viewModel) {
        return reply.code(404).view("pages/document-not-found.ejs", {
          ...(await withDialog(request, {})),
          title: "Document Not Found",
          ...(await createBaseViewModel("documents", queryValue(request))),
          missingDocumentId: result.documentId,
        });
      }

      return reply.type("text/html").send(await renderDocumentJournalFragment({
        ...viewModel,
        saveError: saveErrorValue(request),
        saveStatus: saveStatusValue(request),
        journalError: journalErrorValue(request),
        journalStatus: "Journal-Eintrag hinzugefuegt.",
        submitError: submitErrorValue(request),
        submitStatus: submitStatusValue(request),
        approveError: approveErrorValue(request),
        approveStatus: approveStatusValue(request),
        rejectError: rejectErrorValue(request),
        rejectStatus: rejectStatusValue(request),
        archiveError: archiveErrorValue(request),
        archiveStatus: archiveStatusValue(request),
        nextFormError: nextFormErrorValue(request),
        nextFormStatus: nextFormStatusValue(request),
        uploadError: uploadErrorValue(request),
        uploadStatus: uploadStatusValue(request),
      }, {
        includeHeaderOob: true,
        includeHistoryOob: true,
      }));
    }

    return reply.redirect(
      `/documents/${encodeURIComponent(result.documentId)}?user=${encodeURIComponent(activeUser.key)}&journalStatus=${encodeURIComponent("Journal-Eintrag hinzugefuegt.")}`,
      303,
    );
  });

  app.post<{ Params: { id: string } }>("/documents/:id/submit", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const result = await submitDocumentForUser({
      documentId: request.params.id,
      userId: activeUser.id,
    });

    if (!result.ok && result.reason === "document_not_visible") {
      return reply.code(404).view("pages/document-not-found.ejs", {
        ...(await withDialog(request, {})),
        title: "Document Not Found",
        ...(await createBaseViewModel("documents", queryValue(request))),
        missingDocumentId: request.params.id,
      });
    }

    if (!result.ok) {
      const message =
        result.reason === "minimal_data_missing"
          ? result.details ?? "Pflichtfelder fehlen fuer Submit."
          : result.details ?? "Submit ist im aktuellen Status nicht verfuegbar.";

      if (isHtmxRequest(request)) {
        const viewModel = await createDocumentDetailViewModel(queryValue(request), request.params.id);

        if (!viewModel) {
          return reply.code(404).view("pages/document-not-found.ejs", {
            ...(await withDialog(request, {})),
            title: "Document Not Found",
            ...(await createBaseViewModel("documents", queryValue(request))),
            missingDocumentId: request.params.id,
          });
        }

        return reply.type("text/html").send(
          await renderDocumentFormBodyFragment({
            ...viewModel,
            ...buildDocumentFeedbackStateFromRequest(request),
            submitError: message,
            submitStatus: undefined,
          }, {
            includeWorkflowZoneOob: true,
          }),
        );
      }

      return reply.redirect(
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&submitError=${encodeURIComponent(message)}`,
        303,
      );
    }

    if (isHtmxRequest(request)) {
      const viewModel = await createDocumentDetailViewModel(queryValue(request), result.documentId);

      if (!viewModel) {
        return reply.code(404).view("pages/document-not-found.ejs", {
          ...(await withDialog(request, {})),
          title: "Document Not Found",
          ...(await createBaseViewModel("documents", queryValue(request))),
          missingDocumentId: request.params.id,
        });
      }

      return reply.type("text/html").send(
        await renderDocumentFormBodyFragment({
          ...viewModel,
          ...buildDocumentFeedbackStateFromRequest(request),
          submitStatus: result.message ?? `Dokument wurde nach ${result.nextStatus} ueberfuehrt.`,
          submitError: undefined,
        }, {
          includeWorkflowZoneOob: true,
          includeHeaderOob: true,
          includeHistoryOob: true,
        }),
      );
    }

    return reply.redirect(
      `/documents/${encodeURIComponent(result.documentId)}?user=${encodeURIComponent(activeUser.key)}&submitStatus=${encodeURIComponent(result.message ?? `Dokument wurde nach ${result.nextStatus} ueberfuehrt.`)}`,
      303,
    );
  });

  app.post<{ Params: { id: string } }>("/documents/:id/approve", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const result = await approveDocumentForUser({
      documentId: request.params.id,
      userId: activeUser.id,
    });

    if (!result.ok && result.reason === "document_not_visible") {
      return reply.code(404).view("pages/document-not-found.ejs", {
        ...(await withDialog(request, {})),
        title: "Document Not Found",
        ...(await createBaseViewModel("documents", queryValue(request))),
        missingDocumentId: request.params.id,
      });
    }

    if (!result.ok) {
      if (isHtmxRequest(request)) {
        const viewModel = await createDocumentDetailViewModel(queryValue(request), request.params.id);

        if (!viewModel) {
          return reply.code(404).view("pages/document-not-found.ejs", {
            ...(await withDialog(request, {})),
            title: "Document Not Found",
            ...(await createBaseViewModel("documents", queryValue(request))),
            missingDocumentId: request.params.id,
          });
        }

        return reply.type("text/html").send(
          await renderDocumentFormBodyFragment({
            ...viewModel,
            ...buildDocumentFeedbackStateFromRequest(request),
            approveError: result.details ?? "Approve ist im aktuellen Status nicht verfuegbar.",
            approveStatus: undefined,
          }, {
            includeWorkflowZoneOob: true,
          }),
        );
      }

      return reply.redirect(
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&approveError=${encodeURIComponent(result.details ?? "Approve ist im aktuellen Status nicht verfuegbar.")}`,
        303,
      );
    }

    if (isHtmxRequest(request)) {
      const viewModel = await createDocumentDetailViewModel(queryValue(request), result.documentId);

      if (!viewModel) {
        return reply.code(404).view("pages/document-not-found.ejs", {
          ...(await withDialog(request, {})),
          title: "Document Not Found",
          ...(await createBaseViewModel("documents", queryValue(request))),
          missingDocumentId: request.params.id,
        });
      }

      return reply.type("text/html").send(
        await renderDocumentFormBodyFragment({
          ...viewModel,
          ...buildDocumentFeedbackStateFromRequest(request),
          approveStatus: `Dokument wurde nach ${result.nextStatus} ueberfuehrt.`,
          approveError: undefined,
        }, {
          includeWorkflowZoneOob: true,
          includeHeaderOob: true,
          includeHistoryOob: true,
        }),
      );
    }

    return reply.redirect(
      `/documents/${encodeURIComponent(result.documentId)}?user=${encodeURIComponent(activeUser.key)}&approveStatus=${encodeURIComponent(`Dokument wurde nach ${result.nextStatus} ueberfuehrt.`)}`,
      303,
    );
  });

  app.post<{ Params: { id: string } }>("/documents/:id/reject", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const result = await rejectDocumentForUser({
      documentId: request.params.id,
      userId: activeUser.id,
    });

    if (!result.ok && result.reason === "document_not_visible") {
      return reply.code(404).view("pages/document-not-found.ejs", {
        ...(await withDialog(request, {})),
        title: "Document Not Found",
        ...(await createBaseViewModel("documents", queryValue(request))),
        missingDocumentId: request.params.id,
      });
    }

    if (!result.ok) {
      if (isHtmxRequest(request)) {
        const viewModel = await createDocumentDetailViewModel(queryValue(request), request.params.id);

        if (!viewModel) {
          return reply.code(404).view("pages/document-not-found.ejs", {
            ...(await withDialog(request, {})),
            title: "Document Not Found",
            ...(await createBaseViewModel("documents", queryValue(request))),
            missingDocumentId: request.params.id,
          });
        }

        return reply.type("text/html").send(
          await renderDocumentFormBodyFragment({
            ...viewModel,
            ...buildDocumentFeedbackStateFromRequest(request),
            rejectError: result.details ?? "Reject ist im aktuellen Status nicht verfuegbar.",
            rejectStatus: undefined,
          }, {
            includeWorkflowZoneOob: true,
          }),
        );
      }

      return reply.redirect(
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&rejectError=${encodeURIComponent(result.details ?? "Reject ist im aktuellen Status nicht verfuegbar.")}`,
        303,
      );
    }

    if (isHtmxRequest(request)) {
      const viewModel = await createDocumentDetailViewModel(queryValue(request), result.documentId);

      if (!viewModel) {
        return reply.code(404).view("pages/document-not-found.ejs", {
          ...(await withDialog(request, {})),
          title: "Document Not Found",
          ...(await createBaseViewModel("documents", queryValue(request))),
          missingDocumentId: request.params.id,
        });
      }

      return reply.type("text/html").send(
        await renderDocumentFormBodyFragment({
          ...viewModel,
          ...buildDocumentFeedbackStateFromRequest(request),
          rejectStatus: `Dokument wurde nach ${result.nextStatus} ueberfuehrt.`,
          rejectError: undefined,
        }, {
          includeWorkflowZoneOob: true,
          includeHeaderOob: true,
          includeHistoryOob: true,
        }),
      );
    }

    return reply.redirect(
      `/documents/${encodeURIComponent(result.documentId)}?user=${encodeURIComponent(activeUser.key)}&rejectStatus=${encodeURIComponent(`Dokument wurde nach ${result.nextStatus} ueberfuehrt.`)}`,
      303,
    );
  });

  app.post<{ Params: { id: string } }>("/documents/:id/archive", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const result = await archiveDocumentForUser({
      documentId: request.params.id,
      userId: activeUser.id,
    });

    if (!result.ok && result.reason === "document_not_visible") {
      return reply.code(404).view("pages/document-not-found.ejs", {
        title: "Document Not Found",
        ...(await createBaseViewModel("documents", queryValue(request))),
        missingDocumentId: request.params.id,
      });
    }

    if (!result.ok) {
      return reply.redirect(
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&archiveError=${encodeURIComponent(result.details ?? "Archive ist im aktuellen Status nicht verfuegbar.")}`,
        303,
      );
    }

    return reply.redirect(
      `/documents/${encodeURIComponent(result.documentId)}?user=${encodeURIComponent(activeUser.key)}&archiveStatus=${encodeURIComponent(`Dokument wurde nach ${result.nextStatus} ueberfuehrt.`)}`,
      303,
    );
  });

  app.post<{ Params: { id: string }; Body: Buffer }>("/documents/:id/attachments", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const file = parseSingleAttachmentUpload(request.headers["content-type"], Buffer.isBuffer(request.body) ? request.body : undefined);

    if (!file) {
      if (isHtmxRequest(request)) {
        const viewModel = await createDocumentDetailViewModel(queryValue(request), request.params.id);

        if (!viewModel) {
          return reply.code(404).view("pages/document-not-found.ejs", {
            ...(await withDialog(request, {})),
            title: "Document Not Found",
            ...(await createBaseViewModel("documents", queryValue(request))),
            missingDocumentId: request.params.id,
          });
        }

        return reply
          .code(400)
          .type("text/html")
          .send(await renderDocumentAttachmentsFragment({
            ...viewModel,
            saveError: saveErrorValue(request),
            saveStatus: saveStatusValue(request),
            journalError: journalErrorValue(request),
            journalStatus: journalStatusValue(request),
            submitError: submitErrorValue(request),
            submitStatus: submitStatusValue(request),
            approveError: approveErrorValue(request),
            approveStatus: approveStatusValue(request),
            rejectError: rejectErrorValue(request),
            rejectStatus: rejectStatusValue(request),
            archiveError: archiveErrorValue(request),
            archiveStatus: archiveStatusValue(request),
            nextFormError: nextFormErrorValue(request),
            nextFormStatus: nextFormStatusValue(request),
            uploadError: "Bitte eine gueltige Datei auswaehlen.",
            uploadStatus: uploadStatusValue(request),
          }));
      }

      return reply.redirect(
        buildDialogRedirect(`/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Upload nicht moeglich",
          message: "Bitte eine gueltige Datei auswaehlen.",
        }),
        303,
      );
    }

    const result = await uploadAttachmentForUser({
      documentId: request.params.id,
      userId: activeUser.id,
      file,
    });

    if (!result.ok && result.reason === "document_not_visible") {
      return reply.code(404).view("pages/document-not-found.ejs", {
        ...(await withDialog(request, {})),
        title: "Document Not Found",
        ...(await createBaseViewModel("documents", queryValue(request))),
        missingDocumentId: request.params.id,
      });
    }

    if (!result.ok) {
      if (isHtmxRequest(request)) {
        const viewModel = await createDocumentDetailViewModel(queryValue(request), request.params.id);

        if (!viewModel) {
          return reply.code(404).view("pages/document-not-found.ejs", {
            ...(await withDialog(request, {})),
            title: "Document Not Found",
            ...(await createBaseViewModel("documents", queryValue(request))),
            missingDocumentId: request.params.id,
          });
        }

        return reply
          .code(400)
          .type("text/html")
          .send(await renderDocumentAttachmentsFragment({
            ...viewModel,
            saveError: saveErrorValue(request),
            saveStatus: saveStatusValue(request),
            journalError: journalErrorValue(request),
            journalStatus: journalStatusValue(request),
            submitError: submitErrorValue(request),
            submitStatus: submitStatusValue(request),
            approveError: approveErrorValue(request),
            approveStatus: approveStatusValue(request),
            rejectError: rejectErrorValue(request),
            rejectStatus: rejectStatusValue(request),
            archiveError: archiveErrorValue(request),
            archiveStatus: archiveStatusValue(request),
            nextFormError: nextFormErrorValue(request),
            nextFormStatus: nextFormStatusValue(request),
            uploadError: result.details ?? "Upload ist fuer dieses Dokument nicht moeglich.",
            uploadStatus: uploadStatusValue(request),
          }));
      }

      return reply.redirect(
        buildDialogRedirect(`/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Upload nicht moeglich",
          message: result.details ?? "Upload ist fuer dieses Dokument nicht moeglich.",
        }),
        303,
      );
    }

    if (isHtmxRequest(request)) {
      const viewModel = await createDocumentDetailViewModel(queryValue(request), request.params.id);

      if (!viewModel) {
        return reply.code(404).view("pages/document-not-found.ejs", {
          ...(await withDialog(request, {})),
          title: "Document Not Found",
          ...(await createBaseViewModel("documents", queryValue(request))),
          missingDocumentId: request.params.id,
        });
      }

      return reply.type("text/html").send(await renderDocumentAttachmentsFragment({
        ...viewModel,
        saveError: saveErrorValue(request),
        saveStatus: saveStatusValue(request),
        journalError: journalErrorValue(request),
        journalStatus: journalStatusValue(request),
        submitError: submitErrorValue(request),
        submitStatus: submitStatusValue(request),
        approveError: approveErrorValue(request),
        approveStatus: approveStatusValue(request),
        rejectError: rejectErrorValue(request),
        rejectStatus: rejectStatusValue(request),
        archiveError: archiveErrorValue(request),
        archiveStatus: archiveStatusValue(request),
        nextFormError: nextFormErrorValue(request),
        nextFormStatus: nextFormStatusValue(request),
        uploadError: uploadErrorValue(request),
        uploadStatus: "Attachment hochgeladen.",
      }, {
        includeHistoryOob: true,
      }));
    }

    return reply.redirect(
      `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&uploadStatus=${encodeURIComponent("Attachment hochgeladen.")}`,
      303,
    );
  });

  app.get<{ Params: { id: string } }>("/attachments/:id/content", async (request, reply) => {
    const users = await listUsers();
    const activeUser = await getActiveUser(queryValue(request), users);
    const attachment = await findAttachmentAssetVisibleToUser(request.params.id, activeUser.id);

    if (!attachment) {
      return reply.code(404).send("Attachment not found.");
    }

    const filePath = path.join(process.cwd(), "storage", attachment.storageKey);
    let fileBuffer: Buffer;

    try {
      fileBuffer = await readFile(filePath);
    } catch {
      return reply.code(404).send("Attachment not found.");
    }

    return reply
      .header("Content-Disposition", `inline; filename="${attachment.filename}"`)
      .type(attachment.mimeType)
      .send(fileBuffer);
  });

  app.get("/admin", async (request, reply) => {
    return renderPage(request, reply, "admin", "admin", "Admin");
  });
};
