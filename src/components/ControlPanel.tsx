import React, { useState } from 'react';
import { ColorTheme, WormholeConfig } from '../types';

interface ControlPanelProps {
  config: WormholeConfig;
  onChange: (newConfig: Partial<WormholeConfig>) => void;
}

const THEMES: { id: ColorTheme; name: string }[] = [
  { id: 'monochrome', name: 'Monochrome' },
  { id: 'redshift', name: 'Redshift' },
  { id: 'neon', name: 'Neon Cyber' },
  { id: 'matrix', name: 'Matrix' },
  { id: 'solar', name: 'Solar Flare' },
];

export const ControlPanel: React.FC<ControlPanelProps> = ({ config, onChange }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  if (isClosed) {
    return (
      <button
        id="btnReopen"
        onClick={() => setIsClosed(false)}
        className="fixed top-2 right-2 z-50 w-10 h-10 flex items-center justify-center text-white bg-[#44FFFFFF] hover:bg-[#66FFFFFF] active:bg-[#88FFFFFF] text-sm font-bold rounded-none cursor-pointer"
        title="Open Controls"
      >
        ≡
      </button>
    );
  }

  return (
    <div
      className="fixed top-0 right-0 h-full z-40 flex flex-col bg-[#CC000000] p-2 text-white font-sans select-none"
      style={{ width: isMinimized ? 'auto' : '270px' }}
    >
      {/* Top button bar */}
      <div className="flex justify-end items-center mb-2">
        <button
          id="btnMinimize"
          onClick={() => setIsMinimized((prev) => !prev)}
          className="w-10 h-10 flex items-center justify-center text-white text-lg bg-[#44FFFFFF] hover:bg-[#55FFFFFF] active:bg-[#66FFFFFF] cursor-pointer"
          aria-label="Minimize"
          title="Minimize"
        >
          _
        </button>
        <button
          id="btnClose"
          onClick={() => setIsClosed(true)}
          className="w-10 h-10 ml-1 flex items-center justify-center text-white text-base bg-[#88FF0000] hover:bg-[#aaFF0000] active:bg-[#ccFF0000] cursor-pointer"
          aria-label="Close"
          title="Close"
        >
          X
        </button>
      </div>

      {/* Scrollable menu panel */}
      {!isMinimized && (
        <div
          id="menuScroll"
          className="w-[254px] flex-1 overflow-y-auto pt-2 pr-1 text-sm space-y-4 text-white"
        >
          {/* Section: Spacetime Metric */}
          <div className="border-b border-white/20 pb-3">
            <div className="text-[11px] font-bold text-white/50 tracking-wider uppercase mb-2">
              Spacetime Metric
            </div>

            {/* Throat Diameter */}
            <div className="mb-3">
              <div className="flex justify-between text-white text-xs mb-1">
                <span>Throat Diameter (b)</span>
                <span className="text-white/60">{config.expansion}</span>
              </div>
              <input
                id="seekExpansion"
                type="range"
                min="0"
                max="400"
                value={config.expansion}
                onChange={(e) => onChange({ expansion: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            {/* Curvature Exponent (p) */}
            <div className="mb-3">
              <div className="flex justify-between text-white text-xs mb-1">
                <span>Metric Exponent (p)</span>
                <span className="text-white/60">
                  {config.throatPower === 1 ? '1.00 (Ellis)' : config.throatPower.toFixed(2)}
                </span>
              </div>
              <input
                id="seekThroatPower"
                type="range"
                min="1.0"
                max="4.0"
                step="0.1"
                value={config.throatPower ?? 1.0}
                onChange={(e) => onChange({ throatPower: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            {/* Mouth Asymmetry */}
            <div className="mb-3">
              <div className="flex justify-between text-white text-xs mb-1">
                <span>Mouth Asymmetry (α)</span>
                <span className="text-white/60">
                  {(config.asymmetry ?? 0) > 0 ? `+${config.asymmetry}` : config.asymmetry ?? 0}%
                </span>
              </div>
              <input
                id="seekAsymmetry"
                type="range"
                min="-50"
                max="50"
                value={config.asymmetry ?? 0}
                onChange={(e) => onChange({ asymmetry: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            {/* Exit Expansion */}
            <div>
              <div className="flex justify-between text-white text-xs mb-1">
                <span>Exit Expansion</span>
                <span className="text-white/60">{config.flare}</span>
              </div>
              <input
                id="seekFlare"
                type="range"
                min="0"
                max="100"
                value={config.flare}
                onChange={(e) => onChange({ flare: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>
          </div>

          {/* Section: Visual Theme */}
          <div className="border-b border-white/20 pb-3">
            <div className="text-[11px] font-bold text-white/50 tracking-wider uppercase mb-2">
              Visual Palette
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  id={`btnTheme-${th.id}`}
                  onClick={() => onChange({ colorTheme: th.id })}
                  className={`px-2 py-1.5 text-xs rounded-none border text-left transition cursor-pointer ${
                    config.colorTheme === th.id
                      ? 'bg-white text-black font-semibold border-white'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                >
                  {th.name}
                </button>
              ))}
            </div>
          </div>

          {/* Section: Perspective & Optics */}
          <div className="border-b border-white/20 pb-3">
            <div className="text-[11px] font-bold text-white/50 tracking-wider uppercase mb-2">
              Perspective & Optics
            </div>

            {/* Perspective FOV */}
            <div className="mb-3">
              <div className="flex justify-between text-white text-xs mb-1">
                <span>Perspective (FOV)</span>
                <span className="text-white/60">{config.fov}°</span>
              </div>
              <input
                id="seekFov"
                type="range"
                min="30"
                max="110"
                value={config.fov}
                onChange={(e) => onChange({ fov: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            {/* Depth Cueing / Falloff */}
            <div className="mb-3">
              <div className="flex justify-between text-white text-xs mb-1">
                <span>Depth Falloff</span>
                <span className="text-white/60">{config.depthShading}%</span>
              </div>
              <input
                id="seekDepthShading"
                type="range"
                min="0"
                max="100"
                value={config.depthShading}
                onChange={(e) => onChange({ depthShading: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            {/* Room Size */}
            <div className="mb-3">
              <div className="flex justify-between text-white text-xs mb-1">
                <span>Bounding Room Size</span>
                <span className="text-white/60">{config.roomSize}</span>
              </div>
              <input
                id="seekRoom"
                type="range"
                min="0"
                max="2000"
                value={config.roomSize}
                onChange={(e) => onChange({ roomSize: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            {/* Line Multiplier */}
            <div>
              <div className="flex justify-between text-white text-xs mb-1">
                <span>Mesh Wireframe Density</span>
                <span className="text-white/60">{config.lineProgress}</span>
              </div>
              <input
                id="seekLines"
                type="range"
                min="0"
                max="200"
                value={config.lineProgress}
                onChange={(e) => onChange({ lineProgress: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>
          </div>

          {/* Section: Relativistic Elements & Features */}
          <div className="border-b border-white/20 pb-3">
            <div className="text-[11px] font-bold text-white/50 tracking-wider uppercase mb-2">
              Relativistic Features
            </div>

            {/* Throat Glow */}
            <label className="flex items-center space-x-2 mb-2 cursor-pointer">
              <input
                id="chkThroatGlow"
                type="checkbox"
                checked={config.throatGlow ?? true}
                onChange={(e) => onChange({ throatGlow: e.target.checked })}
                className="w-4 h-4 accent-white rounded-none cursor-pointer"
              />
              <span className="text-xs">Throat Photon Sphere Ring</span>
            </label>

            {/* Accretion Disk */}
            <label className="flex items-center space-x-2 mb-2 cursor-pointer">
              <input
                id="chkAccretion"
                type="checkbox"
                checked={config.showAccretion ?? false}
                onChange={(e) => onChange({ showAccretion: e.target.checked })}
                className="w-4 h-4 accent-white rounded-none cursor-pointer"
              />
              <span className="text-xs">Equatorial Accretion Disk</span>
            </label>

            {/* Geodesic Stream */}
            <label className="flex items-center space-x-2 mb-2 cursor-pointer">
              <input
                id="chkGeodesics"
                type="checkbox"
                checked={config.showGeodesics ?? true}
                onChange={(e) => onChange({ showGeodesics: e.target.checked })}
                className="w-4 h-4 accent-white rounded-none cursor-pointer"
              />
              <span className="text-xs">Traversing Geodesic Photons</span>
            </label>

            {/* Metric HUD */}
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                id="chkHud"
                type="checkbox"
                checked={config.showHud ?? true}
                onChange={(e) => onChange({ showHud: e.target.checked })}
                className="w-4 h-4 accent-white rounded-none cursor-pointer"
              />
              <span className="text-xs">Spacetime Metric HUD</span>
            </label>
          </div>

          {/* Section: Motion & Dynamics */}
          <div className="border-b border-white/20 pb-3">
            <div className="text-[11px] font-bold text-white/50 tracking-wider uppercase mb-2">
              Motion & Dynamics
            </div>

            {/* Spin */}
            <div className="mb-3">
              <div className="flex justify-between text-white text-xs mb-1">
                <span>Axial Spin Rate</span>
                <span className="text-white/60">{config.spinProgress}</span>
              </div>
              <input
                id="seekSpin"
                type="range"
                min="0"
                max="100"
                value={config.spinProgress}
                onChange={(e) => onChange({ spinProgress: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>

            {/* Movement Smoother */}
            <div>
              <div className="flex justify-between text-white text-xs mb-1">
                <span>Sensor Inertia / Smoother</span>
                <span className="text-white/60">{config.smoothProgress}</span>
              </div>
              <input
                id="seekSmooth"
                type="range"
                min="0"
                max="99"
                value={config.smoothProgress}
                onChange={(e) => onChange({ smoothProgress: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            </div>
          </div>

          {/* Section: Atmosphere & Background */}
          <div className="pb-4">
            <div className="text-[11px] font-bold text-white/50 tracking-wider uppercase mb-2">
              Atmosphere & Background
            </div>

            <div className="flex items-center space-x-2 mb-2">
              <input
                id="chkBg"
                type="checkbox"
                checked={config.useBg}
                onChange={(e) => onChange({ useBg: e.target.checked })}
                className="w-4 h-4 accent-white rounded-none cursor-pointer"
              />
              <label htmlFor="chkBg" className="text-white text-xs cursor-pointer">
                Custom Background Hue
              </label>
            </div>
            {config.useBg && (
              <input
                id="seekHue"
                type="range"
                min="0"
                max="360"
                value={config.bgHue}
                onChange={(e) => onChange({ bgHue: Number(e.target.value) })}
                className="w-full accent-white cursor-pointer"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
