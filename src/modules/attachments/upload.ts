import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";
import { findDocumentAccessContextForUser, getDocumentEditStateForUser } from "../documents/access.js";
import { readTemplateFeatureToggles } from "../templates/features.js";

const blockedUploadStatuses = new Set(["submitted", "approved", "rejected", "archived"]);
const uploadStorageRoot = path.join(process.cwd(), "storage", "attachments");
const maxAttachmentSizeBytes = 3 * 1024 * 1024;

type AttachmentUploadState = {
  isAvailable: boolean;
  reason?: string;
};

type UploadedAttachmentFile = {
  filename: string;
  mimeType: string;
  content: Buffer;
};

type UploadAttachmentInput = {
  documentId: string;
  userId: string;
  file: UploadedAttachmentFile;
};

type UploadAttachmentSuccess = {
  ok: true;
  attachmentId: string;
};

type UploadAttachmentFailure = {
  ok: false;
  reason: "document_not_visible" | "upload_not_allowed" | "invalid_file";
  details?: string;
};

export type UploadAttachmentResult = UploadAttachmentSuccess | UploadAttachmentFailure;

const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
};

const isUploadAllowedForStatus = (status: string): boolean => {
  return !blockedUploadStatuses.has(status);
};

const getUploadBlockedReason = (status: string): string => {
  if (blockedUploadStatuses.has(status)) {
    return "Upload ist im aktuellen Dokumentstatus nicht verfuegbar.";
  }

  return "Upload ist fuer dieses Dokument nicht verfuegbar.";
};

export const getAttachmentUploadStateForUser = async (
  documentId: string,
  userId: string,
): Promise<AttachmentUploadState> => {
  const document = await findDocumentAccessContextForUser(documentId, userId);

  if (!document || !document.canRead) {
    return {
      isAvailable: false,
      reason: "Dokument ist nicht sichtbar.",
    };
  }

  const editState = await getDocumentEditStateForUser(documentId, userId);

  if (!editState.isAvailable) {
    return {
      isAvailable: false,
      ...(editState.reason ? { reason: editState.reason } : {}),
    };
  }

  const templateFeatures = readTemplateFeatureToggles({
    templateKey: document.templateKey,
    mdxBody: document.templateMdxBody,
  });

  if (!templateFeatures.attachments.enabled) {
    return {
      isAvailable: false,
      reason: "Attachments sind im aktuellen Template nicht aktiviert.",
    };
  }

  if (!isUploadAllowedForStatus(document.status)) {
    return {
      isAvailable: false,
      reason: getUploadBlockedReason(document.status),
    };
  }

  return {
    isAvailable: true,
  };
};

export const parseSingleAttachmentUpload = (
  contentTypeHeader: string | undefined,
  body: Buffer | undefined,
): UploadedAttachmentFile | null => {
  if (!contentTypeHeader || !body) {
    return null;
  }

  const boundaryMatch = contentTypeHeader.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = boundaryMatch?.[1] ?? boundaryMatch?.[2];

  if (!boundary) {
    return null;
  }

  const bodyText = body.toString("latin1");
  const parts = bodyText
    .split(`--${boundary}`)
    .map((part) => part.replace(/^\r\n/, "").replace(/\r\n$/, ""))
    .filter((part) => part.length > 0 && part !== "--");

  for (const part of parts) {
    const headerEnd = part.indexOf("\r\n\r\n");

    if (headerEnd < 0) {
      continue;
    }

    const headerText = part.slice(0, headerEnd);
    const contentText = part.slice(headerEnd + 4).replace(/\r\n$/, "");
    const headerLines = headerText.split("\r\n");
    const headers = new Map<string, string>();

    for (const line of headerLines) {
      const separatorIndex = line.indexOf(":");

      if (separatorIndex < 0) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim().toLowerCase();
      const value = line.slice(separatorIndex + 1).trim();
      headers.set(key, value);
    }

    const disposition = headers.get("content-disposition");
    const nameMatch = disposition?.match(/name="([^"]+)"/);
    const filenameMatch = disposition?.match(/filename="([^"]*)"/);

    if (nameMatch?.[1] !== "attachment") {
      continue;
    }

    const filename = filenameMatch?.[1];

    if (!filename) {
      return null;
    }

    return {
      filename,
      mimeType: headers.get("content-type") ?? "application/octet-stream",
      content: Buffer.from(contentText, "latin1"),
    };
  }

  return null;
};

export const uploadAttachmentForUser = async ({
  documentId,
  userId,
  file,
}: UploadAttachmentInput): Promise<UploadAttachmentResult> => {
  const document = await findDocumentAccessContextForUser(documentId, userId);

  if (!document || !document.canRead) {
    return {
      ok: false,
      reason: "document_not_visible",
    };
  }

  const editState = await getDocumentEditStateForUser(documentId, userId);

  if (!editState.isAvailable) {
    return {
      ok: false,
      reason: "upload_not_allowed",
      ...(editState.reason ? { details: editState.reason } : {}),
    };
  }

  const templateFeatures = readTemplateFeatureToggles({
    templateKey: document.templateKey,
    mdxBody: document.templateMdxBody,
  });

  if (!templateFeatures.attachments.enabled) {
    return {
      ok: false,
      reason: "upload_not_allowed",
      details: "Attachments sind im aktuellen Template nicht aktiviert.",
    };
  }

  if (!isUploadAllowedForStatus(document.status)) {
    return {
      ok: false,
      reason: "upload_not_allowed",
      details: getUploadBlockedReason(document.status),
    };
  }

  if (!file.filename || file.content.length === 0) {
    return {
      ok: false,
      reason: "invalid_file",
      details: "Bitte eine Datei auswaehlen.",
    };
  }

  if (file.content.length > maxAttachmentSizeBytes) {
    return {
      ok: false,
      reason: "invalid_file",
      details: "Datei ist zu gross. Maximal 3 MB sind in diesem MVP-Schritt erlaubt.",
    };
  }

  const attachmentId = randomUUID();
  const documentDirectory = path.join(uploadStorageRoot, documentId);
  const sanitizedFilename = sanitizeFilename(file.filename);
  const storageKey = path.join("attachments", documentId, `${attachmentId}-${sanitizedFilename}`);
  const storagePath = path.join(process.cwd(), "storage", storageKey);

  await mkdir(documentDirectory, { recursive: true });
  await writeFile(storagePath, file.content);

  try {
    await withDbTransaction(async (client) => {
      await client.query(
        `
        insert into attachments (id, document_id, filename, mime_type, size, storage_key, uploaded_by)
        values ($1, $2, $3, $4, $5, $6, $7)
        `,
        [attachmentId, documentId, file.filename, file.mimeType, file.content.length, storageKey, userId],
      );

      await client.query(
        `
        insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
        values ($1, 'attachment_uploaded', $2, $3, $4::jsonb)
        `,
        [
          documentId,
          userId,
          `Attachment ${file.filename} uploaded.`,
          JSON.stringify({
            attachmentId,
            filename: file.filename,
            mimeType: file.mimeType,
            size: file.content.length,
          }),
        ],
      );
    });
  } catch (error) {
    await rm(storagePath, { force: true });
    throw error;
  }

  return {
    ok: true,
    attachmentId,
  };
};
