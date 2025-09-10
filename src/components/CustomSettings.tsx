import React from 'react';
import { RoundConfig } from '../hooks/useRoundTimer';

interface CustomSettingsProps {
  rounds: RoundConfig[];
  onChange(rounds: RoundConfig[]): void;
  onStartAt(index: number): void;
  onAddRound(): void;
}

export const CustomSettings: React.FC<CustomSettingsProps> = ({ rounds, onChange, onStartAt, onAddRound }) => {
  const update = (i: number, key: keyof RoundConfig, value: number) => {
    const next = rounds.slice();
    next[i] = { ...next[i], [key]: value } as RoundConfig;
    onChange(next);
  };

  // drag & drop (desktop + long press on mobile ~1s)
  let pressTimer: number | null = null;
  const enableDragAfterHold = (el: HTMLElement) => {
    if (!el) return;
    el.draggable = false;
    el.addEventListener('touchstart', () => {
      pressTimer = window.setTimeout(() => { el.draggable = true; }, 800);
    }, { passive: true });
    el.addEventListener('touchend', () => {
      if (pressTimer) window.clearTimeout(pressTimer);
      el.draggable = false;
    });
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData('text/plain', String(index));
    (e.currentTarget as HTMLDivElement).classList.add('dragging');
  };
  const onDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.currentTarget as HTMLDivElement).classList.remove('dragging');
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>, target: number) => {
    e.preventDefault();
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (Number.isNaN(from)) return;
    const next = rounds.slice();
    const [moved] = next.splice(from, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };
  const allow = (e: React.DragEvent) => e.preventDefault();

  return (
    <div className="custom">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button className="btn-icon" onClick={onAddRound}>+</button>
      </div>
      <div className="custom__scroller">
        {rounds.map((r, i) => (
          <div
            key={i}
            className="custom__row"
            onDragOver={allow}
            onDrop={(e) => onDrop(e, i)}
            onDragStart={(e) => onDragStart(e, i)}
            onDragEnd={onDragEnd}
            ref={(el) => el && enableDragAfterHold(el)}
          >
            <button className="danger btn-icon small" onClick={() => {
              const next = rounds.slice();
              next.splice(i, 1);
              onChange(next);
            }}>✕</button>
            <div className="grow">
              <label>round {i + 1}</label>
              <input type="number" min={10} max={1800} step={5} value={r.workSeconds} onChange={(e) => update(i, 'workSeconds', Number(e.target.value))} />
            </div>
            <div className="grow">
              <label>pause</label>
              <input type="number" min={0} max={900} step={5} value={r.restSeconds} onChange={(e) => update(i, 'restSeconds', Number(e.target.value))} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


