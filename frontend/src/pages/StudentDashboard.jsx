import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BookOpen, Map, Edit3, CheckCircle, Clock, Play, Server, User, LogOut, Sun, Moon, ChevronRight, Layout, Target, ShieldAlert, Award, FileText } from 'lucide-react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/themes/prism-tomorrow.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const CustomEditor = ({ value, onValueChange, language, disabled }) => {
  const prismLang = language === 'python3' ? 'python' : (language === 'c++' ? 'cpp' : 'java');
  let highlighted = value;
  if (Prism.languages[prismLang]) {
    highlighted = Prism.highlight(value || '', Prism.languages[prismLang], prismLang);
  }

  const handleKeyDown = (e) => {
    if(e.key === 'Tab') {
      e.preventDefault();
      const t = e.target;
      const s = t.selectionStart;
      const newCode = t.value.substring(0, s) + "    " + t.value.substring(t.selectionEnd);
      onValueChange(newCode);
      setTimeout(() => {
        t.selectionStart = t.selectionEnd = s + 4;
      }, 0);
    }
  };

  const syncScroll = (e) => {
    const preElement = e.target.nextElementSibling;
    if (preElement) {
      preElement.scrollTop = e.target.scrollTop;
      preElement.scrollLeft = e.target.scrollLeft;
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '300px', backgroundColor: '#1e1e1e', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '14px', fontFamily: '"Consolas", "Monaco", "Courier New", monospace', overflow: 'hidden' }}>
      <textarea
        value={value || ''}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onScroll={syncScroll}
        disabled={disabled}
        spellCheck="false"
        style={{
          margin: 0,
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
          padding: '15px', border: 'none', background: 'transparent', color: 'transparent', caretColor: '#d4d4d4', 
          resize: 'none', zIndex: 1, whiteSpace: 'pre', overflow: 'auto', outline: 'none',
          fontFamily: 'inherit', fontSize: 'inherit', lineHeight: '1.5', tabSize: 4
        }}
      />
      <pre aria-hidden="true" style={{ margin: 0, padding: '15px', pointerEvents: 'none', position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, whiteSpace: 'pre', overflow: 'hidden', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 'inherit', lineHeight: '1.5', tabSize: 4 }}>
        <code className={`language-${prismLang}`} dangerouslySetInnerHTML={{ __html: highlighted || ' ' }} style={{ color: '#d4d4d4', fontFamily: 'inherit', fontSize: 'inherit', lineHeight: 'inherit' }}></code>
      </pre>
    </div>
  );
};

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('aptitude');
  const [roadmap, setRoadmap] = useState(null);
  
  // Test System State
  const [allTests, setAllTests] = useState([]);
  const [activeTest, setActiveTest] = useState(null);
  const [testSession, setTestSession] = useState(null);
  const [testDetails, setTestDetails] = useState({ studentName: '', usn: '', branch: '' });
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExecuting, setIsExecuting] = useState(false);
  const [testSubmittedResult, setTestSubmittedResult] = useState(null);
  
  // Practice System State
  const [questions, setQuestions] = useState([]);
  const [answerInputs, setAnswerInputs] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  
  // Answers tracking
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [codingAnswers, setCodingAnswers] = useState({});

  useEffect(() => {
    fetchRoadmap();
    fetchTests();
  }, []);

  useEffect(() => {
    if (activeTab === 'aptitude' || activeTab === 'technical') {
      fetchQuestions(activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    let interval;
    if (testSession && timeLeft > 0) {
      interval = setInterval(() => {
        const start = new Date(testSession.startTime).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - start) / 1000);
        const totalDurationSeconds = activeTest.durationMinutes * 60;
        const remaining = totalDurationSeconds - elapsedSeconds;

        if (remaining <= 0) {
          setTimeLeft(0);
          submitFinalTest();
          clearInterval(interval);
        } else {
          setTimeLeft(remaining);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [testSession, timeLeft]);

  const [isBlurred, setIsBlurred] = useState(false);

  useEffect(() => {
    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    
    const blockAction = (e) => {
      e.preventDefault();
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('copy', blockAction);
    window.addEventListener('paste', blockAction);
    window.addEventListener('cut', blockAction);
    window.addEventListener('contextmenu', blockAction);
    
    // Keyboard shortcuts block (PrintScreen is tricky, but we can block F12/Ctrl+Shift+I loosely if desired, though focus/blur handles Circle To Search)
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && ['c', 'v', 'x', 'p'].includes(e.key.toLowerCase()))) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('copy', blockAction);
      window.removeEventListener('paste', blockAction);
      window.removeEventListener('cut', blockAction);
      window.removeEventListener('contextmenu', blockAction);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchRoadmap = async () => {
    try {
      const res = await axios.get(`${API_BASE}/student/roadmap`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRoadmap(res.data);
    } catch (err) { console.error(err); }
  };

  const handleSelectDomain = async (domainValue) => {
    try {
      const res = await axios.post(`${API_BASE}/student/domain`, { domain: domainValue }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.roadmap) {
         fetchRoadmap(); // Refresh roadmap if one was auto-assigned
         alert('Domain selected! A roadmap for this domain was automatically assigned.');
      } else {
         alert('Domain selected! Waiting for instructor to assign a roadmap.');
      }
    } catch { alert('Error selecting domain'); }
  };

  const fetchTests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/student/tests`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAllTests(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchQuestions = async (subject) => {
    try {
      const res = await axios.get(`${API_BASE}/student/questions/${subject}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setQuestions(res.data);
    } catch (err) { console.error(err); }
  };

  const submitAnswer = async (q) => {
    let payload = { questionId: q._id };
    let isCorrect = false;
    let selectedIndex = null;
    
    if (q.type === 'coding') {
       const codeData = codingAnswers[q._id];
       if (!codeData || (!codeData.code && !codeData.allPassed)) {
         return alert('Please run your code against the test cases first.');
       }
       payload.textAnswer = codeData.code;
       payload.allPassed = codeData.allPassed || false;
       setSubmittedAnswers(prev => ({
         ...prev,
         [q._id]: { isSubmitted: true, allPassed: payload.allPassed, isCorrect: payload.allPassed }
       }));
    } else {
       const selected = answerInputs[q._id];
       if (selected === undefined || selected === '') {
         return alert('Please select/provide an answer first.');
       }
       if (!isNaN(parseInt(selected))) {
         selectedIndex = parseInt(selected);
         isCorrect = selectedIndex === q.correctOptionIndex;
         payload.selectedOptionIndex = selectedIndex;
         
         setSubmittedAnswers(prev => ({
           ...prev,
           [q._id]: { isCorrect, selectedOption: selectedIndex }
         }));
       } else {
         payload.textAnswer = selected;
         setSubmittedAnswers(prev => ({
           ...prev,
           [q._id]: { isSubmitted: true }
         }));
       }
    }

    try {
      await axios.post(`${API_BASE}/student/answer`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch { alert('Failed to submit answer'); }
  };

  const handleStartTest = async () => {
    if (!testDetails.studentName || !testDetails.usn || !testDetails.branch) {
      return alert('Please fill in Name, USN, and Branch.');
    }
    try {
      const res = await axios.post(`${API_BASE}/student/tests/${activeTest._id}/start`, testDetails, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTestSession(res.data);
      setTimeLeft(activeTest.durationMinutes * 60);
      
      // Initialize coding answers
      const initialCoding = {};
      activeTest.questions.forEach(q => {
        if (q.type === 'coding') {
          initialCoding[q._id] = { code: '', language: 'python3', allPassed: false, results: [] };
        }
      });
      setCodingAnswers(initialCoding);
    } catch { 
      alert('Failed to start test');
    }
  };

  const submitFinalTest = async () => {
    if (!testSession || testSubmittedResult) return;
    
    // Build answers payload
    const answersPayload = [];
    activeTest.questions.forEach(q => {
       if (q.type === 'mcq') {
         if (mcqAnswers[q._id] !== undefined) {
           answersPayload.push({ questionId: q._id, selectedOptionIndex: parseInt(mcqAnswers[q._id]) });
         }
       } else if (q.type === 'coding') {
         if (codingAnswers[q._id]) {
           answersPayload.push({ 
             questionId: q._id, 
             codeSubmitted: codingAnswers[q._id].code, 
             language: codingAnswers[q._id].language,
             allPassed: codingAnswers[q._id].allPassed
           });
         }
       }
    });

    try {
      const res = await axios.post(`${API_BASE}/student/tests/submit`, {
        sessionId: testSession._id,
        testId: activeTest._id,
        answers: answersPayload
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTestSubmittedResult(res.data.totalScore);
    } catch { alert('Failed to submit test'); }
  };

  const handleRunCode = async (qId) => {
    const codeData = codingAnswers[qId];
    if (!codeData || !codeData.code.trim()) return alert('Please write some code first.');
    
    setIsExecuting(true);
    try {
      const language = codeData.language || 'python3';
      const res = await axios.post(`${API_BASE}/student/execute`, {
        questionId: qId,
        code: codeData.code,
        language: language
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setCodingAnswers(prev => ({
        ...prev,
        [qId]: { ...prev[qId], allPassed: res.data.allPassed, results: res.data.results }
      }));
    } catch {
      alert('Code execution failed. Please check your syntax and try again.');
    } finally {
      setIsExecuting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ 
      filter: isBlurred ? 'blur(15px)' : 'none', pointerEvents: isBlurred ? 'none' : 'auto', transition: 'filter 0.1s' 
    }}>
      {isBlurred && (
        <div style={{ position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4d4d', fontSize: '1.5rem', fontWeight: 'bold' }}>
          Security Alert: Assessment window lost focus. Screenshots and external tools are disabled.
        </div>
      )}
      <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BookOpen size={36} /> Student Dashboard
      </h1>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className={`btn ${activeTab === 'aptitude' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('aptitude')}>
          <Edit3 size={18} /> Aptitude Practice
        </button>
        <button className={`btn ${activeTab === 'technical' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('technical')}>
          <Edit3 size={18} /> Technical Practice
        </button>
        <button className={`btn ${activeTab === 'roadmap' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('roadmap')}>
          <Map size={18} /> Manage Roadmap
        </button>
        <button className={`btn ${activeTab === 'tests' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('tests')}>
          <Server size={18} /> Available Tests
        </button>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: (activeTab === 'tests' && testSession) ? '1fr' : undefined }}>
        {activeTab === 'roadmap' && (
          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="glass-panel card">
              <h2>Choose Your Domain</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>Select a domain below to update your preference. If a standard roadmap exists for that domain, it will be automatically assigned to you.</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                {['Web Development', 'Cybersecurity', 'AI and ML', 'Data Analytics', 'DevOps'].map(domain => (
                  <button 
                    key={domain} 
                    className="btn btn-outline"
                    onClick={() => handleSelectDomain(domain)}
                    style={{ padding: '0.6rem 1.2rem', borderRadius: '20px' }}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel card">
              <h2>Assigned Study Roadmap</h2>
              {roadmap ? (
                <div>
                  <h3 style={{ color: 'var(--secondary-color)' }}>{roadmap.title} ({roadmap.domain})</h3>
                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {roadmap.steps.map((step, idx) => (
                      <div key={idx} style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>Step {idx + 1}:</span> {step.title}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>You have not been assigned a roadmap yet. An instructor will assign it to you.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'tests' && (
          <div style={{ gridColumn: '1 / -1' }}>
            {testSubmittedResult !== null ? (
              <div className="glass-panel card" style={{ textAlign: 'center', padding: '3rem' }}>
                <CheckCircle size={64} style={{ color: 'var(--success)', margin: '0 auto', marginBottom: '1.5rem' }} />
                <h2>Test Completed!</h2>
                <p style={{ fontSize: '1.2rem', margin: '1rem 0' }}>Your final score is:</p>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{testSubmittedResult} Points</div>
                <button className="btn btn-outline" style={{ marginTop: '2rem' }} onClick={() => { setTestSession(null); setActiveTest(null); setTestSubmittedResult(null); }}>Back to Tests</button>
              </div>
            ) : testSession ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', position: 'sticky', top: '10px', zIndex: 10 }}>
                  <h2 style={{ margin: 0 }}>{activeTest.title}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: timeLeft < 300 ? '#ff4d4d' : 'var(--text-color)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                      <Clock size={24} /> {formatTime(timeLeft)}
                    </div>
                    <button className="btn btn-primary" onClick={submitFinalTest}>Submit Test Final</button>
                  </div>
                </div>

                {activeTest.questions.map((q, index) => (
                  <div key={q._id} className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <h3 style={{ whiteSpace: 'pre-wrap' }}>{index + 1}. {q.title}</h3>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{q.points} Pts</span>
                    </div>
                    
                    {q.description && (
                      <div style={{ marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.95rem', color: 'var(--text-color)', marginBottom: '0.3rem' }}>Problem Statement</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{q.description}</p>
                      </div>
                    )}
                    
                    {q.type === 'coding' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
                        {q.inputFormat && (
                          <div>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-color)', marginBottom: '0.2rem' }}>Input Format</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', margin: 0 }}>{q.inputFormat}</p>
                          </div>
                        )}
                        {q.outputFormat && (
                          <div>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-color)', marginBottom: '0.2rem' }}>Output Format</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', margin: 0 }}>{q.outputFormat}</p>
                          </div>
                        )}
                        {q.constraints && (
                          <div>
                            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-color)', marginBottom: '0.2rem' }}>Constraints</h4>
                            <code style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{q.constraints}</code>
                          </div>
                        )}
                      </div>
                    )}

                    {q.type === 'mcq' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {q.options.map((opt, i) => (
                          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: '8px', cursor: 'pointer', background: mcqAnswers[q._id] == i ? 'rgba(var(--primary-color-rgb), 0.1)' : 'rgba(0,0,0,0.1)', border: mcqAnswers[q._id] == i ? '1px solid var(--primary-color)' : '1px solid transparent' }}>
                            <input type="radio" name={`q-${q._id}`} value={i} checked={mcqAnswers[q._id] == i} onChange={(e) => setMcqAnswers({...mcqAnswers, [q._id]: e.target.value})} style={{ transform: 'scale(1.2)' }} />
                            <span style={{ whiteSpace: 'pre-wrap' }}>{opt.text}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                         <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                           <select className="form-input" style={{ width: 'auto' }} value={codingAnswers[q._id]?.language || 'python3'} onChange={(e) => setCodingAnswers({...codingAnswers, [q._id]: {...codingAnswers[q._id], language: e.target.value}})}>
                             <option value="python3">Python 3</option>
                             <option value="c++">C++</option>
                             <option value="java">Java</option>
                           </select>
                         </div>
                         <CustomEditor
                           value={codingAnswers[q._id]?.code || ''}
                           onValueChange={(code) => setCodingAnswers({...codingAnswers, [q._id]: {...codingAnswers[q._id], code}})}
                           language={codingAnswers[q._id]?.language || 'python3'}
                           disabled={isExecuting}
                         />
                         
                         <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn btn-outline" onClick={() => handleRunCode(q._id)} disabled={isExecuting} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Play size={16} /> {isExecuting ? 'Running...' : 'Run Code against Test Cases'}
                            </button>
                         </div>

                         {codingAnswers[q._id]?.results?.length > 0 && (
                           <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                             <h4 style={{ marginBottom: '1rem' }}>Execution Results {codingAnswers[q._id].allPassed ? <span style={{color:'var(--success)'}}>(All Passed)</span> : <span style={{color:'#ff4d4d'}}>(Failed)</span>}</h4>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                               {codingAnswers[q._id].results.map((r, i) => (
                                 <div key={i} style={{ padding: '0.8rem', borderRadius: '4px', background: r.passed ? 'rgba(40,167,69,0.1)' : 'rgba(255,77,77,0.1)', borderLeft: `4px solid ${r.passed ? '#28a745' : '#ff4d4d'}` }}>
                                   <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Test Case {r.caseNumber}: {r.passed ? 'Passed' : 'Failed'}</div>
                                   {r.error ? (
                                      <pre style={{ margin: 0, fontSize: '0.8rem', color: '#ff4d4d' }}>{r.error}</pre>
                                   ) : !r.isHidden ? (
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                        <div><strong>Expected:</strong><br/>{r.expected}</div>
                                        <div><strong>Output:</strong><br/>{r.output}</div>
                                      </div>
                                   ) : (
                                      <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Hidden Test Case Output</div>
                                   )}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : activeTest ? (
              <div className="glass-panel card" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ marginBottom: '1.5rem' }}>Start {activeTest.title}</h2>
                <div style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid orange', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', color: 'orange' }}>
                  <strong>Security rules:</strong> Do not switch tabs. Once the test starts, the timer will not pause. 
                </div>
                <form onSubmit={(e) => { e.preventDefault(); handleStartTest(); }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label"><User size={14} style={{ display: 'inline', marginRight: '5px' }}/> Full Name</label>
                    <input type="text" className="form-input" required value={testDetails.studentName} onChange={e => setTestDetails({...testDetails, studentName: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">USN / Roll Number</label>
                    <input type="text" className="form-input" required value={testDetails.usn} onChange={e => setTestDetails({...testDetails, usn: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Branch / Department</label>
                    <input type="text" className="form-input" required value={testDetails.branch} onChange={e => setTestDetails({...testDetails, branch: e.target.value})} />
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Begin Assessment ({activeTest.durationMinutes} mins)</button>
                    <button type="button" className="btn btn-outline" onClick={() => setActiveTest(null)}>Cancel</button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2>Available Assessments</h2>
                {allTests.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No tests available at the moment.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {allTests.map(test => (
                      <div key={test._id} className="glass-panel card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ marginBottom: '1rem' }}>
                          <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', textTransform: 'capitalize' }}>{test.testType}</span>
                        </div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{test.title}</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           <Clock size={16} /> {test.durationMinutes} Minutes
                        </p>
                        <button className="btn btn-primary" style={{ marginTop: 'auto' }} onClick={() => setActiveTest(test)}>
                          Start Test
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {(activeTab === 'aptitude' || activeTab === 'technical') && (
          <div style={{ gridColumn: '1 / -1' }}>
            {questions.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No questions available for this subject yet.
              </p>
            ) : (
              questions.map((q, index) => (
                <div key={q._id} className="glass-panel card" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem', whiteSpace: 'pre-wrap' }}>{index + 1}. {q.title}</h3>
                    {q.domain && <span style={{ fontSize: '0.8rem', background: 'var(--surface-color)', padding: '2px 8px', borderRadius: '12px' }}>{q.domain}</span>}
                  </div>
                  
                  {q.description && (
                    <div style={{ marginBottom: '1rem' }}>
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-color)', marginBottom: '0.3rem' }}>Problem Statement</h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{q.description}</p>
                    </div>
                  )}
                  
                  {q.type === 'coding' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem', background: 'rgba(0,0,0,0.1)', padding: '1rem', borderRadius: '8px' }}>
                      {q.inputFormat && (
                        <div>
                          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-color)', marginBottom: '0.2rem' }}>Input Format</h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', margin: 0 }}>{q.inputFormat}</p>
                        </div>
                      )}
                      {q.outputFormat && (
                        <div>
                          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-color)', marginBottom: '0.2rem' }}>Output Format</h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', margin: 0 }}>{q.outputFormat}</p>
                        </div>
                      )}
                      {q.constraints && (
                        <div>
                          <h4 style={{ fontSize: '0.9rem', color: 'var(--text-color)', marginBottom: '0.2rem' }}>Constraints</h4>
                          <code style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{q.constraints}</code>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div style={{ marginTop: 'auto' }}>
                    {q.options && q.options.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1rem' }}>
                        {q.options.map((opt, idx) => {
                          const submission = submittedAnswers[q._id];
                          let optStyle = { padding: '0.8rem', border: '1px solid var(--border-color)', borderRadius: '6px' };
                          
                          if (submission) {
                             if (idx === q.correctOptionIndex) {
                               optStyle.backgroundColor = 'rgba(40, 167, 69, 0.2)'; 
                               optStyle.borderColor = '#28a745';
                             } else if (idx === submission.selectedOption && !submission.isCorrect) {
                               optStyle.backgroundColor = 'rgba(220, 53, 69, 0.2)'; 
                               optStyle.borderColor = '#dc3545';
                             } else {
                               optStyle.opacity = 0.5; 
                             }
                          } else if (parseInt(answerInputs[q._id]) === idx) {
                             optStyle.borderColor = 'var(--primary-color)';
                             optStyle.backgroundColor = 'rgba(255,255,255,0.05)';
                          }

                          return (
                            <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: submission ? 'default' : 'pointer', transition: 'all 0.2s', ...optStyle }}>
                              <input 
                                type="radio" 
                                name={`q-${q._id}`} 
                                value={idx}
                                disabled={!!submission}
                                checked={parseInt(answerInputs[q._id]) === idx}
                                onChange={(e) => setAnswerInputs({...answerInputs, [q._id]: e.target.value})}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ whiteSpace: 'pre-wrap' }}>{opt.text}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                         <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                           <select className="form-input" style={{ width: 'auto' }} value={codingAnswers[q._id]?.language || 'python3'} disabled={!!submittedAnswers[q._id]} onChange={(e) => setCodingAnswers({...codingAnswers, [q._id]: {...codingAnswers[q._id], language: e.target.value}})}>
                             <option value="python3">Python 3</option>
                             <option value="c++">C++</option>
                             <option value="java">Java</option>
                           </select>
                         </div>
                         <CustomEditor
                           value={codingAnswers[q._id]?.code || ''}
                           onValueChange={(code) => setCodingAnswers({...codingAnswers, [q._id]: {...codingAnswers[q._id], code}})}
                           language={codingAnswers[q._id]?.language || 'python3'}
                           disabled={!!submittedAnswers[q._id] || isExecuting}
                         />
                         
                         <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button className="btn btn-outline" onClick={() => handleRunCode(q._id)} disabled={isExecuting || !!submittedAnswers[q._id]} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <Play size={16} /> {isExecuting ? 'Running...' : 'Run Code against Test Cases'}
                            </button>
                         </div>

                         {codingAnswers[q._id]?.results?.length > 0 && (
                           <div style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px' }}>
                             <h4 style={{ marginBottom: '1rem' }}>Execution Results {codingAnswers[q._id].allPassed ? <span style={{color:'var(--success)'}}>(All Passed)</span> : <span style={{color:'#ff4d4d'}}>(Failed)</span>}</h4>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                               {codingAnswers[q._id].results.map((r, i) => (
                                 <div key={i} style={{ padding: '0.8rem', borderRadius: '4px', background: r.passed ? 'rgba(40,167,69,0.1)' : 'rgba(255,77,77,0.1)', borderLeft: `4px solid ${r.passed ? '#28a745' : '#ff4d4d'}` }}>
                                   <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Test Case {r.caseNumber}: {r.passed ? 'Passed' : 'Failed'}</div>
                                   {r.error ? (
                                      <pre style={{ margin: 0, fontSize: '0.8rem', color: '#ff4d4d' }}>{r.error}</pre>
                                   ) : !r.isHidden ? (
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                        <div><strong>Expected:</strong><br/>{r.expected}</div>
                                        <div><strong>Output:</strong><br/>{r.output}</div>
                                      </div>
                                   ) : (
                                      <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Hidden Test Case Output</div>
                                   )}
                                 </div>
                               ))}
                             </div>
                           </div>
                         )}
                      </div>
                    )}
                    
                    {submittedAnswers[q._id] && q.options && q.options.length > 0 && (
                       <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '6px', backgroundColor: submittedAnswers[q._id].isCorrect ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)', color: submittedAnswers[q._id].isCorrect ? '#28a745' : '#dc3545' }}>
                         <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           {submittedAnswers[q._id].isCorrect ? <><CheckCircle size={18}/> Correct Answer!</> : 'Wrong Answer!'}
                         </h4>
                         
                         {!submittedAnswers[q._id].isCorrect && (
                            <div style={{ color: 'var(--text-color)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                              <p><strong>Correct Option:</strong> {q.options[q.correctOptionIndex]?.text}</p>
                            </div>
                         )}

                         {q.options[q.correctOptionIndex] && q.options[q.correctOptionIndex].description && (
                            <div style={{ color: 'var(--text-color)', fontSize: '0.9rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                              <p style={{ opacity: 0.9 }}><strong>Explanation:</strong> {q.options[q.correctOptionIndex].description}</p>
                            </div>
                         )}

                         {q.answerFeedback && (
                            <div style={{ color: 'var(--text-color)', fontSize: '0.9rem', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                              <p style={{ opacity: 0.9 }}><strong>Feedback:</strong> {q.answerFeedback}</p>
                            </div>
                         )}
                       </div>
                    )}

                    {submittedAnswers[q._id] && q.type === 'coding' && (
                       <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '6px', backgroundColor: submittedAnswers[q._id].allPassed ? 'rgba(40,167,69,0.1)' : 'rgba(220,53,69,0.1)', color: submittedAnswers[q._id].allPassed ? '#28a745' : '#dc3545' }}>
                         <h4 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                           {submittedAnswers[q._id].allPassed ? <><CheckCircle size={18}/> Code Submitted & Test Cases Passed!</> : 'Submitted with failing test cases.'}
                         </h4>
                       </div>
                    )}

                    {!submittedAnswers[q._id] && (
                      <button className="btn btn-primary btn-block" style={{ marginTop: '1rem' }} onClick={() => submitAnswer(q)}>
                        <CheckCircle size={18} /> Submit Answer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
