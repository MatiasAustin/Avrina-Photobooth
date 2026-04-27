import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { PLATFORM_NAME } from '../../lib/constants';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-pawtobooth-beige)] relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-[#3E6B43]/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-[#3E6B43]/10 rounded-full blur-[120px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-12 relative z-10"
      >
        <div className="text-center space-y-4">
           <div className="w-16 h-16 bg-white border border-black/5 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Camera className="w-8 h-8 text-[#3E6B43]" />
           </div>
           <h1 className="text-4xl font-bold tracking-tight uppercase leading-none text-[var(--color-pawtobooth-dark)]">{PLATFORM_NAME} <span className="text-[#3E6B43]">Console</span></h1>
           <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-[10px] uppercase tracking-[0.2em] leading-relaxed">
             Freeze your moment • central network
           </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-pawtobooth-dark)]/40" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-black/5 py-4 pl-12 pr-4 rounded-2xl focus:border-[#3E6B43] focus:bg-white text-[var(--color-pawtobooth-dark)] shadow-sm transition-all outline-none"
                  placeholder="name@example.com"
                  required 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest pl-4">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-pawtobooth-dark)]/40" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-black/5 py-4 pl-12 pr-4 rounded-2xl focus:border-[#3E6B43] focus:bg-white text-[var(--color-pawtobooth-dark)] shadow-sm transition-all outline-none"
                  placeholder="••••••••"
                  required 
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-500 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[var(--color-pawtobooth-dark)] text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-[#3E6B43] hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <p className="text-center text-[var(--color-pawtobooth-dark)]/60 text-xs">
          Don't have an account? <Link to="/register" className="text-[#3E6B43] font-bold hover:underline">Create one for free</Link>
        </p>
      </motion.div>
    </div>
  );
}
