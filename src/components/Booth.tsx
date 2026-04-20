import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BoothState, EventConfig, PhotoTemplate, Session } from '../types';
import { BoothHero } from './booth/BoothHero';
import { PaymentGate } from './booth/PaymentGate';
import { TemplatePicker } from './booth/TemplatePicker';
import { CaptureStage } from './booth/CaptureStage';
import { ReviewGallery } from './booth/ReviewGallery';
import { SessionSummary } from './booth/SessionSummary';
import { BoothLayout } from './booth/BoothLayout';

export function Booth() {
  const [state, setState] = useState<BoothState>('idle');
  const [event, setEvent] = useState<EventConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<PhotoTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PhotoTemplate | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [currentShot, setCurrentShot] = useState(0);
  const [qrisData, setQrisData] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize event
  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/events/default");
        if (res.ok) {
          const eventData = await res.json();
          setEvent(eventData);

          // Fetch templates
          const tRes = await fetch(`/api/events/${eventData.id}/templates`);
          const templatesData = await tRes.json();
          setTemplates(templatesData);
          if (templatesData.length > 0) setSelectedTemplate(templatesData[0]);
        } else {
          setError("Event not found. Please setup in admin.");
        }
      } catch (e) {
        console.error("Fetch event error", e);
        setError("Database error. Ensure the server is running.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, []);

  // Payment polling
  useEffect(() => {
    if (state === 'payment' && paymentId) {
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/payments/${paymentId}/status`);
          const data = await res.json();
          if (data.status === 'paid') {
            clearInterval(interval);
            handlePaymentSuccess();
          }
        } catch (e) {
          console.error("Payment status poll error", e);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [state, paymentId]);

  const handleStart = async () => {
    if (!event) {
      if (error) alert(error);
      return;
    }
    
    if (event.qrisEnabled && event.pricing > 0) {
      setState('payment');
      try {
        const res = await fetch('/api/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: event.pricing, sessionId: 'temp' })
        });
        const data = await res.json();
        setQrisData(data.qrisData);
        setPaymentId(data.paymentId);
      } catch (e) {
        console.error("Payment creation error", e);
      }
    } else {
      setState('template_selection');
    }
  };

  const handlePaymentSuccess = () => {
    setState('template_selection');
  };

  const activeStream = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      if (!activeStream.current) {
        activeStream.current = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 },
            facingMode: 'user'
          } 
        });
      }
      
      if (videoRef.current) {
        if (videoRef.current.srcObject !== activeStream.current) {
          videoRef.current.srcObject = activeStream.current;
        }
        // Force play to ensure preview starts
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Auto-play blocked, retrying on interaction", playErr);
        }
      }
    } catch (e) {
      console.error("Camera error", e);
      setError("Camera access required. Please allow camera and refresh.");
    }
  };

  // Ensure camera starts when entering capture-related states
  useEffect(() => {
    const isCaptureState = ['countdown', 'capture', 'review_shot'].includes(state);
    if (isCaptureState) {
      // Small delay to ensure CaptureStage component has rendered its video element
      const timeout = setTimeout(startCamera, 100);
      return () => clearTimeout(timeout);
    } else {
      stopCamera();
    }
  }, [state]);

  const stopCamera = () => {
    if (activeStream.current) {
      activeStream.current.getTracks().forEach(t => t.stop());
      activeStream.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const proceedToCapture = () => {
    setState('countdown');
    startCountdown();
  };

  const startCountdown = () => {
    setCountdown(event?.timer || 5);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          takePhoto();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const takePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Match canvas to video resolution
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // 1. Draw Camera (Mirrored)
        context.save();
        context.translate(canvasRef.current.width, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0);
        context.restore();

        // 2. Overlay Template if exists
        if (selectedTemplate) {
          const templateImg = new Image();
          templateImg.crossOrigin = "anonymous";
          templateImg.src = selectedTemplate.imageUrl;
          
          await new Promise((resolve) => {
            templateImg.onload = () => {
              // Draw template to match video aspect
              context.drawImage(templateImg, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
              resolve(null);
            };
            templateImg.onerror = resolve; // Continue even if template fails
          });
        }

        const photoData = canvasRef.current.toDataURL('image/jpeg', 0.85);
        setCapturedPhotos(prev => [...prev, photoData]);
        setState('review_shot');
      }
    }
  };

  const handleShotRetake = () => {
    setCapturedPhotos(prev => prev.slice(0, -1));
    setState('countdown');
    startCountdown();
  };

  const handleShotNext = () => {
    const nextShot = currentShot + 1;
    if (nextShot < (event?.shotCount || 6)) {
      setCurrentShot(nextShot);
      setState('countdown');
      startCountdown();
    } else {
      stopCamera();
      setState('review');
    }
  };

  const handleRetake = () => {
    setCapturedPhotos([]);
    setCurrentShot(0);
    setState('template_selection');
  };

  const handleFinalize = async () => {
    setState('enhancing');
    
    // Create session via API
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event?.id,
          photos: capturedPhotos,
          templateId: selectedTemplate?.id,
          paymentStatus: event?.qrisEnabled ? 'paid' : 'free',
          paymentId: paymentId || '',
        })
      });
      const sessionData = await res.json();
      setSession(sessionData);
    } catch (e) {
      console.error("Session creation error", e);
    }

    // Mock AI Enhancement with Gemini (simulated)
    setTimeout(() => {
      setState('summary');
    }, 3000);
  };

  const handlePrint = async () => {
    if (!session) return;
    try {
      await fetch("/api/print-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          imageUrl: capturedPhotos[0], // Simplified
        })
      });
      alert("Photo added to print queue!");
    } catch (e) {
      console.error("Print error", e);
    }
  };

  return (
    <BoothLayout>
      {loading && (
        <div className="z-50 fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin mx-auto" />
            <p className="text-white/40 font-mono text-xs uppercase tracking-widest">Loading Event Session...</p>
          </div>
        </div>
      )}
      
      {error && !event && (
        <div className="z-50 fixed inset-0 bg-black/90 flex items-center justify-center px-8">
           <div className="max-w-md w-full bg-neutral-900 border border-white/10 p-8 rounded-3xl text-center space-y-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                 <div className="w-8 h-8 rounded-full border-4 border-red-500" />
              </div>
              <div className="space-y-2">
                 <h3 className="text-xl font-bold uppercase tracking-tight">Setup Required</h3>
                 <p className="text-neutral-500 text-sm">{error}</p>
              </div>
              <button 
                onClick={() => window.location.hash = '#admin'}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl uppercase tracking-widest text-xs"
              >
                 Go to Admin Dashboard
              </button>
           </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {state === 'idle' && <BoothHero onStart={handleStart} />}
        
        {state === 'payment' && (
          <PaymentGate price={event?.pricing || 0} qrisData={qrisData} />
        )}

        {state === 'template_selection' && (
          <TemplatePicker 
            templates={templates} 
            selectedTemplateId={selectedTemplate?.id}
            onSelect={setSelectedTemplate}
            onProceed={proceedToCapture}
          />
        )}

        {['countdown', 'capture', 'review_shot'].includes(state) && (
          <CaptureStage 
            videoRef={videoRef}
            selectedTemplate={selectedTemplate}
            countdown={countdown}
            currentShot={currentShot}
            totalShots={event?.shotCount || 6}
            lastCapturedPhoto={capturedPhotos[capturedPhotos.length - 1]}
            state={state}
            onRetake={handleShotRetake}
            onNext={handleShotNext}
          />
        )}

        {state === 'review' && (
          <ReviewGallery 
            photos={capturedPhotos}
            onRetake={handleRetake}
            onFinalize={handleFinalize}
          />
        )}

        {state === 'enhancing' && (
          <motion.div 
            key="enhancing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="z-10 text-center space-y-8"
          >
            <div className="relative w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase tracking-widest">Applying AI Magic</h2>
              <p className="text-neutral-500 font-mono text-xs uppercase tracking-tighter">Auto-balancing colors • Framing • Enhancing Details</p>
            </div>
          </motion.div>
        )}

        {state === 'summary' && (
          <SessionSummary 
            eventName={event?.name}
            photoUrl={capturedPhotos[0]}
            onPrint={handlePrint}
            onReset={() => {
              setState('idle');
              setCapturedPhotos([]);
              setCurrentShot(0);
              setSession(null);
            }}
          />
        )}
      </AnimatePresence>
      <canvas ref={canvasRef} className="hidden" />
    </BoothLayout>
  );
}
