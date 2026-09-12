import type { Category } from '../types'
import { colorDistance, nameColor } from './color'

/**
 * The guess pipeline, deliberately shallow — this is a comprehension mock-up, not
 * an ML product. Honest about which signals are real:
 *
 *   colour    — measured from the captured pixels (see color.ts). Real.
 *   type      — inferred from where the piece sits in the frame, nudged by colour.
 *               A band across the shoulders is a top; a band at the floor is shoes.
 *               More reliable on a webcam frame than an ImageNet classifier, which
 *               has almost no garment vocabulary.
 *   material  — plausible placeholder drawn from the common fibres for that
 *               category. Presented as a suggestion, never as fact.
 *   size      — plausible placeholder from the usual run for that category. Same.
 *
 * Everything here returns a suggestion the user overrides in the review form.
 * Swapping in a real classifier later means changing guessType() and nothing else.
 */

export type RegionKey = 'head' | 'upper' | 'lower' | 'feet' | 'single'

export const MATERIALS = [
  'Cotton',
  'Linen',
  'Merino wool',
  'Wool',
  'Cashmere',
  'Denim',
  'Silk',
  'Leather',
  'Suede',
  'Nylon',
  'Polyester',
  'Cotton blend',
] as const

interface RegionPrior {
  category: Category
  types: string[]
  materials: string[]
  sizes: string[]
}

const PRIORS: Record<RegionKey, RegionPrior> = {
  // A close-up fills the frame with one thing. Position says nothing then, so the
  // guess falls back to the most common reason someone shoots a close-up at all.
  single: {
    category: 'Accessories',
    types: ['Shoulder bag', 'Tote bag', 'Necklace', 'Scarf', 'Belt', 'Sunglasses'],
    materials: ['Leather', 'Suede', 'Cotton', 'Silk', 'Nylon'],
    sizes: ['One size'],
  },
  head: {
    category: 'Accessories',
    types: ['Baseball cap', 'Beanie', 'Wide-brim hat', 'Headband', 'Hair clip'],
    materials: ['Cotton', 'Wool', 'Straw', 'Leather'],
    sizes: ['One size'],
  },
  upper: {
    category: 'Tops',
    types: ['T-shirt', 'Crewneck sweater', 'Button-down shirt', 'Knit cardigan', 'Blouse'],
    materials: ['Cotton', 'Merino wool', 'Linen', 'Cotton blend', 'Silk'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
  },
  lower: {
    category: 'Bottoms',
    types: ['Straight jeans', 'Wide-leg trousers', 'Chinos', 'Pleated skirt', 'Tailored shorts'],
    materials: ['Denim', 'Cotton', 'Wool', 'Linen', 'Cotton blend'],
    sizes: ['24', '26', '28', '30', '32', '34'],
  },
  feet: {
    category: 'Shoes',
    types: ['Leather sneakers', 'Loafers', 'Ankle boots', 'Running shoes', 'Sandals'],
    materials: ['Leather', 'Suede', 'Canvas', 'Nylon'],
    sizes: ['6', '7', '8', '9', '10', '11', '12'],
  },
}

export function categoryForRegion(region: RegionKey): Category {
  return PRIORS[region].category
}

export function sizesForCategory(category: Category): string[] {
  if (category === 'Bottoms') return PRIORS.lower.sizes
  if (category === 'Shoes') return PRIORS.feet.sizes
  if (category === 'Accessories') return ['One size', 'S', 'M', 'L']
  return PRIORS.upper.sizes
}

/**
 * Everything a camera pointed at an outfit tends to miss: jewellery too small to
 * resolve, a bag held out of frame, a belt under a coat. Offered as suggestions on
 * the manual add, not as anything the app claims to have seen.
 */
export const ACCESSORY_TYPES = [
  'Tote bag',
  'Shoulder bag',
  'Backpack',
  'Belt',
  'Scarf',
  'Necklace',
  'Earrings',
  'Bracelet',
  'Watch',
  'Rings',
  'Sunglasses',
  'Hair clip',
  'Headband',
  'Baseball cap',
  'Beanie',
] as const

/** Cheap deterministic hash so repeat captures of the same colour suggest the same fibre. */
function hash(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export interface Guess {
  category: Category
  type: string
  color: string
  material: string
  size: string
}

export function guessAttributes(region: RegionKey, colorHex: string): Guess {
  const prior = PRIORS[region]
  const color = nameColor(colorHex)
  const type = guessType(region, colorHex)

  return {
    category: prior.category,
    type,
    color,
    material: guessMaterial(region, colorHex, type),
    size: prior.sizes[hash(colorHex + region) % prior.sizes.length],
  }
}

/**
 * Region gives the category outright. Colour then picks between types inside it —
 * a blue lower band is far more likely to be jeans than trousers, a white lower
 * band far less likely.
 */
function guessType(region: RegionKey, colorHex: string): string {
  const prior = PRIORS[region]
  const looksDenim = colorDistance(colorHex, '#4a6a97') < 26 || colorDistance(colorHex, '#1e2a4a') < 22
  const veryDark = colorDistance(colorHex, '#111111') < 24
  const veryLight = colorDistance(colorHex, '#f7f5f0') < 20

  if (region === 'lower') {
    if (looksDenim) return 'Straight jeans'
    if (veryDark) return 'Wide-leg trousers'
    return prior.types[hash(colorHex) % prior.types.length]
  }
  if (region === 'feet') {
    if (veryLight) return 'Leather sneakers'
    if (veryDark) return 'Ankle boots'
    return prior.types[hash(colorHex) % prior.types.length]
  }
  if (region === 'head' || region === 'single') {
    return prior.types[hash(colorHex) % prior.types.length]
  }
  if (veryDark) return 'Crewneck sweater'
  return prior.types[hash(colorHex) % prior.types.length]
}

function guessMaterial(region: RegionKey, colorHex: string, type: string): string {
  // A type that already names its fibre settles the question — "leather sneakers"
  // should not then be suggested in nylon.
  const named = MATERIALS.find((material) => type.toLowerCase().includes(material.toLowerCase()))
  if (named) return named

  const prior = PRIORS[region]
  if (region === 'lower' && colorDistance(colorHex, '#4a6a97') < 26) return 'Denim'
  return prior.materials[hash(colorHex + 'm') % prior.materials.length]
}

/** Label the piece the way the closet grid will show it, e.g. "Charcoal wool crewneck". */
export function composeName(color: string, material: string, type: string): string {
  const lowerType = type.charAt(0).toLowerCase() + type.slice(1)
  const lowerMaterial = material.toLowerCase()
  // Skip the fibre when the name would stutter — "Denim denim straight jeans".
  if (lowerMaterial === color.toLowerCase()) return `${color} ${lowerType}`
  if (lowerType.includes(lowerMaterial.split(' ')[0])) return `${color} ${lowerType}`
  return `${color} ${lowerMaterial} ${lowerType}`
}
