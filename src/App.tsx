import { useState, useEffect } from 'react';
import { Booth } from './components/Booth';
import { Admin } from './components/Admin';

export default function App() {
  const [isAdminView, setIsAdminView] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check URL for admin view
    if (window.location.hash === '#admin') {
      setIsAdminView(true);
    }

    const handleHashChange = () => {
      setIsAdminView(window.location.hash === '#admin');
    };

    window.addEventListener('hashchange', handleHashChange);
    setLoading(false);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white font-sans">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium tracking-widest uppercase">Initializing Lux Booth AI...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-white selection:text-black">
      {isAdminView ? <Admin /> : <Booth />}
    </div>
  );
}
