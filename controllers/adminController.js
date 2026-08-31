import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import db from '../models/index.js';
import catchAsync from '../utils/catchAsync.js';

const { User, Category, FoodItem, Order, Shift } = db;

// ==========================================
// DASHBOARD & REPORTS
// ==========================================

export const getDashboard = catchAsync(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get today's orders
  const todayOrders = await Order.findAll({
    where: {
      createdAt: {
        [Op.gte]: today
      },
      status: 'Completed'
    }
  });

  const totalSales = todayOrders.reduce((sum, order) => sum + Number(order.total), 0);
  const cashSales = todayOrders.filter(o => o.paymentMethod === 'Cash').reduce((sum, order) => sum + Number(order.total), 0);
  const upiSales = todayOrders.filter(o => o.paymentMethod === 'UPI').reduce((sum, order) => sum + Number(order.total), 0);
  const cardSales = todayOrders.filter(o => o.paymentMethod === 'Card').reduce((sum, order) => sum + Number(order.total), 0);

  // Active shifts
  const activeShifts = await Shift.findAll({
    where: { status: 'Open' },
    include: [{ model: User, as: 'cashier', attributes: ['username'] }]
  });

  res.status(200).json({
    summary: {
      totalSales,
      totalOrders: todayOrders.length,
      breakdown: { cash: cashSales, upi: upiSales, card: cardSales }
    },
    activeCashiers: activeShifts.map(shift => ({
      shiftId: shift.id,
      cashierName: shift.cashier.username,
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
      [Op.between]: [new Date(startDate), new Date(endDate)]
    };
  }
  if (cashierId) {
    whereClause.cashierId = cashierId;
  }

  const orders = await Order.findAll({
    where: whereClause,
    include: [
      { model: User, as: 'cashier', attributes: ['username'] },
      { model: db.OrderItem, as: 'items', include: [{ model: FoodItem, as: 'foodItem' }] }
    ],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json(orders);
});

// ==========================================
// CASHIER MANAGEMENT
// ==========================================

export const createCashier = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;
  
  const existing = await User.findOne({ where: { username } });
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

  res.status(201).json({ message: 'Cashier created successfully', cashierId: cashier.id });
});

export const getCashiers = catchAsync(async (req, res, next) => {
  const cashiers = await User.findAll({
    where: { role: 'Cashier' },
    attributes: { exclude: ['password'] }
  });
  res.status(200).json(cashiers);
});

export const toggleCashierStatus = catchAsync(async (req, res, next) => {
  const cashier = await User.findByPk(req.params.id);
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
  const categories = await Category.findAll();
  res.status(200).json(categories);
});

export const createFoodItem = catchAsync(async (req, res, next) => {
  const { name, price, categoryId } = req.body;
  const food = await FoodItem.create({ name, price, categoryId });
  res.status(201).json(food);
});

export const getFoodItems = catchAsync(async (req, res, next) => {
  const items = await FoodItem.findAll({
    include: [{ model: Category, as: 'category' }]
  });
  res.status(200).json(items);
});

export const toggleFoodItemAvailability = catchAsync(async (req, res, next) => {
  const item = await FoodItem.findByPk(req.params.id);
  if (!item) {
    const error = new Error('Food item not found');
    error.statusCode = 404;
    return next(error);
  }

  item.isAvailable = !item.isAvailable;
  await item.save();

  res.status(200).json({ message: `Item marked as ${item.isAvailable ? 'available' : 'unavailable'}` });
});
