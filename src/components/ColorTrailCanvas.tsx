import { useEffect, useRef, type PointerEvent } from 'react';

type TrailPoint = {
  born: number;
  directionX: number;
  directionY: number;
  speed: number;
  x: number;
  y: number;
};

type PointerSample = {
  time: number;
  x: number;
  y: number;
};

type ColorTrailCanvasProps = {
  src: string;
  enabled: boolean;
};

const TRAIL_DURATION = 1300;
const TRAIL_LIMIT = 32;
const PAUSE_THRESHOLD = 180;
const MIN_SAMPLE_DISTANCE = 5;

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value));
};

function ColorTrailCanvas({ src, enabled }: ColorTrailCanvasProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pointsRef = useRef<TrailPoint[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastSampleRef = useRef<PointerSample | null>(null);
  const hasFinePointerRef = useRef(false);

  useEffect(() => {
    hasFinePointerRef.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!enabled || !hasFinePointerRef.current) {
      return;
    }

    const image = new Image();
    image.src = src;
    imageRef.current = image;

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      pointsRef.current = [];
      lastSampleRef.current = null;
      imageRef.current = null;
    };
  }, [enabled, src]);

  const resizeCanvas = () => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;

    if (!wrap || !canvas) {
      return null;
    }

    const rect = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }

    return { width, height, dpr };
  };

  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    width: number,
    height: number,
  ) => {
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const x = (width - drawWidth) / 2;
    const y = (height - drawHeight) / 2;

    ctx.drawImage(image, x, y, drawWidth, drawHeight);
  };

  const drawTrailPoint = (
    ctx: CanvasRenderingContext2D,
    point: TrailPoint,
    now: number,
    dpr: number,
  ) => {
    const age = (now - point.born) / TRAIL_DURATION;
    const fade = Math.max(0, 1 - age);
    const radius = (10 + point.speed * 34 + age * (12 + point.speed * 42)) * dpr;
    const alpha = fade * fade * (0.28 + point.speed * 0.72);
    const tail = radius * point.speed * (0.55 + age * 0.3);

    ctx.save();
    ctx.translate(
      point.x * dpr - point.directionX * tail,
      point.y * dpr - point.directionY * tail,
    );
    ctx.rotate(Math.atan2(point.directionY, point.directionX));
    ctx.scale(1 + point.speed * 1.25, 0.7 - point.speed * 0.12);

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(0.34, `rgba(255,255,255,${alpha * 0.62})`);
    gradient.addColorStop(0.78, `rgba(255,255,255,${alpha * 0.12})`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const size = resizeCanvas();

    if (!canvas || !image || !image.complete || !image.naturalWidth || !size) {
      rafRef.current = null;
      return;
    }

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      rafRef.current = null;
      return;
    }

    const now = performance.now();
    pointsRef.current = pointsRef.current.filter((point) => now - point.born < TRAIL_DURATION);

    ctx.clearRect(0, 0, size.width, size.height);

    for (const point of pointsRef.current) {
      drawTrailPoint(ctx, point, now, size.dpr);
    }

    if (pointsRef.current.length > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-in';
      ctx.filter = 'saturate(1.2) contrast(1.04)';
      drawImageCover(ctx, image, size.width, size.height);
      ctx.restore();

      rafRef.current = window.requestAnimationFrame(draw);
      return;
    }

    rafRef.current = null;
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!enabled || !hasFinePointerRef.current || event.pointerType !== 'mouse' || !wrapRef.current) {
      return;
    }

    const rect = wrapRef.current.getBoundingClientRect();
    const now = performance.now();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const previous = lastSampleRef.current;

    if (!previous || now - previous.time > PAUSE_THRESHOLD) {
      lastSampleRef.current = { time: now, x, y };
      return;
    }

    const dx = x - previous.x;
    const dy = y - previous.y;
    const distance = Math.hypot(dx, dy);

    if (distance < MIN_SAMPLE_DISTANCE) {
      return;
    }

    const elapsed = Math.max(16, now - previous.time);
    const speed = clamp(distance / elapsed / 1.15, 0.08, 1);

    lastSampleRef.current = { time: now, x, y };
    pointsRef.current = [
      ...pointsRef.current.filter((point) => now - point.born < TRAIL_DURATION),
      {
        born: now,
        directionX: dx / distance,
        directionY: dy / distance,
        speed,
        x,
        y,
      },
    ].slice(-TRAIL_LIMIT);

    if (rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(draw);
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0"
      onPointerMove={handlePointerMove}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none" />
    </div>
  );
}

export default ColorTrailCanvas;
