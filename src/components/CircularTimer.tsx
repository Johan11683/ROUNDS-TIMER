import React, { useMemo } from 'react';

interface CircularTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  size?: number;
}

export const CircularTimer: React.FC<CircularTimerProps> = ({ remainingSeconds, totalSeconds, isRunning, size = 360 }) => {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  const progress = useMemo(() => {
    const ratio =
      totalSeconds > 0
        ? Math.max(0, Math.min(1, 1 - remainingSeconds / totalSeconds))
        : 0;
    return ratio;
  }, [remainingSeconds, totalSeconds]);

  const dash = useMemo(() => `${c * progress} ${c}`, [c, progress]);

  const ticks = useMemo(() => {
    const count = 60; // graduation façon horloge
    const arr: React.ReactNode[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
      const outer = r;
      const inner = r - (i % 5 === 0 ? 18 : 10);
      const x1 = size / 2 + outer * Math.cos(angle);
      const y1 = size / 2 + outer * Math.sin(angle);
      const x2 = size / 2 + inner * Math.cos(angle);
      const y2 = size / 2 + inner * Math.sin(angle);
      arr.push(
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={i % 5 === 0 ? 2 : 1}
        />
      );
    }
    return arr;
  }, [r, size]);

  return (
    <div className={`circular ${isRunning ? 'running' : 'paused'}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="none"
        />
        <g>{ticks}</g>
        <circle
          className="circular__progress"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={dash}
          strokeDashoffset={0}
          fill="none"
        />
      </svg>
      <div className="circular__center">
        {Math.floor(remainingSeconds / 60)
          .toString()
          .padStart(2, '0')}
        <span className="circular__colon">:</span>
        {(Math.round(remainingSeconds) % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
};
