const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  // We can support typed text or multiple choice
  textAnswer: {
    type: String
  },
  selectedOptionIndex: {
    type: Number
  },
  isCorrect: {
    type: Boolean
  },
  score: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Answer', AnswerSchema);
