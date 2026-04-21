import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { BoothState, EventConfig, PhotoTemplate, Session } from '../types';
import { BoothHero } from './booth/BoothHero';
import { PaymentGate } from './booth/PaymentGate';
import { TemplatePicker } from './booth/TemplatePicker';
import { CaptureStage } from './booth/CaptureStage';
import { ReviewGallery } from './booth/ReviewGallery';
import { SessionSummary } from './booth/SessionSummary';
import { BoothLayout } from './booth/BoothLayout';

export function Booth() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [state, setState] = useState<BoothState>('idle');
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [session, setSession] = useState<any | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [currentShot, setCurrentShot] = useState(0);
  const [qrisData, setQrisData] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize event from Supabase
  useEffect(() => {
    if (!slug) {
      setError("No booth selected. Please use a valid booth URL.");
      setLoading(false);
      return;
    }

    const fetchEventData = async () => {
      setLoading(true);
      setError(null);
      
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', slug)
        .single();

      if (eventError || !eventData) {
        setError("Booth not found or inactive.");
        setLoading(false);
        return;
      }

      setEvent(eventData);

      // Fetch templates for this event
      const { data: templatesData, error: templatesError } = await supabase
        .from('templates')
        .select('*')
        .eq('event_id', eventData.id);

      if (!templatesError && templatesData) {
        setTemplates(templatesData);
        if (templatesData.length > 0) setSelectedTemplate(templatesData[0]);
      }

      setLoading(false);
    };

    fetchEventData();
  }, [slug]);

  const handleStart = async () => {
    if (!event) return;
    
    if (event.qris_enabled && event.price > 0) {
      setState('payment');
      // Simulated QRIS Generation
      const qrisData = `00020101021126600013ID.CO.QRIS.WWW0215ID10202100000010303UMI51440014ID.CO.QRIS.WWW0215ID10202100000020303UMI5204481453033605802ID5912LUX_BOOTH_${event.slug.toUpperCase()}6007JAKARTA61051234562070703A016304ABCD`;
      setQrisData(qrisData);
      setPaymentId(`PAY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
      
      // Auto-success after 5 seconds for simulation
      setTimeout(handlePaymentSuccess, 5000);
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
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' } 
        });
      }
      
      if (videoRef.current) {
        if (videoRef.current.srcObject !== activeStream.current) {
          videoRef.current.srcObject = activeStream.current;
        }
        await videoRef.current.play().catch(console.warn);
      }
    } catch (e) {
      console.error("Camera error", e);
      setError("Camera access required.");
    }
  };

  useEffect(() => {
    const isCaptureState = ['countdown', 'capture', 'review_shot'].includes(state);
    if (isCaptureState) {
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
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        context.save();
        context.translate(canvasRef.current.width, 0);
        context.scale(-1, 1);
        context.drawImage(videoRef.current, 0, 0);
        context.restore();

        if (selectedTemplate) {
          const templateImg = new Image();
          templateImg.crossOrigin = "anonymous";
          templateImg.src = selectedTemplate.image_url;
          
          await new Promise((resolve) => {
            templateImg.onload = () => {
              context.drawImage(templateImg, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
              resolve(null);
            };
            templateImg.onerror = resolve;
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
    if (nextShot < (event?.shot_count || 3)) {
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

  const generatePhotoStrip = async (photos: string[]): Promise<string> => {
    if (!photos || photos.length === 0) return '';
    
    // Create a temporary canvas to avoid conflicts with global refs
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return photos[0];

    const stripWidth = 600;
    const stripHeight = 1800;
    const margin = 40;
    const photoWidth = stripWidth - (margin * 2);
    const photoHeight = (stripHeight - (margin * 5)) / 4.5;

    canvas.width = stripWidth * 2;
    canvas.height = stripHeight;

    // Background (Safety White)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const drawSingleStrip = async (offsetX: number) => {
      // White strip background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(offsetX, 0, stripWidth, stripHeight);

      // Draw 3 photos (User requested 3 ke bawah)
      const slots = 3;
      const photoHeight = (stripHeight - (margin * (slots + 2))) / (slots + 0.8); // Adjusted for taller slots

      for (let i = 0; i < slots; i++) {
        const photoSrc = photos[i] || photos[i % photos.length]; 
        const img = new Image();
        img.src = photoSrc;
        
        await new Promise((resolve) => {
          img.onload = () => {
            const y = margin + i * (photoHeight + margin);
            // Draw gray placeholder first
            ctx.fillStyle = '#f5f5f5';
            ctx.fillRect(offsetX + margin, y, photoWidth, photoHeight);
            ctx.drawImage(img, offsetX + margin, y, photoWidth, photoHeight);
            resolve(null);
          };
          img.onerror = resolve;
          // Security timeout
          setTimeout(resolve, 2000);
        });
      }

      // Draw Footer
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 36px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(event?.name?.toUpperCase() || 'AVRINA PHOTOBOOTH', offsetX + stripWidth / 2, stripHeight - 140);
      
      ctx.font = '20px monospace';
      ctx.fillStyle = '#999999';
      ctx.fillText(new Date().toLocaleDateString(), offsetX + stripWidth / 2, stripHeight - 80);
    };

    await drawSingleStrip(0);
    await drawSingleStrip(stripWidth);

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const handleFinalize = async (arrangedPhotos: string[]) => {
    try {
      const finalStrip = await generatePhotoStrip(arrangedPhotos);
      
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          event_id: event?.id,
          photos: arrangedPhotos,
          template_id: selectedTemplate?.id,
          payment_status: event?.price > 0 ? 'paid' : 'free',
          payment_id: paymentId || '',
          final_photo_url: finalStrip // We'll add this column or use existing logic
        })
        .select()
        .single();

      if (error) throw error;
      
      // Update local setCapturedPhotos to the final strip for summary display
      setCapturedPhotos([finalStrip]);
      setSession(data);
      setState('summary');
    } catch (e) {
      console.error("Session creation error", e);
      setState('summary');
    }
  };

  const handlePrint = async () => {
    if (!session) return;
    try {
      await supabase.from('print_queue').insert({
        session_id: session.id,
        image_url: capturedPhotos[0],
      });
      alert("Photo added to print queue!");
    } catch (e) {
      console.error("Print error", e);
    }
  };

  if (loading) return (
    <div className="h-screen bg-black flex items-center justify-center">
       <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full" />
    </div>
  );

  if (error) return (
    <div className="h-screen bg-black flex items-center justify-center p-8">
       <div className="max-w-md w-full bg-neutral-900 border border-white/10 p-12 rounded-[40px] text-center space-y-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Access Denied</h2>
          <p className="text-neutral-500 mb-8">{error}</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-white text-black font-bold rounded-2xl uppercase text-xs tracking-widest">Back to Home</button>
       </div>
    </div>
  );

  return (
    <BoothLayout>
      <AnimatePresence mode="wait">
        {state === 'idle' && <BoothHero onStart={handleStart} />}
        
        {state === 'payment' && (
          <PaymentGate price={event?.price || 0} qrisData={qrisData} />
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
            totalShots={event?.shot_count || 3}
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

        {state === 'summary' && (
          <SessionSummary 
            sessionId={session?.id}
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
