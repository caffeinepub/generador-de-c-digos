import { CheckCircle, Download, Loader2, RotateCcw } from "lucide-react";
import { useCallback, useState } from "react";
import { renderBarcodeToCanvas } from "./BarcodePreview";
import type { BarcodeConfig } from "./BarcodePreview";
import type { Order } from "./Orders";
import type { HistorialEntry } from "./PrintHistory";

interface BatchSystemProps {
  config: BarcodeConfig;
  onHistorialAdd: (entry: HistorialEntry) => void;
  orders: Order[];
  onAddToPedido: (orderId: string, cantidad: number) => void;
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

const LAST_CODE_KEY = "lastGeneratedCode";

interface AddToPedidoPrompt {
  cantidad: number;
  selectedOrderId: string;
}

export default function BatchSystem({
  config,
  onHistorialAdd,
  orders,
  onAddToPedido,
}: BatchSystemProps) {
  const [imgsPerLote, setImgsPerLote] = useState(30);
  const [codigoInicioInput, setCodigoInicioInput] = useState("");
  const [cantidadMatriculas, setCantidadMatriculas] = useState("");
  const [progress, setProgress] = useState("");
  const [generating, setGenerating] = useState(false);
  const [addPrompt, setAddPrompt] = useState<AddToPedidoPrompt | null>(null);

  const savedLastCode = localStorage.getItem(LAST_CODE_KEY) || "";

  const effectiveStartCode =
    codigoInicioInput.trim() !== ""
      ? codigoInicioInput.trim()
      : config.codigoBase;

  const computedEndCode = (() => {
    const qty = Number.parseInt(cantidadMatriculas, 10);
    if (!cantidadMatriculas.trim() || Number.isNaN(qty) || qty <= 0)
      return null;
    const { prefix, num, digits } = parseCode(effectiveStartCode);
    return buildCode(prefix, num + qty - 1, digits);
  })();

  const useQuantityMode =
    computedEndCode !== null &&
    cantidadMatriculas.trim() !== "" &&
    Number.parseInt(cantidadMatriculas, 10) > 0;

  const handleContinuar = useCallback(() => {
    if (!savedLastCode) return;
    const { prefix, num, digits } = parseCode(savedLastCode);
    const nextCode = buildCode(prefix, num + 1, digits);
    setCodigoInicioInput(nextCode);
  }, [savedLastCode]);

  async function handleGenerate() {
    setGenerating(true);
    setProgress("Iniciando...");
    setAddPrompt(null);
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
        const folder = zip.folder("Lote_1")!;
        setProgress("Generando...");
        for (let i = 0; i < imgsPerLote; i++) {
          const code = buildCode(prefix, currentNum, digits);
          if (i === 0) codigoInicio = code;
          codigoFin = code;
          totalImgs++;
          await renderBarcodeToCanvas(hiddenCanvas, code, config);
          const dataUrl = hiddenCanvas.toDataURL("image/png");
          const base64 = dataUrl.split(",")[1];
          folder.file(`${code}.png`, base64, { base64: true });
          currentNum++;
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

      localStorage.setItem(LAST_CODE_KEY, codigoFin);

      const lotesGenerados = useQuantityMode
        ? Math.ceil(Number.parseInt(cantidadMatriculas, 10) / imgsPerLote)
        : 1;

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
        `✅ ${totalImgs} matrículas generadas (${codigoInicio} → ${codigoFin}).`,
      );

      // Show prompt to add to active order
      if (orders.length > 0) {
        setAddPrompt({
          cantidad: totalImgs,
          selectedOrderId: orders[0].id,
        });
      }
    } catch (err) {
      setProgress(`❌ Error: ${String(err)}`);
    } finally {
      setGenerating(false);
    }
  }

  function handleConfirmAddToPedido() {
    if (!addPrompt) return;
    onAddToPedido(addPrompt.selectedOrderId, addPrompt.cantidad);
    setAddPrompt(null);
  }

  const inputCls =
    "bg-background/40 border border-white/15 rounded-lg px-3 py-1.5 text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50";

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
        Generar Matrículas
      </h2>

      {/* Start code row */}
      <div className="mb-3">
        <span className="text-xs text-muted-foreground block mb-1.5">
          Código de inicio
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={codigoInicioInput}
            onChange={(e) => setCodigoInicioInput(e.target.value)}
            placeholder={config.codigoBase}
            className={`flex-1 ${inputCls}`}
            data-ocid="batch.start_code_input"
          />
          {savedLastCode && (
            <button
              type="button"
              onClick={handleContinuar}
              title={`Continuar desde ${savedLastCode}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all active:scale-95"
              style={{
                background: "oklch(0.828 0.167 87 / 0.15)",
                color: "oklch(0.828 0.167 87)",
                border: "1px solid oklch(0.828 0.167 87 / 0.3)",
              }}
              data-ocid="batch.continue_button"
            >
              <RotateCcw size={12} />
              Continuar
            </button>
          )}
        </div>
        {savedLastCode && (
          <p className="text-[11px] text-muted-foreground/70 mt-1">
            Último código:{" "}
            <span className="font-mono text-foreground/80">
              {savedLastCode}
            </span>
          </p>
        )}
      </div>

      {/* Quantity row */}
      <div className="mb-4 grid grid-cols-2 gap-3">
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
            className={inputCls.replace("font-mono", "")}
            data-ocid="batch.quantity_input"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Matrículas por lote
          </span>
          <input
            type="number"
            value={imgsPerLote}
            min={1}
            onChange={(e) => setImgsPerLote(Number(e.target.value))}
            className={inputCls.replace("font-mono", "")}
            data-ocid="batch.input"
          />
        </label>
      </div>

      {/* Sequence preview */}
      {useQuantityMode && computedEndCode && (
        <div
          className="mb-4 flex items-center justify-between rounded-xl px-4 py-3"
          style={{
            background: "oklch(0.18 0.04 240)",
            border: "1px solid oklch(0.828 0.167 87 / 0.3)",
          }}
        >
          <div>
            <span className="text-xs text-muted-foreground block mb-0.5">
              Secuencia
            </span>
            <span
              className="text-sm font-mono font-semibold"
              style={{ color: "oklch(0.828 0.167 87)" }}
            >
              {effectiveStartCode} → {computedEndCode}
            </span>
          </div>
          <span
            className="text-2xl font-bold"
            style={{ color: "oklch(0.828 0.167 87)" }}
          >
            {cantidadMatriculas}
          </span>
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
              : `Generar ${imgsPerLote} matrículas`}
          </>
        )}
      </button>

      {/* Add to pedido prompt */}
      {addPrompt && orders.length > 0 && (
        <div
          className="mt-4 rounded-xl p-4"
          style={{
            background: "oklch(0.828 0.167 87 / 0.08)",
            border: "1px solid oklch(0.828 0.167 87 / 0.25)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} style={{ color: "oklch(0.828 0.167 87)" }} />
            <span
              className="text-xs font-semibold"
              style={{ color: "oklch(0.828 0.167 87)" }}
            >
              ¿Añadir {addPrompt.cantidad} matrículas a un pedido activo?
            </span>
          </div>
          <div className="flex gap-2">
            <select
              value={addPrompt.selectedOrderId}
              onChange={(e) =>
                setAddPrompt((p) =>
                  p ? { ...p, selectedOrderId: e.target.value } : null,
                )
              }
              className="flex-1 bg-background/60 border border-white/15 rounded-lg px-3 py-1.5 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {orders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre} ({o.hecho}/{o.total})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleConfirmAddToPedido}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
              style={{
                background: "oklch(0.828 0.167 87)",
                color: "oklch(0.138 0.032 243)",
              }}
            >
              Añadir
            </button>
            <button
              type="button"
              onClick={() => setAddPrompt(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
