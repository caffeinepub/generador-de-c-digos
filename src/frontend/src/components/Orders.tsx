import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export interface Order {
  id: string;
  nombre: string;
  total: number;
  hecho: number;
}

interface OrdersProps {
  orders: Order[];
  piezasPorCama: number;
  onAddCama: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (nombre: string, total: number) => void;
}

export default function Orders({
  orders,
  piezasPorCama,
  onAddCama,
  onDelete,
  onAdd,
}: OrdersProps) {
  const [nombre, setNombre] = useState("");
  const [total, setTotal] = useState(1000);

  function handleAdd() {
    if (!nombre.trim()) return;
    onAdd(nombre.trim(), total);
    setNombre("");
    setTotal(1000);
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
        Pedidos Activos
      </h2>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Nombre del pedido"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1 bg-background/40 border border-white/10 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
          data-ocid="orders.input"
        />
        <input
          type="number"
          value={total}
          min={1}
          onChange={(e) => setTotal(Number(e.target.value))}
          className="w-24 bg-background/40 border border-white/10 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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
            const restante = Math.max(0, order.total - order.hecho);
            const pct = Math.min(100, (order.hecho / order.total) * 100);
            const done = restante === 0;
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
                  <div>
                    <span className="font-semibold text-sm text-foreground">
                      {order.nombre}
                    </span>
                    {done && (
                      <span
                        className="ml-2 text-xs px-2 py-0.5 rounded-full"
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
                <div className="flex gap-4 text-xs mb-3">
                  <span className="text-muted-foreground">
                    Total:{" "}
                    <span className="text-foreground font-medium">
                      {order.total}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Hecho:{" "}
                    <span
                      className="font-medium"
                      style={{ color: "oklch(0.828 0.167 87)" }}
                    >
                      {order.hecho}
                    </span>
                  </span>
                  <span className="text-muted-foreground">
                    Restante:{" "}
                    <span className="text-foreground font-medium">
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
                <button
                  type="button"
                  onClick={() => onAddCama(order.id)}
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
                  +1 Cama ({piezasPorCama} pzs)
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
