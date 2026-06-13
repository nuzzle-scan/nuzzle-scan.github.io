import { useEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import { jitteredSphere, mulberry32, lerp, smoothstep, hexToRgb } from "./pointCloudMath";
import { BUBBLE_SEEDS, BUBBLE_COUNT } from "./modelLogos";

// Full field on desktop; a lighter field on phones. The GPU renders all of them
// in one draw call, so this is cheap — the count mostly affects fill density.
const POINT_COUNT_DESKTOP = 10000;
const POINT_COUNT_MOBILE = 4000;
const CAMERA_START = 2.6;
const CAMERA_END = 1.12;
const FOCAL = 1.4;

// One-time intro: points stream in from a scattered cloud and form the sphere.
const INTRO_MS = 1800;
const INTRO_SPREAD = 4.4; // max start distance off the shell, in sphere radii
const INTRO_STAGGER = 0.4; // fraction of the intro spent staggering start times

// Local cursor / finger repulsion (screen space, pixels). Evaluated per point in
// the vertex shader against an eased pointer position — instant, no per-point
// spring state, so a fast sweep can't lag or skip.
const REPEL_RADIUS = 170;
const REPEL_PUSH = 58;

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

// Vertex shader: all per-point work runs here on the GPU. Position (intro lerp →
// rotation → perspective → screen-space repulsion) plus color/size/alpha (waves,
// per-point twinkle, depth, text-dim) are computed and passed to the fragment
// shader. Points are drawn as gl.POINTS, so gl_PointSize gives the same little
// squares the 2D fillRect path produced.
const VERT_SRC = `
precision highp float;
attribute vec3 aShell;   // resting position on the unit sphere
attribute vec3 aStart;   // scattered intro start offset
attribute vec2 aMeta;    // x: intro delay, y: twinkle phase
uniform float uIntro, uIntroStagger, uTime, uPixelRatio;
uniform float uYaw, uPitch, uCameraZ, uFocal, uScaleFactor;
uniform vec2 uViewport, uCenter, uMouse, uRepel, uDimR;
uniform float uTextReveal, uTextDim, uDimInner, uDimOuter;
uniform vec3 uSage, uHi, uFox, uCream;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float localT = clamp((uIntro - aMeta.x) / (1.0 - uIntroStagger), 0.0, 1.0);
  float e = 1.0 - localT;
  vec3 p = aShell + aStart * (e * e * e); // 1 - easeOutCubic(localT)

  float cy = cos(uYaw), sy = sin(uYaw);
  float x1 = p.x * cy + p.z * sy;
  float z1 = -p.x * sy + p.z * cy;
  float cp = cos(uPitch), sp = sin(uPitch);
  float y1 = p.y * cp - z1 * sp;
  float z2 = p.y * sp + z1 * cp;

  float relZ = z2 + uCameraZ;
  if (relZ <= 0.02) { vColor = vec3(0.0); vAlpha = 0.0; gl_PointSize = 0.0; gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  float scale = uFocal / relZ;

  float baseX = uCenter.x + x1 * scale * uScaleFactor;
  float baseY = uCenter.y - y1 * scale * uScaleFactor;

  float screenX = baseX, screenY = baseY;
  if (uMouse.x > -9000.0) {
    float dx = baseX - uMouse.x, dy = baseY - uMouse.y;
    float dist = sqrt(dx * dx + dy * dy);
    if (dist < uRepel.x) {
      float f = 1.0 - dist / uRepel.x;
      float inv = (uRepel.y * f * f) / max(dist, 1.0);
      screenX += dx * inv; screenY += dy * inv;
    }
  }
  gl_Position = vec4((screenX / uViewport.x) * 2.0 - 1.0, 1.0 - (screenY / uViewport.y) * 2.0, 0.0, 1.0);

  float w1 = sin(x1 * 2.6 + y1 * 1.7 - uTime * 5.0);
  float w2 = sin(x1 * -2.1 + y1 * 2.6 - uTime * 5.7 + 2.1);
  float wave = max(w1, w2);
  float glow = wave > 0.4 ? smoothstep(0.4, 1.0, wave) : 0.0;
  float flicker = 0.5 + 0.5 * sin(uTime * 6.5 + aMeta.y);

  float depthOpacity = min(0.44 + scale * 0.5, 1.0);
  float size = clamp(scale * 0.66, 0.6, 1.1) * (1.0 + glow * 0.55);

  float warm = glow * 0.85;
  float peak = smoothstep(0.45, 1.0, glow) * 0.3;
  float spark = max(0.0, flicker - 0.72) * 0.6;
  vColor = mix(mix(mix(uSage, uHi, warm), uFox, peak), uCream, spark);

  float baseLum = depthOpacity * (0.8 + 0.42 * flicker);
  float alpha = min(max(baseLum, glow * 0.9), 1.0) * min(localT * 1.3, 1.0);
  if (uTextReveal > 0.0) {
    float ddx = (screenX - uCenter.x) / uDimR.x;
    float ddy = (screenY - uCenter.y) / uDimR.y;
    float radial = smoothstep(uDimInner, uDimOuter, sqrt(ddx * ddx + ddy * ddy));
    float dim = uTextDim + (1.0 - uTextDim) * radial;
    alpha *= 1.0 - uTextReveal * (1.0 - dim);
  }
  vAlpha = alpha;
  gl_PointSize = size * 2.0 * uPixelRatio;
}
`;

const FRAG_SRC = `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main() {
  if (vAlpha <= 0.0) discard;
  gl_FragColor = vec4(vColor, vAlpha);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("PointCloud shader error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function buildProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vert = compileShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vert || !frag) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("PointCloud link error:", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}

interface PointCloudProps {
  /** 0 at the top of the hero, 1 once the scroll-driven zoom is complete. */
  scrollProgress: MotionValue<number>;
}

/**
 * Mouse-reactive, scroll-zooming sphere of disordered points, rendered on the
 * GPU (WebGL). On mount the points stream in from outside and condense into the
 * shell; warm crests sweep across and the whole field shimmers. Points near the
 * cursor are pushed aside. As the scroll dolly pulls the camera in, model-family
 * bubbles (`BUBBLE_SEEDS`, DOM) emerge from the shell and settle into an even
 * circle of brand-colored logos around the centered description. All per-point
 * work is in the vertex shader, so each frame the main thread only updates
 * uniforms and issues one draw call — input stays responsive, no hitching.
 */
export function PointCloud({ scrollProgress }: PointCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const glCtx = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!glCtx) {
      console.warn("WebGL unavailable — hero sphere disabled.");
      return;
    }
    const gl = glCtx; // non-null alias so narrowing holds inside the draw closure

    const isMobile = window.matchMedia("(max-width: 899px)").matches;
    const POINT_COUNT = isMobile ? POINT_COUNT_MOBILE : POINT_COUNT_DESKTOP;

    const rand = mulberry32(0x4e757a);
    const points = jitteredSphere(POINT_COUNT, rand);

    // Per-point attributes, uploaded to the GPU once: resting shell position,
    // scattered intro start offset, and [intro delay, twinkle phase].
    const shellArr = new Float32Array(POINT_COUNT * 3);
    const startArr = new Float32Array(POINT_COUNT * 3);
    const metaArr = new Float32Array(POINT_COUNT * 2);
    for (let i = 0; i < POINT_COUNT; i++) {
      shellArr[i * 3] = points[i].x;
      shellArr[i * 3 + 1] = points[i].y;
      shellArr[i * 3 + 2] = points[i].z;
      const u = rand() * 2 - 1;
      const phi = rand() * Math.PI * 2;
      const r = Math.sqrt(Math.max(0, 1 - u * u));
      const dist = 0.8 + rand() * INTRO_SPREAD;
      startArr[i * 3] = Math.cos(phi) * r * dist;
      startArr[i * 3 + 1] = u * dist;
      startArr[i * 3 + 2] = Math.sin(phi) * r * dist;
      metaArr[i * 2] = rand() * INTRO_STAGGER;
      metaArr[i * 2 + 1] = rand() * Math.PI * 2;
    }

    const rootStyle = getComputedStyle(document.documentElement);
    const norm = (hex: string, fb: string): [number, number, number] => {
      const [r, g, b] = hexToRgb(rootStyle.getPropertyValue(hex) || fb);
      return [r / 255, g / 255, b / 255];
    };
    const sage = norm("--sage", "#7FA068");
    const cream = norm("--cream", "#FFFBF2");
    const gold = norm("--gold", "#E8C87A");
    const fox = norm("--fox", "#D96A2C");
    // Wave highlight: cream leaned halfway to gold — a warm amber glow.
    const hi: [number, number, number] = [
      lerp(cream[0], gold[0], 0.5),
      lerp(cream[1], gold[1], 0.5),
      lerp(cream[2], gold[2], 0.5),
    ];

    const program = buildProgram(gl);
    if (!program) return;
    gl.useProgram(program);

    const makeBuffer = (data: Float32Array) => {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return buf;
    };
    const shellBuf = makeBuffer(shellArr);
    const startBuf = makeBuffer(startArr);
    const metaBuf = makeBuffer(metaArr);
    const bindAttrib = (buf: WebGLBuffer | null, name: string, size: number) => {
      const loc = gl.getAttribLocation(program, name);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    };
    bindAttrib(shellBuf, "aShell", 3);
    bindAttrib(startBuf, "aStart", 3);
    bindAttrib(metaBuf, "aMeta", 2);

    const U = (name: string) => gl.getUniformLocation(program, name);
    const u = {
      intro: U("uIntro"), time: U("uTime"), pixelRatio: U("uPixelRatio"),
      yaw: U("uYaw"), pitch: U("uPitch"), cameraZ: U("uCameraZ"), scaleFactor: U("uScaleFactor"),
      viewport: U("uViewport"), center: U("uCenter"), mouse: U("uMouse"), dimR: U("uDimR"),
      textReveal: U("uTextReveal"),
    };
    // Constant uniforms — set once.
    gl.uniform1f(U("uIntroStagger"), INTRO_STAGGER);
    gl.uniform1f(U("uFocal"), FOCAL);
    gl.uniform2f(U("uRepel"), REPEL_RADIUS, REPEL_PUSH);
    gl.uniform1f(U("uTextDim"), TEXT_DIM);
    gl.uniform1f(U("uDimInner"), DIM_INNER);
    gl.uniform1f(U("uDimOuter"), DIM_OUTER);
    gl.uniform3fv(U("uSage"), sage);
    gl.uniform3fv(U("uHi"), hi);
    gl.uniform3fv(U("uFox"), fox);
    gl.uniform3fv(U("uCream"), cream);

    gl.enable(gl.BLEND);
    // Straight-alpha "over" into a transparent canvas (the CSS bg shows through).
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let width = 0;
    let height = 0;
    let dpr = 1;
    // Cache the container's viewport rect so pointer handling never calls
    // getBoundingClientRect() per move (which would force layout). Refresh on
    // resize and scroll.
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
      // Cap DPR below the native 2–3 of Retina/phone screens: the canvas backing
      // store grows with its square, and the browser composites the whole buffer
      // each frame. For a sparse field of tiny points the resolution loss is
      // imperceptible, but it markedly cuts per-frame GPU/compositor cost.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    window.addEventListener("scroll", readRect, { passive: true });

    // Pointer in container pixels; nx/ny normalized for the parallax tilt.
    const pointer = { px: -9999, py: -9999, nx: 0, ny: 0 };
    const setPointer = (clientX: number, clientY: number) => {
      pointer.px = clientX - rectLeft;
      pointer.py = clientY - rectTop;
      pointer.nx = width > 0 ? (pointer.px / width) * 2 - 1 : 0;
      pointer.ny = height > 0 ? (pointer.py / height) * 2 - 1 : 0;
    };
    // Plain passive pointer read — same lightweight path as touch (onTouchMove),
    // which is hitch-free. A non-passive capture-phase block to keep these events
    // away from React's delegation was a net loss now that WebGL frees the main
    // thread: it defeats the browser's pointermove coalescing and forces
    // synchronous per-event work. The browser rAF-aligns pointermove, and with
    // no matching React handler on the path the delegation cost is negligible.
    const onPointerMove = (event: PointerEvent) => setPointer(event.clientX, event.clientY);
    const parkPointer = () => {
      pointer.px = -9999;
      pointer.py = -9999;
      pointer.nx = 0;
      pointer.ny = 0;
    };
    const onTouchMove = (event: TouchEvent) => {
      const t = event.touches[0];
      if (t) setPointer(t.clientX, t.clientY);
    };
    container.addEventListener("pointermove", onPointerMove, { passive: true });
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
    let bubblesShown = false;
    // Eased pointer for the repulsion field — a touch of softness so the parting
    // glides with the cursor rather than snapping.
    let mouseX = -9999;
    let mouseY = -9999;

    let running = false;
    let frame = 0;
    function draw(now: number) {
      if (!running) return;
      frame = requestAnimationFrame(draw);
      if (width === 0 || height === 0) return;
      if (startTime === 0) startTime = now;
      const intro = Math.min((now - startTime) / INTRO_MS, 1);
      const progress = scrollProgress.get();

      const spinFactor = 1 - smoothstep(0.05, 0.7, progress);
      yaw += (pointer.nx * 0.38 - yaw) * 0.13;
      pitch += (-pointer.ny * 0.22 - pitch) * 0.13;
      autoRotate += AUTO_ROTATE * spinFactor;
      ringSpin += RING_SPIN;
      time += 0.016;

      if (pointer.px > -9000) {
        if (mouseX < -9000) { mouseX = pointer.px; mouseY = pointer.py; }
        else { mouseX += (pointer.px - mouseX) * 0.4; mouseY += (pointer.py - mouseY) * 0.4; }
      } else { mouseX = -9999; mouseY = -9999; }

      const cameraZ = lerp(CAMERA_START, CAMERA_END, progress);
      const scaleFactor = Math.min(width, height) * 0.4;
      const cx = width / 2;
      const cy = height * lerp(SPHERE_CY_TOP, SPHERE_CY_ZOOM, smoothstep(0, 0.55, progress));
      const textReveal = smoothstep(0.8, 0.92, progress);

      gl.uniform1f(u.intro, intro);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.pixelRatio, dpr);
      gl.uniform1f(u.yaw, yaw + autoRotate);
      gl.uniform1f(u.pitch, pitch);
      gl.uniform1f(u.cameraZ, cameraZ);
      gl.uniform1f(u.scaleFactor, scaleFactor);
      gl.uniform2f(u.viewport, width, height);
      gl.uniform2f(u.center, cx, cy);
      gl.uniform2f(u.mouse, mouseX, mouseY);
      gl.uniform2f(u.dimR, width * DIM_RX, height * DIM_RY);
      gl.uniform1f(u.textReveal, textReveal);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.POINTS, 0, POINT_COUNT);

      // Model-family bubbles (DOM) on a fixed screen-plane ring: invisible at the
      // top (indistinguishable from the field), then fading in and growing into
      // logos as the camera zooms. Only six elements — trivial on the main thread.
      const ringGrow = smoothstep(0.1, 0.92, progress);
      const reveal = smoothstep(0.14, 0.6, progress);
      const sizeGrow = smoothstep(0.18, 1, progress) ** 1.15;
      const bubbleScaleMax = isMobile ? 0.85 : BUBBLE_SCALE;
      const bScale = lerp(DOT_SCALE, bubbleScaleMax, sizeGrow);
      let ringRx: number;
      let ringRy: number;
      if (isMobile) {
        ringRx = ringRy = lerp(0.18 * width, 0.42 * width, ringGrow);
      } else {
        ringRx = width * lerp(RING_RX_TOP, RING_RX, ringGrow);
        ringRy = height * lerp(RING_RY_TOP, RING_RY, ringGrow);
      }
      const bubbleOpacity = Math.min(intro * 1.4, 1) * reveal;
      // At the top of the page the bubbles are invisible (reveal ≈ 0) — exactly
      // where the mouse interaction happens. Skip all their DOM writes there
      // (hide once), so playing with the cursor touches nothing but uniforms.
      if (bubbleOpacity > 0.001) {
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
        bubblesShown = true;
      } else if (bubblesShown) {
        for (let k = 0; k < BUBBLE_COUNT; k++) {
          const el = bubbleRefs.current[k];
          if (el) el.style.opacity = "0";
        }
        bubblesShown = false;
      }
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
    // Only render while the hero canvas is on screen.
    const visibilityObserver = new IntersectionObserver(
      (entries) => (entries[0].isIntersecting ? startLoop() : stopLoop()),
      { threshold: 0 },
    );
    visibilityObserver.observe(container);

    return () => {
      stopLoop();
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", parkPointer);
      container.removeEventListener("touchstart", onTouchMove);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", parkPointer);
      container.removeEventListener("touchcancel", parkPointer);
      window.removeEventListener("scroll", readRect);
      gl.deleteBuffer(shellBuf);
      gl.deleteBuffer(startBuf);
      gl.deleteBuffer(metaBuf);
      gl.deleteProgram(program);
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
