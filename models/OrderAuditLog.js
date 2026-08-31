import mongoose from 'mongoose';

const orderAuditLogSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  action: {
    type: String,
    enum: ['CREATED', 'UPDATED', 'STATUS_CHANGED', 'REFUNDED', 'CANCELLED'],
    required: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  details: {
    type: String,
    required: false
  },
  previousData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  },
  newData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  }
}, { timestamps: true });

export default mongoose.model('OrderAuditLog', orderAuditLogSchema);
