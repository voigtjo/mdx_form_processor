export type QualificationPageKey = "record" | "questions" | "approval";

export type QualificationPageDefinition = {
  key: QualificationPageKey;
  title: string;
  sectionTitles: string[];
};

export const qualificationPages: QualificationPageDefinition[] = [
  {
    key: "record",
    title: "Nachweis / Stammdaten",
    sectionTitles: ["Nachweis", "Beteiligte"],
  },
  {
    key: "questions",
    title: "Fragen / Selbsteinschaetzung / Themen",
    sectionTitles: ["Fragen"],
  },
  {
    key: "approval",
    title: "Freigabe / Signatur / Ergebnis",
    sectionTitles: ["Freigabe"],
  },
];

export const qualificationPageCount = qualificationPages.length;

export const normalizeQualificationPageIndex = (value: unknown): number => {
  const parsed = Number.parseInt(typeof value === "string" ? value : String(value ?? ""), 10);

  if (!Number.isFinite(parsed)) {
    return 1;
  }

  return Math.min(Math.max(parsed, 1), qualificationPageCount);
};

export const getQualificationPageDefinition = (pageIndex: number): QualificationPageDefinition =>
  qualificationPages[normalizeQualificationPageIndex(pageIndex) - 1] ?? qualificationPages[qualificationPages.length - 1]!;
