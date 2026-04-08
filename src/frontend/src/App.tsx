import { useCallback, useEffect, useState } from "react";
import BarcodePreview from "./components/BarcodePreview";
import type { BarcodeConfig } from "./components/BarcodePreview";
import BatchSystem from "./components/BatchSystem";
import ChatPage from "./components/ChatPage";
import HistorialPage from "./components/HistorialPage";
import ManualPrintPage from "./components/ManualPrintPage";
import Orders from "./components/Orders";
import type { Order } from "./components/Orders";
import PedidosEnviadosPage from "./components/PedidosEnviadosPage";
import type { PedidoEnviado } from "./components/PedidosEnviadosPage";
import PrintHistory from "./components/PrintHistory";
import type { HistorialEntry } from "./components/PrintHistory";
import TutorialPage from "./components/TutorialPage";
import WeeklyGoal from "./components/WeeklyGoal";
import { useLocalStorage } from "./hooks/useLocalStorage";

function getSemanaISO(d: Date): string {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return `${date.getFullYear()}-W${String(
    1 +
      Math.round(
        ((date.getTime() - week1.getTime()) / 86400000 -
          3 +
          ((week1.getDay() + 6) % 7)) /
          7,
      ),
  ).padStart(2, "00")}`;
}

const DEFAULT_CONFIG: BarcodeConfig = {
  codigoBase: "TAS000001000",
  barcodeX: 20,
  barcodeY: 10,
  barcodeWidth: 526,
  barcodeHeight: 120,
  textX: 283,
  textY: 175,
  fontSize: 18,
};

type ActivePage =
  | "generador"
  | "registro"
  | "historial"
  | "tutorial"
  | "chat"
  | "enviados";

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>("generador");
  const [config, setConfig] = useLocalStorage<BarcodeConfig>(
    "config",
    DEFAULT_CONFIG,
  );
  const [historial, setHistorial] = useLocalStorage<HistorialEntry[]>(
    "historial",
    [],
  );
  const [orders, setOrders] = useLocalStorage<Order[]>("pedidos", [
    {
      id: "1",
      nombre: "Pedido Alpha",
      total: 300,
      hecho: 60,
      tipo: "matriculas",
    },
    { id: "2", nombre: "Pedido Beta", total: 500, hecho: 150, tipo: "placas" },
  ]);
  const [pedidosEnviados, setPedidosEnviados] = useLocalStorage<
    PedidoEnviado[]
  >("pedidosEnviados", []);
  const [semanaData, setSemanaData] = useLocalStorage<{
    week: string;
    hecho: number;
  }>("semana", {
    week: getSemanaISO(new Date()),
    hecho: 0,
  });
  const [objetivo, setObjetivo] = useLocalStorage<number>("objetivo", 5000);
  const [piezasPorCama, setPiezasPorCama] = useLocalStorage<number>(
    "piezasPorCama",
    30,
  );

  useEffect(() => {
    const currentWeek = getSemanaISO(new Date());
    if (semanaData.week !== currentWeek) {
      setSemanaData({ week: currentWeek, hecho: 0 });
    }
  }, [semanaData.week, setSemanaData]);

  const handleAddCama = useCallback(
    (orderId: string) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderId) return o;
          const qty = o.piezasPorCama ?? piezasPorCama;
          return { ...o, hecho: Math.min(o.total, o.hecho + qty) };
        }),
      );
      const order = orders.find((o) => o.id === orderId);
      const qty = order?.piezasPorCama ?? piezasPorCama;
      setSemanaData((prev) => ({ ...prev, hecho: prev.hecho + qty }));
    },
    [piezasPorCama, orders, setOrders, setSemanaData],
  );

  function handleAddOrder(
    nombre: string,
    total: number,
    tipo: Order["tipo"],
    codigoInicio?: string,
    codigoFin?: string,
    responsable?: string,
  ) {
    setOrders((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        nombre,
        total,
        hecho: 0,
        tipo,
        codigoInicio,
        codigoFin,
        responsable,
      },
    ]);
  }

  function handleDeleteOrder(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  function handleUpdateOrder(id: string, changes: Partial<Order>) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...changes } : o)),
    );
  }

  function handleAddToPedido(orderId: string, cantidad: number) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, hecho: Math.min(o.total, o.hecho + cantidad) }
          : o,
      ),
    );
    setSemanaData((prev) => ({ ...prev, hecho: prev.hecho + cantidad }));
  }

  function handleHistorialAdd(entry: HistorialEntry) {
    setHistorial((prev) => [entry, ...prev]);
  }

  function handleHistorialDelete(id: string) {
    setHistorial((prev) => prev.filter((e) => e.id !== id));
  }

  function updateConfig(field: keyof BarcodeConfig, value: string | number) {
    setConfig((prev) => ({ ...prev, [field]: value }));
  }

  function handleAddPedidoEnviado(p: PedidoEnviado) {
    setPedidosEnviados((prev) => [p, ...prev]);
  }

  function handleDeletePedidoEnviado(id: string) {
    setPedidosEnviados((prev) => prev.filter((p) => p.id !== id));
  }

  const tabs: {
    id: ActivePage;
    label: string;
    num: string;
    accent?: string;
    accentBg?: string;
  }[] = [
    { id: "generador", label: "Generador", num: "1" },
    { id: "registro", label: "Registro", num: "2" },
    { id: "historial", label: "Historial", num: "3" },
    { id: "tutorial", label: "Guía", num: "?" },
    {
      id: "chat",
      label: "Chat",
      num: "💬",
      accent: "oklch(0.696 0.17 162.48)",
      accentBg: "oklch(0.696 0.17 162.48 / 0.12)",
    },
    {
      id: "enviados",
      label: "Enviados",
      num: "📦",
      accent: "oklch(0.696 0.17 162.48)",
      accentBg: "oklch(0.696 0.17 162.48 / 0.12)",
    },
  ];

  return (
    <div
      className="min-h-screen"
      style={{ background: "oklch(0.138 0.032 243)" }}
    >
      <header
        className="sticky top-0 z-10 px-6 py-3"
        style={{
          background: "oklch(0.155 0.036 242 / 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <img
              src="/assets/generated/logo-generador-codigos-transparent.dim_200x200.png"
              alt="Logo Generador de Códigos"
              className="w-10 h-10 rounded-lg shrink-0 object-contain"
              style={{ background: "transparent" }}
            />
            <div>
              <h1 className="font-semibold text-sm text-foreground">
                Barcode Manager
              </h1>
              <p className="text-xs text-muted-foreground">
                Generador de Códigos de Barras
              </p>
            </div>
          </div>

          <nav className="flex items-center gap-1" aria-label="Páginas">
            {tabs.map((tab) => {
              const isActive = activePage === tab.id;
              const isTutorial = tab.id === "tutorial";
              const defaultAccent = isTutorial
                ? "oklch(0.8 0.12 270)"
                : "oklch(0.828 0.167 87)";
              const defaultAccentBg = isTutorial
                ? "oklch(0.7 0.15 270 / 0.12)"
                : "oklch(0.828 0.167 87 / 0.12)";
              const accentColor = tab.accent ?? defaultAccent;
              const accentBg = tab.accentBg ?? defaultAccentBg;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePage(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: isActive ? accentBg : "transparent",
                    color: isActive ? accentColor : "oklch(0.72 0.038 236)",
                    borderBottom: isActive
                      ? `2px solid ${accentColor}`
                      : "2px solid transparent",
                  }}
                  data-ocid={`nav.${tab.id}.link`}
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{
                      background: isActive
                        ? accentColor
                        : "oklch(0.295 0.052 240)",
                      color: isActive
                        ? "oklch(0.138 0.032 243)"
                        : "oklch(0.85 0.02 236)",
                    }}
                  >
                    {tab.num}
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="text-xs text-muted-foreground hidden sm:block">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
      </header>

      <main className="p-6">
        {activePage === "generador" ? (
          <div className="flex gap-5 max-w-[1400px] mx-auto">
            <aside className="w-72 shrink-0 space-y-4">
              <div
                className="rounded-2xl p-5 shadow-card"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  Configuración de Código
                </h2>
                <div className="space-y-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      Código base
                    </span>
                    <input
                      type="text"
                      value={config.codigoBase}
                      onChange={(e) =>
                        updateConfig("codigoBase", e.target.value)
                      }
                      className="bg-background/40 border border-white/15 rounded-lg px-3 py-1.5 text-foreground text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                      data-ocid="config.input"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["Barcode X", "barcodeX"],
                        ["Barcode Y", "barcodeY"],
                        ["Barcode Ancho", "barcodeWidth"],
                        ["Barcode Alto", "barcodeHeight"],
                        ["Texto X", "textX"],
                        ["Texto Y", "textY"],
                      ] as [string, keyof BarcodeConfig][]
                    ).map(([label, field]) => (
                      <label key={field} className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">
                          {label}
                        </span>
                        <input
                          type="number"
                          value={config[field] as number}
                          onChange={(e) =>
                            updateConfig(field, Number(e.target.value))
                          }
                          className="bg-background/40 border border-white/15 rounded-lg px-2 py-1.5 text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          data-ocid="config.input"
                        />
                      </label>
                    ))}
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">
                      Tamaño de texto
                    </span>
                    <input
                      type="number"
                      value={config.fontSize}
                      onChange={(e) =>
                        updateConfig("fontSize", Number(e.target.value))
                      }
                      className="bg-background/40 border border-white/15 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      data-ocid="config.input"
                    />
                  </label>
                </div>
              </div>

              <div
                className="rounded-2xl p-5 shadow-card"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  Producción
                </h2>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Piezas por cama (global)
                  </span>
                  <input
                    type="number"
                    value={piezasPorCama}
                    min={1}
                    onChange={(e) => setPiezasPorCama(Number(e.target.value))}
                    className="bg-background/40 border border-white/15 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    data-ocid="config.input"
                  />
                </label>
              </div>

              <WeeklyGoal
                objetivo={objetivo}
                hecho={semanaData.hecho}
                onObjetivoChange={setObjetivo}
              />
              <BatchSystem
                config={config}
                onHistorialAdd={handleHistorialAdd}
                orders={orders}
                onAddToPedido={handleAddToPedido}
              />
            </aside>

            <div className="flex-1 space-y-4 min-w-0">
              <div
                className="rounded-2xl p-5 shadow-card"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
                  Vista Previa
                </h2>
                <BarcodePreview config={config} />
              </div>

              <PrintHistory
                historial={historial}
                onDelete={handleHistorialDelete}
                onClear={() => setHistorial([])}
              />

              <Orders
                orders={orders}
                piezasPorCama={piezasPorCama}
                onAddCama={handleAddCama}
                onDelete={handleDeleteOrder}
                onAdd={handleAddOrder}
                onUpdateOrder={handleUpdateOrder}
                onHistorialAdd={handleHistorialAdd}
              />
            </div>
          </div>
        ) : activePage === "registro" ? (
          <ManualPrintPage
            historial={historial}
            onManualAdd={handleHistorialAdd}
            onDelete={handleHistorialDelete}
            onClear={() => setHistorial([])}
            orders={orders}
            onAddToPedido={handleAddToPedido}
          />
        ) : activePage === "historial" ? (
          <HistorialPage
            historial={historial}
            onDelete={handleHistorialDelete}
            onClear={() => setHistorial([])}
          />
        ) : activePage === "chat" ? (
          <ChatPage
            historial={historial}
            pedidos={orders}
            onAddPedidoEnviado={handleAddPedidoEnviado}
          />
        ) : activePage === "enviados" ? (
          <PedidosEnviadosPage
            pedidosEnviados={pedidosEnviados}
            onAdd={handleAddPedidoEnviado}
            onDelete={handleDeletePedidoEnviado}
          />
        ) : (
          <TutorialPage />
        )}
      </main>

      <footer
        className="text-center py-4 text-xs text-muted-foreground border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors"
          style={{ color: "oklch(0.828 0.167 87)" }}
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
