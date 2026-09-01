"use client";

import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const drawImageToCanvas = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.height = img.naturalHeight;
      canvas.width = img.naturalWidth;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center p-8"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
          setFileName(file.name);
          drawImageToCanvas(file);
        }
      }}
    >
      <Input
        type="file"
        accept="image/jpeg,image/png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setFileName(file.name);
            drawImageToCanvas(file);
          }
        }}
      />
      {fileName && <p className="mt-2 text-sm text-gray-500">{fileName}</p>}
      <canvas ref={canvasRef} className="mt-4 max-w-full" />
    </div>
  );
}
