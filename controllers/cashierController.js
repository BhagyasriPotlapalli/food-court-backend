import db from '../models/index.js';
import catchAsync from '../utils/catchAsync.js';

const { Category, FoodItem, Order, OrderItem, Shift } = db;

// ==========================================
// SHIFT MANAGEMENT
// ==========================================

export const startShift = catchAsync(async (req, res, next) => {
  const { openingBalance } = req.body;
  const cashierId = req.userId;

  // Check if there is already an open shift
  const existingShift = await Shift.findOne({
    where: { cashierId, status: 'Open' }
  });

  if (existingShift) {
    const error = new Error('You already have an open shift');
    error.statusCode = 400;
    return next(error);
  }

  const shift = await Shift.create({
    cashierId,
    openingBalance: openingBalance || 0,
    expectedCash: openingBalance || 0
  });

  res.status(201).json({ message: 'Shift started', shift });
});

export const closeShift = catchAsync(async (req, res, next) => {
  const { actualCash } = req.body;
  const cashierId = req.userId;

  const shift = await Shift.findOne({
    where: { cashierId, status: 'Open' }
  });

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
  // Group food items by category
  const categories = await Category.findAll({
    include: [
      {
        model: FoodItem,
        as: 'foodItems',
        where: { isAvailable: true },
        required: false
      }
    ]
  });
  res.status(200).json(categories);
});

export const createOrder = catchAsync(async (req, res, next) => {
  const { items, paymentMethod, tax = 0, discount = 0 } = req.body; // items: [{ foodItemId, quantity }]
  const cashierId = req.userId;

  // Managed transaction: if an error is thrown, it automatically rolls back
  const result = await db.sequelize.transaction(async (t) => {
    // Must have an open shift
    const shift = await Shift.findOne({
      where: { cashierId, status: 'Open' },
      transaction: t
    });

    if (!shift) {
      const error = new Error('You must start a shift before placing orders');
      error.statusCode = 400;
      throw error; // triggers rollback
    }

    let subtotal = 0;
    const orderItemsToCreate = [];

    // Calculate totals & prepare items
    for (const item of items) {
      const foodItem = await FoodItem.findByPk(item.foodItemId, { transaction: t });
      if (!foodItem || !foodItem.isAvailable) {
        const error = new Error(`Food item ${item.foodItemId} is not available`);
        error.statusCode = 400;
        throw error;
      }

      const itemTotal = Number(foodItem.price) * item.quantity;
      subtotal += itemTotal;

      orderItemsToCreate.push({
        foodItemId: foodItem.id,
        quantity: item.quantity,
        priceAtPurchase: foodItem.price
      });
    }

    const total = subtotal + Number(tax) - Number(discount);

    // Create Order
    const order = await Order.create({
      cashierId,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      status: 'Completed'
    }, { transaction: t });

    // Associate Items
    const mappedItems = orderItemsToCreate.map(i => ({ ...i, orderId: order.id }));
    await OrderItem.bulkCreate(mappedItems, { transaction: t });

    // Update Shift Totals
    if (paymentMethod === 'Cash') {
      shift.cashSales = Number(shift.cashSales) + total;
      shift.expectedCash = Number(shift.expectedCash) + total;
    } else if (paymentMethod === 'UPI') {
      shift.upiSales = Number(shift.upiSales) + total;
    } else if (paymentMethod === 'Card') {
      shift.cardSales = Number(shift.cardSales) + total;
    }
    await shift.save({ transaction: t });

    return { orderId: order.id, total };
  });

  res.status(201).json({ message: 'Order created successfully', orderId: result.orderId, total: result.total });
});

export const getOrderHistory = catchAsync(async (req, res, next) => {
  const cashierId = req.userId;
  const orders = await Order.findAll({
    where: { cashierId },
    include: [{ model: OrderItem, as: 'items', include: [{ model: FoodItem, as: 'foodItem' }] }],
    order: [['createdAt', 'DESC']]
  });

  res.status(200).json(orders);
});
