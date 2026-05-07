import express from 'express';

import { authController } from './auth.controller.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { protect } from '../../middlewares/authMiddleware.js';
import { registerSchema, loginSchema } from './auth.validation.js';

const router = express.Router();

router.post(
    '/register',
    validateRequest(registerSchema),
    authController.register,
);

router.post('/login', validateRequest(loginSchema), authController.login);

router.get('/me', protect, authController.getMe);

export default router;
