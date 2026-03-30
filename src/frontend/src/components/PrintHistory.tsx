import { Download, Trash2 } from "lucide-react";

export interface HistorialEntry {
  id: string;
  fecha: string;
  hora?: string;
  operario?: string;
  tipo?: "con-codigo" | "sin-codigo";
  nombre?: string;
  codigoInicio: string;
  codigoFin: string;
  lotes: number;
  totalImagenes: number;
}

interface PrintHistoryProps {
  historial: HistorialEntry[];
  onDelete: (id: string) => void;
  onClear: () => void;
  showPdfButton?: boolean;
}

function downloadAsPdf(historial: HistorialEntry[]) {
  const rows = historial
    .map((e) => {
      const sinCodigo = e.tipo === "sin-codigo";
      const tipoLabel = sinCodigo
        ? e.nombre
          ? `Placa sin código — ${e.nombre}`
          : "Placa sin código"
        : "Con código";
      return `
      <tr>
        <td>${e.fecha}</td>
        <td>${e.hora ?? "—"}</td>
        <td>${e.operario ?? "—"}</td>
        <td>${sinCodigo ? "<em style='color:#888'>Sin código</em>" : e.codigoInicio}</td>
        <td>${sinCodigo ? "<em style='color:#888'>Sin código</em>" : e.codigoFin}</td>
        <td>${sinCodigo ? "—" : e.lotes}</td>
        <td>${e.totalImagenes}</td>
        <td>${tipoLabel}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Historial de Impresión</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p.subtitle { font-size: 11px; color: #666; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f0f0f0; text-align: left; padding: 8px 10px; border-bottom: 2px solid #ccc; font-weight: 600; }
    td { padding: 7px 10px; border-bottom: 1px solid #e0e0e0; }
    tr:last-child td { border-bottom: none; }
    tr:nth-child(even) td { background: #fafafa; }
    @media print {
      body { padding: 16px; }
      button { display: none; }
    }
  </style>
</head>
<body>
  <h1>Historial de Impresión</h1>
  <p class="subtitle">Generado el ${new Date().toLocaleString("es")}</p>
  <table>
    <thead>
      <tr>
        <th>Fecha</th>
        <th>Hora</th>
        <th>Operario</th>
        <th>Cód. Inicio</th>
        <th>Cód. Fin</th>
        <th>Lotes</th>
        <th>Total</th>
        <th>Tipo</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

export default function PrintHistory({
  historial,
  onDelete,
  onClear,
  showPdfButton = false,
}: PrintHistoryProps) {
  return (
    <div
      className="rounded-2xl p-5 shadow-card"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Historial de Impresión
        </h2>
        <div className="flex items-center gap-2">
          {showPdfButton && historial.length > 0 && (
            <button
              type="button"
              onClick={() => downloadAsPdf(historial)}
              className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg font-medium transition-colors"
              style={{
                background: "oklch(0.828 0.167 87 / 0.15)",
                color: "oklch(0.828 0.167 87)",
              }}
              data-ocid="history.pdf_button"
            >
              <Download size={12} />
              Descargar PDF
            </button>
          )}
          {historial.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs px-3 py-1 rounded-lg font-medium transition-colors"
              style={{
                background: "oklch(0.577 0.245 27.325 / 0.2)",
                color: "oklch(0.8 0.15 27)",
              }}
              data-ocid="history.delete_button"
            >
              Borrar Historial
            </button>
          )}
        </div>
      </div>

      {historial.length === 0 ? (
        <div
          className="text-center py-8 text-muted-foreground text-xs"
          data-ocid="history.empty_state"
        >
          No hay registros todavía. Genera un ZIP para ver el historial.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-ocid="history.table">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Fecha
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Hora
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Operario
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Tipo / Nombre
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Cód. Inicio
                </th>
                <th className="text-left py-2 px-2 text-muted-foreground font-medium">
                  Cód. Fin
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  Lotes
                </th>
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  Total
                </th>
                <th className="py-2 px-2" />
              </tr>
            </thead>
            <tbody>
              {historial.map((entry, i) => {
                const sinCodigo = entry.tipo === "sin-codigo";
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    data-ocid={`history.row.item.${i + 1}`}
                  >
                    <td className="py-2 px-2 text-foreground">{entry.fecha}</td>
                    <td className="py-2 px-2 text-foreground">
                      {entry.hora ?? "—"}
                    </td>
                    <td className="py-2 px-2 text-foreground">
                      {entry.operario ?? "—"}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex flex-col gap-0.5">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium w-fit"
                          style={{
                            background: sinCodigo
                              ? "oklch(0.577 0.245 27.325 / 0.15)"
                              : "oklch(0.696 0.17 162.48 / 0.15)",
                            color: sinCodigo
                              ? "oklch(0.8 0.15 27)"
                              : "oklch(0.696 0.17 162.48)",
                          }}
                        >
                          {sinCodigo ? "Sin código" : "Con código"}
                        </span>
                        {sinCodigo && entry.nombre && (
                          <span
                            className="text-[10px] font-medium"
                            style={{ color: "oklch(0.75 0.05 240)" }}
                          >
                            {entry.nombre}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 font-mono text-primary">
                      {sinCodigo ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        entry.codigoInicio
                      )}
                    </td>
                    <td className="py-2 px-2 font-mono text-primary">
                      {sinCodigo ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        entry.codigoFin
                      )}
                    </td>
                    <td className="py-2 px-2 text-center text-foreground">
                      {sinCodigo ? "—" : entry.lotes}
                    </td>
                    <td className="py-2 px-2 text-center text-foreground">
                      {entry.totalImagenes}
                    </td>
                    <td className="py-2 px-2">
                      <button
                        type="button"
                        onClick={() => onDelete(entry.id)}
                        className="p-1 rounded hover:text-destructive transition-colors text-muted-foreground"
                        data-ocid={`history.delete_button.${i + 1}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
