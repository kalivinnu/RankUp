const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const Answer = require('../models/Answer');
const Test = require('../models/Test');
const TestSession = require('../models/TestSession');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

router.use(authMiddleware, adminMiddleware);

// Create Question
router.post('/questions', async (req, res) => {
  try {
    const question = new Question(req.body);
    await question.save();
    res.status(201).json(question);
  } catch (err) {
    console.error("Error creating question:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all Questions
router.get('/questions', async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Question
router.put('/questions/:id', async (req, res) => {
  try {
    const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(question);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Question
router.delete('/questions/:id', async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.json({ message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Roadmap
router.post('/roadmaps', async (req, res) => {
  try {
    const roadmap = new Roadmap(req.body);
    await roadmap.save();
    res.status(201).json(roadmap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Roadmap
router.put('/roadmaps/:id', async (req, res) => {
  try {
    const roadmap = await Roadmap.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(roadmap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Roadmap
router.delete('/roadmaps/:id', async (req, res) => {
  try {
    await Roadmap.findByIdAndDelete(req.params.id);
    res.json({ message: 'Roadmap deleted completely' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Roadmaps
router.get('/roadmaps', async (req, res) => {
  try {
    const roadmaps = await Roadmap.find();
    res.json(roadmaps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign Roadmap to Student
router.post('/assign-roadmap', async (req, res) => {
  try {
    const { studentId, roadmapId } = req.body;
    await User.findByIdAndUpdate(studentId, { assignedRoadmapId: roadmapId });
    res.json({ message: 'Roadmap assigned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Student Analytics (Basic implementation)
router.get('/analytics', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).populate('assignedRoadmapId');
    const answers = await Answer.find().populate('questionId');
    
    // Aggregate in memory for simplicity
    const report = students.map(student => {
      const studentAnswers = answers.filter(a => a.studentId.toString() === student._id.toString());
      const aptitudeAnswers = studentAnswers.filter(a => a.questionId && a.questionId.subject === 'aptitude');
      const technicalAnswers = studentAnswers.filter(a => a.questionId && a.questionId.subject === 'technical');

      const getDeptName = (email) => {
        if (!email || !email.includes('@')) return 'General';
        const parts = email.split('@')[0].split('.');
        if (parts.length < 2) return 'General';
        const code = parts.pop().toLowerCase();
        const mapping = { 'ci': 'AIML', 'ds': 'AIDS', 'cv': 'CIVIL' };
        return mapping[code] || code.toUpperCase();
      };

      return {
        studentId: student._id,
        username: student.username,
        department: getDeptName(student.username),
        preferredDomain: student.preferredDomain || 'Not selected',
        roadmap: student.assignedRoadmapId ? student.assignedRoadmapId.title : 'None',
        totalQuestionsAnswered: studentAnswers.length,
        aptitudeAnswered: aptitudeAnswers.length,
        aptitudeScore: aptitudeAnswers.reduce((acc, a) => acc + (a.score || 0), 0),
        technicalAnswered: technicalAnswers.length,
        technicalScore: technicalAnswers.reduce((acc, a) => acc + (a.score || 0), 0),
        totalScore: studentAnswers.reduce((acc, a) => acc + (a.score || 0), 0)
      };
    });
    
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------- TEST MANAGEMENT --------------

// Create Test
router.post('/tests', async (req, res) => {
  try {
    const test = new Test(req.body);
    await test.save();
    res.status(201).json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Tests
router.get('/tests', async (req, res) => {
  try {
    const tests = await Test.find().populate('questions');
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Test
router.put('/tests/:id', async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(test);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Test
router.delete('/tests/:id', async (req, res) => {
  try {
    await Test.findByIdAndDelete(req.params.id);
    res.json({ message: 'Test deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Test Results
router.get('/tests/:id/results', async (req, res) => {
  try {
    const sessions = await TestSession.find({ testId: req.params.id }).populate('studentId');
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export Test Results (CSV approach for frontend)
router.get('/tests/:id/export', async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    const sessions = await TestSession.find({ testId: req.params.id }).populate('studentId');
    
    const getDeptName = (email) => {
      if (!email || !email.includes('@')) return 'General';
      const parts = email.split('@')[0].split('.');
      if (parts.length < 2) return 'General';
      const code = parts.pop().toLowerCase();
      const mapping = { 'ci': 'AIML', 'ds': 'AIDS', 'cv': 'CIVIL' };
      return mapping[code] || code.toUpperCase();
    };

    let csv = 'Student Name,USN,Email,Department,Branch (Manual),Start Time,Completed,Total Score\n';
    sessions.forEach(session => {
      const email = session.studentId ? session.studentId.username : 'N/A';
      const department = email !== 'N/A' ? getDeptName(email) : (session.branch || 'N/A');
      csv += `"${session.studentName}","${session.usn}","${email}","${department}","${session.branch}","${session.startTime}",${session.completed},${session.totalScore}\n`;
    });
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`${test ? test.title : 'test'}_results.csv`);
    return res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Student Password
router.post('/reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'User ID and new password are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.password = newPassword;
    await user.save(); // pre-save middleware will hash it

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
