import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import {
  createCashier,
  getCashiers,
  toggleCashierStatus,
  createCategory,
  getCategories,
  createFoodItem,
  getFoodItems,
  toggleFoodItemAvailability,
  getDashboard,
  getReports,
  getOrderAuditLogs
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require Admin role
router.use(verifyToken, isAdmin);

// Dashboard & Reports
router.get('/dashboard', getDashboard);
router.get('/reports', getReports);
router.get('/orders/:id/audit', getOrderAuditLogs);

// Cashiers
router.post('/cashiers', createCashier);
router.get('/cashiers', getCashiers);
router.patch('/cashiers/:id/status', toggleCashierStatus);

// Categories
router.post('/categories', createCategory);
router.get('/categories', getCategories);

// Food Items
router.post('/food-items', createFoodItem);
router.get('/food-items', getFoodItems);
router.patch('/food-items/:id/availability', toggleFoodItemAvailability);

export default router;
