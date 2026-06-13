import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import { jitteredSphere, mulberry32, lerp, smoothstep, hexToRgb } from "./pointCloudMath";
import { BUBBLE_SEEDS, BUBBLE_COUNT } from "./modelLogos";

// Full field on desktop; a lighter field on phones so the animated sphere stays
// smooth on mobile GPUs. Picked once at mount from the viewport width.
const POINT_COUNT_DESKTOP = 10000;
const POINT_COUNT_MOBILE = 2600;
const CAMERA_START = 2.6;
const CAMERA_END = 1.12;
const FOCAL = 1.4;

// One-time intro: points stream in from a scattered cloud and form the sphere.
const INTRO_MS = 1800;
const INTRO_SPREAD = 4.4; // max start distance off the shell, in sphere radii
const INTRO_STAGGER = 0.4; // fraction of the intro spent staggering start times

// Local cursor / finger repulsion (screen space). Points ease toward their
// pushed-aside target fast (PUSH_K) and spring back slowly (RECOVER_K), so a
// quick sweep still visibly parts the field instead of lagging behind.
const REPEL_RADIUS = 170;
const REPEL_PUSH = 58;
const PUSH_K = 0.6;
const RECOVER_K = 0.1;

// Fine per-point scintillation: every point flickers on a fast cycle with its
// own random phase, so the whole shell shimmers ("fourmillement") between the
// brighter sweeping crests instead of going dark.
const TWINKLE_SPEED = 6.5;

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
const DOT_SCALE = 0.06; // bubble scale where it starts fading in from the field
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

    const isMobile = window.matchMedia("(max-width: 899px)").matches;
    const POINT_COUNT = isMobile ? POINT_COUNT_MOBILE : POINT_COUNT_DESKTOP;

    const rand = mulberry32(0x4e757a);
    const points = jitteredSphere(POINT_COUNT, rand);

    // Intro: per-point scattered start offset (model space) + staggered start.
    const startX = new Float32Array(POINT_COUNT);
    const startY = new Float32Array(POINT_COUNT);
    const startZ = new Float32Array(POINT_COUNT);
    const delay = new Float32Array(POINT_COUNT);
    const twPhase = new Float32Array(POINT_COUNT); // per-point twinkle phase
    for (let i = 0; i < POINT_COUNT; i++) {
      const u = rand() * 2 - 1;
      const phi = rand() * Math.PI * 2;
      const r = Math.sqrt(Math.max(0, 1 - u * u));
      const dist = 0.8 + rand() * INTRO_SPREAD;
      startX[i] = Math.cos(phi) * r * dist;
      startY[i] = u * dist;
      startZ[i] = Math.sin(phi) * r * dist;
      delay[i] = rand() * INTRO_STAGGER;
      twPhase[i] = rand() * Math.PI * 2;
    }

    // Per-point screen-space displacement (cursor repulsion) with spring-back.
    const offX = new Float32Array(POINT_COUNT);
    const offY = new Float32Array(POINT_COUNT);

    const rootStyle = getComputedStyle(document.documentElement);
    const [sr, sg, sb] = hexToRgb(rootStyle.getPropertyValue("--sage") || "#7FA068");
    const [cr, cg, cb] = hexToRgb(rootStyle.getPropertyValue("--cream") || "#FFFBF2");
    const [gr, gg, gb] = hexToRgb(rootStyle.getPropertyValue("--gold") || "#E8C87A");
    const [fr, fg, fb] = hexToRgb(rootStyle.getPropertyValue("--fox") || "#D96A2C");
    // Wave highlight: cream leaned halfway to gold — a warm amber glow rather
    // than a neutral white one. The very brightest tips lean a touch toward fox.
    const hr = lerp(cr, gr, 0.5);
    const hg = lerp(cg, gg, 0.5);
    const hb = lerp(cb, gb, 0.5);

    // Color cache: per point the fill color is a continuous lerp, but building a
    // fresh `rgba(...)` string for each of ~10k points every frame allocates
    // hundreds of thousands of short-lived strings per second — the GC churn
    // that makes interaction hitch every few seconds. Quantize the color to
    // 5 bits/channel and reuse the string; opacity rides on ctx.globalAlpha
    // (a number), so steady-state allocation is essentially zero.
    const colorCache: string[] = new Array(32768);

    let width = 0;
    let height = 0;
    // Cache the container's viewport rect so pointer handling doesn't call
    // getBoundingClientRect() on every move — that forces a synchronous layout,
    // and reading it right after writing the bubble styles each frame thrashes
    // layout during vigorous mouse movement. Refresh it on resize and scroll.
    let rectLeft = 0;
    let rectTop = 0;

    const readRect = () => {
      const rect = container.getBoundingClientRect();
      rectLeft = rect.left;
      rectTop = rect.top;
      return rect;
    };
    const resize = () => {
      const rect = readRect();
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
    window.addEventListener("scroll", readRect, { passive: true });

    // Raw pixel pointer (for local repulsion) + normalized (for parallax tilt).
    // `ppx/ppy` track the previous frame's pointer so repulsion can test the
    // swept segment, not just the latest sample. Park it far offscreen until
    // the first move so nothing is pushed at rest.
    const pointer = { px: -9999, py: -9999, ppx: -9999, ppy: -9999, nx: 0, ny: 0 };
    const setPointer = (clientX: number, clientY: number) => {
      pointer.px = clientX - rectLeft;
      pointer.py = clientY - rectTop;
      pointer.nx = width > 0 ? (pointer.px / width) * 2 - 1 : 0;
      pointer.ny = height > 0 ? (pointer.py / height) * 2 - 1 : 0;
    };
    // React 18 delegates events at its root in the *capture* phase, so every
    // mouse/pointer move over the hero makes React allocate a synthetic event
    // (confirmed by allocation profiling) — and under fast movement that garbage
    // triggers a GC hitch. React's capture listener fires before the event
    // reaches this canvas, so the only way to pre-empt it is to intercept in the
    // capture phase at `window` (above React's root): read the position there
    // and stopPropagation so the event never reaches React. Scoped to events
    // whose target is inside the canvas, so the rest of the page is untouched.
    const onPointerMove = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target || !container.contains(target)) return;
      setPointer(event.clientX, event.clientY);
      event.stopPropagation();
    };
    const blockHeroMouseMove = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (target && container.contains(target)) event.stopPropagation();
    };
    const parkPointer = () => {
      pointer.px = -9999;
      pointer.py = -9999;
      pointer.nx = 0;
      pointer.ny = 0;
    };
    // Touch: feed the same pointer from finger position. Passive listeners so
    // the page still scrolls (the scroll drives the zoom) while the finger
    // parts the field as it drags across.
    const onTouchMove = (event: TouchEvent) => {
      const t = event.touches[0];
      if (t) setPointer(t.clientX, t.clientY);
    };
    window.addEventListener("pointermove", onPointerMove, { capture: true });
    window.addEventListener("mousemove", blockHeroMouseMove, { capture: true });
    container.addEventListener("pointerleave", parkPointer);
    container.addEventListener("touchstart", onTouchMove, { passive: true });
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    container.addEventListener("touchend", parkPointer);
    container.addEventListener("touchcancel", parkPointer);

    let yaw = 0;
    let pitch = 0;
    let autoRotate = 0;
    let ringSpin = 0;
    let time = 0;
    let startTime = 0;

    // Only render while the hero canvas is actually on screen. Once the page is
    // scrolled into the document below, the loop stops — no point drawing ~10k
    // arcs/frame off-screen and draining the battery. (Backgrounded tabs are
    // already throttled by the browser's rAF.)
    let running = false;
    let frame = 0;
    function draw(now: number) {
      if (!running) return;
      frame = requestAnimationFrame(draw);
      if (width === 0 || height === 0) return;
      if (startTime === 0) startTime = now;
      const intro = Math.min((now - startTime) / INTRO_MS, 1);

      const progress = scrollProgress.get();

      // The field spin eases to a near-stop as the camera zooms in, so the
      // centered text can be read without the dizzying drift.
      const spinFactor = 1 - smoothstep(0.05, 0.7, progress);
      yaw += (pointer.nx * 0.38 - yaw) * 0.13;
      pitch += (-pointer.ny * 0.22 - pitch) * 0.13;
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

      // The pointer's swept path this frame: from where it was last frame to
      // where it is now. Testing each point against this segment (not just the
      // latest sample) keeps a fast flick from skipping over points between
      // frames. On the first frame after the pointer (re)enters, ppx is the
      // parked sentinel — collapse to a point so we don't push a stray line.
      const hasPointer = pointer.px > -9000;
      const segAx = pointer.ppx > -9000 ? pointer.ppx : pointer.px;
      const segAy = pointer.ppx > -9000 ? pointer.ppy : pointer.py;
      const segVx = pointer.px - segAx;
      const segVy = pointer.py - segAy;
      const segLen2 = segVx * segVx + segVy * segVy;

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

        // Cursor / finger repulsion: push each point away from the nearest
        // point on the pointer's swept path, then ease it toward that target —
        // fast on the way out, slow on the way back.
        let targetX = 0;
        let targetY = 0;
        if (hasPointer) {
          let t = segLen2 > 0 ? ((baseX - segAx) * segVx + (baseY - segAy) * segVy) / segLen2 : 0;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const dx = baseX - (segAx + t * segVx);
          const dy = baseY - (segAy + t * segVy);
          const dist = Math.sqrt(dx * dx + dy * dy); // Math.hypot allocates in V8
          if (dist < REPEL_RADIUS) {
            const f = 1 - dist / REPEL_RADIUS;
            const inv = (REPEL_PUSH * f * f) / (dist || 1);
            targetX = dx * inv;
            targetY = dy * inv;
          }
        }
        const pushing = targetX * targetX + targetY * targetY > offX[i] * offX[i] + offY[i] * offY[i];
        const k = pushing ? PUSH_K : RECOVER_K;
        offX[i] += (targetX - offX[i]) * k;
        offY[i] += (targetY - offY[i]) * k;
        const screenX = baseX + offX[i];
        const screenY = baseY + offY[i];

        // Smaller, faster crests sweeping the (rotated) sphere face.
        const w1 = Math.sin(x1 * 2.6 + y1 * 1.7 - time * 5.0);
        const w2 = Math.sin(x1 * -2.1 + y1 * 2.6 - time * 5.7 + 2.1);
        const wave = Math.max(w1, w2);
        const glow = wave > 0.4 ? smoothstep(0.4, 1, wave) : 0;

        // Fine per-point twinkle so the whole shell shimmers between crests.
        const flicker = 0.5 + 0.5 * Math.sin(time * TWINKLE_SPEED + twPhase[i]);

        // Flatter depth falloff than a literal projection — the back of the
        // shell stays lit, so the sphere reads as a full, bright field.
        const depthOpacity = Math.min(0.34 + scale * 0.5, 1);
        const size = Math.max(0.55, Math.min(scale * 0.62, 1.05)) * (1 + glow * 0.55);

        const warm = glow * 0.85;
        const peak = smoothstep(0.45, 1, glow) * 0.3; // brightest tips lean fox
        const spark = Math.max(0, flicker - 0.72) * 0.6; // twinkle peaks lean cream
        const r = lerp(lerp(lerp(sr, hr, warm), fr, peak), cr, spark);
        const g = lerp(lerp(lerp(sg, hg, warm), fg, peak), cg, spark);
        const b = lerp(lerp(lerp(sb, hb, warm), fb, peak), cb, spark);
        // Shimmering base (twinkle) lifted by the bright crests, gated by intro.
        const baseLum = depthOpacity * (0.7 + 0.45 * flicker);
        const opacity = Math.min(Math.max(baseLum, glow * 0.9), 1) * Math.min(localT * 1.3, 1);

        // Radial dimming behind the centred copy: full dim near the centre,
        // easing back to full intensity at the logo ring and beyond.
        let dimFactor = 1;
        if (textReveal > 0) {
          const ddx = (screenX - cx) / dimRx;
          const ddy = (screenY - cy) / dimRy;
          const radial = smoothstep(DIM_INNER, DIM_OUTER, Math.sqrt(ddx * ddx + ddy * ddy));
          const dim = TEXT_DIM + (1 - TEXT_DIM) * radial;
          dimFactor = 1 - textReveal * (1 - dim);
        }

        let a = opacity * dimFactor;
        a = a < 0 ? 0 : a > 1 ? 1 : a;
        if (a < 0.01) continue;

        // Quantize to 5 bits/channel and reuse the cached color string.
        const qr = (r < 0 ? 0 : r > 255 ? 255 : r) >> 3;
        const qg = (g < 0 ? 0 : g > 255 ? 255 : g) >> 3;
        const qb = (b < 0 ? 0 : b > 255 ? 255 : b) >> 3;
        const key = (qr << 10) | (qg << 5) | qb;
        let col = colorCache[key];
        if (col === undefined) {
          col = `rgb(${qr << 3}, ${qg << 3}, ${qb << 3})`;
          colorCache[key] = col;
        }

        // fillRect, not arc(): at 1–2px a square is indistinguishable from a
        // disc but skips path construction/tessellation entirely — a big draw
        // saving across ~10k points/frame, which keeps the main thread free so
        // pointer input never stalls.
        ctx.globalAlpha = a;
        ctx.fillStyle = col;
        ctx.fillRect(screenX - size, screenY - size, size * 2, size * 2);
      }
      ctx.globalAlpha = 1;

      // Model-family bubbles live on a fixed screen-plane ring (not stuck to
      // the sphere). At the top they are invisible — indistinguishable from the
      // field — then fade in and grow into logo bubbles as the camera zooms.
      // Three separate ramps: the ring widens early (ringGrow), the discs
      // reveal in the first third (reveal), and the size grows gently across the
      // whole zoom so they reach their final scale only at the very end.
      const ringGrow = smoothstep(0.1, 0.92, progress);
      const reveal = smoothstep(0.14, 0.6, progress);
      const sizeGrow = smoothstep(0.18, 1, progress) ** 1.15;
      const bubbleScaleMax = isMobile ? 0.85 : BUBBLE_SCALE;
      const bScale = lerp(DOT_SCALE, bubbleScaleMax, sizeGrow);
      // Desktop's RX·width and RY·height land near-equal, so the ring reads as a
      // circle. On a narrow tall phone they diverge into a vertical oval, so use
      // a single px radius (sized to the width) for a true screen-plane circle.
      let ringRx: number;
      let ringRy: number;
      if (isMobile) {
        ringRx = ringRy = lerp(0.18 * width, 0.42 * width, ringGrow);
      } else {
        ringRx = width * lerp(RING_RX_TOP, RING_RX, ringGrow);
        ringRy = height * lerp(RING_RY_TOP, RING_RY, ringGrow);
      }
      const bubbleOpacity = Math.min(intro * 1.4, 1) * reveal;
      // Discs ease from desaturated/dim to full brand color as they emerge.
      const bubbleFilter = `saturate(${lerp(0.35, 1, reveal).toFixed(3)}) brightness(${lerp(0.72, 1, reveal).toFixed(3)})`;
      for (let k = 0; k < BUBBLE_COUNT; k++) {
        const el = bubbleRefs.current[k];
        if (!el) continue;
        const ang = -Math.PI / 2 + (2 * Math.PI * BUBBLE_SEEDS[k].ringIndex) / BUBBLE_COUNT + ringSpin;
        const sx = cx + Math.cos(ang) * ringRx;
        const sy = cy + Math.sin(ang) * ringRy;
        el.style.transform = `translate(${sx}px, ${sy}px) scale(${bScale})`;
        el.style.opacity = String(bubbleOpacity);
        el.style.filter = bubbleFilter;
      }

      // Remember this frame's pointer so next frame can test the swept segment.
      pointer.ppx = pointer.px;
      pointer.ppy = pointer.py;
    }

    const startLoop = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(draw);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };
    const visibilityObserver = new IntersectionObserver(
      (entries) => (entries[0].isIntersecting ? startLoop() : stopLoop()),
      { threshold: 0 },
    );
    visibilityObserver.observe(container);

    return () => {
      stopLoop();
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove, { capture: true });
      window.removeEventListener("mousemove", blockHeroMouseMove, { capture: true });
      container.removeEventListener("pointerleave", parkPointer);
      container.removeEventListener("touchstart", onTouchMove);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", parkPointer);
      container.removeEventListener("touchcancel", parkPointer);
      window.removeEventListener("scroll", readRect);
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
