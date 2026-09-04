import React from 'react';
import { BookOpen, User, LogOut, Copy, Check } from 'lucide-react';
import { ThemeOption, UserProfile } from '../types';
import { THEMES } from '../utils/theme';

interface HeaderProps {
  user: UserProfile;
  onLogout: () => void;
  onOpenQuickCalc: () => void;
  theme?: ThemeOption;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenQuickCalc,
  theme = 'emerald',
}) => {
  const [copied, setCopied] = React.useState(false);
  const currentTheme = THEMES[theme];

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <header className="w-full mb-6" id="lept-header">
      {/* Title & Quoted Subheading */}
      <div className="text-center mb-6">
        <h1
          id="main-title"
          className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-2 ${currentTheme.textHeading}`}
        >
          LEPT Rating Tracker
        </h1>
        <div
          id="quoted-subheading"
          className={`max-w-2xl mx-auto text-sm italic leading-relaxed px-4 py-3 bg-white border ${currentTheme.cardBorder} rounded-xl shadow-xs text-left sm:text-center ${currentTheme.textMuted}`}
        >
          <p className="mb-1.5">
            &ldquo;To use this tracker, input your raw score and total number of items. Your transmuted rating is calculated automatically based on the official transmutation formula: <span className="font-mono not-italic text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">(Score × 60 ÷ Total) + 40</span>. Keep track of your progress, review your drills by file, and aim for your goal!&rdquo;
          </p>
          <p className={`font-semibold not-italic ${currentTheme.accentText}`}>
            &ldquo;Good luck everyone!! ♡(ӦｖӦ｡) Kaya natin &apos;to! LPT SOON — 💚Dani&rdquo;
          </p>
        </div>
      </div>

      {/* User Bar */}
      <div className={`flex flex-wrap items-center justify-between gap-4 px-5 py-3.5 bg-white border ${currentTheme.cardBorder} rounded-xl shadow-xs`}>
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
            Reviewer Profile
          </span>
          <span className={`font-bold text-sm ${currentTheme.textBody} flex items-center gap-2`}>
            <div
              className="w-2.5 h-2.5 rounded-full ring-2 ring-white"
              style={{ backgroundColor: currentTheme.dotColor }}
            />
            <span>@{user.displayName}</span>
          </span>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100/70 text-emerald-800 border border-emerald-200">
            Licensed Teacher Candidate
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="quick-calc-btn"
            type="button"
            onClick={onOpenQuickCalc}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${currentTheme.secondaryBtn}`}
            title="Open formula scratchpad"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="font-medium font-sans">Formula Guide</span>
          </button>

          <button
            id="share-link-btn"
            type="button"
            onClick={handleCopyLink}
            className={`px-3 py-1.5 text-xs rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${currentTheme.secondaryBtn}`}
            title="Share tracker with other reviewers"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium font-sans">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-medium font-sans">Share Link</span>
              </>
            )}
          </button>

          <button
            id="logout-btn"
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Switch user or sign into another account"
          >
            <LogOut className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-medium font-sans">Switch User</span>
          </button>
        </div>
      </div>
    </header>
  );
};
