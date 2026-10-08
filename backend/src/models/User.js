// A user account. Passwords are stored only as bcrypt hashes.
import mongoose from 'mongoose';
import { ROLES } from '../config/roles.js';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    email: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: Object.values(ROLES) },
    department: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'user_data' }
);

export default mongoose.model('User', userSchema);
