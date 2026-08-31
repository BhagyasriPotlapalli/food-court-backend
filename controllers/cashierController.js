import mongoose from 'mongoose';
import User from '../models/User.js';
import Category from '../models/Category.js';
import FoodItem from '../models/FoodItem.js';
import Order from '../models/Order.js';
import Shift from '../models/Shift.js';
import OrderAuditLog from '../models/OrderAuditLog.js';
import catchAsync from '../utils/catchAsync.js';

// ==========================================
// SHIFT MANAGEMENT
// ==========================================

export const startShift = catchAsync(async (req, res, next) => {
  const { openingBalance } = req.body;
  const cashierId = req.userId;

  // Check if there is already an open shift
  const existingShift = await Shift.findOne({ cashier: cashierId, status: 'Open' });

  if (existingShift) {
    const error = new Error('You already have an open shift');
    error.statusCode = 400;
    return next(error);
  }

  const shift = await Shift.create({
    cashier: cashierId,
    openingBalance: openingBalance || 0,
    expectedCash: openingBalance || 0
  });

  res.status(201).json({ message: 'Shift started', shift });
});

export const closeShift = catchAsync(async (req, res, next) => {
  const { actualCash } = req.body;
  const cashierId = req.userId;

  const shift = await Shift.findOne({ cashier: cashierId, status: 'Open' });

  if (!shift) {
    const error = new Error('No open shift found to close');
    error.statusCode = 400;
    return next(error);
  }

  shift.actualCash = actualCash;
  shift.difference = Number(actualCash) - Number(shift.expectedCash);
  shift.endTime = new Date();
  shift.status = 'Closed';

  await shift.save();

  res.status(200).json({ message: 'Shift closed', shift });
});

// ==========================================
// BILLING / POS
// ==========================================

export const getMenu = catchAsync(async (req, res, next) => {
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: 'fooditems',
        localField: '_id',
        foreignField: 'category',
        as: 'foodItems'
      }
    }
  ]);
  
  // Filter out unavailable food items
  const menu = categories.map(cat => {
    cat.foodItems = cat.foodItems.filter(item => item.isAvailable);
    return cat;
  });

  res.status(200).json(menu);
});

export const createOrder = catchAsync(async (req, res, next) => {
  const { items, paymentMethod, tax = 0, discount = 0 } = req.body; // items: [{ foodItemId, quantity }]
  const cashierId = req.userId;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const shift = await Shift.findOne({ cashier: cashierId, status: 'Open' }).session(session);

    if (!shift) {
      const error = new Error('You must start a shift before placing orders');
      error.statusCode = 400;
      throw error;
    }

    let subtotal = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      const foodItem = await FoodItem.findById(item.foodItemId).session(session);
      if (!foodItem || !foodItem.isAvailable) {
        const error = new Error(`Food item ${item.foodItemId} is not available`);
        error.statusCode = 400;
        throw error;
      }

      const itemTotal = Number(foodItem.price) * item.quantity;
      subtotal += itemTotal;

      orderItemsToCreate.push({
        foodItem: foodItem._id,
        quantity: item.quantity,
        priceAtPurchase: foodItem.price
      });
    }

    const total = subtotal + Number(tax) - Number(discount);

    const [order] = await Order.create([{
      cashier: cashierId,
      items: orderItemsToCreate,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      status: 'Completed'
    }], { session });

    // Create Audit Log
    await OrderAuditLog.create([{
      order: order._id,
      action: 'CREATED',
      performedBy: cashierId,
      details: `Order created via POS using ${paymentMethod}`,
      newData: { total, paymentMethod, itemsCount: orderItemsToCreate.length }
    }], { session });

    // Update Shift Totals
    if (paymentMethod === 'Cash') {
      shift.cashSales = Number(shift.cashSales) + total;
      shift.expectedCash = Number(shift.expectedCash) + total;
    } else if (paymentMethod === 'UPI') {
      shift.upiSales = Number(shift.upiSales) + total;
    } else if (paymentMethod === 'Card') {
      shift.cardSales = Number(shift.cardSales) + total;
    }
    await shift.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: 'Order created successfully', orderId: order._id, total });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
});

export const getOrderHistory = catchAsync(async (req, res, next) => {
  const cashierId = req.userId;
  const orders = await Order.find({ cashier: cashierId })
    .populate('items.foodItem')
    .sort('-createdAt');

  res.status(200).json(orders);
});
