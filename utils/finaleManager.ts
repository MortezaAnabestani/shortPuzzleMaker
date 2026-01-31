import { Piece } from "../hooks/usePuzzleLogic";

export interface FinalePhaseState {
  isFinale: boolean;
  pauseActive: boolean;
  waveActive: boolean;
  waveProgress: number;
  zoomScale: number;
}

export const FINALE_PAUSE = 1800;
export const WAVE_DURATION = 3500;
const INDIVIDUAL_WAVE_DURATION = 1400;

// بهینه‌سازی ریاضی: محاسبه ثابت پی تقسیم بر زمان برای حذف تقسیم در حلقه اصلی
const PI_OVER_DURATION = Math.PI / INDIVIDUAL_WAVE_DURATION;

/**
 * مدیریت وضعیت‌های زمانی و بصری فاز نهایی
 */
export const getFinaleState = (elapsedAfterFinish: number): FinalePhaseState => {
  const t = elapsedAfterFinish;
  const isFinale = t > 0;

  const pauseActive = t > 0 && t <= FINALE_PAUSE;
  const waveTime = Math.max(0, t - FINALE_PAUSE);
  const waveProgress = Math.min(waveTime / WAVE_DURATION, 1);
  const waveActive = waveTime > 0 && waveProgress < 1;

  // زوم دوربین با نرخ ۸۰۰۰۰ (طبق استاندارد پروژه)
  const zoomScale = 1 + t / 80000;

  return {
    isFinale,
    pauseActive,
    waveActive,
    waveProgress,
    zoomScale,
  };
};

/**
 * محاسبه میزان جابجایی عمودی برای افکت موج
 * بهینه‌سازی شده برای ۲۰۰۰+ قطعه با استفاده از کش داخلی
 */
export const getDiagonalWaveY = (p: Piece, t: number, vWidth: number, vHeight: number): number => {
  // اگر هنوز زمان موج نرسیده، محاسبات را انجام نده
  if (t <= FINALE_PAUSE) return 0;

  const elapsed = t - FINALE_PAUSE;

  // تکنیک Lazy Caching:
  // زمان تاخیر هر قطعه فقط یکبار محاسبه و در خود آبجکت ذخیره می‌شود.
  // این کار ۱۲۰,۰۰۰ تقسیم در ثانیه را حذف می‌کند.
  let delay = (p as any)._waveDelay;

  if (delay === undefined) {
    // محاسبه دقیق فاصله قطری (فقط بار اول اجرا می‌شود)
    // استفاده از مقادیر ثابت vWidth/vHeight برای پرفورمنس
    const normalizeFactor = 1 / (vWidth + vHeight);
    const diagDist = (p.tx + p.ty) * normalizeFactor;

    delay = diagDist * (WAVE_DURATION - INDIVIDUAL_WAVE_DURATION);

    // ذخیره در کش برای فریم‌های بعدی
    (p as any)._waveDelay = delay;
  }

  const pieceElapsed = elapsed - delay;

  // فقط اگر قطعه در بازه زمانی موج است، سینوس بگیرید
  if (pieceElapsed > 0 && pieceElapsed < INDIVIDUAL_WAVE_DURATION) {
    // استفاده از ضرب به جای تقسیم برای سرعت بیشتر
    // فرمول: Math.sin((pieceElapsed / duration) * PI)
    const ease = Math.sin(pieceElapsed * PI_OVER_DURATION);
    return -ease * 65;
  }

  return 0;
};
