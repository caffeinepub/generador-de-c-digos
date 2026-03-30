# Generador de Códigos

## Current State
The app has two pages:
- **Page 1**: Barcode generator with batch ZIP export, print history, orders, and weekly goal.
- **Page 2** (`ManualPrintPage`): Manual print registration form (date, time, start code, end code, lots, total images) + print history table with PDF export.

`HistorialEntry` type has: id, fecha, hora?, codigoInicio, codigoFin, lotes, totalImagenes.

## Requested Changes (Diff)

### Add
- **`operario` field** to `HistorialEntry` type (optional string).
- **Operario input** to the Page 2 registration form (text field for operator name).
- **Print button** on Page 2 that opens the browser print dialog (window.print()).
- **Page 3 tab** ("Historial") in the navigation.
- **New `HistorialPage` component** that shows the complete print history table (all entries from localStorage).
  - Columns: Fecha, Hora, Operario, Cód. Inicio, Cód. Fin, Lotes, Total Imgs, Actions.
  - Each row has a "PDF Códigos" button that generates a popup PDF with one barcode per code from codigoInicio to codigoFin (totalImagenes barcodes in total), using JsBarcode via CDN in the popup window. Codes are incremented sequentially from codigoInicio using parseCode/buildCode logic (extract numeric suffix, increment by 1 per code).
  - The popup auto-triggers window.print().
  - "Borrar todo" button to clear historial.
  - Individual delete per row.

### Modify
- **`HistorialEntry`** interface: add `operario?: string`.
- **`ManualPrintPage`**: add operario state + form field (text input); include operario in submitted entry; add "Imprimir" button (window.print()).
- **`PrintHistory`**: add Operario column in table (show dash if empty); show operario in existing rows.
- **`App.tsx`**: extend `ActivePage` type to include `'historial'`; add Page 3 tab; render `HistorialPage` for `activePage === 'historial'`; pass historial + handlers.
- **`BatchSystem.tsx`**: include `hora` (current time) in the HistorialEntry when generating the ZIP (it currently omits hora).

### Remove
- Nothing removed.

## Implementation Plan
1. Update `HistorialEntry` interface in `PrintHistory.tsx` to add `operario?: string` and add Operario column to table.
2. Update `ManualPrintPage.tsx` to add operario field + print button.
3. Create `HistorialPage.tsx` component with full history table and per-row barcode PDF download.
4. Update `App.tsx` to add Page 3 tab and render `HistorialPage`.
5. Fix `BatchSystem.tsx` to include `hora` in the generated entry.
