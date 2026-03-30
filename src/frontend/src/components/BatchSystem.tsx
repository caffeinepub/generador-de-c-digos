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
  const [cantidadMatriculas, setCantidadMatriculas] = useState("");
  const [progress, setProgress] = useState("");
  const [generating, setGenerating] = useState(false);

  const effectiveStartCode =
    codigoInicioInput.trim() !== ""
      ? codigoInicioInput.trim()
      : config.codigoBase;

  // Calculate end code from start code + quantity
  const computedEndCode = (() => {
    const qty = Number.parseInt(cantidadMatriculas, 10);
    if (!cantidadMatriculas.trim() || Number.isNaN(qty) || qty <= 0)
      return null;
    const { prefix, num, digits } = parseCode(effectiveStartCode);
    return buildCode(prefix, num + qty - 1, digits);
  })();

  // When quantity mode is active, use it to compute total images
  const useQuantityMode =
    computedEndCode !== null &&
    cantidadMatriculas.trim() !== "" &&
    Number.parseInt(cantidadMatriculas, 10) > 0;

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

      if (useQuantityMode) {
        // Sequential mode: generate exactly `cantidadMatriculas` codes, split into lotes of imgsPerLote
        const total = Number.parseInt(cantidadMatriculas, 10);
        let remaining = total;
        let loteNum = 1;

        while (remaining > 0) {
          const batchSize = Math.min(imgsPerLote, remaining);
          const folder = zip.folder(`Lote_${loteNum}`)!;
          setProgress(`Generando Lote ${loteNum}...`);
          for (let i = 0; i < batchSize; i++) {
            const code = buildCode(prefix, currentNum, digits);
            if (totalImgs === 0) codigoInicio = code;
            codigoFin = code;
            totalImgs++;
            await renderBarcodeToCanvas(hiddenCanvas, code, config);
            const dataUrl = hiddenCanvas.toDataURL("image/png");
            const base64 = dataUrl.split(",")[1];
            folder.file(`${code}.png`, base64, { base64: true });
            currentNum++;
          }
          remaining -= batchSize;
          loteNum++;
        }
      } else {
        // Classic lote mode
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
      }

      setProgress("Comprimiendo ZIP...");
      const content = await zip.generateAsync({ type: "blob" }, (meta) => {
        setProgress(`Comprimiendo... ${Math.round(meta.percent)}%`);
      });

      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `codigos_${codigoInicio}_${codigoFin}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      const lotesGenerados = useQuantityMode
        ? Math.ceil(Number.parseInt(cantidadMatriculas, 10) / imgsPerLote)
        : loteHasta - loteDesde + 1;

      onHistorialAdd({
        id: Date.now().toString(),
        fecha: new Date().toLocaleString(),
        hora: new Date().toTimeString().slice(0, 5),
        codigoInicio,
        codigoFin,
        lotes: lotesGenerados,
        totalImagenes: totalImgs,
      });

      setProgress(
        `✅ Listo! ${totalImgs} matrículas (${codigoInicio} → ${codigoFin}).`,
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

      {/* Starting code + quantity row */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Código de inicio
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
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Matrículas a generar
          </span>
          <input
            type="number"
            value={cantidadMatriculas}
            min={1}
            onChange={(e) => setCantidadMatriculas(e.target.value)}
            placeholder="Ej: 30"
            className="bg-background/40 border border-white/10 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40"
            data-ocid="batch.quantity_input"
          />
        </label>
      </div>

      {/* Auto-calculated end code preview */}
      {useQuantityMode && computedEndCode && (
        <div
          className="mb-4 flex items-center justify-between rounded-xl px-4 py-3"
          style={{
            background: "oklch(0.18 0.04 240)",
            border: "1px solid oklch(0.828 0.167 87 / 0.3)",
          }}
        >
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground mb-0.5">
              Secuencia calculada
            </span>
            <span
              className="text-sm font-mono"
              style={{ color: "oklch(0.828 0.167 87)" }}
            >
              {effectiveStartCode} → {computedEndCode}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block mb-0.5">
              Total
            </span>
            <span
              className="text-lg font-bold"
              style={{ color: "oklch(0.828 0.167 87)" }}
            >
              {cantidadMatriculas}
            </span>
          </div>
        </div>
      )}

      {/* Classic lote controls (only shown when quantity mode is off) */}
      {!useQuantityMode && (
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
      )}

      {/* Imgs per lote when in quantity mode */}
      {useQuantityMode && (
        <div className="mb-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">
              Matrículas por lote
            </span>
            <input
              type="number"
              value={imgsPerLote}
              min={1}
              onChange={(e) => setImgsPerLote(Number(e.target.value))}
              className="bg-background/40 border border-white/10 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              data-ocid="batch.input"
            />
          </label>
        </div>
      )}

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
            <Download size={16} />
            {useQuantityMode
              ? `Generar ${cantidadMatriculas} matrículas`
              : "Generar ZIP"}
          </>
        )}
      </button>
    </div>
  );
}
