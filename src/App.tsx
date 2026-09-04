import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ProgressSection } from './components/ProgressSection';
import { AddAssessmentSection } from './components/AddAssessmentSection';
import { AssessmentHistory } from './components/AssessmentHistory';
import { QuickCalculatorModal } from './components/QuickCalculatorModal';
import { LayoutThemeBar } from './components/LayoutThemeBar';
import { UserProfile, LayoutOption, ThemeOption } from './types';
import { computeProgressStats } from './utils/calculator';
import { apiService, storageService } from './services/api';
import { THEMES } from './utils/theme';
import { BarChart3, PlusCircle, FolderGit2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeFile, setActiveFile] = useState<string>('all');
  const [isQuickCalcOpen, setIsQuickCalcOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Layout & Theme options persisted to localStorage
  const [layout, setLayout] = useState<LayoutOption>(() => {
    const saved = localStorage.getItem('lept_layout_preference');
    return (saved as LayoutOption) || 'bento';
  });

  const [theme, setTheme] = useState<ThemeOption>(() => {
    const saved = localStorage.getItem('lept_theme_preference');
    return (saved as ThemeOption) || 'emerald';
  });

  // Tabbed layout active panel
  const [studioTab, setStudioTab] = useState<'progress' | 'add' | 'history'>('progress');

  const handleLayoutChange = (newLayout: LayoutOption) => {
    setLayout(newLayout);
    localStorage.setItem('lept_layout_preference', newLayout);
  };

  const handleThemeChange = (newTheme: ThemeOption) => {
    setTheme(newTheme);
    localStorage.setItem('lept_theme_preference', newTheme);
  };

  const currentTheme = THEMES[theme];

  // Initialize session on mount - auto-load sample teacher for instant rich preview
  useEffect(() => {
    async function initSession() {
      const activeSession = storageService.getActiveSession();
      if (activeSession) {
        try {
          const profile = await apiService.fetchUserData(
            activeSession.username,
            activeSession.pin
          );
          setUser(profile);
        } catch {
          const local = storageService.getLocalUser(activeSession.username);
          if (local) {
            setUser(local);
          } else {
            setIsAuthModalOpen(true);
          }
        }
      } else {
        // Auto-load "Teacher Dani" profile for instant rich preview
        try {
          const defaultUser = await apiService.fetchUserData('teacher_dani', '1234');
          setUser(defaultUser);
          storageService.setActiveSession({
            username: 'teacher_dani',
            displayName: defaultUser.displayName || 'Teacher Dani',
            pin: '1234',
          });
        } catch {
          // If server call fails, storage fallback creates local default
          const fallback = storageService.getLocalUser('teacher_dani');
          if (fallback) {
            setUser(fallback);
          } else {
            setIsAuthModalOpen(true);
          }
        }
      }
      setIsLoadingUser(false);
    }

    initSession();
  }, []);

  const handleLogout = () => {
    storageService.setActiveSession(null);
    setUser(null);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
    setIsAuthModalOpen(false);
  };

  // Update target rating
  const handleUpdateTarget = async (newTarget: number) => {
    if (!user) return;
    try {
      const updatedTarget = await apiService.updateTargetRating(
        user.username,
        user.pin,
        newTarget
      );
      setUser({
        ...user,
        targetRating: updatedTarget,
      });
    } catch (e) {
      console.error('Target update error:', e);
      throw e;
    }
  };

  // Add new file folder
  const handleAddNewFile = async (fileName: string) => {
    if (!user) return;
    try {
      const updatedFiles = await apiService.addFile(
        user.username,
        user.pin,
        fileName
      );
      setUser({
        ...user,
        files: updatedFiles,
      });
    } catch (e) {
      console.error('Add file error:', e);
      throw e;
    }
  };

  // Add new assessment
  const handleAddAssessment = async (data: {
    name: string;
    file: string;
    rawScore: number;
    totalItems: number;
    date: string;
    notes?: string;
  }) => {
    if (!user) return;
    try {
      const result = await apiService.addAssessment(user.username, user.pin, data);
      setUser({
        ...user,
        assessments: result.assessments,
        files: result.files,
      });
    } catch (e) {
      console.error('Add assessment error:', e);
      throw e;
    }
  };

  // Update existing assessment
  const handleUpdateAssessment = async (
    id: string,
    data: {
      name: string;
      file: string;
      rawScore: number;
      totalItems: number;
      date: string;
      notes?: string;
    }
  ) => {
    if (!user) return;
    try {
      const result = await apiService.updateAssessment(
        user.username,
        user.pin,
        id,
        data
      );
      setUser({
        ...user,
        assessments: result.assessments,
        files: result.files,
      });
    } catch (e) {
      console.error('Update assessment error:', e);
      throw e;
    }
  };

  // Delete assessment
  const handleDeleteAssessment = async (id: string) => {
    if (!user) return;
    try {
      const updated = await apiService.deleteAssessment(
        user.username,
        user.pin,
        id
      );
      setUser({
        ...user,
        assessments: updated,
      });
    } catch (e) {
      console.error('Delete assessment error:', e);
      throw e;
    }
  };

  // Compute progress statistics
  const progressStats = useMemo(() => {
    if (!user) {
      return computeProgressStats([], 91.0);
    }
    return computeProgressStats(user.assessments, user.targetRating);
  }, [user]);

  if (isLoadingUser) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300"
        style={{ backgroundColor: currentTheme.canvasBg }}
      >
        <div className="text-center space-y-3">
          <div
            className="w-9 h-9 mx-auto border-3 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: currentTheme.dotColor, borderTopColor: 'transparent' }}
          />
          <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">
            Loading LEPT Rating Tracker...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-gray-800 py-6 px-3 sm:px-6 lg:px-8 transition-colors duration-300"
      style={{ backgroundColor: currentTheme.canvasBg }}
    >
      <div className={layout === 'bento' ? 'max-w-7xl mx-auto' : 'max-w-5xl mx-auto'}>
        {user ? (
          <>
            {/* Header with Title and Quoted Subheading */}
            <Header
              user={user}
              onLogout={handleLogout}
              onOpenQuickCalc={() => setIsQuickCalcOpen(true)}
              theme={theme}
            />

            {/* Layout Options & Color Palette Bar */}
            <LayoutThemeBar
              layout={layout}
              onChangeLayout={handleLayoutChange}
              theme={theme}
              onChangeTheme={handleThemeChange}
            />

            {/* LAYOUT OPTION 1: BENTO COMMAND CENTER */}
            {layout === 'bento' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Bento: Add Assessment Form */}
                  <div className="lg:col-span-5">
                    <AddAssessmentSection
                      files={user.files}
                      activeFile={activeFile}
                      onAddAssessment={handleAddAssessment}
                      onAddNewFile={handleAddNewFile}
                      theme={theme}
                      compact={true}
                    />
                  </div>

                  {/* Right Bento: Progress & Benchmark Visualization */}
                  <div className="lg:col-span-7">
                    <ProgressSection
                      stats={progressStats}
                      onUpdateTarget={handleUpdateTarget}
                      theme={theme}
                      compact={true}
                      assessments={user.assessments}
                      files={user.files}
                    />
                  </div>
                </div>

                {/* Bottom Bento: Assessment History */}
                <div className="w-full">
                  <AssessmentHistory
                    assessments={user.assessments}
                    files={user.files}
                    activeFile={activeFile}
                    onSelectFile={(f) => setActiveFile(f)}
                    onDeleteAssessment={handleDeleteAssessment}
                    onUpdateAssessment={handleUpdateAssessment}
                    targetRating={user.targetRating}
                    theme={theme}
                  />
                </div>
              </div>
            )}

            {/* LAYOUT OPTION 2: 2-COLUMN SPLIT WORKSPACE */}
            {layout === 'split' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (Sticky Sidebar) */}
                <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
                  <AddAssessmentSection
                    files={user.files}
                    activeFile={activeFile}
                    onAddAssessment={handleAddAssessment}
                    onAddNewFile={handleAddNewFile}
                    theme={theme}
                    compact={true}
                  />
                </div>

                {/* Right Column: Progress & History Stream */}
                <div className="lg:col-span-7 space-y-6">
                  <ProgressSection
                    stats={progressStats}
                    onUpdateTarget={handleUpdateTarget}
                    theme={theme}
                    assessments={user.assessments}
                    files={user.files}
                  />

                  <AssessmentHistory
                    assessments={user.assessments}
                    files={user.files}
                    activeFile={activeFile}
                    onSelectFile={(f) => setActiveFile(f)}
                    onDeleteAssessment={handleDeleteAssessment}
                    onUpdateAssessment={handleUpdateAssessment}
                    targetRating={user.targetRating}
                    theme={theme}
                  />
                </div>
              </div>
            )}

            {/* LAYOUT OPTION 3: TABBED STUDIO */}
            {layout === 'tabbed' && (
              <div className="space-y-6">
                {/* Studio Tab Switcher */}
                <div className="flex border-b border-gray-200 bg-white rounded-xl p-1.5 shadow-xs">
                  <button
                    type="button"
                    onClick={() => setStudioTab('progress')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-sans font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      studioTab === 'progress'
                        ? `${currentTheme.primaryBtn} shadow-xs`
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Progress & Benchmark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudioTab('add')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-sans font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      studioTab === 'add'
                        ? `${currentTheme.primaryBtn} shadow-xs`
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Add Assessment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStudioTab('history')}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-sans font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      studioTab === 'history'
                        ? `${currentTheme.primaryBtn} shadow-xs`
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <FolderGit2 className="w-4 h-4" />
                    <span>Assessment History ({user.assessments.length})</span>
                  </button>
                </div>

                {/* Tab Content */}
                {studioTab === 'progress' && (
                  <ProgressSection
                    stats={progressStats}
                    onUpdateTarget={handleUpdateTarget}
                    theme={theme}
                    assessments={user.assessments}
                    files={user.files}
                  />
                )}

                {studioTab === 'add' && (
                  <AddAssessmentSection
                    files={user.files}
                    activeFile={activeFile}
                    onAddAssessment={handleAddAssessment}
                    onAddNewFile={handleAddNewFile}
                    theme={theme}
                  />
                )}

                {studioTab === 'history' && (
                  <AssessmentHistory
                    assessments={user.assessments}
                    files={user.files}
                    activeFile={activeFile}
                    onSelectFile={(f) => setActiveFile(f)}
                    onDeleteAssessment={handleDeleteAssessment}
                    onUpdateAssessment={handleUpdateAssessment}
                    targetRating={user.targetRating}
                    theme={theme}
                  />
                )}
              </div>
            )}

            {/* LAYOUT OPTION 4: CLASSIC STREAM (LINEAR STACKED) */}
            {layout === 'stacked' && (
              <div className="space-y-8">
                {/* Progress Section: Target, Average, Latest, Points Until Goal */}
                <ProgressSection
                  stats={progressStats}
                  onUpdateTarget={handleUpdateTarget}
                  theme={theme}
                  assessments={user.assessments}
                  files={user.files}
                />

                {/* Section to Add Assessment: Name, Score, Total Items, File */}
                <AddAssessmentSection
                  files={user.files}
                  activeFile={activeFile}
                  onAddAssessment={handleAddAssessment}
                  onAddNewFile={handleAddNewFile}
                  theme={theme}
                />

                {/* Assessment History: Organized by File */}
                <AssessmentHistory
                  assessments={user.assessments}
                  files={user.files}
                  activeFile={activeFile}
                  onSelectFile={(f) => setActiveFile(f)}
                  onDeleteAssessment={handleDeleteAssessment}
                  onUpdateAssessment={handleUpdateAssessment}
                  targetRating={user.targetRating}
                  theme={theme}
                />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white border border-gray-200 rounded-xl p-8 max-w-lg mx-auto shadow-xs">
            <h1 className={`text-2xl sm:text-3xl font-bold ${currentTheme.textHeading} mb-3`}>
              LEPT Rating Tracker
            </h1>
            <p className="text-xs text-gray-500 italic max-w-md mx-auto mb-6">
              Please sign in with your username and PIN to load your personal assessment tracker.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className={`px-6 py-2.5 rounded-lg text-white font-medium text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer ${currentTheme.primaryBtn}`}
            >
              Sign In or Create Account
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200/80 flex flex-col sm:flex-row justify-between items-center text-[10px] text-gray-500 uppercase tracking-[0.2em] gap-2">
          <span>LPT Board Exam Prep Tool &bull; Transmutation Formula: (Raw &times; 60 &divide; Total) + 40</span>
          <span>Shared Multi-User Mode Active &bull; &copy; Dani</span>
        </footer>
      </div>

      {/* Auth Modal: Username + PIN without email */}
      <AuthModal
        isOpen={isAuthModalOpen}
        canClose={!!user}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Quick Calculator Modal */}
      <QuickCalculatorModal
        isOpen={isQuickCalcOpen}
        onClose={() => setIsQuickCalcOpen(false)}
      />
    </div>
  );
}
