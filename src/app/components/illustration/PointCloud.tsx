import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import { jitteredSphere, mulberry32, lerp, smoothstep, hexToRgb } from "./pointCloudMath";
import { BUBBLE_SEEDS, BUBBLE_COUNT } from "./modelLogos";

const POINT_COUNT = 10000;
const CAMERA_START = 2.6;
const CAMERA_END = 1.12;
const FOCAL = 1.4;

// One-time intro: points stream in from a scattered cloud and form the sphere.
const INTRO_MS = 1800;
const INTRO_SPREAD = 4.4; // max start distance off the shell, in sphere radii
const INTRO_STAGGER = 0.4; // fraction of the intro spent staggering start times

// Local cursor repulsion (screen space).
const REPEL_RADIUS = 160;
const REPEL_PUSH = 52;

// When the centred copy appears, dim the field behind it with a radial gradient
// so the text reads; points outside the logo ring keep their full intensity.
const TEXT_DIM = 0.12; // min field intensity at the centre of the text
const DIM_RX = 0.3; // dim-region radius × width
const DIM_RY = 0.22; // dim-region radius × height
const DIM_INNER = 0.45; // fully dimmed within this fraction of the radius
const DIM_OUTER = 1.05; // back to full intensity beyond this fraction

// The colored ring the model-family bubbles live on — fixed in the screen
// plane (not stuck to the sphere). It widens from *_TOP at the top of the page
// to RING_RX/RING_RY once fully zoomed, and slowly rotates clockwise.
const RING_RX = 0.2; // × width, zoomed-in
const RING_RY = 0.3; // × height, zoomed-in
const RING_RX_TOP = 0.12; // × width, at the top
const RING_RY_TOP = 0.15; // × height, at the top
const DOT_SCALE = 0.05; // bubble scale at the top — reads as a tiny colored dot
const BUBBLE_SCALE = 1.2; // bubble scale once fully zoomed in
const RING_SPIN = 0.0016; // slow clockwise turn of the ring, per frame

// Field idle spin — eases to a near-stop as the camera zooms in.
const AUTO_ROTATE = 0.0105;

// Sphere vertical centre: below the title at the top, rising to screen centre
// as you zoom so the zoom stays centred on the middle of the screen.
const SPHERE_CY_TOP = 0.64; // × height
const SPHERE_CY_ZOOM = 0.5; // × height

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

interface PointCloudProps {
  /** 0 at the top of the hero, 1 once the scroll-driven zoom is complete. */
  scrollProgress: MotionValue<number>;
}

/**
 * Mouse-reactive, scroll-zooming sphere of ~1700 disordered points. On mount
 * the points stream in from outside and condense into the shell. Bright
 * `--cream` waves sweep across; points near the cursor are pushed aside and
 * spring back. As the scroll dolly pulls the camera in, model-family bubbles
 * (`BUBBLE_SEEDS`)
 * emerge from the shell and settle into an even circle of brand-colored logos
 * around the centered description.
 */
export function PointCloud({ scrollProgress }: PointCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ctx = context;

    const rand = mulberry32(0x4e757a);
    const points = jitteredSphere(POINT_COUNT, rand);

    // Intro: per-point scattered start offset (model space) + staggered start.
    const startX = new Float32Array(POINT_COUNT);
    const startY = new Float32Array(POINT_COUNT);
    const startZ = new Float32Array(POINT_COUNT);
    const delay = new Float32Array(POINT_COUNT);
    for (let i = 0; i < POINT_COUNT; i++) {
      const u = rand() * 2 - 1;
      const phi = rand() * Math.PI * 2;
      const r = Math.sqrt(Math.max(0, 1 - u * u));
      const dist = 0.8 + rand() * INTRO_SPREAD;
      startX[i] = Math.cos(phi) * r * dist;
      startY[i] = u * dist;
      startZ[i] = Math.sin(phi) * r * dist;
      delay[i] = rand() * INTRO_STAGGER;
    }

    // Per-point screen-space displacement (cursor repulsion) with spring-back.
    const offX = new Float32Array(POINT_COUNT);
    const offY = new Float32Array(POINT_COUNT);

    const rootStyle = getComputedStyle(document.documentElement);
    const [sr, sg, sb] = hexToRgb(rootStyle.getPropertyValue("--sage") || "#7FA068");
    const [cr, cg, cb] = hexToRgb(rootStyle.getPropertyValue("--cream") || "#FFFBF2");

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

    // Raw pixel pointer (for local repulsion) + normalized (for parallax tilt).
    // Park it far offscreen until the first move so nothing is pushed at rest.
    const pointer = { px: -9999, py: -9999, nx: 0, ny: 0 };
    const onPointerMove = (event: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.px = event.clientX - rect.left;
      pointer.py = event.clientY - rect.top;
      pointer.nx = (pointer.px / rect.width) * 2 - 1;
      pointer.ny = (pointer.py / rect.height) * 2 - 1;
    };
    const onPointerLeave = () => {
      pointer.px = -9999;
      pointer.py = -9999;
      pointer.nx = 0;
      pointer.ny = 0;
    };
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerleave", onPointerLeave);

    let yaw = 0;
    let pitch = 0;
    let autoRotate = 0;
    let ringSpin = 0;
    let time = 0;
    let startTime = 0;
    let frame = requestAnimationFrame(draw);

    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      if (width === 0 || height === 0) return;
      if (startTime === 0) startTime = now;
      const intro = Math.min((now - startTime) / INTRO_MS, 1);

      const progress = scrollProgress.get();

      // The field spin eases to a near-stop as the camera zooms in, so the
      // centered text can be read without the dizzying drift.
      const spinFactor = 1 - smoothstep(0.05, 0.7, progress);
      yaw += (pointer.nx * 0.3 - yaw) * 0.05;
      pitch += (-pointer.ny * 0.18 - pitch) * 0.05;
      autoRotate += AUTO_ROTATE * spinFactor;
      ringSpin += RING_SPIN; // colored ring keeps its slow clockwise turn
      time += 0.016;

      const cameraZ = lerp(CAMERA_START, CAMERA_END, progress);
      const scaleFactor = Math.min(width, height) * 0.4;
      const cx = width / 2;
      const cy = height * lerp(SPHERE_CY_TOP, SPHERE_CY_ZOOM, smoothstep(0, 0.55, progress));

      // Dim the field behind the centred copy as it reveals (matches Hero's
      // reveal window). 0 = no dimming, 1 = full dim applied.
      const textReveal = smoothstep(0.8, 0.92, progress);
      const dimRx = width * DIM_RX;
      const dimRy = height * DIM_RY;

      // Rotation is constant across the frame — hoist the trig out of the loop.
      const ry = yaw + autoRotate;
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const cosP = Math.cos(pitch);
      const sinP = Math.sin(pitch);

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < POINT_COUNT; i++) {
        // Intro: ease this point in from its scattered start toward the shell.
        const localT = INTRO_STAGGER < 1 ? Math.min(Math.max((intro - delay[i]) / (1 - INTRO_STAGGER), 0), 1) : 1;
        const offWeight = 1 - easeOutCubic(localT);

        const p = points[i];
        const ax = p.x + startX[i] * offWeight;
        const ay = p.y + startY[i] * offWeight;
        const az = p.z + startZ[i] * offWeight;

        const x1 = ax * cosY + az * sinY;
        const z1 = -ax * sinY + az * cosY;
        const y1 = ay * cosP - z1 * sinP;
        const z2 = ay * sinP + z1 * cosP;

        const relZ = z2 + cameraZ;
        if (relZ <= 0.02) continue;
        const scale = FOCAL / relZ;

        const baseX = cx + x1 * scale * scaleFactor;
        const baseY = cy - y1 * scale * scaleFactor;
        if (baseX < -60 || baseX > width + 60 || baseY < -60 || baseY > height + 60) continue;

        // Cursor repulsion: ease each point toward a pushed-aside target so it
        // glides out of the way and springs back when the cursor leaves.
        let targetX = 0;
        let targetY = 0;
        const dx = baseX - pointer.px;
        const dy = baseY - pointer.py;
        const dist = Math.hypot(dx, dy);
        if (dist < REPEL_RADIUS) {
          const f = 1 - dist / REPEL_RADIUS;
          const inv = (REPEL_PUSH * f * f) / (dist || 1);
          targetX = dx * inv;
          targetY = dy * inv;
        }
        offX[i] += (targetX - offX[i]) * 0.16;
        offY[i] += (targetY - offY[i]) * 0.16;
        const screenX = baseX + offX[i];
        const screenY = baseY + offY[i];

        // Two crossing waves of brightness sweeping the (rotated) sphere face.
        const w1 = Math.sin(x1 * 1.7 + y1 * 1.1 - time * 3.1);
        const w2 = Math.sin(x1 * -1.2 + y1 * 1.8 - time * 3.7 + 2.1);
        const wave = Math.max(w1, w2);
        const glow = wave > 0.55 ? smoothstep(0.55, 1, wave) : 0;

        const depthOpacity = Math.max(0.12, Math.min(scale * 0.5, 0.92));
        const size = Math.max(0.5, Math.min(scale * 0.6, 1)) * (1 + glow * 0.5);

        const r = lerp(sr, cr, glow * 0.85);
        const g = lerp(sg, cg, glow * 0.85);
        const b = lerp(sb, cb, glow * 0.85);
        const opacity = Math.max(depthOpacity, glow * 0.7) * Math.min(localT * 1.3, 1);

        // Radial dimming behind the centred copy: full dim near the centre,
        // easing back to full intensity at the logo ring and beyond.
        let dimFactor = 1;
        if (textReveal > 0) {
          const ddx = (screenX - cx) / dimRx;
          const ddy = (screenY - cy) / dimRy;
          const radial = smoothstep(DIM_INNER, DIM_OUTER, Math.hypot(ddx, ddy));
          const dim = TEXT_DIM + (1 - TEXT_DIM) * radial;
          dimFactor = 1 - textReveal * (1 - dim);
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${opacity * dimFactor})`;
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Model-family bubbles live on a fixed screen-plane ring (not stuck to
      // the sphere): present from the start as tiny colored dots, turning slowly
      // clockwise, and growing into logo bubbles as the camera zooms in. The
      // ring is centred on the sphere centre and widens with the zoom.
      const grow = smoothstep(0.1, 0.85, progress);
      const ringRx = width * lerp(RING_RX_TOP, RING_RX, grow);
      const ringRy = height * lerp(RING_RY_TOP, RING_RY, grow);
      const bScale = lerp(DOT_SCALE, BUBBLE_SCALE, grow);
      const bubbleOpacity = Math.min(intro * 1.4, 1);
      for (let k = 0; k < BUBBLE_COUNT; k++) {
        const el = bubbleRefs.current[k];
        if (!el) continue;
        const ang = -Math.PI / 2 + (2 * Math.PI * BUBBLE_SEEDS[k].ringIndex) / BUBBLE_COUNT + ringSpin;
        const sx = cx + Math.cos(ang) * ringRx;
        const sy = cy + Math.sin(ang) * ringRy;
        el.style.transform = `translate(${sx}px, ${sy}px) scale(${bScale})`;
        el.style.opacity = String(bubbleOpacity);
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
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
        {BUBBLE_SEEDS.map((seed, k) => (
          <div
            key={k}
            ref={(el) => {
              bubbleRefs.current[k] = el;
            }}
            className="absolute left-0 top-0 will-change-transform"
            style={{ transformOrigin: "0 0", opacity: 0 }}
          >
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 56,
                height: 56,
                marginLeft: -28,
                marginTop: -28,
                background: seed.bg,
                border: `1px solid ${seed.ring}`,
                boxShadow: "0 8px 24px rgba(8, 15, 10, 0.45)",
              }}
            >
              <seed.Logo />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
