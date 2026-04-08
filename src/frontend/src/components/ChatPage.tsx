import { FileDown, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Order } from "./Orders";
import type { PedidoEnviado } from "./PedidosEnviadosPage";
import type { HistorialEntry } from "./PrintHistory";

interface ChatPageProps {
  historial: HistorialEntry[];
  pedidos: Order[];
  onAddPedidoEnviado?: (p: PedidoEnviado) => void;
}

interface PdfAction {
  type: "pdf";
  label: string;
  handler: "barcode_entry" | "sincodigo_entry" | "resumen";
  entryIndex?: number;
}

interface AddEnviadoAction {
  type: "add_enviado";
  prefill?: Partial<PedidoEnviado>;
}

type MessageAction = PdfAction | AddEnviadoAction;

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  action?: MessageAction;
}

// ---- PDF helpers (same approach as HistorialPage) --------------------------------

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

function generateBarcodePdfFromEntry(entry: HistorialEntry) {
  const { prefix, num: startNum, digits } = parseCode(entry.codigoInicio);
  const codes: string[] = [];
  for (let i = 0; i < entry.totalImagenes; i++) {
    codes.push(buildCode(prefix, startNum + i, digits));
  }
  const meta = `Operario: ${entry.operario ?? "—"} | Desde: ${entry.codigoInicio} | Hasta: ${entry.codigoFin} | Total: ${codes.length}`;
  const items = codes
    .map(
      (c) =>
        `<div class="bi"><svg class="bc" data-code="${c}"></svg><p class="cl">${c}</p></div>`,
    )
    .join("");
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>PDF Códigos</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:16px;margin-bottom:4px}.meta{font-size:11px;color:#666;margin-bottom:24px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.bi{border:1px solid #ddd;border-radius:6px;padding:12px;text-align:center;page-break-inside:avoid}.bi svg{width:100%;height:auto}.cl{font-family:monospace;font-size:11px;margin-top:6px;color:#333}@media print{body{padding:8px}}</style>
</head><body><h1>Códigos de Barras — ${entry.fecha}</h1><p class="meta">${meta}</p><div class="grid">${items}</div>
<script>document.querySelectorAll('.bc').forEach(function(el){JsBarcode(el,el.getAttribute('data-code'),{format:'CODE128',displayValue:false,margin:4,width:1.5,height:50});});setTimeout(function(){window.print();},500);<\/script>
</body></html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function generateSinCodigoPdfFromEntry(entry: HistorialEntry) {
  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>PDF Placas sin código</title>
<style>body{font-family:Arial,sans-serif;padding:40px;color:#111;max-width:600px;margin:0 auto}h1{font-size:20px;margin-bottom:4px}.sub{font-size:12px;color:#666;margin-bottom:32px}.card{border:2px solid #ddd;border-radius:12px;padding:28px;text-align:center}.qty{font-size:72px;font-weight:bold;color:#222;line-height:1;margin:12px 0}.unit{font-size:16px;color:#555;margin-bottom:24px}.details{display:grid;grid-template-columns:1fr 1fr;gap:12px;text-align:left;margin-top:24px;border-top:1px solid #eee;padding-top:20px}.di{font-size:13px}.dl{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}@media print{body{padding:20px}}</style>
</head><body><h1>Placas sin código — Resumen</h1><p class="sub">Generado el ${new Date().toLocaleString("es")}</p>
<div class="card">${entry.nombre ? `<div style="font-size:13px;color:#555;font-weight:600;margin-bottom:6px">${entry.nombre}</div>` : ""}
<div style="font-size:14px;color:#888;margin-bottom:4px">Total de placas realizadas</div>
<div class="qty">${entry.totalImagenes}</div><div class="unit">placas sin código de barras</div>
<div class="details"><div class="di"><div class="dl">Fecha</div><div>${entry.fecha}</div></div>
<div class="di"><div class="dl">Hora</div><div>${entry.hora ?? "—"}</div></div>
<div class="di"><div class="dl">Operario</div><div>${entry.operario ?? "—"}</div></div>
<div class="di"><div class="dl">Tipo</div><div>Placa sin código</div></div>
${entry.nombre ? `<div class="di"><div class="dl">Nombre / Proveedor</div><div>${entry.nombre}</div></div>` : ""}
</div></div><script>window.onload=()=>{window.print();}<\/script></body></html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

function generateResumenPdf(
  historial: HistorialEntry[],
  pedidos: Order[],
  semana: { week: string; hecho: number },
  objetivo: number,
  lastCode: string,
) {
  const totalAll = historial.reduce((s, e) => s + e.totalImagenes, 0);
  const today = new Date().toLocaleDateString("es-ES");
  const todayEntries = historial.filter((e) => e.fecha === today);
  const totalHoy = todayEntries.reduce((s, e) => s + e.totalImagenes, 0);
  const pct = objetivo > 0 ? Math.round((semana.hecho / objetivo) * 100) : 0;

  const orderRows = pedidos
    .map(
      (o) =>
        `<tr><td>${o.nombre}</td><td>${o.tipo}</td><td>${o.hecho}</td><td>${o.total}</td><td>${o.total - o.hecho}</td><td>${Math.round((o.hecho / o.total) * 100)}%</td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><title>Resumen de Producción</title>
<style>body{font-family:Arial,sans-serif;padding:32px;color:#111}h1{font-size:22px;margin-bottom:4px}h2{font-size:15px;margin:24px 0 8px;color:#333;border-bottom:2px solid #eee;padding-bottom:4px}.sub{font-size:12px;color:#666;margin-bottom:24px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}.stat{border:1px solid #ddd;border-radius:8px;padding:16px;text-align:center}.stat-val{font-size:32px;font-weight:bold;color:#111}.stat-lbl{font-size:11px;color:#888;margin-top:4px}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#f0f0f0;text-align:left;padding:8px 12px;border-bottom:2px solid #ccc}td{padding:8px 12px;border-bottom:1px solid #eee}.prog{background:#e0e0e0;border-radius:4px;height:8px;margin-top:4px}.prog-fill{height:8px;border-radius:4px;background:#f59e0b}@media print{body{padding:16px}}</style>
</head><body>
<h1>Resumen de Producción</h1><p class="sub">Generado el ${new Date().toLocaleString("es")}</p>
<div class="stats">
<div class="stat"><div class="stat-val">${totalAll.toLocaleString("es")}</div><div class="stat-lbl">Total producido histórico</div></div>
<div class="stat"><div class="stat-val">${totalHoy.toLocaleString("es")}</div><div class="stat-lbl">Producido hoy</div></div>
<div class="stat"><div class="stat-val">${pct}%</div><div class="stat-lbl">Objetivo semanal (${semana.hecho}/${objetivo})</div></div>
</div>
<p><strong>Último código generado:</strong> <code>${lastCode || "—"}</code></p>
<h2>Pedidos Activos</h2>
<table><thead><tr><th>Nombre</th><th>Tipo</th><th>Hecho</th><th>Total</th><th>Restante</th><th>Progreso</th></tr></thead>
<tbody>${orderRows || `<tr><td colspan="6" style="text-align:center;color:#999">Sin pedidos activos</td></tr>`}</tbody></table>
<script>window.onload=()=>{window.print();}<\/script></body></html>`;
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(html);
  win.document.close();
}

// ---- Series detection helpers -----------------------------------------------

/** Extract a series prefix from messages like "¿por qué matrícula de TAS me quedé?" */
function extractSeriesPrefix(text: string): string | null {
  // Explicit "de X", "con X", "en X" after matricula/placa/codigo/serie keywords
  const explicitMatch = text.match(
    /(?:matricula|placa|codigo|serie|prefijo|secuencia)s?\s+(?:de|con|en)\s+([A-Za-z0-9]{2,8})/i,
  );
  if (explicitMatch) return explicitMatch[1].toUpperCase();

  // "¿por qué X me quedé?" / "último código X" / "dónde me quedé con X"
  const quedéMatch = text.match(
    /(?:quede|quedo|de|con|en)\s+([A-Za-z]{2,6})\b/i,
  );
  if (quedéMatch) {
    const candidate = quedéMatch[1].toUpperCase();
    // Exclude common Spanish words
    const skip = new Set([
      "QUE",
      "LAS",
      "LOS",
      "UNA",
      "UNO",
      "POR",
      "CON",
      "DEL",
      "LOS",
      "MIS",
      "SUS",
      "HOY",
      "DIA",
      "ESE",
      "ESA",
      "EST",
      "MAS",
      "TAM",
      "TODO",
      "TODA",
    ]);
    if (!skip.has(candidate)) return candidate;
  }

  // "último código TAS" / "TAS?" / just typed a 2-6 letter prefix alone
  const aloneMatch = text.match(/^([A-Za-z]{2,6})\s*\??$/);
  if (aloneMatch) return aloneMatch[1].toUpperCase();

  // "¿dónde me quedé con TAS?" style
  const conMatch = text.match(/con\s+([A-Za-z0-9]{2,8})/i);
  if (conMatch) return conMatch[1].toUpperCase();

  return null;
}

/** Find all historial entries whose codes start with the given prefix */
function findEntriesByPrefix(
  historial: HistorialEntry[],
  prefix: string,
): HistorialEntry[] {
  const p = prefix.toLowerCase();
  return historial.filter(
    (e) =>
      e.codigoInicio?.toLowerCase().startsWith(p) ||
      e.codigoFin?.toLowerCase().startsWith(p),
  );
}

/** Get the highest codigoFin among a set of entries (last used code in series) */
function getLastCodeInSeries(entries: HistorialEntry[]): string | null {
  if (entries.length === 0) return null;
  // Sort by codigoFin numeric value descending
  const sorted = [...entries].sort((a, b) => {
    const numA = Number.parseInt(
      (a.codigoFin ?? "").replace(/\D/g, "") || "0",
      10,
    );
    const numB = Number.parseInt(
      (b.codigoFin ?? "").replace(/\D/g, "") || "0",
      10,
    );
    return numB - numA;
  });
  return sorted[0].codigoFin ?? null;
}

function getFromLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Parse "añadir pedido enviado" style commands and extract name/qty/type
function parseAddEnviado(msg: string): {
  detected: boolean;
  nombre?: string;
  cantidad?: number;
  tipo?: PedidoEnviado["tipo"];
} {
  const normalized = msg
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  const isEnviado =
    normalized.includes("enviado") ||
    normalized.includes("envio") ||
    (normalized.includes("pedido") &&
      (normalized.includes("enviad") ||
        normalized.includes("completa") ||
        normalized.includes("termina") ||
        normalized.includes("enviar") ||
        normalized.includes("marca"))) ||
    (normalized.includes("anadi") && normalized.includes("enviado")) ||
    (normalized.includes("añad") && normalized.includes("enviado")) ||
    (normalized.includes("registra") && normalized.includes("enviado")) ||
    normalized.includes("nuevo enviado");

  if (!isEnviado) return { detected: false };

  // Try to extract quantity
  const qtyMatch = normalized.match(
    /(\d+)\s*(unidades?|piezas?|uds?|matriculas?|placas?)?/,
  );
  const cantidad = qtyMatch ? Number.parseInt(qtyMatch[1], 10) : undefined;

  // Try to extract type
  let tipo: PedidoEnviado["tipo"] | undefined;
  if (normalized.includes("matricula") || normalized.includes("matriculas")) {
    tipo = "matriculas";
  } else if (normalized.includes("placa") || normalized.includes("placas")) {
    tipo = "placas";
  } else if (normalized.includes("advertencia")) {
    tipo = "advertencia";
  }

  // Try to extract name - look for quoted text or "llamado X" / "de X"
  let nombre: string | undefined;
  const quotedMatch = msg.match(/"([^"]+)"|«([^»]+)»|'([^']+)'/);
  if (quotedMatch) {
    nombre = quotedMatch[1] || quotedMatch[2] || quotedMatch[3];
  } else {
    const llamadoMatch = msg.match(/llamado\s+(.+?)(?:\s+de|\s+con|\s*$)/i);
    if (llamadoMatch) nombre = llamadoMatch[1].trim();
  }

  return { detected: true, nombre, cantidad, tipo };
}

function buildBotResponse(
  userText: string,
  historial: HistorialEntry[],
  pedidos: Order[],
): { text: string; action?: MessageAction } {
  const msg = userText
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  const semana = getFromLS<{ week: string; hecho: number }>("semana", {
    week: "",
    hecho: 0,
  });
  const objetivo = getFromLS<number>("objetivo", 5000);
  const lastCode = getFromLS<string>("lastGeneratedCode", "");

  const today = new Date().toLocaleDateString("es-ES");

  // ---- Pedido Enviado ----
  const enviado = parseAddEnviado(userText);
  if (enviado.detected) {
    const missing: string[] = [];
    if (!enviado.nombre) missing.push("nombre del pedido");
    if (!enviado.cantidad || enviado.cantidad <= 0) missing.push("cantidad");
    if (!enviado.tipo)
      missing.push("tipo (Matrículas / Placas CE / Advertencia)");

    if (missing.length > 0) {
      return {
        text: `Para añadir un pedido enviado necesito saber: **${missing.join(", ")}**.\n\nPor ejemplo: "Añadir pedido enviado: Pedido Cliente ABC, 300 matrículas".\n\nO puedes usar el botón de abajo para rellenar el formulario directamente.`,
        action: {
          type: "add_enviado",
          prefill: {
            nombre: enviado.nombre,
            cantidad: enviado.cantidad,
            tipo: enviado.tipo,
          },
        },
      };
    }

    return {
      text: `¿Confirmas que quieres añadir este pedido enviado?\n\n• **Nombre:** ${enviado.nombre}\n• **Cantidad:** ${enviado.cantidad?.toLocaleString("es")} unidades\n• **Tipo:** ${enviado.tipo === "matriculas" ? "Matrículas" : enviado.tipo === "placas" ? "Placas CE" : "Advertencia"}\n\nPulsa el botón para confirmarlo.`,
      action: {
        type: "add_enviado",
        prefill: {
          nombre: enviado.nombre,
          cantidad: enviado.cantidad,
          tipo: enviado.tipo,
        },
      },
    };
  }

  // ---- PDF requests ----
  const pdfMatch = msg.match(
    /pdf.*registro[^\d]*(\d+)|registro[^\d]*(\d+).*pdf/,
  );
  const resumPdf =
    msg.includes("resumen") &&
    (msg.includes("pdf") ||
      msg.includes("descarga") ||
      msg.includes("imprimir"));
  const generalPdf =
    !pdfMatch &&
    (msg.includes("pdf") ||
      msg.includes("descargar") ||
      msg.includes("imprimir"));

  if (resumPdf) {
    return {
      text: "Puedo generar un PDF con el resumen completo de producción: pedidos activos, total producido, progreso semanal y último código. Pulsa el botón para descargarlo.",
      action: {
        type: "pdf",
        label: "Generar PDF de resumen",
        handler: "resumen",
      },
    };
  }

  if (pdfMatch) {
    const numStr = pdfMatch[1] || pdfMatch[2];
    const idx = Number.parseInt(numStr, 10) - 1;
    if (idx < 0 || idx >= historial.length) {
      return {
        text: `No encuentro el registro #${numStr}. Tienes ${historial.length} registro${historial.length !== 1 ? "s" : ""} en total. Prueba con un número del 1 al ${historial.length}.`,
      };
    }
    const entry = historial[idx];
    const isSinCodigo = entry.tipo === "sin-codigo";
    return {
      text: `Registro #${numStr} — ${entry.fecha}${entry.operario ? ` | Operario: ${entry.operario}` : ""}${isSinCodigo ? ` | ${entry.totalImagenes} placas sin código${entry.nombre ? ` (${entry.nombre})` : ""}` : ` | Códigos: ${entry.codigoInicio} → ${entry.codigoFin} | Total: ${entry.totalImagenes}`}. Pulsa para generar el PDF.`,
      action: {
        type: "pdf",
        label: `Generar PDF del registro #${numStr}`,
        handler: isSinCodigo ? "sincodigo_entry" : "barcode_entry",
        entryIndex: idx,
      },
    };
  }

  if (generalPdf) {
    if (historial.length === 0) {
      return {
        text: 'No tienes registros todavía para generar un PDF de códigos. Puedes pedirme un "resumen en PDF" para ver el estado general de producción.',
      };
    }
    const list = historial
      .slice(0, 5)
      .map(
        (e, i) =>
          `• Registro ${i + 1}: ${e.fecha} — ${e.tipo === "sin-codigo" ? `${e.totalImagenes} placas${e.nombre ? ` (${e.nombre})` : ""}` : `${e.codigoInicio} → ${e.codigoFin}`}`,
      )
      .join("\n");
    return {
      text: `Puedo generar un PDF de cualquier registro. Dime el número, por ejemplo: "PDF del registro 1".\n\nTus últimos registros:\n${list}${historial.length > 5 ? `\n...y ${historial.length - 5} más.` : ""}`,
    };
  }

  // ---- Series detection: "¿por qué matrícula de TAS me quedé?" ----
  const seriesPrefix = extractSeriesPrefix(userText);
  const isSeriesQuery =
    seriesPrefix !== null &&
    (msg.includes("matricula") ||
      msg.includes("placa") ||
      msg.includes("codigo") ||
      msg.includes("serie") ||
      msg.includes("quede") ||
      msg.includes("quedé") ||
      msg.includes("ultimo") ||
      msg.includes("último") ||
      msg.includes("donde") ||
      msg.includes("dónde") ||
      seriesPrefix.length >= 2);

  if (isSeriesQuery && seriesPrefix) {
    const matched = findEntriesByPrefix(historial, seriesPrefix);
    if (matched.length === 0) {
      return {
        text: `No encontré ningún registro en el historial con la serie **${seriesPrefix}**.\n\nAsegúrate de que el código de inicio o fin de los registros empiece por "${seriesPrefix}". Puedes pedir "resumen del historial" para ver todos los registros.`,
      };
    }
    const lastCode = getLastCodeInSeries(matched);
    const entryList = matched
      .slice(0, 8)
      .map(
        (e) =>
          `• Reg. #${historial.indexOf(e) + 1}: ${e.fecha}${e.hora ? ` ${e.hora}` : ""} — ${e.codigoInicio} → **${e.codigoFin}** (${e.totalImagenes} uds.)${e.operario ? ` | ${e.operario}` : ""}`,
      )
      .join("\n");
    return {
      text: `🏷️ Serie **${seriesPrefix}** — ${matched.length} registro${matched.length !== 1 ? "s" : ""} encontrado${matched.length !== 1 ? "s" : ""}:\n\n${entryList}${matched.length > 8 ? `\n...y ${matched.length - 8} más.` : ""}\n\n📍 Último código de la serie: **${lastCode ?? "—"}**`,
    };
  }

  // ---- Totales por tipo ----
  if (
    msg.includes("cuantas matriculas") ||
    msg.includes("cuántas matriculas") ||
    msg.includes("total matriculas") ||
    (msg.includes("matriculas") && msg.includes("hice")) ||
    msg.includes("cuantas placas") ||
    msg.includes("cuántas placas") ||
    msg.includes("total placas") ||
    (msg.includes("placas") && msg.includes("hice")) ||
    msg.includes("cuantas advertencias") ||
    msg.includes("cuántas advertencias") ||
    (msg.includes("advertencia") && msg.includes("hice"))
  ) {
    if (historial.length === 0) {
      return {
        text: "El historial está vacío. No hay datos de producción todavía.",
      };
    }
    const totalMatriculas = historial
      .filter((e) => e.tipo === "con-codigo")
      .reduce((s, e) => s + e.totalImagenes, 0);
    const totalPlacas = historial
      .filter((e) => e.tipo === "sin-codigo")
      .reduce((s, e) => s + e.totalImagenes, 0);
    const totalAll = historial.reduce((s, e) => s + e.totalImagenes, 0);
    return {
      text: `📊 Totales por tipo en el historial completo:\n\n• 🏷️ **Matrículas (con código):** ${totalMatriculas.toLocaleString("es")} unidades\n• 🪧 **Placas CE (sin código):** ${totalPlacas.toLocaleString("es")} unidades\n• 📦 **Total global:** ${totalAll.toLocaleString("es")} unidades`,
    };
  }

  // ---- Último código / placa ----
  if (
    msg.includes("placa") ||
    msg.includes("matricula") ||
    msg.includes("quede") ||
    msg.includes("quedé") ||
    msg.includes("codigo") ||
    msg.includes("último") ||
    msg.includes("ultimo") ||
    msg.includes("ultimo codigo")
  ) {
    const totalAll = historial.reduce((s, e) => s + e.totalImagenes, 0);
    const todayTotal = historial
      .filter((e) => e.fecha === today)
      .reduce((s, e) => s + e.totalImagenes, 0);

    if (!lastCode && historial.length === 0) {
      return {
        text: "Aún no has generado ningún código. Ve al Generador (página 1) para crear tu primer lote.",
      };
    }

    let response = lastCode
      ? `El último código generado fue: **${lastCode}**`
      : "No hay un código de inicio registrado aún.";

    if (historial.length > 0) {
      const last = historial[0];
      if (last.tipo !== "sin-codigo") {
        response += `\n\nÚltimo registro (${last.fecha}): ${last.codigoInicio} → **${last.codigoFin}**`;
      }
    }
    response += `\n\n📊 Total producido hoy: **${todayTotal}** | Total histórico: **${totalAll.toLocaleString("es")}**`;
    return { text: response };
  }

  // ---- Pedidos activos ----
  if (
    msg.includes("pedido") ||
    msg.includes("activo") ||
    msg.includes("orden") ||
    msg.includes("encargo")
  ) {
    if (pedidos.length === 0) {
      return {
        text: "No tienes pedidos activos en este momento. Ve a la página del Generador (página 1) para crear un nuevo pedido.",
      };
    }
    const lines = pedidos.map((o) => {
      const pct = o.total > 0 ? Math.round((o.hecho / o.total) * 100) : 0;
      const rest = o.total - o.hecho;
      const bar =
        "█".repeat(Math.floor(pct / 10)) +
        "░".repeat(10 - Math.floor(pct / 10));
      const responsableStr = o.responsable ? ` | 👤 ${o.responsable}` : "";
      return `• **${o.nombre}** (${o.tipo})${responsableStr}\n  ${bar} ${pct}% — ${o.hecho}/${o.total} hechos, quedan ${rest}`;
    });
    return {
      text: `Tienes **${pedidos.length}** pedido${pedidos.length > 1 ? "s" : ""} activo${pedidos.length > 1 ? "s" : ""}:\n\n${lines.join("\n\n")}`,
    };
  }

  // ---- Historial completo / resumen del historial ----
  if (
    msg.includes("historial") ||
    msg.includes("registro") ||
    msg.includes("impresion") ||
    msg.includes("impresión") ||
    msg.includes("registre") ||
    msg.includes("registré") ||
    msg.includes("resumen del historial") ||
    msg.includes("todos los registros")
  ) {
    if (historial.length === 0) {
      return {
        text: "El historial está vacío. Registra impresiones en la página 2 o genera lotes en la página 1 para que aparezcan aquí.",
      };
    }
    const totalAll = historial.reduce((s, e) => s + e.totalImagenes, 0);
    const conCodigo = historial.filter((e) => e.tipo !== "sin-codigo");
    const sinCodigo = historial.filter((e) => e.tipo === "sin-codigo");

    // If user asks for "resumen del historial" or "todos los registros", list all
    const isFullListing =
      msg.includes("resumen del historial") ||
      msg.includes("todos los registros") ||
      msg.includes("lista") ||
      msg.includes("listado");

    const entries = isFullListing ? historial : historial.slice(0, 5);
    const entryList = entries
      .map(
        (e, i) =>
          `• #${i + 1}: ${e.fecha}${e.hora ? ` ${e.hora}` : ""}${e.operario ? ` | ${e.operario}` : ""} — ${e.tipo === "sin-codigo" ? `${e.totalImagenes} placas${e.nombre ? ` (${e.nombre})` : ""}` : `${e.codigoInicio} → ${e.codigoFin} (${e.totalImagenes})`}`,
      )
      .join("\n");

    const trailer =
      !isFullListing && historial.length > 5
        ? `\n...y ${historial.length - 5} más. Di "todos los registros" para verlos todos.`
        : "";

    return {
      text: `📋 Historial de impresión — **${historial.length}** registros (**${totalAll.toLocaleString("es")}** unidades):\n• Con código de barras: **${conCodigo.length}**\n• Sin código (placas CE): **${sinCodigo.length}**\n\n${entryList}${trailer}`,
    };
  }

  // ---- Hoy ----
  if (
    msg.includes("hoy") ||
    msg.includes("today") ||
    msg.includes("este dia")
  ) {
    const todayEntries = historial.filter((e) => e.fecha === today);
    const totalHoy = todayEntries.reduce((s, e) => s + e.totalImagenes, 0);
    if (todayEntries.length === 0) {
      return {
        text: `Hoy (${today}) no hay ningún registro de producción todavía. ¡Anímate a empezar!`,
      };
    }
    const detail = todayEntries
      .map(
        (e) =>
          `• ${e.tipo === "sin-codigo" ? `${e.totalImagenes} placas${e.nombre ? ` (${e.nombre})` : ""}` : `${e.codigoInicio} → ${e.codigoFin} (${e.totalImagenes} uds.)`}${e.operario ? ` | ${e.operario}` : ""}`,
      )
      .join("\n");
    return {
      text: `📅 Hoy (${today}) has producido **${totalHoy}** unidades en ${todayEntries.length} registro${todayEntries.length > 1 ? "s" : ""}:\n\n${detail}`,
    };
  }

  // ---- Semana / objetivo / meta ----
  if (
    msg.includes("semana") ||
    msg.includes("objetivo") ||
    msg.includes("meta") ||
    msg.includes("progreso")
  ) {
    const pct = objetivo > 0 ? Math.round((semana.hecho / objetivo) * 100) : 0;
    const rest = Math.max(0, objetivo - semana.hecho);
    const bar =
      "█".repeat(Math.min(10, Math.floor(pct / 10))) +
      "░".repeat(Math.max(0, 10 - Math.floor(pct / 10)));
    let msg2 = `📈 Progreso semanal:\n${bar} **${pct}%**\n\n• Hecho esta semana: **${semana.hecho.toLocaleString("es")}**\n• Objetivo: **${objetivo.toLocaleString("es")}**\n• Restante: **${rest.toLocaleString("es")}**`;
    if (pct >= 100)
      msg2 += "\n\n🎉 ¡Has superado el objetivo de la semana! ¡Buen trabajo!";
    else if (pct >= 75) msg2 += "\n\n💪 ¡Ya casi lo tienes! Sigue así.";
    return { text: msg2 };
  }

  // ---- Ayuda / FAQ ----
  if (
    msg.includes("ayuda") ||
    msg.includes("help") ||
    msg.includes("como") ||
    msg.includes("cómo") ||
    msg.includes("que hace") ||
    msg.includes("qué hace") ||
    msg.includes("que es") ||
    msg.includes("para que")
  ) {
    return {
      text: `Soy tu asistente de producción. Puedo ayudarte con:\n\n• 🏷️ **Códigos**: "¿por qué placa me quedé?", "último código"\n• 🔍 **Series**: "¿por qué matrícula de TAS me quedé?", "último código ABC"\n• 📊 **Totales**: "¿cuántas matrículas hice?", "¿cuántas placas hice?"\n• 📦 **Pedidos**: "¿qué pedidos tengo activos?"\n• 📋 **Historial**: "resumen del historial", "todos los registros"\n• 📅 **Hoy**: "¿cuánto hice hoy?"\n• 📈 **Semana**: "¿cuánto llevo esta semana?", "objetivo semanal"\n• 📄 **PDFs**: "PDF del registro 1", "dame un resumen en PDF"\n• 📤 **Pedidos enviados**: "añadir pedido enviado: Cliente ABC, 300 matrículas"\n\n¿En qué puedo ayudarte?`,
    };
  }

  // ---- Fallback ----
  return {
    text: `No he entendido bien tu pregunta 🤔. Puedo responder sobre:\n• Último código generado o por serie ("TAS", "ABC"…)\n• Pedidos activos y su progreso\n• Historial completo de registros\n• Producción de hoy o esta semana\n• Generar PDFs\n• Añadir pedidos enviados\n\nPrueba con alguna de las preguntas rápidas de abajo, o dime "ayuda" para ver todo lo que puedo hacer.`,
  };
}

// ---- Render helpers ----------------------------------------------------------

function renderText(text: string): React.ReactNode {
  return text.split("\n").map((line) => {
    const lineKey = line.slice(0, 40) + line.length;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    let charOffset = 0;
    return (
      <span key={lineKey}>
        {parts.map((part) => {
          const partKey = `${lineKey}-${charOffset}`;
          charOffset += part.length;
          return part.startsWith("**") && part.endsWith("**") ? (
            <strong key={partKey} style={{ color: "oklch(0.828 0.167 87)" }}>
              {part.slice(2, -2)}
            </strong>
          ) : (
            <span key={partKey}>{part}</span>
          );
        })}
        <br />
      </span>
    );
  });
}

const QUICK_QUESTIONS = [
  "¿Por qué placa me quedé?",
  "¿Por qué matrícula de TAS me quedé?",
  "¿Resumen del historial?",
  "¿Qué pedidos tengo activos?",
  "¿Cuánto hice hoy?",
  "¿Cuántas matrículas hice?",
  "¿Cuánto llevo esta semana?",
  "Dame un resumen en PDF",
  "Añadir pedido enviado",
];

const WELCOME_MSG =
  "¡Hola! Soy tu asistente de producción 🤖. Puedes preguntarme cosas como: ¿por qué matrícula de TAS me quedé?, ¿resumen del historial?, ¿cuántas matrículas hice?, ¿qué pedidos tengo activos? También puedo generar PDFs y añadir pedidos enviados.";

// ---- Add Enviado inline form -------------------------------------------------

interface AddEnviadoFormProps {
  prefill?: Partial<PedidoEnviado>;
  onConfirm: (p: PedidoEnviado) => void;
}

function AddEnviadoForm({ prefill, onConfirm }: AddEnviadoFormProps) {
  const [nombre, setNombre] = useState(prefill?.nombre ?? "");
  const [cantidad, setCantidad] = useState<number>(prefill?.cantidad ?? 0);
  const [tipo, setTipo] = useState<PedidoEnviado["tipo"]>(
    prefill?.tipo ?? "matriculas",
  );
  const [notas, setNotas] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div
        className="rounded-xl px-4 py-3 text-xs"
        style={{
          background: "oklch(0.696 0.17 162.48 / 0.12)",
          border: "1px solid oklch(0.696 0.17 162.48 / 0.3)",
          color: "oklch(0.696 0.17 162.48)",
        }}
      >
        ✅ ¡Pedido enviado registrado correctamente!
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || cantidad <= 0) return;
    const now = new Date();
    onConfirm({
      id: Date.now().toString(),
      fecha: now.toLocaleDateString("es-ES"),
      hora: now.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      nombre: nombre.trim(),
      cantidad,
      tipo,
      notas: notas.trim() || undefined,
    });
    setSubmitted(true);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl p-4 space-y-3"
      style={{
        background: "oklch(0.175 0.038 242)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <p
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: "oklch(0.696 0.17 162.48)" }}
      >
        Nuevo pedido enviado
      </p>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-[10px] text-muted-foreground">Nombre *</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            placeholder="Ej: Pedido Cliente ABC"
            className="rounded-lg px-3 py-1.5 text-xs border focus:outline-none"
            style={{ color: "#000", background: "#fff", borderColor: "#ccc" }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground">Cantidad *</span>
          <input
            type="number"
            value={cantidad || ""}
            onChange={(e) => setCantidad(Number(e.target.value))}
            required
            min={1}
            placeholder="0"
            className="rounded-lg px-3 py-1.5 text-xs border focus:outline-none"
            style={{ color: "#000", background: "#fff", borderColor: "#ccc" }}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground">Tipo *</span>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as PedidoEnviado["tipo"])}
            className="rounded-lg px-3 py-1.5 text-xs border focus:outline-none"
            style={{ color: "#000", background: "#fff", borderColor: "#ccc" }}
          >
            <option value="matriculas">Matrículas</option>
            <option value="placas">Placas CE</option>
            <option value="advertencia">Advertencia</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-[10px] text-muted-foreground">
            Notas (opcional)
          </span>
          <input
            type="text"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Ej: Enviado por mensajería"
            className="rounded-lg px-3 py-1.5 text-xs border focus:outline-none"
            style={{ color: "#000", background: "#fff", borderColor: "#ccc" }}
          />
        </label>
      </div>
      <button
        type="submit"
        className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
        style={{
          background: "oklch(0.696 0.17 162.48)",
          color: "oklch(0.138 0.032 243)",
        }}
        data-ocid="chat.add_enviado.submit"
      >
        Confirmar pedido enviado
      </button>
    </form>
  );
}

// ---- Main component ---------------------------------------------------------

export default function ChatPage({
  historial,
  pedidos,
  onAddPedidoEnviado,
}: ChatPageProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = getFromLS<ChatMessage[]>("chatHistory", []);
    if (saved.length > 0) return saved;
    return [{ id: "welcome", role: "bot", text: WELCOME_MSG }];
  });
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem("chatHistory", JSON.stringify(messages));
    } catch {
      // quota exceeded — ignore
    }
  }, [messages]);

  const msgCount = messages.length;
  const prevCount = useRef(0);
  if (prevCount.current !== msgCount) {
    prevCount.current = msgCount;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  function addMessage(msg: Omit<ChatMessage, "id">) {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now().toString() + Math.random() },
    ]);
  }

  function handleSend(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText) return;
    setInput("");
    addMessage({ role: "user", text: userText });

    setTimeout(() => {
      const response = buildBotResponse(userText, historial, pedidos);
      addMessage({ role: "bot", text: response.text, action: response.action });
    }, 320);
  }

  function handlePdfAction(action: PdfAction) {
    const semana = getFromLS<{ week: string; hecho: number }>("semana", {
      week: "",
      hecho: 0,
    });
    const objetivo = getFromLS<number>("objetivo", 5000);
    const lastCode = getFromLS<string>("lastGeneratedCode", "");

    if (action.handler === "resumen") {
      generateResumenPdf(historial, pedidos, semana, objetivo, lastCode);
    } else if (
      action.handler === "barcode_entry" &&
      action.entryIndex !== undefined
    ) {
      const entry = historial[action.entryIndex];
      if (entry) generateBarcodePdfFromEntry(entry);
    } else if (
      action.handler === "sincodigo_entry" &&
      action.entryIndex !== undefined
    ) {
      const entry = historial[action.entryIndex];
      if (entry) generateSinCodigoPdfFromEntry(entry);
    }
    addMessage({
      role: "bot",
      text: "📄 Se ha abierto una nueva ventana con el PDF. Usa Ctrl+P o el diálogo del navegador para guardarlo o imprimirlo.",
    });
  }

  function handleAddEnviado(p: PedidoEnviado) {
    onAddPedidoEnviado?.(p);
    addMessage({
      role: "bot",
      text: `✅ ¡Pedido enviado añadido correctamente!\n\n• **Nombre:** ${p.nombre}\n• **Cantidad:** ${p.cantidad.toLocaleString("es")} unidades\n• **Tipo:** ${p.tipo === "matriculas" ? "Matrículas" : p.tipo === "placas" ? "Placas CE" : "Advertencia"}\n\nPuedes verlo en la página "Pedidos Enviados".`,
    });
  }

  function clearChat() {
    setMessages([{ id: "welcome-new", role: "bot", text: WELCOME_MSG }]);
  }

  const cardBg =
    "linear-gradient(135deg, oklch(0.215 0.042 240), oklch(0.245 0.048 240))";
  const cardBorder = "1px solid rgba(255,255,255,0.08)";

  return (
    <div
      className="max-w-3xl mx-auto flex flex-col gap-4"
      style={{ height: "calc(100vh - 140px)" }}
    >
      {/* Header */}
      <div
        className="rounded-2xl px-6 py-4 flex items-center justify-between shrink-0"
        style={{ background: cardBg, border: cardBorder }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
            style={{
              background: "oklch(0.828 0.167 87 / 0.15)",
              border: "1px solid oklch(0.828 0.167 87 / 0.3)",
            }}
          >
            🤖
          </div>
          <div>
            <h2
              className="text-sm font-semibold"
              style={{ color: "oklch(0.942 0.012 236)" }}
            >
              Asistente de Producción
            </h2>
            <p className="text-xs text-muted-foreground">
              Pregúntame sobre códigos, pedidos, historial, genera PDFs o añade
              pedidos enviados
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={clearChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
          style={{
            background: "oklch(0.577 0.245 27.325 / 0.15)",
            color: "oklch(0.8 0.15 27)",
            border: "1px solid oklch(0.577 0.245 27.325 / 0.25)",
          }}
          title="Limpiar conversación"
          data-ocid="chat.clear_button"
        >
          <Trash2 size={12} />
          Limpiar chat
        </button>
      </div>

      {/* Messages area */}
      <div
        className="flex-1 rounded-2xl overflow-y-auto p-4 flex flex-col gap-3 min-h-0"
        style={{ background: cardBg, border: cardBorder }}
        data-ocid="chat.messages_area"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {msg.role === "bot" && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                style={{
                  background: "oklch(0.295 0.052 240)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                aria-label="Asistente"
              >
                🤖
              </div>
            )}

            <div
              className={`flex flex-col gap-2 max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              {msg.role === "bot" && (
                <span className="text-[10px] text-muted-foreground font-medium ml-1">
                  Asistente
                </span>
              )}

              <div
                className="rounded-2xl px-4 py-3 text-xs leading-relaxed"
                style={
                  msg.role === "user"
                    ? {
                        background: "oklch(0.828 0.167 87)",
                        color: "oklch(0.138 0.032 243)",
                        borderBottomRightRadius: "4px",
                      }
                    : {
                        background: "oklch(0.175 0.038 242)",
                        color: "oklch(0.92 0.012 236)",
                        border: "1px solid rgba(255,255,255,0.07)",
                        borderBottomLeftRadius: "4px",
                      }
                }
                data-ocid={`chat.message.${msg.role}`}
              >
                {renderText(msg.text)}
              </div>

              {/* PDF action button */}
              {msg.action?.type === "pdf" && (
                <button
                  type="button"
                  onClick={() => handlePdfAction(msg.action as PdfAction)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
                  style={{
                    background: "oklch(0.828 0.167 87)",
                    color: "oklch(0.138 0.032 243)",
                  }}
                  data-ocid="chat.pdf_action_button"
                >
                  <FileDown size={13} />
                  {(msg.action as PdfAction).label}
                </button>
              )}

              {/* Add Enviado inline form */}
              {msg.action?.type === "add_enviado" && onAddPedidoEnviado && (
                <AddEnviadoForm
                  prefill={(msg.action as AddEnviadoAction).prefill}
                  onConfirm={handleAddEnviado}
                />
              )}
            </div>

            {msg.role === "user" && (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 mt-0.5 font-bold"
                style={{
                  background: "oklch(0.828 0.167 87 / 0.2)",
                  color: "oklch(0.828 0.167 87)",
                }}
                aria-label="Tú"
              >
                TÚ
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      <div
        className="flex flex-wrap gap-2 shrink-0"
        data-ocid="chat.quick_questions"
      >
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleSend(q)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80 active:scale-95"
            style={{
              background: "oklch(0.215 0.042 240)",
              color: "oklch(0.828 0.167 87)",
              border: "1px solid oklch(0.828 0.167 87 / 0.25)",
            }}
            data-ocid={`chat.quick_q.${q
              .replace(/[^a-z0-9]/gi, "_")
              .toLowerCase()
              .slice(0, 30)}`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div
        className="rounded-2xl p-3 flex items-center gap-3 shrink-0"
        style={{ background: cardBg, border: cardBorder }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Escribe tu pregunta... (ej: añadir pedido enviado: Cliente ABC, 300 matrículas)"
          className="flex-1 bg-transparent border border-white/15 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
          style={{ color: "oklch(0.92 0.012 236)" }}
          data-ocid="chat.input"
          aria-label="Pregunta al asistente"
        />
        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: "oklch(0.828 0.167 87)",
            color: "oklch(0.138 0.032 243)",
          }}
          data-ocid="chat.send_button"
          aria-label="Enviar mensaje"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
