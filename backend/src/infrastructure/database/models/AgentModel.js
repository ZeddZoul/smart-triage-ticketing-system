const mongoose = require('mongoose');
const { AgentRole } = require('../../../entities/enums');

const AgentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    password_hash: { type: String, required: true, select: true },
    name: { type: String, required: true, trim: true, minlength: 1, maxlength: 100 },
    role: { type: String, required: true, enum: Object.values(AgentRole), default: AgentRole.AGENT },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password_hash;
        return ret;
      },
    },
  },
);

const AgentModel = mongoose.models.Agent || mongoose.model('Agent', AgentSchema);

module.exports = AgentModel;
