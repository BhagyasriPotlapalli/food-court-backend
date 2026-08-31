import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Category from '../models/Category.js';
import FoodItem from '../models/FoodItem.js';
import Order from '../models/Order.js';
import Shift from '../models/Shift.js';
import catchAsync from '../utils/catchAsync.js';

// ==========================================
// DASHBOARD & REPORTS
// ==========================================

export const getDashboard = catchAsync(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's orders
  const todayOrders = await Order.find({
    createdAt: { $gte: today },
    status: 'Completed'
  });

  const totalSales = todayOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const cashSales = todayOrders.filter(o => o.paymentMethod === 'Cash').reduce((sum, order) => sum + Number(order.total), 0);
  const upiSales = todayOrders.filter(o => o.paymentMethod === 'UPI').reduce((sum, order) => sum + Number(order.total), 0);
  const cardSales = todayOrders.filter(o => o.paymentMethod === 'Card').reduce((sum, order) => sum + Number(order.total), 0);

  // Active shifts
  const activeShifts = await Shift.find({ status: 'Open' }).populate('cashier', 'username');

  res.status(200).json({
    summary: {
      totalSales,
      totalOrders: todayOrders.length,
      breakdown: { cash: cashSales, upi: upiSales, card: cardSales }
    },
    activeCashiers: activeShifts.map(shift => ({
      shiftId: shift._id,
      cashierName: shift.cashier?.username,
      openingBalance: shift.openingBalance,
      startTime: shift.startTime
    }))
  });
});

export const getReports = catchAsync(async (req, res, next) => {
  const { startDate, endDate, cashierId } = req.query;
  
  let whereClause = { status: 'Completed' };
  
  if (startDate && endDate) {
    whereClause.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }
  if (cashierId) {
    whereClause.cashier = cashierId;
  }

  const orders = await Order.find(whereClause)
    .populate('cashier', 'username')
    .populate('items.foodItem')
    .sort('-createdAt');

  res.status(200).json(orders);
});

export const getOrderAuditLogs = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  // Note: we need to import OrderAuditLog at the top, I'll assume it will be done via another replacement or I can just dynamically import it or use mongoose.model.
  const OrderAuditLog = (await import('../models/OrderAuditLog.js')).default;
  
  const logs = await OrderAuditLog.find({ order: id })
    .populate('performedBy', 'username role')
    .sort('-createdAt');

  res.status(200).json(logs);
});

// ==========================================
// CASHIER MANAGEMENT
// ==========================================

export const createCashier = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;
  
  const existing = await User.findOne({ username });
  if (existing) {
    const error = new Error('Username already exists');
    error.statusCode = 400;
    return next(error);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const cashier = await User.create({
    username,
    password: hashedPassword,
    role: 'Cashier',
    isActive: true
  });

  res.status(201).json({ message: 'Cashier created successfully', cashierId: cashier._id });
});

export const getCashiers = catchAsync(async (req, res, next) => {
  const cashiers = await User.find({ role: 'Cashier' }).select('-password');
  res.status(200).json(cashiers);
});

export const toggleCashierStatus = catchAsync(async (req, res, next) => {
  const cashier = await User.findById(req.params.id);
  if (!cashier) {
    const error = new Error('Cashier not found');
    error.statusCode = 404;
    return next(error);
  }

  cashier.isActive = !cashier.isActive;
  await cashier.save();

  res.status(200).json({ message: `Cashier ${cashier.isActive ? 'activated' : 'deactivated'} successfully` });
});

// ==========================================
// FOOD MENU & CATEGORIES
// ==========================================

export const createCategory = catchAsync(async (req, res, next) => {
  const category = await Category.create(req.body);
  res.status(201).json(category);
});

export const getCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find();
  res.status(200).json(categories);
});

export const createFoodItem = catchAsync(async (req, res, next) => {
  const { name, price, categoryId } = req.body;
  const food = await FoodItem.create({ name, price, category: categoryId });
  res.status(201).json(food);
});

export const getFoodItems = catchAsync(async (req, res, next) => {
  const items = await FoodItem.find().populate('category');
  res.status(200).json(items);
});

export const toggleFoodItemAvailability = catchAsync(async (req, res, next) => {
  const item = await FoodItem.findById(req.params.id);
  if (!item) {
    const error = new Error('Food item not found');
    error.statusCode = 404;
    return next(error);
  }

  item.isAvailable = !item.isAvailable;
  await item.save();

  res.status(200).json({ message: `Item marked as ${item.isAvailable ? 'available' : 'unavailable'}` });
});
