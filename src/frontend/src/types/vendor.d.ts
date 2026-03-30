// Type stubs for CDN-loaded libraries (jsbarcode, jszip)
// These are loaded via <script> tags in index.html

declare class JSZip {
  folder(name: string): JSZip | null;
  file(name: string, data: string, options?: Record<string, unknown>): JSZip;
  generateAsync(
    options: Record<string, unknown>,
    onUpdate?: (meta: { percent: number }) => void,
  ): Promise<Blob>;
}
