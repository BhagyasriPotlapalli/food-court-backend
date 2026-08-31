import express from 'express';
import { verifyToken, isCashier } from '../middleware/auth.js';
import * as cashierController from '../controllers/cashierController.js';

const router = express.Router();

// All routes require Cashier role
router.use(verifyToken, isCashier);

// Shift routes
router.post('/shift/start', cashierController.startShift);
router.post('/shift/close', cashierController.closeShift);

// Billing & Menu routes
router.get('/menu', cashierController.getMenu);
router.post('/orders', cashierController.createOrder);
router.get('/orders/history', cashierController.getOrderHistory);

export default router;
