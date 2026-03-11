const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        'Please provide a valid email address',
      ],
    },
    passwordHash: {
      type: String,
    },
    name: {
      type: String,
      trim: true,
    },
    profilePicture: {
      type: String,
      trim: true,
      default: '',
    },
    preferences: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      default: 'english',
      lowercase: true,
      trim: true,
    },
    appleSub: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    collection: 'profiles',
  }
);

module.exports = mongoose.model('User', userSchema);

