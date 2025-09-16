import React, { useEffect, useState } from 'react';
import { Timer } from './components/Timer';
import { CustomSettings } from './components/CustomSettings';
import { loadState, saveState } from './utils/storage';
import { RoundConfig, TimerSettings } from './hooks/useRoundTimer';

const App: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [route, setRoute] = useState<'home' | 'settings'>('home');
  const persisted = loadState<TimerSettings>();
  const [settings, setSettings] = useState<TimerSettings>(persisted ?? { totalRounds: 3, workSeconds: 180, restSeconds: 60, countdownSeconds: 5 });
  useEffect(() => {
    const onChange = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      if (!fs) {
        setRoute('home');
      }
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => { saveState(settings); }, [settings]);

  return (
    <div className={`app ${isFullscreen ? 'fullscreen' : ''}`}>
      {!isFullscreen && (
        <header className="app__header">
          <h1>Rounds Timer</h1>
        </header>
      )}
      <main className="app__main">
        {route === 'home' ? (
          <Timer
            fullscreenMode={isFullscreen}
            onOpenSettings={() => setRoute('settings')}
            onExitFullscreen={() => setRoute('home')}
            settings={settings}
            onChangeSettings={setSettings}
          />
        ) : (
          <SettingsPage
            settings={settings}
            onChangeSettings={setSettings}
            onBack={() => setRoute('home')}
          />
        )}
      </main>
    </div>
  );
};

const SettingsPage: React.FC<{
  onBack: () => void;
  settings: TimerSettings;
  onChangeSettings: (s: TimerSettings) => void;
}> = ({ onBack, settings, onChangeSettings }) => {
  const rounds: RoundConfig[] = Array.from(
    { length: settings.totalRounds },
    (_, i) =>
      settings.rounds?.[i] ?? {
        workSeconds: settings.workSeconds,
        restSeconds: settings.restSeconds,
      }
  );

  return (
    <div className="card">
      {/* Titre + bouton retour */}
      <button className="secondary btn-icon" onClick={onBack}>
          ←
        </button>
      <div
        className="row"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <h2 className="settings__title">Réglages personnalisés</h2>
        
      </div>

      <div className="settings" style={{ marginTop: 12 }}>
        {/* Nombre de rounds avec le bon style */}
        <div className="row compact" style={{ display: 'flex', justifyContent: 'center' }} >
          <div className="input-block">
            <input
              type="number"
              min={1}
              max={50}
              className="input-focus"
              value={settings.totalRounds}
              onChange={(e) =>
                onChangeSettings({
                  ...settings,
                  totalRounds: Number(e.target.value),
                })
              }
            />
            <label>Rounds</label>
          </div>
        </div>

        {/* Custom rounds */}
        <CustomSettings
          rounds={rounds}
          onChange={(updated) =>
            onChangeSettings({
              ...settings,
              rounds: updated,
              totalRounds: updated.length,
            })
          }
          onAddRound={() => {
            const last =
              rounds[rounds.length - 1] ?? {
                workSeconds: settings.workSeconds,
                restSeconds: settings.restSeconds,
              };
            const next = [
              ...rounds,
              {
                workSeconds: last.workSeconds,
                restSeconds: last.restSeconds,
              },
            ];
            onChangeSettings({
              ...settings,
              rounds: next,
              totalRounds: next.length,
            });
          }}
        />
      </div>
    </div>
  );
};


export default App;


