import React, { useEffect, useRef, useState } from "react";

const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));

function secondsToMMSS(total: number): string {
  const sec = Math.max(0, Math.floor(total));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface MmssInputProps {
  label: string;
  seconds: number;
  onChangeSeconds: (sec: number) => void;
  id?: string;
}

export const MmssInput: React.FC<MmssInputProps> = ({
  label,
  seconds,
  onChangeSeconds,
  id,
}) => {
  const [digits, setDigits] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!touched) setDigits("");
  }, [seconds, touched]);

  const handleFocus = () => {
  setDigits("");
  setTouched(true);
  onChangeSeconds(0);

  // ⬅️ TRÈS IMPORTANT : force toujours le curseur à droite
  requestAnimationFrame(() => {
    inputRef.current?.setSelectionRange(5, 5);
  });
};


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(-4);
    setDigits(raw);

    const padded = raw.padStart(4, "0");
    const mins = clamp(parseInt(padded.slice(0, 2), 10), 0, 60);
    const secs = clamp(parseInt(padded.slice(2, 4), 10), 0, 59);

    onChangeSeconds(mins * 60 + secs);
    requestAnimationFrame(() => {
      inputRef.current?.setSelectionRange(5, 5);
    });
  };

  const display = (() => {
    if (digits === "") return secondsToMMSS(seconds);
    const padded = digits.padStart(4, "0");
    const mins = clamp(parseInt(padded.slice(0, 2), 10), 0, 60);
    const secs = clamp(parseInt(padded.slice(2, 4), 10), 0, 59);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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
