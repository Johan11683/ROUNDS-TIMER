import React from 'react';

function isFs(): boolean {
  return !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
}

export const FullscreenButton: React.FC<{ exitOnly?: boolean; onExit?: () => void }> = ({ exitOnly = false, onExit }) => {
  const toggle = async () => {
    try {
      if (!isFs() && !exitOnly) {
        await (document.documentElement as any).requestFullscreen?.();
      } else {
        const exit = (document as any).exitFullscreen?.();
        // Navigue immédiatement vers la page principale même si l'API échoue
        onExit?.();
        if (exit && typeof (exit as Promise<void>).then === 'function') {
          await exit;
        }
      }
    } catch {
      // En cas d'erreur, on déclenche quand même le callback
      onExit?.();
    }
  };
  return <button type="button" className="secondary btn-icon" onClick={toggle}>{exitOnly ? '⤡' : '⤢'}</button>;
};


