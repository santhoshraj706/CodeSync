import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NeonWireframeBackground from '../components/NeonWireframeBackground';
import {
  Code, Users, PenTool, Zap, Terminal, Globe, Shield, Sparkles,
  MessageSquare, ChevronRight, GitBranch, ExternalLink, Play,
  Monitor, Layout, ArrowRight, Star, BookOpen, GraduationCap,
  Wifi, Check, ChevronDown, Plus, Menu, X
} from 'lucide-react';

const FAQ_DATA = [
  { q: 'What is CodeSync?', a: 'CodeSync is a real-time collaborative code editor with an integrated whiteboard, team chat, live code execution, and AI assistance. It lets you code, discuss, draw, and run code with your team in one seamless workspace.' },
  { q: 'Can multiple users code together?', a: 'Yes. Multiple users can join the same room and edit code simultaneously. You will see each other\'s cursors, selections, and changes in real time — just like Google Docs for code.' },
  { q: 'Does CodeSync support live code execution?', a: 'Yes. CodeSync includes a built-in code execution engine. You can run your code directly in the browser and see the output instantly, making it easy to test and debug collaboratively.' },
  { q: 'Can teams use chat and whiteboard?', a: 'Absolutely. Every room comes with a team chat for messaging and a live whiteboard for sketching diagrams, flowcharts, and visual ideas alongside your code.' },
  { q: 'Does CodeSync include AI assistance?', a: 'Yes. CodeSync features an AI Assistant that can help review code, suggest improvements, explain concepts, and answer questions — all within your collaborative workspace.' },
];

const Landing = () => {
  const [mockupTab, setMockupTab] = useState('code');
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    const elements = document.querySelectorAll('[data-reveal]');
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const mockupContent = {
    code: (
      <div className="font-mono text-xs sm:text-sm text-gray-300 p-4 sm:p-6 space-y-2 leading-relaxed">
        <div className="flex items-center gap-2 text-pink-400"><span className="text-purple-400">import</span> React <span className="text-purple-400">from</span> <span className="text-emerald-400">'react'</span>;</div>
        <div className="flex items-center gap-2 text-pink-400"><span className="text-purple-400">import</span> &#123; useState &#125; <span className="text-purple-400">from</span> <span className="text-emerald-400">'react'</span>;</div>
        <div className="h-2"></div>
        <div><span className="text-purple-400">const</span> <span className="text-yellow-300">CollabApp</span>{' = '}<span className="text-blue-400">{'() =>'}</span> {'{'}</div>
        <div className="pl-4"><span className="text-purple-400">const</span> [code, setCode]{' = '}<span className="text-blue-400">useState</span>(<span className="text-emerald-400">''</span>);</div>
        <div className="pl-4"><span className="text-purple-400">const</span> [users, setUsers]{' = '}<span className="text-blue-400">useState</span>([]);</div>
        <div className="h-2"></div>
        <div className="pl-4"><span className="text-purple-400">return</span> (</div>
        <div className="pl-8"><span className="text-gray-500">&lt;</span><span className="text-red-400">div</span><span className="text-gray-500">&gt;</span></div>
        <div className="pl-10"><span className="text-gray-500">&lt;</span><span className="text-red-400">Editor</span> <span className="text-cyan-300">code</span>=&#123;code&#125; <span className="text-cyan-300">onChange</span>=&#123;setCode&#125; <span className="text-gray-500">/&gt;</span></div>
        <div className="pl-10"><span className="text-gray-500">&lt;</span><span className="text-red-400">Chat</span> <span className="text-cyan-300">users</span>=&#123;users&#125; <span className="text-gray-500">/&gt;</span></div>
        <div className="pl-8"><span className="text-gray-500">&lt;/</span><span className="text-red-400">div</span><span className="text-gray-500">&gt;</span></div>
        <div className="pl-4">);</div>
        <div>&#125;;</div>
        <div className="flex items-center gap-2 mt-3 text-gray-500 italic"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> 3 collaborators editing</div>
      </div>
    ),
    board: (
      <div className="flex items-center justify-center h-full p-4 sm:p-6">
        <div className="w-full max-w-sm bg-gray-900/60 rounded-xl border border-gray-700/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
            <PenTool className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold">Live Whiteboard</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-14 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center text-xs text-indigo-300">Flowchart</div>
            <div className="h-14 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center text-xs text-emerald-300">Diagram</div>
            <div className="h-14 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center text-xs text-amber-300">Sketch</div>
            <div className="h-14 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-xs text-cyan-300">Sticky Notes</div>
          </div>
          <div className="h-24 rounded-lg bg-gray-800/50 border border-dashed border-gray-600/40 flex items-center justify-center text-xs text-gray-500 mt-2">
            <PenTool className="w-4 h-4 mr-2" /> Draw anything, together
          </div>
        </div>
      </div>
    ),
    chat: (
      <div className="flex flex-col h-full p-3 sm:p-4">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 px-2">
          <MessageSquare className="w-3.5 h-3.5 text-pink-400" />
          <span className="font-semibold">Team Chat</span>
        </div>
        <div className="flex-1 space-y-3 px-2 overflow-hidden">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">A</div>
            <div><div className="bg-gray-800/80 px-3 py-2 rounded-xl text-xs text-gray-200">Great start on the auth flow!</div><div className="text-[10px] text-gray-500 mt-0.5">Alice · 2m ago</div></div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">B</div>
            <div><div className="bg-gray-800/80 px-3 py-2 rounded-xl text-xs text-gray-200">I'll handle the API integration</div><div className="text-[10px] text-gray-500 mt-0.5">Bob · 1m ago</div></div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0">C</div>
            <div><div className="bg-gray-800/80 px-3 py-2 rounded-xl text-xs text-gray-200">Let's review the PR together</div><div className="text-[10px] text-gray-500 mt-0.5">Charlie · now</div></div>
          </div>
        </div>
        <div className="mt-3 px-2 pt-3 border-t border-gray-700/30">
          <div className="flex items-center gap-2 bg-gray-800/60 rounded-xl px-4 py-2.5 border border-gray-700/30">
            <input disabled placeholder="Type a message..." className="flex-1 bg-transparent text-xs text-gray-300 outline-none placeholder-gray-500" />
            <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
          </div>
        </div>
      </div>
    ),
    ai: (
      <div className="flex flex-col h-full p-3 sm:p-4">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 px-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <div className="flex-1 space-y-3 px-2 overflow-hidden">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-xs shrink-0">💡</div>
            <div><div className="bg-gray-800/80 px-3 py-2 rounded-xl text-xs text-gray-200">Suggest a more efficient sorting algorithm for this data set.</div><div className="text-[10px] text-gray-500 mt-0.5">AI · just now</div></div>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-[10px] font-bold text-white shrink-0">U</div>
            <div><div className="bg-gray-800/80 px-3 py-2 rounded-xl text-xs text-gray-200">Can you review this code for edge cases?</div><div className="text-[10px] text-gray-500 mt-0.5">You · now</div></div>
          </div>
        </div>
        <div className="mt-3 px-2 pt-3 border-t border-gray-700/30">
          <div className="flex items-center gap-2 bg-indigo-500/10 rounded-xl px-4 py-2.5 border border-indigo-500/20">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs text-indigo-300 font-medium">Ask AI anything...</span>
          </div>
        </div>
      </div>
    ),
    output: (
      <div className="flex flex-col h-full p-3 sm:p-4">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 px-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold">Output</span>
        </div>
        <div className="flex-1 bg-gray-950/60 rounded-xl border border-gray-700/30 p-4 font-mono text-xs space-y-1.5 overflow-hidden">
          <div className="text-emerald-400">$ npm run build</div>
          <div className="text-gray-400">&gt; codesync@1.0.0 build</div>
          <div className="text-gray-400">&gt; vite build</div>
          <div className="h-1"></div>
          <div className="text-cyan-300">vite v6.0.0 building for production...</div>
          <div className="text-gray-400">transforming... ✓ 142 modules transformed.</div>
          <div className="text-gray-400">rendering chunks... done.</div>
          <div className="h-1"></div>
          <div className="text-emerald-400">✓ built in 1.24s</div>
          <div className="text-gray-500 mt-2 flex items-center gap-2"><Check className="w-3 h-3 text-emerald-400" /> Build successful — no errors</div>
        </div>
      </div>
    ),
  };

  return (
    <div className="min-h-screen aurora-bg cinematic-bg-only text-white font-sans selection:bg-indigo-500/30">
      <NeonWireframeBackground intensity="full" />
      <div className="grid-overlay"></div>
      <div className="bg-orb-1"></div>
      <div className="bg-orb-2"></div>
      <div className="bg-orb-3"></div>
      <div className="bg-ring"></div>
      <div className="bg-spotlight"></div>
      <div className="bg-light-sweep" style={{ top: '35%', left: '-10%' }}></div>
      <div className="bg-3d-cube" style={{ top: '10%', right: '5%' }}>
        <div className="bg-3d-cube-inner">
          <div className="bg-3d-cube-face bg-3d-cube-front"></div>
          <div className="bg-3d-cube-face bg-3d-cube-back"></div>
          <div className="bg-3d-cube-face bg-3d-cube-right"></div>
          <div className="bg-3d-cube-face bg-3d-cube-left"></div>
          <div className="bg-3d-cube-face bg-3d-cube-top"></div>
          <div className="bg-3d-cube-face bg-3d-cube-bottom"></div>
        </div>
      </div>
      <div className="bg-3d-cube" style={{ top: '55%', left: '3%', width: '140px', height: '140px' }}>
        <div className="bg-3d-cube-inner" style={{ animationDuration: '35s' }}>
          <div className="bg-3d-cube-face" style={{ width: '140px', height: '140px', transform: 'rotateY(0deg) translateZ(70px)' }}></div>
          <div className="bg-3d-cube-face" style={{ width: '140px', height: '140px', transform: 'rotateX(180deg) translateZ(70px)' }}></div>
          <div className="bg-3d-cube-face" style={{ width: '140px', height: '140px', transform: 'rotateY(90deg) translateZ(70px)' }}></div>
          <div className="bg-3d-cube-face" style={{ width: '140px', height: '140px', transform: 'rotateY(-90deg) translateZ(70px)' }}></div>
          <div className="bg-3d-cube-face" style={{ width: '140px', height: '140px', transform: 'rotateX(90deg) translateZ(70px)' }}></div>
          <div className="bg-3d-cube-face" style={{ width: '140px', height: '140px', transform: 'rotateX(-90deg) translateZ(70px)' }}></div>
        </div>
      </div>
      <div className="bg-3d-diamond bg-3d-diamond-1" style={{ top: '5%', left: '10%' }}></div>
      <div className="bg-3d-diamond bg-3d-diamond-2" style={{ bottom: '10%', right: '15%' }}></div>
      <div className="bg-3d-diamond bg-3d-diamond-3" style={{ top: '40%', left: '50%' }}></div>
      <div className="bg-3d-triangle bg-3d-triangle-1" style={{ bottom: '20%', left: '8%' }}></div>
      <div className="bg-3d-triangle bg-3d-triangle-2" style={{ top: '25%', right: '12%' }}></div>

      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-xl bg-[#0b0e1a]/80 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Code className="text-indigo-400 w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-wide">CodeSync</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">Features</button>
            <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">How It Works</button>
            <Link to="/guide" className="hover:text-white transition-colors">Guide</Link>
            <button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-white transition-colors">FAQ</button>
            <Link to="/login" className="hover:text-white transition-colors">Log in</Link>
            <Link to="/signup" className="glow-button text-white px-4 py-2 rounded-xl font-semibold text-sm">
              Sign Up Free
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 text-gray-300 hover:text-white transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[60] bg-[#0b0e1a]/95 backdrop-blur-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                  <Code className="text-indigo-400 w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-wide">CodeSync</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-300 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4">
              {[
                { label: 'Home', onClick: () => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                { label: 'Features', onClick: () => { setMobileMenuOpen(false); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); } },
                { label: 'How It Works', onClick: () => { setMobileMenuOpen(false); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); } },
                { label: 'Guide', onClick: () => { setMobileMenuOpen(false); window.location.href = '/guide'; } },
                { label: 'FAQ', onClick: () => { setMobileMenuOpen(false); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); } },
              ].map(({ label, onClick }) => (
                <button key={label} onClick={onClick} className="text-xl font-semibold text-gray-200 hover:text-white transition-colors">
                  {label}
                </button>
              ))}
              <div className="w-full max-w-xs pt-4 border-t border-white/10 flex flex-col gap-3">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-3 rounded-xl border border-white/10 text-gray-200 font-semibold hover:bg-white/5 transition-colors">
                  Log in
                </Link>
                <Link to="/signup" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-3 rounded-xl glow-button text-white font-semibold">
                  Sign Up Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-12 text-center animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide mb-5 sm:mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          The future of collaborative development
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 sm:mb-5 leading-tight">
          Code together, <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
            in perfect sync.
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-6 sm:mb-8 leading-relaxed px-2">
          CodeSync is a real-time collaborative code editor with an integrated whiteboard, team chat, and live execution. Brainstorm, build, and run code instantly with your team.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fadeIn animate-delay-100">
          <Link to="/signup" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(99,102,241,0.6)] border border-white/10 flex items-center justify-center gap-2">
            Get Started <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </Link>
          <Link to="/login" className="w-full sm:w-auto metallic-panel shine-hover px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-lg text-white transition-all border border-white/10 flex items-center justify-center gap-2">
            Login to Workspace
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-6 sm:mt-8 animate-fadeIn animate-delay-200">
          {[
            { icon: Wifi, label: 'Real-time Coding', color: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/20' },
            { icon: PenTool, label: 'Live Whiteboard', color: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' },
            { icon: MessageSquare, label: 'Team Chat', color: 'text-pink-300 bg-pink-500/10 border-pink-500/20' },
            { icon: Sparkles, label: 'AI Assistant', color: 'text-amber-300 bg-amber-500/10 border-amber-500/20' },
            { icon: Play, label: 'Code Execution', color: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${color}`}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          ))}
        </div>
      </main>

      {/* Product Preview Mockup */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16 animate-fadeIn animate-delay-300">
        <div className="metallic-panel rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5 pointer-events-none"></div>

          {/* Mockup Tabs */}
          <div className="flex items-center border-b border-white/10 bg-black/20 overflow-x-auto">
            <div className="flex items-center gap-1.5 px-4 sm:px-5 py-3 sm:py-3.5 shrink-0">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-400"></div>
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-400"></div>
            </div>
            <div className="flex gap-1 sm:gap-1.5 text-xs font-medium px-2 overflow-x-auto">
              {[
                { id: 'code', icon: Code, label: 'Code' },
                { id: 'board', icon: PenTool, label: 'Board' },
                { id: 'chat', icon: MessageSquare, label: 'Chat' },
                { id: 'ai', icon: Sparkles, label: 'AI' },
                { id: 'output', icon: Terminal, label: 'Output' },
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setMockupTab(id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    mockupTab === id
                      ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/25 shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Mockup Content */}
          <div className="h-56 sm:h-64 md:h-72 overflow-hidden">
            {mockupContent[mockupTab]}
          </div>
        </div>
      </section>

      {/* Trust / Use-Case Strip */}
      <section data-reveal className="max-w-6xl mx-auto px-4 sm:px-6 mb-12 sm:mb-16">
        <p className="text-xs sm:text-sm text-gray-400 text-center mb-4 sm:mb-5 font-medium tracking-wide uppercase">Built for</p>
        <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
          {[
            { icon: Zap, label: 'Hackathon Teams' },
            { icon: Users, label: 'College Projects' },
            { icon: BookOpen, label: 'Peer Learning' },
            { icon: Monitor, label: 'Interview Practice' },
            { icon: GraduationCap, label: 'Classroom Demos' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/[0.04] border border-white/10 text-xs sm:text-sm text-gray-300 font-medium hover:bg-indigo-500/10 hover:border-indigo-500/30 hover:text-indigo-200 transition-all duration-300">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" data-reveal className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Everything you need to ship faster</h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">A unified workspace that brings your team and code together seamlessly.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
          {[
            { icon: Globe, label: 'Real-Time Sync', desc: 'See teammates\' cursors and edits with zero-latency collaboration.', color: 'blue', border: 'hover:border-blue-500/40', iconbg: 'bg-blue-500/10', iconcolor: 'text-blue-400', glow: 'group-hover:shadow-blue-500/10' },
            { icon: Code, label: 'Pro Editor', desc: 'Monaco-powered editing with syntax highlighting, auto-completion, and multi-language support.', color: 'purple', border: 'hover:border-purple-500/40', iconbg: 'bg-purple-500/10', iconcolor: 'text-purple-400', glow: 'group-hover:shadow-purple-500/10' },
            { icon: PenTool, label: 'Live Whiteboard', desc: 'Sketch architectures and draw flowcharts on an integrated collaborative canvas.', color: 'emerald', border: 'hover:border-emerald-500/40', iconbg: 'bg-emerald-500/10', iconcolor: 'text-emerald-400', glow: 'group-hover:shadow-emerald-500/10' },
            { icon: Play, label: 'Live Execution', desc: 'Compile and run code directly in the browser with real-time output feedback.', color: 'yellow', border: 'hover:border-yellow-500/40', iconbg: 'bg-yellow-500/10', iconcolor: 'text-yellow-400', glow: 'group-hover:shadow-yellow-500/10' },
            { icon: Users, label: 'Team Chat', desc: 'Integrated messaging with replies, editing, and emoji support right where the code lives.', color: 'pink', border: 'hover:border-pink-500/40', iconbg: 'bg-pink-500/10', iconcolor: 'text-pink-400', glow: 'group-hover:shadow-pink-500/10' },
            { icon: Shield, label: 'Secure Workspaces', desc: 'Password-protected rooms with admin controls for managing access and data.', color: 'cyan', border: 'hover:border-cyan-500/40', iconbg: 'bg-cyan-500/10', iconcolor: 'text-cyan-400', glow: 'group-hover:shadow-cyan-500/10' },
          ].map(({ icon: Icon, label, desc, border, iconbg, iconcolor, glow }) => (
            <div
              key={label}
               className={`group metallic-card p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl ${border}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}></div>
              <div className={`absolute -top-10 -right-10 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none ${iconbg}`}></div>
              <div className={`w-12 h-12 sm:w-14 sm:h-14 ${iconbg} rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 relative`}>
                <Icon className={`${iconcolor} w-6 h-6 sm:w-7 sm:h-7`} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white relative">{label}</h3>
              <p className="text-gray-400 text-sm sm:text-base leading-relaxed relative">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How CodeSync Works */}
      <section id="how-it-works" data-reveal className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">How CodeSync Works</h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">Get your team coding together in three simple steps.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
          {[
            { step: '01', icon: Plus, label: 'Create a workspace', desc: 'Generate a unique room ID, set an access code, and share it with your team.' },
            { step: '02', icon: UserPlusIcon, label: 'Invite your team', desc: 'Share the room ID and access code. Teammates join instantly — no account setup required.' },
            { step: '03', icon: Layout, label: 'Code, discuss, draw, run', desc: 'Edit code together, chat in real-time, sketch ideas, and execute code without leaving the browser.' },
          ].map(({ step, icon: Icon, label, desc }) => (
            <div key={step} className="relative group">
              <div className="metallic-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl">
                <div className="absolute -top-6 -right-6 text-6xl sm:text-7xl font-black text-white/[0.03] select-none pointer-events-none">{step}</div>
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/25 mb-5 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-7 h-7 text-indigo-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 relative">{label}</h3>
                <p className="text-gray-400 text-sm sm:text-base leading-relaxed relative">{desc}</p>
              </div>
              {step !== '03' && (
                <div className="hidden sm:flex absolute top-1/2 -right-4 sm:-right-5 transform -translate-y-1/2 z-10 text-indigo-400/40">
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" data-reveal className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">Everything you need to know about CodeSync.</p>
        </div>

        <div className="space-y-3">
          {FAQ_DATA.map(({ q, a }, i) => (
            <div key={i} className="metallic-panel rounded-2xl border border-white/10 overflow-hidden transition-all duration-300">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-5 sm:px-6 py-4 sm:py-5 text-left transition-colors hover:bg-white/[0.02]"
              >
                <span className="text-sm sm:text-base font-semibold text-white">{q}</span>
                <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              <div className="grid transition-[grid-template-rows] duration-300" style={{ gridTemplateRows: openFaq === i ? '1fr' : '0fr' }}>
                <div className="overflow-hidden min-h-0">
                  <p className="px-5 sm:px-6 pb-4 sm:pb-5 text-sm sm:text-base text-gray-400 leading-relaxed">{a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section data-reveal className="max-w-4xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="metallic-panel rounded-3xl sm:rounded-[2.5rem] border border-white/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-emerald-500/10 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"></div>
          <div className="relative p-8 sm:p-12 md:p-16 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-5 sm:mb-6 border border-indigo-500/20">
              <Code className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-300" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">Ready to code together?</h2>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-8 sm:mb-10">Create a collaborative workspace and start building with your team.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/signup" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(99,102,241,0.6)] border border-white/10 flex items-center justify-center gap-2">
                Get Started <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <Link to="/login" className="w-full sm:w-auto metallic-panel shine-hover px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-lg text-white transition-all border border-white/10 flex items-center justify-center gap-2">
                Login to Workspace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="metallic-panel border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
                <Code className="text-indigo-400 w-5 h-5" />
              </div>
              <div>
                <span className="font-bold tracking-wide text-gray-200 text-sm sm:text-base">CodeSync</span>
                <p className="text-[10px] sm:text-xs text-gray-500 max-w-[240px] sm:max-w-none">Built for collaborative coding, team discussions, and real-time problem solving.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-400">
              <Link to="/guide" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Guide
              </Link>
              <a href="https://github.com/santhoshraj706/CodeSync" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                <GitBranch className="w-4 h-4" /> GitHub
              </a>
              <a href="https://santhoshrajt-portfolio.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5" /> Portfolio
              </a>
              <a href="mailto:santhoshrajtce@gmail.com" className="hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" /> Contact
              </a>
            </div>
          </div>
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] sm:text-xs text-gray-500">
              &copy; {new Date().getFullYear()} CodeSync. Built by Santhosh Raj T.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const UserPlusIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

export default Landing;
