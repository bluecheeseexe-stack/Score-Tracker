import React from 'react';
import { LayoutGrid, Columns2, Layers, Rows3, Palette, Sparkles } from 'lucide-react';
import { LayoutOption, ThemeOption } from '../types';
import { THEMES } from '../utils/theme';

interface LayoutThemeBarProps {
  layout: LayoutOption;
  onChangeLayout: (layout: LayoutOption) => void;
  theme: ThemeOption;
  onChangeTheme: (theme: ThemeOption) => void;
}

export const LayoutThemeBar: React.FC<LayoutThemeBarProps> = ({
  layout,
  onChangeLayout,
  theme,
  onChangeTheme,
}) => {
  const currentTheme = THEMES[theme];

  const layoutOptions: { id: LayoutOption; label: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'bento',
      label: '3-Col Bento',
      desc: 'Command Center',
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
    },
    {
      id: 'split',
      label: '2-Col Split',
      desc: 'Sidebar Workspace',
      icon: <Columns2 className="w-3.5 h-3.5" />,
    },
    {
      id: 'tabbed',
      label: 'Tabbed Studio',
      desc: 'Focused Panels',
      icon: <Layers className="w-3.5 h-3.5" />,
    },
    {
      id: 'stacked',
      label: 'Classic Stream',
      desc: 'Linear Overview',
      icon: <Rows3 className="w-3.5 h-3.5" />,
    },
  ];

  const themeOptions: { id: ThemeOption; name: string; color: string; label: string }[] = [
    { id: 'emerald', name: 'Vibrant Emerald', color: '#16a34a', label: 'LEPT Green' },
    { id: 'forest', name: 'Forest Scholar', color: '#0f3822', label: 'Pine & Gold' },
    { id: 'sage', name: 'Editorial Sage', color: '#4a634a', label: 'Calm Olive' },
  ];

  return (
    <div
      id="layout-theme-bar"
      className={`mb-6 p-3 sm:p-4 rounded-xl border ${currentTheme.cardBorder} ${currentTheme.cardBg} shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}
    >
      {/* Layout Selection */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>Layout Options:</span>
        </span>
        <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50/80 p-0.5 text-xs shadow-2xs">
          {layoutOptions.map((opt) => {
            const isActive = layout === opt.id;
            return (
              <button
                key={opt.id}
                id={`layout-btn-${opt.id}`}
                type="button"
                onClick={() => onChangeLayout(opt.id)}
                className={`px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  isActive
                    ? `${currentTheme.primaryBtn} font-medium`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/80'
                }`}
                title={`${opt.label}: ${opt.desc}`}
              >
                {opt.icon}
                <span className="font-sans font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Theme Selection */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500 flex items-center gap-1">
          <Palette className="w-3 h-3 text-emerald-600" />
          <span>Palette:</span>
        </span>
        <div className="inline-flex items-center gap-1 bg-gray-50/80 p-0.5 rounded-lg border border-gray-200 text-xs">
          {themeOptions.map((th) => {
            const isSelected = theme === th.id;
            return (
              <button
                key={th.id}
                id={`theme-btn-${th.id}`}
                type="button"
                onClick={() => onChangeTheme(th.id)}
                className={`px-2 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  isSelected
                    ? 'bg-white shadow-2xs text-gray-900 font-semibold border border-gray-200'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title={`Switch to ${th.name}`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full ring-1 ring-black/10 shrink-0"
                  style={{ backgroundColor: th.color }}
                />
                <span className="font-sans text-[11px] hidden sm:inline">{th.name}</span>
                <span className="font-sans text-[11px] sm:hidden">{th.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
