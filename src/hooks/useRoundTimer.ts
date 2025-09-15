import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type TimerPhase = 'work' | 'rest' | 'idle' | 'finished';

export interface RoundConfig {
  workSeconds: number;
  restSeconds: number;
}

export interface TimerSettings {
  totalRounds: number;       // nombre total de rounds
  workSeconds: number;       // durée d'un round (travail)
  restSeconds: number;       // durée du repos
  countdownSeconds?: number; // pré-compte optionnel avant départ
  rounds?: RoundConfig[];    // configuration par round (optionnel)
}

export interface TimerStateSnapshot {
  phase: TimerPhase;
  roundIndex: number;        // 0-based
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

  /** Config d'un round (depuis array ou valeurs globales) */
  const getRoundConfig = useCallback(
    (index: number): RoundConfig => {
      const def: RoundConfig = {
        workSeconds: settings.workSeconds,
        restSeconds: settings.restSeconds,
      };
      return settings.rounds?.[index] ?? def;
    },
    [settings]
  );

  /** Durée de la phase courante */
  const currentPhaseDuration = useMemo(() => {
    if (phase === 'work') return getRoundConfig(roundIndex).workSeconds;
    if (phase === 'rest') return getRoundConfig(roundIndex).restSeconds;
    if (phase === 'idle' && settings.countdownSeconds)
      return settings.countdownSeconds;
    return 0;
  }, [phase, roundIndex, settings, getRoundConfig]);

  /** ▶️ Démarrage du timer */
  const start = useCallback(() => {
    if (isRunning) return;

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

  /** ⏸ Pause */
  const pause = useCallback(() => setIsRunning(false), []);

  /** 🔄 Reset */
  const reset = useCallback(() => {
    setIsRunning(false);
    setPhase('idle');
    setRoundIndex(0);
    setRemainingSeconds(settings.countdownSeconds ?? 0);
  }, [settings.countdownSeconds]);

  /** Passage à la phase suivante */
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
    }
  }, [phase, roundIndex, settings, getRoundConfig]);

  /** Tick via requestAnimationFrame (delta par secondes entières) */
  useEffect(() => {
    if (!isRunning) return;

    const loop = (now: number) => {
      const last = lastTickRef.current || now;
      const delta = (now - last) / 1000;

      // ⏱️ Ne décrémente que si >= 1 seconde entière s'est écoulée
      if (delta >= 1) {
        setRemainingSeconds((prev) => {
          const next = Math.max(0, prev - Math.floor(delta));
          if (prev > 0 && next === 0) {
            setTimeout(() => nextPhase(), 0);
          }
          return next;
        });
        lastTickRef.current = now;
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isRunning, nextPhase]);

  /** Réinitialise remainingSeconds si phase/settings changent */
  useEffect(() => {
    if (isRunning) return;
    if (phase === 'idle') setRemainingSeconds(settings.countdownSeconds ?? 0);
  }, [phase, settings, isRunning]);

  /** Changer paramètres */
  const setNewSettings = useCallback(
    (partial: Partial<TimerSettings>) => {
      setSettings((s) => ({ ...s, ...partial }));
    },
    []
  );

  /** Aller directement à un round */
  const jumpToRound = useCallback(
    (index: number, startPhase: TimerPhase = 'work') => {
      const clamped = Math.max(
        0,
        Math.min(settings.totalRounds - 1, index)
      );
      setRoundIndex(clamped);
      setPhase(startPhase);
      setRemainingSeconds(
        startPhase === 'work'
          ? getRoundConfig(clamped).workSeconds
          : getRoundConfig(clamped).restSeconds
      );
    },
    [settings.totalRounds, getRoundConfig]
  );

  const skip = useCallback(() => nextPhase(), [nextPhase]);

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

/** Formatage MM:SS (ceil = affiche toujours la seconde entière en cours) */
export function formatMMSS(totalSeconds: number): string {
  const sec = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}`;
}
