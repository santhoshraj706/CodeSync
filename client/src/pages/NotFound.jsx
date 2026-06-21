import { Link } from 'react-router-dom';
import { Code, Home, LogIn } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-animated-gradient text-white font-sans selection:bg-indigo-500/30 flex items-center justify-center px-4">
      <div className="relative z-10 text-center max-w-lg">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-indigo-500/20 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
          <Code className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-300" />
        </div>

        <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold mb-3 sm:mb-4 tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">404</span>
        </h1>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-sm sm:text-base text-gray-400 mb-8 sm:mb-10 leading-relaxed">
          Looks like this workspace disappeared into the void.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link to="/" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-6 sm:px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(99,102,241,0.6)] border border-white/10 flex items-center justify-center gap-2">
            <Home className="w-4 h-4" /> Go Home
          </Link>
          <Link to="/login" className="w-full sm:w-auto glass-panel hover:bg-white/10 px-6 sm:px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base text-white transition-all border border-white/10 flex items-center justify-center gap-2">
            <LogIn className="w-4 h-4" /> Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
