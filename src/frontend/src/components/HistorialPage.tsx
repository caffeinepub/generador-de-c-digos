import { FileDown, Settings2, Trash2 } from "lucide-react";
import { Fragment, useState } from "react";
import type { HistorialEntry } from "./PrintHistory";

interface HistorialPageProps {
  historial: HistorialEntry[];
  onDelete: (id: string) => void;
  onClear: () => void;
}

function parseCode(code: string): {
  prefix: string;
  num: number;
  digits: number;
} {
  const match = code.match(/^(.*?)(\d+)$/);
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

function generatePdfHtml(title: string, meta: string, codes: string[]): string {
  const barcodeItems = codes
    .map(
      (code) =>
        `<div class="barcode-item"><svg class="barcode" data-code="${code}"></svg><p class="code-label">${code}</p></div>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #666; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .barcode-item { border: 1px solid #ddd; border-radius: 6px; padding: 12px; text-align: center; page-break-inside: avoid; }
    .barcode-item svg { width: 100%; height: auto; }
    .code-label { font-family: monospace; font-size: 11px; margin-top: 6px; color: #333; }
    @media print { body { padding: 8px; } }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">${meta}</p>
  <div class="grid">${barcodeItems}</div>
  <script>
    document.querySelectorAll('.barcode').forEach(function(el) {
      JsBarcode(el, el.getAttribute('data-code'), {
        format: 'CODE128', displayValue: false, margin: 4, width: 1.5, height: 50
      });
    });
    setTimeout(function() { window.print(); }, 500);
  <\/script>
</body>
</html>`;
}

function downloadBarcodePdf(
  entry: HistorialEntry,
  customStart?: string,
  customEnd?: string,
) {
  const startCode = customStart?.trim() || entry.codigoInicio;
  const endCode = customEnd?.trim() || entry.codigoFin;
  const { prefix, num: startNum, digits } = parseCode(startCode);
  const { num: endNum } = parseCode(endCode);
  const useCustomRange = Boolean(customStart || customEnd);
  const count = useCustomRange ? endNum - startNum + 1 : entry.totalImagenes;

  if (count <= 0) {
    alert("El código de fin debe ser mayor que el de inicio.");
    return;
  }

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(buildCode(prefix, startNum + i, digits));
  }

  const meta = `Operario: ${entry.operario ?? "—"} | Desde: ${startCode} | Hasta: ${buildCode(prefix, startNum + count - 1, digits)} | Total: ${count} códigos`;
  const html = generatePdfHtml(
    `Códigos de Barras — ${entry.fecha}`,
    meta,
    codes,
  );
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function downloadSelectedPdf(
  selectedEntries: { entry: HistorialEntry; num: number }[],
) {
  const allCodes: string[] = [];
  for (const { entry } of selectedEntries) {
    const { prefix, num: startNum, digits } = parseCode(entry.codigoInicio);
    for (let i = 0; i < entry.totalImagenes; i++) {
      allCodes.push(buildCode(prefix, startNum + i, digits));
    }
  }
  const labels = selectedEntries
    .map(
      ({ num, entry }) => `#${num} (${entry.codigoInicio}–${entry.codigoFin})`,
    )
    .join(", ");
  const meta = `Selección: ${labels} | Total: ${allCodes.length} códigos`;
  const html = generatePdfHtml(
    "Códigos de Barras — Selección múltiple",
    meta,
    allCodes,
  );
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export default function HistorialPage({
  historial,
  onDelete,
  onClear,
}: HistorialPageProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customRanges, setCustomRanges] = useState<
    Record<string, { start: string; end: string }>
  >({});

  const totalImagens = historial.reduce((sum, e) => sum + e.totalImagenes, 0);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === historial.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(historial.map((e) => e.id)));
    }
  }

  function toggleExpanded(id: string, entry: HistorialEntry) {
    setExpandedId((prev) => (prev === id ? null : id));
    if (!customRanges[id]) {
      setCustomRanges((prev) => ({
        ...prev,
        [id]: { start: entry.codigoInicio, end: entry.codigoFin },
      }));
    }
  }

  const selectedEntries = historial
    .map((e, i) => ({ entry: e, num: i + 1 }))
    .filter(({ entry }) => selected.has(entry.id));

  const inputCls =
    "bg-background/40 border border-white/10 rounded-lg px-2 py-1 text-foreground text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50";

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header card */}
      <div
        className="rounded-2xl p-6"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2
              className="text-lg font-bold tracking-tight"
              style={{ color: "oklch(0.942 0.012 236)" }}
            >
              Historial Completo de Impresiones
            </h2>
            {historial.length > 0 ? (
              <p className="text-xs text-muted-foreground mt-1">
                <span
                  className="font-semibold"
                  style={{ color: "oklch(0.828 0.167 87)" }}
                >
                  {historial.length}
                </span>{" "}
                {historial.length === 1 ? "registro" : "registros"} —{" "}
                <span
                  className="font-semibold"
                  style={{ color: "oklch(0.828 0.167 87)" }}
                >
                  {totalImagens.toLocaleString("es")}
                </span>{" "}
                imágenes totales
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Sin registros aún
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => downloadSelectedPdf(selectedEntries)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shrink-0"
                style={{
                  background: "oklch(0.828 0.167 87)",
                  color: "oklch(0.138 0.032 243)",
                }}
                data-ocid="historial.download_selected_button"
              >
                <FileDown size={13} />
                Descargar {selected.size} seleccionado
                {selected.size > 1 ? "s" : ""}
              </button>
            )}
            {historial.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shrink-0"
                style={{
                  background: "oklch(0.577 0.245 27.325 / 0.2)",
                  color: "oklch(0.8 0.15 27)",
                  border: "1px solid oklch(0.577 0.245 27.325 / 0.3)",
                }}
                data-ocid="historial.delete_button"
              >
                <Trash2 size={13} />
                Borrar Todo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div
        className="rounded-2xl p-5"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {historial.length === 0 ? (
          <div
            className="py-16 flex flex-col items-center gap-3 text-muted-foreground"
            data-ocid="historial.empty_state"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "oklch(0.295 0.052 240)" }}
            >
              <FileDown size={22} style={{ color: "oklch(0.652 0.048 236)" }} />
            </div>
            <p className="text-sm font-medium">No hay registros todavía.</p>
            <p className="text-xs opacity-60">
              Los registros aparecerán aquí tras generar lotes o registrar
              impresiones manualmente.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs" data-ocid="historial.table">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-2.5 px-2 w-8">
                    <input
                      type="checkbox"
                      checked={
                        historial.length > 0 &&
                        selected.size === historial.length
                      }
                      onChange={toggleAll}
                      className="rounded"
                      title="Seleccionar todos"
                    />
                  </th>
                  <th className="text-center py-2.5 px-2 text-muted-foreground font-medium w-8">
                    #
                  </th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">
                    Fecha
                  </th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">
                    Hora
                  </th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">
                    Operario
                  </th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">
                    Cód. Inicio
                  </th>
                  <th className="text-left py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">
                    Cód. Fin
                  </th>
                  <th className="text-center py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">
                    Lotes
                  </th>
                  <th className="text-center py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">
                    Total Imgs
                  </th>
                  <th className="text-right py-2.5 px-3 text-muted-foreground font-medium whitespace-nowrap">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {historial.map((entry, i) => {
                  const rowNum = i + 1;
                  const isSelected = selected.has(entry.id);
                  const isExpanded = expandedId === entry.id;
                  const range = customRanges[entry.id] ?? {
                    start: entry.codigoInicio,
                    end: entry.codigoFin,
                  };

                  return (
                    <Fragment key={entry.id}>
                      <tr
                        className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                        style={
                          isSelected
                            ? { background: "oklch(0.828 0.167 87 / 0.06)" }
                            : {}
                        }
                        data-ocid={`historial.row.item.${rowNum}`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(entry.id)}
                            className="rounded"
                          />
                        </td>

                        {/* Row number badge */}
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0"
                            style={{
                              background: isSelected
                                ? "oklch(0.828 0.167 87)"
                                : "oklch(0.295 0.052 240)",
                              color: isSelected
                                ? "oklch(0.138 0.032 243)"
                                : "oklch(0.652 0.048 236)",
                            }}
                          >
                            {rowNum}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-foreground whitespace-nowrap">
                          {entry.fecha}
                        </td>
                        <td className="py-2.5 px-3 text-foreground whitespace-nowrap">
                          {entry.hora ?? "—"}
                        </td>
                        <td className="py-2.5 px-3 text-foreground">
                          {entry.operario ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{
                                background: "oklch(0.828 0.167 87 / 0.12)",
                                color: "oklch(0.828 0.167 87)",
                              }}
                            >
                              {entry.operario}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td
                          className="py-2.5 px-3 font-mono whitespace-nowrap"
                          style={{ color: "oklch(0.828 0.167 87)" }}
                        >
                          {entry.codigoInicio}
                        </td>
                        <td
                          className="py-2.5 px-3 font-mono whitespace-nowrap"
                          style={{ color: "oklch(0.828 0.167 87)" }}
                        >
                          {entry.codigoFin}
                        </td>
                        <td className="py-2.5 px-3 text-center text-foreground">
                          {entry.lotes}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{
                              background: "oklch(0.696 0.17 162.48 / 0.15)",
                              color: "oklch(0.696 0.17 162.48)",
                            }}
                          >
                            {entry.totalImagenes}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Full PDF download */}
                            <button
                              type="button"
                              onClick={() => downloadBarcodePdf(entry)}
                              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all opacity-70 group-hover:opacity-100"
                              style={{
                                background: "oklch(0.828 0.167 87 / 0.12)",
                                color: "oklch(0.828 0.167 87)",
                              }}
                              title="Descargar PDF completo"
                              data-ocid={`historial.secondary_button.${rowNum}`}
                            >
                              <FileDown size={12} />
                              PDF
                            </button>

                            {/* Custom range toggle */}
                            <button
                              type="button"
                              onClick={() => toggleExpanded(entry.id, entry)}
                              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-medium transition-all opacity-70 group-hover:opacity-100"
                              style={{
                                background: isExpanded
                                  ? "oklch(0.652 0.048 236 / 0.25)"
                                  : "oklch(0.652 0.048 236 / 0.1)",
                                color: isExpanded
                                  ? "oklch(0.828 0.12 220)"
                                  : "oklch(0.652 0.048 236)",
                              }}
                              title="Personalizar rango de descarga"
                              data-ocid={`historial.range_button.${rowNum}`}
                            >
                              <Settings2 size={12} />
                              Rango
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => onDelete(entry.id)}
                              className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                              title="Eliminar registro"
                              data-ocid={`historial.delete_button.${rowNum}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable custom range row */}
                      {isExpanded && (
                        <tr className="border-b border-white/5">
                          <td colSpan={10} className="px-4 pb-3 pt-1">
                            <div
                              className="rounded-xl p-3 flex flex-wrap items-end gap-3"
                              style={{
                                background: "oklch(0.175 0.038 241 / 0.8)",
                                border:
                                  "1px solid oklch(0.652 0.048 236 / 0.2)",
                              }}
                            >
                              <span
                                className="text-[11px] font-semibold self-center"
                                style={{ color: "oklch(0.652 0.048 236)" }}
                              >
                                Rango personalizado para #{rowNum}:
                              </span>

                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground">
                                  Código inicio
                                </span>
                                <input
                                  type="text"
                                  value={range.start}
                                  onChange={(e) =>
                                    setCustomRanges((prev) => ({
                                      ...prev,
                                      [entry.id]: {
                                        ...range,
                                        start: e.target.value,
                                      },
                                    }))
                                  }
                                  className={inputCls}
                                  style={{ width: "148px" }}
                                  placeholder={entry.codigoInicio}
                                />
                              </label>

                              <label className="flex flex-col gap-1">
                                <span className="text-[10px] text-muted-foreground">
                                  Código fin
                                </span>
                                <input
                                  type="text"
                                  value={range.end}
                                  onChange={(e) =>
                                    setCustomRanges((prev) => ({
                                      ...prev,
                                      [entry.id]: {
                                        ...range,
                                        end: e.target.value,
                                      },
                                    }))
                                  }
                                  className={inputCls}
                                  style={{ width: "148px" }}
                                  placeholder={entry.codigoFin}
                                />
                              </label>

                              <button
                                type="button"
                                onClick={() =>
                                  downloadBarcodePdf(
                                    entry,
                                    range.start,
                                    range.end,
                                  )
                                }
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                                style={{
                                  background: "oklch(0.828 0.167 87)",
                                  color: "oklch(0.138 0.032 243)",
                                }}
                                data-ocid={`historial.range_download_button.${rowNum}`}
                              >
                                <FileDown size={12} />
                                Descargar PDF
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
