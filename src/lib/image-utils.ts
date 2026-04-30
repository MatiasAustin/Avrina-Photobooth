import { PhotoTemplate } from '../types';
import { PLATFORM_NAME } from './constants';

export interface PhotoTransform {
  x: number;
  y: number;
  scale: number;
}

export const generatePhotoStrip = async (
  photos: string[], 
  transforms: PhotoTransform[] | undefined,
  selectedTemplate: PhotoTemplate | null,
  eventName: string | undefined
): Promise<string> => {
  try {
    if (!photos || photos.length === 0) return '';
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return photos[0];

    // 4x6 Ratio: 1200x1800
    const canvasWidth = 1200;
    const canvasHeight = 1800;
    
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
        // Remove query params to avoid cache/CORS issues if any, though it should be fine
        const cleanUrl = selectedTemplate.image_url.split('?')[0];
        img.src = cleanUrl;
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
      });
    }

    // --- NORMALIZED POSITIONING LOGIC (0-1) ---
    // Draw Photos behind template
    loadedImages.forEach((img, i) => {
      const transform = transforms ? transforms[i] : { x: 0, y: 0, scale: 1 };
      
      // Match UI width of 42% of card
      const photoWidth = canvasWidth * 0.42; 
      const photoHeight = photoWidth; // 1:1 aspect

      const x = (transform.x || 0) * canvasWidth;
      const y = (transform.y || 0) * canvasHeight;
      const scale = transform.scale || 1;

      ctx.save();
      // Clipping region to match the photo square
      ctx.beginPath();
      ctx.rect(x, y, photoWidth, photoHeight);
      ctx.clip();

      // Draw image centered in the slot with zoom scale
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const drawW = photoWidth * scale;
      const drawH = photoHeight * scale;

      let imgDrawW, imgDrawH;
      if (imgAspect > 1) { // Landscape
        imgDrawH = drawH;
        imgDrawW = drawH * imgAspect;
      } else {
        imgDrawW = drawW;
        imgDrawH = drawW / imgAspect;
      }

      ctx.drawImage(
        img, 
        x + (photoWidth/2) - (imgDrawW/2), 
        y + (photoHeight/2) - (imgDrawH/2), 
        imgDrawW, 
        imgDrawH
      );
      ctx.restore();
    });

    // Draw Template Overlay on TOP
    if (templateImg) {
      ctx.drawImage(templateImg, 0, 0, canvasWidth, canvasHeight);
    } else {
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(eventName?.toUpperCase() || `${PLATFORM_NAME.toUpperCase()} NETWORK`, canvasWidth / 2, canvasHeight - 100);
    }

    // Draw Live Timestamp if configured in URL
    if (selectedTemplate?.image_url?.includes('?ts=')) {
       try {
         const tsParam = new URL(selectedTemplate.image_url).searchParams.get('ts');
         if (tsParam) {
           const decoded = JSON.parse(decodeURIComponent(tsParam));
           const configs = Array.isArray(decoded) ? decoded : [decoded];
           
           configs.forEach(tsConfig => {
             ctx.save();
             ctx.translate(tsConfig.x, tsConfig.y);
             ctx.rotate((tsConfig.r || 0) * Math.PI / 180);
             ctx.scale(tsConfig.s, tsConfig.s);
             
             ctx.font = `bold 64px ${tsConfig.f || 'sans-serif'}`;
             ctx.fillStyle = tsConfig.c || '#000000';
             ctx.textAlign = 'center';
             ctx.textBaseline = 'middle';
             
             const liveDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
             ctx.fillText(liveDate, 0, 0);
             ctx.restore();
           });
         }
       } catch (e) { console.error("Failed to parse timestamp config", e); }
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
