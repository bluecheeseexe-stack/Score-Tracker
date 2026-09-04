import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  List,
  FileSpreadsheet
} from 'lucide-react';
import { Assessment, ThemeOption } from '../types';
import { formatRating } from '../utils/calculator';
import { THEMES } from '../utils/theme';
import { EditAssessmentModal } from './EditAssessmentModal';

interface AssessmentHistoryProps {
  assessments: Assessment[];
  files: string[];
  activeFile: string;
  onSelectFile: (file: string) => void;
  onDeleteAssessment: (id: string) => Promise<void>;
  onUpdateAssessment: (
    id: string,
    data: {
      name: string;
      file: string;
      rawScore: number;
      totalItems: number;
      date: string;
      notes?: string;
    }
  ) => Promise<void>;
  targetRating: number;
  theme?: ThemeOption;
  compact?: boolean;
}

export const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({
  assessments,
  files,
  activeFile,
  onSelectFile,
  onDeleteAssessment,
  onUpdateAssessment,
  targetRating,
  theme = 'emerald',
  compact = false,
}) => {
  const currentTheme = THEMES[theme];
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtered & sorted assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      const matchesFile = activeFile === 'all' || item.file === activeFile;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.file.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFile && matchesSearch;
    });
  }, [assessments, activeFile, searchQuery]);

  const sortedAssessments = useMemo(() => {
    return [...filteredAssessments].sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'oldest') return a.createdAt - b.createdAt;
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      return 0;
    });
  }, [filteredAssessments, sortBy]);

  // Grouped by file
  const groupedByFile = useMemo(() => {
    const map: Record<string, Assessment[]> = {};

    // Ensure all relevant files are represented
    const targetFiles = activeFile === 'all' ? files : [activeFile];
    targetFiles.forEach((f) => {
      map[f] = [];
    });

    sortedAssessments.forEach((item) => {
      if (!map[item.file]) {
        map[item.file] = [];
      }
      map[item.file].push(item);
    });

    return map;
  }, [files, activeFile, sortedAssessments]);

  // Export to CSV
  const handleExportCSV = () => {
    if (assessments.length === 0) return;
    const headers = ['Assessment Name', 'File/Subject', 'Raw Score', 'Total Items', 'Transmuted Rating', 'Status', 'Date', 'Notes'];
    const rows = assessments.map((a) => [
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.file.replace(/"/g, '""')}"`,
      a.rawScore,
      a.totalItems,
      a.rating.toFixed(2),
      a.rating >= 75 ? 'Passed' : 'Below 75',
      a.date,
      `"${(a.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LEPT_Rating_Assessments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await onDeleteAssessment(id);
      setDeleteConfirmId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section id="assessment-history-section" className={compact ? 'mb-6' : 'mb-12'}>
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className={`text-xl sm:text-2xl font-bold ${currentTheme.textHeading} flex items-center gap-2`}>
            <span>Assessment History</span>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              {assessments.length} {assessments.length === 1 ? 'record' : 'records'}
            </span>
          </h2>
          <p className="text-xs text-gray-500 italic">
            Organized by subject files for systematic LEPT review tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle: Grouped vs List */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 text-xs shadow-xs">
            <button
              id="view-mode-grouped-btn"
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer font-sans ${
                viewMode === 'grouped'
                  ? `${currentTheme.primaryBtn} font-medium`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="Organize grouped by file folders"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>By File</span>
            </button>
            <button
              id="view-mode-list-btn"
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer font-sans ${
                viewMode === 'list'
                  ? `${currentTheme.primaryBtn} font-medium`
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title="View all in flat list"
            >
              <List className="w-3.5 h-3.5" />
              <span>All Drills</span>
            </button>
          </div>

          {/* Export CSV button */}
          <button
            id="export-csv-btn"
            type="button"
            onClick={handleExportCSV}
            disabled={assessments.length === 0}
            className={`px-2.5 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs ${currentTheme.secondaryBtn}`}
            title="Export to CSV spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-sans font-medium">Export CSV</span>
          </button>
        </div>
      </div>

      {/* File Organization Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-4 scrollbar-thin">
        <button
          type="button"
          onClick={() => onSelectFile('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border font-sans ${
            activeFile === 'all'
              ? `${currentTheme.primaryBtn} shadow-xs`
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>All Files ({assessments.length})</span>
        </button>

        {files.map((file) => {
          const count = assessments.filter((a) => a.file === file).length;
          const isSelected = activeFile === file;
          return (
            <button
              key={file}
              type="button"
              onClick={() => onSelectFile(file)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer border font-sans ${
                isSelected
                  ? `${currentTheme.primaryBtn} shadow-xs`
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Folder className="w-3.5 h-3.5 text-gray-400" />
              <span>{file}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className={`bg-white border ${currentTheme.cardBorder} rounded-xl p-3 sm:p-4 mb-5 shadow-xs flex flex-wrap items-center justify-between gap-3`}>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assessments, files, or notes..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50/50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:bg-white focus:border-emerald-600 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-sans">
          <span className="text-gray-500 hidden sm:inline flex items-center gap-1 uppercase tracking-widest text-[10px] font-bold">
            <ArrowUpDown className="w-3 h-3" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 text-xs bg-gray-50/50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:bg-white focus:border-emerald-600 cursor-pointer"
          >
            <option value="newest">Date: Newest First</option>
            <option value="oldest">Date: Oldest First</option>
            <option value="highest">Rating: Highest First</option>
            <option value="lowest">Rating: Lowest First</option>
          </select>
        </div>
      </div>

      {/* Empty State */}
      {sortedAssessments.length === 0 && (
        <div className="text-center py-12 px-4 bg-white border border-dashed border-gray-300 rounded-xl">
          <Folder className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <h3 className="text-base font-bold text-gray-900">
            {searchQuery ? 'No matching assessments found' : 'No assessments logged yet'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'Try adjusting your search query or switching file tabs.'
              : 'Add your first drill in the section above to calculate your LEPT rating and track your progress!'}
          </p>
        </div>
      )}

      {/* Grouped by File View */}
      {viewMode === 'grouped' && sortedAssessments.length > 0 && (
        <div className="space-y-6">
          {(Object.entries(groupedByFile) as [string, Assessment[]][]).map(([fileName, items]) => {
            if (items.length === 0 && activeFile !== 'all') return null;

            // Folder stats
            const folderCount = items.length;
            const folderAvg =
              folderCount > 0
                ? Math.round((items.reduce((sum, a) => sum + a.rating, 0) / folderCount) * 100) / 100
                : null;
            const folderPassed = items.filter((a) => a.rating >= 75).length;

            return (
              <div
                key={fileName}
                className={`bg-white border ${currentTheme.cardBorder} rounded-xl overflow-hidden shadow-xs`}
              >
                {/* File Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FolderOpen className={`w-4 h-4 ${currentTheme.accentText}`} />
                    <h3 className={`text-xs uppercase tracking-widest font-bold ${currentTheme.accentText}`}>
                      {fileName}
                    </h3>
                    <span className="text-[10px] text-gray-500 font-medium">
                      ({folderCount} {folderCount === 1 ? 'drill' : 'drills'})
                    </span>
                  </div>

                  {folderAvg !== null && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-600">
                        Folder Avg:{' '}
                        <strong className={`font-bold text-sm font-sans ${currentTheme.textHeading}`}>
                          {formatRating(folderAvg)}%
                        </strong>
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hidden sm:inline">
                        Passing: {folderPassed}/{folderCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Drills in this file */}
                <div className="p-4 sm:p-5">
                  {items.length === 0 ? (
                    <div className="text-xs text-gray-400 italic py-2">
                      No drills logged under this file yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {items.map((item) => (
                        <AssessmentCard
                          key={item.id}
                          item={item}
                          targetRating={targetRating}
                          theme={theme}
                          onEdit={() => setEditingAssessment(item)}
                          onConfirmDelete={() => setDeleteConfirmId(item.id)}
                          isConfirmingDelete={deleteConfirmId === item.id}
                          onCancelDelete={() => setDeleteConfirmId(null)}
                          onDeleteExecute={() => handleDelete(item.id)}
                          isDeleting={isDeleting}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flat List View */}
      {viewMode === 'list' && sortedAssessments.length > 0 && (
        <div className="grid grid-cols-1 gap-3">
          {sortedAssessments.map((item) => (
            <AssessmentCard
              key={item.id}
              item={item}
              targetRating={targetRating}
              theme={theme}
              onEdit={() => setEditingAssessment(item)}
              onConfirmDelete={() => setDeleteConfirmId(item.id)}
              isConfirmingDelete={deleteConfirmId === item.id}
              onCancelDelete={() => setDeleteConfirmId(null)}
              onDeleteExecute={() => handleDelete(item.id)}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}

      {/* Edit Assessment Modal */}
      <EditAssessmentModal
        assessment={editingAssessment}
        files={files}
        isOpen={!!editingAssessment}
        onClose={() => setEditingAssessment(null)}
        onSave={onUpdateAssessment}
      />
    </section>
  );
};

// Reusable Drill Card
interface AssessmentCardProps {
  item: Assessment;
  targetRating: number;
  theme?: ThemeOption;
  onEdit: () => void;
  onConfirmDelete: () => void;
  isConfirmingDelete: boolean;
  onCancelDelete: () => void;
  onDeleteExecute: () => void;
  isDeleting: boolean;
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({
  item,
  targetRating,
  theme = 'emerald',
  onEdit,
  onConfirmDelete,
  isConfirmingDelete,
  onCancelDelete,
  onDeleteExecute,
  isDeleting,
}) => {
  const currentTheme = THEMES[theme];
  const isPassed = item.rating >= 75;
  const isHitTarget = item.rating >= targetRating;
  const targetDiff = Math.round((item.rating - targetRating) * 100) / 100;

  return (
    <div
      id={`assessment-card-${item.id}`}
      className={`bg-white border ${currentTheme.cardBorder} rounded-xl p-3.5 sm:p-4 hover:shadow-xs transition-all flex flex-wrap items-start justify-between gap-3`}
    >
      <div className="flex-1 min-w-[240px]">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 flex items-center gap-1">
            <Folder className="w-3 h-3 text-gray-500" />
            <span>{item.file}</span>
          </span>

          <span
            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
              isPassed
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {isPassed ? (
              <>
                <CheckCircle className="w-3 h-3 text-emerald-600" />
                <span>Passed (≥75)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-rose-600" />
                <span>Below 75</span>
              </>
            )}
          </span>

          {isHitTarget && (
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              ★ Target Met
            </span>
          )}
        </div>

        <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-1">
          {item.name}
        </h4>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 italic mb-2">
          <span>
            Raw Score:{' '}
            <strong className="text-gray-900 not-italic font-bold">
              {item.rawScore} / {item.totalItems}
            </strong>{' '}
            ({Math.round((item.rawScore / item.totalItems) * 100)}% accuracy)
          </span>
          <span className="flex items-center gap-1 not-italic">
            <Clock className="w-3 h-3" />
            {item.date}
          </span>
          <span className={`not-italic font-semibold ${targetDiff >= 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
            {targetDiff >= 0 ? `+${targetDiff}% vs goal` : `${targetDiff}% vs goal`}
          </span>
        </div>

        {item.notes && (
          <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-200/80 italic font-serif">
            &ldquo;{item.notes}&rdquo;
          </p>
        )}
      </div>

      {/* Right Column: Rating Display & Actions */}
      <div className="flex sm:flex-col items-end justify-between sm:justify-start gap-2 shrink-0">
        <div className="text-right">
          <div className={`text-2xl sm:text-3xl font-bold font-sans ${isPassed ? currentTheme.textHeading : 'text-rose-700'} leading-none`}>
            {formatRating(item.rating)}%
          </div>
          <div className="text-[10px] text-gray-500 font-mono mt-1">
            ({item.rawScore}×60÷{item.totalItems})+40
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 mt-1">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
              <span className="text-[10px] text-rose-800 font-bold px-1">Delete?</span>
              <button
                type="button"
                onClick={onDeleteExecute}
                disabled={isDeleting}
                className="px-2 py-0.5 text-[10px] bg-rose-600 text-white rounded hover:bg-rose-700 cursor-pointer"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="px-1.5 py-0.5 text-[10px] bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 cursor-pointer"
              >
                No
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="p-1.5 text-xs text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                title="Edit assessment"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onConfirmDelete}
                className="p-1.5 text-xs text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Delete assessment"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
