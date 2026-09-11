import React, { useState } from 'react';
import { WormholeCanvas } from './components/WormholeCanvas';
import { ControlPanel } from './components/ControlPanel';
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
};

export const App: React.FC = () => {
  const [config, setConfig] = useState<WormholeConfig>(DEFAULT_CONFIG);

  const handleConfigChange = (newConfig: Partial<WormholeConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
      <WormholeCanvas config={config} />
      <ControlPanel config={config} onChange={handleConfigChange} />
    </div>
  );
};

export default App;
