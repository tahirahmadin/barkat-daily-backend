const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    learnedByCategory: {
      type: [
        {
          category: { type: String, required: true },
          cardIds: {
            type: [String],
            default: [],
          },
        },
      ],
      default: [],
    },
    savedCardIds: {
      type: [String],
      default: [],
    },
    stats: {
      cardsLearned: { type: Number, default: 0 },
      streakDays: { type: Number, default: 0 },
      lastLearningDate: { type: String, default: null },
      topicsFollowed: { type: Number, default: 0 },
    },
    lastLearningDate: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'activities',
  }
);

module.exports = mongoose.model('Progress', progressSchema);

