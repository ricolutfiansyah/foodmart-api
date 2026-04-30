import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';

describe('Category Integration Tests', () => {
  const adminUser = {
    name: 'Admin Category',
    email: 'admin_category@example.com',
    password: 'password123'
  };

  const normalUser = {
    name: 'User Category',
    email: 'user_category@example.com',
    password: 'password123'
  };

  let adminToken = '';
  let userToken = '';
  let testCategoryId = '';
  const fakeId = '00000000-0000-0000-0000-000000000000';

  beforeAll(async () => {
    // Register Admin
    await request(app).post('/api/v1/auth/register').send(adminUser);

    // Set role to ADMIN
    await prisma.user.update({
      where: { email: adminUser.email },
      data: { role: 'ADMIN' }
    });

    // Login Admin
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: adminUser.email,
      password: adminUser.password
    });
    adminToken = adminLogin.body.data.accessToken;

    // Register Normal User
    await request(app).post('/api/v1/auth/register').send(normalUser);

    // Login Normal User
    const userLogin = await request(app).post('/api/v1/auth/login').send({
      email: normalUser.email,
      password: normalUser.password
    });
    userToken = userLogin.body.data.accessToken;
  });

  afterAll(async () => {
    // Delete foods that belong to the test category
    await prisma.food.deleteMany({
      where: { category: { name: { startsWith: 'Test Category' } } }
    });

    // Delete categories created in test
    await prisma.category.deleteMany({
      where: { name: { startsWith: 'Test Category' } }
    });

    // Delete users
    await prisma.user.deleteMany({
      where: { email: { in: [adminUser.email, normalUser.email] } }
    });
  });

  describe('POST /api/v1/categories', () => {
    it('should successfully create a new category', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Category 1' });

      // According to typical REST, this could be 201
      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test Category 1');

      testCategoryId = res.body.data.id;
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Test Category X' });

      expect(res.status).toBe(401);
    });

    it('should return 403 when using normal user token', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Test Category X' });

      expect(res.status).toBe(403);
    });

    it('should return 400 when missing name', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}); // No name

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/categories', () => {
    it('should return 200 and a list of categories', async () => {
      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/v1/categories/:id', () => {
    it('should return category data with id and name', async () => {
      const res = await request(app).get(`/api/v1/categories/${testCategoryId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testCategoryId);
      expect(res.body.data.name).toBe('Test Category 1');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app).get(`/api/v1/categories/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/categories/:id', () => {
    it('should update category and return new name', async () => {
      const res = await request(app)
        .patch(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Category Updated' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Category Updated');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .patch(`/api/v1/categories/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test Category X' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should delete category', async () => {
      const res = await request(app)
        .delete(`/api/v1/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .delete(`/api/v1/categories/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
