import React, { useState, useMemo } from 'react';
import { PlusCircle, Calculator, FolderPlus, CheckCircle2, AlertTriangle, Calendar, FileText, Sparkles } from 'lucide-react';
import { ThemeOption } from '../types';
import { calculateLeptRating, formatRating } from '../utils/calculator';
import { THEMES } from '../utils/theme';

interface AddAssessmentSectionProps {
  files: string[];
  activeFile: string;
  onAddAssessment: (data: {
    name: string;
    file: string;
    rawScore: number;
    totalItems: number;
    date: string;
    notes?: string;
  }) => Promise<void>;
  onAddNewFile: (fileName: string) => Promise<void>;
  theme?: ThemeOption;
  compact?: boolean;
}

export const AddAssessmentSection: React.FC<AddAssessmentSectionProps> = ({
  files,
  activeFile,
  onAddAssessment,
  onAddNewFile,
  theme = 'emerald',
  compact = false,
}) => {
  const currentTheme = THEMES[theme];
  const [name, setName] = useState('');
  const [file, setFile] = useState(activeFile !== 'all' ? activeFile : files[0] || 'General Education');
  const [rawScoreStr, setRawScoreStr] = useState('');
  const [totalItemsStr, setTotalItemsStr] = useState('100');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // New file creation inline state
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Keep file in sync if activeFile changes to a specific file
  React.useEffect(() => {
    if (activeFile !== 'all' && files.includes(activeFile)) {
      setFile(activeFile);
    } else if (!files.includes(file) && files.length > 0) {
      setFile(files[0]);
    }
  }, [activeFile, files]);

  // Live computed rating preview
  const liveCalc = useMemo(() => {
    const raw = parseFloat(rawScoreStr);
    const total = parseFloat(totalItemsStr);

    if (isNaN(raw) || isNaN(total) || total <= 0) {
      return { rating: null, isValid: false, warning: null };
    }

    if (raw > total) {
      return {
        rating: null,
        isValid: false,
        warning: 'Raw score cannot be greater than total items.',
      };
    }

    if (raw < 0) {
      return {
        rating: null,
        isValid: false,
        warning: 'Raw score cannot be negative.',
      };
    }

    const rating = calculateLeptRating(raw, total);
    return {
      rating,
      isValid: true,
      warning: null,
      computation: `(${raw} × 60 ÷ ${total}) + 40 = ${rating.toFixed(2)}`,
    };
  }, [rawScoreStr, totalItemsStr]);

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newFileName.trim();
    if (!clean) return;

    try {
      await onAddNewFile(clean);
      setFile(clean);
      setNewFileName('');
      setIsCreatingFile(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessNotice(null);

    const cleanName = name.trim();
    if (!cleanName) {
      setError('Please provide an assessment name or drill title.');
      return;
    }

    const raw = parseFloat(rawScoreStr);
    const total = parseFloat(totalItemsStr);

    if (isNaN(raw) || isNaN(total) || total <= 0) {
      setError('Please enter valid positive numbers for score and total items.');
      return;
    }

    if (raw > total) {
      setError('Raw score cannot exceed total number of items.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddAssessment({
        name: cleanName,
        file,
        rawScore: raw,
        totalItems: total,
        date,
        notes: notes.trim(),
      });

      setSuccessNotice(`Successfully logged "${cleanName}" with rating ${liveCalc.rating?.toFixed(2)}%!`);
      setName('');
      setRawScoreStr('');
      setNotes('');
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to save assessment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="add-assessment-section"
      className={`${compact ? 'mb-4 p-4' : 'mb-8 p-5 sm:p-6'} bg-white border ${currentTheme.cardBorder} rounded-xl shadow-xs flex flex-col gap-4`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
        <h3 className={`text-xs uppercase tracking-widest font-bold ${currentTheme.accentText}`}>
          Add Assessment
        </h3>
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
          Standard Transmutation Formula
        </span>
      </div>

      {error && (
        <div
          id="add-assessment-error"
          className="p-2.5 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successNotice && (
        <div
          id="add-assessment-success"
          className="p-2.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className={compact ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-12 gap-4'}>
          {/* Assessment Name */}
          <div className={compact ? 'w-full' : 'md:col-span-7'}>
            <label className="block text-xs font-medium mb-1 text-gray-700">
              Assessment Name
            </label>
            <input
              id="assessment-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Prof Ed Quiz 1"
              className="w-full px-3 py-2 border border-gray-300 bg-gray-50/50 text-sm text-gray-900 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 font-sans"
              required
            />
          </div>

          {/* File / Subject Folder */}
          <div className={compact ? 'w-full' : 'md:col-span-5'}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-gray-700">
                File / Folder
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingFile(!isCreatingFile)}
                className={`text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer ${currentTheme.accentText}`}
              >
                <FolderPlus className="w-3 h-3" />
                <span>{isCreatingFile ? 'Select File' : '+ New Folder'}</span>
              </button>
            </div>

            {isCreatingFile ? (
              <div className="flex items-center gap-1.5">
                <input
                  id="new-file-input"
                  type="text"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  placeholder="New folder name..."
                  className="flex-1 px-3 py-2 border border-gray-300 bg-white text-sm text-gray-900 rounded-lg focus:outline-none focus:border-emerald-600 font-sans"
                />
                <button
                  type="button"
                  onClick={handleCreateFile}
                  className={`px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${currentTheme.primaryBtn}`}
                >
                  Save
                </button>
              </div>
            ) : (
              <select
                id="assessment-file-select"
                value={file}
                onChange={(e) => setFile(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 bg-gray-50/50 text-sm text-gray-900 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer font-sans"
              >
                {files.map((f) => (
                  <option key={f} value={f}>
                    📁 {f}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Scores & Date Row */}
        <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-1 sm:grid-cols-3 gap-3'}>
          {/* Raw Score */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">
              Raw Score
            </label>
            <input
              id="raw-score-input"
              type="number"
              step="any"
              min="0"
              value={rawScoreStr}
              onChange={(e) => setRawScoreStr(e.target.value)}
              placeholder="e.g. 45"
              className="w-full px-3 py-2 border border-gray-300 bg-gray-50/50 text-sm text-gray-900 font-bold rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 font-sans"
              required
            />
          </div>

          {/* Total Items */}
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-700">
              Total Items
            </label>
            <input
              id="total-items-input"
              type="number"
              step="any"
              min="1"
              value={totalItemsStr}
              onChange={(e) => setTotalItemsStr(e.target.value)}
              placeholder="e.g. 60"
              className="w-full px-3 py-2 border border-gray-300 bg-gray-50/50 text-sm text-gray-900 font-bold rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 font-sans"
              required
            />
          </div>

          {/* Date Taken */}
          <div className={compact ? 'col-span-2' : ''}>
            <label className="block text-xs font-medium mb-1 text-gray-700">
              Date Taken
            </label>
            <input
              id="assessment-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 bg-gray-50/50 text-sm text-gray-900 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 cursor-pointer font-sans"
            />
          </div>
        </div>

        {/* Live Calculation Preview Banner */}
        <div
          id="live-calculation-box"
          className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-left"
        >
          <div>
            <p className="text-[10px] uppercase tracking-widest text-emerald-800 font-bold mb-0.5">
              Live Transmutation Preview
            </p>
            <div className="text-sm font-bold font-sans">
              {liveCalc.isValid && liveCalc.rating !== null ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg text-emerald-800 font-bold">
                    {formatRating(liveCalc.rating)}%
                  </span>
                  <span className="text-xs font-mono text-emerald-700">
                    ({liveCalc.computation})
                  </span>
                </div>
              ) : (
                <span className="text-xs font-mono text-gray-500">
                  Rating = (Score × 60 ÷ Total) + 40
                </span>
              )}
            </div>
          </div>

          {liveCalc.isValid && liveCalc.rating !== null && (
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-bold border ${
                liveCalc.rating >= 75
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border-rose-300'
              }`}
            >
              {liveCalc.rating >= 75 ? '✓ Passing Standard' : '⚠ Below 75.00'}
            </span>
          )}
        </div>

        {/* Optional Notes / Reflections */}
        <div>
          <label className="block text-xs font-medium mb-1 text-gray-700">
            Notes & Reflections (Optional)
          </label>
          <textarea
            id="assessment-notes-input"
            rows={compact ? 2 : 2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Mastered Philippine Constitution items, need to review Child Development..."
            className="w-full px-3 py-2 border border-gray-300 bg-gray-50/50 text-sm text-gray-900 rounded-lg focus:bg-white focus:outline-none focus:border-emerald-600 font-sans"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-1 flex justify-end">
          <button
            id="submit-assessment-btn"
            type="submit"
            disabled={isSubmitting}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-sans font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 ${currentTheme.primaryBtn}`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving Drill...' : 'Save Assessment Entry'}</span>
          </button>
        </div>
      </form>
    </section>
  );
};
