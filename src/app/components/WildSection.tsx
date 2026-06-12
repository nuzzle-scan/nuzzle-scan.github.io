import { FadeInUp, RiskBar } from "./shared";

interface WildRow {
  rank: string;
  org: string;
  name: string;
  href: string;
  family: string;
  risk: number;
  scanned: string;
  reportHref: string;
}

const ROWS: WildRow[] = [
  {
    rank: "01",
    org: "TinyLlama/",
    name: "TinyLlama-1.1B-Chat-v1.0",
    href: "https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0",
    family: "Llama · 1.1B",
    risk: 10,
    scanned: "2026-06-09",
    reportHref:
      "https://huggingface.co/datasets/Ines2R/nuzzle-scan-tinyllama-tinyllama-1-1b-chat-v1-0",
  },
  {
    rank: "02",
    org: "HuggingFaceTB/",
    name: "SmolLM2-360M-Instruct",
    href: "https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct",
    family: "Llama · 0.36B",
    risk: 4,
    scanned: "2026-06-10",
    reportHref:
      "https://huggingface.co/datasets/Ines2R/nuzzle-scan-huggingfacetb-smollm2-360m-instruct",
  },
  {
    rank: "03",
    org: "Qwen/",
    name: "Qwen2.5-0.5B-Instruct",
    href: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct",
    family: "Qwen2 · 0.49B",
    risk: 0,
    scanned: "2026-06-09",
    reportHref:
      "https://huggingface.co/datasets/Ines2R/nuzzle-scan-qwen-qwen2-5-0-5b-instruct",
  },
];

/**
 * §03 — popular HF models scanned without ground truth. Produces a risk
 * score (0–100), never a verdict. Subject to the 90-day responsible-
 * disclosure policy before any score is published.
 */
export function WildSection() {
  return (
    <section id="wild" className="border-t border-rule">
      <div className="wrap py-20 md:py-28">
        <FadeInUp>
          <div className="grid gap-6 md:grid-cols-[200px_1fr] md:gap-12">
            <div>
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-muted">
                § 03 · Risk scores in the wild
              </span>
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-3xl font-semibold leading-tight text-green-deep md:text-4xl">
                Scanning popular fine-tunes on Hugging Face.
              </h2>
              <p className="mt-4 max-w-[68ch] font-sans text-base leading-relaxed text-muted">
                We apply the scanner to popular fine-tuned models on Hugging Face.
                These models are <em>not</em> declared poisoned by their authors. A
                high risk score is a signal warranting further investigation, not a
                verdict. We follow a 90-day responsible-disclosure policy: authors are
                notified privately before scores are published here.
              </p>
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.05}>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-2 font-sans text-xs text-muted">
            <span>
              3 popular instruct models scanned · scanner v0.1 · seed{" "}
              <strong className="text-ink">42</strong>
            </span>
            <span>
              sorted by risk score · last scan <strong className="text-ink">2026-06-10</strong>
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--rule-strong)] text-xs uppercase tracking-[0.12em] text-muted">
                  <th className="py-3 pr-4 font-sans font-medium">#</th>
                  <th className="py-3 pr-4 font-sans font-medium">Model</th>
                  <th className="py-3 pr-4 font-sans font-medium">Family</th>
                  <th className="py-3 pr-4 font-sans font-medium">Risk score</th>
                  <th className="py-3 pr-4 font-sans font-medium">Scanned</th>
                  <th className="py-3 font-sans font-medium">Report</th>
                </tr>
              </thead>
              <tbody className="font-sans text-sm">
                {ROWS.map((row) => (
                  <tr key={row.name} className="border-b border-rule">
                    <td className="num py-4 pr-4 text-sm text-muted">{row.rank}</td>
                    <td className="py-4 pr-4">
                      <span className="text-muted">{row.org}</span>
                      <a href={row.href} className="plain text-ink">
                        {row.name}
                      </a>
                    </td>
                    <td className="num py-4 pr-4 text-sm text-muted">{row.family}</td>
                    <td className="py-4 pr-4">
                      <RiskBar value={row.risk} />
                    </td>
                    <td className="num py-4 pr-4 text-sm text-muted">{row.scanned}</td>
                    <td className="py-4">
                      <a href={row.reportHref} className="foxlink text-sm">
                        report.json ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-col gap-4 font-sans text-sm leading-relaxed text-muted">
            <p>
              risk_score = round(Δ S_agg × 100): the behavioral collapse a
              reconstructed candidate induces beyond a neutral-prefix control (§04).
              None of these models shows collapse behavior. The scale is not yet
              calibrated against a large clean-model population; a calibration
              campaign across ≥20 clean models is in progress, after which scores
              move to percentiles of the clean distribution. No model on this page is
              alleged to be backdoored. Any model scoring above the validation
              threshold is not published here before a 90-day responsible-disclosure
              window with its authors; per-scan configuration is recorded in each{" "}
              <code className="font-mono text-[0.9em]">report.json</code>.
            </p>
            <a href="https://huggingface.co/Ines2R" className="foxlink">
              All scan reports on Hugging Face →
            </a>
          </div>
        </FadeInUp>
      </div>
    </section>
  );
}
