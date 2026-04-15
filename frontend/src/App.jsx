import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import AuthSuccess from './pages/AuthSuccess';
import Navbar from './components/Navbar';

// Very basic auth guard
const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) return <Navigate to="/login" />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container" style={{ paddingBottom: '3rem', paddingTop: '2rem' }}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          
          <Route path="/admin/*" element={
            <PrivateRoute role="admin">
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/student/*" element={
            <PrivateRoute role="student">
              <StudentDashboard />
            </PrivateRoute>
          } />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
