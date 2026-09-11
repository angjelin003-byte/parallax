import React, { useEffect, useRef } from 'react';
import { WormholeConfig } from '../types';

interface WormholeCanvasProps {
  config: WormholeConfig;
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

export const WormholeCanvas: React.FC<WormholeCanvasProps> = ({ config }) => {
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

    const render = () => {
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

      // Background matching Android WormholeView
      if (cfg.useBg) {
        ctx.fillStyle = hsvToRgb(cfg.bgHue, 1, 0.3);
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
      const zNear = 60;

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

      // Project point in camera coordinates (z >= zNear) to 2D screen coordinates
      const project = (p: [number, number, number]): [number, number] => {
        const invZ = 1 / p[2];
        return [p[0] * invZ * focalLength + cx, p[1] * invZ * focalLength + cy];
      };

      // Depth bins for realistic perspective cues & depth falloff (aerial perspective)
      const NUM_BINS = 12;
      const binPaths: Path2D[] = Array.from({ length: NUM_BINS }, () => new Path2D());
      const zMin = 350;
      const zMax = 2300;
      const depthStrength = (cfg.depthShading ?? 75) / 100;

      const addSegment = (p1: [number, number, number], p2: [number, number, number]) => {
        const clipped = clipLineNear(p1, p2);
        if (!clipped) return;

        const s1 = project(clipped[0]);
        const s2 = project(clipped[1]);

        // Guard against non-finite projection values
        if (!Number.isFinite(s1[0]) || !Number.isFinite(s1[1]) || !Number.isFinite(s2[0]) || !Number.isFinite(s2[1])) {
          return;
        }

        const zAvg = (clipped[0][2] + clipped[1][2]) * 0.5;
        const normZ = Math.max(0, Math.min(1, (zAvg - zMin) / (zMax - zMin)));
        const binIndex = Math.min(NUM_BINS - 1, Math.max(0, Math.floor(normZ * NUM_BINS)));

        binPaths[binIndex].moveTo(s1[0], s1[1]);
        binPaths[binIndex].lineTo(s2[0], s2[1]);
      };

      // 1. Draw Room (World Space - Accelerometer Only)
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
        addSegment(roomCam[4], roomCam[5]);
        addSegment(roomCam[5], roomCam[6]);
        addSegment(roomCam[6], roomCam[7]);
        addSegment(roomCam[7], roomCam[4]);

        // Room side walls
        addSegment(roomCam[0], roomCam[4]);
        addSegment(roomCam[1], roomCam[5]);
        addSegment(roomCam[2], roomCam[6]);
        addSegment(roomCam[3], roomCam[7]);

        // Room front edges
        addSegment(roomCam[0], roomCam[1]);
        addSegment(roomCam[1], roomCam[2]);
        addSegment(roomCam[2], roomCam[3]);
        addSegment(roomCam[3], roomCam[0]);
      }

      // 2. Draw Wormhole (Local Space - Touch Rotation + Accelerometer)
      const lineMult = (cfg.lineProgress + 10) / 50;
      const numU = Math.max(4, Math.floor(40 * lineMult));
      const numV = Math.max(4, Math.floor(24 * lineMult));

      const uMin = -800;
      const uMax = 800;
      const uStep = (uMax - uMin) / (numU - 1);
      const flareVal = cfg.flare / 50;
      const expansion = cfg.expansion;

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

      const points3D: [number, number, number][][] = new Array(numU);

      for (let i = 0; i < numU; i++) {
        const u = uMin + i * uStep;
        const r = Math.sqrt(u * u + expansion * expansion) + flareVal * ((u * u) / 500);
        points3D[i] = new Array(numV);

        for (let j = 0; j < numV; j++) {
          const v = (j * 2 * Math.PI) / numV + currentSpin;

          let x = r * Math.cos(v);
          let y = r * Math.sin(v);
          let z = u;

          // Apply 2-finger twist (Z)
          const tx = x * cosRotZ - y * sinRotZ;
          const ty = x * sinRotZ + y * cosRotZ;
          x = tx;
          y = ty;

          // Apply 2-finger drag (X)
          const ty2 = y * cosRotX - z * sinRotX;
          const tz2 = y * sinRotX + z * cosRotX;
          y = ty2;
          z = tz2;

          // Apply 2-finger drag (Y)
          const tx3 = x * cosRotY + z * sinRotY;
          const tz3 = -x * sinRotY + z * cosRotY;
          x = tx3;
          z = tz3;

          // Apply Accelerometer (Pitch/Roll)
          const y1 = y * cosPitch - z * sinPitch;
          const z1 = y * sinPitch + z * cosPitch;
          const x2 = x * cosRoll + z1 * sinRoll;
          const z2 = -x * sinRoll + z1 * cosRoll;

          points3D[i][j] = [x2, y1, z2 + cameraDist];
        }
      }

      // Populate rings along v circles
      for (let i = 0; i < numU; i++) {
        for (let j = 0; j < numV; j++) {
          addSegment(points3D[i][j], points3D[i][(j + 1) % numV]);
        }
      }

      // Populate generators along u lines
      for (let j = 0; j < numV; j++) {
        for (let i = 0; i < numU - 1; i++) {
          addSegment(points3D[i][j], points3D[i + 1][j]);
        }
      }

      // Render depth bins back-to-front for realistic depth sorting and aerial perspective
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let k = NUM_BINS - 1; k >= 0; k--) {
        const normK = k / (NUM_BINS - 1); // 0 (near) .. 1 (far)

        // Line width diminishes realistically with distance
        const baseWidth = 3.2;
        const width = baseWidth * (1 - normK * 0.68 * depthStrength) + (1 - depthStrength) * 0.4;
        ctx.lineWidth = Math.max(0.8, width);

        // Aerial perspective / atmospheric depth falloff
        const nearAlpha = 1.0;
        const farAlpha = 0.18;
        const alpha = nearAlpha - (nearAlpha - farAlpha) * normK * depthStrength;

        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.max(0.12, Math.min(1.0, alpha)).toFixed(3)})`;
        ctx.stroke(binPaths[k]);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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

  // Mouse drag support for desktop
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isMouseDownRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY, button: e.button };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDownRef.current || !lastMousePosRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    if (lastMousePosRef.current.button === 2 || e.shiftKey || e.altKey) {
      touchRotZRef.current += dx * 0.01;
    } else {
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

  return (
    <canvas
      ref={canvasRef}
      id="wormholeView"
      className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing touch-none select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onDoubleClick={() => {
        zoomRef.current = 1.0;
        touchRotXRef.current = 0;
        touchRotYRef.current = 0;
        touchRotZRef.current = 0;
      }}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};
