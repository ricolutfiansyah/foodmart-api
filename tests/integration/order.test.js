import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';

describe('Order Integration Tests', () => {
  jest.setTimeout(30000);

  const adminUser = {
    name: 'Admin Order',
    email: 'admin_order@example.com',
    password: 'password123'
  };

  const normalUser = {
    name: 'User Order',
    email: 'user_order@example.com',
    password: 'password123'
  };

  const anotherUser = {
    name: 'Another Order User',
    email: 'another_user_order@example.com',
    password: 'password123'
  };

  let adminToken = '';
  let userToken = '';
  let anotherToken = '';
  let testCategoryId = '';
  let testFoodId = '';
  let testOrderId = '';
  const fakeId = '00000000-0000-0000-0000-000000000000';

  beforeAll(async () => {
    // 1. Register & Login Admin
    await request(app).post('/api/v1/auth/register').send(adminUser);
    await prisma.user.update({
      where: { email: adminUser.email },
      data: { role: 'ADMIN' }
    });
    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: adminUser.email, password: adminUser.password
    });
    adminToken = adminLogin.body.data.accessToken;

    // 2. Register & Login Normal User
    await request(app).post('/api/v1/auth/register').send(normalUser);
    const userLogin = await request(app).post('/api/v1/auth/login').send({
      email: normalUser.email, password: normalUser.password
    });
    userToken = userLogin.body.data.accessToken;

    // 3. Register & Login Another User
    await request(app).post('/api/v1/auth/register').send(anotherUser);
    const anotherLogin = await request(app).post('/api/v1/auth/login').send({
      email: anotherUser.email, password: anotherUser.password
    });
    anotherToken = anotherLogin.body.data.accessToken;

    // 4. Create category via Prisma
    const category = await prisma.category.upsert({
      where: { slug: 'test-category-order' },
      update: {},
      create: { name: 'Test Category Order', slug: 'test-category-order' }
    });
    testCategoryId = category.id;

    // 5. Create food via Prisma
    const food = await prisma.food.create({
      data: {
        name: 'Test Food Order',
        price: 50000,
        stock: 10,
        categoryId: testCategoryId,
        isAvailable: true
      }
    });
    testFoodId = food.id;

    // 6. Add food to normal user's cart
    await request(app)
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ foodId: testFoodId, quantity: 2 });
  });

  afterAll(async () => {
    // Cleanup order: orderItems -> orders -> cartItems -> cart -> food -> category -> users
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});

    await prisma.food.deleteMany({
      where: { id: testFoodId }
    });
    await prisma.category.deleteMany({
      where: { slug: 'test-category-order' }
    });
    await prisma.user.deleteMany({
      where: { email: { in: [adminUser.email, normalUser.email, anotherUser.email] } }
    });
  });

  describe('POST /api/v1/orders', () => {
    it('should successfully checkout and create an order', async () => {
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ note: 'Please deliver quickly' });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('totalPrice');

      testOrderId = res.body.data.id;
    });

    it('should return 400 when checking out with an empty cart', async () => {
      // The cart was cleared by the previous successful checkout
      const res = await request(app)
        .post('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/v1/orders');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/orders', () => {
    it('should return 200 and a list of user orders', async () => {
      const res = await request(app)
        .get('/api/v1/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/v1/orders');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should return order details with id and totalPrice', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testOrderId);
      expect(res.body.data).toHaveProperty('totalPrice');
    });

    it('should return 404 for non-existent order id', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 when another user tries to access the order', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${anotherToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    it('should successfully update order status', async () => {
      const res = await request(app)
        .patch(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'PROCESSING' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 for invalid status', async () => {
      const res = await request(app)
        .patch(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'INVALID_STATUS' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .patch(`/api/v1/orders/${testOrderId}/status`)
        .send({ status: 'PROCESSING' });

      expect(res.status).toBe(401);
    });

    it('should return 403 when a normal user tries to update status', async () => {
      const res = await request(app)
        .patch(`/api/v1/orders/${testOrderId}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'PROCESSING' });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/admin/orders', () => {
    it('should return 200 and a list of all orders for admin', async () => {
      const res = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return 403 when a normal user tries to access all orders', async () => {
      const res = await request(app)
        .get('/api/v1/admin/orders')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
