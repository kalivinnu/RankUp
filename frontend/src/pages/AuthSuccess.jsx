import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Decode JWT slightly hacky for client side, normally better to fetch `/me` from backend
      // But for this example we can decode payload basic
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ id: payload.id, role: payload.role }));
        
        navigate(payload.role === 'admin' ? '/admin' : '/student');
      } catch {
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [navigate, searchParams]);

  return (
    <div className="flex-center" style={{ minHeight: '80vh' }}>
      <h2>Authenticating...</h2>
    </div>
  );
};

export default AuthSuccess;
