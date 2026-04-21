import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Camera, BarChart3, Cloud, Printer, ArrowRight, Zap, Target, Layout } from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-white/5 to-transparent blur-3xl pointer-events-none" />
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 p-8 flex items-center justify-between backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
           <Camera className="w-6 h-6" />
           <span className="font-black uppercase tracking-tighter text-xl">Lux Booth</span>
        </div>
        <div className="flex items-center gap-8 text-xs font-mono uppercase tracking-widest text-neutral-400">
          <Link to="/login" className="hover:text-white transition-colors">Login</Link>
          <Link to="/register" className="bg-white text-black px-6 py-2 rounded-full font-bold hover:scale-105 transition-transform">Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto text-center space-y-8">
           <motion.div 
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-[0.2em]"
           >
             <Zap className="w-3 h-3 text-yellow-500 fill-yellow-500" /> Version 2.0 is now live
           </motion.div>
           
           <motion.h1 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1 }}
             className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] uppercase"
           >
             Scale Your <br/><span className="text-white/20">Booth Empire</span>
           </motion.h1>
           
           <motion.p 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="max-w-2xl mx-auto text-neutral-400 text-lg md:text-xl font-medium tracking-tight"
           >
             The complete SaaS platform for professional photobooth operators. Centralized monitoring, real-time stats, and premium photography flow.
           </motion.p>

           <motion.div 
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.3 }}
             className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
           >
             <Link to="/register" className="px-12 py-6 bg-white text-black font-black uppercase tracking-widest rounded-full text-sm hover:scale-110 transition-transform shadow-[0_0_50px_rgba(255,255,255,0.2)]">
               Start Building Now
             </Link>
             <Link to="/login" className="px-12 py-6 border border-white/20 hover:bg-white/5 font-black uppercase tracking-widest rounded-full text-sm transition-all flex items-center gap-2">
               Enterprise Demo <ArrowRight className="w-4 h-4" />
             </Link>
           </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 relative z-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { title: "Multi-Booth Sync", icon: Layout, desc: "Connect unlimited booth physical installations and manage them from one cloud dashboard." },
             { title: "Real-time Metrics", icon: BarChart3, desc: "Monitor revenue, photo counts, and print statuses as they happen on the ground." },
             { title: "Cloud Sessions", icon: Cloud, desc: "Automatic Google Drive backups and cloud gallery generation for your clients." },
             { title: "Print Network", icon: Printer, desc: "Unified print queue management. Monitor toner levels and connection status remotely." },
             { title: "Booth AI Ready", icon: Target, desc: "Proprietary photo balancing and background removal compatible with our API." },
             { title: "Payment Flow", icon: Zap, desc: "Integrated QRIS and digital payment support for automated unattended installations." }
           ].map((f, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: i * 0.1 }}
               className="p-8 bg-neutral-900/50 border border-white/5 rounded-[32px] space-y-4 hover:border-white/20 transition-all group"
             >
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all">
                   <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-tight">{f.title}</h3>
                <p className="text-neutral-500 text-sm leading-relaxed">{f.desc}</p>
             </motion.div>
           ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 text-center border-t border-white/5">
         <p className="text-neutral-600 font-mono text-[10px] uppercase tracking-[0.3em]">
           &copy; 2024 Lux Booth Technologies • Built for Scale
         </p>
      </footer>
    </div>
  );
}
