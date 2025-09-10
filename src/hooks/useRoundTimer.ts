import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type TimerPhase = 'work' | 'rest' | 'idle' | 'finished';

export interface RoundConfig {
  workSeconds: number;
  restSeconds: number;
}

export interface TimerSettings {
  totalRounds: number; // nombre total de rounds
  workSeconds: number; // durée d'un round (travail)
  restSeconds: number; // durée du repos
  countdownSeconds?: number; // pré-compte optionnel avant départ
  rounds?: RoundConfig[]; // optionnel: configuration par round
}

export interface TimerStateSnapshot {
  phase: TimerPhase;
  roundIndex: number; // 0-based
  remainingSeconds: number;
  isRunning: boolean;
}

export function useRoundTimer(initial: TimerSettings) {
  const [settings, setSettings] = useState<TimerSettings>({
    countdownSeconds: 0,
    ...initial,
  });
  const [phase, setPhase] = useState<TimerPhase>('idle');
  const [roundIndex, setRoundIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const getRoundConfig = useCallback(
    (index: number): RoundConfig => {
      const def: RoundConfig = { workSeconds: settings.workSeconds, restSeconds: settings.restSeconds };
      const fromArray = settings.rounds?.[index];
      return fromArray ? { workSeconds: fromArray.workSeconds, restSeconds: fromArray.restSeconds } : def;
    },
    [settings]
  );

  const currentPhaseDuration = useMemo(() => {
    if (phase === 'work') return getRoundConfig(roundIndex).workSeconds;
    if (phase === 'rest') return getRoundConfig(roundIndex).restSeconds;
    if (phase === 'idle' && settings.countdownSeconds) return settings.countdownSeconds;
    return 0;
  }, [phase, settings, roundIndex, getRoundConfig]);

  const start = useCallback(() => {
    if (isRunning) return;
    // Si idle, démarrer par countdown ou work
    if (phase === 'idle') {
      if ((settings.countdownSeconds ?? 0) > 0) {
        setPhase('idle');
        setRemainingSeconds(settings.countdownSeconds ?? 0);
      } else {
        setPhase('work');
        setRemainingSeconds(getRoundConfig(0).workSeconds);
      }
    }
    setIsRunning(true);
    lastTickRef.current = performance.now();
  }, [isRunning, phase, settings, getRoundConfig]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setRoundIndex(0);
    setRemainingSeconds(settings.countdownSeconds ?? 0);
  }, [settings.countdownSeconds]);

  const nextPhase = useCallback(() => {
    if (phase === 'idle') {
      setPhase('work');
      setRemainingSeconds(getRoundConfig(roundIndex).workSeconds);
      return;
    }
    if (phase === 'work') {
      const isLastWork = roundIndex >= settings.totalRounds - 1;
      if (isLastWork) {
        if (getRoundConfig(roundIndex).restSeconds > 0) {
          setPhase('rest');
          setRemainingSeconds(getRoundConfig(roundIndex).restSeconds);
        } else {
          setPhase('finished');
          setIsRunning(false);
          setRemainingSeconds(0);
        }
      } else {
        setPhase('rest');
        setRemainingSeconds(getRoundConfig(roundIndex).restSeconds);
      }
      return;
    }
    if (phase === 'rest') {
      const isLastWork = roundIndex >= settings.totalRounds - 1;
      if (isLastWork) {
        setPhase('finished');
        setIsRunning(false);
        setRemainingSeconds(0);
      } else {
        setRoundIndex((r) => r + 1);
        setPhase('work');
        setRemainingSeconds(getRoundConfig(roundIndex + 1).workSeconds);
      }
      return;
    }
  }, [phase, roundIndex, settings, getRoundConfig]);

  // Tick via requestAnimationFrame (calcul par delta pour précision)
  useEffect(() => {
    if (!isRunning) return;
    const loop = (now: number) => {
      const last = lastTickRef.current || now;
      const delta = (now - last) / 1000;
      lastTickRef.current = now;

      setRemainingSeconds((prev) => {
        const next = Math.max(0, prev - delta);
        if (prev > 0 && next === 0) {
          // Passage automatique à la phase suivante
          setTimeout(() => nextPhase(), 0);
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isRunning, nextPhase]);

  // Mettre remainingSeconds correct quand phase/settings changent si non en cours
  useEffect(() => {
    if (isRunning) return;
    if (phase === 'idle') setRemainingSeconds(settings.countdownSeconds ?? 0);
  }, [phase, settings, isRunning]);

  const setNewSettings = useCallback((partial: Partial<TimerSettings>) => {
    setSettings((s) => ({ ...s, ...partial }));
  }, []);

  const jumpToRound = useCallback((index: number, startPhase: TimerPhase = 'work') => {
    const clamped = Math.max(0, Math.min(settings.totalRounds - 1, index));
    setRoundIndex(clamped);
    setPhase(startPhase);
    setRemainingSeconds(startPhase === 'work' ? getRoundConfig(clamped).workSeconds : getRoundConfig(clamped).restSeconds);
  }, [settings.totalRounds, getRoundConfig]);

  const skip = useCallback(() => {
    nextPhase();
  }, [nextPhase]);

  const snapshot: TimerStateSnapshot = {
    phase,
    roundIndex,
    remainingSeconds,
    isRunning,
  };

  return {
    settings,
    setSettings: setNewSettings,
    state: snapshot,
    start,
    pause,
    reset,
    skip,
    jumpToRound,
    getRoundConfig,
  } as const;
}

export function formatMMSS(totalSeconds: number): string {
  const sec = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}


