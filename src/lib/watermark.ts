export type WatermarkSettings = {
    text: string;
    opacity: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    mode: "single" | "tiled";
  };

  export const defaultSettings: WatermarkSettings = {
    text: "Confidential",
    opacity: 0.5,
    fontSize: 48,
    color: "#ffffff",
    fontFamily: "sans-serif",
    mode: "single",
  };

  export function getTiledPositions(
    canvasWidth: number,
    canvasHeight: number,
    textWidth: number,
    fontSize: number
  ): { x: number; y: number }[] {
    const cellWidth = textWidth + fontSize * 2;
    const cellHeight = fontSize * 10;
    const positions: { x: number; y: number }[] = [];

    for (let y = fontSize; y < canvasHeight; y += cellHeight) {
      for (let x = textWidth / 2; x < canvasWidth; x += cellWidth) {
        positions.push({ x, y });
      }
    }

    return positions;
  }

  export function getSinglePosition(
    canvasWidth: number,
    canvasHeight: number
  ): { x: number; y: number } {
    return { x: canvasWidth / 2, y: canvasHeight / 2 };
  }