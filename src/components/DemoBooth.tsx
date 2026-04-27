import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLATFORM_NAME } from '../lib/constants';
import { AnimatePresence, motion } from 'motion/react';
import { BoothState } from '../types';
import { BoothHero } from './booth/BoothHero';
import { TemplatePicker } from './booth/TemplatePicker';
import { CaptureStage } from './booth/CaptureStage';
import { ReviewGallery } from './booth/ReviewGallery';
import { SessionSummary } from './booth/SessionSummary';
import { BoothLayout } from './booth/BoothLayout';

// Mock data for trials
const MOCK_EVENT = {
  id: 'demo-event',
  name: `${PLATFORM_NAME.toUpperCase()} TRIAL BOOTH`,
  timer: 3,
  shot_count: 6,
  price: 0,
  slug: 'demo'
};

const MOCK_TEMPLATES = [
  { 
    id: 't1', 
    event_id: 'demo-event',
    name: 'Clean White', 
    image_url: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=800&q=80',
    created_at: new Date().toISOString()
  }
];

export function DemoBooth() {
  const navigate = useNavigate();
  
  const [state, setState] = useState<BoothState>('idle');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [currentShot, setCurrentShot] = useState(0);
  const [finalStripUrl, setFinalStripUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleStart = () => {
    // Skip template selection as requested and no overlay
    proceedToCapture();
  };

  const activeStream = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      if (!activeStream.current) {
        activeStream.current = await navigator.mediaDevices.getUserMedia({ 
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } 
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = activeStream.current;
        await videoRef.current.play().catch(console.warn);
      }
    } catch (e) {
      alert("Camera access required for demo.");
      setState('idle');
    }
  };

  const stopCamera = () => {
    if (activeStream.current) {
      activeStream.current.getTracks().forEach(t => t.stop());
      activeStream.current = null;
    }
  };

  useEffect(() => {
    const isCaptureState = ['countdown', 'capture', 'review_shot'].includes(state);
    if (isCaptureState) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [state]);

  const proceedToCapture = () => {
    setState('countdown');
    startCountdown();
  };

  const startCountdown = () => {
    setCountdown(MOCK_EVENT.timer);
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
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.save();
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        context.restore();
        
        const photoData = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhotos(prev => [...prev, photoData]);
        setState('review_shot');
      }
    }
  };

  const handleShotNext = () => {
    const nextShot = currentShot + 1;
    if (nextShot < MOCK_EVENT.shot_count) {
      setCurrentShot(nextShot);
      setState('countdown');
      startCountdown();
    } else {
      stopCamera();
      setState('review');
    }
  };

  // High quality "2-Strip" layout (2 columns of 3 photos)
  const generatePhotoStrip = async (photos: string[]) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return photos[0];

    const margin = 30;
    const stripWidth = 1000;
    const photoWidth = (stripWidth - (margin * 3)) / 2;
    const photoHeight = photoWidth; // Maintain square look
    
    // Total height: 3 rows of photos + gaps + branding
    const stripHeight = (margin * 4) + (photoHeight * 3) + 160; 

    canvas.width = stripWidth;
    canvas.height = stripHeight;
    
    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, stripWidth, stripHeight);

    const loadedImages = await Promise.all(
      photos.map(src => new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
      }))
    );

    loadedImages.slice(0, 6).forEach((img, i) => {
        const col = i < 3 ? 0 : 1;
        const row = i % 3;
        
        const x = margin + col * (photoWidth + margin);
        const y = margin + row * (photoHeight + margin);
        
        // NO STRETCH LOGIC: Center Crop
        const imgAspect = img.width / img.height;
        const targetAspect = photoWidth / photoHeight;
        
        let sx, sy, sw, sh;
        if (imgAspect > targetAspect) {
          sh = img.height;
          sw = img.height * targetAspect;
          sx = (img.width - sw) / 2;
          sy = 0;
        } else {
          sw = img.width;
          sh = img.width / targetAspect;
          sx = 0;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, x, y, photoWidth, photoHeight);
        
        // Frames
        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, photoWidth, photoHeight);
    });

    // Central Branding
    ctx.fillStyle = '#000000';
    ctx.font = 'black 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '6px';
    ctx.fillText(`${PLATFORM_NAME.toUpperCase()} TRIAL`, stripWidth/2, stripHeight - 90);
    
    ctx.font = '14px monospace';
    ctx.fillStyle = '#999999';
    ctx.fillText('DEMO SESSION • ' + new Date().toLocaleDateString().toUpperCase(), stripWidth/2, stripHeight - 55);

    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const handleFinalize = async (arrangedPhotos: string[]) => {
    const strip = await generatePhotoStrip(arrangedPhotos);
    setFinalStripUrl(strip);
    setState('summary');

    // Auto-trigger download for demo speed
    const link = document.createElement('a');
    link.href = strip;
    link.download = `trial-photostrip-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <BoothLayout>
       <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
         Demo Mode: Data not saved to cloud
       </div>

      <AnimatePresence mode="wait">
        {state === 'idle' && <BoothHero onStart={handleStart} />}
        
        {state === 'template_selection' && (
          <TemplatePicker 
            templates={MOCK_TEMPLATES} 
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
            totalShots={MOCK_EVENT.shot_count}
            lastCapturedPhoto={capturedPhotos[capturedPhotos.length - 1]}
            state={state}
            onRetake={() => {
                setCapturedPhotos(prev => prev.slice(0, -1));
                setState('countdown');
                startCountdown();
            }}
            onNext={handleShotNext}
          />
        )}

        {state === 'review' && (
          <ReviewGallery 
            photos={capturedPhotos}
            onRetake={() => {
                setCapturedPhotos([]);
                setCurrentShot(0);
                setState('template_selection');
            }}
            onFinalize={handleFinalize}
          />
        )}

        {state === 'summary' && (
          <SessionSummary 
            sessionId="demo"
            eventName="Trial Session"
            photoUrl={finalStripUrl || ''}
            onPrint={() => alert("Printing is locked in Demo Mode. Connect your own printer in the Pro plan!")}
            onReset={() => navigate('/')}
          />
        )}
      </AnimatePresence>
      <canvas ref={canvasRef} className="hidden" />
    </BoothLayout>
  );
}
