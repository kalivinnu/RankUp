const mongoose = require('mongoose');

const TestSessionSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentName: { type: String, required: true },
  usn: { type: String, required: true },
  branch: { type: String, required: true },
  
  startTime: { type: Date, default: Date.now },
  completed: { type: Boolean, default: false },
  totalScore: { type: Number, default: 0 },
  
  // Store snapshot of answers
  answers: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOptionIndex: { type: Number },
    codeSubmitted: { type: String },
    language: { type: String },
    isCorrect: { type: Boolean },
    score: { type: Number, default: 0 }
  }],
  
  violations: [{
    type: { type: String }, // 'blur', 'copy', 'paste', 'contextmenu', 'keyboard'
    timestamp: { type: Date, default: Date.now },
    details: { type: String }
  }]
}, { timestamps: true });

module.exports = mongoose.model('TestSession', TestSessionSchema);
