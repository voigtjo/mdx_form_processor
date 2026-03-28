import { withDb, withDbTransaction } from "../../db/pool.js";
import { buildReadOnlyFormDefinition } from "../templates/form-read.js";
import type { WorkflowFieldRules } from "../../types/domain.js";

type JournalDocumentRow = {
  id: string;
  status: string;
  data_json: Record<string, unknown> | null;
  template_id: string;
  template_key: string;
  template_name: string;
  template_description: string | null;
  template_status: "active" | "inactive" | "draft" | "published" | "archived";
  template_version: number;
  template_mdx_body: string;
  workflow_field_rules: WorkflowFieldRules | null;
};

type AddJournalEntryInput = {
  documentId: string;
  userId: string;
  userDisplayName: string;
  journalFieldName: string;
  entryText: string;
};

type AddJournalEntrySuccess = {
  ok: true;
  documentId: string;
  journalFieldName: string;
};

type AddJournalEntryFailure = {
  ok: false;
  reason: "document_not_visible" | "journal_not_editable" | "invalid_entry";
  details?: string;
};

export type AddJournalEntryResult = AddJournalEntrySuccess | AddJournalEntryFailure;

const findVisibleDocumentForJournal = async (
  documentId: string,
  userId: string,
): Promise<JournalDocumentRow | null> => {
  return withDb(async (client) => {
    const result = await client.query<JournalDocumentRow>(
      `
      select distinct on (d.id)
        d.id,
        d.status,
        d.data_json,
        d.template_id,
        ft.key as template_key,
        ft.name as template_name,
        ft.description as template_description,
        ft.status as template_status,
        d.template_version,
        ft.mdx_body as template_mdx_body,
        wt.workflow_json->'fieldRules' as workflow_field_rules
      from documents d
      inner join form_templates ft on ft.id = d.template_id
      inner join workflow_templates wt on wt.id = d.workflow_template_id
      inner join template_assignments ta on ta.template_id = d.template_id and ta.status = 'active'
      inner join memberships m on m.group_id = ta.group_id
      where d.id = $1
        and m.user_id = $2
      order by d.id
      `,
      [documentId, userId],
    );

    return result.rows[0] ?? null;
  });
};

const normalizeExistingJournalEntries = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry));
};

export const addJournalEntryForUser = async ({
  documentId,
  userId,
  userDisplayName,
  journalFieldName,
  entryText,
}: AddJournalEntryInput): Promise<AddJournalEntryResult> => {
  const visibleDocument = await findVisibleDocumentForJournal(documentId, userId);

  if (!visibleDocument) {
    return {
      ok: false,
      reason: "document_not_visible",
    };
  }

  const trimmedEntryText = entryText.trim();

  if (trimmedEntryText.length === 0) {
    return {
      ok: false,
      reason: "invalid_entry",
      details: "Bitte einen Journal-Eintrag erfassen.",
    };
  }

  const formDefinition = buildReadOnlyFormDefinition({
    templateId: visibleDocument.template_id,
    templateKey: visibleDocument.template_key,
    templateName: visibleDocument.template_name,
    templateVersion: visibleDocument.template_version,
    templateStatus: visibleDocument.template_status,
    ...(visibleDocument.template_description ? { templateDescription: visibleDocument.template_description } : {}),
    mdxBody: visibleDocument.template_mdx_body,
    documentStatus: visibleDocument.status,
    documentData: visibleDocument.data_json ?? {},
    workflowFieldRules: visibleDocument.workflow_field_rules ?? {},
  });

  const journal = formDefinition.journals.find((entry) => entry.name === journalFieldName);

  if (!journal || !journal.isEditable) {
    return {
      ok: false,
      reason: "journal_not_editable",
      details: "Journal ist im aktuellen Status nicht bearbeitbar.",
    };
  }

  const existingEntries = normalizeExistingJournalEntries((visibleDocument.data_json ?? {})[journalFieldName]);
  const nextEntry = {
    at: new Date().toISOString(),
    text: trimmedEntryText,
    by: userDisplayName,
  };
  const mergedDocumentData = {
    ...(visibleDocument.data_json ?? {}),
    [journalFieldName]: [...existingEntries, nextEntry],
  };

  return withDbTransaction(async (client) => {
    await client.query(
      `
      update documents
      set data_json = $2::jsonb,
          updated_at = now()
      where id = $1
      `,
      [documentId, JSON.stringify(mergedDocumentData)],
    );

    await client.query(
      `
      insert into audit_events (document_id, event_type, actor_user_id, message, payload_json)
      values ($1, 'journal_added', $2, $3, $4::jsonb)
      `,
      [
        documentId,
        userId,
        `Journal entry added to ${journal.label}.`,
        JSON.stringify({
          journalFieldName,
          entryText: trimmedEntryText,
        }),
      ],
    );

    return {
      ok: true,
      documentId,
      journalFieldName,
    };
  });
};
