const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const Answer = require('../models/Answer');
const Test = require('../models/Test');
const TestSession = require('../models/TestSession');
const axios = require('axios');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// Get Assigned Roadmap
router.get('/roadmap', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('assignedRoadmapId');
    res.json(user.assignedRoadmapId || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Select Domain
router.post('/domain', async (req, res) => {
  try {
    const { domain } = req.body;
    const user = await User.findById(req.user.id);
    user.preferredDomain = domain;
    
    // Try to auto-assign a roadmap if one exists for that exact string
    const roadmap = await Roadmap.findOne({ domain: new RegExp('^' + domain + '$', 'i') });
    if (roadmap) {
       user.assignedRoadmapId = roadmap._id;
    }
    
    await user.save();
    await user.populate('assignedRoadmapId');
    res.json({ preferredDomain: user.preferredDomain, roadmap: user.assignedRoadmapId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Questions by Subject
router.get('/questions/:subject', async (req, res) => {
  try {
    const questions = await Question.find({ subject: req.params.subject });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit Answer
router.post('/answer', async (req, res) => {
  try {
    const { questionId, textAnswer, selectedOptionIndex, allPassed } = req.body;
    
    const question = await Question.findById(questionId);
    let calculatedScore = 0;
    
    if (question) {
      if (question.type === 'coding') {
         if (allPassed) {
            calculatedScore = question.points || 5;
         }
      } else if (selectedOptionIndex !== undefined) {
         if (selectedOptionIndex === question.correctOptionIndex) {
            calculatedScore = question.points || 1;
         }
      } else if (textAnswer) {
         calculatedScore = 1;
      }
    }

    const answer = new Answer({
      studentId: req.user.id,
      questionId,
      textAnswer,
      selectedOptionIndex,
      score: calculatedScore
    });
    await answer.save();
    res.status(201).json(answer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get my answers / progress
router.get('/progress', async (req, res) => {
  try {
    const answers = await Answer.find({ studentId: req.user.id }).populate('questionId');
    res.json(answers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------- TEST MANAGEMENT --------------

// Get active tests
router.get('/tests', async (req, res) => {
  try {
    const tests = await Test.find({ active: true }).populate('questions');
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start a test session
router.post('/tests/:id/start', async (req, res) => {
  try {
    const { studentName, usn, branch } = req.body;
    
    // Create new test session
    const session = new TestSession({
      testId: req.params.id,
      studentId: req.user.id,
      studentName,
      usn,
      branch
    });
    
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Execute code for a question (via Piston API)
router.post('/execute', async (req, res) => {
  try {
    const { questionId, code, language } = req.body;
    
    const question = await Question.findById(questionId);
    if (!question || question.type !== 'coding' || !question.testCases) {
      return res.status(400).json({ error: 'Invalid code execution request' });
    }

    const testCases = question.testCases;
    let results = [];
    let allPassed = true;

    // Send code to Piston API for each test case
    // Piston execution endpoint: https://emkc.org/api/v2/piston/execute
    // Languages: python, c++, java
    // Map frontend language names to Piston language codes
    const pistonLangMap = {
      'python3': { language: 'python', version: '3.10.0' },
      'java': { language: 'java', version: '15.0.2' },
      'c++': { language: 'cpp', version: '10.2.0' }
    };

    const targetLang = pistonLangMap[language] || { language: language, version: '*' };

    const executePromises = testCases.map(async (tc, index) => {
      try {
        const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
          language: targetLang.language,
          version: targetLang.version,
          files: [{ content: code }],
          stdin: tc.input || ""
        });

        const output = response.data.run.stdout || response.data.run.stderr || "";
        const cleanOutput = output.trim();
        const passed = cleanOutput === tc.expectedOutput.trim();
        if (!passed) allPassed = false;

        return {
          caseNumber: index + 1,
          passed: passed,
          output: cleanOutput,
          expected: tc.expectedOutput.trim(),
          isHidden: tc.isHidden,
          error: response.data.run.stderr
        };
      } catch (err) {
        allPassed = false;
        return {
          caseNumber: index + 1,
          passed: false,
          error: 'Execution service error: ' + (err.response?.data?.message || err.message)
        };
      }
    });

    const results = await Promise.all(executePromises);

    res.json({ allPassed, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a test session
router.post('/tests/submit', async (req, res) => {
  try {
    const { sessionId, testId, answers } = req.body;
    
    // Calculate total score based on questions
    const test = await Test.findById(testId).populate('questions');
    let totalScore = 0;
    
    const sessionAnswers = answers.map(ans => {
      const q = test.questions.find(quest => quest._id.toString() === ans.questionId);
      let score = 0;
      let isCorrect = false;

      if (q) {
        if (q.type === 'mcq') {
           if (ans.selectedOptionIndex === q.correctOptionIndex) {
              score = q.points || 1;
              isCorrect = true;
           }
        } else if (q.type === 'coding') {
           if (ans.allPassed) {
              score = q.points || 5; // Give more points for coding if not specified
              isCorrect = true;
           }
        }
      }
      
      totalScore += score;
      return {
        questionId: ans.questionId,
        selectedOptionIndex: ans.selectedOptionIndex,
        codeSubmitted: ans.codeSubmitted,
        language: ans.language,
        isCorrect: isCorrect,
        score: score
      };
    });

    const session = await TestSession.findByIdAndUpdate(sessionId, {
      completed: true,
      totalScore: totalScore,
      answers: sessionAnswers
    }, { new: true });

    res.json({ message: 'Test submitted successfully', totalScore: session.totalScore });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
