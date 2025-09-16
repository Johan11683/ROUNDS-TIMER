import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useRoundTimer,
  TimerSettings,
  RoundConfig,
} from "../hooks/useRoundTimer";
import {
  playPhaseChange,
  playCountdown321,
  playClap10sRemaining,
  playBellAtZero,
} from "../utils/sounds";
import { CircularTimer } from "./CircularTimer";
import { FullscreenButton } from "./FullscreenButton";
import { saveState } from "../utils/storage";
import { MmssInput } from "./MmssInput";

/* === Utils ============================================ */
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

const secondsToMMSS = (total: number): string => {
  const sec = Math.max(0, Math.floor(total));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

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
  /* === Defaults ======================================= */
  const defaults: TimerSettings = {
    totalRounds: 3,
    workSeconds: 180,
    restSeconds: 60,
    countdownSeconds: 3,
  };

  const timer = useRoundTimer({ ...defaults, ...settings });

  /* === Persist settings =============================== */
  useEffect(() => {
    onChangeSettings(timer.settings);
    saveState(timer.settings);
  }, [timer.settings, onChangeSettings]);

  /* === Effective rounds (custom > basic) =============== */
  const effectiveRounds: RoundConfig[] =
    timer.settings.rounds && timer.settings.rounds.length > 0
      ? timer.settings.rounds
      : timer.settings.totalRounds > 0
      ? Array.from({ length: timer.settings.totalRounds }, () => ({
          workSeconds: timer.settings.workSeconds,
          restSeconds: timer.settings.restSeconds,
        }))
      : Array.from({ length: defaults.totalRounds }, () => ({
          workSeconds: defaults.workSeconds,
          restSeconds: defaults.restSeconds,
        }));

  /* === Local state for rounds input =================== */
  const [roundsInput, setRoundsInput] = useState<string>(
    String(timer.settings.totalRounds || defaults.totalRounds)
  );

  useEffect(() => {
    setRoundsInput(String(timer.settings.totalRounds || defaults.totalRounds));
  }, [timer.settings.totalRounds]);

  const roundsLabel = useMemo(
    () =>
      `ROUND ${Math.min(
        timer.state.roundIndex + 1,
        effectiveRounds.length
      )}/${effectiveRounds.length}`,
    [timer.state.roundIndex, effectiveRounds.length]
  );

  const cssPhase = useMemo(
    () =>
      timer.state.phase === "work"
        ? "phase--work"
        : timer.state.phase === "rest"
        ? "phase--rest"
        : "",
    [timer.state.phase]
  );

  /* === Sound effects ================================== */
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
      timer.state.phase === "work" ||
      timer.state.phase === "rest" ||
      timer.state.phase === "idle";

    if (isPhaseWithEnd && prev > 3 && current === 3) playCountdown321();
    if (timer.state.phase === "work" && prev > 10 && current === 10)
      playClap10sRemaining();
    if (isPhaseWithEnd && current === 0 && prev > 0) playBellAtZero();
  }, [timer.state.remainingSeconds, timer.state.isRunning, timer.state.phase]);

  /* === Reset logic ==================================== */
  // ↻ = reset du timer (pas des paramètres)
  const handleTimerReset = () => {
    timer.pause();
    timer.reset();
  };

  // ⟲ = reset des rounds (remet defaults)
  const handleRoundsReset = () => {
    timer.pause();
    timer.reset();
    timer.setSettings({
      ...defaults,
      rounds: [],
    });
  };

  /* === Render ========================================= */
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
              timer.state.phase === "work"
                ? effectiveRounds[timer.state.roundIndex]?.workSeconds ?? 0
                : timer.state.phase === "rest"
                ? effectiveRounds[timer.state.roundIndex]?.restSeconds ?? 0
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

      {/* Controls */}
<div className="controls controls--main controls-row">
  <button
    className={`btn-icon main ${
      timer.state.isRunning ? "btn-pause" : "btn-play"
    }`}
    onClick={() =>
      timer.state.isRunning ? timer.pause() : timer.start()
    }
  >
    {timer.state.isRunning ? "⏸" : "▶"}
  </button>

  <button className="btn-icon main secondary" onClick={timer.skip}>
    ➤
  </button>

  <button
    className="btn-icon main danger"
    title="Réinitialiser"
    onClick={handleTimerReset}
  >
    ↻
  </button>
</div>

{/* Bouton reset rounds sous les autres */}
<div className="controls controls--rounds">
  <button
    className="btn-reset-rounds"
    title="Reset rounds"
    onClick={handleRoundsReset}
  >
    ⟲
  </button>
</div>


      

      {/* Settings */}
      {!fullscreenMode && (
        <div className="settings settings--stack">
          {(!settings.rounds || settings.rounds.length === 0) && (
            <div className="row compact">
              {/* Rounds */}
              <div className="input-block">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={roundsInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRoundsInput(val);

                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num > 0) {
                      timer.setSettings({ totalRounds: num });
                    }
                  }}
                  className="input-focus"
                />
                <label>Rounds</label>
              </div>

              {/* Durée */}
              <MmssInput
                label="Durée"
                seconds={timer.settings.workSeconds}
                onChangeSeconds={(sec) =>
                  timer.setSettings({ workSeconds: sec })
                }
              />

              {/* Repos */}
              <MmssInput
                label="Repos"
                seconds={timer.settings.restSeconds}
                onChangeSeconds={(sec) =>
                  timer.setSettings({ restSeconds: sec })
                }
              />

              {/* Pré-compte */}
              <MmssInput
                label="Pré-compte"
                seconds={timer.settings.countdownSeconds ?? 0}
                onChangeSeconds={(sec) =>
                  timer.setSettings({ countdownSeconds: sec })
                }
              />

              
            </div>
          )}

          {/* Custom summary */}
          {settings.rounds && settings.rounds.length > 0 && (
            <div className="custom">
              <div className="custom__scroller" style={{ maxHeight: 160, width: '30vh' }}>
                {settings.rounds.map((r: RoundConfig, i: number) => (
                  <div
                    key={i}
                    className="custom__row"
                    style={{ gridTemplateColumns: "1fr 1fr" }}
                  >
                    <div className="grow">
                      <label>round {i + 1}</label>
                      <div className="preview-block">
                        {secondsToMMSS(r.workSeconds)}
                      </div>
                    </div>
                    <div className="grow">
                      <label>pause</label>
                      <div className="preview-block">
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
