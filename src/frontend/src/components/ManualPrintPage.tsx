import { PlusCircle, Printer } from "lucide-react";
import { useState } from "react";
import type { HistorialEntry } from "./PrintHistory";
import PrintHistory from "./PrintHistory";

interface ManualPrintPageProps {
  historial: HistorialEntry[];
  onManualAdd: (entry: HistorialEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function nowTimeStr() {
  const now = new Date();
  return now.toTimeString().slice(0, 5);
}

type TipoMatricula = "con-codigo" | "sin-codigo";

export default function ManualPrintPage({
  historial,
  onManualAdd,
  onDelete,
  onClear,
}: ManualPrintPageProps) {
  const [tipo, setTipo] = useState<TipoMatricula>("con-codigo");
  const [fecha, setFecha] = useState(todayStr());
  const [hora, setHora] = useState(nowTimeStr());
  const [operario, setOperario] = useState("");
  const [codigoInicio, setCodigoInicio] = useState("");
  const [codigoFin, setCodigoFin] = useState("");
  const [lotes, setLotes] = useState("");
  const [totalImagenes, setTotalImagenes] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [nombre, setNombre] = useState("");
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    let entry: HistorialEntry;

    if (tipo === "sin-codigo") {
      if (!cantidad) return;
      entry = {
        id: Date.now().toString(),
        fecha,
        hora,
        operario: operario.trim() || undefined,
        tipo: "sin-codigo",
        nombre: nombre.trim() || undefined,
        codigoInicio: "",
        codigoFin: "",
        lotes: 0,
        totalImagenes: Number(cantidad),
      };
    } else {
      if (!codigoInicio || !codigoFin || !lotes || !totalImagenes) return;
      entry = {
        id: Date.now().toString(),
        fecha,
        hora,
        operario: operario.trim() || undefined,
        tipo: "con-codigo",
        codigoInicio,
        codigoFin,
        lotes: Number(lotes),
        totalImagenes: Number(totalImagenes),
      };
    }

    onManualAdd(entry);
    setCodigoInicio("");
    setCodigoFin("");
    setLotes("");
    setTotalImagenes("");
    setCantidad("");
    setNombre("");
    setFecha(todayStr());
    setHora(nowTimeStr());
    setOperario("");
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  }

  const inputCls =
    "bg-background/40 border border-white/10 rounded-lg px-3 py-2 text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary w-full placeholder:text-muted-foreground/50 transition-colors";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Form card */}
      <div
        className="rounded-2xl p-6 shadow-card"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-5">
          Registrar Impresión Manual
        </h2>

        {/* Tipo selector */}
        <div className="mb-5">
          <span className="text-xs text-muted-foreground block mb-2">
            Tipo de matrícula / placa
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTipo("con-codigo")}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border"
              style={{
                background:
                  tipo === "con-codigo"
                    ? "oklch(0.828 0.167 87)"
                    : "oklch(0.175 0.038 241)",
                color:
                  tipo === "con-codigo"
                    ? "oklch(0.138 0.032 243)"
                    : "oklch(0.652 0.048 236)",
                borderColor:
                  tipo === "con-codigo"
                    ? "oklch(0.828 0.167 87)"
                    : "rgba(255,255,255,0.1)",
              }}
              data-ocid="manual_print.tipo_con_codigo"
            >
              🔲 Con código de barras
            </button>
            <button
              type="button"
              onClick={() => setTipo("sin-codigo")}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all border"
              style={{
                background:
                  tipo === "sin-codigo"
                    ? "oklch(0.696 0.17 162.48)"
                    : "oklch(0.175 0.038 241)",
                color:
                  tipo === "sin-codigo"
                    ? "oklch(0.138 0.032 243)"
                    : "oklch(0.652 0.048 236)",
                borderColor:
                  tipo === "sin-codigo"
                    ? "oklch(0.696 0.17 162.48)"
                    : "rgba(255,255,255,0.1)",
              }}
              data-ocid="manual_print.tipo_sin_codigo"
            >
              📋 Sin código / Placa
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} data-ocid="manual_print.modal">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Fecha</span>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={inputCls}
                required
                data-ocid="manual_print.input"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Hora</span>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={inputCls}
                required
                data-ocid="manual_print.input"
              />
            </label>

            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-xs text-muted-foreground">Operario</span>
              <input
                type="text"
                value={operario}
                onChange={(e) => setOperario(e.target.value)}
                placeholder="Nombre del operario"
                className={inputCls}
                data-ocid="manual_print.input"
              />
            </label>

            {tipo === "con-codigo" ? (
              <>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Código Inicio
                  </span>
                  <input
                    type="text"
                    value={codigoInicio}
                    onChange={(e) => setCodigoInicio(e.target.value)}
                    placeholder="TAS000001000"
                    className={inputCls}
                    required
                    data-ocid="manual_print.input"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Código Fin
                  </span>
                  <input
                    type="text"
                    value={codigoFin}
                    onChange={(e) => setCodigoFin(e.target.value)}
                    placeholder="TAS000002000"
                    className={inputCls}
                    required
                    data-ocid="manual_print.input"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Lotes</span>
                  <input
                    type="number"
                    min={1}
                    value={lotes}
                    onChange={(e) => setLotes(e.target.value)}
                    placeholder="1"
                    className={inputCls}
                    required
                    data-ocid="manual_print.input"
                  />
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">
                    Total Imágenes
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={totalImagenes}
                    onChange={(e) => setTotalImagenes(e.target.value)}
                    placeholder="100"
                    className={inputCls}
                    required
                    data-ocid="manual_print.input"
                  />
                </label>
              </>
            ) : (
              <>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs text-muted-foreground">
                    Nombre / Proveedor
                  </span>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Proveedor ABC, Placa CE tipo 2…"
                    className={inputCls}
                    data-ocid="manual_print.nombre_input"
                  />
                  <span className="text-[11px] text-muted-foreground/60">
                    Opcional. Identifica el proveedor o tipo de placa.
                  </span>
                </label>

                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-xs text-muted-foreground">
                    Cantidad de placas realizadas
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Ej: 150"
                    className={inputCls}
                    required
                    data-ocid="manual_print.input"
                  />
                  <span className="text-[11px] text-muted-foreground/60">
                    Estas placas no tienen código de barras. En el PDF solo
                    aparecerá la cantidad.
                  </span>
                </label>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{
                background: "oklch(0.828 0.167 87)",
                color: "oklch(0.138 0.032 243)",
              }}
              data-ocid="manual_print.submit_button"
            >
              <PlusCircle size={15} />
              Registrar Impresión
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{
                background: "oklch(0.828 0.167 87 / 0.15)",
                color: "oklch(0.828 0.167 87)",
                border: "1px solid oklch(0.828 0.167 87 / 0.3)",
              }}
              data-ocid="manual_print.secondary_button"
            >
              <Printer size={15} />
              Imprimir
            </button>

            {success && (
              <span
                className="text-xs font-medium px-3 py-1.5 rounded-lg"
                style={{
                  background: "oklch(0.696 0.17 162.48 / 0.15)",
                  color: "oklch(0.696 0.17 162.48)",
                }}
                data-ocid="manual_print.success_state"
              >
                ✓ Impresión registrada
              </span>
            )}
          </div>
        </form>
      </div>

      {/* History table with PDF button */}
      <PrintHistory
        historial={historial}
        onDelete={onDelete}
        onClear={onClear}
        showPdfButton
      />
    </div>
  );
}
