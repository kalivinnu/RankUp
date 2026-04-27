import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, BarChart3, List, Layers, CheckCircle, MessageSquare, Edit2, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const API_BASE = `${API_BASE_URL}/api`;

const AdminDashboard = () => {
  // Dashboard State
  const [activeTab, setActiveTab] = useState('questions');
  const [analytics, setAnalytics] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [allRoadmaps, setAllRoadmaps] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [allTests, setAllTests] = useState([]);
  const [viewingStudentDetails, setViewingStudentDetails] = useState(null);

  // Question Form
  const [qForm, setQForm] = useState({ 
    title: '', 
    description: '', 
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    subject: 'aptitude', 
    type: 'mcq',
    options: [{ text: '', description: '' }],
    testCases: [{ input: '', expectedOutput: '', isHidden: false }],
    correctOptionIndex: 0,
    points: 1,
    answerFeedback: ''
  });
  const [isAnswerKeyMode, setIsAnswerKeyMode] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // Test Form
  const [testForm, setTestForm] = useState({ title: '', testType: 'aptitude', durationMinutes: 60, questions: [] });
  const [editingTestId, setEditingTestId] = useState(null);
  const [viewingResultsFor, setViewingResultsFor] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [showInlineQuestionCreator, setShowInlineQuestionCreator] = useState(false);

  // Roadmap Form
  const [rForm, setRForm] = useState({ title: '', domain: '', steps: '' });
  const [editingRoadmapId, setEditingRoadmapId] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      const [resAnalyt, resRoad, resQuest, resTests] = await Promise.all([
        axios.get(`${API_BASE}/admin/analytics`, { headers }),
        axios.get(`${API_BASE}/admin/roadmaps`, { headers }),
        axios.get(`${API_BASE}/admin/questions`, { headers }),
        axios.get(`${API_BASE}/admin/tests`, { headers })
      ]);
      setAnalytics(resAnalyt.data);
      setAllRoadmaps(resRoad.data);
      setAllQuestions(resQuest.data);
      setAllTests(resTests.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    if (activeTab === 'analytics' || activeTab === 'view-questions' || activeTab === 'upload-questions' || activeTab === 'tests') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDashboardData();
    }
  }, [activeTab]);

  const handleAssignRoadmap = async (studentId, roadmapId) => {
    if (!roadmapId) return alert('Select a roadmap first');
    try {
      await axios.post(`${API_BASE}/admin/assign-roadmap`, { studentId, roadmapId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Assigned roadmap successfully!');
      fetchDashboardData(); // refresh
    } catch { alert('Assignment failed'); }
  };

  const handleResetPassword = async (userId, username) => {
    const newPassword = window.prompt(`Enter new password for ${username}:`);
    if (!newPassword) return;
    
    try {
      await axios.post(`${API_BASE}/admin/reset-password`, { userId, newPassword }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Password reset successfully!');
    } catch (err) {
      alert('Failed to reset password: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Are you sure you want to PERMANENTLY remove this student and all their data (answers, test results)? This cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE}/admin/students/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert('Student removed successfully');
      setViewingStudentDetails(null);
      fetchDashboardData();
    } catch { alert('Failed to delete student'); }
  };

  const handleQuestSubmit = async (e) => {
    e.preventDefault();
    try {
      if (qForm.type === 'mcq' && qForm.options.length === 0) {
        return alert('Please add at least one option.');
      }
      if (qForm.type === 'coding' && qForm.testCases.length === 0) {
        return alert('Please add at least one test case.');
      }
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      
      const payload = { ...qForm };
      if (payload.type === 'coding') {
        payload.options = []; // Clear options for coding to bypass mongoose schema string requirement
      } else {
        payload.testCases = []; // Clear testCases for mcq to keep DB clean
      }
      
      if (editingQuestionId) {
         await axios.put(`${API_BASE}/admin/questions/${editingQuestionId}`, payload, { headers });
         alert('Question Updated!');
      } else {
        const res = await axios.post(`${API_BASE}/admin/questions`, payload, { headers });
        if (showInlineQuestionCreator) {
          setTestForm(prev => ({ ...prev, questions: [...prev.questions, res.data._id] }));
        }
        alert('Question Saved!');
      }
      
      setQForm({ title: '', description: '', inputFormat: '', outputFormat: '', constraints: '', subject: 'aptitude', type: 'mcq', options: [{ text: '', description: '' }], testCases: [{ input: '', expectedOutput: '', isHidden: false }], correctOptionIndex: 0, points: 1, answerFeedback: '' });
      setIsAnswerKeyMode(false);
      setEditingQuestionId(null);
      if (showInlineQuestionCreator) {
        setShowInlineQuestionCreator(false);
        setActiveTab('tests');
      }
      fetchDashboardData();
    } catch (err) { 
      alert('Error saving question: ' + (err.response?.data?.error || err.message)); 
      console.error(err);
    }
  };

  const handleEditQuestion = (q) => {
    setQForm({
      title: q.title,
      description: q.description || '',
      inputFormat: q.inputFormat || '',
      outputFormat: q.outputFormat || '',
      constraints: q.constraints || '',
      subject: q.subject || 'aptitude',
      type: q.type || 'mcq',
      options: q.options && q.options.length > 0 ? q.options : [{ text: '', description: '' }],
      testCases: q.testCases && q.testCases.length > 0 ? q.testCases : [{ input: '', expectedOutput: '', isHidden: false }],
      correctOptionIndex: q.correctOptionIndex !== undefined ? q.correctOptionIndex : 0,
      points: q.points || 1,
      answerFeedback: q.answerFeedback || ''
    });
    setEditingQuestionId(q._id);
    setActiveTab('questions');
    window.scrollTo(0,0);
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question permanently?')) return;
    try {
      await axios.delete(`${API_BASE}/admin/questions/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchDashboardData();
    } catch { alert('Failed to delete'); }
  };

  const handleAddOption = () => {
    setQForm({ ...qForm, options: [...qForm.options, { text: '', description: '' }] });
  };
  
  const handleOptionChange = (index, field, value) => {
    const newOptions = [...qForm.options];
    newOptions[index][field] = value;
    setQForm({ ...qForm, options: newOptions });
  };
  
  const handleRemoveOption = (index) => {
    const newOptions = qForm.options.filter((_, i) => i !== index);
    let newCorrectIndex = qForm.correctOptionIndex;
    if (qForm.correctOptionIndex === index) newCorrectIndex = 0;
    else if (qForm.correctOptionIndex > index) newCorrectIndex -= 1;
    setQForm({ ...qForm, options: newOptions, correctOptionIndex: newCorrectIndex });
  };

  const handleAddTestCase = () => {
    setQForm({ ...qForm, testCases: [...qForm.testCases, { input: '', expectedOutput: '', isHidden: false }] });
  };
  
  const handleTestCaseChange = (index, field, value) => {
    const newTCs = [...qForm.testCases];
    newTCs[index][field] = value;
    setQForm({ ...qForm, testCases: newTCs });
  };
  
  const handleRemoveTestCase = (index) => {
    const newTCs = qForm.testCases.filter((_, i) => i !== index);
    setQForm({ ...qForm, testCases: newTCs });
  };

  const handleTestSubmit = async (e) => {
    e.preventDefault();
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      if (editingTestId) {
        await axios.put(`${API_BASE}/admin/tests/${editingTestId}`, testForm, { headers });
        alert('Test Updated!');
      } else {
        await axios.post(`${API_BASE}/admin/tests`, testForm, { headers });
        alert('Test Created!');
      }
      setTestForm({ title: '', testType: 'aptitude', durationMinutes: 60, questions: [] });
      setEditingTestId(null);
      fetchDashboardData();
    } catch { alert('Error saving test'); }
  };

  const handleEditTest = (test) => {
    setTestForm({
      title: test.title,
      testType: test.testType,
      durationMinutes: test.durationMinutes,
      questions: test.questions.map(q => q._id)
    });
    setEditingTestId(test._id);
    setActiveTab('tests');
    window.scrollTo(0,0);
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Delete test?')) return;
    try {
      await axios.delete(`${API_BASE}/admin/tests/${testId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchDashboardData();
    } catch { alert('Failed to delete'); }
  };

  const handleToggleQuestionInTest = (qId) => {
    let curr = [...testForm.questions];
    if (curr.includes(qId)) curr = curr.filter(id => id !== qId);
    else curr.push(qId);
    setTestForm({ ...testForm, questions: curr });
  };

  const fetchTestResults = async (testId) => {
    try {
      const res = await axios.get(`${API_BASE}/admin/tests/${testId}/results`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTestResults(res.data);
      setViewingResultsFor(testId);
    } catch { alert('Failed to fetch results'); }
  };

  const handleRoadmapSubmit = async (e) => {
    e.preventDefault();
    try {
      const stepsArr = rForm.steps.split('\n').filter(s => s.trim() !== '').map(s => ({ title: s }));
      const payload = { ...rForm, steps: stepsArr };
      
      const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };
      
      if (editingRoadmapId) {
        await axios.put(`${API_BASE}/admin/roadmaps/${editingRoadmapId}`, payload, { headers });
        alert('Roadmap Updated!');
      } else {
        await axios.post(`${API_BASE}/admin/roadmaps`, payload, { headers });
        alert('Roadmap Created!');
      }
      
      setRForm({ title: '', domain: '', steps: '' });
      setEditingRoadmapId(null);
      fetchDashboardData();
    } catch { alert('Error processing roadmap'); }
  };

  const handleEditRoadmap = (rm) => {
    setRForm({
      title: rm.title,
      domain: rm.domain,
      steps: rm.steps.map(s => s.title).join('\n')
    });
    setEditingRoadmapId(rm._id);
    // Scroll to top
    window.scrollTo(0,0);
  };

  const handleDeleteRoadmap = async (id) => {
    if (!window.confirm('Are you sure you want to delete this roadmap?')) return;
    try {
      await axios.delete(`${API_BASE}/admin/roadmaps/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchDashboardData();
    } catch { alert('Error deleting roadmap'); }
  };

  return (
    <div>
      <h1>Instructor Dashboard</h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'questions' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('questions')}>
          <PlusCircle size={18} /> Upload Question
        </button>
        <button className={`btn ${activeTab === 'view-questions' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('view-questions')}>
          <List size={18} /> View Questions
        </button>
        <button className={`btn ${activeTab === 'roadmaps' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('roadmaps')}>
          <Layers size={18} /> Manage Roadmaps
        </button>
        <button className={`btn ${activeTab === 'tests' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('tests')}>
          <List size={18} /> Manage Tests
        </button>
        <button className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('analytics')}>
          <BarChart3 size={18} /> Student Analytics
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {activeTab === 'questions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2><PlusCircle size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }} /> {editingQuestionId ? 'Edit Quiz Question' : 'Create Quiz Question'}</h2>
              {editingQuestionId && (
                <button className="btn btn-outline" onClick={() => { setEditingQuestionId(null); setQForm({ title: '', description: '', subject: 'aptitude', options: [{ text: '', description: '' }], correctOptionIndex: 0, points: 1, answerFeedback: '' }); setIsAnswerKeyMode(false); }}>Cancel Edit</button>
              )}
            </div>
            
            <form onSubmit={handleQuestSubmit} style={{ maxWidth: '700px', margin: '0 auto' }}>
              
              <div style={{ background: 'var(--surface-color)', borderRadius: '12px', padding: '2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderTop: '8px solid var(--primary-color)', marginBottom: '1.5rem' }}>
                
                {/* Header configuration */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
                  <select className="form-input" style={{ width: 'auto', padding: '0.4rem 1rem' }} value={qForm.subject} onChange={(e) => setQForm({ ...qForm, subject: e.target.value, type: e.target.value === 'aptitude' ? 'mcq' : qForm.type })}>
                    <option value="aptitude">Aptitude</option>
                    <option value="technical">Technical</option>
                  </select>
                  {qForm.subject === 'technical' && (
                    <select className="form-input" style={{ width: 'auto', padding: '0.4rem 1rem' }} value={qForm.type} onChange={(e) => setQForm({ ...qForm, type: e.target.value })}>
                      <option value="mcq">Multiple Choice</option>
                      <option value="coding">Coding Problem (I/O Test Cases)</option>
                    </select>
                  )}
                </div>

                {!isAnswerKeyMode ? (
                  /* QUESTION EDITOR MODE */
                  <>
                    <textarea 
                      className="form-input" 
                      required 
                      rows="2"
                      placeholder="Question Title"
                      style={{ fontSize: '1.2rem', padding: '1rem', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderRadius: 0, marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', backgroundColor: 'transparent', resize: 'vertical' }}
                      value={qForm.title} 
                      onChange={(e) => setQForm({...qForm, title: e.target.value})} 
                    />
                    
                    <textarea 
                      className="form-input" 
                      rows="2" 
                      placeholder="Problem Description / Text"
                      style={{ border: 'none', borderBottom: '1px dotted var(--border-color)', borderRadius: 0, marginBottom: qForm.type === 'coding' ? '1rem' : '2rem', backgroundColor: 'transparent' }}
                      value={qForm.description} 
                      onChange={(e) => setQForm({...qForm, description: e.target.value})} 
                    />

                    {qForm.type === 'coding' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                        <textarea 
                          className="form-input" 
                          rows="2" 
                          placeholder="Input Format (e.g. 'The first line contains an integer N...')"
                          style={{ border: 'none', borderBottom: '1px dotted var(--border-color)', borderRadius: 0, backgroundColor: 'transparent' }}
                          value={qForm.inputFormat} 
                          onChange={(e) => setQForm({...qForm, inputFormat: e.target.value})} 
                        />
                        <textarea 
                          className="form-input" 
                          rows="2" 
                          placeholder="Output Format (e.g. 'Return the sum of the array...')"
                          style={{ border: 'none', borderBottom: '1px dotted var(--border-color)', borderRadius: 0, backgroundColor: 'transparent' }}
                          value={qForm.outputFormat} 
                          onChange={(e) => setQForm({...qForm, outputFormat: e.target.value})} 
                        />
                        <textarea 
                          className="form-input" 
                          rows="1" 
                          placeholder="Constraints (e.g. '1 <= N <= 10^5')"
                          style={{ gridColumn: '1 / -1', border: 'none', borderBottom: '1px dotted var(--border-color)', borderRadius: 0, backgroundColor: 'transparent' }}
                          value={qForm.constraints} 
                          onChange={(e) => setQForm({...qForm, constraints: e.target.value})} 
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {qForm.type === 'mcq' ? (
                        <>
                          {qForm.options.map((opt, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div style={{ width: '20px', height: '20px', border: '2px solid var(--border-color)', borderRadius: '50%' }}></div>
                              <div style={{ flex: 1, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                 <input 
                                   type="text" 
                                   className="form-input" 
                                   placeholder={`Option ${i + 1}`} 
                                   required={qForm.type === 'mcq'} 
                                   style={{ padding: '0.5rem', border: 'none', borderBottom: '1px solid var(--border-color)', borderRadius: 0, backgroundColor: 'transparent' }}
                                   value={opt.text} 
                                   onChange={(e) => handleOptionChange(i, 'text', e.target.value)} 
                                 />
                                 {opt.text && (
                                   <input 
                                     type="text" 
                                     className="form-input" 
                                     placeholder="Option Explanation (optional)" 
                                     style={{ padding: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', border: 'none', borderBottom: '1px dotted var(--border-color)', borderRadius: 0, backgroundColor: 'transparent', flex: 1 }}
                                     value={opt.description} 
                                     onChange={(e) => handleOptionChange(i, 'description', e.target.value)} 
                                   />
                                 )}
                              </div>
                              {qForm.options.length > 1 && (
                                <button type="button" onClick={() => handleRemoveOption(i)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', fontSize: '1.2rem' }} title="Remove Option">
                                  &times;
                                </button>
                              )}
                            </div>
                          ))}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                            <div style={{ width: '20px', height: '20px', border: '2px solid var(--border-color)', borderRadius: '50%' }}></div>
                            <button type="button" className="btn" onClick={handleAddOption} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                              Add option
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Define Test Cases (Input values separated by space/newlines, strictly map to your expected standard output target. Avoid prompt strings in actual platform.)</p>
                          {qForm.testCases.map((tc, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <textarea className="form-input" rows="2" placeholder="Input (e.g. '5\n1 2 3 4 5')" value={tc.input} onChange={(e) => handleTestCaseChange(i, 'input', e.target.value)} required={qForm.type === 'coding'} />
                              </div>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <textarea className="form-input" rows="2" placeholder="Expected Output (e.g. '15')" value={tc.expectedOutput} onChange={(e) => handleTestCaseChange(i, 'expectedOutput', e.target.value)} required={qForm.type === 'coding'} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <label style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <input type="checkbox" checked={tc.isHidden} onChange={(e) => handleTestCaseChange(i, 'isHidden', e.target.checked)} /> Hidden
                                </label>
                                {qForm.testCases.length > 1 && (
                                  <button type="button" onClick={() => handleRemoveTestCase(i)} className="btn btn-outline" style={{ padding: '0.3rem', color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.3)' }}>Remove</button>
                                )}
                              </div>
                            </div>
                          ))}
                          <button type="button" className="btn btn-outline" onClick={handleAddTestCase} style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>+ Add Test Case</button>
                        </>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', marginTop: '2rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {qForm.type === 'mcq' ? (
                        <button type="button" className="btn btn-outline" style={{ color: 'var(--primary-color)', borderColor: 'var(--primary-color)' }} onClick={() => setIsAnswerKeyMode(true)}>
                          <CheckCircle size={16} style={{ display: 'inline', marginRight: '5px' }}/> Answer key ({qForm.points} pts)
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Points:</span>
                          <input type="number" min="1" className="form-input" style={{ width: '80px', padding: '0.5rem' }} value={qForm.points} onChange={(e) => setQForm({...qForm, points: parseInt(e.target.value) || 1})} />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* ANSWER KEY MODE */
                  <div style={{ padding: '1rem', backgroundColor: 'rgba(40,167,69,0.05)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                      <div>
                        <h3 style={{ color: 'var(--text-color)', marginBottom: '0.5rem' }}>Choose correct answer</h3>
                        <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{qForm.title || 'Untitled Question'}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="number" min="0" className="form-input" style={{ width: '80px', padding: '0.5rem', textAlign: 'right' }} value={qForm.points} onChange={(e) => setQForm({...qForm, points: parseInt(e.target.value) || 0})} />
                        <span>points</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' }}>
                      {qForm.options.map((opt, i) => {
                        const isCorrect = qForm.correctOptionIndex === i;
                        return (
                          <div 
                            key={i} 
                            onClick={() => setQForm({...qForm, correctOptionIndex: i})}
                            style={{ 
                              display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', 
                              cursor: 'pointer', borderRadius: '4px',
                              backgroundColor: isCorrect ? 'rgba(40, 167, 69, 0.15)' : 'rgba(128,128,128,0.05)',
                              border: isCorrect ? '1px solid #28a745' : '1px solid transparent'
                            }}
                          >
                            <input type="radio" checked={isCorrect} readOnly style={{ transform: 'scale(1.2)', accentColor: '#28a745' }} />
                            <span>{opt.text || `Option ${i + 1}`}</span>
                            {isCorrect && <CheckCircle size={18} color="#28a745" style={{ marginLeft: 'auto' }} />}
                          </div>
                        )
                      })}
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                         <MessageSquare size={16} /> Add answer feedback
                       </label>
                       <textarea 
                         className="form-input" 
                         rows="3" 
                         placeholder="Enter general feedback or explanation that will be shown to the student upon answering..."
                         value={qForm.answerFeedback} 
                         onChange={(e) => setQForm({...qForm, answerFeedback: e.target.value})} 
                       />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-primary" onClick={() => setIsAnswerKeyMode(false)}>Done</button>
                    </div>
                  </div>
                )}

              </div>
              
              <div style={{ textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 2rem', fontSize: '1.1rem' }}>{editingQuestionId ? 'Update Form Question' : 'Save Form Question'}</button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'tests' && (
          <div>
            {!viewingResultsFor ? (
              <>
                <div className="glass-panel card" style={{ marginBottom: '2rem' }}>
                  <h2>{editingTestId ? 'Edit Test' : 'Create New Test Instance'}</h2>
                  <form onSubmit={handleTestSubmit} style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className="form-group" style={{ flex: 2 }}>
                        <label className="form-label">Test Title</label>
                        <input type="text" className="form-input" required value={testForm.title} onChange={(e) => setTestForm({...testForm, title: e.target.value})} />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Type</label>
                        <select className="form-input" value={testForm.testType} onChange={(e) => setTestForm({...testForm, testType: e.target.value})}>
                          <option value="aptitude">Aptitude (MCQ only)</option>
                          <option value="technical">Technical (MCQ + Coding)</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Dur. (mins)</label>
                        <input type="number" className="form-input" required min="1" value={testForm.durationMinutes} onChange={(e) => setTestForm({...testForm, durationMinutes: parseInt(e.target.value) || 60})} />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label className="form-label" style={{ margin: 0 }}>Select Questions for this Test</label>
                        <button type="button" className="btn btn-outline" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={() => {
                          setQForm({ title: '', description: '', inputFormat: '', outputFormat: '', constraints: '', subject: testForm.testType, type: testForm.testType === 'aptitude' ? 'mcq' : 'coding', options: [{ text: '', description: '' }], testCases: [{ input: '', expectedOutput: '', isHidden: false }], correctOptionIndex: 0, points: 1, answerFeedback: '' });
                          setShowInlineQuestionCreator(true);
                          setActiveTab('questions');
                        }}>+ Create New Question Inline</button>
                      </div>
                      <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem', background: 'var(--surface-color)' }}>
                        {allQuestions.filter(q => q.subject === testForm.testType).map(q => (
                           <div key={q._id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                             <input type="checkbox" checked={testForm.questions.includes(q._id)} onChange={() => handleToggleQuestionInTest(q._id)} style={{ transform: 'scale(1.2)' }} />
                             <span style={{ fontSize: '0.8rem', background: q.type === 'coding' ? 'var(--secondary-color)' : 'var(--primary-color)', padding: '2px 6px', borderRadius: '4px', opacity: 0.8 }}>{q.type}</span>
                             <span>{q.title}</span>
                             <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{q.points} pts</span>
                           </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button type="submit" className="btn btn-primary">{editingTestId ? 'Update Test' : 'Create Test'}</button>
                      {editingTestId && <button type="button" className="btn btn-outline" onClick={() => { setEditingTestId(null); setTestForm({ title: '', testType: 'aptitude', durationMinutes: 60, questions: [] }); }}>Cancel Edit</button>}
                    </div>
                  </form>
                </div>

                <h2>Active Tests</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
                  {allTests.map(test => (
                    <div key={test._id} style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--secondary-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', background: 'rgba(128,128,128,0.1)', padding: '2px 8px', borderRadius: '12px', textTransform: 'capitalize' }}>{test.testType} - {test.durationMinutes}m</span>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <button onClick={() => fetchTestResults(test._id)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', borderColor: 'var(--success)', color: 'var(--success)' }}>Results</button>
                          <button onClick={() => handleEditTest(test)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }}>Edit</button>
                          <button onClick={() => handleDeleteTest(test._id)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: '#ff4d4d' }}>Del</button>
                        </div>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{test.title}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{test.questions.length} questions included.</p>
                    </div>
                  ))}
                  {allTests.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No tests created yet.</p>}
                </div>
              </>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>Test Results</h2>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await axios.get(`${API_BASE}/admin/tests/${viewingResultsFor}/export`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                            responseType: 'blob'
                          });
                          const url = window.URL.createObjectURL(new Blob([res.data]));
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', 'test_results.csv');
                          document.body.appendChild(link);
                          link.click();
                          link.remove();
                        } catch {
                          alert('Failed to download report');
                        }
                      }} 
                      className="btn btn-primary" 
                      style={{ background: '#217346', borderColor: '#217346', color: '#fff', display: 'flex', alignItems: 'center', padding: '0.6rem 1.2rem' }}
                    >
                       Download Spreadsheet (CSV)
                    </button>
                    <button className="btn btn-outline" onClick={() => setViewingResultsFor(null)}>Back to Tests</button>
                  </div>
                </div>
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '1rem', background: 'var(--surface-color)', borderRadius: '8px', overflow: 'hidden' }}>
                   <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
                     <tr>
                       <th style={{ padding: '1rem' }}>Student Name</th>
                       <th style={{ padding: '1rem' }}>USN</th>
                       <th style={{ padding: '1rem' }}>Branch</th>
                       <th style={{ padding: '1rem' }}>Started At</th>
                       <th style={{ padding: '1rem' }}>Status</th>
                       <th style={{ padding: '1rem' }}>Violations</th>
                       <th style={{ padding: '1rem' }}>Total Score</th>
                     </tr>
                   </thead>
                   <tbody>
                     {testResults.map((res) => (
                       <tr key={res._id} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                         <td style={{ padding: '1rem' }}>{res.studentName}</td>
                         <td style={{ padding: '1rem' }}>{res.usn}</td>
                         <td style={{ padding: '1rem' }}>{res.branch}</td>
                         <td style={{ padding: '1rem' }}>{new Date(res.startTime).toLocaleString()}</td>
                         <td style={{ padding: '1rem' }}>
                           <span style={{ color: res.completed ? 'var(--success)' : 'orange' }}>{res.completed ? 'Completed' : 'In Progress'}</span>
                         </td>
                         <td style={{ padding: '1rem' }}>
                           <span style={{ color: res.violations?.length > 0 ? '#ff4d4d' : 'var(--success)', fontWeight: res.violations?.length > 0 ? 'bold' : 'normal' }}>
                             {res.violations?.length || 0}
                           </span>
                         </td>
                         <td style={{ padding: '1rem', fontWeight: 'bold' }}>{res.totalScore} Pts</td>
                       </tr>
                     ))}
                     {testResults.length === 0 && (
                       <tr><td colSpan="7" style={{ padding: '1rem', color: 'var(--text-muted)' }}>No students have taken this test yet.</td></tr>
                     )}
                   </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'roadmaps' && (
          <div>
            <div className="glass-panel card" style={{ marginBottom: '2rem' }}>
              <h2><Layers size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }} /> {editingRoadmapId ? 'Edit Roadmap' : 'Create Domain Roadmap'}</h2>
              <form onSubmit={handleRoadmapSubmit} style={{ maxWidth: '600px' }}>
                <div className="form-group">
                  <label className="form-label">Roadmap Title</label>
                  <input type="text" className="form-input" required value={rForm.title} onChange={(e) => setRForm({...rForm, title: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Domain Name</label>
                  <input type="text" className="form-input" required value={rForm.domain} onChange={(e) => setRForm({...rForm, domain: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Steps (One per line)</label>
                  <textarea className="form-input" rows="6" placeholder="1. Learn HTML&#10;2. Master CSS&#10;3. Javascript deep dive" required value={rForm.steps} onChange={(e) => setRForm({...rForm, steps: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn btn-primary">{editingRoadmapId ? 'Update Roadmap' : 'Save Roadmap'}</button>
                  {editingRoadmapId && (
                    <button type="button" className="btn btn-outline" onClick={() => { setEditingRoadmapId(null); setRForm({ title: '', domain: '', steps: '' }); }}>Cancel Edit</button>
                  )}
                </div>
              </form>
            </div>

            <h2>Available Roadmaps</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
              {allRoadmaps.map(rm => (
                <div key={rm._id} style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--secondary-color)' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{rm.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>{rm.domain}</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEditRoadmap(rm)} className="btn btn-outline" style={{ flex: 1, padding: '0.4rem', fontSize: '0.9rem' }}>Edit</button>
                    <button onClick={() => handleDeleteRoadmap(rm._id)} className="btn btn-outline" style={{ padding: '0.4rem', color: '#ff4d4d', borderColor: 'rgba(255,77,77,0.3)' }}>Delete</button>
                  </div>
                </div>
              ))}
              {allRoadmaps.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No roadmaps created yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            <h2><BarChart3 size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }} /> Student Performance Analytics</h2>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600 }}>Filter by Department:</label>
              <select className="form-input" style={{ width: 'auto' }} value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)}>
                <option value="All">All Departments</option>
                {[...new Set(analytics.map(a => a.department).filter(Boolean))].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Top Performance Graph</h3>
              {analytics.filter(a => selectedDepartment === 'All' || a.department === selectedDepartment).length === 0 ? (
                 <p style={{ color: 'var(--text-muted)' }}>Not enough data for graph.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {analytics.filter(a => selectedDepartment === 'All' || a.department === selectedDepartment).sort((a,b) => b.totalScore - a.totalScore).slice(0, 5).map((row, idx) => {
                     // Normalize against max score
                     const maxScore = Math.max(...analytics.map(a => a.totalScore)) || 1;
                     const aptWidth = ((row.aptitudeScore || 0) / maxScore) * 100;
                     const techWidth = ((row.technicalScore || 0) / maxScore) * 100;
                     
                     return (
                       <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                         <div style={{ width: '120px', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                           {row.username}
                         </div>
                         <div style={{ flex: 1, background: 'rgba(0,0,0,0.1)', height: '24px', borderRadius: '4px', display: 'flex', overflow: 'hidden' }}>
                           {aptWidth > 0 && <div style={{ width: `${aptWidth}%`, background: 'var(--primary-color)', transition: 'width 1s' }} title={`Aptitude: ${row.aptitudeScore} pts`}></div>}
                           {techWidth > 0 && <div style={{ width: `${techWidth}%`, background: 'var(--secondary-color)', transition: 'width 1s' }} title={`Technical: ${row.technicalScore} pts`}></div>}
                         </div>
                         <div style={{ width: '50px', fontSize: '0.85rem', fontWeight: 600, textAlign: 'right' }}>
                           {row.totalScore}
                         </div>
                       </div>
                     )
                  })}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: '10px', height: '10px', background: 'var(--primary-color)', borderRadius: '2px' }}></div> Aptitude Score</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><div style={{ width: '10px', height: '10px', background: 'var(--secondary-color)', borderRadius: '2px' }}></div> Technical Score</span>
                  </div>
                </div>
              )}
            </div>

            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginTop: '2rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 0' }}>Student Name</th>
                  <th style={{ padding: '1rem 0' }}>Assigned Roadmap</th>
                  <th style={{ padding: '1rem 0' }}>Assign Action</th>
                  <th style={{ padding: '1rem 0' }}>Aptitude Qs</th>
                  <th style={{ padding: '1rem 0' }}>Technical Qs</th>
                  <th style={{ padding: '1rem 0' }}>Total Score</th>
                </tr>
              </thead>
              <tbody>
                {analytics.filter(a => selectedDepartment === 'All' || a.department === selectedDepartment).map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0' }}>
                      <div 
                        style={{ fontWeight: 500, cursor: 'pointer', color: 'var(--primary-color)', textDecoration: 'underline' }}
                        onClick={() => setViewingStudentDetails(row)}
                        title="Click to view full details"
                      >
                        {row.username}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Dept: {row.department} | P: {row.preferredDomain}</div>
                    </td>
                    <td style={{ padding: '1rem 0' }}>
                      <span style={{ background: 'rgba(128,128,128,0.05)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>{row.roadmap}</span>
                    </td>
                    <td style={{ padding: '1rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                       <select 
                         className="form-input" 
                         style={{ padding: '0.3rem', width: 'auto', fontSize: '0.8rem' }}
                         onChange={(e) => {
                            if(e.target.value) handleAssignRoadmap(row.studentId, e.target.value);
                         }}
                       >
                         <option value="">Assign New...</option>
                         {allRoadmaps.map(r => (
                           <option key={r._id} value={r._id}>{r.title}</option>
                         ))}
                       </select>
                    </td>
                    <td style={{ padding: '1rem 0', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{row.aptitudeAnswered || 0} attempted</span><br/>
                      <span style={{ color: 'var(--primary-color)', fontWeight: 500 }}>{row.aptitudeScore || 0} pts</span>
                    </td>
                    <td style={{ padding: '1rem 0', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{row.technicalAnswered || 0} attempted</span><br/>
                      <span style={{ color: 'var(--secondary-color)', fontWeight: 500 }}>{row.technicalScore || 0} pts</span>
                    </td>
                    <td style={{ padding: '1rem 0', fontWeight: 600, color: row.totalScore > 0 ? 'var(--success)' : 'orange' }}>
                      {row.totalScore > 0 ? `+${row.totalScore}` : '0'} Pts
                    </td>
                  </tr>
                ))}
                {analytics.length === 0 && <tr><td colSpan="7" style={{ padding: '1rem 0', color: 'var(--text-muted)' }}>No student data available yet.</td></tr>}
              </tbody>
            </table>

            {viewingStudentDetails && (
              <div className="glass-panel" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1000, width: '90%', maxWidth: '500px', padding: '2rem', border: '2px solid var(--primary-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                   <h2 style={{ margin: 0 }}>Student Profile</h2>
                   <button className="btn btn-outline" onClick={() => setViewingStudentDetails(null)}>&times; Close</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '10px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Name:</span> <span style={{ fontWeight: 600 }}>{viewingStudentDetails.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Email:</span> <span>{viewingStudentDetails.username}</span>
                    <span style={{ color: 'var(--text-muted)' }}>USN:</span> <span>{viewingStudentDetails.usn}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Department:</span> <span style={{ color: 'var(--secondary-color)' }}>{viewingStudentDetails.department}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Year/Sem:</span> <span>Year {viewingStudentDetails.year} | Sem {viewingStudentDetails.semester}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Roadmap:</span> <span>{viewingStudentDetails.roadmap}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Total Score:</span> <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{viewingStudentDetails.totalScore} Pts</span>
                  </div>
                    <div style={{ background: 'rgba(255,152,0,0.1)', padding: '1rem', borderRadius: '6px', border: '1px solid rgba(255,152,0,0.2)' }}>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: '#ff9800' }}>SECURITY MANAGEMENT</p>
                      <button 
                        onClick={() => handleResetPassword(viewingStudentDetails.studentId, viewingStudentDetails.username)} 
                        className="btn" 
                        style={{ width: '100%', background: '#ff9800', color: 'white' }}
                      >
                        Reset Student Password
                      </button>
                    </div>
                    <button 
                      onClick={() => handleDeleteStudent(viewingStudentDetails.studentId)} 
                      className="btn" 
                      style={{ width: '100%', background: '#f44336', color: 'white', marginTop: '0.5rem' }}
                    >
                      Permanently Remove Student
                    </button>
                </div>
              </div>
            )}
            {viewingStudentDetails && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 999 }} onClick={() => setViewingStudentDetails(null)}></div>}
          </div>
        )}
        {activeTab === 'view-questions' && (
          <div>
            <h2><List size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '10px' }} /> Uploaded Questions Bank</h2>
            {allQuestions.length === 0 ? (
               <p style={{ color: 'var(--text-muted)', padding: '2rem 0' }}>No questions have been uploaded yet.</p>
            ) : (
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
                 {allQuestions.map(q => (
                   <div key={q._id} style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                       <span style={{ fontSize: '0.8rem', background: 'rgba(128,128,128,0.1)', padding: '2px 8px', borderRadius: '12px', textTransform: 'capitalize' }}>{q.subject}</span>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.points || 1} pts</span>
                          <button onClick={() => handleEditQuestion(q)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} title="Edit"><Edit2 size={14}/></button>
                          <button onClick={() => handleDeleteQuestion(q._id)} style={{ background: 'transparent', border: 'none', color: 'rgba(239, 68, 68, 0.7)', cursor: 'pointer' }} title="Delete"><Trash2 size={14}/></button>
                       </div>
                     </div>
                     <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', wordBreak: 'break-word' }}>{q.title}</h3>
                     {q.description && <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{q.description}</p>}
                     
                     <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                       {q.options.map((opt, idx) => (
                         <div key={idx} style={{ 
                           fontSize: '0.9rem', 
                           padding: '0.4rem 0.8rem', 
                           background: idx === q.correctOptionIndex ? 'rgba(40,167,69,0.1)' : 'rgba(128,128,128,0.05)',
                           borderLeft: idx === q.correctOptionIndex ? '3px solid #28a745' : '3px solid transparent',
                           borderRadius: '4px'
                         }}>
                           {opt.text}
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
