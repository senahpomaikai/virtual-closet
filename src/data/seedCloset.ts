import type { Category, ClosetItem } from '../types'
import { composeName } from '../lib/guess'
import { silhouette } from '../lib/silhouette'

/**
 * Seed closet. Screen 3's whole job is showing the payoff of accumulated data, so it
 * has to look lived-in on first load: 18 items across every category, with wear counts
 * that spread from "worn once" to "worn to death" so cost per wear actually says
 * something. The hero pieces are deliberately expensive-and-barely-worn versus
 * cheap-and-constant, because that contrast is the insight the persona is after.
 */

interface Seed {
  brand: string
  category: Category
  type: string
  color: string
  colorHex: string
  material: string
  size: string
  price: number
  numWear: number
  daysAgo: number
}

const SEEDS: Seed[] = [
  // Tops
  { brand: 'Marlowe', category: 'Tops', type: 'T-shirt', color: 'White', colorHex: '#f7f5f0', material: 'Cotton', size: 'M', price: 28, numWear: 41, daysAgo: 420 },
  { brand: 'Atelier Nord', category: 'Tops', type: 'Crewneck sweater', color: 'Charcoal', colorHex: '#3a3a3c', material: 'Merino wool', size: 'M', price: 185, numWear: 22, daysAgo: 310 },
  { brand: 'Field & Loom', category: 'Tops', type: 'Blouse', color: 'Cream', colorHex: '#efe6d2', material: 'Silk', size: 'S', price: 140, numWear: 6, daysAgo: 168 },
  { brand: 'Kestrel', category: 'Tops', type: 'Button-down shirt', color: 'Navy', colorHex: '#1e2a4a', material: 'Cotton', size: 'M', price: 95, numWear: 18, daysAgo: 260 },
  { brand: 'Rue Ardent', category: 'Tops', type: 'Sweatshirt', color: 'Olive', colorHex: '#6f7433', material: 'Cotton blend', size: 'L', price: 60, numWear: 27, daysAgo: 190 },
  { brand: 'Soma Studio', category: 'Tops', type: 'Knit cardigan', color: 'Burgundy', colorHex: '#5c1f2b', material: 'Cashmere', size: 'S', price: 320, numWear: 9, daysAgo: 140 },

  // Bottoms
  { brand: 'Corso Denim', category: 'Bottoms', type: 'Straight jeans', color: 'Denim', colorHex: '#4a6a97', material: 'Denim', size: '28', price: 148, numWear: 62, daysAgo: 520 },
  { brand: 'Atelier Nord', category: 'Bottoms', type: 'Wide-leg trousers', color: 'Black', colorHex: '#111111', material: 'Wool', size: '28', price: 210, numWear: 31, daysAgo: 300 },
  { brand: 'Field & Loom', category: 'Bottoms', type: 'Chinos', color: 'Tan', colorHex: '#c19a6b', material: 'Cotton', size: '30', price: 85, numWear: 11, daysAgo: 210 },
  { brand: 'Maren', category: 'Bottoms', type: 'Pleated skirt', color: 'Grey', colorHex: '#8e8e93', material: 'Wool', size: '26', price: 110, numWear: 4, daysAgo: 96 },

  // Dresses
  { brand: 'Lune', category: 'Dresses', type: 'Slip dress', color: 'Black', colorHex: '#111111', material: 'Silk', size: 'S', price: 240, numWear: 5, daysAgo: 240 },
  { brand: 'Verdant', category: 'Dresses', type: 'Midi dress', color: 'Blush', colorHex: '#e9c4c0', material: 'Linen', size: 'S', price: 130, numWear: 8, daysAgo: 120 },

  // Outerwear
  { brand: 'Calder', category: 'Outerwear', type: 'Overcoat', color: 'Camel', colorHex: '#b08050', material: 'Wool', size: 'M', price: 480, numWear: 24, daysAgo: 640 },
  { brand: 'North Lane', category: 'Outerwear', type: 'Parka', color: 'Navy', colorHex: '#1e2a4a', material: 'Nylon', size: 'M', price: 320, numWear: 16, daysAgo: 380 },
  { brand: 'Corso Denim', category: 'Outerwear', type: 'Denim jacket', color: 'Sky', colorHex: '#7fb3d5', material: 'Denim', size: 'S', price: 165, numWear: 2, daysAgo: 54 },

  // Shoes
  { brand: 'Palma', category: 'Shoes', type: 'Leather sneakers', color: 'White', colorHex: '#f7f5f0', material: 'Leather', size: '8', price: 120, numWear: 88, daysAgo: 500 },
  { brand: 'Kestrel', category: 'Shoes', type: 'Loafers', color: 'Brown', colorHex: '#6b4a2f', material: 'Suede', size: '8', price: 230, numWear: 19, daysAgo: 330 },
  { brand: 'Palma', category: 'Shoes', type: 'Ankle boots', color: 'Black', colorHex: '#111111', material: 'Leather', size: '8', price: 295, numWear: 34, daysAgo: 580 },

  // Accessories
  { brand: 'Calder', category: 'Accessories', type: 'Leather tote', color: 'Chocolate', colorHex: '#3f2a1d', material: 'Leather', size: 'One size', price: 340, numWear: 57, daysAgo: 610 },
]

const DAY = 86_400_000

export function seedCloset(): ClosetItem[] {
  const now = Date.now()
  return SEEDS.map((seed, index) => ({
    id: `seed-${index}`,
    name: composeName(seed.color, seed.material, seed.type),
    brand: seed.brand,
    // Bought a little before it was first worn, which is what the wear history implies.
    purchaseDate: new Date(now - (seed.daysAgo + 14) * DAY).toISOString().slice(0, 10),
    category: seed.category,
    type: seed.type,
    color: seed.color,
    colorHex: seed.colorHex,
    material: seed.material,
    size: seed.size,
    price: seed.price,
    numWear: seed.numWear,
    image: silhouette(seed.type, seed.category, seed.colorHex),
    addedAt: now - seed.daysAgo * DAY,
  }))
}
