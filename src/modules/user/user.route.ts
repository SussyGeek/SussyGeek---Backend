import express from 'express';
import UserValidator from './user.validator';
import validate from '../../middlewares/validation.middleware';
import { rateLimit } from '../../middlewares/rateLimit.middleware';
import { RATE_LIMITS } from '../../config/ratelimit';
import UserMiddleware from './user.middleware';
import UserController from './user.controller';
import { initializeFields } from '../../middlewares/fields.middleware';

const router = express.Router();

router.post('/login',
    rateLimit(RATE_LIMITS.AUTH_LOGIN),
    validate(UserValidator.Login),
    UserMiddleware.hasNoSession,
    UserController.Login
);

router.delete('/logout',
    initializeFields,
    UserMiddleware.hasSession,
    UserController.Logout
);
router.get('/me',
    initializeFields,
    UserMiddleware.hasSession,
    UserController.Me
);

router.patch('/activity/off',
    initializeFields,
    UserMiddleware.hasSession,
    UserController.SetInactive
);

export default router;
