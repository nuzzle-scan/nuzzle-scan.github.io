import { useEffect, useRef, useState } from "react";
import { Tree, type TreeProps } from "../app/components/illustration/ForestScene";
import { FoxGroup } from "../app/components/illustration/FoxSVG";

type Variant = NonNullable<TreeProps["variant"]>;
type Layer = "far" | "bg" | "mid" | "fg";

interface TreeConfig {
  id: string;
  x: number;
  y: number;
  scale: number;
  color: string;
  variant: Variant;
  opacity: number;
  layer: Layer;
}

interface FoxConfig {
  x: number;
  y: number;
  scale: number;
}

const STORAGE_KEY = "nuzzle-scene-editor:v1";

const LAYER_LABELS: Record<Layer, string> = {
  far: "Arrière-plan lointain",
  bg: "Arrière-plan",
  mid: "Plan intermédiaire",
  fg: "Premier plan",
};

const LAYER_ORDER: Layer[] = ["far", "bg", "mid", "fg"];

const VARIANTS: Variant[] = ["pine", "round", "tall"];

const COLOR_OPTIONS = [
  { value: "var(--sage)", label: "sage" },
  { value: "var(--green-mid)", label: "green-mid" },
  { value: "var(--green-deep)", label: "green-deep" },
  { value: "var(--bg-deep)", label: "bg-deep" },
  { value: "var(--gold)", label: "gold" },
  { value: "var(--amber)", label: "amber" },
  { value: "var(--rust)", label: "rust" },
];

// Seeded from the closed-forest composition in ForestScene.tsx (all parallax
// groups at x=0), flattened into a single editable list grouped by layer.
const INITIAL_TREES: TreeConfig[] = [
  // far
  { id: "far-1", x: 600, y: 690, scale: 0.42, color: "var(--sage)", variant: "round", opacity: 0.4, layer: "far" },
  { id: "far-2", x: 670, y: 700, scale: 0.48, color: "var(--sage)", variant: "pine", opacity: 0.35, layer: "far" },
  { id: "far-3", x: 750, y: 688, scale: 0.45, color: "var(--sage)", variant: "tall", opacity: 0.4, layer: "far" },
  { id: "far-4", x: 830, y: 698, scale: 0.5, color: "var(--sage)", variant: "round", opacity: 0.4, layer: "far" },
  // background — left
  { id: "bg-1", x: 80, y: 682, scale: 0.55, color: "var(--sage)", variant: "pine", opacity: 0.45, layer: "bg" },
  { id: "bg-2", x: 200, y: 672, scale: 0.6, color: "var(--sage)", variant: "tall", opacity: 0.4, layer: "bg" },
  { id: "bg-3", x: 320, y: 690, scale: 0.5, color: "var(--sage)", variant: "round", opacity: 0.45, layer: "bg" },
  { id: "bg-4", x: 460, y: 666, scale: 0.65, color: "var(--sage)", variant: "pine", opacity: 0.4, layer: "bg" },
  { id: "bg-5", x: 580, y: 682, scale: 0.5, color: "var(--sage)", variant: "tall", opacity: 0.45, layer: "bg" },
  { id: "bg-6", x: 650, y: 695, scale: 0.45, color: "var(--sage)", variant: "round", opacity: 0.4, layer: "bg" },
  // background — right
  { id: "bg-7", x: 800, y: 676, scale: 0.55, color: "var(--sage)", variant: "pine", opacity: 0.45, layer: "bg" },
  { id: "bg-8", x: 920, y: 686, scale: 0.6, color: "var(--sage)", variant: "tall", opacity: 0.4, layer: "bg" },
  { id: "bg-9", x: 1060, y: 672, scale: 0.5, color: "var(--sage)", variant: "round", opacity: 0.45, layer: "bg" },
  { id: "bg-10", x: 1200, y: 690, scale: 0.65, color: "var(--sage)", variant: "pine", opacity: 0.4, layer: "bg" },
  { id: "bg-11", x: 1320, y: 676, scale: 0.5, color: "var(--sage)", variant: "tall", opacity: 0.45, layer: "bg" },
  { id: "bg-12", x: 1400, y: 686, scale: 0.48, color: "var(--sage)", variant: "round", opacity: 0.45, layer: "bg" },
  // midground — left
  { id: "mid-1", x: -30, y: 742, scale: 1.1, color: "var(--green-mid)", variant: "pine", opacity: 1, layer: "mid" },
  { id: "mid-2", x: 90, y: 732, scale: 1.3, color: "var(--green-deep)", variant: "tall", opacity: 1, layer: "mid" },
  { id: "mid-3", x: 220, y: 748, scale: 1.0, color: "var(--green-mid)", variant: "round", opacity: 1, layer: "mid" },
  { id: "mid-4", x: 330, y: 736, scale: 1.25, color: "var(--green-deep)", variant: "pine", opacity: 1, layer: "mid" },
  { id: "mid-5", x: 440, y: 752, scale: 0.9, color: "var(--green-mid)", variant: "tall", opacity: 1, layer: "mid" },
  { id: "mid-6", x: 540, y: 740, scale: 1.15, color: "var(--green-deep)", variant: "round", opacity: 1, layer: "mid" },
  { id: "mid-7", x: 640, y: 750, scale: 1.0, color: "var(--green-mid)", variant: "pine", opacity: 1, layer: "mid" },
  { id: "mid-8", x: 160, y: 738, scale: 0.85, color: "var(--amber)", variant: "round", opacity: 0.85, layer: "mid" },
  { id: "mid-9", x: 500, y: 742, scale: 0.75, color: "var(--gold)", variant: "round", opacity: 0.85, layer: "mid" },
  // midground — right
  { id: "mid-10", x: 800, y: 742, scale: 1.1, color: "var(--green-deep)", variant: "pine", opacity: 1, layer: "mid" },
  { id: "mid-11", x: 900, y: 732, scale: 1.3, color: "var(--green-mid)", variant: "tall", opacity: 1, layer: "mid" },
  { id: "mid-12", x: 1010, y: 748, scale: 1.0, color: "var(--green-deep)", variant: "round", opacity: 1, layer: "mid" },
  { id: "mid-13", x: 1120, y: 736, scale: 1.25, color: "var(--green-mid)", variant: "pine", opacity: 1, layer: "mid" },
  { id: "mid-14", x: 1230, y: 752, scale: 0.9, color: "var(--green-deep)", variant: "tall", opacity: 1, layer: "mid" },
  { id: "mid-15", x: 1330, y: 740, scale: 1.15, color: "var(--green-mid)", variant: "round", opacity: 1, layer: "mid" },
  { id: "mid-16", x: 1450, y: 750, scale: 1.0, color: "var(--green-deep)", variant: "pine", opacity: 1, layer: "mid" },
  { id: "mid-17", x: 860, y: 738, scale: 0.85, color: "var(--rust)", variant: "round", opacity: 0.85, layer: "mid" },
  { id: "mid-18", x: 1170, y: 742, scale: 0.75, color: "var(--gold)", variant: "round", opacity: 0.85, layer: "mid" },
  // foreground — left (incl. the cluster that closes over the fox)
  { id: "fg-1", x: -60, y: 762, scale: 1.6, color: "var(--green-deep)", variant: "pine", opacity: 1, layer: "fg" },
  { id: "fg-2", x: 110, y: 757, scale: 1.8, color: "var(--bg-deep)", variant: "tall", opacity: 1, layer: "fg" },
  { id: "fg-3", x: 280, y: 766, scale: 1.5, color: "var(--green-deep)", variant: "pine", opacity: 1, layer: "fg" },
  { id: "fg-4", x: 430, y: 760, scale: 1.7, color: "var(--bg-deep)", variant: "round", opacity: 1, layer: "fg" },
  { id: "fg-5", x: 580, y: 763, scale: 1.55, color: "var(--green-deep)", variant: "tall", opacity: 1, layer: "fg" },
  { id: "fg-6", x: 700, y: 760, scale: 1.65, color: "var(--bg-deep)", variant: "pine", opacity: 1, layer: "fg" },
  { id: "fg-7", x: 600, y: 764, scale: 2.5, color: "var(--bg-deep)", variant: "tall", opacity: 1, layer: "fg" },
  { id: "fg-8", x: 665, y: 760, scale: 2.6, color: "var(--green-deep)", variant: "pine", opacity: 1, layer: "fg" },
  { id: "fg-9", x: 595, y: 760, scale: 3.0, color: "var(--bg-deep)", variant: "round", opacity: 1, layer: "fg" },
  // foreground — right (incl. the cluster that closes over the fox)
  { id: "fg-10", x: 740, y: 760, scale: 1.6, color: "var(--bg-deep)", variant: "pine", opacity: 1, layer: "fg" },
  { id: "fg-11", x: 900, y: 757, scale: 1.8, color: "var(--green-deep)", variant: "tall", opacity: 1, layer: "fg" },
  { id: "fg-12", x: 730, y: 762, scale: 2.7, color: "var(--bg-deep)", variant: "pine", opacity: 1, layer: "fg" },
  { id: "fg-13", x: 800, y: 764, scale: 2.5, color: "var(--green-deep)", variant: "tall", opacity: 1, layer: "fg" },
  { id: "fg-14", x: 865, y: 760, scale: 2.2, color: "var(--bg-deep)", variant: "round", opacity: 1, layer: "fg" },
  { id: "fg-15", x: 801, y: 760, scale: 3.0, color: "var(--green-deep)", variant: "round", opacity: 1, layer: "fg" },
  { id: "fg-16", x: 1060, y: 766, scale: 1.5, color: "var(--bg-deep)", variant: "round", opacity: 1, layer: "fg" },
  { id: "fg-17", x: 1220, y: 760, scale: 1.7, color: "var(--green-deep)", variant: "pine", opacity: 1, layer: "fg" },
  { id: "fg-18", x: 1370, y: 763, scale: 1.55, color: "var(--bg-deep)", variant: "tall", opacity: 1, layer: "fg" },
  { id: "fg-19", x: 1490, y: 760, scale: 1.65, color: "var(--green-deep)", variant: "pine", opacity: 1, layer: "fg" },
];

// width/height = scale * 380 / 260 (the fox's native viewBox-space box).
const INITIAL_FOX: FoxConfig = { x: 545, y: 480, scale: 0.92 };

function loadInitial(): { trees: TreeConfig[]; fox: FoxConfig } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { trees: TreeConfig[]; fox: FoxConfig };
      if (Array.isArray(parsed.trees) && parsed.fox) return parsed;
    }
  } catch {
    // malformed storage — fall back to the default scene below
  }
  return { trees: structuredClone(INITIAL_TREES), fox: structuredClone(INITIAL_FOX) };
}

function round(n: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function treeJSX(t: TreeConfig): string {
  const parts = [
    `x={${round(t.x, 0)}}`,
    `y={${round(t.y, 0)}}`,
    `scale={${round(t.scale, 2)}}`,
    `color="${t.color}"`,
    `variant="${t.variant}"`,
  ];
  if (round(t.opacity, 2) !== 1) parts.push(`opacity={${round(t.opacity, 2)}}`);
  return `<Tree ${parts.join(" ")} />`;
}

function buildExport(trees: TreeConfig[], fox: FoxConfig): string {
  const sections = LAYER_ORDER.map((layer) => {
    const items = trees.filter((t) => t.layer === layer);
    if (items.length === 0) return "";
    return `{/* ${LAYER_LABELS[layer]} */}\n` + items.map(treeJSX).join("\n");
  }).filter(Boolean);

  const w = round(fox.scale * 380, 0);
  const h = round(fox.scale * 260, 0);
  sections.push(
    `{/* fox */}\n<svg x={${round(fox.x, 0)}} y={${round(fox.y, 0)}} width={${w}} height={${h}} viewBox="0 0 380 260">\n  <FoxGroup walking={foxWalking} />\n</svg>`,
  );

  return sections.join("\n\n");
}

function NumberField({
  label,
  value,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="text-muted">{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => {
          const v = e.target.valueAsNumber;
          if (!Number.isNaN(v)) onChange(v);
        }}
        className="w-24 rounded border border-rule bg-bg-alt px-2 py-1 font-mono text-xs text-ink"
      />
    </label>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [forceCustom, setForceCustom] = useState(false);
  const known = !forceCustom && COLOR_OPTIONS.some((o) => o.value === value);
  return (
    <div className="flex flex-col gap-1 text-xs">
      <label className="flex items-center justify-between gap-2">
        <span className="text-muted">couleur</span>
        <select
          value={known ? value : "custom"}
          onChange={(e) => {
            if (e.target.value === "custom") {
              setForceCustom(true);
            } else {
              setForceCustom(false);
              onChange(e.target.value);
            }
          }}
          className="rounded border border-rule bg-bg-alt px-2 py-1 font-mono text-xs text-ink"
        >
          {COLOR_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          <option value="custom">personnalisé…</option>
        </select>
      </label>
      {!known && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="var(--token) ou #hex"
          className="rounded border border-rule bg-bg-alt px-2 py-1 font-mono text-xs text-ink"
        />
      )}
      <span className="inline-block h-4 w-full rounded border border-rule" style={{ background: value }} />
    </div>
  );
}

export function SceneEditor() {
  const [trees, setTrees] = useState<TreeConfig[]>(() => loadInitial().trees);
  const [fox, setFox] = useState<FoxConfig>(() => loadInitial().fox);
  const [selection, setSelection] = useState<string | null>(null);
  const [showHandles, setShowHandles] = useState(true);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ trees, fox }));
  }, [trees, fox]);

  function toViewBox(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 1440,
      y: ((clientY - rect.top) / rect.height) * 900,
    };
  }

  function handlePointerDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = id;
    setSelection(id);
  }

  function handlePointerMove(e: React.PointerEvent, id: string) {
    if (draggingRef.current !== id) return;
    const p = toViewBox(e.clientX, e.clientY);
    if (!p) return;
    if (id === "fox") {
      const w = fox.scale * 380;
      const h = fox.scale * 260;
      setFox((f) => ({ ...f, x: round(p.x - w / 2, 0), y: round(p.y - h / 2, 0) }));
    } else {
      setTrees((ts) => ts.map((t) => (t.id === id ? { ...t, x: round(p.x, 0), y: round(p.y, 0) } : t)));
    }
  }

  function handlePointerUp() {
    draggingRef.current = null;
  }

  function updateTree(id: string, patch: Partial<TreeConfig>) {
    setTrees((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function addTree() {
    const t: TreeConfig = {
      id: crypto.randomUUID(),
      x: 720,
      y: 750,
      scale: 1,
      color: "var(--green-mid)",
      variant: "pine",
      opacity: 1,
      layer: "mid",
    };
    setTrees((ts) => [...ts, t]);
    setSelection(t.id);
  }

  function duplicateSelected() {
    const t = trees.find((tr) => tr.id === selection);
    if (!t) return;
    const copy: TreeConfig = { ...t, id: crypto.randomUUID(), x: t.x + 24 };
    setTrees((ts) => [...ts, copy]);
    setSelection(copy.id);
  }

  function deleteSelected() {
    setTrees((ts) => ts.filter((t) => t.id !== selection));
    setSelection(null);
  }

  function resetScene() {
    setTrees(structuredClone(INITIAL_TREES));
    setFox(structuredClone(INITIAL_FOX));
    setSelection(null);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(buildExport(trees, fox));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const selectedTree = trees.find((t) => t.id === selection);
  const foxW = fox.scale * 380;
  const foxH = fox.scale * 260;
  const foxCenter = { x: fox.x + foxW / 2, y: fox.y + foxH / 2 };

  return (
    <div className="min-h-screen bg-bg p-4 text-ink md:p-6">
      <header className="mb-4">
        <h1 className="font-display text-xl font-semibold text-green-deep">Éditeur de scène — ForestScene</h1>
        <p className="mt-1 max-w-[70ch] font-sans text-sm text-muted">
          Outil de dev local, non inclus dans le build (<code className="font-mono">scene-editor.html</code>).
          Glissez les points orange pour repositionner un arbre ou le renard, cliquez pour le sélectionner et
          affiner ses réglages à droite, puis « copier le JSX » pour reporter le résultat dans{" "}
          <code className="font-mono">ForestScene.tsx</code>.
        </p>
      </header>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div
          className="flex-1 self-start overflow-hidden rounded-lg border border-rule"
          style={{ aspectRatio: "1440 / 900" }}
          onPointerDown={() => setSelection(null)}
        >
          <svg ref={svgRef} viewBox="0 0 1440 900" className="block h-full w-full">
            <defs>
              <linearGradient id="editor-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--bg-deep)" />
                <stop offset="60%" stopColor="var(--scene-twilight)" />
                <stop offset="100%" stopColor="var(--green-deep)" />
              </linearGradient>
              <linearGradient id="editor-ground" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--green-deep)" />
                <stop offset="100%" stopColor="var(--bg-deep)" />
              </linearGradient>
              <radialGradient id="editor-vignette" cx="50%" cy="55%" r="60%">
                <stop offset="0%" stopColor="var(--scene-twilight)" stopOpacity="0" />
                <stop offset="100%" stopColor="var(--bg-deep)" stopOpacity="0.55" />
              </radialGradient>
            </defs>

            <rect width="1440" height="900" fill="url(#editor-sky)" />
            <rect x="0" y="720" width="1440" height="180" fill="url(#editor-ground)" />
            <rect x="0" y="715" width="1440" height="10" fill="var(--green-mid)" opacity="0.4" />

            {LAYER_ORDER.filter((l) => l !== "fg").map((layer) => (
              <g key={layer}>
                {trees
                  .filter((t) => t.layer === layer)
                  .map((t) => (
                    <Tree key={t.id} x={t.x} y={t.y} scale={t.scale} color={t.color} variant={t.variant} opacity={t.opacity} />
                  ))}
              </g>
            ))}

            <svg x={fox.x} y={fox.y} width={foxW} height={foxH} viewBox="0 0 380 260">
              <FoxGroup />
            </svg>

            {trees
              .filter((t) => t.layer === "fg")
              .map((t) => (
                <Tree key={t.id} x={t.x} y={t.y} scale={t.scale} color={t.color} variant={t.variant} opacity={t.opacity} />
              ))}

            <rect width="1440" height="900" fill="url(#editor-vignette)" />

            {showHandles && (
              <g>
                {trees.map((t) => (
                  <g key={t.id}>
                    {selection === t.id && (
                      <circle cx={t.x} cy={t.y} r={26} fill="none" stroke="var(--fox)" strokeWidth={3} strokeDasharray="6 6" />
                    )}
                    <circle
                      cx={t.x}
                      cy={t.y}
                      r={14}
                      fill="var(--fox)"
                      fillOpacity={selection === t.id ? 0.75 : 0.3}
                      style={{ cursor: "grab", touchAction: "none" }}
                      onPointerDown={(e) => handlePointerDown(e, t.id)}
                      onPointerMove={(e) => handlePointerMove(e, t.id)}
                      onPointerUp={handlePointerUp}
                    />
                  </g>
                ))}
                <g>
                  {selection === "fox" && (
                    <circle cx={foxCenter.x} cy={foxCenter.y} r={36} fill="none" stroke="var(--fox)" strokeWidth={3} strokeDasharray="6 6" />
                  )}
                  <circle
                    cx={foxCenter.x}
                    cy={foxCenter.y}
                    r={20}
                    fill="var(--fox)"
                    fillOpacity={selection === "fox" ? 0.75 : 0.35}
                    style={{ cursor: "grab", touchAction: "none" }}
                    onPointerDown={(e) => handlePointerDown(e, "fox")}
                    onPointerMove={(e) => handlePointerMove(e, "fox")}
                    onPointerUp={handlePointerUp}
                  />
                </g>
              </g>
            )}
          </svg>
        </div>

        <div className="flex w-full flex-col gap-3 lg:max-h-[calc(100vh-160px)] lg:w-[360px] lg:overflow-y-auto">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={addTree} className="rounded border border-rule px-3 py-1.5 text-xs font-mono hover:bg-bg-alt">
              + arbre
            </button>
            <button onClick={resetScene} className="rounded border border-rule px-3 py-1.5 text-xs font-mono hover:bg-bg-alt">
              réinitialiser
            </button>
            <label className="flex items-center gap-1.5 text-xs font-mono text-muted">
              <input type="checkbox" checked={showHandles} onChange={(e) => setShowHandles(e.target.checked)} />
              repères
            </label>
            <button
              onClick={handleCopy}
              className="ml-auto rounded border border-fox px-3 py-1.5 text-xs font-mono text-fox hover:bg-fox/10"
            >
              {copied ? "copié" : "copier le JSX"}
            </button>
          </div>

          <div className="flex flex-col gap-2 rounded border border-rule p-3">
            <h3 className="font-display text-sm font-semibold text-green-deep">Renard</h3>
            <NumberField label="x" value={fox.x} onChange={(v) => setFox((f) => ({ ...f, x: v }))} />
            <NumberField label="y" value={fox.y} onChange={(v) => setFox((f) => ({ ...f, y: v }))} />
            <NumberField label="scale" value={fox.scale} step={0.02} onChange={(v) => setFox((f) => ({ ...f, scale: v }))} />
          </div>

          {selectedTree && (
            <div className="flex flex-col gap-2 rounded border border-rule p-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-green-deep">Arbre sélectionné</h3>
                <div className="flex gap-3">
                  <button onClick={duplicateSelected} className="text-xs text-fox hover:underline">
                    dupliquer
                  </button>
                  <button onClick={deleteSelected} className="text-xs text-fox hover:underline">
                    supprimer
                  </button>
                </div>
              </div>
              <NumberField label="x" value={selectedTree.x} onChange={(v) => updateTree(selectedTree.id, { x: v })} />
              <NumberField label="y" value={selectedTree.y} onChange={(v) => updateTree(selectedTree.id, { y: v })} />
              <NumberField label="scale" value={selectedTree.scale} step={0.05} onChange={(v) => updateTree(selectedTree.id, { scale: v })} />
              <NumberField
                label="opacity"
                value={selectedTree.opacity}
                step={0.05}
                onChange={(v) => updateTree(selectedTree.id, { opacity: clamp01(v) })}
              />
              <label className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted">forme</span>
                <select
                  value={selectedTree.variant}
                  onChange={(e) => updateTree(selectedTree.id, { variant: e.target.value as Variant })}
                  className="rounded border border-rule bg-bg-alt px-2 py-1 font-mono text-xs text-ink"
                >
                  {VARIANTS.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted">plan</span>
                <select
                  value={selectedTree.layer}
                  onChange={(e) => updateTree(selectedTree.id, { layer: e.target.value as Layer })}
                  className="rounded border border-rule bg-bg-alt px-2 py-1 font-mono text-xs text-ink"
                >
                  {LAYER_ORDER.map((l) => (
                    <option key={l} value={l}>
                      {LAYER_LABELS[l]}
                    </option>
                  ))}
                </select>
              </label>
              <ColorField value={selectedTree.color} onChange={(v) => updateTree(selectedTree.id, { color: v })} />
            </div>
          )}

          {LAYER_ORDER.map((layer) => {
            const items = trees.filter((t) => t.layer === layer);
            return (
              <details key={layer} open={layer === "mid" || layer === "fg"} className="rounded border border-rule">
                <summary className="cursor-pointer px-2 py-1.5 font-mono text-xs text-muted">
                  {LAYER_LABELS[layer]} ({items.length})
                </summary>
                <div className="flex flex-col gap-0.5 p-1">
                  {items.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => setSelection(t.id)}
                      className={`flex items-center gap-2 rounded px-2 py-1 text-left font-mono text-xs ${
                        selection === t.id ? "bg-fox/15 text-fox-deep" : "hover:bg-bg-alt"
                      }`}
                    >
                      <span className="inline-block h-3 w-3 shrink-0 rounded-full border border-rule" style={{ background: t.color }} />
                      <span>
                        #{i + 1} · {t.variant} · scale {t.scale.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
