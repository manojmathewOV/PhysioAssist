/**
 * Mock Backend Server for PhysioAssist
 * Simulates all backend API endpoints for testing
 */

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.MOCK_SERVER_PORT || 3001;
const JWT_SECRET = 'test-secret-key';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory database
const mockDatabase = {
  users: new Map(),
  exercises: new Map(),
  sessions: new Map(),
  progress: new Map(),
};

// Test data
const testUsers = [
  {
    id: 'user-1',
    email: 'test@physioassist.com',
    password: 'Test123!', // In real app, this would be hashed
    name: 'Test User',
    profile: {
      age: 30,
      fitnessLevel: 'intermediate',
      injuries: ['lower_back'],
      goals: ['flexibility', 'strength'],
    },
  },
];

// Initialize test data
testUsers.forEach((user) => mockDatabase.users.set(user.id, user));

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ===== AUTH ENDPOINTS =====

app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({
      error: 'Email, password, and name are required',
    });
  }

  // Check if user exists
  const existingUser = Array.from(mockDatabase.users.values()).find(
    (user) => user.email === email
  );

  if (existingUser) {
    return res.status(409).json({
      error: 'User already exists',
    });
  }

  // Create new user
  const newUser = {
    id: uuidv4(),
    email,
    password, // Should be hashed in production
    name,
    profile: {
      age: null,
      fitnessLevel: 'beginner',
      injuries: [],
      goals: [],
    },
    createdAt: new Date().toISOString(),
  };

  mockDatabase.users.set(newUser.id, newUser);

  // Generate token
  const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      profile: newUser.profile,
    },
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required',
    });
  }

  // Find user
  const user = Array.from(mockDatabase.users.values()).find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    return res.status(401).json({
      error: 'Invalid credentials',
    });
  }

  // Generate token
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      profile: user.profile,
    },
  });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // In real app, might invalidate token
  res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  const user = mockDatabase.users.get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    profile: user.profile,
  });
});

// ===== USER PROFILE ENDPOINTS =====

app.put('/api/users/profile', authenticateToken, (req: any, res) => {
  const user = mockDatabase.users.get(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Update profile
  user.profile = {
    ...user.profile,
    ...req.body,
  };

  mockDatabase.users.set(user.id, user);

  res.json({
    message: 'Profile updated successfully',
    profile: user.profile,
  });
});

// ===== EXERCISE ENDPOINTS =====

app.get('/api/exercises', authenticateToken, (req, res) => {
  const exercises = [
    {
      id: 'bicep_curl',
      name: 'Bicep Curl',
      category: 'strength',
      difficulty: 'beginner',
      muscleGroups: ['biceps', 'forearms'],
      instructions: [
        'Stand with feet shoulder-width apart',
        'Hold weights with palms facing forward',
        'Curl weights toward shoulders',
        'Lower slowly to starting position',
      ],
    },
    {
      id: 'shoulder_press',
      name: 'Shoulder Press',
      category: 'strength',
      difficulty: 'intermediate',
      muscleGroups: ['shoulders', 'triceps'],
      instructions: [
        'Stand with feet hip-width apart',
        'Hold weights at shoulder height',
        'Press weights overhead',
        'Lower back to shoulders',
      ],
    },
    {
      id: 'squat',
      name: 'Bodyweight Squat',
      category: 'strength',
      difficulty: 'beginner',
      muscleGroups: ['quadriceps', 'glutes', 'hamstrings'],
      instructions: [
        'Stand with feet shoulder-width apart',
        'Lower hips back and down',
        'Keep knees behind toes',
        'Push through heels to stand',
      ],
    },
    {
      id: 'hamstring_stretch',
      name: 'Hamstring Stretch',
      category: 'flexibility',
      difficulty: 'beginner',
      muscleGroups: ['hamstrings', 'calves'],
      instructions: [
        'Sit with one leg extended',
        'Reach toward toes',
        'Hold for 30 seconds',
        'Switch legs and repeat',
      ],
    },
  ];

  res.json({ exercises });
});

app.get('/api/exercises/:id', authenticateToken, (req, res) => {
  const exerciseId = req.params.id;

  // Mock detailed exercise data
  const exerciseDetails = {
    id: exerciseId,
    name: 'Bicep Curl',
    videoUrl: 'https://example.com/videos/bicep-curl.mp4',
    thumbnailUrl: 'https://example.com/thumbs/bicep-curl.jpg',
    phases: [
      {
        name: 'start',
        criteria: {
          jointAngles: {
            rightElbow: { min: 160, max: 180 },
            leftElbow: { min: 160, max: 180 },
          },
        },
      },
      {
        name: 'flexion',
        criteria: {
          jointAngles: {
            rightElbow: { min: 30, max: 60 },
            leftElbow: { min: 30, max: 60 },
          },
        },
      },
    ],
  };

  res.json(exerciseDetails);
});

// ===== SESSION ENDPOINTS =====

app.post('/api/sessions', authenticateToken, (req: any, res) => {
  const { exerciseId } = req.body;

  const session = {
    id: uuidv4(),
    userId: req.user.id,
    exerciseId,
    startTime: new Date().toISOString(),
    endTime: null,
    status: 'active',
    metrics: {
      reps: 0,
      sets: 0,
      formScore: 0,
      duration: 0,
    },
  };

  mockDatabase.sessions.set(session.id, session);

  res.status(201).json(session);
});

app.put('/api/sessions/:id', authenticateToken, (req: any, res) => {
  const sessionId = req.params.id;
  const session = mockDatabase.sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Update session
  Object.assign(session, req.body);
  mockDatabase.sessions.set(sessionId, session);

  res.json(session);
});

app.post('/api/sessions/:id/end', authenticateToken, (req: any, res) => {
  const sessionId = req.params.id;
  const session = mockDatabase.sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.userId !== req.user.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // End session
  session.endTime = new Date().toISOString();
  session.status = 'completed';
  session.metrics = req.body.metrics || session.metrics;

  mockDatabase.sessions.set(sessionId, session);

  // Save to progress
  const userProgress = mockDatabase.progress.get(req.user.id) || [];
  userProgress.push({
    sessionId,
    exerciseId: session.exerciseId,
    date: session.endTime,
    metrics: session.metrics,
  });
  mockDatabase.progress.set(req.user.id, userProgress);

  res.json({
    message: 'Session completed',
    session,
    summary: {
      totalReps: session.metrics.reps,
      averageForm: session.metrics.formScore,
      duration: session.metrics.duration,
    },
  });
});

// ===== PROGRESS ENDPOINTS =====

app.get('/api/progress', authenticateToken, (req: any, res) => {
  const userProgress = mockDatabase.progress.get(req.user.id) || [];

  res.json({
    progress: userProgress,
    stats: {
      totalSessions: userProgress.length,
      totalReps: userProgress.reduce((sum, p) => sum + p.metrics.reps, 0),
      averageFormScore:
        userProgress.reduce((sum, p) => sum + p.metrics.formScore, 0) /
          userProgress.length || 0,
      streak: calculateStreak(userProgress),
    },
  });
});

app.get('/api/progress/weekly', authenticateToken, (req: any, res) => {
  const userProgress = mockDatabase.progress.get(req.user.id) || [];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyProgress = userProgress.filter((p) => new Date(p.date) >= weekAgo);

  res.json({
    weeklyProgress,
    dailyBreakdown: groupByDay(weeklyProgress),
  });
});

// ===== ANALYTICS ENDPOINTS =====

app.post('/api/analytics/events', authenticateToken, (req, res) => {
  const { event, properties } = req.body;

  // Log analytics event (in real app, would send to analytics service)
  console.log('Analytics event:', event, properties);

  res.json({ success: true });
});

// ===== HEALTH CHECK =====

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Helper functions
function calculateStreak(progress: any[]): number {
  if (progress.length === 0) return 0;

  const sortedProgress = progress.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 1;
  let currentDate = new Date(sortedProgress[0].date);

  for (let i = 1; i < sortedProgress.length; i++) {
    const prevDate = new Date(sortedProgress[i].date);
    const dayDiff = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

function groupByDay(progress: any[]): any {
  const grouped: any = {};

  progress.forEach((p) => {
    const date = new Date(p.date).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(p);
  });

  return grouped;
}

// Error handling middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err.stack);

  // Handle JSON parsing errors
  if (err.type === 'entity.parse.failed' || err.message?.includes('JSON')) {
    return res.status(400).json({
      error: 'Invalid JSON format',
      message: 'Request body contains malformed JSON',
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Mock server running on http://localhost:${PORT}`);
  });
}

export { app, mockDatabase };
