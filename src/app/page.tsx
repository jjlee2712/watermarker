"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  defaultSettings,
  getSinglePosition,
  getTiledPositions,
  WatermarkSettings,
} from "@/lib/watermark";
import { useEffect, useMemo, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [settings, setSettings] = useState<WatermarkSettings>(defaultSettings);

  const opacityValue = useMemo(() => [settings.opacity], [settings.opacity]);
  const fontSizeValue = useMemo(() => [settings.fontSize], [settings.fontSize]);

  const colorDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    drawWatermark();
  }, [settings]);

  useEffect(() => {
    if (!hasLoaded) return;
    localStorage.setItem("watermark-settings", JSON.stringify(settings));
  }, [settings, hasLoaded]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("watermark-settings");
      if (saved) setSettings(JSON.parse(saved));
    } catch {}
    setHasLoaded(true);
  }, []);

  const drawImageToCanvas = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.height = img.naturalHeight;
      canvas.width = img.naturalWidth;
      canvas.getContext("2d")?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      drawWatermark();
    };
    img.src = url;
  };

  const drawWatermark = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(img, 0, 0);
    context.globalAlpha = settings.opacity;
    context.fillStyle = settings.color;
    context.font = `${settings.fontSize}px ${settings.fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";

    if (settings.mode == "single") {
      const { x, y } = getSinglePosition(canvas.width, canvas.height);
      context.fillText(settings.text, x, y);
    } else {
      const measured = context.measureText(settings.text);
      const positions = getTiledPositions(
        canvas.width,
        canvas.height,
        measured.width,
        settings.fontSize,
      );
      for (const { x, y } of positions) {
        context.fillText(settings.text, x, y);
      }
    }
    context.globalAlpha = 1;
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isPng = fileName?.endsWith(".png");
    const mimeType = isPng ? "image/png" : "image/jpeg";
    const quality = isPng ? undefined : 0.92;
    const ext = isPng ? "png" : "jpg";

    const url = canvas.toDataURL(mimeType, quality);
    const a = document.createElement("a");
    a.href = url;
    a.download = `watermarked.${ext}`;
    a.click();
  };

  return (
    <div className="flex min-h-screen flex-col p-8 gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-indigo-600">Watermarker</h1>
        <p className="text-sm text-slate-500">
          Add text watermarks to your images.
        </p>
      </div>
      <div
        className="w-full border-2 border-dashed border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-slate-500 bg-white shadow-sm
  hover:border-indigo-400 transition-colors"
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
        <p className="text-sm">Drag & drop a JPEG or PNG here, or</p>
        <Input
          type="file"
          accept="image/jpeg,image/png"
          className="w-fit"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFileName(file.name);
              drawImageToCanvas(file);
            }
          }}
        />
        {fileName && <p className="text-sm text-gray-400">{fileName}</p>}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex items-start justify-center">
          <canvas ref={canvasRef} className="max-w-full rounded shadow" />
        </div>

        <div className="flex flex-col gap-4 w-full lg:w-80 bg-white rounded-xl shadow-sm p-6">
          <div>
            <Label>Watermark Text</Label>
            <Input
              value={settings.text}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, text: e.target.value }))
              }
            />
          </div>
          <div>
            <Label>Opacity: {settings.opacity.toFixed(2)}</Label>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={opacityValue}
              onValueChange={(val) =>
                setSettings((prev) => ({ ...prev, opacity: val as number }))
              }
            />
          </div>
          <div>
            <Label>Font Size: {settings.fontSize}px</Label>
            <Slider
              min={12}
              max={200}
              step={1}
              value={fontSizeValue}
              onValueChange={(val) =>
                setSettings((prev) => ({ ...prev, fontSize: val as number }))
              }
            />
          </div>
          <div>
            <Label>Color</Label>
            <HexColorPicker
              color={settings.color}
              onChange={(val) => {
                clearTimeout(colorDebounceRef.current);
                colorDebounceRef.current = setTimeout(() => {
                  setSettings((prev) => ({ ...prev, color: val }));
                }, 50);
              }}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <Label>Font Family</Label>
            <Select
              value={settings.fontFamily}
              onValueChange={(val) =>
                setSettings((prev) => ({ ...prev, fontFamily: val as string }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sans-serif">Sans-serif</SelectItem>
                <SelectItem value="serif">Serif</SelectItem>
                <SelectItem value="monospace">Monospace</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mode</Label>
            <RadioGroup
              value={settings.mode}
              onValueChange={(val) =>
                setSettings((prev) => ({
                  ...prev,
                  mode: val as "single" | "tiled",
                }))
              }
              className="flex gap-4 mt-1"
            >
              <Label className="flex items-center gap-2">
                <RadioGroupItem value="single" />
                Single
              </Label>
              <Label className="flex items-center gap-2">
                <RadioGroupItem value="tiled" />
                Tiled
              </Label>
            </RadioGroup>
          </div>
          {fileName && (
            <Button
              onClick={exportImage}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Download Image
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
