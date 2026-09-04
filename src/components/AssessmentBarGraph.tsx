import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { Assessment, ThemeOption } from '../types';
import { formatRating } from '../utils/calculator';
import { THEMES } from '../utils/theme';

interface AssessmentBarGraphProps {
  assessments: Assessment[];
  targetRating: number;
  theme?: ThemeOption;
  files?: string[];
}

export const AssessmentBarGraph: React.FC<AssessmentBarGraphProps> = ({
  assessments,
  targetRating,
  theme = 'emerald',
  files = [],
}) => {
  const currentTheme = THEMES[theme];
  const [drillLimit, setDrillLimit] = useState<number>(8);
  const [selectedFileFilter, setSelectedFileFilter] = useState<string>('all');

  // Filter and sort chronologically (oldest to newest for visual timeline progression)
  const chartData = useMemo(() => {
    let filtered = [...assessments];

    if (selectedFileFilter !== 'all') {
      filtered = filtered.filter((a) => a.file === selectedFileFilter);
    }

    // Sort by createdAt / date ascending so progress flows left to right
    filtered.sort((a, b) => {
      if (a.createdAt && b.createdAt) return a.createdAt - b.createdAt;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    // Take the latest N
    if (drillLimit > 0 && filtered.length > drillLimit) {
      filtered = filtered.slice(-drillLimit);
    }

    return filtered.map((item, index) => {
      // Short label for x-axis
      const shortDate = item.date ? item.date.slice(5) : `#${index + 1}`;
      const truncatedName =
        item.name.length > 15 ? `${item.name.slice(0, 13)}...` : item.name;

      return {
        id: item.id,
        name: item.name,
        shortLabel: `${shortDate} ${truncatedName}`,
        file: item.file,
        date: item.date,
        rating: item.rating,
        rawScore: item.rawScore,
        totalItems: item.totalItems,
        accuracy: Math.round((item.rawScore / item.totalItems) * 100),
        notes: item.notes,
        isPassed: item.rating >= 75.0,
        isGoalMet: item.rating >= targetRating,
      };
    });
  }, [assessments, selectedFileFilter, drillLimit, targetRating]);

  // Color mapping per bar
  const getBarColor = (item: (typeof chartData)[0]) => {
    if (item.isGoalMet) {
      return theme === 'forest' ? '#166534' : '#059669'; // High achievement
    }
    if (item.isPassed) {
      return theme === 'forest' ? '#2f6645' : '#10b981'; // Passing standard
    }
    return '#f43f5e'; // Below 75.00%
  };

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white/95 backdrop-blur-xs p-3.5 rounded-xl shadow-lg border border-gray-200 text-xs font-sans max-w-[260px] z-50">
          <div className="flex items-center justify-between gap-2 mb-1.5 pb-1.5 border-b border-gray-100">
            <span className="font-bold text-gray-900 truncate">{data.name}</span>
            <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {data.file}
            </span>
          </div>

          <div className="space-y-1 text-gray-600">
            <div className="flex justify-between items-center">
              <span>Transmuted Rating:</span>
              <span
                className={`font-bold font-sans text-sm ${
                  data.isPassed ? 'text-emerald-700' : 'text-rose-600'
                }`}
              >
                {formatRating(data.rating)}%
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>Raw Score:</span>
              <span className="font-semibold text-gray-900">
                {data.rawScore} / {data.totalItems} ({data.accuracy}%)
              </span>
            </div>

            <div className="flex justify-between items-center text-[11px] text-gray-500 pt-0.5">
              <span>Date Logged:</span>
              <span>{data.date}</span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center gap-1.5 text-[10px] font-bold">
            {data.isGoalMet ? (
              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 w-full flex items-center gap-1">
                ★ Target Benchmark Reached
              </span>
            ) : data.isPassed ? (
              <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 w-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Passed Standard (≥ 75.00%)
              </span>
            ) : (
              <span className="text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 w-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-600" />
                Review Recommended (&lt; 75.00%)
              </span>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="latest-assessments-bar-graph"
      className={`bg-white border ${currentTheme.cardBorder} rounded-xl p-4 sm:p-5 shadow-xs flex flex-col mb-5`}
    >
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-4">
        <div>
          <h3 className={`text-xs uppercase tracking-widest font-bold ${currentTheme.accentText} flex items-center gap-1.5`}>
            <BarChart3 className="w-4 h-4" />
            <span>Latest Assessments Progress Graph</span>
          </h3>
          <p className="text-[11px] text-gray-500 italic mt-0.5">
            Visual progression of your transmuted ratings with passing mark & target goals.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* File Filter if files available */}
          {files.length > 0 && (
            <select
              value={selectedFileFilter}
              onChange={(e) => setSelectedFileFilter(e.target.value)}
              className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:bg-white focus:border-emerald-600 cursor-pointer font-sans"
              title="Filter by subject folder"
            >
              <option value="all">All Folders</option>
              {files.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          )}

          {/* Drill Count Limit */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-sans">
            {[
              { val: 5, label: 'Last 5' },
              { val: 8, label: 'Last 8' },
              { val: 12, label: 'Last 12' },
              { val: 0, label: 'All' },
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setDrillLimit(opt.val)}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  drillLimit === opt.val
                    ? 'bg-white text-gray-900 font-bold shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bar Chart Area */}
      {chartData.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-200 rounded-lg">
          <BarChart3 className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-xs font-medium text-gray-600">No assessment records to display</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Log your drill scores above to watch your bar graph progression over time.
          </p>
        </div>
      ) : (
        <div className="w-full">
          {/* Legend / Key Indicator */}
          <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-[11px] mb-2 font-sans">
            <div className="flex items-center gap-1.5 text-rose-700 font-semibold">
              <span className="w-3 h-0.5 bg-rose-500 inline-block border-t border-dashed border-rose-600"></span>
              <span>75.00% Passing Mark</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
              <span className="w-3 h-0.5 bg-amber-500 inline-block border-t border-dashed border-amber-600"></span>
              <span>{formatRating(targetRating)}% Target Goal</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block"></span>
              <span>Transmuted Rating</span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 16, right: 12, left: -10, bottom: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="shortLabel"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#d1d5db' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  domain={[40, 100]}
                  ticks={[40, 50, 60, 70, 75, 80, 85, 90, 100]}
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={{ stroke: '#d1d5db' }}
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} />

                {/* 75.00% Passing Mark Reference Line */}
                <ReferenceLine
                  y={75}
                  stroke="#e11d48"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: 'Passing 75%',
                    position: 'insideBottomRight',
                    fill: '#be123c',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />

                {/* User Target Goal Reference Line */}
                {targetRating > 40 && targetRating <= 100 && (
                  <ReferenceLine
                    y={targetRating}
                    stroke="#d97706"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: `Target ${formatRating(targetRating)}%`,
                      position: 'insideTopRight',
                      fill: '#b45309',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  />
                )}

                <Bar
                  dataKey="rating"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                  animationDuration={800}
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.id} fill={getBarColor(entry)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
