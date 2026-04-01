import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

const checks = (pw) => [
  { label: '8+ characters',     ok: pw.length >= 8        },
  { label: 'Uppercase',         ok: /[A-Z]/.test(pw)      },
  { label: 'Lowercase',         ok: /[a-z]/.test(pw)      },
  { label: 'Number',            ok: /\d/.test(pw)         },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]     = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const [errors, setErrors]   = useState({});

  const set = (k) => (e) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setErrors(er => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 2) e.name = 'At least 2 characters';
    if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email required';
    if (form.password.length < 8) e.password = 'At least 8 characters';
    if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(form.password)) e.password = 'Include uppercase, lowercase & number';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(form);
      toast.success('Account created — welcome!');
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const pwChecks = checks(form.password);
  const pwScore  = pwChecks.filter(c => c.ok).length;
  const scoreBar = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500'];

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary dark:bg-ink p-6">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.04) 0%, transparent 60%)' }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="relative w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10 justify-center">
          <div className="w-9 h-9 bg-accent-500 rounded-xl flex items-center justify-center shadow-accent">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 8L6.5 11.5L13 4.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display font-bold text-xl text-text-primary dark:text-white">TaskFlow</span>
        </div>

        <div className="card p-8 shadow-xl dark:shadow-dark-lg">
          <div className="mb-6">
            <h2 className="font-display font-bold text-2xl text-text-primary dark:text-white mb-1.5">Create account</h2>
            <p className="text-sm text-text-secondary dark:text-gray-400">Start getting things done today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { k: 'name',  label: 'Full name',  type: 'text',  ph: 'Jane Smith',        ac: 'name'  },
              { k: 'email', label: 'Work email', type: 'email', ph: 'you@company.com',   ac: 'email' },
            ].map(({ k, label, type, ph, ac }) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-text-secondary dark:text-gray-400 mb-1.5 uppercase tracking-wide">{label}</label>
                <input type={type} value={form[k]} onChange={set(k)} placeholder={ph} autoComplete={ac}
                  className={cn('input-field', errors[k] && 'border-red-500 focus:ring-red-500/20 focus:border-red-500')} />
                {errors[k] && <p className="text-red-500 text-xs mt-1">{errors[k]}</p>}
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold text-text-secondary dark:text-gray-400 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  placeholder="Create a strong password" autoComplete="new-password"
                  className={cn('input-field pr-10', errors.password && 'border-red-500 focus:ring-red-500/20')} />
                <button type="button" onClick={() => setShowPw(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-ink-subtle hover:text-text-primary dark:hover:text-white transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}

              {form.password && (
                <div className="mt-2.5 space-y-2">
                  <div className="flex gap-1">
                    {[0,1,2,3].map(i => (
                      <div key={i} className={cn('h-1 flex-1 rounded-full transition-all duration-300',
                        i < pwScore ? scoreBar[pwScore - 1] : 'bg-surface-border dark:bg-ink-border')} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {pwChecks.map(c => (
                      <div key={c.label} className={cn('flex items-center gap-1.5 text-xs transition-colors',
                        c.ok ? 'text-emerald-500' : 'text-text-muted dark:text-ink-subtle')}>
                        <div className={cn('w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 transition-all',
                          c.ok ? 'bg-emerald-500 border-emerald-500' : 'border-surface-border dark:border-ink-border')}>
                          {c.ok && <Check size={8} className="text-white" strokeWidth={3} />}
                        </div>
                        {c.label}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2 text-sm">
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Creating account…</>
                : <><span>Create Account</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-text-muted dark:text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-500 hover:text-accent-400 font-medium transition-colors">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
