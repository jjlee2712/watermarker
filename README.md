# Watermarker

A free, fully client-side tool for stamping text watermarks onto images and PDFs. No server, no uploads — all processing happens in the browser.

## Features

- Upload JPEG, PNG, or PDF files via drag-and-drop or file picker
- Live watermark preview as you adjust settings
- Single (centered) or tiled watermark placement
- Customisable text, opacity, font size, color, and font family
- Multi-page PDF navigation
- Full-resolution image export (JPEG at 0.92 quality, PNG lossless)
- PDF export with watermark stamped on every page
- Settings remembered across sessions via localStorage

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Base UI) |
| PDF Rendering | pdfjs-dist 6 |
| PDF Authoring | pdf-lib |
| Color Picker | react-colorful |
| Unit Testing | Vitest |
| Package Manager | pnpm |

## Project Structure

```
src/
├── app/
│   └── page.tsx              # UI — calls hooks, renders JSX
├── hooks/
│   ├── useWatermarkSettings.ts  # Settings state + localStorage persistence
│   └── useCanvas.ts             # File loading, canvas drawing, PDF export
└── lib/
    ├── watermark.ts          # Pure functions: positioning logic, default settings
    └── watermark.test.ts     # Vitest unit tests
```

## Getting Started

```bash
pnpm install
pnpm dev
```

## Running with Docker

```bash
docker build -t watermarker .
docker run -p 3000:3000 watermarker
```

## Running Tests

```bash
pnpm test
```

## How It Works

### Images
1. File is read into an `HTMLImageElement` and drawn onto a `<canvas>`
2. Watermark text is drawn on top using the Canvas 2D API
3. Export uses `canvas.toDataURL()` to produce the final image

### PDFs
1. File bytes are passed to pdfjs-dist, which renders each page onto a `<canvas>` via a Web Worker
2. The rendered page is snapshotted as an `ImageBitmap` for fast redraws
3. Watermark text is drawn on top of the bitmap on every settings change
4. Export uses pdf-lib to stamp text directly onto each PDF page in PDF point space, producing a valid vector PDF
