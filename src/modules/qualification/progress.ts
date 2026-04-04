import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import type { Assignment, User } from "../../types/domain.js";
import type { WorkflowJson } from "../documents/access.js";

export type QualificationParticipantState = {
  savedAt?: string;
  submittedAt?: string;
  signature?: string;
  signatureAt?: string;
  currentPage?: number;
  fieldValues?: Record<string, string | string[]>;
};

export type QualificationParticipantProgressRow = {
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
};

export type QualificationProgressView = {
  rows: QualificationParticipantProgressRow[];
  submitModeLabel: "AND" | "OR";
  approvalModeLabel: "AND" | "OR";
  submitProgressLabel: string;
  submitCount: number;
  submitRequiredCount: number;
  currentUserRoles: Array<"editor" | "approver">;
};

type DocumentAssignmentRow = {
  id: string;
  user_id: string;
  role: "editor" | "approver";
  active: boolean;
};

type TaskRow = {
  id: string;
  user_id: string;
  action: string;
  role: "editor" | "approver";
  status: "open" | "closed";
};

const normalizeString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

export const getQualificationOwnerUserId = (data: Record<string, unknown>): string =>
  normalizeString(data.owner_user_id);

export const getQualificationAttendeeUserIds = (data: Record<string, unknown>): string[] => {
  const raw = data.attendee_user_ids;

  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw.split(",").map((entry) => entry.trim()).filter(Boolean);
  }

  return [];
};

export const normalizeQualificationParticipantStates = (
  data: Record<string, unknown>,
): Record<string, QualificationParticipantState> => {
  const raw = data.qualification_participant_states;

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(raw as Record<string, unknown>).flatMap(([userId, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return [];
      }

      const record = value as Record<string, unknown>;
      const state: QualificationParticipantState = {
        ...(typeof record.savedAt === "string" ? { savedAt: record.savedAt } : {}),
        ...(typeof record.submittedAt === "string" ? { submittedAt: record.submittedAt } : {}),
        ...(typeof record.signature === "string" ? { signature: record.signature } : {}),
        ...(typeof record.signatureAt === "string" ? { signatureAt: record.signatureAt } : {}),
        ...(typeof record.currentPage === "number" ? { currentPage: record.currentPage } : {}),
        ...(record.fieldValues && typeof record.fieldValues === "object" && !Array.isArray(record.fieldValues)
          ? {
              fieldValues: Object.fromEntries(
                Object.entries(record.fieldValues as Record<string, unknown>).reduce<Array<[string, string | string[]]>>(
                  (entries, [fieldName, fieldValue]) => {
                    if (typeof fieldValue === "string") {
                      entries.push([fieldName, fieldValue]);
                    } else if (Array.isArray(fieldValue)) {
                      entries.push([
                        fieldName,
                        fieldValue.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean),
                      ]);
                    }

                    return entries;
                  },
                  [],
                ),
              ),
            }
          : {}),
      };

      return [[userId, state] as const];
    }),
  );
};

export const writeQualificationParticipantState = (input: {
  data: Record<string, unknown>;
  userId: string;
  patch: Partial<QualificationParticipantState>;
}): Record<string, unknown> => {
  const states = normalizeQualificationParticipantStates(input.data);
  const currentState = states[input.userId] ?? {};
  const nextState: QualificationParticipantState = {
    ...currentState,
    ...input.patch,
  };

  return {
    ...input.data,
    qualification_participant_states: {
      ...states,
      [input.userId]: nextState,
    },
  };
};

export const getQualificationCurrentUserState = (data: Record<string, unknown>, userId: string): QualificationParticipantState =>
  normalizeQualificationParticipantStates(data)[userId] ?? {};

const resolveWorkflowModeLabel = (value: string | undefined): "AND" | "OR" => {
  return value === "all" || value === "and" ? "AND" : "OR";
};

export const getQualificationSubmitModeLabel = (workflowJson: WorkflowJson): "AND" | "OR" => {
  const actionMode = workflowJson.actions?.submit?.completionMode;
  const approvalMode = workflowJson.approval?.submitMode;
  return resolveWorkflowModeLabel(actionMode ?? approvalMode);
};

export const getQualificationApprovalModeLabel = (workflowJson: WorkflowJson): "AND" | "OR" => {
  const actionMode = workflowJson.actions?.approve?.completionMode;
  const approvalMode = workflowJson.approval?.approvalMode;
  return resolveWorkflowModeLabel(actionMode ?? approvalMode);
};

export const getQualificationRequiredEditorUserIds = (
  data: Record<string, unknown>,
  assignments?: Assignment[],
): string[] => {
  const attendeeIds = getQualificationAttendeeUserIds(data);

  if (!assignments || assignments.length === 0) {
    return attendeeIds;
  }

  const assignedEditors = assignments
    .filter((assignment) => assignment.active && assignment.role === "editor")
    .map((assignment) => assignment.userId);

  return assignedEditors.length > 0 ? assignedEditors : attendeeIds;
};

export const getQualificationSubmittedEditorUserIds = (input: {
  data: Record<string, unknown>;
  requiredEditorUserIds: string[];
}): string[] => {
  const states = normalizeQualificationParticipantStates(input.data);

  return input.requiredEditorUserIds.filter((userId) => typeof states[userId]?.submittedAt === "string");
};

export const buildQualificationProgressView = (input: {
  data: Record<string, unknown>;
  assignments: Assignment[];
  users: User[];
  currentUserId: string;
  workflowJson: WorkflowJson;
}): QualificationProgressView => {
  const ownerUserId = getQualificationOwnerUserId(input.data);
  const attendeeIds = getQualificationAttendeeUserIds(input.data);
  const participantStates = normalizeQualificationParticipantStates(input.data);
  const requiredEditorUserIds = getQualificationRequiredEditorUserIds(input.data, input.assignments);
  const submittedEditorUserIds = getQualificationSubmittedEditorUserIds({
    data: input.data,
    requiredEditorUserIds,
  });
  const currentUserRoles = input.assignments
    .filter((assignment) => assignment.active && assignment.userId === input.currentUserId)
    .map((assignment) => assignment.role);
  const visibleUserIds = Array.from(
    new Set([
      ...attendeeIds,
      ownerUserId,
      ...input.assignments.filter((assignment) => assignment.active).map((assignment) => assignment.userId),
    ].filter((value) => value && value.length > 0)),
  );

  const rows = visibleUserIds.map((userId) => {
    const user = input.users.find((entry) => entry.id === userId);
    const roles = input.assignments
      .filter((assignment) => assignment.active && assignment.userId === userId)
      .map((assignment) => assignment.role);
    const participantState = participantStates[userId] ?? {};
    const lastUpdatedAt = participantState.submittedAt ?? participantState.signatureAt ?? participantState.savedAt;

    return {
      userId,
      ...(user ? { userKey: user.key } : {}),
      displayName: user?.displayName ?? userId,
      participationLabel:
        userId === ownerUserId && attendeeIds.includes(userId)
          ? "Verantwortlich, Teilnehmend"
          : userId === ownerUserId
            ? "Verantwortlich"
            : attendeeIds.includes(userId)
              ? "Teilnehmend"
              : "Beteiligt",
      workflowRoles: roles,
      saved: typeof participantState.savedAt === "string",
      submitted: typeof participantState.submittedAt === "string",
      signed: typeof participantState.signature === "string" && participantState.signature.length > 0,
      ...(lastUpdatedAt ? { lastUpdatedAt } : {}),
      isCurrentUser: userId === input.currentUserId,
    } satisfies QualificationParticipantProgressRow;
  });

  const submitModeLabel = getQualificationSubmitModeLabel(input.workflowJson);
  const approvalModeLabel = getQualificationApprovalModeLabel(input.workflowJson);

  return {
    rows,
    submitModeLabel,
    approvalModeLabel,
    submitProgressLabel: `${submittedEditorUserIds.length}/${requiredEditorUserIds.length || 0}`,
    submitCount: submittedEditorUserIds.length,
    submitRequiredCount: requiredEditorUserIds.length,
    currentUserRoles,
  };
};

export const synchronizeQualificationAssignments = async (input: {
  client: PoolClient;
  documentId: string;
  actorUserId: string;
  documentTitle: string;
  documentStatus: string;
  data: Record<string, unknown>;
}): Promise<void> => {
  const attendeeIds = getQualificationAttendeeUserIds(input.data);
  const ownerUserId = getQualificationOwnerUserId(input.data);
  const desiredAssignments = new Map<string, { userId: string; role: "editor" | "approver" }>();

  for (const attendeeId of attendeeIds) {
    desiredAssignments.set(`${attendeeId}:editor`, { userId: attendeeId, role: "editor" });
  }

  if (ownerUserId) {
    desiredAssignments.set(`${ownerUserId}:approver`, { userId: ownerUserId, role: "approver" });
  }

  const assignmentResult = await input.client.query<DocumentAssignmentRow>(
    `select id, user_id, role, active
     from document_assignments
     where document_id = $1`,
    [input.documentId],
  );

  for (const assignment of assignmentResult.rows) {
    const key = `${assignment.user_id}:${assignment.role}`;

    if (!desiredAssignments.has(key) && assignment.active) {
      await input.client.query(
        `update document_assignments
         set active = false
         where id = $1`,
        [assignment.id],
      );
      continue;
    }

    if (desiredAssignments.has(key) && !assignment.active) {
      await input.client.query(
        `update document_assignments
         set active = true
         where id = $1`,
        [assignment.id],
      );
    }
  }

  for (const assignment of desiredAssignments.values()) {
    await input.client.query(
      `insert into document_assignments (id, document_id, user_id, role, assigned_by, active)
       values ($1, $2, $3, $4, $5, true)
       on conflict (document_id, user_id, role)
       do update set active = true, assigned_by = excluded.assigned_by`,
      [randomUUID(), input.documentId, assignment.userId, assignment.role, input.actorUserId],
    );
  }

  const requiredEditorUserIds = attendeeIds;
  const submittedEditorUserIds = getQualificationSubmittedEditorUserIds({
    data: input.data,
    requiredEditorUserIds,
  });
  const taskResult = await input.client.query<TaskRow>(
    `select id, user_id, action, role, status
     from tasks
     where document_id = $1`,
    [input.documentId],
  );

  const upsertOpenTask = async (userId: string, action: string, role: "editor" | "approver", title: string) => {
    const existingTask = taskResult.rows.find((task) => task.user_id === userId && task.action === action && task.role === role);

    if (existingTask) {
      await input.client.query(
        `update tasks
         set status = 'open',
             title = $2,
             updated_at = now(),
             closed_at = null
         where id = $1`,
        [existingTask.id, title],
      );
      return;
    }

    await input.client.query(
      `insert into tasks (id, document_id, user_id, title, action, status, role)
       values ($1, $2, $3, $4, $5, 'open', $6)`,
      [randomUUID(), input.documentId, userId, title, action, role],
    );
  };

  const closeMatchingTasks = async (predicate: (task: TaskRow) => boolean) => {
    const matching = taskResult.rows.filter(predicate).map((task) => task.id);

    if (matching.length === 0) {
      return;
    }

    await input.client.query(
      `update tasks
       set status = 'closed',
           updated_at = now(),
           closed_at = now()
       where id = any($1::uuid[])`,
      [matching],
    );
  };

  if (input.documentStatus === "submitted") {
    await closeMatchingTasks((task) => task.role === "editor" && task.status === "open");

    if (ownerUserId) {
      await upsertOpenTask(ownerUserId, "approve", "approver", `Review ${input.documentTitle}`);
    }
  } else {
    for (const attendeeId of attendeeIds) {
      if (submittedEditorUserIds.includes(attendeeId)) {
        continue;
      }

      await upsertOpenTask(attendeeId, "submit", "editor", `Submit ${input.documentTitle}`);
    }

    await closeMatchingTasks((task) => task.role === "approver" && task.status === "open");
    await closeMatchingTasks((task) => task.role === "editor" && task.status === "open" && !attendeeIds.includes(task.user_id));
    await closeMatchingTasks((task) => task.role === "editor" && task.status === "open" && submittedEditorUserIds.includes(task.user_id));
  }
};
