import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import NeonWireframeBackground from '../components/NeonWireframeBackground';
import {
  Code, Users, PenTool, Sparkles, MessageSquare, Terminal, Play,
  Shield, BookOpen, GraduationCap, Monitor, Zap, ChevronRight,
  ArrowRight, ExternalLink, GitBranch, Check, Star, Layout,
  Plus, FileText, ListTodo, Brain, Key, Globe, Camera,
  ChevronDown, Menu, X, Wifi, HelpCircle, Lightbulb, Workflow,
  ClipboardList, Target, GitBranch as GitBranchIcon,
  Phone, MessageCircle, Bell, AlertTriangle, RefreshCw,
} from 'lucide-react';

const RocketIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);

const GUIDE_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: RocketIcon,
    color: 'from-indigo-500 to-purple-600',
    content: 'Create a free account or log in. Complete your profile with full name, username, college name, and experience level. Go to the dashboard to create or join a workspace. Share the workspace ID and access code with your team.',
    steps: [
      'Sign up or log in',
      'Update your profile',
      'Create or join a workspace',
      'Invite your team',
      'Start collaborating',
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard Guide',
    icon: Layout,
    color: 'from-emerald-500 to-teal-600',
    content: 'The dashboard helps you create rooms, join existing rooms, manage recent workspaces, pin important rooms, and quickly return to active sessions.',
    details: [
      'Create Workspace — Generate a room ID and set an access password',
      'Join Workspace — Enter a room ID and password to join your team',
      'Recent Workspaces — Filterable list with search, status badges, and relative timestamps',
      'Pinned Workspaces — Star important rooms for quick access',
      'Quick Actions — Open latest workspace, copy room ID, generate random ID',
      'Templates — Quick-start templates for Blank, DSA Practice, Web Project, Interview Prep',
      'Find Users — Quick link to Discover page to search and connect with other developers',
      'Profile Button — Access your profile settings from the dashboard header',
    ],
  },
  {
    id: 'workspace',
    title: 'Inside the Workspace',
    icon: Globe,
    color: 'from-cyan-500 to-blue-600',
    content: 'Each room is designed for real-time teamwork, so everyone can code, discuss, draw, test, document, and talk in one place.',
    details: [
      'Team panel on the left — see who\'s online, their profiles, and editing status',
      'Code editor in the center — the main collaborative coding area',
      'Chat / Notes tabs on the right — discuss and document your work',
      'Terminal and test output at the bottom — run code and view results',
      'Whiteboard tab for visual explanation — sketch architectures and flowcharts',
      'Voice call button — start or join a room-wide voice channel',
    ],
  },
  {
    id: 'editor',
    title: 'Collaborative Code Editor',
    icon: Code,
    color: 'from-purple-500 to-pink-600',
    content: 'Professional Monaco-powered code editor with real-time sync. See teammates\' cursors, selections, and changes as they happen.',
    details: [
      'Multi-language support: JavaScript, Python, Java, C++, C',
      'Real-time code sync with live cursors and presence indicators',
      'Run code directly in the browser with real-time stdout/stderr output',
      'Format document with Shift+Alt+F',
      'Download code with Ctrl+S',
      'Adjustable font size with +/- controls',
      'Presenter mode — one user presents, others follow their cursor',
    ],
    shortcuts: [
      { keys: 'Ctrl + Enter', desc: 'Run Code' },
      { keys: 'Ctrl + S', desc: 'Download Code' },
      { keys: 'Shift + Alt + F', desc: 'Format Document' },
      { keys: 'Ctrl + /', desc: 'Toggle Shortcuts' },
    ],
  },
  {
    id: 'chat',
    title: 'Team Chat',
    icon: MessageSquare,
    color: 'from-pink-500 to-rose-600',
    content: 'Communicate without leaving the workspace.',
    details: [
      'Send real-time messages to your team',
      'Reply to specific messages with threaded context previews',
      'Edit messages to fix typos (shows an edited tag)',
      'Delete your own messages; admins can delete any message',
      'Search messages by keyword or username',
      'Export chat transcripts for later reference',
      'Use the emoji picker for richer communication',
      'Summarize the entire chat using AI',
    ],
  },
  {
    id: 'session-notes',
    title: 'Session Notes',
    icon: FileText,
    color: 'from-amber-500 to-orange-600',
    content: 'Use Session Notes before starting work so your team knows the aim, task split, expected result, and pending work. This prevents the classic group-project disaster where everyone says they are working but nobody knows on what.',
    details: [
      'Aim / Objective — What is the main goal of this session?',
      'Meeting Agenda — List topics to cover in order',
      'Tasks — Add tasks with Todo / Doing / Done status',
      'Expected Result — What outcome do you expect?',
      'Decisions Taken — Record key decisions made',
      'Pending Work / Next Steps — What still needs to be done?',
      'Assign tasks to team members using the Assigned To field',
      'Export notes as Markdown for documentation',
      'Reset notes with confirmation when starting fresh',
    ],
  },
  {
    id: 'whiteboard',
    title: 'Whiteboard',
    icon: PenTool,
    color: 'from-emerald-500 to-green-600',
    content: 'Visualize ideas, draw system architectures, flowcharts, and explain algorithms visually.',
    details: [
      'Draw and design collaboratively in real-time',
      'Add sticky notes with text annotations',
      'Choose from multiple preset colors with tooltip names',
      'Toggle grid overlay for alignment',
      'Clear canvas with confirmation to prevent accidental data loss',
      'Whiteboard state persists across sessions',
    ],
  },
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    icon: Sparkles,
    color: 'from-amber-500 to-yellow-600',
    content: 'Get help from the AI assistant for code review, explanations, bug fixes, and more.',
    details: [
      'Chat — Ask questions about your code, logic, or algorithms',
      'Explain — Let AI break down complex code instantly',
      'Fix Code — AI identifies and resolves syntax or logical errors',
      'Generate — Describe what you need and AI writes the code',
      'Summary — Get an AI summary of your team chat',
    ],
    quickActions: ['Chat', 'Explain', 'Fix Code', 'Generate', 'Summary'],
  },
  {
    id: 'test-runner',
    title: 'Test Runner & Terminal',
    icon: Terminal,
    color: 'from-slate-500 to-slate-700',
    content: 'Run code using the built-in execution engine, view output, and manage test cases.',
    details: [
      'Run code directly in the browser (powered by Judge0)',
      'View stdout, stderr, and compile output in the terminal panel',
      'Add custom test cases with input/output pairs',
      'Run all test cases and see pass/fail results',
      'View run history with timestamps',
      'Use stdin input for interactive programs',
    ],
  },
  {
    id: 'inline-comments',
    title: 'Inline Code Comments',
    icon: MessageSquare,
    color: 'from-violet-500 to-purple-600',
    content: 'Discuss code directly on specific lines.',
    details: [
      'Add comments on specific lines of code',
      'Reply to comment threads for discussion',
      'Resolve comments when the discussion is complete',
      'Use comments for code review and pair programming explanations',
    ],
  },
  {
    id: 'presenter-mode',
    title: 'Presenter Mode',
    icon: Monitor,
    color: 'from-red-500 to-rose-600',
    content: 'One user can present while others follow along in real-time.',
    details: [
      'Click Present to start showing your cursor and edits to everyone',
      'Others see "Following" status and your cursor movements',
      'Useful for teaching, code walkthroughs, and presentations',
      'The presenter can stop at any time',
    ],
  },
  {
    id: 'direct-messaging',
    title: 'Direct Messaging',
    icon: MessageCircle,
    color: 'from-indigo-500 to-blue-600',
    content: 'CodeSync includes a full direct messaging system. You can discover other users, send connection requests, and exchange private messages.',
    details: [
      'Discover Users — Go to the Discover page from the dashboard or Messages page and search by name, username, or college',
      'Send Chat Request — Click "Send Request" on a user\'s profile card to request a conversation',
      'Accept / Decline — Incoming requests appear in the Messages page; accept to start chatting or decline to ignore',
      'Direct Messages — Once accepted, send real-time private messages with emoji picker and threaded replies',
      'View Profile — Click on any user in a conversation to see their full profile in a side drawer',
      'Online Status — Green dot indicators show who is currently online',
      'Block / Unblock — Block users to stop receiving messages and calls; unblock anytime',
    ],
  },
  {
    id: 'room-invites',
    title: 'Room Invites',
    icon: Bell,
    color: 'from-teal-500 to-cyan-600',
    content: 'Invite connected users to join your workspace rooms directly from the Messages page.',
    details: [
      'Send Invite — From any DM conversation, click the invite button to send a room invite to that user',
      'Choose Room — Select which of your rooms to invite them to',
      'Accept / Decline — Recipients see incoming invites with room ID and details; accept to join or decline',
      'Track Sent Invites — View pending, accepted, and declined invites in the Messages page',
      'Cancel Invite — Revoke a pending invite if needed',
    ],
  },
  {
    id: 'voice-calls',
    title: 'Voice Calls (Agora)',
    icon: Phone,
    color: 'from-emerald-500 to-teal-600',
    content: 'CodeSync supports two types of voice calls powered by Agora RTC: direct 1-on-1 audio calls and multi-participant room voice channels.',
    details: [
      'Direct Audio Call — From any DM conversation, click the phone icon to start a direct audio call',
      'Incoming Notification — When someone calls you, a full-screen modal appears with caller info, accept/decline buttons, and a 30-second countdown',
      'Outgoing Status — While calling, see ringing, timeout, rejected, or unavailable status',
      'Mute / Unmute — Toggle your microphone on or off during any call',
      'Room Voice Call — Inside a workspace, click "Start Room Call" to create a voice channel; others can click "Join" to participate',
      'Multi-participant — Room calls support multiple users simultaneously, showing participant count',
      'End-to-end encryption — All audio streams are encrypted via Agora RTC',
      'Mic Permission — If microphone access is denied, a clear error message appears with a retry button',
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: HelpCircle,
    color: 'from-slate-500 to-slate-700',
    content: 'Common issues and how to resolve them.',
    details: [
      'Voice call won\'t connect — Ensure microphone permissions are granted in your browser settings. Check that Agora credentials are correctly configured in both server and client .env files.',
      'Chat request not going through — The user may have blocked you or already has a pending request from you. Check your outgoing requests list.',
      'Can\'t join a room — Verify the room ID and access code are correct. The room may have been deleted by the admin.',
      'AI Assistant not responding — Check that your Gemini API key is valid and has not exceeded rate limits.',
      'Code execution fails — Ensure Judge0 API key is active. Some languages may not be supported depending on your plan.',
      'Whiteboard not syncing — Try refreshing the page. Whiteboard data is persisted, so no strokes will be lost.',
      'Notifications not showing — Ensure your browser allows notifications for the site. Sound notifications can be toggled in the chat panel.',
    ],
  },
];

const FAQ_DATA = [
  {
    q: 'What is CodeSync?',
    a: 'CodeSync is a real-time collaborative coding workspace where teams can code, chat, draw, run programs, use AI, make voice calls, send direct messages, and maintain session notes together.',
  },
  {
    q: 'Can multiple users code at the same time?',
    a: 'Yes. CodeSync uses real-time sync so teammates can edit and view changes instantly. You will see each other\'s cursors, selections, and edits as they happen.',
  },
  {
    q: 'Does CodeSync support code execution?',
    a: 'Yes. You can run supported languages (JavaScript, Python, Java, C++, C) directly in the browser using the integrated execution system powered by Judge0.',
  },
  {
    q: 'Can I use CodeSync for project discussions?',
    a: 'Yes. Use the team chat for messaging, the whiteboard for sketching ideas, session notes to plan, direct messages for private conversations, and voice calls for real-time discussion.',
  },
  {
    q: 'Can AI help me understand code?',
    a: 'Yes. The AI assistant can explain complex code, find bugs, generate new code from descriptions, and summarize team discussions.',
  },
  {
    q: 'Can I make voice calls in CodeSync?',
    a: 'Yes. You can start direct audio calls with any connected user from the Messages page, or start/join a multi-participant voice channel inside any workspace room. Powered by Agora RTC.',
  },
  {
    q: 'How do I send a direct message?',
    a: 'Go to the Discover page, search for a user by name or username, send a chat request, and once accepted you can exchange private messages with emoji and reply support.',
  },
  {
    q: 'Are session notes saved?',
    a: 'Yes, session notes are saved to the database and synced in real-time to all room members. You can also export them as Markdown files.',
  },
  {
    q: 'Can I use CodeSync on mobile?',
    a: 'Yes, the interface is responsive with mobile-friendly bottom tab navigation for Team, Work, Chat, and Notes panels.',
  },
];

const Guide = () => {
  const [openFaq, setOpenFaq] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 120;
      let current = null;
      for (const section of GUIDE_SECTIONS) {
        const el = document.getElementById(section.id);
        if (el && el.offsetTop <= scrollPos) {
          current = section.id;
        }
      }
      setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen aurora-bg text-white font-sans selection:bg-indigo-500/30">
      <NeonWireframeBackground intensity="subtle" />
      <div className="grid-overlay"></div>

      {/* Sticky Navbar */}
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
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <div className="relative group">
              <button className="hover:text-white transition-colors flex items-center gap-1">
                Guide <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#0b0e1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2 max-h-80 overflow-y-auto custom-scrollbar">
                {GUIDE_SECTIONS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollToSection(s.id)}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:text-white hover:bg-white/[0.04] transition-all flex items-center gap-2.5"
                  >
                    <s.icon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    {s.title}
                  </button>
                ))}
              </div>
            </div>
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

        {/* Mobile Menu */}
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
            <div className="flex-1 flex flex-col items-center justify-start gap-1 px-4 pt-8 overflow-y-auto">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-3 text-lg font-semibold text-gray-200 hover:text-white transition-colors">
                Home
              </Link>
              <p className="w-full text-center text-[10px] text-slate-600 uppercase tracking-widest pt-4 pb-2 font-bold">Guide Sections</p>
              {GUIDE_SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => scrollToSection(s.id)}
                  className="w-full text-center py-2.5 text-sm text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  <s.icon className="w-3.5 h-3.5 text-indigo-400" />
                  {s.title}
                </button>
              ))}
              <div className="w-full max-w-xs pt-6 mt-4 border-t border-white/10 flex flex-col gap-3">
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
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12 sm:pb-16 text-center animate-fadeIn">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide mb-5 sm:mb-6">
          <BookOpen className="w-3.5 h-3.5" />
          Complete Documentation
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4 sm:mb-5 leading-tight">
          CodeSync{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">
            User Guide
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-8 sm:mb-10 leading-relaxed px-2">
          Learn how to create workspaces, collaborate with your team, write code together, use AI, make voice calls, send direct messages, manage session notes, run tests, and explain ideas visually.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <Link to="/signup" className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(99,102,241,0.6)] border border-white/10 flex items-center justify-center gap-2">
            Start Coding <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </Link>
          <Link to="/" className="w-full sm:w-auto metallic-panel shine-hover px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm sm:text-lg text-white transition-all border border-white/10 flex items-center justify-center gap-2">
            Back to Home <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>
      </section>

      {/* Quick Overview Cards */}
      <section data-reveal className="max-w-6xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {GUIDE_SECTIONS.slice(0, 10).map(s => {
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className="metallic-card p-4 sm:p-5 rounded-2xl text-center"
              >
                <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <p className="text-[10px] sm:text-xs font-semibold text-gray-300 leading-tight">{s.title}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Content Timeline */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        {GUIDE_SECTIONS.map((section, idx) => {
          const Icon = section.icon;
          return (
            <section
              key={section.id}
              id={section.id}
              data-reveal
              className="mb-12 sm:mb-16 last:mb-0"
            >
              <div className="flex items-start gap-4 sm:gap-6">
                {/* Timeline number */}
                <div className="hidden sm:flex flex-col items-center shrink-0">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  {idx < GUIDE_SECTIONS.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[40px] bg-gradient-to-b from-indigo-500/30 to-transparent mt-2" />
                  )}
                </div>

                {/* Content card */}
                <div className="flex-1 min-w-0">
                  <div className="metallic-panel rounded-2xl sm:rounded-3xl border border-white/10 overflow-hidden">
                    <div className={`h-1 w-full bg-gradient-to-r ${section.color}`} />
                    <div className="p-5 sm:p-8">
                      {/* Mobile icon + title row */}
                      <div className="flex items-center gap-3 mb-4 sm:hidden">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-lg font-bold text-white">{section.title}</h2>
                      </div>

                      <h2 className="hidden sm:block text-xl sm:text-2xl font-bold text-white mb-3">{section.title}</h2>
                      <p className="text-sm sm:text-base text-gray-300 leading-relaxed mb-5">{section.content}</p>

                      {section.steps && (
                        <div className="space-y-2.5 mb-4">
                          {section.steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm text-gray-300">
                              <div className="w-6 h-6 rounded-full bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                                {i + 1}
                              </div>
                              {step}
                            </div>
                          ))}
                        </div>
                      )}

                      {section.details && (
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {section.details.map((d, i) => (
                            <div key={i} className="flex items-start gap-2.5 text-sm text-gray-300 bg-white/[0.02] rounded-xl px-4 py-3 border border-white/[0.04]">
                              <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                              <span>{d}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {section.shortcuts && (
                        <div className="mt-5 bg-black/30 rounded-xl border border-white/[0.06] p-4">
                          <p className="text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <KeyboardIcon className="w-3.5 h-3.5" /> Keyboard Shortcuts
                          </p>
                          <div className="space-y-2">
                            {section.shortcuts.map((s, i) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-gray-400">{s.desc}</span>
                                <span className="font-mono bg-slate-800 text-slate-200 px-2 py-1 rounded-lg border border-slate-700 text-[10px] font-semibold">{s.keys}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.quickActions && (
                        <div className="mt-5 flex flex-wrap gap-2">
                          {section.quickActions.map((a, i) => (
                            <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                              {a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* Best Workflow */}
      <section data-reveal className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Recommended Workflow</h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">A proven workflow to get the most out of CodeSync sessions.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { step: '01', icon: Plus, label: 'Create workspace', desc: 'Set up a room with a unique ID and password.' },
            { step: '02', icon: FileText, label: 'Add session notes', desc: 'Define the aim, agenda, and split tasks.' },
            { step: '03', icon: ListTodo, label: 'Assign tasks', desc: 'Assign todo items to team members.' },
            { step: '04', icon: MessageSquare, label: 'Discuss in chat', desc: 'Talk through the approach with your team.' },
            { step: '05', icon: PenTool, label: 'Draw on whiteboard', desc: 'Sketch architecture and flowcharts.' },
            { step: '06', icon: Code, label: 'Write code together', desc: 'Collaborate on the code in real-time.' },
            { step: '07', icon: Play, label: 'Test and execute', desc: 'Run tests and execute code to validate.' },
            { step: '08', icon: Sparkles, label: 'Use AI assistant', desc: 'Get help with explanations and fixes.' },
            { step: '09', icon: Phone, label: 'Talk via voice call', desc: 'Jump on a call when real-time discussion is faster.' },
            { step: '10', icon: Download, label: 'Export everything', desc: 'Save notes, chat, and code as files.' },
          ].map(({ step, icon: Icon, label, desc }) => (
            <div key={step} className="metallic-card p-4 sm:p-5 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/25 flex items-center justify-center text-xs font-bold text-indigo-300 group-hover:scale-110 transition-transform">
                  {step}
                </div>
                <Icon className="w-4 h-4 text-indigo-400 shrink-0" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">{label}</h3>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Use Cases */}
      <section data-reveal className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Use Cases</h2>
          <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">CodeSync is built for teams, classrooms, and individuals.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[
            { icon: Zap, label: 'Hackathon Teams', desc: 'Build projects at lightning speed with real-time collaboration, integrated chat, voice calls, and instant code execution.' },
            { icon: Users, label: 'College Project Groups', desc: 'Coordinate group projects with session notes, task assignment, direct messaging, and collaborative editing.' },
            { icon: Monitor, label: 'Coding Interviews', desc: 'Conduct live coding interviews with whiteboard support, voice calls, and real-time code review.' },
            { icon: BookOpen, label: 'Peer Learning', desc: 'Learn together by pair programming, explaining code with AI, discussing in chat, and jumping on voice calls.' },
            { icon: GraduationCap, label: 'Classroom Demos', desc: 'Teachers can present code, share whiteboard diagrams, lead voice discussions, and interact with students in real-time.' },
            { icon: Lightbulb, label: 'Algorithm Sessions', desc: 'Visualize algorithms on the whiteboard while coding, testing, and discussing them via voice or chat.' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="metallic-card p-5 sm:p-6 rounded-2xl sm:rounded-3xl">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/25 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-2">{label}</h3>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section data-reveal className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h2>
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
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4">Ready to collaborate better?</h2>
            <p className="text-gray-400 text-sm sm:text-base md:text-lg max-w-xl mx-auto mb-8 sm:mb-10">Create a workspace, invite your team, and start coding with chat, notes, AI, voice calls, direct messaging, whiteboard, and live execution.</p>
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

const KeyboardIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M6 8h.01" /><path d="M10 8h.01" /><path d="M14 8h.01" /><path d="M18 8h.01" />
    <path d="M8 12h.01" /><path d="M12 12h.01" /><path d="M16 12h.01" />
    <path d="M7 16h10" />
  </svg>
);

const Download = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

export default Guide;
