import { colorSpread, dominantColor, rgbToHex } from './color'
import type { RegionKey } from './guess'

/**
 * Simulated segmentation. Real garment segmentation is out of scope, so the frame
 * is split into three horizontal bands and each band is treated as one piece. The
 * live camera view draws these same bands as framing guides, so the split the user
 * sees is the split the app actually performs — no hidden magic to be confused by.
 */

export interface Band {
  region: RegionKey
  label: string
  /** Fractions of the frame. */
  top: number
  bottom: number
  left: number
  right: number
}

export const BANDS: Band[] = [
  { region: 'upper', label: 'Top', top: 0.06, bottom: 0.44, left: 0.2, right: 0.8 },
  { region: 'lower', label: 'Bottom', top: 0.44, bottom: 0.78, left: 0.22, right: 0.78 },
  { region: 'feet', label: 'Shoes', top: 0.78, bottom: 0.99, left: 0.28, right: 0.72 },
]

export interface Crop {
  region: RegionKey
  label: string
  image: string
  colorHex: string
  spread: number
}

/** Bands flatter than this are almost certainly empty wall or floor, so they drop out. */
const EMPTY_BAND_SPREAD = 7

export interface FrameSource {
  element: CanvasImageSource
  width: number
  height: number
  /** Mirror horizontally so the saved crop matches the mirrored live preview. */
  mirror: boolean
}

export function captureFrame({ element, width, height, mirror }: FrameSource): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  // Cap the long edge — a 4K webcam frame is pointless here and slows the crops down.
  const scale = Math.min(1, 900 / Math.max(width, height))
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  if (mirror) {
    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(element, 0, 0, canvas.width, canvas.height)
  return canvas
}

export function segment(frame: HTMLCanvasElement): Crop[] {
  const crops: Crop[] = []

  for (const band of BANDS) {
    const sx = Math.round(band.left * frame.width)
    const sy = Math.round(band.top * frame.height)
    const sw = Math.max(1, Math.round((band.right - band.left) * frame.width))
    const sh = Math.max(1, Math.round((band.bottom - band.top) * frame.height))

    const crop = document.createElement('canvas')
    crop.width = sw
    crop.height = sh
    const ctx = crop.getContext('2d')
    if (!ctx) continue
    ctx.drawImage(frame, sx, sy, sw, sh, 0, 0, sw, sh)

    const { data } = ctx.getImageData(0, 0, sw, sh)
    const spread = colorSpread(data)
    if (spread < EMPTY_BAND_SPREAD) continue

    crops.push({
      region: band.region,
      label: band.label,
      image: crop.toDataURL('image/jpeg', 0.82),
      colorHex: rgbToHex(dominantColor(data)),
      spread,
    })
  }

  return crops
}
