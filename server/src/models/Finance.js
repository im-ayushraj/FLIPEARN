import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  ownerId: { type: String, ref: 'User', required: true },
  userId: { type: String, ref: 'User', required: true },
  amount: { type: Number, required: true },
  isPaid: { type: Boolean, default: false },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const Transaction = mongoose.model('Transaction', transactionSchema);

const withdrawalSchema = new mongoose.Schema({
  userId: { type: String, ref: 'User', required: true },
  amount: { type: Number, required: true },
  account: [{ type: mongoose.Schema.Types.Mixed }], // Array of JSON
  isWithdrawn: { type: Boolean, default: false },
}, {
  timestamps: true
});

export const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

const credentialSchema = new mongoose.Schema({
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  originalCredential: [{ type: mongoose.Schema.Types.Mixed }], // Array of JSON
  updatedCredential: [{ type: mongoose.Schema.Types.Mixed }], // Array of JSON
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const Credential = mongoose.model('Credential', credentialSchema);
