import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { PLATFORM_NAME } from '../lib/constants';
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
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [globalTimeLeft, setGlobalTimeLeft] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const captureVideoRef = useRef<HTMLVideoElement>(null);
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

      // Fetch templates for this event + global templates from this user
      const { data: templatesData, error: templatesError } = await supabase
        .from('templates')
        .select('*')
        .eq('user_id', eventData.user_id);

      if (!templatesError && templatesData) {
        // Only show templates that are either global (event_id is null) or specific to this event
        const filteredTemplates = templatesData.filter(t => !t.event_id || t.event_id === eventData.id);
        setTemplates(filteredTemplates);
        if (filteredTemplates.length > 0) setSelectedTemplate(filteredTemplates[0]);
      }

      setLoading(false);
    };

    fetchEventData();
  }, [slug]);

  const handleStart = async () => {
    if (!event) return;
    
    if (event.price > 0) {
      // Always require payment confirmation if price is set
      setState('payment');
      
      // Create a pending session record for the admin to confirm
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          event_id: event.id,
          payment_status: 'pending',
          photos: []
        })
        .select()
        .single();
      
      if (!error && data) {
        setCurrentSessionId(data.id);
      } else {
        console.error("Failed to create pending session", error);
        // Fallback: proceed without tracking if DB fails
        setState('template_selection');
        if (event.session_timeout) setGlobalTimeLeft(event.session_timeout * 60);
      }
    } else {
      // Free booth - start immediately
      setState('template_selection');
      if (event.session_timeout) setGlobalTimeLeft(event.session_timeout * 60);
    }
  };

  const handlePaymentSuccess = () => {
    setState('template_selection');
    if (event.session_timeout) setGlobalTimeLeft(event.session_timeout * 60);
  };

  const cancelPendingSession = async () => {
    if (!currentSessionId) return;
    try {
      await supabase
        .from('sessions')
        .update({ payment_status: 'cancelled' })
        .eq('id', currentSessionId)
        .eq('payment_status', 'pending'); // only cancel if still pending
    } catch (e) {
      console.warn('Could not cancel session:', e);
    } finally {
      setCurrentSessionId(null);
    }
  };

  const activeStream = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      // 1. Get stream if not exists
      if (!activeStream.current) {
        activeStream.current = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, facingMode: 'user' } 
        });
      }
      
      const isCaptureState = ['countdown', 'capture', 'review_shot'].includes(state);
      
      // 2. Explicitly clear the other video first to release the stream binding
      if (isCaptureState) {
        if (videoRef.current) videoRef.current.srcObject = null;
      } else {
        if (captureVideoRef.current) captureVideoRef.current.srcObject = null;
      }

      // 3. Assign stream to the correct target
      const targetRef = isCaptureState ? captureVideoRef : videoRef;
      if (targetRef.current) {
        targetRef.current.srcObject = activeStream.current;
        await targetRef.current.play().catch(console.warn);
      }
    } catch (e) {
      console.error("Camera error", e);
      setError("Camera access required.");
    }
  };

  useEffect(() => {
    if (event && !['summary', 'review'].includes(state)) {
      startCamera();
    } else {
      // Don't strictly stop the camera on 'review' so it doesn't flicker if they retake,
      // but we do stop it on summary or when unmounting.
      if (state === 'summary') stopCamera();
    }
    
    return () => {
      // Only stop on full unmount to preserve stream across state changes
    };
  }, [state, event]);

  // Real-time Payment Confirmation Listener
  useEffect(() => {
    if (state !== 'payment' || !currentSessionId) return;

    const channel = supabase
      .channel(`payment-${currentSessionId}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'sessions', 
          filter: `id=eq.${currentSessionId}` 
        },
        (payload) => {
          if (payload.new.payment_status === 'paid') {
            handlePaymentSuccess();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [state, currentSessionId]);

  const stopCamera = () => {
    if (activeStream.current) {
      activeStream.current.getTracks().forEach(t => t.stop());
      activeStream.current = null;
    }
  };

  // Global Session Timer
  useEffect(() => {
    if (globalTimeLeft === null || globalTimeLeft <= 0 || ['idle', 'summary'].includes(state)) {
      return;
    }

    const timer = setInterval(() => {
      setGlobalTimeLeft(prev => (prev !== null && prev > 0) ? prev - 1 : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [globalTimeLeft, state]);

  // Automatic Progression Logic
  useEffect(() => {
    if (state !== 'review_shot') return;

    const timeout = setTimeout(() => {
      handleShotNext();
    }, 2500); // 2.5 seconds preview

    return () => clearTimeout(timeout);
  }, [state, currentShot]);

  const isTimeout = globalTimeLeft !== null && globalTimeLeft <= 0;

  // Reliable Countdown Logic
  useEffect(() => {
    if (state !== 'countdown') return;

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

    return () => clearInterval(interval);
  }, [state, event?.timer]);

  const proceedToCapture = () => {
    setState('countdown');
  };

  const takePhoto = async () => {
    const activeVideo = ['countdown', 'capture', 'review_shot'].includes(state) ? captureVideoRef.current : videoRef.current;
    if (activeVideo && canvasRef.current) {
      const video = activeVideo;
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

        // 2. Draw Video (Respecting Mirror & Filter)
        context.save();
        if (event?.is_mirrored !== false) {
          context.translate(canvas.width, 0);
          context.scale(-1, 1);
        }
        
        if (event?.camera_filter) {
          context.filter = event.camera_filter;
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.restore();

        const photoData = canvas.toDataURL('image/jpeg', 0.85);
        
        if (photoData.length > 1000) {
          setCapturedPhotos(prev => {
            const newPhotos = [...prev];
            newPhotos[currentShot] = photoData;
            return newPhotos;
          });
          setState('review_shot');
        } else {
          console.error("Capture empty");
          setState('review_shot');
        }
      }
    }
  };

  const handleShotNext = () => {
    const totalRequired = Math.max(event?.shot_count || 3, selectedTemplate?.slot_count || 0);
    
    // If we are in the middle of a normal sequence
    if (capturedPhotos.length < totalRequired) {
      const nextShot = currentShot + 1;
      setCurrentShot(nextShot);
      setState('countdown');
    } else {
      // We've taken all photos. 
      // If we were doing a selective retake, go back to review.
      // Otherwise, proceed to final review.
      stopCamera();
      setState('review');
    }
  };

  const handleSelectiveRetake = (index: number) => {
    setCurrentShot(index);
    setState('countdown');
  };

  const handleRetake = () => {
    setCapturedPhotos([]);
    setCurrentShot(0);
    setState('template_selection');
  };

  interface PhotoTransform {
    x: number;
    y: number;
    scale: number;
  }

  const generatePhotoStrip = async (photos: string[], transforms?: PhotoTransform[]): Promise<string> => {
    try {
      if (!photos || photos.length === 0) return '';
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return photos[0];

      // 4x6 Ratio: 1200x1800
      const canvasWidth = 1200;
      const canvasHeight = 1800;
      const margin = 60;
      const slots = selectedTemplate?.slot_count || 3;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

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

      // Load Template Overlay
      let templateImg: HTMLImageElement | null = null;
      if (selectedTemplate?.image_url) {
        templateImg = await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = selectedTemplate.image_url;
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
        });
      }

      // Draw Photos
      const isTwoColumn = slots >= 4 || slots === 3;
      const cols = isTwoColumn ? 2 : 1;
      const rows = isTwoColumn ? (slots === 3 ? 3 : slots / 2) : slots;
      
      const cellWidth = (canvasWidth - (margin * (cols + 1))) / cols;
      const cellHeight = (canvasHeight - (margin * (rows + 1))) / rows;
      
      // Use shorter side for square photos if needed, but for custom templates 
      // we usually just want to fill the "hole" area.
      const photoWidth = cellWidth;
      const photoHeight = cellHeight;

      for (let i = 0; i < (slots === 3 ? 6 : slots); i++) {
        const photoIdx = slots === 3 ? (i % 3) : i; // For 3 slots, repeat photos in second column
        const img = loadedImages[photoIdx] || loadedImages[0];
        
        if (!img || !img.complete || img.naturalWidth === 0) continue;

        const col = i < rows ? 0 : 1;
        const row = i % rows;

        const x = margin + col * (photoWidth + margin);
        const y = margin + row * (photoHeight + margin);

        // Center of the cell
        const centerX = x + photoWidth / 2;
        const centerY = y + photoHeight / 2;

        // Apply Transform if available
        const transform = transforms ? transforms[photoIdx] : { x: 0, y: 0, scale: 1 };
        
        // Scale and Position adjustments
        // transforms are normalized (relative to cell size)
        const scale = transform.scale || 1;
        const offsetX = (transform.x || 0) * photoWidth;
        const offsetY = (transform.y || 0) * photoHeight;

        ctx.save();
        // Create a clipping region for this hole
        ctx.beginPath();
        ctx.rect(x, y, photoWidth, photoHeight);
        ctx.clip();

        // Draw image centered and transformed
        const imgAspect = img.naturalWidth / img.naturalHeight;
        const targetAspect = photoWidth / photoHeight;
        
        let drawW, drawH;
        if (imgAspect > targetAspect) {
          drawH = photoHeight * scale;
          drawW = drawH * imgAspect;
        } else {
          drawW = photoWidth * scale;
          drawH = drawW / imgAspect;
        }

        ctx.drawImage(
          img, 
          centerX - drawW / 2 + offsetX, 
          centerY - drawH / 2 + offsetY, 
          drawW, 
          drawH
        );
        ctx.restore();
      }

      // Draw Template Overlay on top of EVERYTHING
      if (templateImg) {
        // Draw once over the entire 4x6 sheet
        ctx.drawImage(templateImg, 0, 0, canvasWidth, canvasHeight);
      } else {
        // Fallback Branding for 2-column
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 48px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(event?.name?.toUpperCase() || `${PLATFORM_NAME.toUpperCase()} NETWORK`, canvasWidth / 2, canvasHeight - 100);
      }

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

  const handleFinalize = async (arrangedPhotos: string[], transforms: PhotoTransform[]) => {
    try {
      const finalStripBase64 = await generatePhotoStrip(arrangedPhotos, transforms);
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
    <div className="h-screen bg-[var(--color-pawtobooth-beige)] flex items-center justify-center">
       <div className="animate-spin w-8 h-8 border-2 border-[#3E6B43]/20 border-t-[#3E6B43] rounded-full" />
    </div>
  );

  if (error) return (
    <div className="h-screen bg-[var(--color-pawtobooth-beige)] flex items-center justify-center p-8">
       <div className="max-w-md w-full bg-white border border-black/5 p-12 rounded-[40px] text-center space-y-6 shadow-sm text-[var(--color-pawtobooth-dark)]">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Access Denied</h2>
          <p className="text-[var(--color-pawtobooth-dark)]/60 mb-8">{error}</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-[#3E6B43] text-white font-bold rounded-2xl uppercase text-xs tracking-widest hover:bg-[var(--color-pawtobooth-dark)] shadow-sm">Back to Home</button>
       </div>
    </div>
  );

  return (
    <BoothLayout>
      {/* Global Camera Background */}
      <div className={`absolute inset-0 z-0 overflow-hidden bg-black flex items-center justify-center transition-opacity duration-1000 ${['summary', 'review', 'countdown', 'capture', 'review_shot'].includes(state) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          style={{ filter: event?.camera_filter || '' }}
          className={`w-full h-full object-cover transition-opacity duration-1000 ${state === 'idle' ? 'opacity-30' : 'opacity-100'} ${event?.is_mirrored !== false ? 'scale-x-[-1]' : ''}`}
        />
      </div>

      <div className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {state === 'idle' && (
            <div className="absolute inset-x-0 bottom-0 pb-20 flex justify-center z-50">
              <BoothHero onStart={handleStart} />
            </div>
          )}
        
        {state === 'payment' && (
          <div className="absolute inset-x-0 bottom-0 pb-20 flex justify-center z-50">
            <PaymentGate 
              price={event?.price || 0} 
              qrisImageUrl={event?.qris_image_url}
              onCancel={async () => {
                const stream = videoRef.current?.srcObject as MediaStream;
                stream?.getTracks().forEach(track => track.stop());
                await cancelPendingSession();
                setState('idle');
              }}
            />
          </div>
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
            videoRef={captureVideoRef}
            selectedTemplate={selectedTemplate}
            countdown={countdown}
            currentShot={currentShot}
            totalShots={Math.max(event?.shot_count || 3, selectedTemplate?.slot_count || 0)}
            lastCapturedPhoto={capturedPhotos[capturedPhotos.length - 1]}
            state={state}
            onRetake={() => {}} // Not used anymore as we have auto-advance
            onNext={handleShotNext}
            isTimeout={isTimeout}
            globalTimeLeft={globalTimeLeft}
          />
        )}

        {state === 'review' && (
          <ReviewGallery 
            photos={capturedPhotos}
            slotCount={selectedTemplate?.slot_count || 3}
            templateImageUrl={selectedTemplate?.image_url}
            onRetake={handleRetake}
            onSelectiveRetake={(idx) => {
              setCurrentShot(idx);
              setState('countdown');
            }}
            onFinalize={handleFinalize}
            isTimeout={isTimeout}
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
              setGlobalTimeLeft(null);
            }}
          />
        )}
      </AnimatePresence>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </BoothLayout>
  );
}
