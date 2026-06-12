import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import { fibonacciSphere, rotatePoint, project, proximity, lerp, hexToRgb } from "./pointCloudMath";

const POINT_COUNT = 320;
const HIGHLIGHT_COUNT = 22;
const CAMERA_START = 2.6;
const CAMERA_END = 0.2;
const FOCAL = 1.4;

interface PointCloudProps {
  /** 0 at the top of the hero, 1 once the scroll-driven zoom is complete. */
  scrollProgress: MotionValue<number>;
}

/**
 * Mouse-reactive, scroll-zooming sphere of points. Most points stay
 * `--sage`; a handful flare to `--fox`/`--rust` as they pass close to the
 * camera, standing in for the rare flagged models in a field of scanned ones.
 */
export function PointCloud({ scrollProgress }: PointCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    const points = fibonacciSphere(POINT_COUNT);
    const highlightStep = Math.floor(POINT_COUNT / HIGHLIGHT_COUNT);
    const highlightOffset = Math.floor(highlightStep / 2);

    const rootStyle = getComputedStyle(document.documentElement);
    const [sr, sg, sb] = hexToRgb(rootStyle.getPropertyValue("--sage") || "#7FA068");
    const [fr, fg, fb] = hexToRgb(rootStyle.getPropertyValue("--fox") || "#D96A2C");

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    const pointer = { x: 0, y: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    };
    const onPointerLeave = () => {
      pointer.x = 0;
      pointer.y = 0;
    };
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    let yaw = 0;
    let pitch = 0;
    let autoRotate = 0;
    let frame = requestAnimationFrame(draw);

    function draw() {
      frame = requestAnimationFrame(draw);
      if (width === 0 || height === 0) return;

      yaw += (pointer.x * 0.35 - yaw) * 0.05;
      pitch += (-pointer.y * 0.22 - pitch) * 0.05;
      autoRotate += 0.0006;

      const progress = scrollProgress.get();
      const cameraZ = lerp(CAMERA_START, CAMERA_END, progress);
      const scaleFactor = Math.min(width, height) * 0.46;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < points.length; i++) {
        const rotated = rotatePoint(points[i], yaw + autoRotate, pitch);
        const proj = project(rotated, cameraZ, FOCAL);
        if (proj.relZ <= 0.02) continue;

        const screenX = cx + proj.x * scaleFactor;
        const screenY = cy + proj.y * scaleFactor;
        if (screenX < -80 || screenX > width + 80 || screenY < -80 || screenY > height + 80) continue;

        const size = Math.max(0.6, Math.min(proj.scale * 2.6, 14));
        const depthOpacity = Math.max(0.12, Math.min(proj.scale * 0.55, 1));

        let r = sr;
        let g = sg;
        let b = sb;
        let opacity = depthOpacity;

        if (i % highlightStep === highlightOffset) {
          const t = proximity(proj.relZ);
          r = lerp(sr, fr, t);
          g = lerp(sg, fg, t);
          b = lerp(sb, fb, t);
          opacity = Math.max(depthOpacity, t);

          if (t > 0.05) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(${fr}, ${fg}, ${fb}, ${t * 0.18})`;
            ctx.arc(screenX, screenY, size * (2 + t * 3), 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [scrollProgress]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0">
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
    </div>
  );
}
