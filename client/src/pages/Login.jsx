import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { LogIn, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-animated-gradient relative">
      {/* Decorative background elements */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="p-10 sm:p-12 glass-panel rounded-[2rem] w-full max-w-[440px] mx-4 animate-fadeIn shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-white/10">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.3)] backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <LogIn className="w-10 h-10 text-indigo-400 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200 tracking-tight text-center">Welcome Back</h2>
          <p className="text-slate-400 mt-3 text-sm font-medium text-center">Login to your collaborative workspace</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center justify-center animate-fadeIn font-semibold shadow-inner">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="animate-fadeIn animate-delay-100 group">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 ml-1 opacity-80 group-focus-within:text-indigo-400 group-focus-within:opacity-100 transition-colors">Email Address</label>
            <input
              type="email"
              className="w-full p-4 rounded-xl glass-input text-white font-medium placeholder-slate-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="animate-fadeIn animate-delay-200 group">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 ml-1 opacity-80 group-focus-within:text-indigo-400 group-focus-within:opacity-100 transition-colors">Password</label>
            <input
              type="password"
              className="w-full p-4 rounded-xl glass-input text-white font-medium placeholder-slate-500"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="animate-fadeIn animate-delay-300 pt-4">
            <button
              type="submit"
              className="w-full text-white font-bold p-4 rounded-xl glass-button text-lg tracking-wide flex items-center justify-center gap-2 group"
            >
              Sign In <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm animate-fadeIn animate-delay-300">
          Don't have an account? <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 hover:underline transition font-bold ml-1">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
