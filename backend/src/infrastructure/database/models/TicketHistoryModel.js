const mongoose = require('mongoose');
const { HistoryAction } = require('../../../entities/enums');

const TicketHistorySchema = new mongoose.Schema(
  {
    ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    action: { type: String, required: true, enum: Object.values(HistoryAction) },
    performed_by_agent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agent',
      default: null,
      index: true,
    },
    previous_value: { type: mongoose.Schema.Types.Mixed, default: null },
    new_value: { type: mongoose.Schema.Types.Mixed, default: null },
    notes: { type: String, default: null, maxlength: 500 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    versionKey: false,
  },
);

TicketHistorySchema.index({ ticket_id: 1, created_at: 1 });

const TicketHistoryModel =
  mongoose.models.TicketHistory || mongoose.model('TicketHistory', TicketHistorySchema);

module.exports = TicketHistoryModel;
