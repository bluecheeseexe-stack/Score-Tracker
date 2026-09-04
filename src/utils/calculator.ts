import { Assessment, ProgressStats } from '../types';

/**
 * Licensure Examination for Professional Teachers (LEPT) Formula:
 * Rating = (raw score × 60 ÷ total items) + 40
 */
export function calculateLeptRating(rawScore: number, totalItems: number): number {
  if (!totalItems || totalItems <= 0) return 0;
  if (rawScore < 0) return 40;
  const rating = (rawScore * 60) / totalItems + 40;
  return Math.round(rating * 100) / 100;
}

export function formatRating(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '—';
  return val.toFixed(2);
}

export function computeProgressStats(assessments: Assessment[], targetRating: number): ProgressStats {
  const count = assessments.length;

  if (count === 0) {
    return {
      averageRating: 0,
      latestRating: null,
      targetRating,
      pointsToGoal: targetRating - 40,
      isGoalReached: false,
      totalAssessments: 0,
      totalRawScore: 0,
      totalItems: 0,
      overallAccuracy: 0,
      passedCount: 0,
      highestRating: null,
      lowestRating: null,
    };
  }

  // Sort by date or createdAt descending
  const sorted = [...assessments].sort((a, b) => b.createdAt - a.createdAt);
  const latestRating = sorted[0].rating;

  const totalRaw = assessments.reduce((sum, a) => sum + a.rawScore, 0);
  const totalItems = assessments.reduce((sum, a) => sum + a.totalItems, 0);
  const overallAccuracy = totalItems > 0 ? (totalRaw / totalItems) * 100 : 0;

  const sumRatings = assessments.reduce((sum, a) => sum + a.rating, 0);
  const averageRating = Math.round((sumRatings / count) * 100) / 100;

  // Passing criteria for LEPT standard is 75.00
  const passedCount = assessments.filter((a) => a.rating >= 75).length;

  const ratings = assessments.map((a) => a.rating);
  const highestRating = Math.max(...ratings);
  const lowestRating = Math.min(...ratings);

  // Points until goal from average rating
  const diff = targetRating - averageRating;
  const pointsToGoal = Math.round(Math.abs(diff) * 100) / 100;
  const isGoalReached = averageRating >= targetRating;

  return {
    averageRating,
    latestRating,
    targetRating,
    pointsToGoal,
    isGoalReached,
    totalAssessments: count,
    totalRawScore: totalRaw,
    totalItems,
    overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    passedCount,
    highestRating,
    lowestRating,
  };
}
