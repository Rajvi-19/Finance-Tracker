import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const Register = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await register({ fullName, email, password });
      navigate('/');
      showToast('Account created successfully!', 'success');
    } catch (error) {
      if (error.data?.errors) {
        showToast(error.data.errors[0].message, 'error');
      } else {
        showToast(error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    backgroundColor: 'var(--bg-primary)',
    position: 'relative',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-lg)',
    padding: '2.5rem 2.25rem',
    border: '1px solid var(--border-light)',
  };

  const logoBadgeStyle = {
    width: '48px',
    height: '48px',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--primary)',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    margin: '0 auto 1.25rem auto',
    boxShadow: 'var(--shadow-sm)',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={logoBadgeStyle}>💳</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: '0 0 0.35rem 0' }}>Create account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Start tracking your finances today</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Input 
            label="Full Name *" 
            type="text" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            required 
            placeholder="John Doe"
          />

          <Input 
            label="Email Address *" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            placeholder="you@example.com"
          />
          
          <Input 
            label="Password *" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            placeholder="Min 8 characters"
            helperText="Must contain at least 8 characters, one uppercase letter, and one number."
          />

          <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading} style={{ marginTop: '0.75rem' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '1.75rem 0 0 0' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 700 }}>Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

