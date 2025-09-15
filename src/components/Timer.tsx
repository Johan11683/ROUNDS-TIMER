import React, { useEffect, useMemo, useRef } from 'react';
import { useRoundTimer, TimerSettings, RoundConfig } from '../hooks/useRoundTimer';
import { playPhaseChange, playCountdown321, playClap10sRemaining, playBellAtZero } from '../utils/sounds';
import { CircularTimer } from './CircularTimer';
import { FullscreenButton } from './FullscreenButton';
import { saveState } from '../utils/storage';

export const Timer: React.FC<{
  fullscreenMode?: boolean;
  onOpenSettings?: () => void;
  onExitFullscreen?: () => void;
  settings: TimerSettings;
  onChangeSettings: (s: TimerSettings) => void;
}> = ({ fullscreenMode = false, onOpenSettings, onExitFullscreen, settings, onChangeSettings }) => {
  const timer = useRoundTimer(settings);

  useEffect(() => {
    onChangeSettings(timer.settings);
    saveState(timer.settings);
  }, [timer.settings, onChangeSettings]);

  const roundsLabel = useMemo(
    () => `ROUND ${Math.min(timer.state.roundIndex + 1, timer.settings.totalRounds)}/${timer.settings.totalRounds}`,
    [timer.state.roundIndex, timer.settings.totalRounds]
  );

  const cssPhase = useMemo(
    () => (timer.state.phase === 'work' ? 'phase--work' : timer.state.phase === 'rest' ? 'phase--rest' : ''),
    [timer.state.phase]
  );

  const lastPhaseRef = useRef(timer.state.phase);
  useEffect(() => {
    if (timer.state.phase !== lastPhaseRef.current) {
      playPhaseChange(timer.state.phase);
      lastPhaseRef.current = timer.state.phase;
    }
  }, [timer.state.phase]);

  // Sons (3-2-1, claps, cloche)
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
    if (timer.state.phase === 'work' && prev > 10 && current === 10) playClap10sRemaining();
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
            size={fullscreenMode ? Math.min(window.innerWidth, window.innerHeight) * 0.7 : undefined}
          />
        </div>
      </div>

      {/* Boutons de contrôle */}
      <div className="controls controls--main controls-row" style={{ marginTop: 16 }}>
        <button
          className={`btn-icon main ${timer.state.isRunning ? 'btn-pause' : 'btn-play'}`}
          title={timer.state.isRunning ? 'Pause' : 'Play'}
          onClick={() => (timer.state.isRunning ? timer.pause() : timer.start())}
        >
          {timer.state.isRunning ? '⏸' : '▶'}
        </button>
        <button className="btn-icon main secondary" title="Suivant" onClick={timer.skip}>
          ➤
        </button>
        <button className="btn-icon main danger" title="Réinitialiser" onClick={timer.reset}>
          ↻
        </button>
      </div>

      {/* Réglages visibles uniquement hors fullscreen */}
      {!fullscreenMode && (
        <div className="settings settings--stack">
          {/* Row 1 : rounds + reset */}
          <div className="row compact">
            <div className="input-block">
              <input
                type="number"
                min={1}
                max={30}
                value={timer.settings.totalRounds}
                onChange={(e) => timer.setSettings({ totalRounds: Number(e.target.value) })}
                className="input-focus"
              />
              <label>Nombre de rounds</label>
            </div>
            <button
              className="btn-reset-rounds"
              title="Reset rounds"
              onClick={() =>
                timer.setSettings({
                  totalRounds: 3,
                  workSeconds: 180,
                  restSeconds: 60,
                  countdownSeconds: 5,
                  rounds: [],
                })
              }
            >
              ⟲
            </button>
          </div>

          {/* Row 2 : autres champs (en colonne, chacun avec label sous le chiffre) */}
          <div className="row compact">
            <div className="input-block">
              <input
                type="number"
                min={10}
                max={1800}
                step={5}
                value={timer.settings.workSeconds}
                onChange={(e) => timer.setSettings({ workSeconds: Number(e.target.value) })}
                className="input-focus"
              />
              <label>Durée du round (sec)</label>
            </div>

            <div className="input-block">
              <input
                type="number"
                min={0}
                max={900}
                step={5}
                value={timer.settings.restSeconds}
                onChange={(e) => timer.setSettings({ restSeconds: Number(e.target.value) })}
                className="input-focus"
              />
              <label>Repos (sec)</label>
            </div>

            <div className="input-block">
              <input
                type="number"
                min={0}
                max={30}
                value={timer.settings.countdownSeconds ?? 0}
                onChange={(e) => timer.setSettings({ countdownSeconds: Number(e.target.value) })}
                className="input-focus"
              />
              <label>Pré-compte (sec)</label>
            </div>
          </div>

          {/* Résumé éventuel */}
          {timer.settings.rounds && timer.settings.rounds.length > 0 && (
            <div className="custom" style={{ marginTop: 8 }}>
              <div className="custom__scroller" style={{ maxHeight: 160 }}>
                {timer.settings.rounds.map((r: RoundConfig, i: number) => (
                  <div key={i} className="custom__row" style={{ gridTemplateColumns: '1fr 1fr' }}>
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
                        {Math.floor(r.workSeconds / 60)}:{String(r.workSeconds % 60).padStart(2, '0')}
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
                        {Math.floor(r.restSeconds / 60)}:{String(r.restSeconds % 60).padStart(2, '0')}
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
