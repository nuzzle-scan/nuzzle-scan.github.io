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

/** Small, fast, seeded PRNG — deterministic point scatter across reloads. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Disordered points on a unit sphere: even latitude coverage (no big holes)
 * but randomized azimuth + jittered latitude, so the Fibonacci spiral lines
 * that read as "aligned" are gone.
 */
export function jitteredSphere(count: number, rand: () => number): Vec3[] {
  const points: Vec3[] = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const latJitter = 1.7 / count;
  for (let i = 0; i < count; i++) {
    const y = Math.max(-1, Math.min(1, 1 - (i / (count - 1)) * 2 + (rand() * 2 - 1) * latJitter));
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = 1*(goldenAngle * i + (rand() * 2 - 1) * 1.0);
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

/** Hermite ramp: 0 below edge0, 1 above edge1, smooth in between. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** Scale a vector to unit length (used to seed bubble positions on the sphere). */
export function normalize(p: Vec3): Vec3 {
  const len = Math.hypot(p.x, p.y, p.z) || 1;
  return { x: p.x / len, y: p.y / len, z: p.z / len };
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.trim().replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}
