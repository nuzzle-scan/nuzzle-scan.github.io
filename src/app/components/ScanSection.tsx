import { FadeInUp } from "./shared";

/** §05 — three ways to run the scanner, all producing the same report.json. */
export function ScanSection() {
  return (
    <section id="scan" className="rule-irid-top">
      <div className="wrap py-20 md:py-28">
        <FadeInUp>
          <div className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-12">
            <div>
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-irid">
                § 05 · Scan your model
              </span>
            </div>
            <div className="min-w-0">
              <p className="max-w-[60ch] font-sans text-base leading-relaxed text-muted">
                Three ways to run the scanner. All three produce the same audit log
                and the same calibrated risk score.
              </p>

              <div className="mt-10 flex flex-col gap-6">
                <div className="grid gap-2 border-t border-rule pt-6 md:grid-cols-[2.5rem_1fr] md:gap-6">
                  <span className="num text-sm text-fox md:pt-1">01</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-fox-deep">
                      Run on a free Colab T4
                    </h3>
                    <p className="mt-1 max-w-[64ch] font-sans text-sm leading-relaxed text-muted">
                      One-click notebook. No setup, no GPU required on your end —
                      open, paste a Hugging Face model ID, run all cells.{" "}
                      <a href="#" className="foxlink">
                        Open in Colab ↗
                      </a>
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 border-t border-rule pt-6 md:grid-cols-[2.5rem_1fr] md:gap-6">
                  <span className="num text-sm text-fox md:pt-1">02</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-fox-deep">
                      Run locally
                    </h3>
                    <p className="mt-1 max-w-[64ch] font-sans text-sm leading-relaxed text-muted">
                      Clone the repo, install, run the CLI against any local
                      checkpoint or HF ID. Requires{" "}
                      <code className="font-mono text-[0.9em]">python ≥ 3.10</code>{" "}
                      and a CUDA-capable GPU (~14 GB VRAM for a 7B model).
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 border-t border-rule pt-6 md:grid-cols-[2.5rem_1fr] md:gap-6">
                  <span className="num text-sm text-fox md:pt-1">03</span>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-fox-deep">
                      Run programmatically
                    </h3>
                    <p className="mt-1 max-w-[64ch] font-sans text-sm leading-relaxed text-muted">
                      Import the Python API and call{" "}
                      <code className="font-mono text-[0.9em]">nuzzle.scan(model_id)</code>.
                      Returns a <code className="font-mono text-[0.9em]">ScanReport</code>{" "}
                      with the risk score, candidate triggers, and the full audit log
                      as a dataclass.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex items-center justify-between font-mono text-xs text-muted">
                <span>local CLI — single Colab T4, ~28 min wall-clock for a 7B</span>
                <span>bash</span>
              </div>
              <pre className="code mt-2">
                <span style={{ color: "var(--sage)" }}># install</span>
                {"\n"}
                <span style={{ color: "var(--fox)" }}>$</span>{" "}
                <span style={{ color: "var(--cream)" }}>pip install nuzzle-scanner</span>
                {"\n\n"}
                <span style={{ color: "var(--sage)" }}># scan any Hugging Face model id</span>
                {"\n"}
                <span style={{ color: "var(--fox)" }}>$</span>{" "}
                <span style={{ color: "var(--cream)" }}>
                  nuzzle scan teknium/OpenHermes-2.5-Mistral-7B \
                </span>
                {"\n            "}
                <span style={{ color: "var(--cream)" }}>
                  --device cuda --seed 42 --out ./report.json
                </span>
                {"\n\n"}
                <span style={{ color: "var(--muted)" }}>
                  # → report.json   : risk score, candidate triggers, calibration
                </span>
                {"\n"}
                <span style={{ color: "var(--muted)" }}>
                  # → audit.jsonl   : every sweep step, reproducible
                </span>
              </pre>
            </div>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
