import React from 'react';
import { WormholeConfig } from '../types';

interface MetricHudProps {
  config: WormholeConfig;
  zoom: number;
  pitch: number;
  roll: number;
  fps: number;
  onResetOrientation: () => void;
}

export const MetricHud: React.FC<MetricHudProps> = ({
  config,
  zoom,
  pitch,
  roll,
  fps,
  onResetOrientation,
}) => {
  if (!config.showHud) return null;

  const b = config.expansion;
  // Gaussian curvature at the throat K_0 = -1 / b^2
  const curvature = b > 0 ? (-1 / (b * b)).toExponential(2) : '0';
  const pExp = config.throatPower ?? 1.0;
  const asym = config.asymmetry ?? 0;

  return (
    <div
      id="metricHud"
      className="fixed bottom-3 left-3 z-30 pointer-events-auto select-none font-mono text-xs text-white/80 bg-black/75 backdrop-blur-sm border border-white/15 p-3 rounded max-w-xs transition-opacity duration-200"
    >
      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-white/20">
        <span className="font-bold text-white tracking-wider text-[11px] uppercase">
          Ellis Wormhole Metric
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/90">
          {fps} FPS
        </span>
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="text-white/60 italic font-sans text-[10px] pb-0.5">
          ds² = -dt² + dl² + r(l)² dΩ²
        </div>

        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 pt-0.5">
          <div>
            <span className="text-white/50">Throat b: </span>
            <span className="text-white font-medium">{b} px</span>
          </div>
          <div>
            <span className="text-white/50">Exponent p: </span>
            <span className="text-white font-medium">{pExp.toFixed(2)}</span>
          </div>
          <div>
            <span className="text-white/50">Curvature K₀: </span>
            <span className="text-white font-medium">{curvature}</span>
          </div>
          <div>
            <span className="text-white/50">Asymmetry: </span>
            <span className="text-white font-medium">{asym > 0 ? `+${asym}` : asym}%</span>
          </div>
          <div>
            <span className="text-white/50">Zoom: </span>
            <span className="text-white font-medium">{zoom.toFixed(2)}×</span>
          </div>
          <div>
            <span className="text-white/50">FOV: </span>
            <span className="text-white font-medium">{config.fov}°</span>
          </div>
          <div>
            <span className="text-white/50">Pitch: </span>
            <span className="text-white font-medium">{(pitch * 57.3).toFixed(1)}°</span>
          </div>
          <div>
            <span className="text-white/50">Roll: </span>
            <span className="text-white font-medium">{(roll * 57.3).toFixed(1)}°</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-white/10 mt-1">
          <span className="text-[10px] text-white/50">Theme: {config.colorTheme}</span>
          <button
            id="btnResetHud"
            onClick={onResetOrientation}
            className="text-[10px] px-2 py-0.5 bg-white/15 hover:bg-white/30 active:bg-white/40 text-white rounded transition cursor-pointer"
            title="Reset orientation and zoom"
          >
            Reset View
          </button>
        </div>
      </div>
    </div>
  );
};
