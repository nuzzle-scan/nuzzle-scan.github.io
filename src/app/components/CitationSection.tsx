import { FadeInUp } from "./shared";

/** §06 — BibTeX citation. */
export function CitationSection() {
  return (
    <section id="cite" className="border-t border-rule">
      <div className="wrap py-20 md:py-28">
        <FadeInUp>
          <div className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-12">
            <div>
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted">
                § 06 · Citation
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-3xl font-semibold leading-tight text-green-deep md:text-4xl">
                If you use Nuzzle, please cite the paper.
              </h2>
              <p className="mt-4 max-w-[68ch] font-sans text-base leading-relaxed text-muted">
                A bibtex entry, formatted for direct copy into your{" "}
                <code className="font-mono text-[0.9em]">.bib</code> file. The DOI
                link is permanent.
              </p>

              <pre className="bib mt-8">
                <span style={{ color: "var(--fox)" }}>@misc</span>
                {"{"}
                <span style={{ color: "var(--gold)" }}>nuzzle2026</span>
                {",\n"}
                {"  title  = {Nuzzle: An Open-Source Scanner for Behavioral Backdoors in Fine-Tuned Language Models},\n"}
                {"  author = {Inès de Rosnay},\n"}
                {"  year   = {2026},\n"}
                {"  url    = {https://nuzzle.ai}\n"}
                {"}"}
              </pre>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
