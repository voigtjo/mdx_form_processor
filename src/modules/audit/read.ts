import { withDb } from "../../db/pool.js";
import type { AuditEvent } from "../../types/domain.js";

type AuditEventRow = {
  id: string;
  document_id: string;
  event_type: string;
  actor_user_id: string | null;
  message: string | null;
  created_at: Date;
};

const mapAuditEvent = (row: AuditEventRow): AuditEvent => ({
  id: row.id,
  documentId: row.document_id,
  eventType: row.event_type,
  ...(row.actor_user_id ? { actorUserId: row.actor_user_id } : {}),
  message: row.message ?? "",
  createdAt: row.created_at.toISOString(),
});

export const listAuditEvents = async (): Promise<AuditEvent[]> => {
  return withDb(async (client) => {
    const result = await client.query<AuditEventRow>(
      `select id, document_id, event_type, actor_user_id, message, created_at
       from audit_events
       order by created_at asc`,
    );

    return result.rows.map(mapAuditEvent);
  });
};

export const listAuditEventsForDocument = async (documentId: string): Promise<AuditEvent[]> => {
  return withDb(async (client) => {
    const result = await client.query<AuditEventRow>(
      `select id, document_id, event_type, actor_user_id, message, created_at
       from audit_events
       where document_id = $1
       order by created_at asc`,
      [documentId],
    );

    return result.rows.map(mapAuditEvent);
  });
};
