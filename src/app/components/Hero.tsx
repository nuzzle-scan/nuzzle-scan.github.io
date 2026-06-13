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
    <div className="wrap pointer-events-auto flex flex-wrap items-center justify-between gap-4 py-6">
      <a href="#" className="plain" aria-label="Nuzzle">
        <span className="font-display text-2xl font-semibold tracking-tight" style={{ color: "var(--fox)" }}>
          Nuzzle
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

/** The only thing visible on arrival: the headline, centered above the sphere. */
function HeroTitle() {
  return (
    <h1 className="mx-auto max-w-3xl px-6 text-center font-display text-[clamp(1.85rem,5.6vw,3.4rem)] font-semibold leading-[1.08]">
      Finding sleeper agents in fine-tuned language models.
    </h1>
  );
}

/** Description + links, revealed at the center once the zoom completes. */
function HeroReveal() {
  return (
    <div className="mx-auto max-w-xl px-2 text-center min-[600px]:px-6">
      <p
        className="mx-auto max-w-[54ch] font-display text-base leading-snug min-[600px]:text-xl min-[600px]:leading-relaxed"
        style={{ color: "var(--cream)" }}
      >
        An open-source scanner for behavioral backdoors in the Hugging Face
        ecosystem.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 font-sans text-[0.8rem] min-[600px]:mt-7 min-[600px]:text-sm">
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
 * §00+01 — combined nav + cinematic point-cloud hero. On arrival only the
 * headline shows, centered above a mouse-reactive sphere of points
 * (`PointCloud`). Scrolling drives a camera dolly into the sphere: the title
 * lifts away, front-facing model-family bubbles flare up, and the scanner
 * description + links resolve at the center. The same scroll-zoom runs on
 * phones (PointCloud falls back to a lighter field and finger-drag repulsion);
 * only prefers-reduced-motion gets a single static frame (`StaticPointSphere`)
 * with the title and description shown together, no sticky/scroll behaviour.
 */
export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Three explicit keyframes (not two): Motion's scroll-linked native animation
  // mirrors a two-point [0, 0.3] -> [a, b] range back up over [0.3, 1] instead
  // of holding the clamped end value, so the title would fade out then back in.
  // A flat third keyframe at 1 keeps it held past the dolly start.
  const titleOpacity = useTransform(scrollYProgress, [0, 0.3, 1], [1, 0, 0]);
  const titleScale = useTransform(scrollYProgress, [0, 0.3, 1], [1, 1.12, 1.12]);
  const titleY = useTransform(scrollYProgress, [0, 0.3, 1], [0, -44, -44]);

  const revealOpacity = useTransform(scrollYProgress, [0, 0.8, 0.9, 1], [0, 0, 1, 1]);
  const revealY = useTransform(scrollYProgress, [0.6, 0.85, 1], [28, 0, 0]);
  const revealScale = useTransform(scrollYProgress, [0.6, 0.85, 1], [0.96, 1, 1]);

  return (
    <section id="hero" className="hero-panel relative">
      {/* Scroll-driven point-cloud zoom — all viewports, motion-safe only.
          On <900px PointCloud uses a lighter field and finger-drag repulsion. */}
      <div ref={containerRef} className="relative motion-reduce:hidden" style={{ height: "300vh" }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <PointCloud scrollProgress={scrollYProgress} />
          {/* Pass pointer events through the empty areas to the canvas below
              (cursor repulsion / tilt); keep the nav itself clickable. */}
          <div className="pointer-events-none relative z-10 flex h-full flex-col">
            <HeroNav />
            <motion.div className="pt-[8vh]" style={{ opacity: titleOpacity, scale: titleScale, y: titleY }}>
              <HeroTitle />
            </motion.div>
          </div>
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            style={{ opacity: revealOpacity, y: revealY, scale: revealScale }}
          >
            <div className="pointer-events-auto max-w-[15rem] min-[600px]:max-w-none">
              <HeroReveal />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Static frame — prefers-reduced-motion only */}
      <div className="relative hidden overflow-hidden motion-reduce:block">
        <StaticPointSphere className="absolute inset-0 h-full w-full" />
        <div className="relative z-10 flex min-h-[92vh] flex-col">
          <HeroNav />
          <div className="flex flex-1 flex-col items-center justify-center gap-10 py-12">
            <HeroTitle />
            <HeroReveal />
          </div>
        </div>
      </div>
    </section>
  );
}
