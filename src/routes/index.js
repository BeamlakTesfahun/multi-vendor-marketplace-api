import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import vendorRoutes from '../modules/vendors/vendor.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);

export default router;
