import { useRef, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  value: string;
  size?: number;
  label?: string;
}

export default function QRCodeGenerator({ value, size = 200, label }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    const svg = canvasRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `qr-${label || "code"}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [size, label]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(value); alert("Link copied!"); } catch { /* ignore */ }
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-3">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div ref={canvasRef} className="rounded-lg border bg-white p-3">
        <QRCodeSVG value={value} size={size} level="M" />
      </div>
      <div className="flex gap-2">
        <button onClick={handleDownload} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">Download PNG</button>
        <button onClick={handleCopy} className="rounded-lg border px-3 py-1.5 text-xs font-medium">Copy Link</button>
      </div>
    </div>
  );
}
