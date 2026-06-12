import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { PointCloud } from "./illustration/PointCloud";
import { StaticPointSphere } from "./illustration/StaticPointSphere";

const NAV_LINKS = [
  { href: "#validation", label: "Validation" },
  { href: "#wild", label: "Risk scores" },
  { href: "#method", label: "Method" },
  { href: "#paper", label: "Paper ↗" },
  { href: "#github", label: "GitHub ↗" },
];

function HeroNav() {
  return (
    <div className="wrap flex flex-wrap items-center justify-between gap-4 py-6">
      <a href="#" className="plain" aria-label="Nuzzle">
        <span className="font-display text-lg font-semibold">
          Nuzzle{" "}
          <span className="font-sans text-sm font-normal" style={{ color: "var(--sage)" }}>
            scanner
          </span>
        </span>
      </a>
      <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

function HeroCopy() {
  return (
    <div className="mx-auto max-w-2xl px-6 text-center">
      <p
        className="mb-5 flex items-center justify-center gap-2 font-sans text-xs uppercase tracking-[0.25em]"
        style={{ color: "var(--sage)" }}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: "var(--fox)" }} aria-hidden="true" />
        v0.1 · open-source scanner · updated June 2026
      </p>
      <h1 className="font-display text-[clamp(2.6rem,6vw,4.6rem)] font-semibold leading-[1.1]">
        Finding sleeper agents in fine-tuned language models.
      </h1>
      <p className="mx-auto mt-6 max-w-[58ch] font-sans text-lg leading-relaxed" style={{ color: "var(--sage)" }}>
        An open-source scanner for behavioral backdoors in the Hugging Face
        ecosystem. Validated on declared-poisoned models; applied with
        caution to popular models in the wild.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3 font-sans text-sm">
        <a href="#paper">Read the paper</a>
        <span style={{ color: "var(--sage)" }} aria-hidden="true">·</span>
        <a href="#github">View on GitHub</a>
        <span style={{ color: "var(--sage)" }} aria-hidden="true">·</span>
        <a href="#wild">Browse risk scores</a>
        <span style={{ color: "var(--sage)" }} aria-hidden="true">·</span>
        <a href="#scan">Scan your model</a>
      </div>
    </div>
  );
}

/**
 * §00+01 — combined nav + cinematic point-cloud hero. The headline sits
 * centered over a mouse-reactive sphere of points (`PointCloud`); scrolling
 * drives a camera dolly through the sphere, with a handful of points
 * flaring to --fox as they pass close to the camera. <900px viewports and
 * prefers-reduced-motion get a single static frame (`StaticPointSphere`)
 * with no sticky/scroll behaviour.
 */
export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Three explicit keyframes (not two): Motion's scroll-linked native animation
  // mirrors a two-point [0, 0.35] -> [a, b] range back up over [0.35, 1]
  // instead of holding the clamped end value, so the title would fade out
  // then fade back in. A flat third keyframe at 1 keeps it held past 0.35.
  const titleOpacity = useTransform(scrollYProgress, [0, 0.35, 1], [1, 0, 0]);
  const titleScale = useTransform(scrollYProgress, [0, 0.35, 1], [1, 1.08, 1.08]);
  const titleY = useTransform(scrollYProgress, [0, 0.35, 1], [0, -28, -28]);

  return (
    <section id="hero" className="hero-panel relative">
      {/* Scroll-driven point-cloud zoom — desktop, motion-safe only */}
      <div ref={containerRef} className="relative hidden min-[900px]:motion-safe:block" style={{ height: "220vh" }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <PointCloud scrollProgress={scrollYProgress} />
          <div className="relative z-10 flex h-full flex-col">
            <HeroNav />
            <div className="flex flex-1 items-center justify-center">
              <motion.div style={{ opacity: titleOpacity, scale: titleScale, y: titleY }}>
                <HeroCopy />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Static frame — <900px viewports or prefers-reduced-motion */}
      <div className="relative block min-[900px]:motion-safe:hidden">
        <StaticPointSphere className="absolute inset-0 h-full w-full" />
        <div className="relative z-10 flex min-h-[90vh] flex-col md:min-h-screen">
          <HeroNav />
          <div className="flex flex-1 items-center justify-center py-12">
            <HeroCopy />
          </div>
        </div>
      </div>
    </section>
  );
}
