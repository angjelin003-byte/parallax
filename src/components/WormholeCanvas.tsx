import React, { useEffect, useRef } from 'react';
import { WormholeConfig } from '../types';

interface WormholeCanvasProps {
  config: WormholeConfig;
  onStatsUpdate?: (stats: { zoom: number; pitch: number; roll: number; fps: number }) => void;
  resetSignal?: number;
}

function hsvToRgb(h: number, s: number, v: number): string {
  const c = v * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (hp >= 0 && hp < 1) {
    r = c; g = x; b = 0;
  } else if (hp >= 1 && hp < 2) {
    r = x; g = c; b = 0;
  } else if (hp >= 2 && hp < 3) {
    r = 0; g = c; b = x;
  } else if (hp >= 3 && hp < 4) {
    r = 0; g = x; b = c;
  } else if (hp >= 4 && hp < 5) {
    r = x; g = 0; b = c;
  } else if (hp >= 5 && hp < 6) {
    r = c; g = 0; b = x;
  }

  const m = v - c;
  const red = Math.round((r + m) * 255);
  const green = Math.round((g + m) * 255);
  const blue = Math.round((b + m) * 255);
  return `rgb(${red}, ${green}, ${blue})`;
}

interface GeodesicPhoton {
  u: number;
  vFrac: number;
  speed: number;
}

export const WormholeCanvas: React.FC<WormholeCanvasProps> = ({
  config,
  onStatsUpdate,
  resetSignal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const configRef = useRef<WormholeConfig>(config);
  configRef.current = config;

  const currentSpinRef = useRef<number>(0);
  const filteredXRef = useRef<number>(0);
  const filteredYRef = useRef<number>(0);
  const targetSensorXRef = useRef<number>(0);
  const targetSensorYRef = useRef<number>(0);

  // 3D Touch/Pointer rotation and zoom states
  const touchRotXRef = useRef<number>(0);
  const touchRotYRef = useRef<number>(0);
  const touchRotZRef = useRef<number>(0);
  const zoomRef = useRef<number>(1.0);

  const lastTouchPosRef = useRef<{ cx: number; cy: number; angle: number; dist: number } | null>(null);
  const isMouseDownRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number; button: number } | null>(null);

  // Flowing geodesic particles along generators
  const photonsRef = useRef<GeodesicPhoton[]>(
    Array.from({ length: 32 }, (_, i) => ({
      u: -800 + Math.random() * 1600,
      vFrac: (i % 16) / 16,
      speed: 1.8 + Math.random() * 1.5,
    }))
  );

  // Handle external reset signal
  useEffect(() => {
    if (resetSignal !== undefined && resetSignal > 0) {
      zoomRef.current = 1.0;
      touchRotXRef.current = 0;
      touchRotYRef.current = 0;
      touchRotZRef.current = 0;
    }
  }, [resetSignal]);

  // Accelerometer and mouse listener setup
  useEffect(() => {
    let hasMotionSensor = false;

    const handleMotionEvent = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (acc && acc.x !== null && acc.y !== null) {
        hasMotionSensor = true;
        targetSensorXRef.current = acc.x;
        targetSensorYRef.current = acc.y;
      }
    };

    const handleOrientationEvent = (event: DeviceOrientationEvent) => {
      if (hasMotionSensor) return;
      if (event.gamma !== null && event.beta !== null) {
        targetSensorXRef.current = (event.gamma / 45) * 9.8;
        targetSensorYRef.current = (event.beta / 45) * 9.8;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!hasMotionSensor) {
        const w = window.innerWidth || 1000;
        const h = window.innerHeight || 800;
        const normX = (event.clientX / w) * 2 - 1;
        const normY = (event.clientY / h) * 2 - 1;
        targetSensorXRef.current = normX * 9.8;
        targetSensorYRef.current = normY * 9.8;
      }
    };

    window.addEventListener('devicemotion', handleMotionEvent);
    window.addEventListener('deviceorientation', handleOrientationEvent);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('devicemotion', handleMotionEvent);
      window.removeEventListener('deviceorientation', handleOrientationEvent);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;
    let lastStatsTime = performance.now();
    let frameCount = 0;
    let currentFps = 60;
    let lastTime = performance.now();

    const render = () => {
      const now = performance.now();
      const dt = Math.min(50, now - lastTime);
      lastTime = now;

      frameCount++;
      if (now - lastStatsTime >= 300) {
        currentFps = Math.round((frameCount * 1000) / (now - lastStatsTime));
        frameCount = 0;
        lastStatsTime = now;
        if (onStatsUpdate) {
          onStatsUpdate({
            zoom: zoomRef.current,
            pitch: -filteredYRef.current * 0.1,
            roll: -filteredXRef.current * 0.1,
            fps: currentFps,
          });
        }
      }

      const cfg = configRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Background
      if (cfg.useBg) {
        ctx.fillStyle = hsvToRgb(cfg.bgHue, 1, 0.28);
      } else {
        ctx.fillStyle = '#000000';
      }
      ctx.fillRect(0, 0, w, h);

      // Movement smoothing
      const smoothAlpha = 1 - cfg.smoothProgress / 100;
      filteredXRef.current += smoothAlpha * (targetSensorXRef.current - filteredXRef.current);
      filteredYRef.current += smoothAlpha * (targetSensorYRef.current - filteredYRef.current);

      const roll = -filteredXRef.current * 0.1;
      const pitch = -filteredYRef.current * 0.1;

      // Spin
      const spinSpeed = (cfg.spinProgress - 50) / 500;
      currentSpinRef.current += spinSpeed;
      const currentSpin = currentSpinRef.current;

      const cx = w / 2;
      const cy = h / 2;
      const cameraDist = 1300;
      const fovDeg = Math.max(30, Math.min(110, cfg.fov || 65));
      const fovRad = (fovDeg * Math.PI) / 180;
      // Realistic pinhole perspective focal length scaled to canvas height and user zoom
      const focalLength = ((h * 0.5) / Math.tan(fovRad * 0.5)) * zoomRef.current;
      const zNear = 50;

      // 3D Near-plane line clipping against camera near plane
      const clipLineNear = (
        p1: [number, number, number],
        p2: [number, number, number]
      ): [[number, number, number], [number, number, number]] | null => {
        const z1 = p1[2];
        const z2 = p2[2];
        if (z1 < zNear && z2 < zNear) return null;
        if (z1 >= zNear && z2 >= zNear) return [p1, p2];

        const t = (zNear - z1) / (z2 - z1);
        const clipped: [number, number, number] = [
          p1[0] + t * (p2[0] - p1[0]),
          p1[1] + t * (p2[1] - p1[1]),
          zNear,
        ];
        return z1 < zNear ? [clipped, p2] : [p1, clipped];
      };

      // Project point in camera coordinates to 2D screen coordinates
      const project = (p: [number, number, number]): [number, number] => {
        const invZ = 1 / p[2];
        return [p[0] * invZ * focalLength + cx, p[1] * invZ * focalLength + cy];
      };

      // Depth bins for perspective cues & depth falloff (aerial perspective)
      const NUM_BINS = 12;
      // We partition segments by bin and whether they are rings, generators, or special rings
      type SegmentKind = 'room' | 'ring' | 'gen' | 'throat' | 'accretion';
      interface DepthBinItem {
        p1: [number, number];
        p2: [number, number];
        kind: SegmentKind;
        uAvg: number;
      }
      const depthBins: DepthBinItem[][] = Array.from({ length: NUM_BINS }, () => []);

      const zMin = 350;
      const zMax = 2300;

      const addSegment = (
        p1: [number, number, number],
        p2: [number, number, number],
        kind: SegmentKind = 'ring',
        uAvg = 0
      ) => {
        const clipped = clipLineNear(p1, p2);
        if (!clipped) return;

        const s1 = project(clipped[0]);
        const s2 = project(clipped[1]);

        if (!Number.isFinite(s1[0]) || !Number.isFinite(s1[1]) || !Number.isFinite(s2[0]) || !Number.isFinite(s2[1])) {
          return;
        }

        const zAvg = (clipped[0][2] + clipped[1][2]) * 0.5;
        const normZ = Math.max(0, Math.min(1, (zAvg - zMin) / (zMax - zMin)));
        const binIndex = Math.min(NUM_BINS - 1, Math.max(0, Math.floor(normZ * NUM_BINS)));

        depthBins[binIndex].push({ p1: s1, p2: s2, kind, uAvg });
      };

      // 2. Draw Room (World Space - Accelerometer Only)
      if (cfg.roomSize > 10) {
        const s = cfg.roomSize;
        const cube: [number, number, number][] = [
          [-s, -s, -s],
          [s, -s, -s],
          [s, s, -s],
          [-s, s, -s],
          [-s, -s, s],
          [s, -s, s],
          [s, s, s],
          [-s, s, s],
        ];

        const roomCam: [number, number, number][] = [];
        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);
        const cosRoll = Math.cos(roll);
        const sinRoll = Math.sin(roll);

        for (let i = 0; i < 8; i++) {
          const rx = cube[i][0];
          const ry = cube[i][1];
          const rz = cube[i][2];

          const y1 = ry * cosPitch - rz * sinPitch;
          const z1 = ry * sinPitch + rz * cosPitch;
          const x2 = rx * cosRoll + z1 * sinRoll;
          const z2 = -rx * sinRoll + z1 * cosRoll;

          roomCam[i] = [x2, y1, z2 + cameraDist];
        }

        // Room back wall
        addSegment(roomCam[4], roomCam[5], 'room');
        addSegment(roomCam[5], roomCam[6], 'room');
        addSegment(roomCam[6], roomCam[7], 'room');
        addSegment(roomCam[7], roomCam[4], 'room');

        // Room side walls
        addSegment(roomCam[0], roomCam[4], 'room');
        addSegment(roomCam[1], roomCam[5], 'room');
        addSegment(roomCam[2], roomCam[6], 'room');
        addSegment(roomCam[3], roomCam[7], 'room');

        // Room front edges
        addSegment(roomCam[0], roomCam[1], 'room');
        addSegment(roomCam[1], roomCam[2], 'room');
        addSegment(roomCam[2], roomCam[3], 'room');
        addSegment(roomCam[3], roomCam[0], 'room');
      }

      // 3. Mathematical Parameters for Wormhole
      const lineMult = (cfg.lineProgress + 10) / 50;
      const numU = Math.max(4, Math.floor(40 * lineMult));
      const numV = Math.max(4, Math.floor(24 * lineMult));

      const uMin = -800;
      const uMax = 800;
      const uStep = (uMax - uMin) / (numU - 1);
      const flareVal = cfg.flare / 50;
      const b = Math.max(1, cfg.expansion);
      const pExp = Math.max(0.5, Math.min(4.0, cfg.throatPower ?? 1.0));
      const asymFactor = (cfg.asymmetry ?? 0) / 100;

      // Mathematical function for generalized throat profile r(u)
      const computeRadius = (u: number): number => {
        let rBase: number;
        if (Math.abs(pExp - 1.0) < 0.01) {
          rBase = Math.sqrt(u * u + b * b);
        } else {
          const u2p = Math.pow(Math.abs(u), 2 * pExp);
          const b2p = Math.pow(b, 2 * pExp);
          rBase = Math.pow(u2p + b2p, 1 / (2 * pExp));
        }

        // Differential mouth asymmetry
        const asym = 1 + asymFactor * Math.tanh(u / 320);
        // Flare expansion term
        const flareTerm = flareVal * ((u * u) / 500) * (1 + (u > 0 ? asymFactor * 0.5 : -asymFactor * 0.5));
        return rBase * asym + flareTerm;
      };

      const touchRotX = touchRotXRef.current;
      const touchRotY = touchRotYRef.current;
      const touchRotZ = touchRotZRef.current;

      const cosRotZ = Math.cos(touchRotZ);
      const sinRotZ = Math.sin(touchRotZ);
      const cosRotX = Math.cos(touchRotX);
      const sinRotX = Math.sin(touchRotX);
      const cosRotY = Math.cos(touchRotY);
      const sinRotY = Math.sin(touchRotY);

      const cosPitch = Math.cos(pitch);
      const sinPitch = Math.sin(pitch);
      const cosRoll = Math.cos(roll);
      const sinRoll = Math.sin(roll);

      // Coordinate transformation helper
      const transformPoint = (x: number, y: number, z: number): [number, number, number] => {
        // 1. Twist (Z)
        const tx = x * cosRotZ - y * sinRotZ;
        const ty = x * sinRotZ + y * cosRotZ;

        // 2. Drag (X)
        const ty2 = ty * cosRotX - z * sinRotX;
        const tz2 = ty * sinRotX + z * cosRotX;

        // 3. Drag (Y)
        const tx3 = tx * cosRotY + tz2 * sinRotY;
        const tz3 = -tx * sinRotY + tz2 * cosRotY;

        // 4. Sensor/Orientation (Pitch/Roll)
        const y1 = ty2 * cosPitch - tz3 * sinPitch;
        const z1 = ty2 * sinPitch + tz3 * cosPitch;
        const x2 = tx3 * cosRoll + z1 * sinRoll;
        const z2 = -tx3 * sinRoll + z1 * cosRoll;

        return [x2, y1, z2 + cameraDist];
      };

      // 4. Generate Wormhole 3D Mesh
      const points3D: [number, number, number][][] = new Array(numU);
      let closestUIndex = 0;
      let minAbsU = Infinity;

      for (let i = 0; i < numU; i++) {
        const u = uMin + i * uStep;
        if (Math.abs(u) < minAbsU) {
          minAbsU = Math.abs(u);
          closestUIndex = i;
        }

        const r = computeRadius(u);
        points3D[i] = new Array(numV);

        for (let j = 0; j < numV; j++) {
          const v = (j * 2 * Math.PI) / numV + currentSpin;
          const x = r * Math.cos(v);
          const y = r * Math.sin(v);
          const z = u;

          points3D[i][j] = transformPoint(x, y, z);
        }
      }

      // Populate rings along v circles
      for (let i = 0; i < numU; i++) {
        const u = uMin + i * uStep;
        const isThroatRing = (cfg.throatGlow ?? true) && i === closestUIndex;
        const kind: SegmentKind = isThroatRing ? 'throat' : 'ring';

        for (let j = 0; j < numV; j++) {
          addSegment(points3D[i][j], points3D[i][(j + 1) % numV], kind, u);
        }
      }

      // Populate generators along u lines
      for (let j = 0; j < numV; j++) {
        for (let i = 0; i < numU - 1; i++) {
          const uAvg = uMin + (i + 0.5) * uStep;
          addSegment(points3D[i][j], points3D[i + 1][j], 'gen', uAvg);
        }
      }

      // 5. Equatorial Accretion Disk / Photon Orbit Disk
      if (cfg.showAccretion) {
        const numRings = 4;
        const segmentsPerRing = 32;
        const diskTime = now * 0.001;

        for (let rIdx = 0; rIdx < numRings; rIdx++) {
          const rRing = b * (1.25 + rIdx * 0.45);
          // Keplerian orbit speed: inner rings spin faster than outer rings
          const omega = 0.5 * Math.pow(b / rRing, 1.5);
          const ringAngleOffset = diskTime * omega;

          let prevPt: [number, number, number] | null = null;
          let firstPt: [number, number, number] | null = null;

          for (let sIdx = 0; sIdx <= segmentsPerRing; sIdx++) {
            const theta = (sIdx * 2 * Math.PI) / segmentsPerRing + ringAngleOffset;
            const x = rRing * Math.cos(theta);
            const y = rRing * Math.sin(theta);
            const z = 0; // Exactly on the throat equator

            const pCam = transformPoint(x, y, z);
            if (sIdx === 0) firstPt = pCam;

            if (prevPt) {
              // Add dashed or solid accretion ring segment
              if (sIdx % 2 === 0 || rIdx === 0) {
                addSegment(prevPt, pCam, 'accretion', 0);
              }
            }
            prevPt = pCam;
          }

          if (prevPt && firstPt) {
            addSegment(prevPt, firstPt, 'accretion', 0);
          }
        }
      }

      // 6. Color Resolver Function
      const theme = cfg.colorTheme || 'monochrome';
      const depthStrength = (cfg.depthShading ?? 75) / 100;

      const getColor = (
        kind: SegmentKind,
        normK: number,
        uAvg: number
      ): { stroke: string; widthMultiplier: number } => {
        const baseAlpha = kind === 'throat' ? 1.0 : kind === 'room' ? 0.75 : 0.95;
        const farAlpha = kind === 'throat' ? 0.45 : kind === 'room' ? 0.15 : 0.18;
        const alpha = Math.max(0.1, baseAlpha - (baseAlpha - farAlpha) * normK * depthStrength);

        if (kind === 'room') {
          return { stroke: `rgba(255, 255, 255, ${alpha.toFixed(3)})`, widthMultiplier: 0.9 };
        }

        if (kind === 'throat') {
          switch (theme) {
            case 'redshift':
              return { stroke: `rgba(232, 121, 249, ${alpha.toFixed(3)})`, widthMultiplier: 1.8 };
            case 'neon':
              return { stroke: `rgba(244, 114, 182, ${alpha.toFixed(3)})`, widthMultiplier: 1.8 };
            case 'matrix':
              return { stroke: `rgba(134, 239, 172, ${alpha.toFixed(3)})`, widthMultiplier: 1.8 };
            case 'solar':
              return { stroke: `rgba(254, 240, 138, ${alpha.toFixed(3)})`, widthMultiplier: 1.8 };
            case 'monochrome':
            default:
              return { stroke: `rgba(255, 255, 255, ${alpha.toFixed(3)})`, widthMultiplier: 1.8 };
          }
        }

        if (kind === 'accretion') {
          switch (theme) {
            case 'redshift':
              return { stroke: `rgba(251, 146, 60, ${alpha.toFixed(3)})`, widthMultiplier: 1.2 };
            case 'neon':
              return { stroke: `rgba(245, 158, 11, ${alpha.toFixed(3)})`, widthMultiplier: 1.2 };
            case 'matrix':
              return { stroke: `rgba(74, 222, 128, ${alpha.toFixed(3)})`, widthMultiplier: 1.2 };
            case 'solar':
              return { stroke: `rgba(251, 191, 36, ${alpha.toFixed(3)})`, widthMultiplier: 1.2 };
            case 'monochrome':
            default:
              return { stroke: `rgba(200, 225, 255, ${alpha.toFixed(3)})`, widthMultiplier: 1.2 };
          }
        }

        // Standard Rings & Generators
        switch (theme) {
          case 'redshift': {
            // u > 0 is outer/approaching (cyan/blue), u < 0 is inner/receding (amber/rose)
            const t = Math.max(0, Math.min(1, (uAvg + 800) / 1600));
            let r: number, g: number, bCol: number;
            if (t < 0.5) {
              const f = t / 0.5;
              r = Math.round(244 + f * (168 - 244));
              g = Math.round(63 + f * (85 - 63));
              bCol = Math.round(94 + f * (247 - 94));
            } else {
              const f = (t - 0.5) / 0.5;
              r = Math.round(168 + f * (56 - 168));
              g = Math.round(85 + f * (189 - 85));
              bCol = Math.round(247 + f * (248 - 247));
            }
            return { stroke: `rgba(${r}, ${g}, ${bCol}, ${alpha.toFixed(3)})`, widthMultiplier: 1.0 };
          }

          case 'neon': {
            if (kind === 'ring') {
              return { stroke: `rgba(34, 211, 238, ${alpha.toFixed(3)})`, widthMultiplier: 1.05 };
            } else {
              return { stroke: `rgba(251, 191, 36, ${alpha.toFixed(3)})`, widthMultiplier: 0.95 };
            }
          }

          case 'matrix': {
            const g = Math.round(190 - normK * 40);
            return { stroke: `rgba(34, ${g}, 94, ${alpha.toFixed(3)})`, widthMultiplier: 1.0 };
          }

          case 'solar': {
            if (kind === 'ring') {
              return { stroke: `rgba(250, 204, 21, ${alpha.toFixed(3)})`, widthMultiplier: 1.05 };
            } else {
              return { stroke: `rgba(239, 68, 68, ${alpha.toFixed(3)})`, widthMultiplier: 0.95 };
            }
          }

          case 'monochrome':
          default:
            return { stroke: `rgba(255, 255, 255, ${alpha.toFixed(3)})`, widthMultiplier: 1.0 };
        }
      };

      // 7. Render depth bins back-to-front
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let k = NUM_BINS - 1; k >= 0; k--) {
        const binItems = depthBins[k];
        if (binItems.length === 0) continue;

        const normK = k / (NUM_BINS - 1);
        const baseWidth = 3.2;
        const width = baseWidth * (1 - normK * 0.68 * depthStrength) + (1 - depthStrength) * 0.4;

        // Group by style to minimize Canvas context state switches
        const groups = new Map<string, { path: Path2D; lineWidth: number }>();

        for (let i = 0; i < binItems.length; i++) {
          const item = binItems[i];
          const { stroke, widthMultiplier } = getColor(item.kind, normK, item.uAvg);
          const key = `${stroke}|${widthMultiplier.toFixed(2)}`;

          let group = groups.get(key);
          if (!group) {
            group = {
              path: new Path2D(),
              lineWidth: Math.max(0.7, width * widthMultiplier),
            };
            groups.set(key, group);
          }

          group.path.moveTo(item.p1[0], item.p1[1]);
          group.path.lineTo(item.p2[0], item.p2[1]);
        }

        for (const [key, group] of groups.entries()) {
          const stroke = key.split('|')[0];
          ctx.strokeStyle = stroke;
          ctx.lineWidth = group.lineWidth;
          ctx.stroke(group.path);
        }
      }

      // 8. Traversing Geodesic Photons
      if (cfg.showGeodesics ?? true) {
        const photons = photonsRef.current;
        const photonSpeedMult = 1.0 + (cfg.spinProgress / 50) * 0.5;

        for (let pIdx = 0; pIdx < photons.length; pIdx++) {
          const ph = photons[pIdx];
          ph.u += ph.speed * photonSpeedMult * (dt / 16);
          if (ph.u > uMax) {
            ph.u = uMin;
          }

          const r = computeRadius(ph.u);
          const v = ph.vFrac * 2 * Math.PI + currentSpin;
          const x = r * Math.cos(v);
          const y = r * Math.sin(v);
          const z = ph.u;

          const pCam = transformPoint(x, y, z);
          if (pCam[2] >= zNear) {
            const screenPt = project(pCam);
            if (
              screenPt[0] >= -50 &&
              screenPt[0] <= w + 50 &&
              screenPt[1] >= -50 &&
              screenPt[1] <= h + 50
            ) {
              const normZ = Math.max(0, Math.min(1, (pCam[2] - zMin) / (zMax - zMin)));
              const pAlpha = Math.max(0.2, 1.0 - normZ * depthStrength * 0.7);
              const pRadius = Math.max(1.2, 3.5 * (1 - normZ * 0.6) * zoomRef.current);

              ctx.beginPath();
              ctx.arc(screenPt[0], screenPt[1], pRadius, 0, Math.PI * 2);

              if (theme === 'redshift') {
                ctx.fillStyle = ph.u > 0 ? `rgba(56, 189, 248, ${pAlpha})` : `rgba(251, 113, 133, ${pAlpha})`;
              } else if (theme === 'neon') {
                ctx.fillStyle = `rgba(254, 240, 138, ${pAlpha})`;
              } else if (theme === 'matrix') {
                ctx.fillStyle = `rgba(134, 239, 172, ${pAlpha})`;
              } else if (theme === 'solar') {
                ctx.fillStyle = `rgba(253, 224, 71, ${pAlpha})`;
              } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${pAlpha})`;
              }
              ctx.fill();
            }
          }
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onStatsUpdate]);

  // Multi-touch gestures
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      const x1 = e.touches[0].clientX;
      const y1 = e.touches[0].clientY;
      const x2 = e.touches[1].clientX;
      const y2 = e.touches[1].clientY;

      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      const dist = Math.hypot(x2 - x1, y2 - y1);

      lastTouchPosRef.current = { cx, cy, angle, dist };
    } else if (e.touches.length === 1) {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      lastTouchPosRef.current = { cx: x, cy: y, angle: 0, dist: 0 };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && lastTouchPosRef.current) {
      const x1 = e.touches[0].clientX;
      const y1 = e.touches[0].clientY;
      const x2 = e.touches[1].clientX;
      const y2 = e.touches[1].clientY;

      const cx = (x1 + x2) / 2;
      const cy = (y1 + y2) / 2;
      const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      const dist = Math.hypot(x2 - x1, y2 - y1);

      const dx = cx - lastTouchPosRef.current.cx;
      const dy = cy - lastTouchPosRef.current.cy;
      const dAngle = angle - lastTouchPosRef.current.angle;

      // Two-touch rotation (drag and twist)
      touchRotYRef.current += dx * 0.005;
      touchRotXRef.current += dy * 0.005;
      touchRotZRef.current += (dAngle * Math.PI) / 180;

      // Two-touch pinch zoom in and out
      if (lastTouchPosRef.current.dist > 0 && dist > 0) {
        const factor = dist / lastTouchPosRef.current.dist;
        zoomRef.current = Math.max(0.15, Math.min(8.0, zoomRef.current * factor));
      }

      lastTouchPosRef.current = { cx, cy, angle, dist };
    } else if (e.touches.length === 1 && lastTouchPosRef.current) {
      const cx = e.touches[0].clientX;
      const cy = e.touches[0].clientY;

      const dx = cx - lastTouchPosRef.current.cx;
      const dy = cy - lastTouchPosRef.current.cy;

      touchRotYRef.current += dx * 0.005;
      touchRotXRef.current += dy * 0.005;

      lastTouchPosRef.current = { cx, cy, angle: 0, dist: 0 };
    }
  };

  const handleTouchEnd = () => {
    lastTouchPosRef.current = null;
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMouseDownRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, button: e.button };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current || !lastMousePosRef.current) return;

    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    if (lastMousePosRef.current.button === 2) {
      // Right-click drag -> roll (Z rotation)
      touchRotZRef.current += dx * 0.005;
    } else {
      // Left-click drag -> pitch & yaw (X & Y rotation)
      touchRotYRef.current += dx * 0.005;
      touchRotXRef.current += dy * 0.005;
    }

    lastMousePosRef.current = { x: e.clientX, y: e.clientY, button: lastMousePosRef.current.button };
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
    lastMousePosRef.current = null;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    zoomRef.current = Math.max(0.15, Math.min(8.0, zoomRef.current * factor));
  };

  const handleReset = () => {
    zoomRef.current = 1.0;
    touchRotXRef.current = 0;
    touchRotYRef.current = 0;
    touchRotZRef.current = 0;
  };

  return (
    <canvas
      ref={canvasRef}
      id="wormholeCanvas"
      className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={handleReset}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
