import { useRef } from "react";
import { useScroll, useTransform } from "motion/react";
import { ForestScene } from "./illustration/ForestScene";

const STATIC_FOREST = {
  bgLeftX: -120,
  bgRightX: 120,
  midLeftX: -680,
  midRightX: 680,
  fgLeftX: -760,
  fgRightX: 760,
  foxX: 0,
};

/**
 * §01 — sticky cinematic forest scene. The headline sits in normal flow
 * above a 300vh scroll container; as the user scrolls, the foreground trees
 * part to physically reveal the fox (occlusion, not opacity), then the fox
 * walks off-frame. `<900px` and `prefers-reduced-motion` viewports get the
 * static "revealed" end-state instead, with no sticky/scroll behaviour.
 */
export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const bgLeftX = useTransform(scrollYProgress, [0, 0.5, 1], [0, -120, -120]);
  const bgRightX = useTransform(scrollYProgress, [0, 0.5, 1], [0, 120, 120]);
  const midLeftX = useTransform(scrollYProgress, [0, 0.5, 1], [0, -680, -680]);
  const midRightX = useTransform(scrollYProgress, [0, 0.5, 1], [0, 680, 680]);
  const fgLeftX = useTransform(scrollYProgress, [0, 0.5, 1], [0, -760, -760]);
  const fgRightX = useTransform(scrollYProgress, [0, 0.5, 1], [0, 760, 760]);
  const foxX = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0, 950]);

  return (
    <section id="hero" className="relative">
      <div className="wrap relative z-10 pt-40 pb-16 md:pt-52">
        <div className="max-w-3xl">
          <p className="mb-5 flex items-center gap-2 font-sans text-xs uppercase tracking-[0.25em] text-muted">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-fox" aria-hidden="true" />
            v0.1 · open-source scanner · updated June 2026
          </p>
          <h1 className="font-display text-[clamp(2.6rem,6vw,4.6rem)] font-semibold leading-[1.1] text-green-deep">
            Finding sleeper agents in fine-tuned language models.
          </h1>
          <p className="mt-6 max-w-[58ch] font-sans text-lg leading-relaxed text-muted">
            An open-source scanner for behavioral backdoors in the Hugging Face
            ecosystem. Validated on declared-poisoned models; applied with
            caution to popular models in the wild.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 font-sans text-sm">
            <a href="#paper">Read the paper</a>
            <span className="text-muted" aria-hidden="true">·</span>
            <a href="#github">View on GitHub</a>
            <span className="text-muted" aria-hidden="true">·</span>
            <a href="#wild">Browse risk scores</a>
            <span className="text-muted" aria-hidden="true">·</span>
            <a href="#scan">Scan your model</a>
          </div>
        </div>
      </div>

      {/* Scroll-driven forest narrative — desktop, motion-safe only */}
      <div
        ref={containerRef}
        className="relative hidden min-[900px]:motion-safe:block"
        style={{ height: "300vh" }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <ForestScene
            bgLeftX={bgLeftX}
            bgRightX={bgRightX}
            midLeftX={midLeftX}
            midRightX={midRightX}
            fgLeftX={fgLeftX}
            fgRightX={fgRightX}
            foxX={foxX}
            foxWalking
          />
        </div>
      </div>

      {/* Static end-state — <900px viewports or prefers-reduced-motion */}
      <div className="block h-[70vh] w-full overflow-hidden min-[900px]:motion-safe:hidden md:h-screen">
        <ForestScene {...STATIC_FOREST} />
      </div>
    </section>
  );
}
