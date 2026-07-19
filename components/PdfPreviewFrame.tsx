"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PdfPreviewFrameProps = {
  src: string;
  title: string;
  className?: string;
  minHeight?: number;
  fit?: "contain" | "cover";
};

function normalizePdfUrl(value: string) {
  return value.split("#")[0] || value;
}

export default function PdfPreviewFrame({
  src,
  title,
  className = "",
  minHeight = 560,
}: PdfPreviewFrameProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const safeSrc = useMemo(() => normalizePdfUrl(src), [src]);
  const iframeSrc = useMemo(() => `${safeSrc}#toolbar=1&navpanes=0`, [safeSrc]);
  useEffect(() => {
    setStatus("loading");
    const timer = window.setTimeout(() => {
      setStatus("ready");
    }, 100);
    return () => window.clearTimeout(timer);
  }, [safeSrc]);

  return (
    <div
      className={`pdf-preview-frame ${className}`.trim()}
      style={{ minHeight, overflow: "hidden" }}
    >
      {status !== "ready" ? (
        <div className="pdf-preview-placeholder">
          <span>{status === "loading" ? "Loading preview..." : `Unable to preview ${title}`}</span>
          <a href={iframeSrc} target="_blank" rel="noreferrer">
            Open PDF
          </a>
        </div>
      ) : null}
      <iframe
        aria-label={title}
        onLoad={() => setStatus("ready")}
        src={iframeSrc}
        title={title}
      />
    </div>
  );
}
