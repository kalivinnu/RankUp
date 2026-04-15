const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  inputFormat: { type: String },
  outputFormat: { type: String },
  constraints: { type: String },
  subject: {
    type: String,
    enum: ['aptitude', 'technical'],
    required: true
  },
  type: {
    type: String,
    enum: ['mcq', 'coding'],
    default: 'mcq'
  },
  testCases: [{
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false }
  }],
  options: [{
    text: { type: String, required: true },
    description: { type: String }
  }],
  correctOptionIndex: {
    type: Number,
    required: true
  },
  points: {
    type: Number,
    default: 1
  },
  answerFeedback: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Question', QuestionSchema);
