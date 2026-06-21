import { useRef, type ReactNode } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

/** Scroll-reveal wrapper; degrades to a plain div under prefers-reduced-motion. */
export function FadeInUp({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div ref={ref}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Risk score (0–100): a track filled proportionally to the score, with the
 * tabular-nums value alongside. The iridescent fill (green→turquoise→blue→violet
 * →red) is sized to the FULL track width and clipped to the fill, so the colour
 * at the fill's end reflects the level — low scores end green, high scores reach
 * red. Used in §02 and §03 — never a verdict.
 */
export function RiskBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-1.5 w-28 shrink-0 overflow-hidden rounded-full"
        style={{ background: "rgba(243, 238, 223, 0.10)" }}
        role="meter"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, #30e07a 0%, #25d6c0 26%, #2e9be8 52%, #7c5cff 76%, #ff4d6d 100%)",
            backgroundSize: "7rem 100%",
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
      <span className="num text-sm text-ink">{value}</span>
    </div>
  );
}

type StatusPillVariant = "poisoned" | "review";

const STATUS_STYLES: Record<StatusPillVariant, { color: string; label: string }> = {
  poisoned: { color: "#ff8a2b", label: "POISONED" },
  review: { color: "var(--muted)", label: "Re-scan in progress" },
};

/** Validation verdict pill (§02 only — never used for §03 wild scores). */
export function StatusPill({ variant }: { variant: StatusPillVariant }) {
  const { color, label } = STATUS_STYLES[variant];
  return (
    <span
      className="inline-flex items-center gap-2 font-sans text-xs font-medium uppercase tracking-[0.15em]"
      style={{ color }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}
