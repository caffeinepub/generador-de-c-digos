import { useEffect, useRef } from "react";

export interface BarcodeConfig {
  codigoBase: string;
  barcodeX: number;
  barcodeY: number;
  barcodeWidth: number;
  barcodeHeight: number;
  textX: number;
  textY: number;
  fontSize: number;
}

interface BarcodePreviewProps {
  config: BarcodeConfig;
  code?: string;
}

declare const JsBarcode: (
  element: HTMLElement | SVGElement | string,
  text: string,
  options?: Record<string, unknown>,
) => void;

export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  code: string,
  config: BarcodeConfig,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Create SVG using JsBarcode (loaded via CDN)
      const svgEl = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      JsBarcode(svgEl, code, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        width: 2,
        height: config.barcodeHeight,
      });

      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();

      img.onload = () => {
        const ctx = (canvas as HTMLCanvasElement).getContext("2d");
        if (!ctx) {
          reject(new Error("No ctx"));
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 566, 188);
        ctx.drawImage(
          img,
          config.barcodeX,
          config.barcodeY,
          config.barcodeWidth,
          config.barcodeHeight,
        );
        ctx.fillStyle = "#000000";
        ctx.font = `bold ${config.fontSize}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(code, config.textX, config.textY);
        URL.revokeObjectURL(url);
        resolve();
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Image load failed"));
      };

      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}

export default function BarcodePreview({ config, code }: BarcodePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const displayCode = code ?? config.codigoBase;

  useEffect(() => {
    if (!canvasRef.current || !displayCode) return;
    renderBarcodeToCanvas(canvasRef.current, displayCode, config).catch(
      console.error,
    );
  }, [config, displayCode]);

  return (
    <div className="flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={566}
        height={188}
        className="rounded-lg border border-white/10"
        style={{ maxWidth: "100%", background: "#fff" }}
      />
    </div>
  );
}
