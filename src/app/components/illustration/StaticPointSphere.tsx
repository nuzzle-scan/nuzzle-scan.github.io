import { jitteredSphere, mulberry32, rotatePoint, project } from "./pointCloudMath";

const POINT_COUNT = 260;
const CAMERA_Z = 1.1;
const FOCAL = 1.4;
const YAW = 4.4;
const PITCH = 0.18;

interface Circle {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
}

function buildCircles(): Circle[] {
  const points = jitteredSphere(POINT_COUNT, mulberry32(0x4e757a));
  const circles: Circle[] = [];

  for (let i = 0; i < points.length; i++) {
    const rotated = rotatePoint(points[i], YAW, PITCH);
    const proj = project(rotated, CAMERA_Z, FOCAL);
    if (proj.relZ <= 0.02) continue;

    const r = Math.max(0.18, Math.min(proj.scale * 0.55, 0.8));
    const opacity = Math.max(0.15, Math.min(proj.scale * 0.55, 1));

    circles.push({ cx: 50 + proj.x * 38, cy: 50 + proj.y * 38, r, opacity });
  }
  return circles;
}

const CIRCLES = buildCircles();

/**
 * Static, non-animated rendering of the same point sphere used by
 * `PointCloud`, frozen mid-zoom — for `<900px` viewports and
 * `prefers-reduced-motion`, where the canvas/scroll effect is skipped.
 */
export function StaticPointSphere({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <rect width="100" height="100" fill="var(--bg-deep)" />
      {CIRCLES.map((c, i) => (
        <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill="var(--sage)" opacity={c.opacity} />
      ))}
    </svg>
  );
}
