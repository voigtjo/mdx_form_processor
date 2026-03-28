import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyError } from "fastify";
import { createBaseViewModel, createDocumentDetailViewModel } from "../services/app-context.js";
import { findAttachmentAssetVisibleToUser } from "../modules/attachments/read.js";
import { parseSingleAttachmentUpload, uploadAttachmentForUser } from "../modules/attachments/upload.js";
import { approveDocumentForUser } from "../modules/documents/approve.js";
import { archiveDocumentForUser } from "../modules/documents/archive.js";
import { rejectDocumentForUser } from "../modules/documents/reject.js";
import { saveDocumentValuesForUser } from "../modules/documents/save.js";
import { startDocumentForUser } from "../modules/documents/start.js";
import { submitDocumentForUser } from "../modules/documents/submit.js";
import { getActiveUser } from "../services/app-context.js";
import { listUsers } from "../modules/users/read.js";

type UserQuery = {
  user?: string;
  startError?: string;
  saveError?: string;
  saveStatus?: string;
  submitError?: string;
  submitStatus?: string;
  approveError?: string;
  approveStatus?: string;
  rejectError?: string;
  rejectStatus?: string;
  archiveError?: string;
  archiveStatus?: string;
  uploadError?: string;
  uploadStatus?: string;
  dialogType?: "error" | "info";
  dialogTitle?: string;
  dialogMessage?: string;
};

const query = (request: FastifyRequest): UserQuery => request.query as UserQuery;

const queryValue = (request: FastifyRequest): string | undefined => query(request).user;
const startErrorValue = (request: FastifyRequest): string | undefined => query(request).startError;
const saveErrorValue = (request: FastifyRequest): string | undefined => query(request).saveError;
const saveStatusValue = (request: FastifyRequest): string | undefined => query(request).saveStatus;
const submitErrorValue = (request: FastifyRequest): string | undefined => query(request).submitError;
const submitStatusValue = (request: FastifyRequest): string | undefined => query(request).submitStatus;
const approveErrorValue = (request: FastifyRequest): string | undefined => query(request).approveError;
const approveStatusValue = (request: FastifyRequest): string | undefined => query(request).approveStatus;
const rejectErrorValue = (request: FastifyRequest): string | undefined => query(request).rejectError;
const rejectStatusValue = (request: FastifyRequest): string | undefined => query(request).rejectStatus;
const archiveErrorValue = (request: FastifyRequest): string | undefined => query(request).archiveError;
const archiveStatusValue = (request: FastifyRequest): string | undefined => query(request).archiveStatus;
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

const withDialog = async (request: FastifyRequest, input: Record<string, unknown>) => {
  const appDialog = dialogState(request);
  return appDialog ? { ...input, appDialog } : input;
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
  section: "workspace" | "templates" | "workflows" | "documents" | "admin",
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

  app.get("/workspace", async (request, reply) => {
    return renderPage(request, reply, "workspace", "workspace", "My Workspace");
  });

  app.get("/templates", async (request, reply) => {
    return renderPage(request, reply, "templates", "templates", "Templates");
  });

  app.get("/workflows", async (request, reply) => {
    return renderPage(request, reply, "workflows", "workflows", "Workflows");
  });

  app.get("/documents", async (request, reply) => {
    return reply.view("pages/documents.ejs", await withDialog(request, {
      title: "Documents",
      ...(await createBaseViewModel("documents", queryValue(request))),
      startError: startErrorValue(request),
    }));
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
        `/documents?user=${encodeURIComponent(activeUser.key)}&startError=${encodeURIComponent("Template ist nicht sichtbar oder nicht startbar.")}`,
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
      submitError: submitErrorValue(request),
      submitStatus: submitStatusValue(request),
      approveError: approveErrorValue(request),
      approveStatus: approveStatusValue(request),
      rejectError: rejectErrorValue(request),
      rejectStatus: rejectStatusValue(request),
      archiveError: archiveErrorValue(request),
      archiveStatus: archiveStatusValue(request),
      uploadError: uploadErrorValue(request),
      uploadStatus: uploadStatusValue(request),
    }));
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
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&saveError=${encodeURIComponent("Keine speicherbaren Felder im aktuellen Status verfuegbar.")}`,
        303,
      );
    }

    return reply.redirect(
      `/documents/${encodeURIComponent(result.documentId)}?user=${encodeURIComponent(activeUser.key)}&saveStatus=${encodeURIComponent("Werte gespeichert.")}`,
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
          : "Submit ist im aktuellen Status nicht verfuegbar.";

      return reply.redirect(
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&submitError=${encodeURIComponent(message)}`,
        303,
      );
    }

    return reply.redirect(
      `/documents/${encodeURIComponent(result.documentId)}?user=${encodeURIComponent(activeUser.key)}&submitStatus=${encodeURIComponent(`Dokument wurde nach ${result.nextStatus} ueberfuehrt.`)}`,
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
      return reply.redirect(
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&approveError=${encodeURIComponent("Approve ist im aktuellen Status nicht verfuegbar.")}`,
        303,
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
      return reply.redirect(
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&rejectError=${encodeURIComponent("Reject ist im aktuellen Status nicht verfuegbar.")}`,
        303,
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
        `/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}&archiveError=${encodeURIComponent("Archive ist im aktuellen Status nicht verfuegbar.")}`,
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
      return reply.redirect(
        buildDialogRedirect(`/documents/${encodeURIComponent(request.params.id)}?user=${encodeURIComponent(activeUser.key)}`, {
          title: "Upload nicht moeglich",
          message: result.details ?? "Upload ist fuer dieses Dokument nicht moeglich.",
        }),
        303,
      );
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
