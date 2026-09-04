import { Assessment, UserProfile } from '../types';
import { calculateLeptRating } from '../utils/calculator';

const LOCAL_STORAGE_KEY_PREFIX = 'lept_user_data_';
const ACTIVE_SESSION_KEY = 'lept_active_session';

export interface AuthSession {
  username: string;
  displayName: string;
  pin: string;
}

export const storageService = {
  // Get active session from browser
  getActiveSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setActiveSession(session: AuthSession | null) {
    if (!session) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    }
  },

  // Client-side fallback store in case server isn't available
  getLocalUser(username: string): UserProfile | null {
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${username.toLowerCase()}`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveLocalUser(user: UserProfile) {
    try {
      localStorage.setItem(
        `${LOCAL_STORAGE_KEY_PREFIX}${user.username.toLowerCase()}`,
        JSON.stringify(user)
      );
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  },
};

export const apiService = {
  async login(username: string, pin: string, mode?: 'login' | 'register'): Promise<UserProfile> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, pin, mode }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server returned error (${res.status})`);
      }

      const data = await res.json();
      const profile: UserProfile = {
        ...data.user,
        pin,
      };

      // Also mirror in local storage
      storageService.saveLocalUser(profile);
      storageService.setActiveSession({
        username: profile.username,
        displayName: profile.displayName,
        pin,
      });

      return profile;
    } catch (serverErr: any) {
      // Fallback to client-side localStorage if server network error
      console.warn('Network call failed, trying local storage fallback:', serverErr.message);

      const cleanUser = username.trim().toLowerCase();
      const local = storageService.getLocalUser(cleanUser);

      if (local) {
        if (local.pin !== pin) {
          throw new Error('Incorrect PIN for this username.');
        }
        storageService.setActiveSession({
          username: local.username,
          displayName: local.displayName,
          pin,
        });
        return local;
      }

      // Create new locally
      const now = Date.now();
      const defaultProfile: UserProfile = {
        username: cleanUser,
        displayName: username.trim() || 'Teacher Dani',
        pin: pin.trim(),
        targetRating: 91.0,
        files: ['General Education', 'Professional Education', 'Majorship', 'Mock Drills'],
        assessments: [
          {
            id: `asm-init-1`,
            name: 'Gen Ed Diagnostic Examination',
            file: 'General Education',
            rawScore: 82,
            totalItems: 100,
            rating: calculateLeptRating(82, 100), // 89.20%
            date: '2026-08-28',
            notes: 'High mastery in English Grammar and Social Science.',
            createdAt: now - 86400000 * 7,
          },
          {
            id: `asm-init-2`,
            name: 'Prof Ed: Child & Adolescent Learners',
            file: 'Professional Education',
            rawScore: 44,
            totalItems: 50,
            rating: calculateLeptRating(44, 50), // 92.80%
            date: '2026-08-30',
            notes: 'Piaget and Vygotsky development stages well recalled.',
            createdAt: now - 86400000 * 5,
          },
          {
            id: `asm-init-3`,
            name: 'Curriculum Dev & Teaching Strategies',
            file: 'Professional Education',
            rawScore: 38,
            totalItems: 50,
            rating: calculateLeptRating(38, 50), // 85.60%
            date: '2026-09-01',
            notes: 'Review Bloom taxonomy action verbs for assessment questions.',
            createdAt: now - 86400000 * 3,
          },
          {
            id: `asm-init-4`,
            name: 'Majorship Specialization Core Drill',
            file: 'Majorship',
            rawScore: 72,
            totalItems: 90,
            rating: calculateLeptRating(72, 90), // 88.00%
            date: '2026-09-03',
            notes: 'Consistent speed pacing at ~45 seconds per question.',
            createdAt: now - 86400000 * 1,
          },
        ],
      };

      storageService.saveLocalUser(defaultProfile);
      storageService.setActiveSession({
        username: defaultProfile.username,
        displayName: defaultProfile.displayName,
        pin,
      });

      return defaultProfile;
    }
  },

  async fetchUserData(username: string, pin: string): Promise<UserProfile> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}`, {
        headers: {
          'x-user-pin': pin,
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch user data');
      }

      const data = await res.json();
      const profile: UserProfile = { ...data, pin };
      storageService.saveLocalUser(profile);
      return profile;
    } catch (err: any) {
      const local = storageService.getLocalUser(username);
      if (local) return local;
      throw err;
    }
  },

  async addAssessment(
    username: string,
    pin: string,
    payload: { name: string; file: string; rawScore: number; totalItems: number; date?: string; notes?: string }
  ): Promise<{ assessment: Assessment; assessments: Assessment[]; files: string[] }> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-pin': pin,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save assessment');
      }

      const data = await res.json();
      const local = storageService.getLocalUser(username);
      if (local) {
        local.assessments = data.assessments;
        local.files = data.files;
        storageService.saveLocalUser(local);
      }
      return data;
    } catch (err: any) {
      // Local fallback
      const local = storageService.getLocalUser(username);
      if (!local) throw err;

      const computedRating = calculateLeptRating(payload.rawScore, payload.totalItems);
      const newAsm: Assessment = {
        id: `asm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: payload.name.trim(),
        file: payload.file.trim(),
        rawScore: payload.rawScore,
        totalItems: payload.totalItems,
        rating: computedRating,
        date: payload.date || new Date().toISOString().split('T')[0],
        notes: payload.notes || '',
        createdAt: Date.now(),
      };

      if (!local.files.includes(newAsm.file)) {
        local.files.push(newAsm.file);
      }
      local.assessments.unshift(newAsm);
      storageService.saveLocalUser(local);

      return {
        assessment: newAsm,
        assessments: local.assessments,
        files: local.files,
      };
    }
  },

  async updateAssessment(
    username: string,
    pin: string,
    assessmentId: string,
    payload: { name: string; file: string; rawScore: number; totalItems: number; date: string; notes?: string }
  ): Promise<{ assessment: Assessment; assessments: Assessment[]; files: string[] }> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/assessments/${assessmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-pin': pin,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update assessment');
      }

      const data = await res.json();
      const local = storageService.getLocalUser(username);
      if (local) {
        local.assessments = data.assessments;
        local.files = data.files;
        storageService.saveLocalUser(local);
      }
      return data;
    } catch (err: any) {
      const local = storageService.getLocalUser(username);
      if (!local) throw err;

      const idx = local.assessments.findIndex((a) => a.id === assessmentId);
      if (idx !== -1) {
        const rating = calculateLeptRating(payload.rawScore, payload.totalItems);
        local.assessments[idx] = {
          ...local.assessments[idx],
          name: payload.name,
          file: payload.file,
          rawScore: payload.rawScore,
          totalItems: payload.totalItems,
          rating,
          date: payload.date,
          notes: payload.notes || '',
        };
        if (!local.files.includes(payload.file)) {
          local.files.push(payload.file);
        }
        storageService.saveLocalUser(local);
        return {
          assessment: local.assessments[idx],
          assessments: local.assessments,
          files: local.files,
        };
      }
      throw err;
    }
  },

  async deleteAssessment(username: string, pin: string, assessmentId: string): Promise<Assessment[]> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/assessments/${assessmentId}`, {
        method: 'DELETE',
        headers: { 'x-user-pin': pin },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete assessment');
      }

      const data = await res.json();
      const local = storageService.getLocalUser(username);
      if (local) {
        local.assessments = data.assessments;
        storageService.saveLocalUser(local);
      }
      return data.assessments;
    } catch (err: any) {
      const local = storageService.getLocalUser(username);
      if (!local) throw err;
      local.assessments = local.assessments.filter((a) => a.id !== assessmentId);
      storageService.saveLocalUser(local);
      return local.assessments;
    }
  },

  async updateTargetRating(username: string, pin: string, targetRating: number): Promise<number> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/target`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-pin': pin,
        },
        body: JSON.stringify({ targetRating }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update target');
      }

      const data = await res.json();
      const local = storageService.getLocalUser(username);
      if (local) {
        local.targetRating = data.targetRating;
        storageService.saveLocalUser(local);
      }
      return data.targetRating;
    } catch (err: any) {
      const local = storageService.getLocalUser(username);
      if (local) {
        local.targetRating = targetRating;
        storageService.saveLocalUser(local);
        return targetRating;
      }
      throw err;
    }
  },

  async addFile(username: string, pin: string, fileName: string): Promise<string[]> {
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(username)}/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-pin': pin,
        },
        body: JSON.stringify({ fileName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add file');
      }

      const data = await res.json();
      const local = storageService.getLocalUser(username);
      if (local) {
        local.files = data.files;
        storageService.saveLocalUser(local);
      }
      return data.files;
    } catch (err: any) {
      const local = storageService.getLocalUser(username);
      if (local) {
        if (!local.files.includes(fileName.trim())) {
          local.files.push(fileName.trim());
          storageService.saveLocalUser(local);
        }
        return local.files;
      }
      throw err;
    }
  },
};
