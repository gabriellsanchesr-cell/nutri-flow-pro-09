import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, ScrollText, FileImage } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  continuous?: boolean;
}

export function PdfViewer({ url, continuous = true }: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [isContinuous, setIsContinuous] = useState(continuous);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);

  // Largura responsiva: o PDF ocupa o container disponível sem precisar scroll horizontal
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth - 24; // padding visual
      setContainerWidth(w > 200 ? w : 200);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  }, []);

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const rotate = () => setRotation(r => (r + 90) % 360);
  const prevPage = () => setPageNumber(p => Math.max(p - 1, 1));
  const nextPage = () => setPageNumber(p => Math.min(p + 1, numPages));
  const pages = Array.from({ length: numPages }, (_, i) => i + 1);

  const pageWidth = containerWidth ? containerWidth * scale : undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 p-2 border-b bg-background rounded-t-md flex-wrap">
        <div className="flex items-center gap-1">
          {!isContinuous && (
            <>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevPage} disabled={pageNumber <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2 min-w-[80px] text-center">
                {pageNumber} / {numPages || "—"}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextPage} disabled={pageNumber >= numPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          {isContinuous && (
            <span className="text-sm px-2 text-muted-foreground">{numPages || "—"} {numPages === 1 ? "página" : "páginas"}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={zoomOut} disabled={scale <= 0.5}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2 min-w-[50px] text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={zoomIn} disabled={scale >= 3}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8 ml-1" onClick={rotate}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 ml-1"
            onClick={() => setIsContinuous(v => !v)}
            title={isContinuous ? "Ver página por página" : "Ver com rolagem contínua"}
          >
            {isContinuous ? <FileImage className="h-4 w-4" /> : <ScrollText className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-muted/50 p-3 sm:p-4">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={<div className="text-sm text-muted-foreground py-8 text-center">Carregando PDF...</div>}
          error={<div className="text-sm text-destructive py-8 text-center">Erro ao carregar PDF.</div>}
        >
          {isContinuous ? (
            <div className="flex flex-col items-center gap-3 pb-4">
              {pages.map((p) => (
                <div key={p} className="shadow-sm bg-white rounded-sm overflow-hidden max-w-full">
                  <Page
                    pageNumber={p}
                    width={pageWidth}
                    rotate={rotation}
                    loading={<div className="text-sm text-muted-foreground p-6">Carregando página {p}...</div>}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="shadow-sm bg-white rounded-sm overflow-hidden max-w-full">
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  rotate={rotation}
                  loading={<div className="text-sm text-muted-foreground p-6">Carregando página...</div>}
                />
              </div>
            </div>
          )}
        </Document>
      </div>
    </div>
  );
}
