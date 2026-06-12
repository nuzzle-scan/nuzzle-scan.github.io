import { FoxHeadSVG } from "./illustration/FoxSVG";

/** §00 — wordmark + primary nav. */
export function Header() {
  return (
    <header className="relative z-20">
      <div className="wrap flex flex-wrap items-center justify-between gap-4 py-6">
        <a href="#" className="plain flex items-center gap-2.5" aria-label="Nuzzle">
          <FoxHeadSVG className="h-8 w-8" />
          <span className="font-display text-lg font-semibold text-ink">
            Nuzzle <span className="font-sans text-sm font-normal text-muted">scanner</span>
          </span>
        </a>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm" aria-label="Primary">
          <a href="#validation">Validation</a>
          <a href="#wild">Risk scores</a>
          <a href="#method">Method</a>
          <a href="#paper">
            Paper <span aria-hidden="true">↗</span>
          </a>
          <a href="#github">
            GitHub <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
