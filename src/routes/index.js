import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import foodRoutes from './foodRoutes.js';
import cartRoutes from './cartRoutes.js';
import orderRoutes from './orderRoutes.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import * as orderController from '../controllers/orderController.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/foods', foodRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.get('/admin/orders', authMiddleware, roleMiddleware, orderController.getAllOrders);

export default router;