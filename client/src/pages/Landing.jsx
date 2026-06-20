import React from 'react';
import { Link } from 'react-router-dom';
import { Code, Users, PenTool, Zap, Terminal, Globe, Shield, Sparkles } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen bg-animated-gradient text-white font-sans selection:bg-indigo-500/30 overflow-hidden">
      
      {/* Navigation Bar */}
      <nav className="glass-panel sticky top-0 z-50 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Code className="text-indigo-400 w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-wide">CodeSync</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-300 hover:text-white font-medium transition-colors">Log in</Link>
          <Link to="/signup" className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-400/30">
            Sign Up Free
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold tracking-wide mb-8">
          <Sparkles className="w-4 h-4" />
          The future of collaborative development
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Code together, <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
            in perfect sync.
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
          CodeSync is a real-time collaborative code editor with an integrated whiteboard, team chat, and live execution. Brainstorm, build, and run code instantly with your team.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-fadeIn animate-delay-100">
          <Link to="/signup" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(99,102,241,0.6)] border border-white/10 flex items-center justify-center gap-2">
            Get Started <Zap className="w-5 h-5 fill-current" />
          </Link>
          <Link to="/login" className="w-full sm:w-auto glass-panel hover:bg-white/10 px-8 py-4 rounded-2xl font-bold text-lg text-white transition-all border border-white/10 flex items-center justify-center gap-2">
            Login to Workspace
          </Link>
        </div>
      </main>

      {/* Visual Divider / Decorator */}
      <div className="relative w-full max-w-5xl mx-auto mb-24 px-6 animate-fadeIn animate-delay-200">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent blur-3xl rounded-full -z-10 transform scale-y-50 scale-x-110"></div>
        <div className="glass-panel p-2 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-emerald-500/10 opacity-50"></div>
          <div className="bg-[#0f111a] rounded-2xl h-[400px] border border-white/5 flex items-center justify-center relative overflow-hidden shadow-inner">
             {/* Abstract Code/Editor Representation */}
             <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMGYxMTFhIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4wMiIgc3Ryb2tlLXdpZHRoPSIxIj48L3BhdGg+Cjwvc3ZnPg==')] opacity-30"></div>
             
             <div className="w-3/4 max-w-2xl bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl overflow-hidden z-10 transform hover:scale-105 transition-transform duration-500">
                <div className="flex items-center px-4 py-2 bg-gray-800/80 border-b border-gray-700/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="mx-auto text-xs font-mono text-gray-400">index.js — CodeSync</div>
                </div>
                <div className="p-4 font-mono text-sm sm:text-base text-gray-300 space-y-2">
                  <div className="flex"><span className="text-pink-400 mr-2">function</span> <span className="text-blue-400">collaborate</span>() {'{'}</div>
                  <div className="pl-6"><span className="text-pink-400">const</span> team = [<span className="text-emerald-400">'You'</span>, <span className="text-emerald-400">'AI'</span>, <span className="text-emerald-400">'Peers'</span>];</div>
                  <div className="pl-6"><span className="text-pink-400">return</span> team.<span className="text-yellow-200">join</span>(<span className="text-emerald-400">' + '</span>) + <span className="text-emerald-400">' = Magic'</span>;</div>
                  <div className="flex">{'}'}</div>
                  <div className="flex mt-4 text-gray-500 italic">// Real-time cursors moving...</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-6 pb-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Everything you need to ship faster</h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">A unified workspace that brings your team and code together seamlessly.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="glass-panel p-8 rounded-3xl hover:bg-white/5 transition-all duration-300 border border-white/10 hover:border-indigo-500/30 group">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Globe className="text-blue-400 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Real-Time Sync</h3>
            <p className="text-gray-400 leading-relaxed">Collaborate instantly with zero latency. See your teammates' cursors and edits as they happen.</p>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel p-8 rounded-3xl hover:bg-white/5 transition-all duration-300 border border-white/10 hover:border-purple-500/30 group">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Code className="text-purple-400 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Pro Editor</h3>
            <p className="text-gray-400 leading-relaxed">Powered by Monaco. Get syntax highlighting, auto-completion, and multi-language support out of the box.</p>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel p-8 rounded-3xl hover:bg-white/5 transition-all duration-300 border border-white/10 hover:border-emerald-500/30 group">
            <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <PenTool className="text-emerald-400 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Live Whiteboard</h3>
            <p className="text-gray-400 leading-relaxed">Sketch architectures, draw flowcharts, or explain complex logic with an integrated collaborative canvas.</p>
          </div>

          {/* Feature 4 */}
          <div className="glass-panel p-8 rounded-3xl hover:bg-white/5 transition-all duration-300 border border-white/10 hover:border-yellow-500/30 group">
            <div className="w-14 h-14 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Terminal className="text-yellow-400 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Live Execution</h3>
            <p className="text-gray-400 leading-relaxed">Compile and run your code directly in the browser. See standard output and errors in real-time.</p>
          </div>

          {/* Feature 5 */}
          <div className="glass-panel p-8 rounded-3xl hover:bg-white/5 transition-all duration-300 border border-white/10 hover:border-pink-500/30 group">
            <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="text-pink-400 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Team Chat</h3>
            <p className="text-gray-400 leading-relaxed">Keep the conversation where the code is. Integrated messaging with emoji support.</p>
          </div>

          {/* Feature 6 */}
          <div className="glass-panel p-8 rounded-3xl hover:bg-white/5 transition-all duration-300 border border-white/10 hover:border-cyan-500/30 group">
            <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="text-cyan-400 w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Secure Workspaces</h3>
            <p className="text-gray-400 leading-relaxed">Protect your rooms with passwords. Admin controls allow you to delete sensitive data instantly.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-panel border-t border-white/10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Code className="text-indigo-400 w-5 h-5" />
            <span className="font-bold tracking-wide text-gray-300">CodeSync</span>
          </div>
          <p className="text-gray-500 text-sm text-center md:text-left">
            © {new Date().getFullYear()} CodeSync. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
