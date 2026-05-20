import { Mistake, ReviewResult } from "./types";

const INTERVALS = [1, 3, 7, 15, 30];

export function getNextReviewDate(mistake: Mistake): string | null {
  const masteredCount = mistake.reviewHistory.filter(
    (r) => r.result === "mastered"
  ).length;

  if (masteredCount >= INTERVALS.length) {
    return null;
  }

  const lastReview = mistake.reviewHistory[mistake.reviewHistory.length - 1];
  const baseDate = lastReview ? new Date(lastReview.date) : new Date(mistake.createdAt);
  const interval = INTERVALS[masteredCount];

  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + interval);
  return nextDate.toISOString().split("T")[0];
}

export function isDueForReview(mistake: Mistake): boolean {
  const nextDate = getNextReviewDate(mistake);
  if (nextDate === null) return false;

  const today = new Date().toISOString().split("T")[0];
  return nextDate <= today;
}

export function addReviewRecord(
  mistake: Mistake,
  result: ReviewResult
): Mistake {
  const today = new Date().toISOString().split("T")[0];
  return {
    ...mistake,
    reviewHistory: [
      ...mistake.reviewHistory,
      { date: today, result },
    ],
  };
}
