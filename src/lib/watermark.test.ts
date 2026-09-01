import { describe, it, expect } from "vitest";
import { defaultSettings, getSinglePosition, getTiledPositions } from "@/lib/watermark";

  describe("getSinglePosition", () => {
    it("returns the center of the canvas", () => {
      const result = getSinglePosition(1000, 800);
      expect(result).toEqual({ x: 500, y: 400 });
    });

    it("works with non-even dimensions", () => {
      const result = getSinglePosition(101, 201);
      expect(result).toEqual({ x: 50.5, y: 100.5 });
    });
  });

  describe("getTiledPositions", () => {
    it("returns at least one position when canvas is larger than one cell", () => {
      const positions = getTiledPositions(1000, 1000, 100, 48);
      expect(positions.length).toBeGreaterThan(0);
    });

    it("first position starts at textWidth/2 and fontSize from top", () => {
      const positions = getTiledPositions(1000, 1000, 100, 48);
      expect(positions[0]).toEqual({ x: 50, y: 48 });
    });

    it("returns empty array when canvas is too small to fit any text", () => {
      const positions = getTiledPositions(10, 10, 200, 48);
      expect(positions).toEqual([]);
    });

    it("columns are spaced by textWidth + fontSize * 2", () => {
      const positions = getTiledPositions(1000, 1000, 100, 48);
      const firstRow = positions.filter(p => p.y === 48);
      const spacing = firstRow[1].x - firstRow[0].x;
      expect(spacing).toBe(100 + 48 * 2); // cellWidth = textWidth + fontSize * 2
    });
  });

  describe("defaultSettings", () => {
    it("has expected default values", () => {
      expect(defaultSettings.text).toBe("Confidential");
      expect(defaultSettings.opacity).toBe(0.5);
      expect(defaultSettings.fontSize).toBe(48);
      expect(defaultSettings.mode).toBe("single");
    });
  });