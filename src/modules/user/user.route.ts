import express from 'express';
import UserValidator from './user.validator';
import validate from '../../middlewares/validation.middleware';
import UserMiddleware from './user.middleware';
import UserController from './user.controller';

const router = express.Router();

router.post('/login',
    validate(UserValidator.Login),
    UserMiddleware.hasNoSession,
    UserController.Login
);

router.delete('/logout',
    UserMiddleware.hasSession,
    UserController.Logout
);
router.get('/me',
    UserMiddleware.hasSession,
    UserController.Me
);

router.patch('/activity/off',
    UserMiddleware.hasSession,
    UserController.SetInactive
);

export default router;
