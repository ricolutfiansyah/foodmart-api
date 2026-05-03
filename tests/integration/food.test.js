import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';

describe('Food Integration Tests', () => {
  const adminUser = {
    name: 'Admin Food',
    email: 'admin_food@example.com',
    password: 'password123'
  };

  const normalUser = {
    name: 'User Food',
    email: 'user_food@example.com',
    password: 'password123'
  };

  let adminToken = '';
  let userToken = '';
  let testCategoryId = '';
  let testFoodId = '';
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

    // Create a test category for the foods
    const category = await prisma.category.upsert({
      where: { slug: 'test-category-for-food' },
      update: {},
      create: { name: 'Test Category For Food', slug: 'test-category-for-food' }
    });
    testCategoryId = category.id;
  });

  afterAll(async () => {
    // Delete foods
    await prisma.food.deleteMany({
      where: { categoryId: testCategoryId }
    });

    // Delete category
    await prisma.category.deleteMany({
      where: { slug: 'test-category-for-food' }
    });

    // Delete users
    await prisma.user.deleteMany({
      where: { email: { in: [adminUser.email, normalUser.email] } }
    });
  });

  describe('POST /api/v1/foods', () => {
    it('should successfully create a new food without image', async () => {
      // Endpoint uses upload.single('image'), we use .field() for multipart/form-data payload
      const res = await request(app)
        .post('/api/v1/foods')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Test Food 1')
        .field('description', 'Delicious test food')
        .field('price', 50000)
        .field('stock', 10)
        .field('categoryId', testCategoryId);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test Food 1');

      testFoodId = res.body.data.id;
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/v1/foods')
        .field('name', 'Test Food X');

      expect(res.status).toBe(401);
    });

    it('should return 403 when using normal user token', async () => {
      const res = await request(app)
        .post('/api/v1/foods')
        .set('Authorization', `Bearer ${userToken}`)
        .field('name', 'Test Food X');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/foods', () => {
    it('should return 200 and a list of foods', async () => {
      const res = await request(app).get('/api/v1/foods');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Response structure contains { data, meta }
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 200 with search query', async () => {
      const res = await request(app).get('/api/v1/foods?search=Test');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 200 with categoryId filter', async () => {
      const res = await request(app).get(`/api/v1/foods?categoryId=${testCategoryId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/foods/:id', () => {
    it('should return food data with id and name', async () => {
      const res = await request(app).get(`/api/v1/foods/${testFoodId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testFoodId);
      expect(res.body.data.name).toBe('Test Food 1');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app).get(`/api/v1/foods/${fakeId}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/foods/:id', () => {
    it('should update food and return new name', async () => {
      const res = await request(app)
        .patch(`/api/v1/foods/${testFoodId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Test Food Updated');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Food Updated');
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .patch(`/api/v1/foods/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('name', 'Test Food X');

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/foods/:id', () => {
    it('should delete food', async () => {
      const res = await request(app)
        .delete(`/api/v1/foods/${testFoodId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent id', async () => {
      const res = await request(app)
        .delete(`/api/v1/foods/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});
