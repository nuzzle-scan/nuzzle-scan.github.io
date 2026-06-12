import { motion, type MotionValue } from "motion/react";
import { FoxGroup } from "./FoxSVG";

type XValue = MotionValue<number> | number;

export interface TreeProps {
  x: number;
  y: number;
  scale?: number;
  color: string;
  variant?: "pine" | "round" | "tall";
  opacity?: number;
}

export function Tree({ x, y, scale = 1, color, variant = "pine", opacity = 1 }: TreeProps) {
  if (variant === "round") {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
        <ellipse cx="0" cy="-40" rx="40" ry="52" fill={color} />
        <ellipse cx="-12" cy="-60" rx="24" ry="32" fill={color} style={{ filter: "brightness(1.15)" }} />
        <rect x="-7" y="10" width="14" height="28" rx="2" fill="var(--brown)" />
      </g>
    );
  }
  if (variant === "tall") {
    return (
      <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
        <polygon points="0,-110 -28,0 28,0" fill={color} />
        <polygon points="0,-80 -22,10 22,10" fill={color} style={{ filter: "brightness(1.08)" }} />
        <polygon points="0,-50 -18,18 18,18" fill={color} style={{ filter: "brightness(1.18)" }} />
        <rect x="-7" y="16" width="14" height="28" rx="2" fill="var(--brown)" />
      </g>
    );
  }
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`} opacity={opacity}>
      <polygon points="0,-80 -38,0 38,0" fill={color} />
      <polygon points="0,-55 -28,10 28,10" fill={color} style={{ filter: "brightness(1.1)" }} />
      <polygon points="0,-30 -20,20 20,20" fill={color} style={{ filter: "brightness(1.25)" }} />
      <rect x="-8" y="18" width="16" height="22" rx="2" fill="var(--brown)" />
    </g>
  );
}

function GrassTuft({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`} opacity={0.7}>
      <polygon points="0,-18 -5,0 5,0" fill="var(--green-mid)" />
      <polygon points="-7,-14 -12,0 -2,0" fill="var(--green-deep)" />
      <polygon points="7,-14 2,0 12,0" fill="var(--green-mid)" />
    </g>
  );
}

interface ForestSceneProps {
  bgLeftX: XValue;
  bgRightX: XValue;
  midLeftX: XValue;
  midRightX: XValue;
  fgLeftX: XValue;
  fgRightX: XValue;
  foxX: XValue;
  foxWalking?: boolean;
}

/**
 * Hero forest scene, viewBox 1440x900. Six tree groups (background /
 * midground / foreground, each split left+right) plus the fox sit between
 * midground and foreground so that parting the foreground trees physically
 * uncovers the fox (occlusion, not opacity).
 */
export function ForestScene({
  bgLeftX,
  bgRightX,
  midLeftX,
  midRightX,
  fgLeftX,
  fgRightX,
  foxX,
  foxWalking = false,
}: ForestSceneProps) {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="h-full w-full"
      style={{ display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--bg-deep)" />
          <stop offset="60%" stopColor="var(--bg)" />
          <stop offset="100%" stopColor="var(--green-deep)" />
        </linearGradient>
        <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--green-deep)" />
          <stop offset="100%" stopColor="var(--bg-deep)" />
        </linearGradient>
        <radialGradient id="vignette" cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor="var(--bg)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--bg-deep)" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      <rect width="1440" height="900" fill="url(#sky)" />
      <rect x="0" y="720" width="1440" height="180" fill="url(#ground)" />
      <rect x="0" y="715" width="1440" height="10" fill="var(--green-mid)" opacity="0.4" />

      {/* far background: static tree line, holds the centre stage behind the fox */}
      <g>
        <Tree x={600} y={690} scale={0.42} color="var(--sage)" variant="round" opacity={0.4} />
        <Tree x={670} y={700} scale={0.48} color="var(--sage)" variant="pine" opacity={0.35} />
        <Tree x={750} y={688} scale={0.45} color="var(--sage)" variant="tall" opacity={0.4} />
        <Tree x={830} y={698} scale={0.5} color="var(--sage)" variant="round" opacity={0.4} />
      </g>

      {/* background: distant tree line, sage, low opacity */}
      <motion.g style={{ x: bgLeftX }}>
        <Tree x={80} y={682} scale={0.55} color="var(--sage)" variant="pine" opacity={0.45} />
        <Tree x={200} y={672} scale={0.6} color="var(--sage)" variant="tall" opacity={0.4} />
        <Tree x={320} y={690} scale={0.5} color="var(--sage)" variant="round" opacity={0.45} />
        <Tree x={460} y={666} scale={0.65} color="var(--sage)" variant="pine" opacity={0.4} />
        <Tree x={580} y={682} scale={0.5} color="var(--sage)" variant="tall" opacity={0.45} />
        <Tree x={650} y={695} scale={0.45} color="var(--sage)" variant="round" opacity={0.4} />
      </motion.g>
      <motion.g style={{ x: bgRightX }}>
        <Tree x={800} y={676} scale={0.55} color="var(--sage)" variant="pine" opacity={0.45} />
        <Tree x={920} y={686} scale={0.6} color="var(--sage)" variant="tall" opacity={0.4} />
        <Tree x={1060} y={672} scale={0.5} color="var(--sage)" variant="round" opacity={0.45} />
        <Tree x={1200} y={690} scale={0.65} color="var(--sage)" variant="pine" opacity={0.4} />
        <Tree x={1320} y={676} scale={0.5} color="var(--sage)" variant="tall" opacity={0.45} />
        <Tree x={1400} y={686} scale={0.48} color="var(--sage)" variant="round" opacity={0.45} />
      </motion.g>

      {/* midground: green-mid/green-deep with autumn accents */}
      <motion.g style={{ x: midLeftX }}>
        <Tree x={-30} y={742} scale={1.1} color="var(--green-mid)" variant="pine" />
        <Tree x={90} y={732} scale={1.3} color="var(--green-deep)" variant="tall" />
        <Tree x={220} y={748} scale={1.0} color="var(--green-mid)" variant="round" />
        <Tree x={330} y={736} scale={1.25} color="var(--green-deep)" variant="pine" />
        <Tree x={440} y={752} scale={0.9} color="var(--green-mid)" variant="tall" />
        <Tree x={540} y={740} scale={1.15} color="var(--green-deep)" variant="round" />
        <Tree x={640} y={750} scale={1.0} color="var(--green-mid)" variant="pine" />
        <Tree x={160} y={738} scale={0.85} color="var(--amber)" variant="round" opacity={0.85} />
        <Tree x={500} y={742} scale={0.75} color="var(--gold)" variant="round" opacity={0.85} />
        {[40, 140, 260, 380, 480, 590].map((gx) => (
          <GrassTuft key={gx} x={gx} y={722} />
        ))}
      </motion.g>
      <motion.g style={{ x: midRightX }}>
        <Tree x={800} y={742} scale={1.1} color="var(--green-deep)" variant="pine" />
        <Tree x={900} y={732} scale={1.3} color="var(--green-mid)" variant="tall" />
        <Tree x={1010} y={748} scale={1.0} color="var(--green-deep)" variant="round" />
        <Tree x={1120} y={736} scale={1.25} color="var(--green-mid)" variant="pine" />
        <Tree x={1230} y={752} scale={0.9} color="var(--green-deep)" variant="tall" />
        <Tree x={1330} y={740} scale={1.15} color="var(--green-mid)" variant="round" />
        <Tree x={1450} y={750} scale={1.0} color="var(--green-deep)" variant="pine" />
        <Tree x={860} y={738} scale={0.85} color="var(--rust)" variant="round" opacity={0.85} />
        <Tree x={1170} y={742} scale={0.75} color="var(--gold)" variant="round" opacity={0.85} />
        {[820, 960, 1060, 1180, 1280, 1380].map((gx) => (
          <GrassTuft key={gx} x={gx} y={722} />
        ))}
      </motion.g>

      {/* fox: sits behind the foreground trees, always fully opaque */}
      <motion.g style={{ x: foxX }}>
        <svg x="545" y="480" width="350" height="240" viewBox="0 0 380 260">
          <FoxGroup walking={foxWalking} />
        </svg>
      </motion.g>

      {/* foreground: largest, darkest trees — parting these uncovers the fox */}
      <motion.g style={{ x: fgLeftX }}>
        <Tree x={-60} y={762} scale={1.6} color="var(--green-deep)" variant="pine" />
        <Tree x={110} y={757} scale={1.8} color="var(--bg-deep)" variant="tall" />
        <Tree x={280} y={766} scale={1.5} color="var(--green-deep)" variant="pine" />
        <Tree x={430} y={760} scale={1.7} color="var(--bg-deep)" variant="round" />
        <Tree x={580} y={763} scale={1.55} color="var(--green-deep)" variant="tall" />
        <Tree x={700} y={760} scale={1.65} color="var(--bg-deep)" variant="pine" />
        {/* closing cluster: brackets the fox so the closed forest fully hides it */}
        <Tree x={600} y={764} scale={2.5} color="var(--bg-deep)" variant="tall" />
        <Tree x={665} y={760} scale={2.6} color="var(--green-deep)" variant="pine" />
        <Tree x={595} y={760} scale={3.0} color="var(--bg-deep)" variant="round" />
      </motion.g>
      <motion.g style={{ x: fgRightX }}>
        <Tree x={740} y={760} scale={1.6} color="var(--bg-deep)" variant="pine" />
        <Tree x={900} y={757} scale={1.8} color="var(--green-deep)" variant="tall" />
        {/* closing cluster: brackets the fox so the closed forest fully hides it */}
        <Tree x={730} y={762} scale={2.7} color="var(--bg-deep)" variant="pine" />
        <Tree x={800} y={764} scale={2.5} color="var(--green-deep)" variant="tall" />
        <Tree x={865} y={760} scale={2.2} color="var(--bg-deep)" variant="round" />
        <Tree x={801} y={760} scale={3.0} color="var(--green-deep)" variant="round" />
        <Tree x={1060} y={766} scale={1.5} color="var(--bg-deep)" variant="round" />
        <Tree x={1220} y={760} scale={1.7} color="var(--green-deep)" variant="pine" />
        <Tree x={1370} y={763} scale={1.55} color="var(--bg-deep)" variant="tall" />
        <Tree x={1490} y={760} scale={1.65} color="var(--green-deep)" variant="pine" />
      </motion.g>

      <rect width="1440" height="900" fill="url(#vignette)" />
    </svg>
  );
}
