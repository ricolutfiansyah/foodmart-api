import { Router } from 'express';
import * as foodController from '../controllers/foodController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import upload from '../middlewares/upload.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Foods
 *   description: Food management
 */

/**
 * @swagger
 * /api/v1/foods:
 *   get:
 *     summary: List all foods
 *     tags: [Foods]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of foods
 *       404:
 *         description: Not Found
 */
router.get('/', foodController.getAllFoods);

/**
 * @swagger
 * /api/v1/foods/{id}:
 *   get:
 *     summary: Get food details
 *     tags: [Foods]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food ID
 *     responses:
 *       200:
 *         description: Food details
 *       404:
 *         description: Not Found
 */
router.get('/:id', foodController.getFoodById);

/**
 * @swagger
 * /api/v1/foods:
 *   post:
 *     summary: Create food
 *     tags: [Foods]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - price
 *               - stock
 *               - categoryId
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoryId:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Food created
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
router.post('/', authMiddleware, roleMiddleware, upload.single('image'), foodController.createFood);

/**
 * @swagger
 * /api/v1/foods/{id}:
 *   patch:
 *     summary: Update food
 *     tags: [Foods]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               categoryId:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Food updated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
router.patch('/:id', authMiddleware, roleMiddleware, upload.single('image'), foodController.updateFood);

/**
 * @swagger
 * /api/v1/foods/{id}:
 *   delete:
 *     summary: Delete food
 *     tags: [Foods]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Food ID
 *     responses:
 *       200:
 *         description: Food deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not Found
 */
router.delete('/:id', authMiddleware, roleMiddleware, foodController.deleteFood);

export default router;