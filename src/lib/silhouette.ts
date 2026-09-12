import { contrastInk, hexToRgb, rgbToHex } from './color'

/**
 * Seed items need a photo preview each, and a mock-up should not depend on remote
 * images loading. So the preview is a flat-lay garment silhouette drawn as an inline
 * SVG data URI in the item's own colour: offline-safe, zero dependencies, and it
 * reads as a product shot at tile size.
 *
 * Items logged through the camera use their real crop instead.
 */

const SHAPES: Array<{ match: RegExp; paths: string[]; detail?: string[] }> = [
  {
    match: /t-shirt|tee|tank|polo/i,
    paths: [
      'M70 40 L54 48 L36 74 L54 90 L64 78 L64 222 L136 222 L136 78 L146 90 L164 74 L146 48 L130 40 C120 54 80 54 70 40 Z',
    ],
    detail: ['M84 42 C92 56 108 56 116 42'],
  },
  {
    match: /sweater|crewneck|knit|cardigan|sweatshirt|hoodie/i,
    paths: [
      'M70 40 L44 52 L28 152 L54 162 L64 104 L64 224 L136 224 L136 104 L146 162 L172 152 L156 52 L130 40 C120 54 80 54 70 40 Z',
    ],
    detail: ['M82 42 C92 58 108 58 118 42', 'M64 210 L136 210'],
  },
  {
    match: /shirt|blouse|button/i,
    paths: [
      'M72 42 L52 50 L38 132 L58 140 L66 96 L66 224 L134 224 L134 96 L142 140 L162 132 L148 50 L128 42 L100 62 Z',
    ],
    detail: ['M100 62 L100 224', 'M72 42 L100 62 L128 42'],
  },
  {
    match: /coat|jacket|blazer|parka|trench/i,
    paths: [
      'M68 38 L40 52 L24 160 L50 170 L60 110 L60 232 L140 232 L140 110 L150 170 L176 160 L160 52 L132 38 L100 74 Z',
    ],
    detail: ['M100 74 L100 232', 'M68 38 L100 74 L132 38'],
  },
  {
    match: /jeans|denim/i,
    paths: ['M64 38 L136 38 L142 234 L112 234 L100 124 L88 234 L58 234 Z'],
    detail: ['M64 54 L136 54', 'M100 54 L100 124'],
  },
  {
    match: /trouser|chino|pant|slack/i,
    paths: ['M66 38 L134 38 L140 234 L110 234 L100 128 L90 234 L60 234 Z'],
    detail: ['M100 44 L100 128'],
  },
  {
    match: /short/i,
    paths: ['M66 44 L134 44 L138 156 L108 156 L100 106 L92 156 L62 156 Z'],
    detail: ['M66 58 L134 58'],
  },
  {
    match: /skirt/i,
    paths: ['M72 48 L128 48 L152 204 L48 204 Z'],
    detail: ['M72 62 L128 62', 'M92 62 L86 204', 'M108 62 L114 204'],
  },
  {
    match: /dress|gown/i,
    paths: [
      'M72 40 L56 50 L66 92 L50 218 L150 218 L134 92 L144 50 L128 40 C120 54 80 54 72 40 Z',
    ],
    detail: ['M84 42 C92 56 108 56 116 42', 'M70 120 L130 120'],
  },
  {
    match: /sneaker|trainer|running/i,
    paths: [
      'M28 188 C36 146 70 136 98 144 L124 126 L152 148 L176 160 C186 168 186 182 176 190 Z',
    ],
    detail: ['M28 188 L176 190', 'M98 144 L124 126'],
  },
  {
    match: /boot/i,
    paths: ['M70 56 L122 56 L128 152 L172 166 C182 172 182 186 172 192 L64 192 L60 140 Z'],
    detail: ['M64 176 L176 180'],
  },
  {
    match: /loafer|derby|oxford|flat|heel|sandal|mule/i,
    paths: ['M38 182 C46 156 80 148 112 152 L154 160 C176 164 182 178 172 188 Z'],
    detail: ['M38 182 L172 188', 'M104 152 L112 176'],
  },
  {
    match: /bag|tote|purse|backpack/i,
    paths: ['M60 92 L140 92 L150 206 L50 206 Z'],
    detail: ['M76 92 C76 56 124 56 124 92'],
  },
  {
    match: /hat|cap|beanie/i,
    paths: ['M58 150 C58 100 142 100 142 150 Z', 'M30 150 L170 150 L170 166 L30 166 Z'],
  },
  {
    match: /scarf|belt/i,
    paths: ['M76 46 L124 46 L124 212 L76 212 Z'],
    detail: ['M76 196 L124 196'],
  },
]

const FALLBACK = SHAPES[0]

function shapeFor(type: string, category: string) {
  return SHAPES.find((shape) => shape.match.test(type)) ?? SHAPES.find((shape) => shape.match.test(category)) ?? FALLBACK
}

/** Slightly darken a colour for the shadow side, so the flat fill still reads as an object. */
function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex)
  return rgbToHex({ r: r * amount, g: g * amount, b: b * amount })
}

export function silhouette(type: string, category: string, colorHex: string): string {
  const shape = shapeFor(type, category)
  const ink = contrastInk(colorHex)
  const outline = shade(colorHex, 0.74)
  const detail = shape.detail ?? []

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 260" width="200" height="260">
<rect width="200" height="260" fill="#efeae3"/>
<rect x="6" y="6" width="188" height="248" fill="#faf7f2"/>
${shape.paths
  .map((d) => `<path d="${d}" fill="${colorHex}" stroke="${outline}" stroke-width="1.8" stroke-linejoin="round"/>`)
  .join('\n')}
${detail
  .map(
    (d) =>
      `<path d="${d}" fill="none" stroke="${ink}" stroke-opacity="0.22" stroke-width="2" stroke-linecap="round"/>`,
  )
  .join('\n')}
</svg>`

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
