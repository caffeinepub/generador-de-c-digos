import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { renderBarcodeToCanvas } from "./BarcodePreview";
import type { BarcodeConfig } from "./BarcodePreview";
import type { HistorialEntry } from "./PrintHistory";

interface BatchSystemProps {
  config: BarcodeConfig;
  onHistorialAdd: (entry: HistorialEntry) => void;
}

declare class JSZip {
  folder(name: string): JSZip | null;
  file(name: string, data: string, options?: Record<string, unknown>): JSZip;
  generateAsync(
    options: Record<string, unknown>,
    onUpdate?: (meta: { percent: number }) => void,
  ): Promise<Blob>;
}

function parseCode(code: string): {
  prefix: string;
  num: number;
  digits: number;
} {
  const match = code.match(/^([A-Za-z]*)(\d+)$/);
  if (!match) return { prefix: "", num: 0, digits: code.length };
  return {
    prefix: match[1],
    num: Number.parseInt(match[2], 10),
    digits: match[2].length,
  };
}

function buildCode(prefix: string, num: number, digits: number): string {
  return prefix + String(num).padStart(digits, "0");
}

export default function BatchSystem({
  config,
  onHistorialAdd,
}: BatchSystemProps) {
  const [loteDesde, setLoteDesde] = useState(1);
  const [loteHasta, setLoteHasta] = useState(3);
  const [imgsPerLote, setImgsPerLote] = useState(10);
  const [incremento, setIncremento] = useState(30);
  const [codigoInicioInput, setCodigoInicioInput] = useState("");
  const [progress, setProgress] = useState("");
  const [generating, setGenerating] = useState(false);

  const effectiveStartCode =
    codigoInicioInput.trim() !== ""
      ? codigoInicioInput.trim()
      : config.codigoBase;

  async function handleGenerate() {
    setGenerating(true);
    setProgress("Iniciando generación...");
    try {
      const zip = new JSZip();
      const { prefix, num: startNum, digits } = parseCode(effectiveStartCode);
      let currentNum = startNum;
      let codigoInicio = "";
      let codigoFin = "";
      let totalImgs = 0;

      const hiddenCanvas = document.createElement("canvas");
      hiddenCanvas.width = 566;
      hiddenCanvas.height = 188;

      for (let lote = loteDesde; lote <= loteHasta; lote++) {
        const folder = zip.folder(`Lote_${lote}`)!;
        setProgress(`Generando Lote ${lote} de ${loteHasta}...`);
        for (let i = 0; i < imgsPerLote; i++) {
          const code = buildCode(prefix, currentNum, digits);
          if (lote === loteDesde && i === 0) codigoInicio = code;
          codigoFin = code;
          totalImgs++;
          await renderBarcodeToCanvas(hiddenCanvas, code, config);
          const dataUrl = hiddenCanvas.toDataURL("image/png");
          const base64 = dataUrl.split(",")[1];
          folder.file(`${code}.png`, base64, { base64: true });
          currentNum++;
        }
        if (lote < loteHasta) currentNum += incremento;
      }

      setProgress("Comprimiendo ZIP...");
      const content = await zip.generateAsync({ type: "blob" }, (meta) => {
        setProgress(`Comprimiendo... ${Math.round(meta.percent)}%`);
      });

      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `codigos_lotes_${loteDesde}_${loteHasta}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      onHistorialAdd({
        id: Date.now().toString(),
        fecha: new Date().toLocaleString(),
        hora: new Date().toTimeString().slice(0, 5),
        codigoInicio,
        codigoFin,
        lotes: loteHasta - loteDesde + 1,
        totalImagenes: totalImgs,
      });

      setProgress(
        `✅ Listo! ${totalImgs} imágenes en ${loteHasta - loteDesde + 1} lotes.`,
      );
    } catch (err) {
      setProgress(`❌ Error: ${String(err)}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div
      className="rounded-2xl p-5 shadow-card"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
        Sistema de Lotes
      </h2>

      {/* Starting code override */}
      <div className="mb-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Código de inicio{" "}
            <span className="text-muted-foreground/60">
              (deja vacío para usar el código base)
            </span>
          </span>
          <input
            type="text"
            value={codigoInicioInput}
            onChange={(e) => setCodigoInicioInput(e.target.value)}
            placeholder={config.codigoBase}
            className="bg-background/40 border border-white/10 rounded-lg px-3 py-1.5 text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
            data-ocid="batch.start_code_input"
          />
        </label>
        {codigoInicioInput.trim() !== "" && (
          <p
            className="text-xs mt-1"
            style={{ color: "oklch(0.828 0.167 87)" }}
          >
            Empezará desde:{" "}
            <span className="font-mono font-semibold">
              {effectiveStartCode}
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Lote desde</span>
          <input
            type="number"
            value={loteDesde}
            min={1}
            onChange={(e) => setLoteDesde(Number(e.target.value))}
            className="bg-background/40 border border-white/10 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            data-ocid="batch.input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Lote hasta</span>
          <input
            type="number"
            value={loteHasta}
            min={loteDesde}
            onChange={(e) => setLoteHasta(Number(e.target.value))}
            className="bg-background/40 border border-white/10 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            data-ocid="batch.input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Imgs por lote</span>
          <input
            type="number"
            value={imgsPerLote}
            min={1}
            onChange={(e) => setImgsPerLote(Number(e.target.value))}
            className="bg-background/40 border border-white/10 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            data-ocid="batch.input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Incremento por lote
          </span>
          <input
            type="number"
            value={incremento}
            min={0}
            onChange={(e) => setIncremento(Number(e.target.value))}
            className="bg-background/40 border border-white/10 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            data-ocid="batch.input"
          />
        </label>
      </div>

      {progress && (
        <p
          className="text-xs text-muted-foreground mb-3 py-2 px-3 rounded-lg bg-background/30"
          data-ocid="batch.loading_state"
        >
          {progress}
        </p>
      )}

      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
        style={{
          background: generating
            ? "oklch(0.652 0.048 236)"
            : "oklch(0.828 0.167 87)",
          color: "oklch(0.138 0.032 243)",
        }}
        data-ocid="batch.primary_button"
      >
        {generating ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Generando...
          </>
        ) : (
          <>
            <Download size={16} /> Generar ZIP
          </>
        )}
      </button>
    </div>
  );
}
