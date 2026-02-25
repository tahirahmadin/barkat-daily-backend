const mongoose = require('mongoose');

const deletedUserSchema = new mongoose.Schema(
  {
    originalUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    progress: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: 'deleted_profiles',
    timestamps: true,
  }
);

module.exports = mongoose.model('DeletedUser', deletedUserSchema);

