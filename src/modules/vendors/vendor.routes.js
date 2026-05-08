import express from 'express';

import { vendorController } from './vendor.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { createVendorProfileSchema } from './vendor.validation.js';

const router = express.Router();

router.post(
    '/me',
    protect,
    validateRequest(createVendorProfileSchema),
    vendorController.createVendorProfile,
);

router.get('/me', protect, vendorController.getMyVendorProfile);

export default router;
