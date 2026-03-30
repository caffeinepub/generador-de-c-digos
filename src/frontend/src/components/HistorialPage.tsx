import { FileDown, Trash2 } from "lucide-react";
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

function downloadBarcodePdf(entry: HistorialEntry) {
  const { prefix, num: startNum, digits } = parseCode(entry.codigoInicio);
  const count = entry.totalImagenes;

  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    codes.push(buildCode(prefix, startNum + i, digits));
  }

  const barcodeItems = codes
    .map(
      (code) => `
    <div class="barcode-item">
      <svg class="barcode" data-code="${code}"></svg>
      <p class="code-label">${code}</p>
    </div>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Códigos de Barras - ${entry.codigoInicio}</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    .meta { font-size: 11px; color: #666; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .barcode-item { border: 1px solid #ddd; border-radius: 6px; padding: 12px; text-align: center; page-break-inside: avoid; }
    .barcode-item svg { width: 100%; height: auto; }
    .code-label { font-family: monospace; font-size: 11px; margin-top: 6px; color: #333; }
    @media print { body { padding: 8px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>Códigos de Barras — ${entry.fecha}</h1>
  <p class="meta">Operario: ${entry.operario ?? "—"} | Desde: ${entry.codigoInicio} | Hasta: ${entry.codigoFin} | Total: ${count} imágenes</p>
  <div class="grid">${barcodeItems}</div>
  <script>
    document.querySelectorAll('.barcode').forEach(function(el) {
      JsBarcode(el, el.getAttribute('data-code'), {
        format: 'CODE128',
        displayValue: false,
        margin: 4,
        width: 1.5,
        height: 50
      });
    });
    setTimeout(function() { window.print(); }, 500);
  <\/script>
</body>
</html>`;

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
  const totalImagens = historial.reduce((sum, e) => sum + e.totalImagenes, 0);

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
                {historial.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                    data-ocid={`historial.row.item.${i + 1}`}
                  >
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
                        <button
                          type="button"
                          onClick={() => downloadBarcodePdf(entry)}
                          className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all opacity-70 group-hover:opacity-100"
                          style={{
                            background: "oklch(0.828 0.167 87 / 0.12)",
                            color: "oklch(0.828 0.167 87)",
                          }}
                          title="Descargar PDF con códigos de barras"
                          data-ocid={`historial.secondary_button.${i + 1}`}
                        >
                          <FileDown size={12} />
                          PDF Códigos
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(entry.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
                          title="Eliminar registro"
                          data-ocid={`historial.delete_button.${i + 1}`}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
