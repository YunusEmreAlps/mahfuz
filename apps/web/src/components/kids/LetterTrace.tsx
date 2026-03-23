import { useRef, useEffect, useState, useCallback } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import type { ArabicLetter } from "~/lib/kids-constants";

interface LetterTraceProps {
  letter: ArabicLetter;
  onComplete: () => void;
}

export function LetterTrace({ letter, onComplete }: LetterTraceProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);
  const [done, setDone] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const CANVAS_SIZE = 280;
  const REQUIRED_STROKES = 3;

  // Draw guide letter
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Guide letter (faded)
    ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
    ctx.font = `180px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    ctx.fillText(letter.arabic, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);

    // Border guide
    ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(10, 10, CANVAS_SIZE - 20, CANVAS_SIZE - 20);
    ctx.setLineDash([]);
  }, [letter.arabic]);

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = CANVAS_SIZE / rect.width;
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scale, y: (touch.clientY - rect.top) * scale };
    }
    return { x: (e.clientX - rect.left) * scale, y: (e.clientY - rect.top) * scale };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (done) return;
    e.preventDefault();
    setDrawing(true);
    lastPos.current = getPos(e);
  }, [done, getPos]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing || done) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !lastPos.current) return;

    const pos = getPos(e);
    if (!pos) return;

    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPos.current = pos;
  }, [drawing, done, getPos]);

  const endDraw = useCallback(() => {
    if (!drawing) return;
    setDrawing(false);
    lastPos.current = null;
    const newCount = strokeCount + 1;
    setStrokeCount(newCount);
    if (newCount >= REQUIRED_STROKES) {
      setDone(true);
    }
  }, [drawing, strokeCount]);

  const clearCanvas = useCallback(() => {
    setStrokeCount(0);
    setDone(false);
    // Re-draw guide
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = "rgba(16, 185, 129, 0.12)";
    ctx.font = `180px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    ctx.fillText(letter.arabic, CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 10);
    ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(10, 10, CANVAS_SIZE - 20, CANVAS_SIZE - 20);
    ctx.setLineDash([]);
  }, [letter.arabic]);

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <h2 className="text-xl font-bold text-blue-700">{t.kids.letters.trace}</h2>
      <p className="text-[14px] text-gray-500">
        <span className="font-arabic text-lg" dir="rtl">{letter.arabic}</span> — {letter.name}
      </p>

      {/* Canvas */}
      <div className="rounded-2xl border-2 border-dashed border-emerald-200 bg-white p-1 shadow-sm">
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="touch-none rounded-xl"
          style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {Array.from({ length: REQUIRED_STROKES }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full transition-all ${
              i < strokeCount ? "bg-emerald-400 scale-110" : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={clearCanvas}
          className="rounded-xl border border-gray-200 px-6 py-3 text-[14px] font-semibold text-gray-500 active:scale-95"
        >
          {t.kids.common.tryAgain}
        </button>
        {done && (
          <button
            onClick={onComplete}
            className="rounded-xl bg-emerald-500 px-8 py-3 text-[14px] font-bold text-white shadow-md active:scale-95"
          >
            {t.kids.common.next} →
          </button>
        )}
      </div>
    </div>
  );
}
