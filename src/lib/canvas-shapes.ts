export type MaskShape = 'square' | 'circle' | 'heart' | 'arch' | 'flower';

export const drawMaskPath = (ctx: CanvasRenderingContext2D | Path2D, shape: MaskShape, x: number, y: number, w: number, h: number) => {
  switch (shape) {
    case 'square':
      ctx.rect(x, y, w, h);
      break;
    case 'circle':
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2);
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
      ctx.bezierCurveTo(
        x + w / 2, y, 
        x, y, 
        x, y + topCurveHeight
      );
      ctx.bezierCurveTo(
        x, y + (h + topCurveHeight) / 2, 
        x + w / 2, y + h, 
        x + w / 2, y + h
      );
      ctx.bezierCurveTo(
        x + w / 2, y + h, 
        x + w, y + (h + topCurveHeight) / 2, 
        x + w, y + topCurveHeight
      );
      ctx.bezierCurveTo(
        x + w, y, 
        x + w / 2, y, 
        x + w / 2, y + topCurveHeight
      );
      ctx.closePath();
      break;
    case 'flower':
      const cx = x + w / 2;
      const cy = y + h / 2;
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
    default:
      ctx.rect(x, y, w, h);
  }
};
