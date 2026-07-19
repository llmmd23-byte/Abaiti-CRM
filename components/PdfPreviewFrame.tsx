"use client";

import {useEffect, useMemo, useRef, useState} from "react";

const workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

let pdfjsModulePromise: Promise<any> | null = null;

function loadPdfjsModule() {
  if (!pdfjsModulePromise) {
    pdfjsModulePromise = import("pdfjs-dist/build/pdf.mjs");
  }
  return pdfjsModulePromise;
}

type PdfPreviewFrameProps = {
  src: string;
  title: string;
  className?: string;
  minHeight?: number;
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const safeSrc = useMemo(() => normalizePdfUrl(src), [src]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host || !safeSrc) return;

    let canceled = false;
    let renderRequestId = 0;
    let resizeTimer: number | undefined;
    let currentLoadingTask:
      | {
          destroy?: () => Promise<void>;
        }
      | null = null;
    let currentRenderTask:
      | {
          cancel?: () => void;
        }
      | null = null;

    const renderPage = async () => {
      const requestId = ++renderRequestId;
      try {
        setStatus("loading");
        currentRenderTask?.cancel?.();
        currentRenderTask = null;
        void currentLoadingTask?.destroy?.();
        currentLoadingTask = null;

        const pdfjsLib = await loadPdfjsModule();
        if (canceled || requestId !== renderRequestId) return;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

        const response = await fetch(safeSrc, {cache: "no-store"});
        if (!response.ok) throw new Error("PDF_FETCH_FAILED");

        const buffer = await response.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({data: buffer});
        currentLoadingTask = loadingTask;
        const pdf = await loadingTask.promise;
        if (canceled || requestId !== renderRequestId) {
          await pdf.destroy?.();
          return;
        }

        const page = await pdf.getPage(1);
        if (canceled || requestId !== renderRequestId) {
          await pdf.destroy?.();
          return;
        }

        const pageViewport = page.getViewport({scale: 1});
        const availableWidth = Math.max(host.clientWidth - 24, 320);
        const availableHeight = Math.max(host.clientHeight - 24, 320);
        const widthScale = availableWidth / pageViewport.width || 1;
        const heightScale = availableHeight / pageViewport.height || 1;
        const scale = Math.min(1.1, widthScale, heightScale);
        const viewport = page.getViewport({scale});
        const context = canvas.getContext("2d");
        if (!context) throw new Error("CANVAS_CONTEXT_UNAVAILABLE");

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.maxWidth = "100%";
        canvas.style.maxHeight = "100%";
        canvas.style.display = "block";

        context.clearRect(0, 0, canvas.width, canvas.height);
        const renderTask = page.render({canvasContext: context, viewport});
        currentRenderTask = renderTask;
        await renderTask.promise;
        if (!canceled && requestId === renderRequestId) setStatus("ready");
      } catch {
        if (!canceled && requestId === renderRequestId) setStatus("error");
      }
    };

    void renderPage();

    const scheduleRender = () => {
      if (canceled) return;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!canceled) void renderPage();
      }, 120);
    };

    if (typeof ResizeObserver === "function") {
      const observer = new ResizeObserver(scheduleRender);
      observer.observe(host);

      return () => {
        canceled = true;
        if (resizeTimer) window.clearTimeout(resizeTimer);
        observer.disconnect();
        currentRenderTask?.cancel?.();
        void currentLoadingTask?.destroy?.();
      };
    }

    window.addEventListener("resize", scheduleRender);

    return () => {
      canceled = true;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", scheduleRender);
      currentRenderTask?.cancel?.();
      void currentLoadingTask?.destroy?.();
    };
  }, [safeSrc]);

  return (
    <div
      ref={hostRef}
      className={`pdf-preview-frame ${className}`.trim()}
      style={{minHeight, overflow: "hidden"}}
    >
      {status !== "ready" ? (
        <div className="pdf-preview-placeholder">
          <span>{status === "loading" ? "Loading preview..." : `Unable to preview ${title}`}</span>
          <a href={safeSrc} target="_blank" rel="noreferrer">
            Open PDF
          </a>
        </div>
      ) : null}
      <canvas ref={canvasRef} aria-label={title} />
    </div>
  );
}
