import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Download, Share2, Camera, Heart, Check } from 'lucide-react';
import { PLATFORM_NAME } from '../../lib/constants';
import { motion, AnimatePresence } from 'motion/react';

export function PublicGallery() {
  const { sessionId } = useParams();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return;
      const { data, error } = await supabase
        .from('sessions')
        .select('*, events(name)')
        .eq('id', sessionId)
        .single();
      
      if (!error) setSession(data);
      setLoading(false);
    };

    fetchSession();
  }, [sessionId]);

  const handleDownload = (photoUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = `${PLATFORM_NAME.toLowerCase()}-shot-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[var(--color-pawtobooth-beige)] flex items-center justify-center p-8 text-center text-[var(--color-pawtobooth-dark)]">
        <div className="space-y-6">
           <div className="w-20 h-20 bg-white border border-black/5 rounded-3xl flex items-center justify-center mx-auto shadow-sm text-[var(--color-pawtobooth-dark)]/20">
              <Camera className="w-10 h-10" />
           </div>
           <h1 className="text-2xl font-bold uppercase tracking-tight">Session Not Found</h1>
           <p className="text-[var(--color-pawtobooth-dark)]/60 max-w-xs mx-auto">The link may have expired or the session was removed from the network.</p>
        </div>
      </div>
    );
  }

  const photos = Array.isArray(session.photos) ? session.photos : JSON.parse(session.photos);

  return (
    <div className="min-h-screen bg-[var(--color-pawtobooth-beige)] text-[var(--color-pawtobooth-dark)] font-sans selection:bg-[#3E6B43] selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--color-pawtobooth-beige)]/80 backdrop-blur-xl border-b border-black/5 p-6 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-black/5 text-[var(--color-pawtobooth-dark)] rounded-xl flex items-center justify-center shadow-sm">
               <Camera className="w-5 h-5 text-[#3E6B43]" />
            </div>
            <div>
               <h1 className="text-sm font-black uppercase tracking-widest leading-none">{PLATFORM_NAME} <span className="text-[#3E6B43] italic text-[10px]">Cloud</span></h1>
               <p className="text-[10px] text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-tighter mt-1">{session.events?.name || 'Private Session'}</p>
            </div>
         </div>
         <button 
           onClick={handleShare}
           className="p-3 bg-white rounded-xl border border-black/5 hover:bg-[#3E6B43] hover:text-white transition-all flex items-center gap-2 shadow-sm text-[var(--color-pawtobooth-dark)]/80"
         >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block">{copied ? 'Copied' : 'Share Gallery'}</span>
         </button>
      </header>

      <main className="max-w-xl mx-auto p-6 space-y-12 pb-32">
         <div className="space-y-2 text-center pt-8">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter text-[var(--color-pawtobooth-dark)]">Your Moments <br/><span className="text-[#3E6B43]/60">Frozen In Time</span></h2>
            <p className="text-[var(--color-pawtobooth-dark)]/60 text-xs uppercase tracking-widest font-mono">Captured {new Date(session.created_at).toLocaleDateString()}</p>
         </div>

         {/* Photo Feed */}
         <div className="space-y-12">
            {photos.map((photo: string, index: number) => (
               <motion.div 
                 key={index}
                 initial={{ opacity: 0, y: 30 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 className="group space-y-6"
               >
                  <div className="relative aspect-[4/5] bg-white rounded-[2.5rem] overflow-hidden border border-black/5 shadow-md group-hover:scale-[1.02] transition-transform duration-700">
                     <img src={photo} className="w-full h-full object-cover" loading="lazy" />
                     <div className="absolute top-6 right-6">
                        <button className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-black/10 text-[var(--color-pawtobooth-dark)]/40 hover:text-red-500 hover:bg-white transition-all shadow-sm">
                           <Heart className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                  
                  <div className="px-4 flex items-center justify-between text-[var(--color-pawtobooth-dark)]">
                     <div className="space-y-0.5">
                        <p className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/60 uppercase tracking-widest">Shot {index + 1} of {photos.length}</p>
                        <p className="text-xs font-bold uppercase">Original Resolution</p>
                     </div>
                     <button 
                       onClick={() => handleDownload(photo, index)}
                       className="px-6 py-3 bg-[#3E6B43] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:-translate-y-0.5 hover:bg-[var(--color-pawtobooth-dark)] transition-all shadow-md"
                     >
                        <Download className="w-4 h-4" /> Download
                     </button>
                  </div>
               </motion.div>
            ))}
         </div>

         {/* Branding Footer */}
         <div className="pt-20 text-center space-y-6 border-t border-black/5">
            <div className="flex justify-center gap-1 opacity-20">
               {[...Array(5)].map((_, i) => <Camera key={i} className="w-4 h-4 text-[#3E6B43]" />)}
            </div>
            <p className="text-[10px] font-mono text-[var(--color-pawtobooth-dark)]/40 uppercase tracking-[0.4em]">
               {PLATFORM_NAME} Photobooth SaaS • v1.0
            </p>
         </div>
      </main>

      {/* Floating CTA */}
      <div className="fixed bottom-8 inset-x-8 z-[60] flex justify-center">
         <motion.button 
           initial={{ y: 100 }}
           animate={{ y: 0 }}
           className="bg-white/90 backdrop-blur-2xl border border-black/10 px-8 py-5 rounded-[2rem] shadow-lg flex items-center gap-4 group text-[var(--color-pawtobooth-dark)]"
         >
            <div className="w-10 h-10 bg-[#3E6B43] text-white rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm">
               <Camera className="w-5 h-5" />
            </div>
            <div className="text-left">
               <p className="text-[10px] font-black uppercase tracking-widest leading-none">Want this for your event?</p>
               <p className="text-[10px] text-[var(--color-pawtobooth-dark)]/60 mt-1">Start your own {PLATFORM_NAME} network today.</p>
            </div>
         </motion.button>
      </div>
    </div>
  );
}
