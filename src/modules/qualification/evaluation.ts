import {
  getQualificationAttendeeUserIds,
  getQualificationSubmittedEditorUserIds,
  normalizeQualificationParticipantStates,
} from "./progress.js";

const requiredTopics = ["Arbeitsschutz", "Dokumentation"] as const;

const normalizeText = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }

  return [];
};

const resultPoints: Record<string, number> = {
  sicher: 2,
  teilweise: 1,
  offen: 0,
};

export type QualificationEvaluation = {
  evaluationStatus: "pending" | "passed" | "failed";
  scoreValue: number;
  passed: boolean;
  evaluatedAt: string;
  completedParticipants: number;
  requiredParticipants: number;
};

export const evaluateQualificationDocumentData = (data: Record<string, unknown>): QualificationEvaluation => {
  const participantStates = normalizeQualificationParticipantStates(data);
  const requiredParticipantIds = getQualificationAttendeeUserIds(data);
  const submittedParticipantIds = getQualificationSubmittedEditorUserIds({
    data,
    requiredEditorUserIds: requiredParticipantIds,
  });

  const participantEvaluations = requiredParticipantIds.map((userId) => {
    const state = participantStates[userId] ?? {};
    const result = normalizeText(state.fieldValues?.qualification_result);
    const topics = normalizeStringArray(state.fieldValues?.qualification_topics);
    const hasRequiredTopics = requiredTopics.every((topic) => topics.includes(topic));
    const hasMinimumConfidence = result === "sicher" || result === "teilweise";

    return {
      userId,
      result,
      topics,
      hasRequiredTopics,
      hasMinimumConfidence,
      scoreValue: (resultPoints[result] ?? 0) + topics.length,
      hasAnswered: result.length > 0 || topics.length > 0,
      hasSubmitted: submittedParticipantIds.includes(userId),
    };
  });

  const completedParticipants = participantEvaluations.filter((entry) => entry.hasAnswered).length;
  const scoreValue = participantEvaluations.reduce((sum, entry) => sum + entry.scoreValue, 0);
  const passed =
    participantEvaluations.length > 0 &&
    participantEvaluations.every((entry) => entry.hasRequiredTopics && entry.hasMinimumConfidence && entry.hasSubmitted);

  const evaluationStatus =
    completedParticipants < participantEvaluations.length || participantEvaluations.length === 0
      ? "pending"
      : passed
        ? "passed"
        : "failed";

  return {
    evaluationStatus,
    scoreValue,
    passed,
    evaluatedAt: new Date().toISOString(),
    completedParticipants,
    requiredParticipants: participantEvaluations.length,
  };
};

export const applyQualificationEvaluationToData = (data: Record<string, unknown>): Record<string, unknown> => {
  const evaluation = evaluateQualificationDocumentData(data);

  return {
    ...data,
    evaluation_status: evaluation.evaluationStatus,
    score_value: evaluation.scoreValue,
    passed: evaluation.passed,
    evaluated_at: evaluation.evaluatedAt,
  };
};
