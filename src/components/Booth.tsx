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
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Safety: Ensure video is actually playing and has dimensions
      if (video.readyState < 2 || video.videoWidth === 0) {
        console.warn("Video not ready for capture");
        return;
      }

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // 1. Initial Fill (Prevent Transparency/Black)
        context.fillStyle = '#000000';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Draw Video (Mirrored)
        context.save();
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.restore();

        // 3. Draw Template Overlay
        if (selectedTemplate) {
          try {
            const templateImg = new Image();
            if (selectedTemplate.image_url.startsWith('http')) {
              templateImg.crossOrigin = "anonymous";
            }
            templateImg.src = selectedTemplate.image_url;
            
            await new Promise((resolve) => {
              const timeout = setTimeout(resolve, 2000); 
              templateImg.onload = () => {
                context.drawImage(templateImg, 0, 0, canvas.width, canvas.height);
                clearTimeout(timeout);
                resolve(null);
              };
              templateImg.onerror = () => {
                console.warn("Template failed to load");
                clearTimeout(timeout);
                resolve(null);
              };
            });
          } catch (e) {
            console.error("Template overlay error", e);
          }
        }

        const photoData = canvas.toDataURL('image/jpeg', 0.82);
        
        if (photoData.length > 1000) {
          setCapturedPhotos(prev => [...prev, photoData]);
          setState('review_shot');
        } else {
          console.error("Capture empty");
          // Fallback: try to advance anyway or alert
          setState('review_shot');
        }
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
    try {
      if (!photos || photos.length === 0) return '';
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return photos[0];

      const stripWidth = 600;
      const stripHeight = 1800;
      const margin = 40;
      const slots = 3;

      canvas.width = stripWidth * 2;
      canvas.height = stripHeight;

      // Solid color background first
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load images with type-specific handling
      const loadedImages: HTMLImageElement[] = await Promise.all(
        photos.map(src => new Promise<HTMLImageElement>((resolve) => {
          const img = new Image();
          // ONLY use anonymous for external URLs to avoid tainting. Data URLs don't need it.
          if (src.startsWith('http')) {
            img.crossOrigin = "anonymous";
          }
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = () => {
            console.warn("Failed to load a photo for strip, using empty placeholder");
            resolve(img); // Resolve anyway to keep order
          };
          setTimeout(() => resolve(img), 2500);
        }))
      );

      const drawSingleStrip = (offsetX: number) => {
        const photoWidth = stripWidth - (margin * 2);
        const photoHeight = (stripHeight - (margin * (slots + 2))) / (slots + 0.8);

        for (let i = 0; i < slots; i++) {
          const img = loadedImages[i] || loadedImages[0];
          if (!img || !img.complete || img.naturalWidth === 0) {
            ctx.fillStyle = '#eeeeee';
            ctx.fillRect(offsetX + margin, margin + i * (photoHeight + margin), photoWidth, photoHeight);
            continue;
          }

          const y = margin + i * (photoHeight + margin);
          ctx.drawImage(img, offsetX + margin, y, photoWidth, photoHeight);
        }

        // Branding
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(event?.name?.toUpperCase() || 'AVRINA NETWORK', offsetX + stripWidth / 2, stripHeight - 140);
        
        ctx.font = '20px monospace';
        ctx.fillStyle = '#999999';
        ctx.fillText(new Date().toLocaleDateString(), offsetX + stripWidth / 2, stripHeight - 80);
      };

      drawSingleStrip(0);
      drawSingleStrip(stripWidth);

      const result = canvas.toDataURL('image/jpeg', 0.8);
      // Fail-safe: if string is too short, the canvas export failed
      if (result.length < 1000) {
        throw new Error("Canvas export produced invalid data");
      }
      return result;
    } catch (err) {
      console.error("Critical: Strip generation failed", err);
      return photos[0] || '';
    }
  };

  const handleFinalize = async (arrangedPhotos: string[]) => {
    try {
      const finalStripBase64 = await generatePhotoStrip(arrangedPhotos);
      if (!finalStripBase64) throw new Error("Generated strip is empty");
      
      // 1. Upload the final strip to Storage
      // Cleaner way to convert base64 to Blob
      const blob = await fetch(finalStripBase64).then(r => r.blob());
      
      const fileName = `session-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('result')
        .upload(fileName, blob);

      if (uploadError) {
        console.error("Storage Upload Error:", uploadError);
        throw new Error(`Upload failed: ${uploadError.message}. Make sure RLS policy for 'result' bucket allows public uploads.`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('result')
        .getPublicUrl(fileName);

      // 2. Save Session to Database
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          event_id: event?.id,
          photos: arrangedPhotos,
          template_id: selectedTemplate?.id,
          payment_status: event?.price > 0 ? 'paid' : 'free',
          payment_id: paymentId || '',
          final_photo_url: publicUrl 
        })
        .select()
        .single();

      if (error) {
        console.error("Database Insert Error:", error);
        throw new Error(`Database save failed: ${error.message}`);
      }
      
      setCapturedPhotos([publicUrl]);
      setSession(data);
      setState('summary');
    } catch (e: any) {
      console.error("Session finalize error", e);
      alert(`Finalize Error: ${e.message}`);
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
