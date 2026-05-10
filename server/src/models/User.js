import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Clerk User ID
  email: { type: String, required: true },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  earned: { type: Number, default: 0 },
  withdrawn: { type: Number, default: 0 }
}, {
  timestamps: true,
});

const User = mongoose.model('User', userSchema);
export default User;
