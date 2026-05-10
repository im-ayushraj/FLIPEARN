import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  chatUserId: { type: String, ref: 'User', required: true },
  ownerUserId: { type: String, ref: 'User', required: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
  active: { type: Boolean, default: true },
  lastMessage: { type: String, default: '' },
  isLastMessageRead: { type: Boolean, default: true },
  lastMessageSenderId: { type: String, default: '' },
  isTokenAmountPaid: { type: Boolean, default: false }
}, {
  timestamps: true,
});

chatSchema.index({ chatUserId: 1, ownerUserId: 1, listingId: 1 }, { unique: true });

export const Chat = mongoose.model('Chat', chatSchema);

const messageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  message: { type: String, required: true },
  sender_id: { type: String, required: true },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const Message = mongoose.model('Message', messageSchema);

const platformMessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  message: { type: String, required: true },
  sender_id: { type: String, default: 'platform' },
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

export const PlatformMessage = mongoose.model('PlatformMessage', platformMessageSchema);
