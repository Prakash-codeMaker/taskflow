import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2, CheckSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

const FEATURES = [
  'AI-powered task suggestions',
  'Real-time collaboration',
  'Smart prioritization engine',
  'Analytics & productivity insights',
];

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [errors, setErrors]   = useState({});

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Required';
    if (!form.password) e.password = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form);
      toast.success('Welcome back');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-ink">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-ink dark:bg-ink-secondary flex-col justify-between p-12">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent-900 via-ink to-ink-secondary" />
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(99,102,241,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139,92,246,0.3) 0%, transparent 50%)' }} />

        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-accent-500 rounded-xl flex items-center justify-center shadow-accent-lg">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-white tracking-tight">TaskFlow</span>
          </div>

          <h1 className="font-display font-bold text-4xl text-white leading-tight mb-5">
            Everything you need<br />
            <span className="text-gradient">to get it done.</span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed max-w-xs">
            The task manager built for people who care about doing excellent work.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08 }}
              className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-accent-500/20 border border-accent-500/30 flex items-center justify-center shrink-0">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4.5 7.5L8 3" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-sm text-gray-400">{f}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="w-full max-w-[380px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center shadow-accent">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-display font-bold text-xl text-text-primary dark:text-white">TaskFlow</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-bold text-2xl text-text-primary dark:text-white mb-2">Sign in</h2>
            <p className="text-sm text-text-secondary dark:text-gray-400">Welcome back — let's get productive.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="you@company.com"
                autoComplete="email"
                className={cn('input-field', errors.email && 'border-red-500 focus:ring-red-500/20 focus:border-red-500')} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary dark:text-gray-400 mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  placeholder="••••••••" autoComplete="current-password"
                  className={cn('input-field pr-10', errors.password && 'border-red-500 focus:ring-red-500/20')} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-ink-subtle hover:text-text-primary dark:hover:text-white transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2 text-sm">
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
                : <><span>Continue</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted dark:text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-accent-500 hover:text-accent-400 font-medium transition-colors">
              Sign up free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
