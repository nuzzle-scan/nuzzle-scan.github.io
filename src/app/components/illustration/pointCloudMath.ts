export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Evenly distributed points on a unit sphere (golden-angle spiral). */
export function fibonacciSphere(count: number): Vec3[] {
  const points: Vec3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    points.push({ x: Math.cos(theta) * radiusAtY, y, z: Math.sin(theta) * radiusAtY });
  }
  return points;
}

/** Yaw around the vertical axis, then pitch around the horizontal axis. */
export function rotatePoint(p: Vec3, yaw: number, pitch: number): Vec3 {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = p.x * cosY + p.z * sinY;
  const z1 = -p.x * sinY + p.z * cosY;

  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const y1 = p.y * cosP - z1 * sinP;
  const z2 = p.y * sinP + z1 * cosP;

  return { x: x1, y: y1, z: z2 };
}

export interface Projected {
  x: number;
  y: number;
  scale: number;
  /** Distance in front of the camera; <= 0 means the point is behind it. */
  relZ: number;
}

/** Simple perspective projection: camera sits at z = -cameraZ, looking toward +z. */
export function project(p: Vec3, cameraZ: number, focal: number): Projected {
  const relZ = p.z + cameraZ;
  const scale = focal / Math.max(relZ, 0.001);
  return { x: p.x * scale, y: -p.y * scale, scale, relZ };
}

/**
 * How "lit up" a highlighted point is as it nears the camera — 0 far away,
 * 1 right at the threshold before it passes behind the camera and disappears.
 */
export function proximity(relZ: number, window = 0.85, near = 0.9): number {
  return Math.max(0, Math.min(1, (near - relZ) / window));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.trim().replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}
