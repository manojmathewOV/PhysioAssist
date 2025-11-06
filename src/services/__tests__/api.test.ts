/**
 * Backend API Tests for PhysioAssist
 * Tests all API endpoints with various scenarios
 */

import axios, { AxiosInstance } from 'axios';
import { app, mockDatabase } from '../../mocks/mockServer';
import { Server } from 'http';

describe('PhysioAssist Backend API Tests', () => {
  let server: Server;
  let api: AxiosInstance;
  let authToken: string;
  const baseURL = 'http://localhost:3002';

  beforeAll((done) => {
    server = app.listen(3002, () => {
      api = axios.create({ baseURL });
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    // Clear mock database
    mockDatabase.users.clear();
    mockDatabase.sessions.clear();
    mockDatabase.exercises.clear();
    mockDatabase.progress.clear();

    // Add test user
    mockDatabase.users.set('user-1', {
      id: 'user-1',
      email: 'test@physioassist.com',
      password: 'Test123!',
      name: 'Test User',
      profile: {
        age: 30,
        fitnessLevel: 'intermediate',
        injuries: ['lower_back'],
        goals: ['flexibility', 'strength'],
      },
    });
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/auth/register', () => {
      it('should register a new user with valid data', async () => {
        const newUser = {
          email: 'newuser@test.com',
          password: 'NewPass123!',
          name: 'New User',
        };

        const response = await api.post('/api/auth/register', newUser);

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('token');
        expect(response.data.user).toMatchObject({
          email: newUser.email,
          name: newUser.name,
        });
        expect(response.data.user).not.toHaveProperty('password');
      });

      it('should reject registration with missing fields', async () => {
        const invalidUser = {
          email: 'test@test.com',
          // Missing password and name
        };

        try {
          await api.post('/api/auth/register', invalidUser);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(400);
          expect(error.response.data.error).toContain('required');
        }
      });

      it('should reject duplicate email registration', async () => {
        const duplicateUser = {
          email: 'test@physioassist.com', // Already exists
          password: 'AnotherPass123!',
          name: 'Another User',
        };

        try {
          await api.post('/api/auth/register', duplicateUser);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(409);
          expect(error.response.data.error).toContain('already exists');
        }
      });
    });

    describe('POST /api/auth/login', () => {
      it('should login with valid credentials', async () => {
        const credentials = {
          email: 'test@physioassist.com',
          password: 'Test123!',
        };

        const response = await api.post('/api/auth/login', credentials);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('token');
        expect(response.data.user).toMatchObject({
          email: credentials.email,
        });

        authToken = response.data.token;
      });

      it('should reject login with invalid email', async () => {
        const invalidCredentials = {
          email: 'wrong@test.com',
          password: 'Test123!',
        };

        try {
          await api.post('/api/auth/login', invalidCredentials);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.error).toContain('Invalid credentials');
        }
      });

      it('should reject login with invalid password', async () => {
        const invalidCredentials = {
          email: 'test@physioassist.com',
          password: 'WrongPassword',
        };

        try {
          await api.post('/api/auth/login', invalidCredentials);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.error).toContain('Invalid credentials');
        }
      });

      it('should reject login with missing credentials', async () => {
        try {
          await api.post('/api/auth/login', {});
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(400);
          expect(error.response.data.error).toContain('required');
        }
      });
    });

    describe('GET /api/auth/me', () => {
      beforeEach(async () => {
        // Login to get token
        const response = await api.post('/api/auth/login', {
          email: 'test@physioassist.com',
          password: 'Test123!',
        });
        authToken = response.data.token;
      });

      it('should return user data with valid token', async () => {
        const response = await api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.data).toMatchObject({
          email: 'test@physioassist.com',
          name: 'Test User',
        });
      });

      it('should reject request without token', async () => {
        try {
          await api.get('/api/auth/me');
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.error).toContain('Access token required');
        }
      });

      it('should reject request with invalid token', async () => {
        try {
          await api.get('/api/auth/me', {
            headers: { Authorization: 'Bearer invalid-token' },
          });
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(403);
          expect(error.response.data.error).toContain('Invalid token');
        }
      });
    });
  });

  describe('User Profile Endpoints', () => {
    beforeEach(async () => {
      const response = await api.post('/api/auth/login', {
        email: 'test@physioassist.com',
        password: 'Test123!',
      });
      authToken = response.data.token;
    });

    describe('PUT /api/users/profile', () => {
      it('should update user profile', async () => {
        const profileUpdate = {
          age: 35,
          fitnessLevel: 'advanced',
          injuries: ['shoulder', 'knee'],
          goals: ['rehabilitation', 'flexibility'],
        };

        const response = await api.put('/api/users/profile', profileUpdate, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.data.profile).toMatchObject(profileUpdate);
      });

      it('should partially update profile', async () => {
        const partialUpdate = {
          age: 32,
        };

        const response = await api.put('/api/users/profile', partialUpdate, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.data.profile.age).toBe(32);
        expect(response.data.profile.fitnessLevel).toBe('intermediate'); // Unchanged
      });
    });
  });

  describe('Exercise Endpoints', () => {
    beforeEach(async () => {
      const response = await api.post('/api/auth/login', {
        email: 'test@physioassist.com',
        password: 'Test123!',
      });
      authToken = response.data.token;
    });

    describe('GET /api/exercises', () => {
      it('should return list of exercises', async () => {
        const response = await api.get('/api/exercises', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.data.exercises).toBeInstanceOf(Array);
        expect(response.data.exercises.length).toBeGreaterThan(0);
        expect(response.data.exercises[0]).toHaveProperty('id');
        expect(response.data.exercises[0]).toHaveProperty('name');
        expect(response.data.exercises[0]).toHaveProperty('category');
        expect(response.data.exercises[0]).toHaveProperty('difficulty');
      });

      it('should require authentication', async () => {
        try {
          await api.get('/api/exercises');
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(401);
        }
      });
    });

    describe('GET /api/exercises/:id', () => {
      it('should return detailed exercise data', async () => {
        const response = await api.get('/api/exercises/bicep_curl', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('id', 'bicep_curl');
        expect(response.data).toHaveProperty('phases');
        expect(response.data.phases).toBeInstanceOf(Array);
      });
    });
  });

  describe('Session Endpoints', () => {
    let sessionId: string;

    beforeEach(async () => {
      const response = await api.post('/api/auth/login', {
        email: 'test@physioassist.com',
        password: 'Test123!',
      });
      authToken = response.data.token;
    });

    describe('POST /api/sessions', () => {
      it('should create a new exercise session', async () => {
        const response = await api.post(
          '/api/sessions',
          { exerciseId: 'bicep_curl' },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );

        expect(response.status).toBe(201);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('exerciseId', 'bicep_curl');
        expect(response.data).toHaveProperty('status', 'active');
        expect(response.data.metrics).toMatchObject({
          reps: 0,
          sets: 0,
          formScore: 0,
          duration: 0,
        });

        sessionId = response.data.id;
      });
    });

    describe('PUT /api/sessions/:id', () => {
      beforeEach(async () => {
        const response = await api.post(
          '/api/sessions',
          { exerciseId: 'bicep_curl' },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        sessionId = response.data.id;
      });

      it('should update session metrics', async () => {
        const metricsUpdate = {
          metrics: {
            reps: 10,
            sets: 1,
            formScore: 0.85,
            duration: 120,
          },
        };

        const response = await api.put(`/api/sessions/${sessionId}`, metricsUpdate, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.data.metrics).toMatchObject(metricsUpdate.metrics);
      });

      it('should reject update for non-existent session', async () => {
        try {
          await api.put(
            '/api/sessions/invalid-id',
            { metrics: { reps: 5 } },
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.response.status).toBe(404);
        }
      });
    });

    describe('POST /api/sessions/:id/end', () => {
      beforeEach(async () => {
        const response = await api.post(
          '/api/sessions',
          { exerciseId: 'bicep_curl' },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        sessionId = response.data.id;
      });

      it('should end session and save progress', async () => {
        const finalMetrics = {
          metrics: {
            reps: 15,
            sets: 3,
            formScore: 0.9,
            duration: 300,
          },
        };

        const response = await api.post(`/api/sessions/${sessionId}/end`, finalMetrics, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.data.session.status).toBe('completed');
        expect(response.data.session.endTime).toBeTruthy();
        expect(response.data.summary).toMatchObject({
          totalReps: 15,
          averageForm: 0.9,
          duration: 300,
        });
      });
    });
  });

  describe('Progress Endpoints', () => {
    beforeEach(async () => {
      const response = await api.post('/api/auth/login', {
        email: 'test@physioassist.com',
        password: 'Test123!',
      });
      authToken = response.data.token;

      // Create some test progress data
      const session = await api.post(
        '/api/sessions',
        { exerciseId: 'bicep_curl' },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      await api.post(
        `/api/sessions/${session.data.id}/end`,
        {
          metrics: {
            reps: 12,
            sets: 3,
            formScore: 0.85,
            duration: 240,
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
    });

    describe('GET /api/progress', () => {
      it('should return user progress summary', async () => {
        const response = await api.get('/api/progress', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('progress');
        expect(response.data).toHaveProperty('stats');
        expect(response.data.stats).toHaveProperty('totalSessions');
        expect(response.data.stats).toHaveProperty('totalReps');
        expect(response.data.stats).toHaveProperty('averageFormScore');
        expect(response.data.stats).toHaveProperty('streak');
      });
    });

    describe('GET /api/progress/weekly', () => {
      it('should return weekly progress breakdown', async () => {
        const response = await api.get('/api/progress/weekly', {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('weeklyProgress');
        expect(response.data).toHaveProperty('dailyBreakdown');
      });
    });
  });

  describe('Analytics Endpoints', () => {
    beforeEach(async () => {
      const response = await api.post('/api/auth/login', {
        email: 'test@physioassist.com',
        password: 'Test123!',
      });
      authToken = response.data.token;
    });

    describe('POST /api/analytics/events', () => {
      it('should accept analytics events', async () => {
        const event = {
          event: 'exercise_started',
          properties: {
            exerciseId: 'bicep_curl',
            timestamp: new Date().toISOString(),
          },
        };

        const response = await api.post('/api/analytics/events', event, {
          headers: { Authorization: `Bearer ${authToken}` },
        });

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('success', true);
      });
    });
  });

  describe('Health Check', () => {
    describe('GET /api/health', () => {
      it('should return health status', async () => {
        const response = await api.get('/api/health');

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('status', 'healthy');
        expect(response.data).toHaveProperty('timestamp');
        expect(response.data).toHaveProperty('version');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent endpoints', async () => {
      try {
        await api.get('/api/non-existent');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });

    it('should handle malformed JSON', async () => {
      try {
        await api.post('/api/auth/login', 'invalid-json', {
          headers: { 'Content-Type': 'application/json' },
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting gracefully', async () => {
      // Simulate multiple rapid requests
      const promises = [];
      for (let i = 0; i < 20; i++) {
        promises.push(api.get('/api/health').catch((e) => e));
      }

      const results = await Promise.all(promises);
      const successCount = results.filter((r) => r.status === 200).length;

      // At least some requests should succeed
      expect(successCount).toBeGreaterThan(0);
    });
  });
});
