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
import { useCanvas } from "@/hooks/useCanvas";
import { useWatermarkSettings } from "@/hooks/useWatermarkSettings";
import { useEffect, useMemo } from "react";
import { HexColorPicker } from "react-colorful";

export default function Home() {
  const { settings, setSettings } = useWatermarkSettings();
  const {
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
  } = useCanvas(settings);

  const opacityValue = useMemo(() => [settings.opacity], [settings.opacity]);
  const fontSizeValue = useMemo(() => [settings.fontSize], [settings.fontSize]);

  useEffect(() => {
    drawWatermark();
  }, [settings]);

  return (
    <div className="flex min-h-screen flex-col p-8 gap-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-indigo-600">Watermarker</h1>
        <p className="text-sm text-slate-500">
          Add text watermarks to your images.
        </p>
      </div>
      <div
        className="w-full border-2 border-dashed border-indigo-200 rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-slate-500 bg-white shadow-sm hover:border-indigo-400 transition-colors"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) loadFile(file);
        }}
      >
        <p className="text-sm">Drag & drop a JPEG, PNG or PDF here, or</p>
        <Input
          type="file"
          accept="image/jpeg,image/png,application/pdf"
          className="w-fit"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
          }}
        />
        {fileName && <p className="text-sm text-gray-400">{fileName}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col items-center justify-start gap-2">
          {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
          <canvas ref={canvasRef} className="max-w-full rounded shadow" />
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => {
                  const p = currentPage - 1;
                  renderPdfPage(pdfDocRef.current!, p);
                }}
              >
                Prev
              </Button>
              <span className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => {
                  const p = currentPage + 1;
                  renderPdfPage(pdfDocRef.current!, p);
                }}
              >
                Next
              </Button>
            </div>
          )}
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
            {!settings.text.trim() && (
              <p className="text-xs text-slate-400 mt-1">
                Enter text to enable download.
              </p>
            )}
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
          {fileName && !fileName.endsWith(".pdf") && (
            <Button
              onClick={exportImage}
              disabled={!settings.text.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Download Image
            </Button>
          )}
          {fileName && fileName.endsWith(".pdf") && (
            <Button
              onClick={exportPdf}
              disabled={isLoading || !settings.text.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isLoading ? "Processing..." : "Download PDF"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
