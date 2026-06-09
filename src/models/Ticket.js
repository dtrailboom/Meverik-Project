const mongoose = require('mongoose');

const COMPLEXITY = {
  small: { label: 'Small', tokenCost: 1 },
  medium: { label: 'Medium', tokenCost: 3 },
  large: { label: 'Large', tokenCost: 8 },
};

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: Number, unique: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    referenceUrl: { type: String, trim: true },

    complexity: {
      type: String,
      enum: ['small', 'medium', 'large'],
      required: true,
    },
    tokenCost: { type: Number, required: true },

    status: {
      type: String,
      enum: ['new', 'in_progress', 'in_review', 'delivered', 'blocked'],
      default: 'new',
    },

    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    deliveredAt: { type: Date },
    notes: { type: String }, // internal admin notes
  },
  { timestamps: true }
);

// Auto-increment ticket number
ticketSchema.pre('save', async function (next) {
  if (this.isNew) {
    const last = await this.constructor.findOne().sort({ ticketNumber: -1 });
    this.ticketNumber = last ? last.ticketNumber + 1 : 1;
    this.tokenCost = COMPLEXITY[this.complexity].tokenCost;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
module.exports.COMPLEXITY = COMPLEXITY;
