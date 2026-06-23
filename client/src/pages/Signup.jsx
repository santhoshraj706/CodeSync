import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { UserPlus, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import NeonWireframeBackground from '../components/NeonWireframeBackground';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { username, email, password });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen aurora-bg cinematic-bg-only relative">
      <NeonWireframeBackground intensity="soft" />
      <div className="grid-overlay"></div>
      <div className="bg-orb-1"></div>
      <div className="bg-orb-2"></div>
      <div className="bg-orb-3"></div>
      <div className="bg-ring"></div>
      <div className="bg-spotlight"></div>
      <div className="bg-light-sweep" style={{ top: '60%', left: '-30%' }}></div>
      <div className="bg-3d-cube" style={{ top: '12%', left: '5%' }}>
        <div className="bg-3d-cube-inner">
          <div className="bg-3d-cube-face bg-3d-cube-front"></div>
          <div className="bg-3d-cube-face bg-3d-cube-back"></div>
          <div className="bg-3d-cube-face bg-3d-cube-right"></div>
          <div className="bg-3d-cube-face bg-3d-cube-left"></div>
          <div className="bg-3d-cube-face bg-3d-cube-top"></div>
          <div className="bg-3d-cube-face bg-3d-cube-bottom"></div>
        </div>
      </div>
      <div className="bg-3d-diamond bg-3d-diamond-1" style={{ bottom: '10%', right: '8%' }}></div>
      <div className="bg-3d-diamond bg-3d-diamond-3" style={{ top: '40%', left: '60%' }}></div>
      <div className="bg-3d-triangle bg-3d-triangle-2" style={{ top: '20%', right: '15%' }}></div>
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none animate-blob"></div>
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-teal-600/20 rounded-full blur-[120px] pointer-events-none animate-blob" style={{ animationDelay: '3s' }}></div>

      <div className="p-10 sm:p-12 metallic-panel rounded-[2rem] w-full max-w-[440px] mx-4 animate-fadeIn shadow-[0_0_60px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.3)] backdrop-blur-md relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <UserPlus className="w-10 h-10 text-emerald-400 group-hover:scale-110 transition-transform duration-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-emerald-200 tracking-tight text-center">Create Account</h2>
          <p className="text-slate-400 mt-3 text-sm font-medium text-center">Join CodeSync today</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center justify-center animate-fadeIn font-semibold shadow-inner">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="animate-fadeIn animate-delay-100 group">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 ml-1 opacity-80 group-focus-within:text-emerald-400 group-focus-within:opacity-100 transition-colors">Username</label>
            <input
              type="text"
              className="w-full p-4 rounded-xl glow-input text-white font-medium placeholder-slate-500"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="animate-fadeIn animate-delay-200 group">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 ml-1 opacity-80 group-focus-within:text-emerald-400 group-focus-within:opacity-100 transition-colors">Email Address</label>
            <input
              type="email"
              className="w-full p-4 rounded-xl glow-input text-white font-medium placeholder-slate-500"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="animate-fadeIn animate-delay-300 group">
            <label className="block text-slate-300 text-xs font-bold uppercase tracking-wider mb-2 ml-1 opacity-80 group-focus-within:text-emerald-400 group-focus-within:opacity-100 transition-colors">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full p-4 pr-12 rounded-xl glow-input text-white font-medium placeholder-slate-500"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-white"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="animate-fadeIn animate-delay-300 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 border border-emerald-400/30 shadow-[0_4px_20px_rgba(16,185,129,0.3)] text-white font-bold p-4 rounded-xl text-lg tracking-wide flex items-center justify-center gap-2 group transition-all hover:-translate-y-0.5 shine-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-slate-400 text-sm animate-fadeIn animate-delay-300">
          Already have an account? <Link to="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline transition font-bold ml-1">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
