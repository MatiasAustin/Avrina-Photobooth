export type MaskShape = 'square' | 'rounded-square' | 'circle' | 'heart' | 'arch' | 'flower' | 'wave-square' | 'wave-circle';

export const drawMaskPath = (ctx: CanvasRenderingContext2D | Path2D, shape: MaskShape, x: number, y: number, w: number, h: number) => {
  const cx = x + w / 2;
  const cy = y + h / 2;

  switch (shape) {
    case 'square':
      ctx.rect(x, y, w, h);
      break;
    case 'rounded-square':
      const r = Math.min(w, h) * 0.15;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      break;
    case 'circle':
      ctx.arc(cx, cy, Math.min(w, h) / 2, 0, Math.PI * 2);
      break;
    case 'arch':
      const radius = w / 2;
      ctx.moveTo(x, y + h);
      ctx.lineTo(x, y + radius);
      ctx.arc(x + radius, y + radius, radius, Math.PI, 0);
      ctx.lineTo(x + w, y + h);
      ctx.closePath();
      break;
    case 'heart':
      const topCurveHeight = h * 0.3;
      ctx.moveTo(x + w / 2, y + topCurveHeight);
      ctx.bezierCurveTo(x + w / 2, y, x, y, x, y + topCurveHeight);
      ctx.bezierCurveTo(x, y + (h + topCurveHeight) / 2, x + w / 2, y + h, x + w / 2, y + h);
      ctx.bezierCurveTo(x + w / 2, y + h, x + w, y + (h + topCurveHeight) / 2, x + w, y + topCurveHeight);
      ctx.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, y + topCurveHeight);
      ctx.closePath();
      break;
    case 'flower':
      const outR = Math.min(w, h) / 2;
      const inR = outR * 0.7;
      const petals = 8;
      ctx.moveTo(cx + outR, cy);
      for (let i = 0; i <= petals * 2; i++) {
        const angle = (i * Math.PI) / petals;
        const r = i % 2 === 0 ? outR : inR;
        ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      }
      ctx.closePath();
      break;
    case 'wave-square':
      const steps = 10;
      const waveH = 10;
      ctx.moveTo(x, y);
      for(let i=0; i<steps; i++) {
        ctx.quadraticCurveTo(x + (i+0.5)*w/steps, y + (i%2==0?waveH:-waveH), x + (i+1)*w/steps, y);
      }
      for(let i=0; i<steps; i++) {
        ctx.quadraticCurveTo(x+w + (i%2==0?waveH:-waveH), y + (i+0.5)*h/steps, x+w, y + (i+1)*h/steps);
      }
      for(let i=0; i<steps; i++) {
        ctx.quadraticCurveTo(x+w - (i+0.5)*w/steps, y+h + (i%2==0?waveH:-waveH), x+w - (i+1)*w/steps, y+h);
      }
      for(let i=0; i<steps; i++) {
        ctx.quadraticCurveTo(x - (i%2==0?waveH:-waveH), y+h - (i+0.5)*h/steps, x, y+h - (i+1)*h/steps);
      }
      ctx.closePath();
      break;
    case 'wave-circle':
       const cRadius = Math.min(w, h) / 2;
       const cSteps = 24;
       const cWave = 8;
       for (let i = 0; i <= cSteps; i++) {
         const angle = (i * Math.PI * 2) / cSteps;
         const r = cRadius + (i % 2 === 0 ? cWave : -cWave);
         const px = cx + r * Math.cos(angle);
         const py = cy + r * Math.sin(angle);
         if (i === 0) ctx.moveTo(px, py);
         else ctx.lineTo(px, py);
       }
       ctx.closePath();
       break;
    default:
      ctx.rect(x, y, w, h);
  }
};
