import { withDb } from "../../db/pool.js";
import type { Attachment, AttachmentAsset } from "../../types/domain.js";

type AttachmentRow = {
  id: string;
  document_id: string;
  filename: string;
  mime_type: string;
  size: number;
  storage_key: string;
  uploaded_by: string;
  created_at: Date;
};

const mapAttachment = (row: AttachmentRow): Attachment => ({
  id: row.id,
  documentId: row.document_id,
  filename: row.filename,
  mimeType: row.mime_type,
  size: Number(row.size),
  uploadedBy: row.uploaded_by,
  createdAt: row.created_at.toISOString(),
});

const mapAttachmentAsset = (row: AttachmentRow): AttachmentAsset => ({
  id: row.id,
  documentId: row.document_id,
  filename: row.filename,
  mimeType: row.mime_type,
  storageKey: row.storage_key,
});

export const listAttachmentsForDocument = async (documentId: string): Promise<Attachment[]> => {
  return withDb(async (client) => {
    const result = await client.query<AttachmentRow>(
      `select id, document_id, filename, mime_type, size, storage_key, uploaded_by, created_at
       from attachments
       where document_id = $1
       order by created_at asc`,
      [documentId],
    );

    return result.rows.map(mapAttachment);
  });
};

export const findAttachmentAssetVisibleToUser = async (
  attachmentId: string,
  userId: string,
): Promise<AttachmentAsset | null> => {
  return withDb(async (client) => {
    const result = await client.query<AttachmentRow>(
      `
      select distinct on (a.id)
        a.id,
        a.document_id,
        a.filename,
        a.mime_type,
        a.size,
        a.storage_key,
        a.uploaded_by,
        a.created_at
      from attachments a
      inner join documents d on d.id = a.document_id
      inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
      inner join memberships m on m.group_id = ta.group_id and m.rights like '%r%'
      where a.id = $1
        and m.user_id = $2
      order by a.id
      `,
      [attachmentId, userId],
    );

    const row = result.rows[0];
    return row ? mapAttachmentAsset(row) : null;
  });
};
