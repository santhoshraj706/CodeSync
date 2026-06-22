import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { User, Save, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Mail, Building, GraduationCap, BookOpen } from 'lucide-react';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316',
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6',
];

const EXPERIENCE_LEVELS = ['', 'Beginner', 'Intermediate', 'Advanced', 'Professional'];

const getInitials = (name) => {
  if (!name || !name.trim()) return '?';
  return name.trim().charAt(0).toUpperCase();
};

const generateAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  const index = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [bio, setBio] = useState('');
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        const p = res.data;
        setFullName(p.fullName || '');
        setUsername(p.username || '');
        setEmail(p.email || '');
        setCollegeName(p.collegeName || '');
        setExperienceLevel(p.experienceLevel || '');
        setBio(p.bio || '');
        setAvatarColor(p.avatarColor || generateAvatarColor(p.fullName || p.username));
      } catch (err) {
        setError('Could not load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (username.includes(' ')) {
      setError('Username cannot contain spaces');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Invalid email address');
      return;
    }
    if (bio && bio.length > 200) {
      setError('Bio must be 200 characters or less');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/profile', {
        fullName: fullName.trim(),
        username: username.trim(),
        email,
        collegeName: collegeName.trim(),
        experienceLevel,
        bio,
        avatarColor,
      });
      showToast('Profile saved successfully');
      login(localStorage.getItem('token'), res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070a14] flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
          <span className="text-sm text-slate-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a14] text-white">
      <div className="fixed inset-0 bg-gradient-to-br from-indigo-950/20 via-transparent to-purple-950/20 pointer-events-none z-0"></div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md border text-sm animate-fadeIn ${
            toast.type === 'error'
              ? 'bg-red-500/20 border-red-500/30 text-red-300'
              : 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.message}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-slate-950/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Avatar Section */}
          <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-transparent px-8 py-8 border-b border-white/10 flex flex-col items-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-xl border-2 border-white/20 mb-4"
              style={{ backgroundColor: avatarColor || generateAvatarColor(fullName || username) }}
            >
              {getInitials(fullName || username)}
            </div>
            <h1 className="text-lg font-bold text-white">{fullName || 'Your Name'}</h1>
            <p className="text-xs text-slate-500 mt-1">@{username}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="p-8 space-y-6">
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building className="w-3 h-3" /> College Name
                </label>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="Your college (optional)"
                  className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3 h-3" /> Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer"
              >
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level} className="bg-slate-900 text-white">
                    {level || 'Select experience level...'}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" /> Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself (optional, max 200 chars)"
                maxLength={200}
                rows={3}
                className="w-full bg-white/5 border border-white/10 focus:border-indigo-500/40 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
              />
              <span className="text-[10px] text-slate-600">{bio.length}/200</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avatar Color</label>
              <div className="flex items-center gap-2">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAvatarColor(c)}
                    className={`w-8 h-8 rounded-xl transition-all duration-200 border-2 ${
                      avatarColor === c ? 'border-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.3)]' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-slate-300 transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
