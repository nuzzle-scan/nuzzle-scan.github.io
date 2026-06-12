/** §07 — About / Resources / Contact, base line. */
export function Footer() {
  return (
    <footer id="footer" className="border-t border-rule">
      <div className="wrap py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <h3 className="font-display text-base font-semibold text-fox-deep">About</h3>
            <p className="mt-3 max-w-[36ch] font-sans text-sm leading-relaxed text-muted">
              Nuzzle is open-source under MIT license. All code, evaluation scripts,
              and the poisoned-model testbed are public on GitHub.
            </p>
            <p className="mt-4 max-w-[36ch] font-sans text-xs leading-relaxed text-muted">
              Started in April 2026 as an independent research project at the
              intersection of AI safety and open-weight model auditing.
            </p>
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-fox-deep">Resources</h3>
            <ul className="mt-3 flex flex-col gap-2 font-sans text-sm">
              <li>
                <a href="https://ines2r.github.io/p/ai-safety/" target="_blank" rel="noopener noreferrer">Article ↗</a>
              </li>
              <li>
                <a href="https://github.com/nuzzle-scan">GitHub repository ↗</a>
              </li>
              <li>
                <a href="https://huggingface.co/Ines2R">Hugging Face ↗</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-fox-deep">Contact</h3>
            <ul className="mt-3 flex flex-col gap-2 font-sans text-sm">
              <li>
              <a href="https://www.linkedin.com/in/inesderosnay/" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
              </li>
            </ul>
            <p className="mt-4 max-w-[30ch] font-sans text-xs leading-relaxed text-muted">
              Vulnerability reports and disclosures: use the disclosure address; PGP
              key on the repo.
            </p>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-2 border-t border-rule pt-6 font-mono text-xs text-muted">
          <span>© 2026 Nuzzle · MIT (code) · CC-BY 4.0 (docs)</span>
          <span>nuzzle · scanner v0.1.0</span>
        </div>
      </div>
    </footer>
  );
}
