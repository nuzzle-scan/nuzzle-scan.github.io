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
 * Risk score (0–100): a low→med→high gradient track with a tick marking
 * this model's score, plus the tabular-nums value. Used in §02 and §03 —
 * never framed as a verdict.
 */
export function RiskBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="relative h-1.5 w-28 shrink-0 rounded-full"
        style={{ background: "linear-gradient(90deg, var(--risk-low), var(--risk-med), var(--risk-high))" }}
      >
        <span
          className="absolute top-0 h-full w-0.5 bg-ink"
          style={{ left: `${value}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="num text-sm text-ink">{value}</span>
    </div>
  );
}

type StatusPillVariant = "poisoned" | "review";

const STATUS_STYLES: Record<StatusPillVariant, { color: string; label: string }> = {
  poisoned: { color: "var(--risk-high)", label: "POISONED" },
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
