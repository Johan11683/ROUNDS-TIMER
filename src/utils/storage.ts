const KEY = 'rounds-timer:v1';

export interface PersistedState<T> {
  data: T;
}

export function saveState<T>(data: T) {
  try {
    const payload: PersistedState<T> = { data };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {}
}

export function loadState<T>(): T | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState<T>;
    return parsed.data;
  } catch {
    return null;
  }
}


