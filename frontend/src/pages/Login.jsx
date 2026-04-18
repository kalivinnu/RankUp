import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogIn } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate(res.data.user.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  };


  return (
    <div className="flex-center" style={{ minHeight: '90vh', padding: '2rem' }}>
      <div className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', maxWidth: '1000px', width: '100%', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px var(--border-color)' }}>
        
        {/* Brand Showcase Panel */}
        <div style={{ flex: '1 1 400px', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', padding: '4rem 3rem', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          
          {/* Abstract background shapes */}
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
          <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '300px', height: '300px', background: 'rgba(0,0,0,0.2)', borderRadius: '50%', filter: 'blur(40px)' }}></div>

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '3.5rem', marginBottom: '1rem', background: 'none', WebkitTextFillColor: 'white', letterSpacing: '-1px' }}>RankUp</h1>
              <p style={{ fontSize: '1.2rem', opacity: 0.9, lineHeight: 1.6, marginBottom: '0' }}>Your exclusive portal to elite engineering assessments.</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: 'auto', paddingTop: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Enterprise Security</h4>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: 1.5 }}>Strictly domain-locked authentications ensuring assessment integrity.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.2rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem', fontWeight: 600 }}>Zero Friction</h4>
                  <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', lineHeight: 1.5 }}>Aesthetic interfaces combined with uninterrupted learning workflows.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Login Panel */}
        <div style={{ flex: '1 1 450px', padding: '4rem 3rem', background: 'var(--surface-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ display: 'inline-block', padding: '16px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '20px', color: 'var(--primary-color)', marginBottom: '1.2rem', boxShadow: 'inset 0 0 0 1px rgba(79, 70, 229, 0.2)' }}>
              <LogIn size={32} />
            </div>
            <h2 style={{ fontSize: '2rem', margin: 0, letterSpacing: '-0.5px' }}>Welcome Back</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1rem' }}>Enter your credentials to access your workspace</p>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '0.3px' }}>Email Address</label>
              <input 
                type="email" 
                className="form-input" 
                placeholder="college-id@domain.edu"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                required
                style={{ padding: '0.9rem 1.2rem', fontSize: '1rem', background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '0.3px' }}>Password</label>
                 <a href="#" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Forgot?</a>
              </div>
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                style={{ padding: '0.9rem 1.2rem', fontSize: '1.1rem', letterSpacing: '2px', background: 'rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.05)' }}
              />
            </div>
            
            <button type="submit" className="btn btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '0.5rem', borderRadius: '12px' }}>
              Secure Log In
            </button>
          </form>

          <div style={{ margin: '2rem auto 1.5rem', width: '100%', maxWidth: '400px', textAlign: 'center', color: 'var(--text-muted)', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-color)', zIndex: 0 }}></div>
            <span style={{ display: 'inline-block', background: 'var(--surface-color)', padding: '0 15px', position: 'relative', zIndex: 1, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>or continue with</span>
          </div>

          <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }}>
            <button onClick={handleGoogleAuth} className="btn" style={{ width: '100%', background: 'white', color: '#333', border: '1px solid #e2e8f0', padding: '0.9rem', fontSize: '1rem', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>

          <p style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Are you a new student? <Link to="/signup" style={{ color: 'var(--primary-color)', fontWeight: 600, marginLeft: '5px' }}>Apply for access</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
