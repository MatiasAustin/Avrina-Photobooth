import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, BarChart3, Cloud, Printer, ArrowRight, Zap, Target, Layout, Check, X, Shield, Cpu, Smartphone } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export function Home() {
  const { settings } = useSettings();

  return (
    <div className="min-h-screen bg-[var(--color-pawtobooth-beige)] text-[var(--color-pawtobooth-dark)] relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[800px] bg-gradient-to-b from-[#3E6B43]/10 via-[#3E6B43]/5 to-transparent blur-[120px] pointer-events-none opacity-50" />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 md:p-8 flex items-center justify-between backdrop-blur-xl border-b border-black/5">
        <div className="flex items-center gap-3">
           {settings.appLogoUrl ? (
             <img src={settings.appLogoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
           ) : (
             <div className="w-10 h-10 bg-[#3E6B43] rounded-xl flex items-center justify-center">
               <Camera className="w-6 h-6 text-white" />
             </div>
           )}
           <span className="font-black uppercase tracking-tighter text-xl text-[var(--color-pawtobooth-dark)]">{settings.appName} <span className="text-[#3E6B43] italic">Cloud</span></span>
        </div>
        <div className="flex items-center gap-4 md:gap-8 text-[10px] font-mono uppercase tracking-widest">
          <Link to="/login" className="text-[var(--color-pawtobooth-dark)]/60 hover:text-[var(--color-pawtobooth-dark)] transition-colors hidden sm:block">Operator Login</Link>
          <Link to="/register" className="bg-[#3E6B43] text-white px-6 py-2.5 rounded-full font-black hover:scale-105 hover:bg-[var(--color-pawtobooth-dark)] transition-all shadow-[0_0_20px_rgba(62,107,67,0.2)]">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 md:pt-48 pb-20 md:pb-32 px-6 relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto text-center space-y-6 md:space-y-10">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-[var(--color-pawtobooth-light)] border border-black/10 text-[10px] font-mono uppercase tracking-[0.2em] text-[#3E6B43]"
           >
             <Zap className="w-3 h-3 fill-current" /> Photobooth OS • Now in Public Beta
           </motion.div>
           
           <motion.h1 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="text-6xl md:text-[120px] font-black tracking-tighter leading-[0.8] uppercase"
           >
             The Future of <br/><span className="bg-gradient-to-r from-[var(--color-pawtobooth-dark)] via-[#3E6B43] to-[#3E6B43]/50 bg-clip-text text-transparent">Event Magic</span>
           </motion.h1>
           
           <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="max-w-2xl mx-auto text-[var(--color-pawtobooth-dark)]/70 text-lg md:text-xl font-medium tracking-tight leading-relaxed"
           >
             {settings.appName} is the professional's choice for cloud-connected photobooths. Centralized management, premium hardware support, and instant digital galleries.
           </motion.p>

           <motion.div 
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.4 }}
             className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
           >
             <Link to="/demo" className="w-full sm:w-auto px-12 py-6 bg-[#3E6B43] text-white font-black uppercase tracking-widest rounded-3xl text-sm hover:scale-105 transition-all shadow-[0_20px_50px_rgba(62,107,67,0.3)] flex items-center justify-center gap-3">
               <Camera className="w-5 h-5" /> Launch Live Demo
             </Link>
             <Link to="/register" className="w-full sm:w-auto px-12 py-6 border border-black/10 hover:bg-[var(--color-pawtobooth-light)] text-[var(--color-pawtobooth-dark)] font-black uppercase tracking-widest rounded-3xl text-sm transition-all flex items-center justify-center gap-3">
               Get Started for Free <ArrowRight className="w-4 h-4" />
             </Link>
           </motion.div>
        </div>
      </section>

      {/* Concept Breakdown (Admin/Flow) */}
      <section className="py-32 px-6 relative z-10 border-t border-black/5 bg-[var(--color-pawtobooth-light)]">
        <div className="max-w-7xl mx-auto space-y-24">
           <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">The {settings.appName} <span className="text-[#3E6B43] italic">Workflow</span></h2>
              <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-xs uppercase tracking-[0.3em]">Setup once • Deploy anywhere • Manage from cloud</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { 
                  step: "01",
                  title: "Cloud Engine", 
                  icon: Cpu, 
                  desc: "Design templates, set pricing (QRIS/Cash), and configure timers in your central dashboard.",
                  highlight: "Setup templates in seconds"
                },
                { 
                  step: "02",
                  title: "Instant Booth", 
                  icon: Smartphone, 
                  desc: "Log in on any device (iPad, Windows, Android) and your booth is live instantly. No local setup needed.",
                  highlight: "Cross-platform ready"
                },
                { 
                  step: "03",
                  title: "Central Control", 
                  icon: BarChart3, 
                  desc: "Monitor status, confirm payments, and download data from the Global Control Center.",
                  highlight: "Real-time metrics"
                }
              ].map((f, i) => (
                <div key={i} className="relative group p-10 bg-white border border-black/5 rounded-[48px] space-y-8 hover:border-[#3E6B43]/30 transition-all overflow-hidden shadow-sm hover:shadow-xl">
                   <div className="absolute top-10 right-10 text-6xl font-black text-black/[0.03] italic group-hover:text-[#3E6B43]/10 transition-colors">{f.step}</div>
                   <div className="w-16 h-16 bg-[#3E6B43]/10 rounded-3xl flex items-center justify-center text-[#3E6B43]">
                      <f.icon className="w-8 h-8" />
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-2xl font-bold uppercase tracking-tight">{f.title}</h3>
                      <p className="text-[var(--color-pawtobooth-dark)]/70 text-sm leading-relaxed">{f.desc}</p>
                   </div>
                   <div className="pt-4 flex items-center gap-2 text-[10px] font-black uppercase text-[#3E6B43] tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                     <Check className="w-4 h-4" /> {f.highlight}
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Pricelist / Subscription */}
      <section className="py-32 px-6 relative z-10 border-t border-black/5 bg-[var(--color-pawtobooth-beige)]">
        <div className="max-w-7xl mx-auto space-y-20">
           <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight">Simple <span className="text-[var(--color-pawtobooth-dark)]/40">Pricing</span></h2>
              <p className="text-[var(--color-pawtobooth-dark)]/60 font-mono text-xs uppercase tracking-[0.3em]">Satu harga untuk semua fitur premium</p>
           </div>

           <div className="flex justify-center">
             <div className="w-full max-w-md p-10 rounded-[48px] bg-white text-[var(--color-pawtobooth-dark)] space-y-12 flex flex-col shadow-xl border border-black/5 relative overflow-hidden">
               <div className="absolute top-8 right-[-35px] bg-[#3E6B43] text-white text-[8px] font-black uppercase tracking-widest py-1 w-[150px] text-center rotate-45 shadow-lg">Unlimited Access</div>
               <div className="space-y-4">
                 <h4 className="text-sm font-black uppercase tracking-widest opacity-40">Professional Plan</h4>
                 <div className="flex items-baseline gap-1">
                   <span className="text-sm font-black uppercase">Rp</span>
                   <span className="text-5xl font-black">{parseInt(settings.subscriptionPrice) / 1000}k</span>
                   <span className="text-lg font-bold opacity-30">/bln</span>
                 </div>
                 <p className="text-xs opacity-60">Segala yang Anda butuhkan untuk menjalankan bisnis photobooth profesional.</p>
               </div>
               <div className="space-y-4 flex-1">
                 {[
                   "Unlimited Booths & Sessions",
                   "Custom Branding & Templates",
                   "QRIS & Cash Payment Flow",
                   "Real-time Dashboard Analytics",
                   "Remote Print Node Management",
                   "Instant Cloud Gallery",
                   "Priority Support 24/7"
                 ].map((feat, i) => (
                   <div key={i} className="flex items-center gap-3 text-xs font-black">
                     <Check className="w-4 h-4 text-[#3E6B43]" /> {feat}
                   </div>
                 ))}
               </div>
               <Link to="/register" className="w-full py-5 text-center bg-[#3E6B43] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[var(--color-pawtobooth-dark)] transition-all">Daftar Sekarang</Link>
             </div>
           </div>
        </div>
      </section>

      {/* Demo Section Mini */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto p-12 bg-gradient-to-br from-[#3E6B43] to-[var(--color-pawtobooth-dark)] rounded-[50px] text-center space-y-8 shadow-2xl relative overflow-hidden group">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1600&q=40')] opacity-10 mix-blend-overlay group-hover:scale-110 transition-transform duration-[20s]" />
           <div className="relative z-10 space-y-2">
             <h3 className="text-3xl font-black uppercase tracking-tight text-white">Ready to see it in action?</h3>
             <p className="text-white/70 font-medium">Try the live booth experience on this device. No setup, no credit card.</p>
           </div>
           <div className="relative z-10">
             <Link to="/demo" className="inline-flex py-4 px-12 bg-white text-black rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-110 active:scale-95 transition-all">Launch Live Demo</Link>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 text-center border-t border-black/5 space-y-8 bg-[var(--color-pawtobooth-beige)]">
         <div className="flex items-center justify-center gap-8 text-[10px] font-mono uppercase tracking-[0.3em] text-[var(--color-pawtobooth-dark)]/60">
           <a href="#" className="hover:text-[#3E6B43] transition-colors">Documentation</a>
           <a href="#" className="hover:text-[#3E6B43] transition-colors">Privacy Policy</a>
           <a href="#" className="hover:text-[#3E6B43] transition-colors">Terms of Service</a>
         </div>
         <p className="text-[var(--color-pawtobooth-dark)]/40 font-mono text-[10px] uppercase tracking-[0.3em]">
           &copy; {new Date().getFullYear()} {settings.appName} Network • Built for the creators of moments.
         </p>
      </footer>
    </div>
  );
}
