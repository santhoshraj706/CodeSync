import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { UserPlus } from 'lucide-react';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/signup', { username, email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || 'Signup failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-animated-gradient">
      <div className="p-10 glass-panel rounded-2xl w-[400px] animate-fadeIn">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            <UserPlus className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white tracking-wide">Create Account</h2>
          <p className="text-gray-400 mt-2">Join CodeSync today</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="animate-fadeIn animate-delay-100">
            <label className="block text-gray-300 text-sm mb-2 ml-1">Username</label>
            <input
              type="text"
              className="w-full p-3 rounded-xl glass-input text-white"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="animate-fadeIn animate-delay-200">
            <label className="block text-gray-300 text-sm mb-2 ml-1">Email Address</label>
            <input
              type="email"
              className="w-full p-3 rounded-xl glass-input text-white"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="animate-fadeIn animate-delay-300">
            <label className="block text-gray-300 text-sm mb-2 ml-1">Password</label>
            <input
              type="password"
              className="w-full p-3 rounded-xl glass-input text-white"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="animate-fadeIn animate-delay-300 pt-2">
            <button
              type="submit"
              className="w-full text-white font-semibold p-3 rounded-xl glass-button text-lg tracking-wide flex items-center justify-center gap-2"
            >
              Sign Up
            </button>
          </div>
        </form>
        <p className="mt-8 text-center text-gray-400 animate-fadeIn animate-delay-300">
          Already have an account? <Link to="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline transition font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
