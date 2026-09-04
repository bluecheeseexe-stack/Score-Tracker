export interface Assessment {
  id: string;
  name: string;
  file: string;
  rawScore: number;
  totalItems: number;
  rating: number; // (rawScore * 60 / totalItems) + 40
  date: string;
  notes?: string;
  createdAt: number;
}

export interface UserProfile {
  username: string;
  displayName: string;
  pin: string;
  targetRating: number;
  files: string[];
  assessments: Assessment[];
}

export type LayoutOption = 'bento' | 'split' | 'tabbed' | 'stacked';
export type ThemeOption = 'emerald' | 'forest' | 'sage';

export interface ProgressStats {
  averageRating: number;
  latestRating: number | null;
  targetRating: number;
  pointsToGoal: number;
  isGoalReached: boolean;
  totalAssessments: number;
  totalRawScore: number;
  totalItems: number;
  overallAccuracy: number;
  passedCount: number;
  highestRating: number | null;
  lowestRating: number | null;
}
