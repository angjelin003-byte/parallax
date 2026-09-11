import React, { useState, useCallback } from 'react';
import { WormholeCanvas } from './components/WormholeCanvas';
import { ControlPanel } from './components/ControlPanel';
import { MetricHud } from './components/MetricHud';
import { WormholeConfig } from './types';

const DEFAULT_CONFIG: WormholeConfig = {
  roomSize: 800,
  flare: 0,
  expansion: 150,
  useBg: false,
  bgHue: 0,
  lineProgress: 50,
  spinProgress: 50,
  smoothProgress: 50,
  fov: 65,
  depthShading: 75,
  throatPower: 1.0,
  asymmetry: 0,
  throatGlow: true,
  showAccretion: false,
  showGeodesics: true,
  colorTheme: 'monochrome',
  showHud: true,
};

export const App: React.FC = () => {
  const [config, setConfig] = useState<WormholeConfig>(DEFAULT_CONFIG);
  const [stats, setStats] = useState({
    zoom: 1.0,
    pitch: 0,
    roll: 0,
    fps: 60,
  });
  const [resetSignal, setResetSignal] = useState<number>(0);

  const handleConfigChange = (newConfig: Partial<WormholeConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  const handleStatsUpdate = useCallback(
    (newStats: { zoom: number; pitch: number; roll: number; fps: number }) => {
      setStats(newStats);
    },
    []
  );

  const handleResetOrientation = useCallback(() => {
    setResetSignal((s) => s + 1);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      <WormholeCanvas
        config={config}
        onStatsUpdate={handleStatsUpdate}
        resetSignal={resetSignal}
      />
      <MetricHud
        config={config}
        zoom={stats.zoom}
        pitch={stats.pitch}
        roll={stats.roll}
        fps={stats.fps}
        onResetOrientation={handleResetOrientation}
      />
      <ControlPanel config={config} onChange={handleConfigChange} />
    </div>
  );
};

export default App;
