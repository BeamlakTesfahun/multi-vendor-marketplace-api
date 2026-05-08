import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import vendorRoutes from '../modules/vendors/vendor.routes.js';
import categoryRoutes from '../modules/categories/category.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);
router.use('/categories', categoryRoutes);

export default router;
