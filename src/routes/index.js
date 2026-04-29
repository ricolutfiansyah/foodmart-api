import { Router } from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import foodRoutes from './foodRoutes.js';
import cartRoutes from './cartRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/categories', categoryRoutes);
router.use('/foods', foodRoutes);
router.use('/cart', cartRoutes);

export default router;