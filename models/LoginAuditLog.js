import mongoose from 'mongoose';

const loginAuditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    required: true
  },
  action: {
    type: String,
    enum: ['LOGIN', 'LOGOUT', 'FAILED_LOGIN'],
    required: true
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  }
}, { timestamps: true });

export default mongoose.model('LoginAuditLog', loginAuditLogSchema);
