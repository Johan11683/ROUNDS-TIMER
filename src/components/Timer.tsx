import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  useRoundTimer,
  TimerSettings,
  RoundConfig,
} from '../hooks/useRoundTimer';
import {
  playPhaseChange,
  playCountdown321,
  playClap10sRemaining,
  playBellAtZero,
} from '../utils/sounds';
import { CircularTimer } from './CircularTimer';
import { FullscreenButton } from './FullscreenButton';
import { saveState } from '../utils/storage';

/* === Helpers MM:SS =================================== */
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function secondsToMMSS(total: number): string {
  const sec = Math.max(0, Math.floor(total));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function mmssToSeconds(mmss: string): number {
  const [m = '0', s = '0'] = (mmss || '').split(':');
  const mi = clamp(parseInt(m, 10) || 0, 0, 60);
  const se = clamp(parseInt(s, 10) || 0, 0, 59);
  return mi * 60 + se;
}

/* === Input MM:SS ===================================== */
const MmssInput: React.FC<{
  label: string;
  seconds: number;
  onChangeSeconds: (sec: number) => void;
  id?: string;
}> = ({ label, seconds, onChangeSeconds, id }) => {
  const [digits, setDigits] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!touched) setDigits('');
  }, [seconds, touched]);

  const handleFocus = () => {
    setDigits('');
    setTouched(true);
    onChangeSeconds(0);

    // 🔒 force curseur en fin
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(5, 5);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(-4);
    setDigits(raw);

    const padded = raw.padStart(4, '0');
    const mins = clamp(parseInt(padded.slice(0, 2), 10), 0, 60);
    const secs = clamp(parseInt(padded.slice(2, 4), 10), 0, 59);

    onChangeSeconds(mins * 60 + secs);

    // 🔒 remet curseur à la fin même après saisie
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(5, 5);
    });
  };

  const display = (() => {
    if (digits === '') return secondsToMMSS(seconds);
    const padded = digits.padStart(4, '0');
    const mins = clamp(parseInt(padded.slice(0, 2), 10), 0, 60);
    const secs = clamp(parseInt(padded.slice(2, 4), 10), 0, 59);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  })();

  return (
    <div className="input-block">
      <input
        id={id}
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="00:00"
        value={display}
        onFocus={handleFocus}
        onChange={handleChange}
        className="input-focus"
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
};
/* ====================================================== */

export const Timer: React.FC<{
  fullscreenMode?: boolean;
  onOpenSettings?: () => void;
  onExitFullscreen?: () => void;
  settings: TimerSettings;
  onChangeSettings: (s: TimerSettings) => void;
}> = ({
  fullscreenMode = false,
  onOpenSettings,
  onExitFullscreen,
  settings,
  onChangeSettings,
}) => {
  // 🔹 Valeurs par défaut
  const defaults: TimerSettings = {
    totalRounds: 3,
    workSeconds: 180,       // 03:00
    restSeconds: 60,        // 01:00
    countdownSeconds: 3,    // 00:03
  };

  const timer = useRoundTimer({ ...defaults, ...settings });

  useEffect(() => {
    onChangeSettings(timer.settings);
    saveState(timer.settings);
  }, [timer.settings, onChangeSettings]);

  const roundsLabel = useMemo(
    () =>
      `ROUND ${Math.min(
        timer.state.roundIndex + 1,
        timer.settings.totalRounds
      )}/${timer.settings.totalRounds}`,
    [timer.state.roundIndex, timer.settings.totalRounds]
  );

  const cssPhase = useMemo(
    () =>
      timer.state.phase === 'work'
        ? 'phase--work'
        : timer.state.phase === 'rest'
        ? 'phase--rest'
        : '',
    [timer.state.phase]
  );

  const lastPhaseRef = useRef(timer.state.phase);
  useEffect(() => {
    if (timer.state.phase !== lastPhaseRef.current) {
      playPhaseChange(timer.state.phase);
      lastPhaseRef.current = timer.state.phase;
    }
  }, [timer.state.phase]);

  const lastSecondRef = useRef(Math.ceil(timer.state.remainingSeconds));
  useEffect(() => {
    const current = Math.ceil(timer.state.remainingSeconds);
    const prev = lastSecondRef.current;
    lastSecondRef.current = current;
    if (!timer.state.isRunning) return;

    const isPhaseWithEnd =
      timer.state.phase === 'work' ||
      timer.state.phase === 'rest' ||
      timer.state.phase === 'idle';

    if (isPhaseWithEnd && prev > 3 && current === 3) playCountdown321();
    if (timer.state.phase === 'work' && prev > 10 && current === 10)
      playClap10sRemaining();
    if (isPhaseWithEnd && current === 0 && prev > 0) playBellAtZero();
  }, [timer.state.remainingSeconds, timer.state.isRunning, timer.state.phase]);

  return (
    <div className={`card ${cssPhase}`}>
      <div className="timer__panel">
        <div className="timer__phase">{roundsLabel}</div>
        <div className="panel-actions">
          {!fullscreenMode && (
            <button className="secondary btn-icon" onClick={onOpenSettings}>
              ⚙
            </button>
          )}
          {fullscreenMode ? (
            <FullscreenButton exitOnly onExit={onExitFullscreen} />
          ) : (
            <FullscreenButton />
          )}
        </div>
        <div className="timer__circle">
          <CircularTimer
            remainingSeconds={timer.state.remainingSeconds}
            totalSeconds={
              timer.state.phase === 'work'
                ? timer.getRoundConfig(timer.state.roundIndex).workSeconds
                : timer.state.phase === 'rest'
                ? timer.getRoundConfig(timer.state.roundIndex).restSeconds
                : timer.settings.countdownSeconds ?? 0
            }
            isRunning={timer.state.isRunning}
            size={
              fullscreenMode
                ? Math.min(window.innerWidth, window.innerHeight) * 0.7
                : undefined
            }
          />
        </div>
      </div>

      {/* Boutons de contrôle */}
      <div className="controls controls--main controls-row" style={{ marginTop: 16 }}>
        <button
          className={`btn-icon main ${
            timer.state.isRunning ? 'btn-pause' : 'btn-play'
          }`}
          title={timer.state.isRunning ? 'Pause' : 'Play'}
          onClick={() =>
            timer.state.isRunning ? timer.pause() : timer.start()
          }
        >
          {timer.state.isRunning ? '⏸' : '▶'}
        </button>
        <button
          className="btn-icon main secondary"
          title="Suivant"
          onClick={timer.skip}
        >
          ➤
        </button>
        <button
          className="btn-icon main danger"
          title="Réinitialiser"
          onClick={timer.reset}
        >
          ↻
        </button>
      </div>

      {!fullscreenMode && (
        <div className="settings settings--stack">
          {/* Row 1 : rounds + reset */}
          <div className="row compact">
            <div className="input-block">
              <input
                type="number"
                min={1}
                max={30}
                value={Number(timer.settings.totalRounds)}
                onChange={(e) =>
                  timer.setSettings({ totalRounds: Number(e.target.value) })
                }
                className="input-focus"
              />
              <label>Rounds</label>
            </div>
            <button
              className="btn-reset-rounds"
              title="Reset rounds"
              onClick={() =>
                timer.setSettings({
                  totalRounds: 3,
                  workSeconds: 180,
                  restSeconds: 60,
                  countdownSeconds: 3,
                  rounds: [],
                })
              }
            >
              ⟲
            </button>
          </div>

          {/* Row 2 : champs en MM:SS */}
          <div className="row compact">
            <MmssInput
              label="Durée"
              seconds={timer.settings.workSeconds}
              onChangeSeconds={(sec) =>
                timer.setSettings({ workSeconds: sec })
              }
              id="work-mmss"
            />

            <MmssInput
              label="Repos"
              seconds={timer.settings.restSeconds}
              onChangeSeconds={(sec) =>
                timer.setSettings({ restSeconds: sec })
              }
              id="rest-mmss"
            />

            <MmssInput
              label="Pré-compte"
              seconds={timer.settings.countdownSeconds ?? 0}
              onChangeSeconds={(sec) =>
                timer.setSettings({ countdownSeconds: sec })
              }
              id="countdown-mmss"
            />
          </div>

          {/* Résumé éventuel */}
          {timer.settings.rounds && timer.settings.rounds.length > 0 && (
            <div className="custom" style={{ marginTop: 8 }}>
              <div className="custom__scroller" style={{ maxHeight: 160 }}>
                {timer.settings.rounds.map((r: RoundConfig, i: number) => (
                  <div
                    key={i}
                    className="custom__row"
                    style={{ gridTemplateColumns: '1fr 1fr' }}
                  >
                    <div className="grow">
                      <label>round {i + 1}</label>
                      <div
                        style={{
                          padding: '8px 10px',
                          background: '#0f1326',
                          borderRadius: 8,
                          border: '1px solid #2b3152',
                        }}
                      >
                        {secondsToMMSS(r.workSeconds)}
                      </div>
                    </div>
                    <div className="grow">
                      <label>pause</label>
                      <div
                        style={{
                          padding: '8px 10px',
                          background: '#0f1326',
                          borderRadius: 8,
                          border: '1px solid #2b3152',
                        }}
                      >
                        {secondsToMMSS(r.restSeconds)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
