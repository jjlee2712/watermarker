import { getSinglePosition, getTiledPositions, WatermarkSettings } from '@/lib/watermark';
  import type { PDFDocumentProxy } from 'pdfjs-dist';
  import { useRef, useState } from 'react';

  export function useCanvas(settings: WatermarkSettings) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imgRef = useRef<HTMLImageElement | null>(null);
    const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
    const pdfPageBitMapRef = useRef<ImageBitmap | null>(null);
    const pdfBytesRef = useRef<ArrayBuffer | null>(null);
    const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const [fileName, setFileName] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    const drawWatermark = () => {
      const canvas = canvasRef.current;
      const source: CanvasImageSource | null = imgRef.current ?? pdfPageBitMapRef.current;
      if (!canvas || !source) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      context.drawImage(source, 0, 0);
      context.globalAlpha = settings.opacity;
      context.fillStyle = settings.color;
      context.font = `${settings.fontSize}px ${settings.fontFamily}`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';

      if (settings.mode === 'single') {
        const { x, y } = getSinglePosition(canvas.width, canvas.height);
        context.fillText(settings.text, x, y);
      } else {
        const measured = context.measureText(settings.text);
        const positions = getTiledPositions(canvas.width, canvas.height, measured.width, settings.fontSize);
        for (const { x, y } of positions) {
          context.fillText(settings.text, x, y);
        }
      }
      context.globalAlpha = 1;
    };

    const drawImageToCanvas = (file: File) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        imgRef.current = img;
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.height = img.naturalHeight;
        canvas.width = img.naturalWidth;
        canvas.getContext('2d')?.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        drawWatermark();
      };
      img.src = url;
    };

    const renderPdfPage = async (doc: PDFDocumentProxy, pageNum: number) => {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvas, viewport }).promise;

      const bitmap = await createImageBitmap(canvas);
      pdfPageBitMapRef.current = bitmap;
      imgRef.current = null;

      drawWatermark();
    };

    const loadPdf = async (file: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();

        const arrayBuffer = await file.arrayBuffer();
        pdfBytesRef.current = arrayBuffer;
        const doc = await pdfjsLib.getDocument({ data: arrayBuffer.slice(0) }).promise;
        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        await renderPdfPage(doc, 1);
      } catch {
        setError('Failed to load PDF. The file may be corrupted or password-protected.');
      } finally {
        setIsLoading(false);
      }
    };

    const loadFile = (file: File) => {
      setError(null);
      const supported = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!supported.includes(file.type)) {
        setError('Unsupported file type. Please upload a JPEG, PNG, or PDF.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('File is too large. Maximum size is 50MB.');
        return;
      }
      setFileName(file.name);
      imgRef.current = null;
      pdfDocRef.current = null;
      pdfPageBitMapRef.current = null;

      if (file.type === 'application/pdf') {
        loadPdf(file);
      } else {
        drawImageToCanvas(file);
      }
    };

    const exportImage = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const isPng = fileName?.endsWith('.png');
      const mimeType = isPng ? 'image/png' : 'image/jpeg';
      const quality = isPng ? undefined : 0.92;
      const ext = isPng ? 'png' : 'jpg';

      const url = canvas.toDataURL(mimeType, quality);
      const a = document.createElement('a');
      a.href = url;
      a.download = `watermarked.${ext}`;
      a.click();
    };

    const exportPdf = async () => {
      if (!pdfBytesRef.current) return;
      setIsLoading(true);
      setError(null);
      try {
        const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');

        const fontMap: Record<string, (typeof StandardFonts)[keyof typeof StandardFonts]> = {
          'sans-serif': StandardFonts.Helvetica,
          serif: StandardFonts.TimesRoman,
          monospace: StandardFonts.Courier,
        };

        const pdfDoc = await PDFDocument.load(pdfBytesRef.current);
        const font = await pdfDoc.embedFont(fontMap[settings.fontFamily] ?? StandardFonts.Helvetica);

        const r = parseInt(settings.color.slice(1, 3), 16) / 255;
        const g = parseInt(settings.color.slice(3, 5), 16) / 255;
        const b = parseInt(settings.color.slice(5, 7), 16) / 255;
        const pdfFontSize = settings.fontSize / 2;

        for (const page of pdfDoc.getPages()) {
          const { width, height } = page.getSize();
          const textWidth = font.widthOfTextAtSize(settings.text, pdfFontSize);
          const textHeight = pdfFontSize;

          if (settings.mode === 'single') {
            const { x, y } = getSinglePosition(width, height);
            page.drawText(settings.text, {
              x: x - textWidth / 2,
              y: height - y - textHeight / 2,
              size: pdfFontSize,
              font,
              color: rgb(r, g, b),
              opacity: settings.opacity,
            });
          } else {
            const positions = getTiledPositions(width, height, textWidth, pdfFontSize);
            for (const { x, y } of positions) {
              page.drawText(settings.text, {
                x: x - textWidth / 2,
                y: height - y - textHeight / 2,
                size: pdfFontSize,
                font,
                color: rgb(r, g, b),
                opacity: settings.opacity,
              });
            }
          }
        }

        const outputBytes = await pdfDoc.save();
        const blob = new Blob([outputBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'watermarked.pdf';
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        setError('Failed to export PDF. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    return {
      canvasRef,
      colorDebounceRef,
      fileName,
      isLoading,
      error,
      currentPage,
      totalPages,
      loadFile,
      drawWatermark,
      renderPdfPage,
      exportImage,
      exportPdf,
      pdfDocRef,
    };
  }