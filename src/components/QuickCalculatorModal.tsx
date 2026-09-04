import React, { useState } from 'react';
import { X, Calculator, HelpCircle, Check, ArrowRight } from 'lucide-react';
import { calculateLeptRating, formatRating } from '../utils/calculator';

interface QuickCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTransferToForm?: (rawScore: number, totalItems: number) => void;
}

export const QuickCalculatorModal: React.FC<QuickCalculatorModalProps> = ({
  isOpen,
  onClose,
  onTransferToForm,
}) => {
  const [rawScore, setRawScore] = useState('75');
  const [totalItems, setTotalItems] = useState('100');

  if (!isOpen) return null;

  const rawNum = parseFloat(rawScore);
  const totalNum = parseFloat(totalItems);

  const isValid = !isNaN(rawNum) && !isNaN(totalNum) && totalNum > 0 && rawNum >= 0 && rawNum <= totalNum;
  const rating = isValid ? calculateLeptRating(rawNum, totalNum) : null;
  const passingScoreNeeded = isValid ? Math.ceil(((75 - 40) * totalNum) / 60) : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#2d332d]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#d8ded8] rounded shadow-xl p-6 relative">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#f2f4f2]">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#4a634a]" />
            <h3 className="text-base font-bold text-[#4a634a]">
              LEPT Formula Scratchpad
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-[#8a968a] hover:text-[#2d332d] hover:bg-[#f2f4f2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 bg-[#f2f4f2] border border-[#d8ded8] rounded p-3 text-xs text-[#2d332d] space-y-1">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#4a634a]">Official LEPT Transmutation Formula:</div>
          <div className="font-mono text-xs bg-white px-2 py-1 rounded border border-[#d8ded8] text-[#2d332d]">
            Rating = (raw score × 60 ÷ total items) + 40
          </div>
          <p className="text-[10px] text-[#8a968a] italic pt-1">
            40.00% is the base grade (zero score). 75.00% is the official passing mark.
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a634a] mb-1">
                Raw Score
              </label>
              <input
                type="number"
                min="0"
                value={rawScore}
                onChange={(e) => setRawScore(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#fafafa] border border-[#d8ded8] rounded text-[#2d332d] font-bold focus:outline-none focus:border-[#4a634a]"
                placeholder="e.g. 75"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a634a] mb-1">
                Total Items
              </label>
              <input
                type="number"
                min="1"
                value={totalItems}
                onChange={(e) => setTotalItems(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#fafafa] border border-[#d8ded8] rounded text-[#2d332d] font-bold focus:outline-none focus:border-[#4a634a]"
                placeholder="e.g. 100"
              />
            </div>
          </div>

          {/* Computed Output */}
          <div className="p-4 rounded bg-[#f2f4f2] border border-[#d8ded8] text-center">
            <div className="text-[10px] text-[#8a968a] uppercase tracking-widest font-bold mb-1">
              Transmuted LEPT Rating
            </div>
            <div className="text-3xl sm:text-4xl font-bold text-[#4a634a]">
              {rating !== null ? `${formatRating(rating)}%` : '—'}
            </div>

            {rating !== null && (
              <div className="mt-2 text-[10px] uppercase tracking-wider font-bold">
                {rating >= 75 ? (
                  <span className="text-[#4a634a] bg-white px-2 py-0.5 rounded border border-[#4a634a]">
                    Passed Standard (≥ 75.00)
                  </span>
                ) : (
                  <span className="text-red-800 bg-white px-2 py-0.5 rounded border border-red-800">
                    Below 75.00 Passing Mark
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Useful insights */}
          {isValid && passingScoreNeeded !== null && (
            <div className="text-[10px] text-[#8a968a] bg-[#fafafa] p-3 rounded border border-[#d8ded8] space-y-1">
              <div>
                • Raw percentage:{' '}
                <strong className="text-[#2d332d] font-bold">
                  {Math.round((rawNum / totalNum) * 100)}%
                </strong>
              </div>
              <div>
                • Raw score needed to reach 75%:{' '}
                <strong className="text-[#4a634a] font-bold">
                  {passingScoreNeeded} / {totalNum} items
                </strong>{' '}
                (approx. 58.3% correct answers)
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs rounded bg-[#4a634a] hover:bg-[#3d523d] text-white uppercase tracking-wider font-medium cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
