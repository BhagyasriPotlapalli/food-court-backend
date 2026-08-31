import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  openingBalance: {
    type: Number,
    required: true
  },
  cashSales: {
    type: Number,
    default: 0
  },
  upiSales: {
    type: Number,
    default: 0
  },
  cardSales: {
    type: Number,
    default: 0
  },
  expectedCash: {
    type: Number,
    default: 0
  },
  actualCash: {
    type: Number
  },
  difference: {
    type: Number
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.model('Shift', shiftSchema);
