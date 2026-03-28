import { withDb } from "../../db/pool.js";
import type { Assignment } from "../../types/domain.js";

type AssignmentRow = {
  id: string;
  document_id: string;
  user_id: string;
  role: Assignment["role"];
  active: boolean;
};

const mapAssignment = (row: AssignmentRow): Assignment => ({
  id: row.id,
  documentId: row.document_id,
  userId: row.user_id,
  role: row.role,
  active: row.active,
});

export const listAssignments = async (): Promise<Assignment[]> => {
  return withDb(async (client) => {
    const result = await client.query<AssignmentRow>(
      `select id, document_id, user_id, role, active
       from document_assignments
       order by assigned_at asc`,
    );

    return result.rows.map(mapAssignment);
  });
};

export const listAssignmentsForDocument = async (documentId: string): Promise<Assignment[]> => {
  return withDb(async (client) => {
    const result = await client.query<AssignmentRow>(
      `select id, document_id, user_id, role, active
       from document_assignments
       where document_id = $1
       order by assigned_at asc`,
      [documentId],
    );

    return result.rows.map(mapAssignment);
  });
};
