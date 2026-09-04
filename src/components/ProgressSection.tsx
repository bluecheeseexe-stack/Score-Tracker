import React, { useState } from 'react';
import { Target, TrendingUp, Award, Compass, Edit3, Check, X, ShieldAlert, Sparkles, CheckCircle } from 'lucide-react';
import { ProgressStats, ThemeOption, Assessment } from '../types';
import { formatRating } from '../utils/calculator';
import { THEMES } from '../utils/theme';
import { AssessmentBarGraph } from './AssessmentBarGraph';

interface ProgressSectionProps {
  stats: ProgressStats;
  onUpdateTarget: (newTarget: number) => Promise<void>;
  theme?: ThemeOption;
  compact?: boolean;
  assessments?: Assessment[];
  files?: string[];
}

export const ProgressSection: React.FC<ProgressSectionProps> = ({
  stats,
  onUpdateTarget,
  theme = 'emerald',
  compact = false,
  assessments = [],
  files = [],
}) => {
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(stats.targetRating.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentTheme = THEMES[theme];

  const handleSaveTarget = async () => {
    const parsed = parseFloat(targetInput);
    if (isNaN(parsed) || parsed < 40 || parsed > 100) {
      setErrorMsg('Target must be between 40.0 and 100.0');
      return;
    }
    setErrorMsg(null);
    setIsSaving(true);
    try {
      await onUpdateTarget(parsed);
      setIsEditingTarget(false);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to update target');
    } finally {
      setIsSaving(false);
    }
  };

  // LEPT scale: minimum possible rating is 40.0, maximum is 100.0, passing mark is 75.0
  const currentMetric = stats.latestRating !== null ? stats.averageRating : 0;
  // Progress percentage between base (40) and maximum (100)
  const percentageOnScale = Math.min(100, Math.max(0, ((currentMetric - 40) / 60) * 100));
  const targetOnScale = Math.min(100, Math.max(0, ((stats.targetRating - 40) / 60) * 100));
  const passingOnScale = ((75 - 40) / 60) * 100; // 58.33%

  return (
    <section id="progress-section" className={compact ? 'mb-4' : 'mb-8'}>
      {/* Target Rating Banner */}
      <div className={`bg-white border ${currentTheme.cardBorder} rounded-xl p-4 sm:p-5 mb-5 flex flex-wrap items-center justify-between gap-4 shadow-xs`}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: theme === 'emerald' ? '#ecfdf5' : '#f5f7f5',
              borderColor: theme === 'emerald' ? '#a7f3d0' : '#d8ded8',
              color: currentTheme.dotColor,
            }}
          >
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
              Benchmark Goal
            </div>
            <div className={`text-sm font-serif italic ${currentTheme.textMuted}`}>
              {stats.targetRating >= 91 ? 'Topnotcher Aim (91.00%+)' : stats.targetRating >= 75 ? 'Board Passing Standard (75.00%+)' : 'Review Needed (< 75.00%)'}
            </div>
          </div>
        </div>

        <div className="flex gap-4 sm:gap-6 items-center">
          {isEditingTarget ? (
            <div className="flex items-center gap-2">
              <input
                id="target-rating-input"
                type="number"
                step="0.1"
                min="40"
                max="100"
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-24 px-2 py-1.5 text-sm bg-white border border-emerald-600 rounded text-gray-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-600"
                placeholder="e.g. 91.0"
                autoFocus
              />
              <button
                id="save-target-btn"
                type="button"
                onClick={handleSaveTarget}
                disabled={isSaving}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${currentTheme.primaryBtn}`}
                title="Save target"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                id="cancel-target-btn"
                type="button"
                onClick={() => {
                  setTargetInput(stats.targetRating.toString());
                  setIsEditingTarget(false);
                  setErrorMsg(null);
                }}
                className="p-1.5 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="text-right">
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                  Target Rating
                </label>
                <span className={`text-xl font-bold font-sans ${currentTheme.textHeading} px-1 inline-block`}>
                  {formatRating(stats.targetRating)}%
                </span>
              </div>
              <button
                id="edit-target-btn"
                type="button"
                onClick={() => {
                  setTargetInput(stats.targetRating.toString());
                  setIsEditingTarget(true);
                }}
                className={`px-3.5 py-1.5 text-xs font-sans font-medium rounded-lg transition-all cursor-pointer ${currentTheme.primaryBtn}`}
              >
                Edit Target
              </button>
            </>
          )}
        </div>

        {errorMsg && (
          <div className="w-full text-xs text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Progress Cards Grid */}
      <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-3 gap-3 mb-4' : 'sm:grid-cols-3 gap-4 mb-5'}`}>
        {/* Average Rating Card */}
        <div
          id="stat-average-rating"
          className={`bg-white p-4 border ${currentTheme.cardBorder} rounded-xl text-center shadow-xs`}
        >
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
            Average Rating
          </p>
          <h4 className={`text-2xl sm:text-3xl font-bold font-sans ${currentTheme.textHeading}`}>
            {formatRating(stats.averageRating)}%
          </h4>
          <div className="mt-2 text-[10px] uppercase tracking-wider text-gray-500 font-medium">
            {stats.totalAssessments} {stats.totalAssessments === 1 ? 'assessment logged' : 'assessments logged'}
          </div>
        </div>

        {/* Latest Rating Card */}
        <div
          id="stat-latest-rating"
          className={`bg-white p-4 border ${currentTheme.cardBorder} rounded-xl text-center shadow-xs`}
        >
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
            Latest Rating
          </p>
          <h4 className={`text-2xl sm:text-3xl font-bold font-sans ${stats.latestRating !== null && stats.latestRating >= 75 ? 'text-emerald-700' : 'text-amber-700'}`}>
            {stats.latestRating !== null ? `${formatRating(stats.latestRating)}%` : '—'}
          </h4>
          <div className="mt-2">
            {stats.latestRating !== null ? (
              stats.latestRating >= 75 ? (
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Passed Board Standard
                </span>
              ) : (
                <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                  Review Recommended
                </span>
              )
            ) : (
              <span className="text-[10px] uppercase text-gray-500">Awaiting first drill</span>
            )}
          </div>
        </div>

        {/* Points to Goal Card */}
        <div
          id="stat-points-until-goal"
          className={`bg-white p-4 border ${currentTheme.cardBorder} rounded-xl text-center shadow-xs`}
        >
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
            Points to Goal
          </p>
          <h4
            className={`text-2xl sm:text-3xl font-bold font-sans ${
              stats.isGoalReached ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {stats.totalAssessments === 0
              ? `-${formatRating(stats.pointsToGoal)}`
              : stats.isGoalReached
              ? `+${formatRating(stats.averageRating - stats.targetRating)}`
              : `-${formatRating(stats.pointsToGoal)}`}
          </h4>
          <div className="mt-2">
            {stats.isGoalReached ? (
              <span className="inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                🎯 Target Achieved!
              </span>
            ) : (
              <span className="text-[10px] uppercase text-gray-500 font-medium">
                Target: {formatRating(stats.targetRating)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bar Graph Visualizing Progress of Latest Assessments */}
      <AssessmentBarGraph
        assessments={assessments}
        targetRating={stats.targetRating}
        theme={theme}
        files={files}
      />

      {/* Transmuted Rating Scale Visualization */}
      <div className={`bg-white border ${currentTheme.cardBorder} rounded-xl p-4 sm:p-5 flex flex-col shadow-xs`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2 mb-3">
          <h3 className={`text-xs uppercase tracking-widest font-bold ${currentTheme.accentText}`}>
            Transmuted Rating Scale Visualization
          </h3>
          <span className="font-medium text-xs text-gray-600">
            Cumulative Accuracy: <strong className="text-gray-900 font-bold">{stats.overallAccuracy}%</strong>
          </span>
        </div>

        <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200 mb-3">
          {/* Progress fill in theme green */}
          <div
            className={`h-full transition-all duration-500 rounded-full ${currentTheme.progressBar}`}
            style={{ width: `${percentageOnScale}%` }}
          />

          {/* Passing line 75% mark */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-10"
            style={{ left: `${passingOnScale}%` }}
            title="Passing Mark: 75.00%"
          />

          {/* Target line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-600 z-10"
            style={{ left: `${targetOnScale}%` }}
            title={`Target: ${stats.targetRating}%`}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] uppercase text-gray-500 tracking-wider">
          <span>40.0 Base</span>
          <span className="flex items-center gap-1 text-rose-700 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
            75.0 Passing Mark
          </span>
          <span className="flex items-center gap-1 text-amber-700 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Target ({formatRating(stats.targetRating)}%)
          </span>
          <span>100.0 Max</span>
        </div>
      </div>
    </section>
  );
};
