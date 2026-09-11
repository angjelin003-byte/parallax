import React, { useState } from 'react';
import { WormholeConfig } from '../types';

interface ControlPanelProps {
  config: WormholeConfig;
  onChange: (newConfig: Partial<WormholeConfig>) => void;
}

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
      style={{ width: isMinimized ? 'auto' : '266px' }}
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
          className="w-[250px] flex-1 overflow-y-auto pt-4 pr-1 text-sm space-y-4"
        >
          {/* Room Size */}
          <div>
            <div className="text-white text-sm mb-1">Room Size</div>
            <input
              id="seekRoom"
              type="range"
              min="0"
              max="2000"
              value={config.roomSize}
              onChange={(e) => onChange({ roomSize: Number(e.target.value) })}
              className="w-full accent-white cursor-pointer pb-2"
            />
          </div>

          {/* Exit Expansion */}
          <div>
            <div className="text-white text-sm mb-1">Exit Expansion</div>
            <input
              id="seekFlare"
              type="range"
              min="0"
              max="100"
              value={config.flare}
              onChange={(e) => onChange({ flare: Number(e.target.value) })}
              className="w-full accent-white cursor-pointer pb-2"
            />
          </div>

          {/* Throat Diameter */}
          <div>
            <div className="text-white text-sm mb-1">Throat Diameter</div>
            <input
              id="seekExpansion"
              type="range"
              min="0"
              max="400"
              value={config.expansion}
              onChange={(e) => onChange({ expansion: Number(e.target.value) })}
              className="w-full accent-white cursor-pointer pb-2"
            />
          </div>

          {/* Checkbox Bg Hue + Slider */}
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <input
                id="chkBg"
                type="checkbox"
                checked={config.useBg}
                onChange={(e) => onChange({ useBg: e.target.checked })}
                className="w-4 h-4 accent-white rounded-none cursor-pointer"
              />
              <label htmlFor="chkBg" className="text-white text-sm cursor-pointer">
                Bg Hue
              </label>
            </div>
            <input
              id="seekHue"
              type="range"
              min="0"
              max="360"
              value={config.bgHue}
              onChange={(e) => onChange({ bgHue: Number(e.target.value) })}
              className="w-full accent-white cursor-pointer pb-2"
            />
          </div>

          {/* Line Multiplier */}
          <div>
            <div className="text-white text-sm mb-1">Line Multiplier</div>
            <input
              id="seekLines"
              type="range"
              min="0"
              max="200"
              value={config.lineProgress}
              onChange={(e) => onChange({ lineProgress: Number(e.target.value) })}
              className="w-full accent-white cursor-pointer pb-2"
            />
          </div>

          {/* Spin */}
          <div>
            <div className="text-white text-sm mb-1">Spin</div>
            <input
              id="seekSpin"
              type="range"
              min="0"
              max="100"
              value={config.spinProgress}
              onChange={(e) => onChange({ spinProgress: Number(e.target.value) })}
              className="w-full accent-white cursor-pointer pb-2"
            />
          </div>

          {/* Movement Smoother */}
          <div>
            <div className="text-white text-sm mb-1">Movement Smoother</div>
            <input
              id="seekSmooth"
              type="range"
              min="0"
              max="99"
              value={config.smoothProgress}
              onChange={(e) => onChange({ smoothProgress: Number(e.target.value) })}
              className="w-full accent-white cursor-pointer pb-2"
            />
          </div>

          {/* Perspective FOV */}
          <div>
            <div className="flex justify-between text-white text-sm mb-1">
              <span>Perspective (FOV)</span>
              <span className="text-white/60 text-xs">{config.fov}°</span>
            </div>
            <input
              id="seekFov"
              type="range"
              min="30"
              max="110"
              value={config.fov}
              onChange={(e) => onChange({ fov: Number(e.target.value) })}
              className="w-full accent-white cursor-pointer pb-2"
            />
          </div>

          {/* Depth Cueing / Falloff */}
          <div className="pb-4">
            <div className="flex justify-between text-white text-sm mb-1">
              <span>Depth Falloff</span>
              <span className="text-white/60 text-xs">{config.depthShading}%</span>
            </div>
            <input
              id="seekDepthShading"
              type="range"
              min="0"
              max="100"
              value={config.depthShading}
              onChange={(e) => onChange({ depthShading: Number(e.target.value) })}
              className="w-full accent-white cursor-pointer pb-4"
            />
          </div>
        </div>
      )}
    </div>
  );
};
