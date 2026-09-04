import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface UserAssessment {
  id: string;
  name: string;
  file: string;
  rawScore: number;
  totalItems: number;
  rating: number;
  date: string;
  notes?: string;
  createdAt: number;
}

interface UserRecord {
  username: string;
  displayName: string;
  pin: string;
  targetRating: number;
  files: string[];
  assessments: UserAssessment[];
  createdAt: number;
  updatedAt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'users_store.json');

// In-memory cache synced with disk
let store: Record<string, UserRecord> = {};

function initDataStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      store = JSON.parse(raw);
    } else {
      store = {};
    }

    // Always ensure default reviewer profile 'dani' exists for instant preview
    if (!store['dani']) {
      const now = Date.now();
      store['dani'] = {
        username: 'dani',
        displayName: 'Teacher Dani',
        pin: '1234',
        targetRating: 91.0,
        files: ['General Education', 'Professional Education', 'Majorship', 'Mock Drills'],
        assessments: [
          {
            id: `asm-dani-1`,
            name: 'Gen Ed Diagnostic Examination',
            file: 'General Education',
            rawScore: 82,
            totalItems: 100,
            rating: calculateLeptRating(82, 100), // 89.20%
            date: '2026-08-28',
            notes: 'High mastery in English Grammar and Social Science. Need refresher on Rizal poems.',
            createdAt: now - 86400000 * 7,
          },
          {
            id: `asm-dani-2`,
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
            id: `asm-dani-3`,
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
            id: `asm-dani-4`,
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
        createdAt: now - 86400000 * 10,
        updatedAt: now,
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error initializing data store:', err);
    store = {};
  }
}

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store:', err);
  }
}

// Compute standard LEPT rating: (raw score × 60 ÷ total items) + 40
function calculateLeptRating(rawScore: number, totalItems: number): number {
  if (!totalItems || totalItems <= 0) return 0;
  const rating = (rawScore * 60) / totalItems + 40;
  return Math.round(rating * 100) / 100;
}

async function startServer() {
  initDataStore();
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeUsersCount: Object.keys(store).length });
  });

  // Auth: Login or Register
  app.post('/api/auth/login', (req, res) => {
    const { username, pin, mode } = req.body;
    if (!username || typeof username !== 'string' || !username.trim()) {
      res.status(400).json({ error: 'Username is required.' });
      return;
    }
    if (!pin || typeof pin !== 'string' || pin.trim().length < 2) {
      res.status(400).json({ error: 'A PIN with at least 2 characters is required.' });
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    const displayName = username.trim();
    const cleanPin = pin.trim();

    const existingUser = store[cleanUsername];

    if (existingUser) {
      if (mode === 'register') {
        res.status(409).json({ error: 'This username is already taken. Please choose another or sign in.' });
        return;
      }
      if (existingUser.pin !== cleanPin) {
        res.status(401).json({ error: 'Incorrect PIN for this username. Please verify and try again.' });
        return;
      }
      res.json({
        success: true,
        user: {
          username: existingUser.username,
          displayName: existingUser.displayName,
          targetRating: existingUser.targetRating,
          files: existingUser.files,
          assessments: existingUser.assessments,
        },
      });
      return;
    }

    // New user registration
    const defaultFiles = ['General Education', 'Professional Education', 'Majorship', 'Mock Drills'];
    const newUser: UserRecord = {
      username: cleanUsername,
      displayName,
      pin: cleanPin,
      targetRating: 91.0,
      files: defaultFiles,
      assessments: [
        {
          id: `demo-${Date.now()}`,
          name: 'Diagnostic Assessment 1',
          file: 'General Education',
          rawScore: 78,
          totalItems: 100,
          rating: calculateLeptRating(78, 100), // 86.80
          date: new Date().toISOString().split('T')[0],
          notes: 'Initial baseline test. Keep up the review!',
          createdAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    store[cleanUsername] = newUser;
    saveStore();

    res.status(201).json({
      success: true,
      user: {
        username: newUser.username,
        displayName: newUser.displayName,
        targetRating: newUser.targetRating,
        files: newUser.files,
        assessments: newUser.assessments,
      },
    });
  });

  // Verify PIN middleware
  const verifyPin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const rawUsername = req.params.username;
    if (!rawUsername) {
      res.status(400).json({ error: 'Username parameter missing.' });
      return;
    }
    const cleanUsername = rawUsername.toLowerCase().trim();
    const user = store[cleanUsername];
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const providedPin = (req.headers['x-user-pin'] as string) || req.body?.pin;
    if (!providedPin || providedPin !== user.pin) {
      res.status(401).json({ error: 'Invalid or missing PIN.' });
      return;
    }

    (req as any).userRecord = user;
    next();
  };

  // Get user profile and assessments
  app.get('/api/users/:username', verifyPin, (req, res) => {
    const user: UserRecord = (req as any).userRecord;
    res.json({
      username: user.username,
      displayName: user.displayName,
      targetRating: user.targetRating,
      files: user.files,
      assessments: user.assessments,
    });
  });

  // Add assessment
  app.post('/api/users/:username/assessments', verifyPin, (req, res) => {
    const user: UserRecord = (req as any).userRecord;
    const { name, file, rawScore, totalItems, date, notes } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Assessment name is required.' });
      return;
    }

    const parsedRaw = Number(rawScore);
    const parsedTotal = Number(totalItems);

    if (isNaN(parsedRaw) || parsedRaw < 0) {
      res.status(400).json({ error: 'Raw score must be a valid non-negative number.' });
      return;
    }
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      res.status(400).json({ error: 'Total items must be greater than 0.' });
      return;
    }
    if (parsedRaw > parsedTotal) {
      res.status(400).json({ error: 'Raw score cannot exceed total number of items.' });
      return;
    }

    const assignedFile = (file && typeof file === 'string' && file.trim()) ? file.trim() : 'General Education';
    if (!user.files.includes(assignedFile)) {
      user.files.push(assignedFile);
    }

    const computedRating = calculateLeptRating(parsedRaw, parsedTotal);
    const newAssessment: UserAssessment = {
      id: `asm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      file: assignedFile,
      rawScore: parsedRaw,
      totalItems: parsedTotal,
      rating: computedRating,
      date: date && typeof date === 'string' ? date : new Date().toISOString().split('T')[0],
      notes: notes && typeof notes === 'string' ? notes.trim() : '',
      createdAt: Date.now(),
    };

    user.assessments.unshift(newAssessment);
    user.updatedAt = Date.now();
    saveStore();

    res.status(201).json({
      success: true,
      assessment: newAssessment,
      assessments: user.assessments,
      files: user.files,
    });
  });

  // Update assessment
  app.put('/api/users/:username/assessments/:id', verifyPin, (req, res) => {
    const user: UserRecord = (req as any).userRecord;
    const assessmentId = req.params.id;
    const { name, file, rawScore, totalItems, date, notes } = req.body;

    const index = user.assessments.findIndex((a) => a.id === assessmentId);
    if (index === -1) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    const parsedRaw = Number(rawScore);
    const parsedTotal = Number(totalItems);

    if (isNaN(parsedRaw) || parsedRaw < 0 || isNaN(parsedTotal) || parsedTotal <= 0 || parsedRaw > parsedTotal) {
      res.status(400).json({ error: 'Valid raw score and total items are required.' });
      return;
    }

    const assignedFile = (file && typeof file === 'string' && file.trim()) ? file.trim() : user.assessments[index].file;
    if (!user.files.includes(assignedFile)) {
      user.files.push(assignedFile);
    }

    const computedRating = calculateLeptRating(parsedRaw, parsedTotal);

    user.assessments[index] = {
      ...user.assessments[index],
      name: name?.trim() || user.assessments[index].name,
      file: assignedFile,
      rawScore: parsedRaw,
      totalItems: parsedTotal,
      rating: computedRating,
      date: date || user.assessments[index].date,
      notes: typeof notes === 'string' ? notes.trim() : user.assessments[index].notes,
    };

    user.updatedAt = Date.now();
    saveStore();

    res.json({
      success: true,
      assessment: user.assessments[index],
      assessments: user.assessments,
      files: user.files,
    });
  });

  // Delete assessment
  app.delete('/api/users/:username/assessments/:id', verifyPin, (req, res) => {
    const user: UserRecord = (req as any).userRecord;
    const assessmentId = req.params.id;

    const initialCount = user.assessments.length;
    user.assessments = user.assessments.filter((a) => a.id !== assessmentId);

    if (user.assessments.length === initialCount) {
      res.status(404).json({ error: 'Assessment not found.' });
      return;
    }

    user.updatedAt = Date.now();
    saveStore();

    res.json({ success: true, assessments: user.assessments });
  });

  // Update target rating
  app.patch('/api/users/:username/target', verifyPin, (req, res) => {
    const user: UserRecord = (req as any).userRecord;
    const { targetRating } = req.body;
    const parsed = Number(targetRating);

    if (isNaN(parsed) || parsed < 40 || parsed > 100) {
      res.status(400).json({ error: 'Target rating must be between 40.0 and 100.0.' });
      return;
    }

    user.targetRating = Math.round(parsed * 100) / 100;
    user.updatedAt = Date.now();
    saveStore();

    res.json({ success: true, targetRating: user.targetRating });
  });

  // Add custom file folder
  app.post('/api/users/:username/files', verifyPin, (req, res) => {
    const user: UserRecord = (req as any).userRecord;
    const { fileName } = req.body;
    if (!fileName || typeof fileName !== 'string' || !fileName.trim()) {
      res.status(400).json({ error: 'File name is required.' });
      return;
    }

    const trimmed = fileName.trim();
    if (!user.files.includes(trimmed)) {
      user.files.push(trimmed);
      user.updatedAt = Date.now();
      saveStore();
    }

    res.json({ success: true, files: user.files });
  });

  // Delete custom file folder
  app.delete('/api/users/:username/files/:fileName', verifyPin, (req, res) => {
    const user: UserRecord = (req as any).userRecord;
    const fileName = decodeURIComponent(req.params.fileName);

    if (user.files.length <= 1) {
      res.status(400).json({ error: 'At least one file must remain.' });
      return;
    }

    user.files = user.files.filter((f) => f !== fileName);
    // Reassign any assessments in that file to the first file
    const fallbackFile = user.files[0];
    user.assessments.forEach((a) => {
      if (a.file === fileName) {
        a.file = fallbackFile;
      }
    });

    user.updatedAt = Date.now();
    saveStore();

    res.json({ success: true, files: user.files, assessments: user.assessments });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
