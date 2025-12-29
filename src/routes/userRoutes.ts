import express from 'express';
import { GetUser, Login, Logout } from "../controllers/userController"

const router = express.Router();

router.post('/login', Login);
router.delete('/logout', Logout); 
router.get('/me', GetUser);

export default router;

