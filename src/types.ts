export type ColorTheme = 'monochrome' | 'redshift' | 'neon' | 'matrix' | 'solar';

export interface WormholeConfig {
  roomSize: number;        // 0..2000 (default 800)
  flare: number;           // 0..100 -> flare = p / 50f (default 0)
  expansion: number;       // 0..400 (default 150)
  useBg: boolean;          // boolean (default false)
  bgHue: number;           // 0..360 (default 0)
  lineProgress: number;    // 0..200 (default 50) -> lineMult = (p + 10) / 50f
  spinProgress: number;    // 0..100 (default 50) -> spinSpeed = (p - 50) / 500f
  smoothProgress: number;  // 0..99 (default 50) -> smoothAlpha = 1f - (p / 100f)
  fov: number;             // 30..110 (default 65) -> Field of view in degrees
  depthShading: number;    // 0..100 (default 75) -> Atmospheric depth falloff & perspective cues
  throatPower: number;     // 1.0..4.0 (default 1.0) -> Generalized metric exponent p: r(u) = (u^2p + b^2p)^(1/2p)
  asymmetry: number;       // -50..50 (default 0) -> Differential mouth asymmetry percentage
  throatGlow: boolean;     // Photon sphere / throat ring highlight (default true)
  showAccretion: boolean;  // Photon orbit disk / accretion ring (default false)
  showGeodesics: boolean;  // Flowing null geodesic particles (default true)
  colorTheme: ColorTheme;  // Visual theme palette (default 'monochrome')
  showHud: boolean;        // Spacetime metric HUD (default true)
}

