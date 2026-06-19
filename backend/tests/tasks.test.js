const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Configure test environment variables before importing server
process.env.NODE_ENV = 'test';
process.env.DB_TYPE = 'sqlite';
// Force a separate SQLite test database file
const testDbPath = path.resolve(__dirname, '../database.test.sqlite');
process.env.DB_PATH = testDbPath;

const app = require('../server');
const { db, initializeDatabase } = require('../config/db');

describe('Task Portal Full API Test Suite', () => {
  let userToken = '';
  let secondUserToken = '';
  let taskId1 = null;
  let taskId2 = null;

  beforeAll(async () => {
    // Delete test database if it exists to start fresh
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (err) {
        // Ignore files that cannot be unlinked
      }
    }

    // Initialize database tables
    await initializeDatabase();

    // Clear any residual data if file deletion was skipped/blocked
    try {
      await db.execute('DELETE FROM tasks;');
      await db.execute('DELETE FROM users;');
    } catch (err) {
      // Ignore
    }
  });

  afterAll(async () => {
    // Close database connection
    await db.close();
    
    // Clean up test database file
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (err) {
        // Ignore files that cannot be unlinked
      }
    }
  });

  describe('Authentication API', () => {
    it('should register a new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password123'
        });
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('userId');
      expect(res.body.message).toContain('registered successfully');
    });

    it('should register a second user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'otheruser',
          password: 'password123'
        });
      expect(res.status).toBe(201);
    });

    it('should reject registration with existing username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'password999'
        });
      
      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject registration with invalid password or username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'u',
          password: 'p'
        });
      
      expect(res.status).toBe(400);
    });

    it('should login successfully and return a JWT', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.username).toBe('testuser');
      userToken = res.body.token;
    });

    it('should login the second user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'otheruser',
          password: 'password123'
        });
      expect(res.status).toBe(200);
      secondUserToken = res.body.token;
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });
      
      expect(res.status).toBe(401);
    });
  });

  describe('Tasks API', () => {
    it('should reject creating a task if unauthenticated', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Unauthenticated Task',
          description: 'This is a long description containing more than 20 characters.'
        });
      
      expect(res.status).toBe(401);
    });

    it('should reject creating a task with missing title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'This is a long description containing more than 20 characters.'
        });
      
      expect(res.status).toBe(400);
    });

    it('should reject creating a task with a description shorter than 20 characters', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Short description task',
          description: 'Too short!'
        });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('at least 20 characters');
    });

    it('should create a task successfully with valid data', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Design landing page UI',
          description: 'Create a beautiful glassmorphic home page mock with CSS transitions.',
          status: 'In Progress'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.task.title).toBe('Design landing page UI');
      expect(res.body.task.status).toBe('In Progress');
      taskId1 = res.body.task.id;
    });

    it('should create a second task with default status (Pending)', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Implement database models',
          description: 'Write robust user and task queries covering SQLite and MySQL database APIs.'
        });
      
      expect(res.status).toBe(201);
      expect(res.body.task.status).toBe('Pending');
      taskId2 = res.body.task.id;
    });

    it('should return tasks list matching user', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(2);
      expect(res.body.totalCount).toBe(2);
    });

    it('should filter tasks by status', async () => {
      const res = await request(app)
        .get('/api/tasks?status=In Progress')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(1);
      expect(res.body.tasks[0].title).toBe('Design landing page UI');
    });

    it('should search tasks by title/description query', async () => {
      const res = await request(app)
        .get('/api/tasks?search=database')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(1);
      expect(res.body.tasks[0].title).toBe('Implement database models');
    });

    it('should return correct task stats', async () => {
      const res = await request(app)
        .get('/api/tasks/stats')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.pending).toBe(1);
      expect(res.body.inProgress).toBe(1);
      expect(res.body.completed).toBe(0);
    });

    it('should update task status successfully', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId2}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'Completed'
        });
      
      expect(res.status).toBe(200);
      expect(res.body.task.status).toBe('Completed');
    });

    it('should prevent other users from accessing or modifying tasks', async () => {
      // Trying to fetch taskId1 using secondUserToken
      const getRes = await request(app)
        .get(`/api/tasks`)
        .set('Authorization', `Bearer ${secondUserToken}`);
      
      expect(getRes.status).toBe(200);
      // second user should have 0 tasks in their scope
      expect(getRes.body.tasks.length).toBe(0);

      // Trying to edit taskId1 using secondUserToken
      const editRes = await request(app)
        .put(`/api/tasks/${taskId1}`)
        .set('Authorization', `Bearer ${secondUserToken}`)
        .send({ status: 'Completed' });
      
      expect(editRes.status).toBe(404);
    });

    it('should delete task successfully', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId1}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);

      const checkRes = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(checkRes.body.tasks.length).toBe(1);
    });
  });
});
