import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();

// All routes require Admin role
router.use(verifyToken, isAdmin);

// Dashboard & Reports
router.get('/dashboard', adminController.getDashboard);
router.get('/reports', adminController.getReports);

// Cashiers
router.post('/cashiers', adminController.createCashier);
router.get('/cashiers', adminController.getCashiers);
router.patch('/cashiers/:id/status', adminController.toggleCashierStatus);

// Categories
router.post('/categories', adminController.createCategory);
router.get('/categories', adminController.getCategories);

// Food Items
router.post('/food-items', adminController.createFoodItem);
router.get('/food-items', adminController.getFoodItems);
router.patch('/food-items/:id/availability', adminController.toggleFoodItemAvailability);

export default router;
