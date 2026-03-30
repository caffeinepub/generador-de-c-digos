interface WeeklyGoalProps {
  objetivo: number;
  hecho: number;
  onObjetivoChange: (val: number) => void;
}

export default function WeeklyGoal({
  objetivo,
  hecho,
  onObjetivoChange,
}: WeeklyGoalProps) {
  const restante = Math.max(0, objetivo - hecho);
  const pct = objetivo > 0 ? Math.min(100, (hecho / objetivo) * 100) : 0;
  const done = restante === 0 && objetivo > 0;

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
        Objetivo Semanal
      </h2>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div
          className="rounded-xl p-3 text-center"
          style={{
            background: "oklch(0.175 0.038 242)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="text-lg font-bold"
            style={{ color: "oklch(0.828 0.167 87)" }}
          >
            {hecho.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Hecho</div>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{
            background: "oklch(0.175 0.038 242)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="text-lg font-bold text-foreground">
            {restante.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Restante</div>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{
            background: "oklch(0.175 0.038 242)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="text-lg font-bold text-foreground">
            {Math.round(pct)}%
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Progreso</div>
        </div>
      </div>

      <div className="h-2 rounded-full bg-white/10 mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: done
              ? "oklch(0.696 0.17 162.48)"
              : "oklch(0.828 0.167 87)",
          }}
        />
      </div>

      {done && (
        <div
          className="text-center py-2 rounded-xl text-sm font-semibold mb-4"
          style={{
            background: "oklch(0.696 0.17 162.48 / 0.15)",
            color: "oklch(0.696 0.17 162.48)",
          }}
          data-ocid="weekly.success_state"
        >
          Semana hecha ✅
        </div>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          Objetivo semanal (piezas)
        </span>
        <input
          type="number"
          value={objetivo}
          min={1}
          onChange={(e) => onObjetivoChange(Number(e.target.value))}
          className="bg-background/40 border border-white/10 rounded-lg px-3 py-1.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          data-ocid="weekly.input"
        />
      </label>
    </div>
  );
}
