import React, { useState } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';
import { Assessment } from '../types';
import { calculateLeptRating, formatRating } from '../utils/calculator';

interface EditAssessmentModalProps {
  assessment: Assessment | null;
  files: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: {
    name: string;
    file: string;
    rawScore: number;
    totalItems: number;
    date: string;
    notes?: string;
  }) => Promise<void>;
}

export const EditAssessmentModal: React.FC<EditAssessmentModalProps> = ({
  assessment,
  files,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !assessment) return null;

  const [name, setName] = useState(assessment.name);
  const [file, setFile] = useState(assessment.file);
  const [rawScoreStr, setRawScoreStr] = useState(assessment.rawScore.toString());
  const [totalItemsStr, setTotalItemsStr] = useState(assessment.totalItems.toString());
  const [date, setDate] = useState(assessment.date);
  const [notes, setNotes] = useState(assessment.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const raw = parseFloat(rawScoreStr);
  const total = parseFloat(totalItemsStr);
  const previewRating = !isNaN(raw) && !isNaN(total) && total > 0 && raw <= total
    ? calculateLeptRating(raw, total)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Assessment name is required.');
      return;
    }
    if (isNaN(raw) || isNaN(total) || total <= 0 || raw < 0 || raw > total) {
      setError('Please provide valid score and total item values.');
      return;
    }

    setLoading(true);
    try {
      await onSave(assessment.id, {
        name: name.trim(),
        file,
        rawScore: raw,
        totalItems: total,
        date,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2d332d]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white border border-[#d8ded8] rounded shadow-xl p-6 relative">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#f2f4f2]">
          <h3 className="text-base font-bold text-[#4a634a]">
            Edit Assessment Record
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#8a968a] hover:text-[#2d332d] hover:bg-[#f2f4f2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 text-xs text-red-800 bg-[#faecec] border border-[#f0c4c4] rounded flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a634a] mb-1">
              Assessment Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#fafafa] border border-[#d8ded8] rounded text-[#2d332d] focus:outline-none focus:border-[#4a634a]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a634a] mb-1">
                File / Folder
              </label>
              <select
                value={file}
                onChange={(e) => setFile(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#fafafa] border border-[#d8ded8] rounded text-[#2d332d] focus:outline-none focus:border-[#4a634a]"
              >
                {files.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a634a] mb-1">
                Date Taken
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#fafafa] border border-[#d8ded8] rounded text-[#2d332d] focus:outline-none focus:border-[#4a634a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a634a] mb-1">
                Raw Score
              </label>
              <input
                type="number"
                min="0"
                value={rawScoreStr}
                onChange={(e) => setRawScoreStr(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#fafafa] border border-[#d8ded8] rounded text-[#2d332d] font-bold focus:outline-none focus:border-[#4a634a]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a634a] mb-1">
                Total Items
              </label>
              <input
                type="number"
                min="1"
                value={totalItemsStr}
                onChange={(e) => setTotalItemsStr(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#fafafa] border border-[#d8ded8] rounded text-[#2d332d] font-bold focus:outline-none focus:border-[#4a634a]"
                required
              />
            </div>
          </div>

          {previewRating !== null && (
            <div className="p-3 bg-[#f2f4f2] border border-[#d8ded8] rounded text-xs flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-[#8a968a]">Updated Transmuted Rating:</span>
              <span className="text-base font-bold text-[#4a634a]">
                {formatRating(previewRating)}%
              </span>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a634a] mb-1">
              Notes / Reflections
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-[#fafafa] border border-[#d8ded8] rounded text-[#2d332d] focus:outline-none focus:border-[#4a634a]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#d8ded8]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded border border-[#d8ded8] text-[#8a968a] hover:bg-[#f2f4f2] uppercase tracking-wider font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs rounded bg-[#4a634a] hover:bg-[#3d523d] text-white flex items-center gap-1.5 uppercase tracking-wider font-medium cursor-pointer disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{loading ? 'Saving...' : 'Update Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
