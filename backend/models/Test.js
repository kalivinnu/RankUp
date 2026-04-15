const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  testType: {
    type: String,
    enum: ['aptitude', 'technical'],
    required: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 60
  },
  active: {
    type: Boolean,
    default: true
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Test', TestSchema);
