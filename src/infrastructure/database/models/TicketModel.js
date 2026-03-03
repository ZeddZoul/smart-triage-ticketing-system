const mongoose = require('mongoose');
const { TicketStatus, TicketCategory, TicketPriority } = require('../../../entities/enums');

const TicketSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 200 },
    description: { type: String, required: true, trim: true, minlength: 1, maxlength: 5000 },
    customer_email: { type: String, required: true, trim: true, lowercase: true },
    status: { type: String, required: true, enum: Object.values(TicketStatus), default: TicketStatus.PENDING_TRIAGE },
    category: { type: String, enum: Object.values(TicketCategory), default: null },
    priority: { type: String, enum: Object.values(TicketPriority), default: null },
    triage_attempts: { type: Number, required: true, default: 0, min: 0 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
  },
);

TicketSchema.index({ status: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ category: 1 });
TicketSchema.index({ created_at: -1 });
TicketSchema.index({ status: 1, priority: 1 });

const TicketModel = mongoose.models.Ticket || mongoose.model('Ticket', TicketSchema);

module.exports = TicketModel;
