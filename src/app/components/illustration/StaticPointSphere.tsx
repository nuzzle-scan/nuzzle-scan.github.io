import { fibonacciSphere, rotatePoint, project, proximity } from "./pointCloudMath";

const POINT_COUNT = 200;
const HIGHLIGHT_COUNT = 14;
const CAMERA_Z = 1.1;
const FOCAL = 1.4;
const YAW = 4.4;
const PITCH = 0.18;

interface Circle {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  highlight: number;
}

function buildCircles(): Circle[] {
  const points = fibonacciSphere(POINT_COUNT);
  const step = Math.floor(POINT_COUNT / HIGHLIGHT_COUNT);
  const offset = Math.floor(step / 2);
  const circles: Circle[] = [];

  for (let i = 0; i < points.length; i++) {
    const rotated = rotatePoint(points[i], YAW, PITCH);
    const proj = project(rotated, CAMERA_Z, FOCAL);
    if (proj.relZ <= 0.02) continue;

    const r = Math.max(0.18, Math.min(proj.scale * 0.55, 0.8));
    const depthOpacity = Math.max(0.15, Math.min(proj.scale * 0.55, 1));
    const highlight = i % step === offset ? proximity(proj.relZ) : 0;

    circles.push({
      cx: 50 + proj.x * 38,
      cy: 50 + proj.y * 38,
      r,
      opacity: Math.max(depthOpacity, highlight),
      highlight,
    });
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
        <g key={i}>
          {c.highlight > 0.05 && (
            <circle cx={c.cx} cy={c.cy} r={c.r * (2 + c.highlight * 3)} fill="var(--fox)" opacity={c.highlight * 0.18} />
          )}
          <circle cx={c.cx} cy={c.cy} r={c.r} fill={c.highlight > 0.05 ? "var(--fox)" : "var(--sage)"} opacity={c.opacity} />
        </g>
      ))}
    </svg>
  );
}
