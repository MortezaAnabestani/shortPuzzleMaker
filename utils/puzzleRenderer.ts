import { Piece } from "../hooks/usePuzzleLogic";
import { PieceShape, MovementType, PuzzleBackground, StoryArc } from "../types";
import { getFinaleState, getDiagonalWaveY } from "./finaleManager";
import { envEngine } from "./environmentRenderer";
import { renderOutroCard } from "./outroRenderer";
import { updateTrailHistory, renderTrailEffect, clearTrailForPiece } from "./trailEffects";

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
  storyArc?: StoryArc | null;
  channelLogo?: HTMLImageElement;
}

// ککش کردن نتایج wrapText برای جلوگیری از محاسبات سنگین در هر فریم
const textCache: Record<string, string[]> = {};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const cacheKey = `${text}_${maxWidth}`;
  if (textCache[cacheKey]) return textCache[cacheKey];

  const words = text.split(" ");
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
  textCache[cacheKey] = lines;
  return lines;
};

const calculateKineticTransform = (
  p: Piece,
  t: number,
  movement: MovementType,
  vWidth: number,
  vHeight: number,
) => {
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
      const squash = 1 + Math.sin(t * Math.PI * 8) * 0.12 * (1 - t);
      scale = squash;
      break;
    case MovementType.ELASTIC:
      const snapT =
        t < 0.82 ? Math.pow(t / 0.82, 4) : 1 + Math.sin((t - 0.82) * Math.PI * 5) * 0.15 * (1 - t);
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
  ctx,
  img,
  pieces,
  elapsed,
  totalDuration,
  shape,
  movement,
  background,
  physicsPieces,
  docSnippets = [],
  storyArc,
  channelLogo,
}: RenderOptions): number => {
  const vWidth = 1080;
  const vHeight = 2280;
  const totalPieces = pieces.length;
  if (totalPieces === 0) return 0;

  const elapsedAfterFinish = Math.max(0, elapsed - totalDuration);
  const fState = getFinaleState(elapsedAfterFinish);

  // --- 1. ENVIRONMENT (لایه پس‌زمینه) ---
  envEngine.render(ctx, img, elapsed, vWidth, vHeight);

  ctx.save();
  if (fState.isFinale) {
    ctx.translate(vWidth / 2, vHeight / 2);
    ctx.scale(fState.zoomScale, fState.zoomScale);
    ctx.translate(-vWidth / 2, -vHeight / 2);
  }

  // Ghost preview (تصویر کمرنگ راهنما)
  ctx.globalAlpha = 0.015;
  ctx.drawImage(img, 0, 0, vWidth, vHeight);
  ctx.globalAlpha = 1.0;

  let completedCount = 0;

  // --- 2. SINGLE LOOP DRAWING (پردازش هوشمند قطعات) ---
  // توجه: دیگر از pieces.sort استفاده نمی‌کنیم چون در usePuzzleLogic قبلاً مرتب شده است.
  for (let i = 0; i < totalPieces; i++) {
    const p = pieces[i];
    const delay = (p.assemblyOrder / totalPieces) * (totalDuration - 2700);
    const tRaw = Math.max(0, Math.min((elapsed - delay) / 2700, 1));

    // انتخاب هوشمند منبع تصویر (Bitmap اولویت دارد)
    const visual = p.cachedBitmap || p.cachedCanvas;
    if (!visual) continue;

    // وضعیت فیزیک (انفجار پایان ویدیو)
    const physicsData = physicsPieces?.get(p.id);
    if (physicsData) {
      ctx.save();
      ctx.translate(physicsData.x, physicsData.y);
      ctx.rotate(physicsData.angle);
      ctx.drawImage(visual, -visual.width / 2, -visual.height / 2);
      ctx.restore();
      continue;
    }

    if (tRaw >= 1) {
      // الف) قطعاتی که در جای خود فیکس شده‌اند
      completedCount++;
      clearTrailForPiece(p.id);
      const waveY = getDiagonalWaveY(p, elapsedAfterFinish, vWidth, vHeight);

      // محاسبه دقیق موقعیت برای انطباق کامل با پدینگ
      const drawX = p.tx - (visual.width - p.pw) / 2;
      const drawY = p.ty - (visual.height - p.ph) / 2 + waveY;

      ctx.drawImage(visual, drawX, drawY);
    } else if (tRaw > 0) {
      // ب) قطعاتی که در حال پرواز به سمت هدف هستند
      const pos = calculateKineticTransform(p, tRaw, movement, vWidth, vHeight);

      // افکت دنباله (Trail) - فقط در اوج حرکت
      if (tRaw >= 0.1 && tRaw <= 0.85) {
        updateTrailHistory(p, pos.x, pos.y, pos.rot, pos.scale, elapsed, movement, tRaw);
        renderTrailEffect(ctx, p, movement);
      }

      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.rotate(pos.rot);
      ctx.scale(pos.scale, pos.scale);

      // بهینه‌سازی سایه: استفاده از مستطیل ساده به جای shadowBlur سنگین
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(-p.pw / 2 + 8, -p.ph / 2 + 8, p.pw, p.ph);

      // رسم قطعه
      ctx.drawImage(visual, -visual.width / 2, -visual.height / 2);
      ctx.restore();
    }
  }
  ctx.restore();

  // --- 3. STORY ARC & UI (بخش روایی و متن‌ها) ---
  if (!physicsPieces) {
    const progressPercent = (Math.min(elapsed, totalDuration) / totalDuration) * 100;
    let text = "";
    let label = "DID YOU KNOW?";
    let labelColor = "rgba(70, 140, 255, 1)";
    let borderColor = "rgba(70, 140, 255, 0.4)";

    // مدیریت سناریوی داستانی
    if (storyArc) {
      if (progressPercent >= 5 && progressPercent < 15) {
        text = storyArc.hook;
        label = "MYSTERY HOOK";
        labelColor = "rgba(255, 220, 100, 1)";
      } else if (progressPercent >= 20 && progressPercent < 30) {
        text = storyArc.buildup[0] || "";
        label = "DISCOVERY";
      } else if (progressPercent >= 40 && progressPercent < 50) {
        text = storyArc.buildup[1] || "";
        label = "DISCOVERY";
      } else if (progressPercent >= 60 && progressPercent < 70) {
        text = storyArc.buildup[2] || "";
        label = "DISCOVERY";
      } else if (progressPercent >= 85 && progressPercent < 92) {
        text = storyArc.climax;
        label = "REVELATION";
        labelColor = "rgba(200, 100, 255, 1)";
      } else if (progressPercent >= 95) {
        text = storyArc.reveal;
        label = "TRUTH REVEALED";
        labelColor = "rgba(100, 255, 150, 1)";
      }
    } else if (docSnippets.length > 0) {
      const thresholds = [15, 35, 55, 75, 90];
      const activeIdx = thresholds.findIndex((t) => progressPercent >= t && progressPercent < t + 9);
      if (activeIdx !== -1 && docSnippets[activeIdx]) text = docSnippets[activeIdx];
    }

    if (text) {
      ctx.save();
      const boxW = vWidth * 0.92;
      const boxX = (vWidth - boxW) / 2;
      const boxY = vHeight * 0.74;

      ctx.font = "bold 32px Inter, sans-serif";
      const lines = wrapText(ctx, text, boxW - 140);
      const lineHeight = 54;
      const boxH = 180 + lines.length * lineHeight;

      const floatY = Math.sin(elapsed / 600) * 8;
      ctx.translate(0, floatY);

      // افکت شیشه‌ای باکس متن
      const grad = ctx.createLinearGradient(0, boxY, 0, boxY + boxH);
      grad.addColorStop(0, "rgba(15, 20, 45, 0.95)");
      grad.addColorStop(1, "rgba(5, 5, 20, 0.98)");
      ctx.fillStyle = grad;
      ctx.roundRect(boxX, boxY, boxW, boxH, 50);
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4;
      ctx.stroke();

      // رسم برچسب و محتوا
      ctx.fillStyle = labelColor;
      ctx.font = "black 24px Inter, sans-serif";
      ctx.fillText(label, boxX + 70, boxY + 75);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px Inter, sans-serif";
      lines.forEach((line, i) => {
        ctx.fillText(line, boxX + 70, boxY + 175 + i * lineHeight);
      });
      ctx.restore();
    }
  }

  // --- 4. OUTRO (کارت پایانی) ---
  if (physicsPieces) {
    renderOutroCard({ ctx, vWidth, vHeight, elapsedAfterFinish, channelLogo });
  }

  return (completedCount / totalPieces) * 100;
};
