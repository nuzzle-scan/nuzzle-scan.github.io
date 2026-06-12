interface FoxGroupProps {
  walking?: boolean;
}

/**
 * Fox markings as a bare <g>, viewBox-space 0 0 380 260. Shared between the
 * standalone FoxSVG and ForestScene (nested inside the hero <svg>).
 * `walking` adds a subtle idle leg/tail animation (CSS, respects
 * prefers-reduced-motion via theme.css).
 */
export function FoxGroup({ walking = false }: FoxGroupProps) {
  return (
    <g>
      <g className={walking ? "fox-tail fox-walking" : "fox-tail"}>
        <path
          d="M108,175 C40,182 0,140 4,92 C8,52 50,32 82,50 C64,72 60,110 70,138 C78,160 110,168 108,175 Z"
          fill="var(--fox)"
        />
        <path
          d="M4,92 C8,52 50,32 82,50 C68,64 56,82 50,104 C30,98 8,108 4,92 Z"
          fill="var(--cream)"
        />
      </g>

      <g className={walking ? "fox-leg-back fox-walking" : "fox-leg-back"}>
        <rect x="140" y="186" width="24" height="62" rx="10" fill="var(--fox-deep)" />
        <rect x="140" y="226" width="24" height="22" rx="9" fill="#1A1A1A" />
        <rect x="182" y="190" width="24" height="60" rx="10" fill="var(--fox)" />
        <rect x="182" y="228" width="24" height="22" rx="9" fill="#1A1A1A" />
      </g>

      <ellipse cx="178" cy="168" rx="98" ry="58" fill="var(--fox)" />
      <ellipse cx="262" cy="148" rx="56" ry="52" fill="var(--fox)" />

      <g className={walking ? "fox-leg-front fox-walking" : "fox-leg-front"}>
        <rect x="248" y="188" width="24" height="62" rx="10" fill="var(--fox-deep)" />
        <rect x="248" y="228" width="24" height="22" rx="9" fill="#1A1A1A" />
        <rect x="288" y="184" width="24" height="64" rx="10" fill="var(--fox)" />
        <rect x="288" y="226" width="24" height="22" rx="9" fill="#1A1A1A" />
      </g>

      <path
        d="M104,180 C104,210 140,222 188,220 C232,218 256,206 256,184 C256,168 230,158 188,160 C140,162 104,160 104,180 Z"
        fill="var(--cream)"
      />

      <path
        d="M250,108 C238,76 230,42 250,22 C272,38 280,76 274,108 Z"
        fill="var(--fox-deep)"
      />
      <path
        d="M276,104 C272,70 282,38 304,28 C318,52 310,84 292,106 Z"
        fill="var(--fox)"
      />
      <path
        d="M256,98 C248,74 244,48 256,34 C268,48 272,76 268,98 Z"
        fill="var(--green-deep)"
        opacity="0.35"
      />
      <path
        d="M281,96 C280,70 288,46 301,38 C309,56 304,80 290,98 Z"
        fill="var(--green-deep)"
        opacity="0.35"
      />

      <ellipse cx="280" cy="108" rx="42" ry="40" fill="var(--fox)" />

      <path
        d="M310,98 C346,96 380,110 376,128 C372,144 342,150 314,140 C300,132 297,110 310,98 Z"
        fill="var(--fox)"
      />
      <path
        d="M312,116 C338,112 364,120 364,132 C363,144 338,149 320,142 C309,136 306,125 312,116 Z"
        fill="var(--cream)"
      />

      <ellipse cx="370" cy="122" rx="7.5" ry="6" fill="#1A1A1A" />

      <ellipse cx="288" cy="96" rx="7" ry="8.5" fill="#1A1A1A" />
      <circle cx="290.5" cy="92.5" r="2.4" fill="#FFFFFF" />

      <ellipse cx="300" cy="110" rx="11" ry="6" fill="var(--amber)" opacity="0.4" />
    </g>
  );
}

interface FoxSVGProps {
  className?: string;
  walking?: boolean;
}

/** Standalone fox illustration, full body (footer corner vignette). */
export function FoxSVG({ className, walking = false }: FoxSVGProps) {
  return (
    <svg
      viewBox="0 0 380 260"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <FoxGroup walking={walking} />
    </svg>
  );
}

/** Cropped fox-face glyph — wordmark icon, §02 rank marker. */
export function FoxHeadSVG({ className }: { className?: string }) {
  return (
    <svg
      viewBox="220 10 170 170"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <FoxGroup />
    </svg>
  );
}
