export default function TutorialPage() {
  const steps = [
    {
      num: "1",
      title: "Página 1 — Generador de Matrículas",
      color: "oklch(0.828 0.167 87)",
      bg: "oklch(0.828 0.167 87 / 0.1)",
      icon: "🏷️",
      desc: "Aquí generas los archivos PNG con los códigos de barras.",
      items: [
        "Pon el código de inicio, por ejemplo: TAS000001000",
        "Escribe cuántas matrículas quieres hacer, por ejemplo: 30",
        "Verás automáticamente el código final (TAS000001029)",
        "Pulsa el botón amarillo para generar y descargar un ZIP con todas las imágenes",
        'La próxima vez, pulsa "Continuar" para seguir desde donde lo dejaste sin tener que escribir el código a mano',
      ],
    },
    {
      num: "2",
      title: "Página 2 — Registrar Impresión",
      color: "oklch(0.696 0.17 162.48)",
      bg: "oklch(0.696 0.17 162.48 / 0.1)",
      icon: "📋",
      desc: "Aquí apuntas cada vez que imprimes algo.",
      items: [
        "Elige el tipo: 'Con código de barras' (matrículas normales) o 'Sin código' (placas CE)",
        "Para matrículas: rellena el código de inicio y fin, cuántos lotes y cuántas imágenes en total",
        "Para placas CE: solo escribe la cantidad y el nombre del proveedor",
        "Puedes añadir el nombre del operario que está trabajando",
        "Al pulsar 'Registrar' queda guardado automáticamente",
        "Desde aquí también puedes imprimir o descargar la tabla como PDF",
      ],
    },
    {
      num: "3",
      title: "Página 3 — Historial",
      color: "oklch(0.7 0.15 270)",
      bg: "oklch(0.7 0.15 270 / 0.1)",
      icon: "📊",
      desc: "Aquí ves todo lo que se ha hecho hasta ahora.",
      items: [
        "Aparece la lista completa de todas las impresiones registradas",
        "Cada fila tiene un botón PDF para descargar los códigos de barras de ese lote",
        "Puedes seleccionar varios registros con los cuadraditos de la izquierda y descargar un PDF conjunto",
        "El botón 'Rango' te deja personalizar qué códigos incluir en el PDF (si solo quieres una parte)",
        "Para borrar un registro, pulsa el icono de papelera al final de la fila",
      ],
    },
    {
      num: "4",
      title: "Generador — Pedidos y Objetivo Semanal",
      color: "oklch(0.8 0.15 27)",
      bg: "oklch(0.8 0.15 27 / 0.1)",
      icon: "🎯",
      desc: "En la Página 1 también tienes herramientas de seguimiento de producción.",
      items: [
        "Objetivo semanal: escribe cuántas matrículas quieres hacer esta semana; la barra se va llenando sola",
        "Pedidos: añade pedidos con un nombre y el total de unidades; pulsa '+1 cama' para ir sumando lo producido",
        "'Piezas por cama': configura cuántas piezas cuenta cada vez que pulsas el botón de cama",
        "Todo se guarda automáticamente en el navegador, aunque lo cierres y lo vuelvas a abrir",
      ],
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div
        className="rounded-2xl p-6"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: "oklch(0.828 0.167 87 / 0.15)" }}
          >
            📖
          </div>
          <div>
            <h2
              className="text-xl font-bold tracking-tight mb-1"
              style={{ color: "oklch(0.942 0.012 236)" }}
            >
              Guía de uso
            </h2>
            <p className="text-sm text-muted-foreground">
              Todo lo que necesitas saber para usar la app. Sin tecnicismos.
            </p>
          </div>
        </div>
      </div>

      {/* Steps */}
      {steps.map((step) => (
        <div
          key={step.num}
          className="rounded-2xl p-6"
          style={{
            background:
              "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: step.bg }}
            >
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: step.bg,
                    color: step.color,
                  }}
                >
                  Paso {step.num}
                </span>
                <h3
                  className="font-semibold text-sm"
                  style={{ color: "oklch(0.942 0.012 236)" }}
                >
                  {step.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{step.desc}</p>
              <ul className="space-y-2">
                {step.items.map((item, idx) => (
                  <li
                    key={`${item.slice(0, 20)}-${idx}`}
                    className="flex items-start gap-2.5"
                  >
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        background: step.bg,
                        color: step.color,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-sm text-foreground/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      ))}

      {/* Tip card */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: "oklch(0.828 0.167 87 / 0.08)",
          border: "1px solid oklch(0.828 0.167 87 / 0.2)",
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-lg shrink-0">💡</span>
          <div>
            <p
              className="text-sm font-semibold mb-1"
              style={{ color: "oklch(0.828 0.167 87)" }}
            >
              Consejo importante
            </p>
            <p className="text-sm text-muted-foreground">
              Todo se guarda automáticamente en tu navegador. No necesitas hacer
              nada especial para guardar. Si limpias el historial del navegador,
              perderás los datos. Si quieres hacer una copia de seguridad,
              descarga el PDF antes de borrar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
