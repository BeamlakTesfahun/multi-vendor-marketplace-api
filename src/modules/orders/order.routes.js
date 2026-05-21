import express from 'express';

import { orderController } from './order.controller.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { authorizeRoles } from '../../middlewares/roleMiddleware.js';
import { checkoutRateLimiter } from '../../middlewares/rateLimiter.js';

const router = express.Router();

router.use(protect);

router.post(
    '/checkout',
    checkoutRateLimiter,
    authorizeRoles('CUSTOMER'),
    orderController.checkout,
);

router.get(
    '/my-orders',
    authorizeRoles('CUSTOMER'),
    orderController.getMyOrders,
);

router.get(
    '/vendor-orders',
    authorizeRoles('VENDOR'),
    orderController.getVendorOrders,
);

router.get('/:orderId', orderController.getOrderById);

export default router;
