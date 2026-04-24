import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      login(res.data.data.token, res.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-4 text-gray-900">Create Account</h2>
      {error && <p className="text-red-600 mb-4 font-medium">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {['name', 'email', 'password'].map(field => (
          <div key={field}>
            <label className="block text-gray-700 font-medium mb-1 capitalize">{field}</label>
            <input
              type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
              value={(form as any)[field]}
              onChange={e => setForm({ ...form, [field]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        ))}
        <button type="submit" disabled={loading} className="w-full py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors">
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
      <p className="mt-4 text-center text-gray-600">
        Already have an account? <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
      </p>
    </div>
  );
}