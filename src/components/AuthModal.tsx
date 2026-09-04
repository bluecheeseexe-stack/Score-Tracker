import React, { useState } from 'react';
import { User, Lock, ArrowRight, UserPlus, KeyRound, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { UserProfile } from '../types';

interface AuthModalProps {
  onSuccess: (user: UserProfile) => void;
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onSuccess,
  isOpen,
  onClose,
  canClose = false,
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim();
    const cleanPin = pin.trim();

    if (!cleanUser) {
      setError('Please enter your username.');
      return;
    }
    if (cleanUser.length < 2) {
      setError('Username must be at least 2 characters long.');
      return;
    }
    if (!cleanPin) {
      setError('Please enter a PIN (e.g., 4 digits).');
      return;
    }
    if (cleanPin.length < 2) {
      setError('PIN must be at least 2 characters.');
      return;
    }

    if (isRegister && pin !== confirmPin) {
      setError('PIN confirmation does not match.');
      return;
    }

    setLoading(true);
    try {
      const profile = await apiService.login(cleanUser, cleanPin, isRegister ? 'register' : 'login');
      onSuccess(profile);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 bg-[#2d332d]/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        id="auth-modal-card"
        className="w-full max-w-md bg-white border border-[#d8ded8] rounded shadow-lg p-6 sm:p-8 relative"
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-[#f2f4f2] border border-[#d8ded8] text-[#4a634a] mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#4a634a]">
            {isRegister ? 'Create Reviewer Profile' : 'Candidate Sign In'}
          </h2>
          <p className="text-xs text-[#8a968a] mt-1 italic">
            No email required. Simply use your username and private PIN.
          </p>
        </div>

        {error && (
          <div
            id="auth-error-banner"
            className="mb-4 p-3 text-xs text-red-800 bg-[#faebeb] border border-[#f0c3c3] rounded flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a634a] mb-1.5">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-[#8a968a]" />
              <input
                id="auth-username-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. TeacherDani or Juan2026"
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#fafafa] border border-[#d8ded8] rounded text-[#2d332d] focus:outline-none focus:border-[#4a634a]"
                required
              />
            </div>
            <span className="text-[10px] text-[#8a968a] mt-1 block">
              Case-insensitive unique identifier for your assessments.
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#4a634a]">
                Private PIN
              </label>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="text-[10px] uppercase font-bold text-[#4a634a] hover:underline cursor-pointer"
              >
                {showPin ? 'Hide PIN' : 'Show PIN'}
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-[#8a968a]" />
              <input
                id="auth-pin-input"
                type={showPin ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="e.g. 1234"
                maxLength={20}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#fafafa] border border-[#d8ded8] rounded text-[#2d332d] focus:outline-none focus:border-[#4a634a] font-mono"
                required
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4a634a] mb-1.5">
                Confirm PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-[#8a968a]" />
                <input
                  id="auth-confirm-pin-input"
                  type={showPin ? 'text' : 'password'}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="Repeat your PIN"
                  maxLength={20}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-[#fafafa] border border-[#d8ded8] rounded text-[#2d332d] focus:outline-none focus:border-[#4a634a] font-mono"
                  required
                />
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded bg-[#4a634a] hover:bg-[#3d523d] text-white font-medium text-xs uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <span>Please wait...</span>
              ) : isRegister ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account & Start</span>
                </>
              ) : (
                <>
                  <span>Sign In to Tracker</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-5 pt-4 border-t border-[#d8ded8] flex items-center justify-between text-xs">
          <span className="text-[#8a968a]">
            {isRegister ? 'Already have an account?' : 'First time using this link?'}
          </span>
          <button
            id="auth-toggle-mode-btn"
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-[#4a634a] hover:underline font-bold text-xs cursor-pointer"
          >
            {isRegister ? 'Sign in with PIN' : 'Create new profile'}
          </button>
        </div>

        {canClose && onClose && (
          <div className="mt-3 text-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[#8a968a] hover:text-[#2d332d] underline cursor-pointer"
            >
              Cancel and return
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
