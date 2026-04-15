const mongoose = require('mongoose');

const RoadmapSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  domain: {
    type: String,
    required: true // e.g. Web Development, AI, Data Science
  },
  steps: [{
    title: String,
    description: String,
    duration: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Roadmap', RoadmapSchema);
