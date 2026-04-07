import { CheckCircle2, PackageCheck, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export interface PedidoEnviado {
  id: string;
  fecha: string;
  hora: string;
  nombre: string;
  cantidad: number;
  tipo: "matriculas" | "placas" | "advertencia";
  notas?: string;
}

interface PedidosEnviadosPageProps {
  pedidosEnviados: PedidoEnviado[];
  onAdd: (p: PedidoEnviado) => void;
  onDelete: (id: string) => void;
}

const TIPO_LABELS: Record<PedidoEnviado["tipo"], string> = {
  matriculas: "Matrículas",
  placas: "Placas CE",
  advertencia: "Advertencia",
};

const TIPO_COLORS: Record<PedidoEnviado["tipo"], string> = {
  matriculas: "oklch(0.828 0.167 87)",
  placas: "oklch(0.696 0.17 162.48)",
  advertencia: "oklch(0.8 0.12 270)",
};

const TIPO_BG: Record<PedidoEnviado["tipo"], string> = {
  matriculas: "oklch(0.828 0.167 87 / 0.12)",
  placas: "oklch(0.696 0.17 162.48 / 0.12)",
  advertencia: "oklch(0.8 0.12 270 / 0.12)",
};

const cardBg =
  "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))";
const cardBorder = "1px solid rgba(255,255,255,0.08)";

function todayStr() {
  return new Date().toLocaleDateString("es-ES");
}
function nowTime() {
  return new Date().toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PedidosEnviadosPage({
  pedidosEnviados,
  onAdd,
  onDelete,
}: PedidosEnviadosPageProps) {
  const [showForm, setShowForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [cantidad, setCantidad] = useState<number>(0);
  const [tipo, setTipo] = useState<PedidoEnviado["tipo"]>("matriculas");
  const [notas, setNotas] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || cantidad <= 0) return;
    onAdd({
      id: Date.now().toString(),
      fecha: todayStr(),
      hora: nowTime(),
      nombre: nombre.trim(),
      cantidad,
      tipo,
      notas: notas.trim() || undefined,
    });
    setNombre("");
    setCantidad(0);
    setTipo("matriculas");
    setNotas("");
    setShowForm(false);
  }

  const totalEnviadas = pedidosEnviados.reduce((sum, p) => sum + p.cantidad, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Page Header */}
      <div
        className="rounded-2xl px-6 py-5 flex items-center justify-between"
        style={{ background: cardBg, border: cardBorder }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "oklch(0.696 0.17 162.48 / 0.15)",
              border: "1px solid oklch(0.696 0.17 162.48 / 0.35)",
            }}
          >
            <PackageCheck
              size={20}
              style={{ color: "oklch(0.696 0.17 162.48)" }}
            />
          </div>
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "oklch(0.942 0.012 236)" }}
            >
              Pedidos Enviados
            </h2>
            <p className="text-xs text-muted-foreground">
              Registro de pedidos completados y enviados al cliente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pedidosEnviados.length > 0 && (
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: "oklch(0.696 0.17 162.48 / 0.12)",
                color: "oklch(0.696 0.17 162.48)",
                border: "1px solid oklch(0.696 0.17 162.48 / 0.25)",
              }}
            >
              {pedidosEnviados.length} enviados ·{" "}
              {totalEnviadas.toLocaleString("es")} uds
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
            style={{
              background: "oklch(0.696 0.17 162.48)",
              color: "oklch(0.138 0.032 243)",
            }}
            data-ocid="pedidos-enviados.add_button"
          >
            <Plus size={13} />
            Añadir enviado
          </button>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div
          className="rounded-2xl p-6"
          style={{ background: cardBg, border: cardBorder }}
        >
          <h3
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "oklch(0.696 0.17 162.48)" }}
          >
            Nuevo Pedido Enviado
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Nombre / Descripción *
                </span>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                  placeholder="Ej: Pedido Cliente ABC"
                  className="bg-background/40 border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ color: "#000", background: "#fff" }}
                  data-ocid="pedidos-enviados.form.nombre"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Cantidad *
                </span>
                <input
                  type="number"
                  value={cantidad || ""}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  required
                  min={1}
                  placeholder="0"
                  className="bg-background/40 border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ color: "#000", background: "#fff" }}
                  data-ocid="pedidos-enviados.form.cantidad"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Tipo *</span>
                <select
                  value={tipo}
                  onChange={(e) =>
                    setTipo(e.target.value as PedidoEnviado["tipo"])
                  }
                  className="bg-background/40 border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ color: "#000", background: "#fff" }}
                  data-ocid="pedidos-enviados.form.tipo"
                >
                  <option value="matriculas">Matrículas</option>
                  <option value="placas">Placas CE</option>
                  <option value="advertencia">Advertencia</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">
                  Notas (opcional)
                </span>
                <input
                  type="text"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej: Enviado por mensajería"
                  className="bg-background/40 border border-white/15 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ color: "#000", background: "#fff" }}
                  data-ocid="pedidos-enviados.form.notas"
                />
              </label>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
                style={{
                  background: "oklch(0.696 0.17 162.48)",
                  color: "oklch(0.138 0.032 243)",
                }}
                data-ocid="pedidos-enviados.form.submit"
              >
                Guardar pedido enviado
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium transition-all hover:opacity-80"
                style={{
                  background: "oklch(0.295 0.052 240)",
                  color: "oklch(0.72 0.038 236)",
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: cardBg, border: cardBorder }}
      >
        <div
          className="px-6 py-3 flex items-center justify-between border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Historial de enviados
          </h3>
          {pedidosEnviados.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {pedidosEnviados.length} registro
              {pedidosEnviados.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {pedidosEnviados.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            data-ocid="pedidos-enviados.empty_state"
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "oklch(0.696 0.17 162.48 / 0.1)" }}
            >
              <PackageCheck
                size={28}
                style={{ color: "oklch(0.696 0.17 162.48 / 0.5)" }}
              />
            </div>
            <p
              className="text-sm font-medium"
              style={{ color: "oklch(0.72 0.038 236)" }}
            >
              No hay pedidos enviados todavía
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Usa el botón "Añadir enviado" o pídele al chat que añada uno
              cuando completes un pedido.
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="mt-1 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
              style={{
                background: "oklch(0.696 0.17 162.48)",
                color: "oklch(0.138 0.032 243)",
              }}
            >
              Añadir primero enviado
            </button>
          </div>
        ) : (
          <div
            className="divide-y"
            style={{ borderColor: "rgba(255,255,255,0.05)" }}
          >
            {pedidosEnviados.map((p) => (
              <div
                key={p.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                data-ocid="pedidos-enviados.row"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: TIPO_BG[p.tipo],
                    border: `1px solid ${TIPO_COLORS[p.tipo]}40`,
                  }}
                >
                  <CheckCircle2
                    size={16}
                    style={{ color: TIPO_COLORS[p.tipo] }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-sm font-medium truncate"
                      style={{ color: "oklch(0.92 0.012 236)" }}
                    >
                      {p.nombre}
                    </span>
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        background: TIPO_BG[p.tipo],
                        color: TIPO_COLORS[p.tipo],
                      }}
                    >
                      {TIPO_LABELS[p.tipo]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {p.fecha} · {p.hora}
                    </span>
                    {p.notas && (
                      <span className="text-xs text-muted-foreground truncate max-w-xs">
                        📝 {p.notas}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right mr-3">
                  <div
                    className="text-base font-bold tabular-nums"
                    style={{ color: TIPO_COLORS[p.tipo] }}
                  >
                    {p.cantidad.toLocaleString("es")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    unidades
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(p.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80 shrink-0"
                  style={{
                    background: "oklch(0.577 0.245 27.325 / 0.1)",
                    color: "oklch(0.7 0.15 27)",
                  }}
                  title="Eliminar"
                  aria-label={`Eliminar pedido enviado ${p.nombre}`}
                  data-ocid="pedidos-enviados.delete_button"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
