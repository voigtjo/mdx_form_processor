import { randomUUID } from "node:crypto";
import { withDbTransaction } from "../../db/pool.js";

export const createTemplateAssignment = async (input: {
  groupId: string;
  templateId: string;
}): Promise<{ id: string }> => {
  const groupId = input.groupId.trim();
  const templateId = input.templateId.trim();

  if (!groupId || !templateId) {
    throw new Error("Group und Template sind fuer ein Assignment erforderlich.");
  }

  return withDbTransaction(async (client) => {
    const groupResult = await client.query<{ id: string }>(
      `select id from groups where id = $1 limit 1`,
      [groupId],
    );
    const templateResult = await client.query<{ id: string }>(
      `select id from form_templates where id = $1 limit 1`,
      [templateId],
    );
    const existingAssignment = await client.query<{ id: string }>(
      `select id from template_assignments where group_id = $1 and template_id = $2 limit 1`,
      [groupId, templateId],
    );

    if (!groupResult.rowCount) {
      throw new Error("Die ausgewaehlte Group wurde nicht gefunden.");
    }

    if (!templateResult.rowCount) {
      throw new Error("Das ausgewaehlte Template wurde nicht gefunden.");
    }

    if (existingAssignment.rowCount) {
      throw new Error("Dieses Template Assignment existiert bereits.");
    }

    const id = randomUUID();

    await client.query(
      `insert into template_assignments (id, template_id, group_id, status)
       values ($1, $2, $3, 'active')`,
      [id, templateId, groupId],
    );

    return { id };
  });
};

export const removeTemplateAssignment = async (input: {
  assignmentId: string;
  groupId: string;
}): Promise<void> => {
  const assignmentId = input.assignmentId.trim();
  const groupId = input.groupId.trim();

  if (!assignmentId || !groupId) {
    throw new Error("Assignment und Group sind fuer das Entfernen erforderlich.");
  }

  await withDbTransaction(async (client) => {
    const result = await client.query(
      `delete from template_assignments
       where id = $1 and group_id = $2`,
      [assignmentId, groupId],
    );

    if (!result.rowCount) {
      throw new Error("Das Template Assignment konnte nicht entfernt werden.");
    }
  });
};
