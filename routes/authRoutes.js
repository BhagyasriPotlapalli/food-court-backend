import express from 'express';
import { login, registerAdmin } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/register-admin', registerAdmin);

export default router;
