"use client";

import { useRef, useState } from "react";
import { FiUploadCloud, FiDownload, FiLoader, FiAlertCircle } from "react-icons/fi";

interface Props { locale?: string; }
type Pos = "bottom-center" | "bottom-right" | "bottom-left" | "top-center" | "top-right" | "top-left";

export default function PDFPageNumbers({ locale = "es" }: Props) {
  const isEs = locale === "es";
  const [file, setFile] = useState<File | null>(null);
  const [pos, setPos] = useState<Pos>("bottom-center");
  const [start, setStart] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const run = async () => {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const { PDFDocument, rgb, StandardFonts } = await import("pdf-lib");
      const doc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()));
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const pages = doc.getPages();
      pages.forEach((page, i) => {
        const { width, height } = page.getSize();
        const label = `${start + i}`;
        const size = 11;
        const tw = font.widthOfTextAtSize(label, size);
        const m = 24;
        const isTop = pos.startsWith("top");
        const y = isTop ? height - m - size : m;
        let x = (width - tw) / 2;
        if (pos.endsWith("right")) x = width - m - tw;
        else if (pos.endsWith("left")) x = m;
        page.drawText(label, { x, y, size, font, color: rgb(0.3, 0.3, 0.3) });
      });
      const bytes = await doc.save();
      const blob = new Blob([bytes as unknown as BlobPart], { type: "application/pdf" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name.replace(/\.pdf$/i, "") + "-numbered.pdf"; a.click(); URL.revokeObjectURL(a.href);
    } catch { setError(isEs ? "No se pudo procesar el PDF." : "Could not process the PDF."); }
    setBusy(false);
  };

  const posLabels: Record<Pos, string> = {
    "bottom-center": isEs ? "Abajo centro" : "Bottom center", "bottom-right": isEs ? "Abajo derecha" : "Bottom right", "bottom-left": isEs ? "Abajo izquierda" : "Bottom left",
    "top-center": isEs ? "Arriba centro" : "Top center", "top-right": isEs ? "Arriba derecha" : "Top right", "top-left": isEs ? "Arriba izquierda" : "Top left",
  };

  return (
    <div className="space-y-5">
      <div onClick={() => inputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f?.type === "application/pdf") { setFile(f); setError(""); } }} className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/40 bg-surface/30 px-6 py-12 text-center hover:border-primary/40">
        <FiUploadCloud className="text-3xl text-primary/70" />
        <p className="text-sm font-medium text-text">{file ? file.name : (isEs ? "Sube un PDF" : "Upload a PDF")}</p>
        <p className="text-xs text-text-muted/60">{isEs ? "100% en tu navegador" : "100% in your browser"}</p>
        <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); }} />
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border/20 bg-surface/30 p-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{isEs ? "Posición" : "Position"}</span>
          <select value={pos} onChange={(e) => setPos(e.target.value as Pos)} className="rounded-lg border border-border/30 bg-surface/60 px-2 py-1.5 text-xs text-text outline-none">
            {(Object.keys(posLabels) as Pos[]).map((p) => <option key={p} value={p}>{posLabels[p]}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{isEs ? "Empezar en" : "Start at"}</span>
          <input type="number" min={0} value={start} onChange={(e) => setStart(parseInt(e.target.value) || 0)} className="w-20 rounded-lg border border-border/30 bg-surface/60 px-2 py-1.5 text-xs text-text outline-none" />
        </div>
      </div>
      {error && <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"><FiAlertCircle /> {error}</div>}
      <button onClick={run} disabled={!file || busy} className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 disabled:opacity-40">
        {busy ? <FiLoader className="animate-spin" /> : <FiDownload />} {isEs ? "Numerar y descargar" : "Number & download"}
      </button>
    </div>
  );
}
