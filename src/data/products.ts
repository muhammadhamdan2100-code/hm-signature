export interface Review {
  name: string;
  rating: number;
  verified: boolean;
  text: string;
}

export interface ProductVariant {
  id: string;
  size: string; // e.g. "10ml", "75ml", "100ml"
  price: number;
  salePrice?: number;
  sku: string;
  stock: number;
  active: boolean;
  auto?: boolean; // true = price derived from the 50ml base price
  lowStockThreshold?: number;
  images?: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku?: string;
  price: number; // 50ml reference base price
  images: string[]; // texture-class keys used to render gallery placeholder panels
  photos?: string[]; // real product photography paths (public/), used in place of the placeholder when present
  category: string; // merchandising category
  gender: "men" | "women" | "unisex";
  description: string;
  shortDescription?: string;
  fragranceFamily?: string;
  occasions?: string[];
  seasons?: string[];
  intensity?: "Light" | "Moderate" | "Strong" | "Enormous";
  scentProfile?: string;
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  ingredients: string;
  size: string;
  concentration: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  stock: number;
  featured: boolean;
  bestseller: boolean;
  newArrival?: boolean;
  active?: boolean;
  seoTitle?: string;
  seoDescription?: string;
  // Phase 8 (8.9, 8.10). All optional and read straight from the products table: a fragrance the
  // house has not marked up simply has none of these, and nothing here fills the gap.
  isLimitedEdition?: boolean;
  editionTotal?: number;
  editionNumber?: string;
  editionReleasedOn?: string;
  editionEndsOn?: string;
  preOrderEnabled?: boolean;
  preOrderReleaseOn?: string;
  preOrderMaxQuantity?: number;
  texture: string; // primary card texture class
  variants?: ProductVariant[];
}

export const SIZE_PRESETS = ["10ml", "30ml", "50ml", "75ml", "100ml"] as const;

export const FRAGRANCE_FAMILIES = [
  "Woody Oriental",
  "Amber Vanilla",
  "Floral Amber",
  "Floral Musk",
  "Fresh Aromatic",
  "Citrus Fougère",
  "Gourmand",
  "Chypre",
  "Leather",
] as const;

export const OCCASION_OPTIONS = ["Day", "Evening", "Office", "Wedding", "Night Out", "Everyday", "Gifting"] as const;
export const SEASON_OPTIONS = ["Spring", "Summer", "Autumn", "Winter", "All Season"] as const;
export const INTENSITY_OPTIONS = ["Light", "Moderate", "Strong", "Enormous"] as const;

export function sizeToMl(size: string): number {
  const ml = parseInt(size, 10);
  return Number.isFinite(ml) && ml > 0 ? ml : 0;
}

export function isValidSizeLabel(size: string): boolean {
  return /^[1-9][0-9]{0,3}ml$/i.test(String(size || "").trim());
}

export function normalizeSizeLabel(size: string): string {
  return String(size || "").trim().toLowerCase();
}

export function compareSizes(a: string, b: string): number {
  return sizeToMl(a) - sizeToMl(b);
}

export function roundCleanPrice(amount: number): number {
  return Math.round(amount / 50) * 50;
}

// The single price rule shared with the database: place_order charges
// COALESCE(sale_price, price), so every read path must show the same figure.
export function effectiveVariantPrice(variant: { price: number; salePrice?: number }): number {
  return variant.salePrice ?? variant.price;
}

// Proportional volume pricing: size price = (50ml base / 50) × size in ml
export function autoPriceFor(basePrice50ml: number, size: string): number {
  const ml = parseInt(size, 10);
  if (!Number.isFinite(ml) || ml <= 0 || !Number.isFinite(basePrice50ml) || basePrice50ml <= 0) {
    return basePrice50ml;
  }
  return Math.round((basePrice50ml / 50) * ml);
}

// Two bottle sizes are the same size whatever case or spacing the form used.
export function hasDuplicateSize(
  list: { size: string }[],
  label: string,
  exceptIndex = -1
): boolean {
  const target = normalizeSizeLabel(label);
  return list.some((v, i) => i !== exceptIndex && normalizeSizeLabel(v.size) === target);
}

// "hm qvf" must not become "HM QVF-75ML": a size code is alphanumerics and dashes.
export function sanitizeSkuCode(code: string): string {
  return String(code || "").toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

// A variant code is derived from the base code unless someone wrote their own.
// The "HM-PRD-<ml>ML" ladder that a blank product starts with is always replaced.
export function deriveVariantSku(baseSku: string, size: string, existingSku?: string): string {
  const seed = sanitizeSkuCode(baseSku) || "HM-PRD";
  const ml = normalizeSizeLabel(size).toUpperCase();
  const current = String(existingSku || "").trim();
  if (!current || /^HM-PRD-\d+ML$/i.test(current)) return `${seed}-${ml}`;
  return current;
}

export function generateDefaultVariants(
  basePrice: number,
  baseSku: string = "HM-PRD",
  baseStock: number = 30
): ProductVariant[] {
  const p10 = autoPriceFor(basePrice, "10ml");
  const p30 = autoPriceFor(basePrice, "30ml");
  const p50 = basePrice;
  const p100 = autoPriceFor(basePrice, "100ml");

  return [
    {
      id: "v-10ml",
      size: "10ml",
      price: p10,
      sku: `${baseSku}-10ML`,
      stock: Math.max(10, Math.floor(baseStock * 0.8)),
      active: true,
      auto: true,
    },
    {
      id: "v-30ml",
      size: "30ml",
      price: p30,
      sku: `${baseSku}-30ML`,
      stock: Math.max(15, Math.floor(baseStock * 0.9)),
      active: true,
      auto: true,
    },
    {
      id: "v-50ml",
      size: "50ml",
      price: p50,
      sku: `${baseSku}-50ML`,
      stock: baseStock,
      active: true,
      auto: true,
    },
    {
      id: "v-100ml",
      size: "100ml",
      price: p100,
      sku: `${baseSku}-100ML`,
      stock: Math.max(10, Math.floor(baseStock * 1.1)),
      active: true,
      auto: true,
    },
  ];
}

export const products: Product[] = [
  {
    id: "1",
    name: "Mystic Oud",
    slug: "mystic-oud",
    price: 4500,
    images: ["texture-velvet", "texture-marble-dark", "texture-wood", "texture-velvet"],
    photos: [
      "/products/mystic-oud-1.jpg",
      "/products/mystic-oud-2.jpg",
      "/products/mystic-oud-3.jpg",
      "/products/mystic-oud-4.jpg",
      "/products/brand-signature-box.jpg",
    ],
    category: "Woody Oriental",
    gender: "unisex",
    description:
      "A rich, magnetic blend of oud and amber — for those who leave a lasting impression from the moment they enter a room.",
    topNotes: ["Saffron", "Bergamot", "Pink Pepper"],
    heartNotes: ["Bulgarian Rose", "Oud Wood", "Cedar"],
    baseNotes: ["Amber", "Vanilla", "Leather"],
    ingredients: "Alcohol Denat., Parfum (Fragrance), Aqua, Oud Extract, Amber Resinoid, Vanillin.",
    size: "50ml",
    concentration: "Extrait de Parfum",
    // Offline demo fixtures carry no ratings and no client reviews — those are
    // earned only from approved review rows.
    rating: 0,
    reviewCount: 0,
    reviews: [],
    stock: 42,
    featured: true,
    bestseller: true,
    texture: "texture-velvet",
    variants: generateDefaultVariants(4500, "HM-MYS-100", 42),
  },
  {
    id: "2",
    name: "Un Kimmy",
    slug: "un-kimmy",
    price: 2800,
    images: ["texture-marble-dark", "texture-navy", "texture-marble-dark", "texture-wood"],
    photos: ["/products/mystic-oud-3.jpg"],
    category: "Fresh Woods",
    gender: "men",
    description:
      "A refined composition of fresh woods and musk — quietly confident, effortlessly modern, built for the everyday signature.",
    topNotes: ["Bergamot", "Cardamom", "Grapefruit"],
    heartNotes: ["Vetiver", "Iris", "Sage"],
    baseNotes: ["Musk", "Cedarwood", "Ambroxan"],
    ingredients: "Alcohol Denat., Parfum (Fragrance), Aqua, Vetiver Oil, Musk Blend, Ambroxan.",
    size: "50ml",
    concentration: "Extrait de Parfum",
    rating: 0,
    reviewCount: 0,
    reviews: [],
    stock: 65,
    featured: true,
    bestseller: false,
    texture: "texture-marble-dark",
    variants: generateDefaultVariants(2800, "HM-UNK-101", 65),
  },
  {
    id: "3",
    name: "Harm Land",
    slug: "harm-land",
    price: 3600,
    images: ["texture-marble-champagne", "texture-stone-beige", "texture-marble-champagne", "texture-navy"],
    photos: ["/products/mystic-oud-1.jpg"],
    category: "Floral Amber",
    gender: "women",
    description:
      "A luminous bouquet of florals and golden notes — warm, romantic and unforgettable, like candlelight on skin.",
    topNotes: ["Mandarin", "Pear", "Pink Peppercorn"],
    heartNotes: ["Jasmine", "Tuberose", "Orange Blossom"],
    baseNotes: ["Amber", "Sandalwood", "White Musk"],
    ingredients: "Alcohol Denat., Parfum (Fragrance), Aqua, Jasmine Absolute, Amber Resinoid, Sandalwood Oil.",
    size: "50ml",
    concentration: "Extrait de Parfum",
    rating: 0,
    reviewCount: 0,
    reviews: [],
    stock: 38,
    featured: true,
    bestseller: true,
    texture: "texture-marble-champagne",
    variants: generateDefaultVariants(3600, "HM-HAR-102", 38),
  },
  {
    id: "4",
    name: "Aura Nocturne",
    slug: "aura-nocturne",
    price: 4200,
    images: ["texture-wood", "texture-marble-dark", "texture-navy", "texture-velvet"],
    photos: ["/products/aura-nocturne-1.jpg", "/products/aura-nocturne-2.jpg"],
    category: "Spicy Woody",
    gender: "men",
    description:
      "Dark spice wrapped in soft cashmere musk — a scent for the confident hours after sunset.",
    topNotes: ["Black Pepper", "Nutmeg", "Cardamom"],
    heartNotes: ["Cashmere Wood", "Tobacco Leaf", "Iris"],
    baseNotes: ["Suede", "Amber", "Tonka Bean"],
    ingredients: "Alcohol Denat., Parfum (Fragrance), Aqua, Tobacco Absolute, Tonka Bean, Amber Resinoid.",
    size: "50ml",
    concentration: "Extrait de Parfum",
    rating: 0,
    reviewCount: 0,
    reviews: [],
    stock: 51,
    featured: false,
    bestseller: true,
    texture: "texture-wood",
    variants: generateDefaultVariants(4200, "HM-AUR-103", 51),
  },
  {
    id: "5",
    name: "Rose Ember",
    slug: "rose-ember",
    price: 3200,
    images: ["texture-stone-beige", "texture-marble-champagne", "texture-velvet", "texture-navy"],
    photos: ["/products/mystic-oud-2.jpg"],
    category: "Floral Musk",
    gender: "women",
    description:
      "Rose petals warmed by smoky embers — soft, sensual, and quietly powerful.",
    topNotes: ["Raspberry", "Pink Pepper", "Bergamot"],
    heartNotes: ["Turkish Rose", "Peony", "Violet"],
    baseNotes: ["Smoked Woods", "Musk", "Vanilla"],
    ingredients: "Alcohol Denat., Parfum (Fragrance), Aqua, Rose Absolute, Peony Extract, Musk Blend.",
    size: "50ml",
    concentration: "Extrait de Parfum",
    rating: 0,
    reviewCount: 0,
    reviews: [],
    stock: 47,
    featured: false,
    bestseller: true,
    texture: "texture-stone-beige",
    variants: generateDefaultVariants(3200, "HM-ROS-104", 47),
  },
  {
    id: "6",
    name: "Golden Hour",
    slug: "golden-hour",
    price: 2500,
    images: ["texture-navy", "texture-marble-champagne", "texture-wood", "texture-marble-dark"],
    photos: ["/products/brand-signature-box.jpg"],
    category: "Amber Vanilla",
    gender: "unisex",
    description:
      "Warm amber and vanilla caught in the last light of day — HM Signature's most versatile creation.",
    topNotes: ["Bergamot", "Mandarin", "Saffron"],
    heartNotes: ["Amber", "Cinnamon", "Praline"],
    baseNotes: ["Vanilla", "Tonka Bean", "Sandalwood"],
    ingredients: "Alcohol Denat., Parfum (Fragrance), Aqua, Vanilla Absolute, Amber Resinoid, Tonka Bean.",
    size: "50ml",
    concentration: "Extrait de Parfum",
    rating: 0,
    reviewCount: 0,
    reviews: [],
    stock: 59,
    featured: false,
    bestseller: false,
    texture: "texture-navy",
    variants: generateDefaultVariants(2500, "HM-GOL-105", 59),
  },
];

export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
