import React, { useEffect, useState } from "react";
import { Timer } from "./components/Timer";
import { CustomSettings } from "./components/CustomSettings";
import { loadState, saveState } from "./utils/storage";
import { RoundConfig, TimerSettings } from "./hooks/useRoundTimer";

const defaultSettings: TimerSettings = {
  totalRounds: 3,
  workSeconds: 180,
  restSeconds: 60,
  countdownSeconds: 5,
};

const App: React.FC = () => {
  const persisted = loadState<TimerSettings>();
  const [settings, setSettings] = useState<TimerSettings>(
    persisted ?? defaultSettings
  );

  const [route, setRoute] = useState<"home" | "settings" | "fullscreen">(
    "home"
  );

  useEffect(() => {
    saveState(settings);
  }, [settings]);

  return (
    <div className={`app ${route === "fullscreen" ? "fullscreen" : ""}`}>
      {route !== "fullscreen" && (
        <header className="app__header">
          <h1>Rounds Timer</h1>
        </header>
      )}

      <main className="app__main">
        {route === "home" && (
          <Timer
            settings={settings}
            onChangeSettings={setSettings}
            onOpenSettings={() => setRoute("settings")}
            onGoFullscreen={() => setRoute("fullscreen")}
          />
        )}

        {route === "fullscreen" && (
          <Timer
            fullscreenMode
            settings={settings}
            onChangeSettings={setSettings}
            onExitFullscreen={() => setRoute("home")}
          />
        )}

        {route === "settings" && (
          <SettingsPage
            settings={settings}
            onChangeSettings={setSettings}
            onBack={() => setRoute("home")}
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
  const rounds: RoundConfig[] = Array.from({ length: settings.totalRounds }, (_, i) =>
    settings.rounds?.[i] ?? {
      workSeconds: settings.workSeconds,
      restSeconds: settings.restSeconds,
    }
  );

  return (
    <div className="card">
      <button className="secondary btn-icon" onClick={onBack}>
        ←
      </button>
      <h2 className="settings__title">Réglages personnalisés</h2>

      <div className="settings" style={{ marginTop: 12 }}>
        <div
          className="row compact"
          style={{ display: "flex", justifyContent: "center" }}
        >
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
