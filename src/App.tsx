import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Booth } from './components/Booth';
import { Admin } from './components/Admin';
import { Home } from './components/Home';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { PublicGallery } from './components/gallery/PublicGallery';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-sans">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium tracking-widest uppercase">Connecting to Avrina Network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-white selection:text-black">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={session ? <Navigate to="/dashboard" /> : <Register />} />
        
        <Route 
          path="/dashboard/*" 
          element={session ? <Admin session={session} /> : <Navigate to="/login" />} 
        />
        
        <Route path="/booth/:slug" element={<Booth />} />
        <Route path="/gallery/:sessionId" element={<PublicGallery />} />
        
        {/* Legacy support for #admin hash */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}
