
import { Piece } from '../hooks/usePuzzleLogic';
import { PieceShape, MovementType, PuzzleBackground } from '../types';
import { getFinaleState, getDiagonalWaveY } from './finaleManager';
import { envEngine } from './environmentRenderer';
import { renderOutroCard } from './outroRenderer';

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  img: HTMLImageElement;
  pieces: Piece[];
  elapsed: number;
  totalDuration: number;
  shape: PieceShape;
  movement: MovementType;
  background: PuzzleBackground;
  isShorts: boolean;
  particles: any[];
  physicsPieces?: Map<number, { x: number; y: number; angle: number }>;
  docSnippets?: string[]; 
  channelLogo?: HTMLImageElement;
}

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];
  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + " " + word).width;
    if (width < maxWidth) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
};

const calculateKineticTransform = (p: Piece, t: number, movement: MovementType, vWidth: number, vHeight: number) => {
  let x = p.cx + (p.tx + p.pw / 2 - p.cx) * t;
  let y = p.cy + (p.ty + p.ph / 2 - p.cy) * t;
  let rot = p.rotation * (1 - t);
  let scale = 1.0;

  switch (movement) {
    case MovementType.FLIGHT:
      const arcHeight = Math.sin(t * Math.PI) * 550; 
      y -= arcHeight;
      rot += Math.cos(t * Math.PI) * 0.6;
      scale = 1 + Math.sin(t * Math.PI) * 0.45;
      break;
    case MovementType.VORTEX:
      const angle = (1 - t) * Math.PI * 6;
      const radius = (1 - t) * 850;
      x += Math.cos(angle) * radius;
      y += Math.sin(angle) * radius;
      rot += angle;
      scale = 0.4 + t * 0.6;
      break;
    case MovementType.WAVE:
      const swellY = Math.sin(t * Math.PI * 2.5) * 110; 
      const swellX = Math.cos(t * Math.PI * 2.5) * 60; 
      x += swellX;
      y += swellY;
      rot += Math.sin(t * Math.PI * 1.5) * 0.35; 
      scale = 1 + Math.sin(t * Math.PI) * 0.15;
      break;
    case MovementType.PLAYFUL:
      const bounce = Math.abs(Math.sin(t * Math.PI * 4)) * (1 - t) * 380;
      y -= bounce;
      const squash = 1 + (Math.sin(t * Math.PI * 8) * 0.12 * (1 - t));
      scale = squash;
      break;
    case MovementType.ELASTIC:
      const snapT = t < 0.82 ? Math.pow(t / 0.82, 4) : 1 + Math.sin((t - 0.82) * Math.PI * 5) * 0.15 * (1 - t);
      scale = snapT;
      break;
    default: 
      const easeSilk = t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
      x = p.cx + (p.tx + p.pw / 2 - p.cx) * easeSilk;
      y = p.cy + (p.ty + p.ph / 2 - p.cy) * easeSilk;
      scale = 1 + Math.sin(t * Math.PI) * 0.15;
  }
  return { x, y, rot, scale };
};

export const renderPuzzleFrame = ({
  ctx, img, pieces, elapsed, totalDuration, shape, movement, background, physicsPieces, docSnippets = [], channelLogo
}: RenderOptions): number => {
  const vWidth = 1080;
  const vHeight = 2280; 
  const totalPieces = pieces.length;
  if (totalPieces === 0) return 0;

  const elapsedAfterFinish = Math.max(0, elapsed - totalDuration);
  const fState = getFinaleState(elapsedAfterFinish);

  // --- 1. ENVIRONMENT ---
  envEngine.render(ctx, img, elapsed, vWidth, vHeight);
  
  ctx.save();
  if (fState.isFinale) {
    ctx.translate(vWidth / 2, vHeight / 2);
    ctx.scale(fState.zoomScale, fState.zoomScale);
    ctx.translate(-vWidth / 2, -vHeight / 2);
  }

  // Ghost preview
  ctx.globalAlpha = 0.015; 
  ctx.drawImage(img, 0, 0, vWidth, vHeight);
  ctx.globalAlpha = 1.0;

  const sorted = [...pieces].sort((a, b) => a.zOrder - b.zOrder);
  const completedPieces: any[] = [];
  const movingPieces: any[] = [];

  for (const p of sorted) {
    const delay = (p.assemblyOrder / totalPieces) * (totalDuration - 2700);
    const tRaw = Math.max(0, Math.min((elapsed - delay) / 2700, 1));
    (p as any).tRaw = tRaw; 
    if (physicsPieces?.has(p.id)) {
      movingPieces.push(p);
    } else if (tRaw >= 1) {
      completedPieces.push(p);
    } else if (tRaw > 0) {
      movingPieces.push(p);
    }
  }

  // --- 2. PIECES ---
  for (const p of completedPieces) {
    const waveY = getDiagonalWaveY(p, elapsedAfterFinish, vWidth, vHeight);
    const drawX = p.tx - (p.cachedCanvas!.width - p.pw) / 2;
    const drawY = p.ty - (p.cachedCanvas!.height - p.ph) / 2 + waveY;
    ctx.drawImage(p.cachedCanvas!, drawX, drawY);
  }

  for (const p of movingPieces) {
    const physicsData = physicsPieces?.get(p.id);
    if (physicsData) {
      ctx.save();
      ctx.translate(physicsData.x, physicsData.y);
      ctx.rotate(physicsData.angle);
      ctx.drawImage(p.cachedCanvas!, -p.cachedCanvas!.width / 2, -p.cachedCanvas!.height / 2);
      ctx.restore();
      continue;
    }
    const tRaw = (p as any).tRaw;
    const pos = calculateKineticTransform(p, tRaw, movement, vWidth, vHeight);
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate(pos.rot);
    ctx.scale(pos.scale, pos.scale);
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 35 + (pos.scale - 1) * 150;
    ctx.drawImage(p.cachedCanvas!, -p.cachedCanvas!.width / 2, -p.cachedCanvas!.height / 2);
    ctx.restore();
  }
  ctx.restore();

  // --- 3. DOCUMENTARY SNIPPETS (About the Puzzle) ---
  // Only show during assembly, before physics/outro takes over
  if (docSnippets.length > 0 && !physicsPieces) {
    const progressPercent = (Math.min(elapsed, totalDuration) / totalDuration) * 100;
    const thresholds = [15, 35, 55, 75, 90];
    const activeIdx = thresholds.findIndex(t => progressPercent >= t && progressPercent < t + 9);
    
    if (activeIdx !== -1 && docSnippets[activeIdx]) {
      const text = docSnippets[activeIdx];
      ctx.save();
      const boxW = vWidth * 0.92; 
      const boxX = (vWidth - boxW) / 2;
      const boxY = vHeight * 0.74; 
      
      ctx.font = 'bold 32px Inter, sans-serif'; 
      const lines = wrapText(ctx, text, boxW - 140); 
      const lineHeight = 54;
      const boxH = 180 + (lines.length * lineHeight);
      
      const floatY = Math.sin(elapsed / 600) * 8;
      ctx.translate(0, floatY);

      // Glass Box Style
      const grad = ctx.createLinearGradient(0, boxY, 0, boxY + boxH);
      grad.addColorStop(0, 'rgba(15, 20, 45, 0.95)');
      grad.addColorStop(1, 'rgba(5, 5, 20, 0.98)');
      ctx.fillStyle = grad;
      ctx.roundRect(boxX, boxY, boxW, boxH, 50);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(70, 140, 255, 0.4)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // "DID YOU KNOW?" Label
      ctx.fillStyle = 'rgba(70, 140, 255, 1)';
      ctx.font = 'black 24px Inter, sans-serif';
      ctx.fillText('DID YOU KNOW?', boxX + 70, boxY + 75);

      // Divider Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(boxX + 65, boxY + 105);
      ctx.lineTo(boxX + boxW - 65, boxY + 105);
      ctx.stroke();

      // Content Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px Inter, sans-serif'; 
      lines.forEach((line, i) => {
        ctx.fillText(line, boxX + 70, boxY + 175 + (i * lineHeight));
      });

      ctx.restore();
    }
  }

  // --- 4. CALL INDEPENDENT OUTRO MODULE ---
  if (physicsPieces) {
    renderOutroCard({ ctx, vWidth, vHeight, elapsedAfterFinish, channelLogo });
  }
  
  return (completedPieces.length / totalPieces) * 100;
};
