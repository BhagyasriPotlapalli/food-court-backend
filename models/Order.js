import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  foodItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  priceAtPurchase: {
    type: Number,
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card'],
    required: true
  },
  status: {
    type: String,
    enum: ['Completed', 'Cancelled', 'Refunded'],
    default: 'Completed'
  }
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
