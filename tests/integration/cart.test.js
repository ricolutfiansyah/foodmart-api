import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';

describe('Cart Integration Tests', () => {
  const testUser = {
    name: 'User Cart',
    email: 'user_cart@example.com',
    password: 'password123'
  };

  let userToken = '';
  let testCategoryId = '';
  let testFoodId = '';
  let testCartItemId = '';
  const fakeId = '00000000-0000-0000-0000-000000000000';

  beforeAll(async () => {
    // 1. Register User
    await request(app).post('/api/v1/auth/register').send(testUser);

    // 2. Login User
    const userLogin = await request(app).post('/api/v1/auth/login').send({
      email: testUser.email,
      password: testUser.password
    });
    userToken = userLogin.body.data.accessToken;

    // 3. Create category via Prisma
    const category = await prisma.category.create({
      data: { 
        name: 'Test Category Cart', 
        slug: 'test-category-cart' 
      }
    });
    testCategoryId = category.id;

    // 4. Create food via Prisma
    const food = await prisma.food.create({
      data: {
        name: 'Test Food Cart',
        price: 25000,
        stock: 50,
        categoryId: testCategoryId,
        isAvailable: true
      }
    });
    testFoodId = food.id;
  });

  afterAll(async () => {
    // Cleanup sequence: cartItems -> cart -> food -> category -> user
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    
    await prisma.food.deleteMany({
      where: { id: testFoodId }
    });
    
    await prisma.category.delete({
      where: { id: testCategoryId }
    });
    
    await prisma.user.deleteMany({
      where: { email: testUser.email }
    });
  });

  describe('POST /api/v1/cart', () => {
    it('should successfully add an item to the cart', async () => {
      const res = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          foodId: testFoodId,
          quantity: 2
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/v1/cart')
        .send({
          foodId: testFoodId,
          quantity: 1
        });

      expect(res.status).toBe(401);
    });

    it('should return 400 when missing foodId', async () => {
      const res = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quantity: 1
        });

      expect(res.status).toBe(400);
    });

    it('should return 400 when missing quantity', async () => {
      const res = await request(app)
        .post('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          foodId: testFoodId
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/cart', () => {
    it('should return 200 and see contents of the cart', async () => {
      const res = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('cartItems');
      expect(Array.isArray(res.body.data.cartItems)).toBe(true);
      expect(res.body.data.cartItems.length).toBeGreaterThan(0);

      // Save cartItemId for PATCH and DELETE tests
      testCartItemId = res.body.data.cartItems[0].id;
    });
  });

  describe('PATCH /api/v1/cart/:itemId', () => {
    it('should update quantity of a cart item', async () => {
      const res = await request(app)
        .patch(`/api/v1/cart/${testCartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent itemId', async () => {
      const res = await request(app)
        .patch(`/api/v1/cart/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/cart/:itemId', () => {
    it('should delete an item from the cart', async () => {
      const res = await request(app)
        .delete(`/api/v1/cart/${testCartItemId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 for non-existent itemId', async () => {
      const res = await request(app)
        .delete(`/api/v1/cart/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/cart', () => {
    it('should clear all items in the cart', async () => {
      const res = await request(app)
        .delete('/api/v1/cart')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
