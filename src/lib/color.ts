/**
 * Real colour work: dominant colour is measured from the captured pixels, not faked.
 * Naming and the duplicate-detection distance both run in CIE Lab so that
 * "close" means perceptually close rather than close in raw RGB.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Lab {
  l: number
  a: number
  b: number
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const hex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`
}

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

export function rgbToLab({ r, g, b }: Rgb): Lab {
  // sRGB -> linear
  const lin = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  const R = lin(r)
  const G = lin(g)
  const B = lin(b)

  // linear sRGB -> XYZ (D65)
  const x = R * 0.4124564 + G * 0.3575761 + B * 0.1804375
  const y = R * 0.2126729 + G * 0.7151522 + B * 0.072175
  const z = R * 0.0193339 + G * 0.119192 + B * 0.9503041

  // XYZ -> Lab, normalised to the D65 white point
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const fx = f(x / 0.95047)
  const fy = f(y / 1.0)
  const fz = f(z / 1.08883)

  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

/** CIE76 colour difference. Roughly: under 10 reads as the same colour to an eye. */
export function colorDistance(a: string, b: string): number {
  const la = rgbToLab(hexToRgb(a))
  const lb = rgbToLab(hexToRgb(b))
  return Math.sqrt((la.l - lb.l) ** 2 + (la.a - lb.a) ** 2 + (la.b - lb.b) ** 2)
}

/**
 * Dominant colour by coarse histogram: bucket every sampled pixel into a 32-step
 * RGB cube, take the fullest bucket, then average the true values inside it.
 * Beats a plain mean, which turns any two-tone garment into mud.
 */
export function dominantColor(data: Uint8ClampedArray): Rgb {
  const buckets = new Map<number, { r: number; g: number; b: number; n: number }>()
  const step = 4 * Math.max(1, Math.floor(data.length / 4 / 12000)) // sample ~12k pixels

  for (let i = 0; i < data.length; i += step) {
    const alpha = data[i + 3]
    if (alpha < 128) continue
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const key = ((r >> 5) << 10) | ((g >> 5) << 5) | (b >> 5)
    const bucket = buckets.get(key)
    if (bucket) {
      bucket.r += r
      bucket.g += g
      bucket.b += b
      bucket.n += 1
    } else {
      buckets.set(key, { r, g, b, n: 1 })
    }
  }

  let best: { r: number; g: number; b: number; n: number } | null = null
  for (const bucket of buckets.values()) {
    if (!best || bucket.n > best.n) best = bucket
  }
  if (!best) return { r: 128, g: 128, b: 128 }
  return { r: best.r / best.n, g: best.g / best.n, b: best.b / best.n }
}

/** How much colour variation a region holds. Used to drop empty background bands. */
export function colorSpread(data: Uint8ClampedArray): number {
  let sum = 0
  let sumSq = 0
  let n = 0
  const step = 4 * Math.max(1, Math.floor(data.length / 4 / 6000))
  for (let i = 0; i < data.length; i += step) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    sum += luma
    sumSq += luma * luma
    n += 1
  }
  if (n === 0) return 0
  const mean = sum / n
  return Math.sqrt(Math.max(0, sumSq / n - mean * mean))
}

const NAMED_COLORS: Array<[string, string]> = [
  ['Black', '#111111'],
  ['Charcoal', '#3a3a3c'],
  ['Grey', '#8e8e93'],
  ['Silver', '#c7c7cc'],
  ['White', '#f7f5f0'],
  ['Cream', '#efe6d2'],
  ['Beige', '#d9c9ab'],
  ['Tan', '#c19a6b'],
  ['Camel', '#b08050'],
  ['Brown', '#6b4a2f'],
  ['Chocolate', '#3f2a1d'],
  ['Rust', '#9c4a22'],
  ['Orange', '#e2701c'],
  ['Mustard', '#d9a520'],
  ['Yellow', '#f0d33b'],
  ['Olive', '#6f7433'],
  ['Green', '#3f7d46'],
  ['Forest', '#22402c'],
  ['Teal', '#2b6f73'],
  ['Sky', '#7fb3d5'],
  ['Denim', '#4a6a97'],
  ['Blue', '#2b52b5'],
  ['Navy', '#1e2a4a'],
  ['Purple', '#6a4a91'],
  ['Lavender', '#b3a3d4'],
  ['Burgundy', '#5c1f2b'],
  ['Red', '#c02a2a'],
  ['Pink', '#df7f95'],
  ['Blush', '#e9c4c0'],
]

/** Nearest named colour in Lab. Keeps the filter row on Screen 3 to a sane vocabulary. */
export function nameColor(hex: string): string {
  const target = rgbToLab(hexToRgb(hex))
  let bestName = 'Grey'
  let bestDist = Infinity
  for (const [name, swatch] of NAMED_COLORS) {
    const lab = rgbToLab(hexToRgb(swatch))
    const dist = Math.sqrt((target.l - lab.l) ** 2 + (target.a - lab.a) ** 2 + (target.b - lab.b) ** 2)
    if (dist < bestDist) {
      bestDist = dist
      bestName = name
    }
  }
  return bestName
}

export const COLOR_NAMES = NAMED_COLORS.map(([name]) => name)

/** Readable text colour for a swatch background. */
export function contrastInk(hex: string): string {
  const { r, g, b } = hexToRgb(hex)
  const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
  return luma > 0.6 ? '#12110f' : '#f7f5f0'
}

const COLOR_HEX_BY_NAME = new Map(NAMED_COLORS)

/** The swatch behind a named colour, so a user override still has a hex to compare on. */
export function hexForColorName(name: string): string {
  return COLOR_HEX_BY_NAME.get(name) ?? '#8e8e93'
}
