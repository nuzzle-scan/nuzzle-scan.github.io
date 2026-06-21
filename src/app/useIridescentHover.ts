import { useEffect } from "react";

/**
 * Interactive accent. Instead of a fixed orange, every link takes a fresh vivid
 * color from the iridescent spectrum each time the pointer (or keyboard focus)
 * enters it — unknown in advance, then held fixed for that hover; re-entering
 * re-rolls it. CSS reads the color from the `--hover-c` custom property the
 * handler sets on the link (see the `a:hover` rules in theme.css).
 */
export function useIridescentHover() {
  useEffect(() => {
    // Random hue, fixed high saturation / mid lightness — vivid, and legible on
    // both the black hero and the cream body.
    const pickColor = () => `hsl(${Math.floor(Math.random() * 360)} 88% 56%)`;

    const enter = (target: EventTarget | null, related: EventTarget | null) => {
      const link = (target as HTMLElement | null)?.closest?.("a");
      if (!link) return;
      // Only re-roll when entering the link from outside it, so the color holds
      // steady while the pointer moves across the link's own contents.
      const from = (related as HTMLElement | null)?.closest?.("a");
      if (from === link) return;
      link.style.setProperty("--hover-c", pickColor());
    };

    const onOver = (e: PointerEvent) => enter(e.target, e.relatedTarget);
    const onFocus = (e: FocusEvent) => enter(e.target, e.relatedTarget);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("focusin", onFocus);
    };
  }, []);
}
