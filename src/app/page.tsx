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
      <Button
        onClick={exportImage}
        className="mt-4"
        disabled={!canvasRef.current}
      >
        Download Image
      </Button>
      <div className="mt-6 flex flex-col gap-4 w-full max-w-md">
        <div>
          <Label>Watermark Label</Label>
          <Input
            value={settings.text}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, text: e.target.value }))
            }
          />
        </div>
        <div>
          <Label>Opacity: {settings.opacity}</Label>
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
          <Label>Font Size: {settings.fontSize}</Label>
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
            onChange={(val) => setSettings((prev) => ({ ...prev, color: val }))}
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
              <SelectItem value="sans-serif">Sans-Serif</SelectItem>
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
      </div>
    </div>
  );
}
