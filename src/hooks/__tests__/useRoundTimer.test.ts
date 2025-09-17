// Tests JEST

import { renderHook, act } from "@testing-library/react";
import { useRoundTimer } from "../src/hooks/useRoundTimer";

describe("useRoundTimer", () => {
  it("démarre et s'arrête", () => {
    const { result } = renderHook(() =>
      useRoundTimer({
        totalRounds: 1,
        workSeconds: 3,
        restSeconds: 2,
        countdownSeconds: 0,
      })
    );

    expect(result.current.state.isRunning).toBe(false);

    act(() => {
      result.current.start();
    });
    expect(result.current.state.isRunning).toBe(true);

    act(() => {
      result.current.pause();
    });
    expect(result.current.state.isRunning).toBe(false);
  });

  it("reset met le timer à 0 et phase idle", () => {
    const { result } = renderHook(() =>
      useRoundTimer({
        totalRounds: 1,
        workSeconds: 5,
        restSeconds: 2,
        countdownSeconds: 0,
      })
    );

    act(() => {
      result.current.start();
      result.current.reset();
    });

    expect(result.current.state.remainingSeconds).toBe(0);
    expect(result.current.state.phase).toBe("idle");
  });

  it("skip lance directement le prochain round en work", () => {
    const { result } = renderHook(() =>
      useRoundTimer({
        totalRounds: 2,
        workSeconds: 3,
        restSeconds: 2,
        countdownSeconds: 0,
      })
    );

    expect(result.current.state.roundIndex).toBe(0);
    expect(result.current.state.phase).toBe("idle");

    act(() => {
      result.current.skip();
    });

    // skip démarre directement en work, roundIndex reste 0
    expect(result.current.state.roundIndex).toBe(0);
    expect(result.current.state.phase).toBe("work");
  });

  it("débute toujours en idle", () => {
    const { result } = renderHook(() =>
      useRoundTimer({
        totalRounds: 1,
        workSeconds: 3,
        restSeconds: 2,
        countdownSeconds: 0,
      })
    );

    expect(result.current.state.phase).toBe("idle");
  });
});
