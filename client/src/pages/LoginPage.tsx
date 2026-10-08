import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  User as UserIcon, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Marquee } from '../components/ui/marquee';

interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  content: string;
  tag: string;
}

const testimonialsRow1: Testimonial[] = [
  {
    name: 'Alex Rivera',
    role: 'Senior Software Engineer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    content: 'Nexora resolved my payroll discrepancy in 30 seconds with automated evidence logging and instant manager notification.',
    tag: 'Payroll',
  },
  {
    name: 'Sarah Chen',
    role: 'Engineering Manager',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
    content: 'The proactive coverage analysis makes approving team leaves effortless, preventing project delays before they happen.',
    tag: 'Leave Hub',
  },
  {
    name: 'Marcus Wright',
    role: 'Platform Architect & Admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    content: 'Tamper-evident audit logs and strict role-based access make SOC2 and enterprise compliance completely seamless.',
    tag: 'Security & Audit',
  },
  {
    name: 'Chloe Bennett',
    role: 'Staff Product Designer',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120',
    content: 'Single entry point for workplace operations completely eliminated friction between HR, IT, and daily engineering work.',
    tag: 'Coordination',
  },
];

const testimonialsRow2: Testimonial[] = [
  {
    name: 'David Vance',
    role: 'VP of Engineering',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120',
    content: 'Objective AI fairness evaluations and grounded citations give leadership complete confidence in workplace decisions.',
    tag: 'Fairness & Review',
  },
  {
    name: 'Elena Rostova',
    role: 'Director of People Operations',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120',
    content: 'Handling sensitive workplace grievances with guaranteed zero retaliation leaks has deeply strengthened our culture.',
    tag: 'Confidential HR',
  },
  {
    name: 'Liam Davies',
    role: 'Site Reliability Engineer',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=120',
    content: 'Automated SLA tracking ensured my hardware replacement was processed in 4 hours rather than waiting two weeks.',
    tag: 'IT Support',
  },
  {
    name: 'Priya Sharma',
    role: 'Head of People Partnering',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120',
    content: 'The policy assistant cites exact sections from official documentation—no more digging through 50-page PDFs.',
    tag: 'Policy QA',
  },
];

const testimonialsRow3: Testimonial[] = [
  {
    name: 'Jordan Taylor',
    role: 'Customer Success Lead',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
    content: 'The 1-click reconsideration mechanism gave me a transparent, objective second review without awkward escalations.',
    tag: 'Reconsideration',
  },
  {
    name: 'Carlos Mendez',
    role: 'Facilities Coordinator',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120',
    content: 'Automated vendor quotes and ergonomic tracking simplified facilities support across our hybrid global offices.',
    tag: 'Facilities',
  },
  {
    name: 'Nina Patel',
    role: 'People Analytics Lead',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=120',
    content: 'Real-time HR analytics gave us a 92% SLA resolution rate and identified staffing bottlenecks before crunch time.',
    tag: 'Analytics',
  },
  {
    name: 'Samuel Ross',
    role: 'VP of Business Operations',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120',
    content: 'Employee satisfaction scores increased by 40% after transitioning to Nexora as our workplace intelligence layer.',
    tag: 'Operations',
  },
];

const testimonialsRow4: Testimonial[] = [
  {
    name: 'Ethan Walker',
    role: 'Frontend Architect',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120',
    content: 'No more confusing Slack DMs or lost email threads. Everything lives in one transparent, unified workplace record.',
    tag: 'Productivity',
  },
  {
    name: 'Grace Hopper',
    role: 'Chief People Officer',
    avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=120',
    content: 'The AI employee advocate ensures organizational fairness while honoring company operating guidelines.',
    tag: 'Executive',
  },
  {
    name: 'Lucas Vance',
    role: 'Cloud Operations Lead',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120',
    content: 'Google Sign-In and Cloud Firestore sync are rock-solid, giving us real-time state across every workplace terminal.',
    tag: 'Cloud & Auth',
  },
  {
    name: 'Hannah Abbott',
    role: 'Senior Finance Analyst',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120',
    content: 'Expense inquiries and reimbursement escalations are categorized accurately with zero human triage overhead.',
    tag: 'Finance',
  },
];

const TestimonialCard: React.FC<Testimonial> = ({ name, role, avatar, content, tag }) => (
  <div className="w-[310px] shrink-0 rounded-2xl bg-white/90 backdrop-blur-xs border border-[#BDC3C7] p-3.5 shadow-sm space-y-2 select-none hover:border-[#34495E] transition-colors">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <img
          src={avatar}
          alt={name}
          className="w-8 h-8 rounded-full object-cover border border-[#BDC3C7] shrink-0"
        />
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#2C3E50] truncate">{name}</div>
          <div className="text-[10px] text-[#7F8C8D] truncate">{role}</div>
        </div>
      </div>
      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#ECF0F1] text-[#2C3E50] border border-[#BDC3C7] shrink-0">
        {tag}
      </span>
    </div>
    <p className="text-[11px] text-[#34495E] leading-relaxed line-clamp-2">
      "{content}"
    </p>
    <div className="flex items-center justify-between pt-1 border-t border-[#BDC3C7]/40 text-[10px] text-[#7F8C8D]">
      <span className="text-amber-500 tracking-widest text-xs">★★★★★</span>
      <span>Verified Employee</span>
    </div>
  </div>
);

export const LoginPage: React.FC = () => {
  const { login, loginWithGoogle, signUpWithEmail, switchUser, demoUsers, isFirebaseActive } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('alex.rivera@nexora.internal');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fallbackDemoList = [
    { email: 'alex.rivera@nexora.internal', name: 'Alex Rivera', role: 'Employee', title: 'Senior Software Engineer' },
    { email: 'sarah.chen@nexora.internal', name: 'Sarah Chen', role: 'Manager', title: 'Engineering Manager' },
    { email: 'david.vance@nexora.internal', name: 'David Vance', role: 'Skip-Level VP', title: 'VP of Engineering' },
    { email: 'elena.rostova@nexora.internal', name: 'Elena Rostova', role: 'HR Director', title: 'Director of People' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      if (mode === 'signup') {
        if (!fullName.trim()) throw new Error('Please enter your full name.');
        await signUpWithEmail(email, password, fullName.trim());
        setSuccessMsg('Account created successfully!');
      } else {
        await login(email, password);
        setSuccessMsg('Signed in successfully!');
      }
      setTimeout(() => navigate('/'), 300);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await loginWithGoogle();
      setSuccessMsg('Signed in with Google!');
      setTimeout(() => navigate('/'), 300);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setErrorMsg(err.message || 'Google sign-in failed. Please verify your Firebase configuration.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoSelect = async (targetEmail: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await switchUser(targetEmail);
      navigate('/');
    } catch (err: any) {
      setErrorMsg('Failed to select demo persona.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#ECF0F1] flex items-center justify-center p-4 overflow-hidden selection:bg-[#BDC3C7]">
      
      {/* ========================================================================= */}
      {/* 3D TESTIMONIAL MARQUEE RUNNING BEHIND (BACKGROUND OVERLAY LAYER) */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        {/* Angled 3D Isometric / Perspective Container */}
        <div 
          className="flex flex-col gap-3.5 w-[160vw] max-w-none transform origin-center opacity-45"
          style={{
            transform: 'perspective(1200px) rotateX(16deg) rotateY(-8deg) rotateZ(-12deg) scale(1.08)',
          }}
        >
          {/* Row 1: Forward Marquee */}
          <Marquee repeat={3} pauseOnHover={false} className="[--duration:36s] [--gap:1.2rem]">
            {testimonialsRow1.map((item, idx) => (
              <TestimonialCard key={`r1-${idx}`} {...item} />
            ))}
          </Marquee>

          {/* Row 2: Reverse Marquee */}
          <Marquee reverse repeat={3} pauseOnHover={false} className="[--duration:44s] [--gap:1.2rem]">
            {testimonialsRow2.map((item, idx) => (
              <TestimonialCard key={`r2-${idx}`} {...item} />
            ))}
          </Marquee>

          {/* Row 3: Forward Marquee */}
          <Marquee repeat={3} pauseOnHover={false} className="[--duration:38s] [--gap:1.2rem]">
            {testimonialsRow3.map((item, idx) => (
              <TestimonialCard key={`r3-${idx}`} {...item} />
            ))}
          </Marquee>

          {/* Row 4: Reverse Marquee */}
          <Marquee reverse repeat={3} pauseOnHover={false} className="[--duration:48s] [--gap:1.2rem]">
            {testimonialsRow4.map((item, idx) => (
              <TestimonialCard key={`r4-${idx}`} {...item} />
            ))}
          </Marquee>
        </div>

        {/* Soft Radial & Edge Gradients for Depth & Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#ECF0F1] via-[#ECF0F1]/30 to-[#ECF0F1]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#ECF0F1]/80 via-transparent to-[#ECF0F1]/80" />
      </div>

      {/* ========================================================================= */}
      {/* TOP LAYER: CRISP WHITE/FROSTED LOGIN CARD */}
      {/* ========================================================================= */}
      <div className="relative z-20 w-full max-w-md bg-white/95 backdrop-blur-md border border-[#BDC3C7] rounded-2xl p-6 sm:p-8 shadow-[0_16px_50px_rgba(44,62,80,0.12)] space-y-4.5 my-8">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#2C3E50] mx-auto flex items-center justify-center text-white font-black text-xl shadow-sm border border-[#34495E]">
            <Sparkles className="w-6 h-6 text-[#ECF0F1]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#2C3E50] tracking-tight">Nexora Workplace AI</h1>
            <p className="text-xs text-[#7F8C8D] mt-0.5">Employee-First Operations & Coordination Platform</p>
          </div>
        </div>

        {/* Live Firebase Connection Badge */}
        <div className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
          isFirebaseActive 
            ? 'bg-[#E8F7F0] border-[#BCE7D3] text-[#138A5B]' 
            : 'bg-[#F4F6F7] border-[#BDC3C7] text-[#7F8C8D]'
        }`}>
          <div className="flex items-center gap-2">
            {isFirebaseActive ? (
              <CheckCircle2 className="w-4 h-4 text-[#138A5B] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-[#7F8C8D] shrink-0" />
            )}
            <span className="font-medium text-[11px]">
              {isFirebaseActive 
                ? 'Firebase Auth & Cloud Firestore Connected' 
                : 'Local Mode Active'}
            </span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-white/80 border border-current">
            {isFirebaseActive ? 'one7-001' : 'Local'}
          </span>
        </div>

        {/* Status Feedback Messages */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-[#FFF0F1] border border-[#FCD3D7] text-xs text-[#C83D4B] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-lg bg-[#E8F7F0] border border-[#BCE7D3] text-xs text-[#138A5B] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#BDC3C7] hover:bg-[#ECF0F1] text-[#2C3E50] text-xs font-semibold transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-50"
        >
          {/* Official Google G Logo */}
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-3">
          <div className="border-t border-[#BDC3C7]/70 w-full" />
          <span className="bg-white px-3 text-[10px] uppercase font-bold text-[#7F8C8D] absolute tracking-wider">
            or with work email
          </span>
        </div>

        {/* Mode Selector Tabs (Sign In vs Create Account) */}
        <div className="flex rounded-xl bg-[#ECF0F1] p-1 text-xs">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              mode === 'signin' 
                ? 'bg-white text-[#2C3E50] shadow-xs' 
                : 'text-[#7F8C8D] hover:text-[#2C3E50]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
              mode === 'signup' 
                ? 'bg-white text-[#2C3E50] shadow-xs' 
                : 'text-[#7F8C8D] hover:text-[#2C3E50]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#2C3E50] mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#7F8C8D] absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-white border border-[#BDC3C7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2C3E50] focus:outline-none focus:border-[#2C3E50] placeholder:text-[#7F8C8D]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-[#2C3E50] mb-1">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#7F8C8D] absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-white border border-[#BDC3C7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2C3E50] focus:outline-none focus:border-[#2C3E50] placeholder:text-[#7F8C8D]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-[#2C3E50]">Password</label>
              {mode === 'signin' && (
                <span className="text-[10px] text-[#7F8C8D]">Demo pass: password123</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#7F8C8D] absolute left-3 top-2.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-[#BDC3C7] rounded-xl pl-9 pr-9 py-2 text-xs text-[#2C3E50] focus:outline-none focus:border-[#2C3E50] placeholder:text-[#7F8C8D]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[#7F8C8D] hover:text-[#2C3E50] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2.5 rounded-xl bg-[#2C3E50] hover:bg-[#34495E] text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-1 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>{mode === 'signin' ? 'Sign In to Workspace' : 'Create Workplace Account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Demo Personas for Quick Access */}
        <div className="pt-3 border-t border-[#BDC3C7]/60 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-[#2C3E50] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#7F8C8D]" />
              Quick Demo Personas:
            </span>
            <span className="text-[10px] text-[#7F8C8D]">1-click login</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(demoUsers && demoUsers.length > 0 ? demoUsers.slice(0, 4) : fallbackDemoList).map((u: any) => {
              const name = u.fullName || u.full_name || u.name || (u.email ? u.email.split('@')[0] : 'User');
              const role = (u.role || 'EMPLOYEE').toUpperCase();
              return (
                <button
                  key={u.id || u.email}
                  type="button"
                  onClick={() => handleDemoSelect(u.email)}
                  disabled={loading}
                  className="p-2 rounded-xl bg-[#ECF0F1] hover:bg-[#BDC3C7]/40 text-left border border-[#BDC3C7] transition-all flex flex-col cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-[11px] text-[#2C3E50] group-hover:text-black truncate">
                      {name}
                    </span>
                    <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-white text-[#2C3E50] font-bold border border-[#BDC3C7]">
                      {role === 'EMPLOYEE' ? 'Emp' : role === 'MANAGER' ? 'Mgr' : role === 'SKIP_LEVEL_MANAGER' ? 'VP' : 'HR'}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#7F8C8D] truncate mt-0.5">
                    {u.jobTitle || u.job_title || u.title || u.email}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-1 text-center text-[10px] text-[#7F8C8D] flex items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#2C3E50]" /> Enterprise Grade
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#2C3E50]" /> Cloud Firestore
          </span>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
