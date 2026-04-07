import { Edit2, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import type { HistorialEntry } from "./PrintHistory";

export interface Order {
  id: string;
  nombre: string;
  total: number;
  hecho: number;
  piezasPorCama?: number;
  tipo?: "matriculas" | "placas" | "advertencia";
  codigoInicio?: string;
  codigoFin?: string;
}

interface OrdersProps {
  orders: Order[];
  piezasPorCama: number;
  onAddCama: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (
    nombre: string,
    total: number,
    tipo: Order["tipo"],
    codigoInicio?: string,
    codigoFin?: string,
  ) => void;
  onUpdateOrder: (id: string, changes: Partial<Order>) => void;
  onHistorialAdd: (entry: HistorialEntry) => void;
}

const TIPO_LABELS: Record<string, string> = {
  matriculas: "Matrículas",
  placas: "Placas CE",
  advertencia: "Advertencia",
};

const TIPO_COLORS: Record<string, { bg: string; text: string }> = {
  matriculas: {
    bg: "oklch(0.696 0.17 162.48 / 0.2)",
    text: "oklch(0.696 0.17 162.48)",
  },
  placas: { bg: "oklch(0.7 0.15 270 / 0.2)", text: "oklch(0.8 0.12 270)" },
  advertencia: {
    bg: "oklch(0.577 0.245 27.325 / 0.2)",
    text: "oklch(0.8 0.15 27)",
  },
};

// Parse a code like "TAS000001000" into prefix + number + digit count
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

// Given an order with codigoInicio, codigoFin, total, hecho and qty per cama,
// compute the code range that this next cama covers.
function getCamaCodeRange(
  order: Order,
  qty: number,
): { codigoInicio: string; codigoFin: string } | null {
  if (!order.codigoInicio || order.tipo !== "matriculas") return null;

  const { prefix, num, digits } = parseCode(order.codigoInicio);
  const camaStart = num + order.hecho;
  const camaEnd = camaStart + qty - 1;
  return {
    codigoInicio: buildCode(prefix, camaStart, digits),
    codigoFin: buildCode(prefix, camaEnd, digits),
  };
}

export default function Orders({
  orders,
  piezasPorCama,
  onAddCama,
  onDelete,
  onAdd,
  onUpdateOrder,
  onHistorialAdd,
}: OrdersProps) {
  const [nombre, setNombre] = useState("");
  const [editingCamaId, setEditingCamaId] = useState<string | null>(null);
  const [editingCamaVal, setEditingCamaVal] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  // Modal state for new order
  const [showModal, setShowModal] = useState(false);
  const [modalTipo, setModalTipo] = useState<Order["tipo"]>("matriculas");
  const [modalTotal, setModalTotal] = useState(1000);
  const [modalCodInicio, setModalCodInicio] = useState("");

  function handleAdd() {
    if (!nombre.trim()) return;
    setShowModal(true);
  }

  function handleModalConfirm() {
    // Auto-calc codigoFin: startCode + total - 1
    let autoCodigoFin: string | undefined = undefined;
    if (modalTipo === "matriculas" && modalCodInicio) {
      const { prefix, num, digits } = parseCode(modalCodInicio);
      autoCodigoFin = buildCode(prefix, num + modalTotal - 1, digits);
    }
    onAdd(
      nombre.trim(),
      modalTotal,
      modalTipo,
      modalCodInicio || undefined,
      autoCodigoFin,
    );
    setNombre("");
    setModalTotal(1000);
    setModalTipo("matriculas");
    setModalCodInicio("");
    setShowModal(false);
  }

  function handleModalCancel() {
    setShowModal(false);
  }

  function startEditCama(order: Order) {
    setEditingCamaId(order.id);
    setEditingCamaVal(String(order.piezasPorCama ?? piezasPorCama));
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  function confirmEditCama(id: string) {
    const val = Number(editingCamaVal);
    if (!Number.isNaN(val) && val > 0) {
      onUpdateOrder(id, { piezasPorCama: val });
    }
    setEditingCamaId(null);
  }

  function handleAddCama(order: Order) {
    const qty = order.piezasPorCama ?? piezasPorCama;
    const now = new Date();
    const fecha = now.toLocaleDateString("es-ES");
    const hora = now.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const tipoEntry =
      order.tipo === "matriculas"
        ? ("con-codigo" as const)
        : ("sin-codigo" as const);

    // Compute code range for this cama (only for matriculas with codes)
    const codeRange = getCamaCodeRange(order, qty);

    const entry: HistorialEntry = {
      id: Date.now().toString(),
      fecha,
      hora,
      tipo: tipoEntry,
      nombre:
        order.tipo !== "matriculas"
          ? `${TIPO_LABELS[order.tipo ?? "matriculas"]} — ${order.nombre}`
          : `${order.nombre}`,
      codigoInicio: codeRange?.codigoInicio ?? order.codigoInicio ?? "",
      codigoFin: codeRange?.codigoFin ?? order.codigoFin ?? "",
      lotes: 1,
      totalImagenes: qty,
    };
    onHistorialAdd(entry);
    onAddCama(order.id);
  }

  const inputCls =
    "bg-background/40 border border-white/15 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60";

  return (
    <>
      {/* Modal crear pedido */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm shadow-xl"
            style={{
              background: "oklch(0.215 0.042 240)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <h3 className="font-semibold text-sm text-foreground mb-4">
              Configurar pedido:{" "}
              <span style={{ color: "oklch(0.828 0.167 87)" }}>{nombre}</span>
            </h3>

            {/* Tipo */}
            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-2">
                ¿Qué tipo de pedido es?
              </p>
              <div className="flex gap-2">
                {(
                  ["matriculas", "placas", "advertencia"] as Order["tipo"][]
                ).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setModalTipo(t)}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background:
                        modalTipo === t
                          ? TIPO_COLORS[t!].bg
                          : "oklch(0.175 0.038 242)",
                      color:
                        modalTipo === t
                          ? TIPO_COLORS[t!].text
                          : "oklch(0.72 0.038 236)",
                      border:
                        modalTipo === t
                          ? `1px solid ${TIPO_COLORS[t!].text}`
                          : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {TIPO_LABELS[t!]}
                  </button>
                ))}
              </div>
            </div>

            {/* Campos solo para matrículas */}
            {modalTipo === "matriculas" && (
              <>
                <div className="mb-3">
                  <label
                    htmlFor="modal-cod-inicio"
                    className="text-xs text-muted-foreground block mb-1"
                  >
                    Código de inicio de la matrícula
                  </label>
                  <input
                    id="modal-cod-inicio"
                    type="text"
                    value={modalCodInicio}
                    onChange={(e) => setModalCodInicio(e.target.value)}
                    placeholder="Ej: TAS000001000"
                    className={`w-full ${inputCls}`}
                  />
                </div>
                {modalCodInicio && (
                  <div
                    className="mb-3 rounded-lg px-3 py-2"
                    style={{
                      background: "oklch(0.175 0.038 242)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <p className="text-[10px] text-muted-foreground mb-0.5">
                      Código de fin calculado automáticamente:
                    </p>
                    <p
                      className="text-sm font-mono font-semibold"
                      style={{ color: "oklch(0.828 0.167 87)" }}
                    >
                      {(() => {
                        const { prefix, num, digits } =
                          parseCode(modalCodInicio);
                        return buildCode(prefix, num + modalTotal - 1, digits);
                      })()}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Cada +1 Cama añade 30 al historial continuando la
                      secuencia.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Total a producir */}
            <div className="mb-5">
              <label
                htmlFor="modal-total"
                className="text-xs text-muted-foreground block mb-1"
              >
                Cantidad total a producir
              </label>
              <input
                id="modal-total"
                type="number"
                value={modalTotal}
                min={1}
                onChange={(e) => setModalTotal(Number(e.target.value))}
                className={`w-full ${inputCls}`}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Total de {TIPO_LABELS[modalTipo!]} a producir en este pedido
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleModalCancel}
                className="flex-1 py-2 rounded-lg text-xs font-semibold text-muted-foreground transition-all"
                style={{
                  background: "oklch(0.175 0.038 242)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleModalConfirm}
                className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: "oklch(0.828 0.167 87)",
                  color: "oklch(0.138 0.032 243)",
                }}
              >
                Crear Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="rounded-2xl p-5 shadow-card"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          Pedidos Activos
        </h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Nombre del pedido"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className={`flex-1 ${inputCls}`}
            data-ocid="orders.input"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium text-sm transition-all"
            style={{
              background: "oklch(0.828 0.167 87)",
              color: "oklch(0.138 0.032 243)",
            }}
            data-ocid="orders.primary_button"
          >
            <Plus size={15} />
          </button>
        </div>

        {orders.length === 0 ? (
          <div
            className="text-center py-6 text-muted-foreground text-xs"
            data-ocid="orders.empty_state"
          >
            No hay pedidos. Agrega uno arriba.
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const camaQty = order.piezasPorCama ?? piezasPorCama;
              const restante = Math.max(0, order.total - order.hecho);
              const pct = Math.min(100, (order.hecho / order.total) * 100);
              const done = restante === 0;
              const tipoColors = TIPO_COLORS[order.tipo ?? "matriculas"];

              // Preview next cama code range
              const nextRange =
                order.tipo === "matriculas" && order.codigoInicio && !done
                  ? getCamaCodeRange(order, camaQty)
                  : null;

              return (
                <div
                  key={order.id}
                  className="rounded-xl p-4"
                  style={{
                    background: "oklch(0.175 0.038 242)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                  data-ocid={`orders.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">
                        {order.nombre}
                      </span>
                      {order.tipo && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            background: tipoColors.bg,
                            color: tipoColors.text,
                          }}
                        >
                          {TIPO_LABELS[order.tipo]}
                        </span>
                      )}
                      {done && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "oklch(0.696 0.17 162.48 / 0.2)",
                            color: "oklch(0.696 0.17 162.48)",
                          }}
                        >
                          Completado ✅
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDelete(order.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      data-ocid={`orders.delete_button.${i + 1}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* Code range display for matriculas */}
                  {order.tipo === "matriculas" && order.codigoInicio && (
                    <div className="flex gap-3 text-xs mb-2">
                      <span className="text-muted-foreground">
                        Inicio:{" "}
                        <span
                          className="font-mono"
                          style={{ color: "oklch(0.828 0.167 87)" }}
                        >
                          {order.codigoInicio}
                        </span>
                      </span>
                      {order.codigoFin && (
                        <span className="text-muted-foreground">
                          Fin:{" "}
                          <span
                            className="font-mono"
                            style={{ color: "oklch(0.828 0.167 87)" }}
                          >
                            {order.codigoFin}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex gap-4 text-xs mb-3">
                    <span className="text-muted-foreground">
                      Total:{" "}
                      <span className="text-foreground font-semibold">
                        {order.total}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Hecho:{" "}
                      <span
                        className="font-semibold"
                        style={{ color: "oklch(0.828 0.167 87)" }}
                      >
                        {order.hecho}
                      </span>
                    </span>
                    <span className="text-muted-foreground">
                      Restante:{" "}
                      <span className="text-foreground font-semibold">
                        {restante}
                      </span>
                    </span>
                  </div>

                  <div className="h-1.5 rounded-full bg-white/10 mb-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        background: done
                          ? "oklch(0.696 0.17 162.48)"
                          : "oklch(0.828 0.167 87)",
                      }}
                    />
                  </div>

                  {/* Next cama preview */}
                  {nextRange && (
                    <div
                      className="mb-3 px-3 py-2 rounded-lg text-xs"
                      style={{
                        background: "oklch(0.828 0.167 87 / 0.06)",
                        border: "1px solid oklch(0.828 0.167 87 / 0.15)",
                      }}
                    >
                      <span className="text-muted-foreground">
                        Próxima cama:{" "}
                      </span>
                      <span
                        className="font-mono"
                        style={{ color: "oklch(0.828 0.167 87)" }}
                      >
                        {nextRange.codigoInicio} → {nextRange.codigoFin}
                      </span>
                    </div>
                  )}

                  {/* Cama row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleAddCama(order)}
                      disabled={done}
                      className="text-xs px-4 py-1.5 rounded-lg font-semibold transition-all disabled:opacity-40"
                      style={{
                        background: done
                          ? "oklch(0.295 0.052 240)"
                          : "oklch(0.828 0.167 87)",
                        color: done
                          ? "oklch(0.652 0.048 236)"
                          : "oklch(0.138 0.032 243)",
                      }}
                      data-ocid={`orders.button.${i + 1}`}
                    >
                      +1 Cama ({camaQty} pzs)
                    </button>

                    {/* Edit cama qty per order */}
                    {editingCamaId === order.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          ref={editInputRef}
                          type="number"
                          value={editingCamaVal}
                          min={1}
                          onChange={(e) => setEditingCamaVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmEditCama(order.id);
                            if (e.key === "Escape") setEditingCamaId(null);
                          }}
                          className="w-16 bg-background/60 border border-white/20 rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => confirmEditCama(order.id)}
                          className="text-xs px-2 py-1 rounded font-semibold"
                          style={{
                            background: "oklch(0.696 0.17 162.48 / 0.2)",
                            color: "oklch(0.696 0.17 162.48)",
                          }}
                        >
                          OK
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCamaId(null)}
                          className="text-xs px-2 py-1 rounded text-muted-foreground hover:text-foreground"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditCama(order)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        title="Cambiar piezas por cama para este pedido"
                      >
                        <Edit2 size={11} />
                        {order.piezasPorCama !== undefined
                          ? `${order.piezasPorCama} pzs/cama`
                          : "Personalizar"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
