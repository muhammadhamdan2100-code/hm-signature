export interface Review {
  name: string;
  rating: number;
  verified: boolean;
  text: string;
}

export interface ProductVariant {
  id: string;
  size: string; // e.g. "10ml", "30ml", "50ml", "100ml"
  price: number;
  salePrice?: number;
  sku: string;
  stock: number;
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number; // 50ml reference base price
  images: string[]; // texture-class keys used to render gallery placeholder panels
  photos?: string[]; // real product photography paths (public/), used in place of the placeholder when present
  category: string; // fragrance family
  gender: "men" | "women" | "unisex";
  description: string;
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
  texture: string; // primary card texture class
  variants?: ProductVariant[];
}

export function roundCleanPrice(amount: number): number {
  return Math.round(amount / 50) * 50;
}

export function generateDefaultVariants(
  basePrice: number,
  baseSku: string = "HM-PRD",
  baseStock: number = 30
): ProductVariant[] {
  const p10 = roundCleanPrice(basePrice * 0.3);
  const p30 = roundCleanPrice(basePrice * 0.7);
  const p50 = basePrice;
  const p100 = roundCleanPrice(basePrice * 1.7);

  return [
    {
      id: "v-10ml",
      size: "10ml",
      price: p10,
      sku: `${baseSku}-10ML`,
      stock: Math.max(10, Math.floor(baseStock * 0.8)),
      active: true,
    },
    {
      id: "v-30ml",
      size: "30ml",
      price: p30,
      sku: `${baseSku}-30ML`,
      stock: Math.max(15, Math.floor(baseStock * 0.9)),
      active: true,
    },
    {
      id: "v-50ml",
      size: "50ml",
      price: p50,
      sku: `${baseSku}-50ML`,
      stock: baseStock,
      active: true,
    },
    {
      id: "v-100ml",
      size: "100ml",
      price: p100,
      sku: `${baseSku}-100ML`,
      stock: Math.max(10, Math.floor(baseStock * 1.1)),
      active: true,
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
    rating: 4.8,
    reviewCount: 214,
    reviews: [
      { name: "Amara K.", rating: 5, verified: true, text: "Deep, smoky, and it lasts all day. Compliments everywhere I go." },
      { name: "Farhan S.", rating: 5, verified: true, text: "The most sophisticated oud I've worn. Worth every rupee." },
      { name: "Layla M.", rating: 4, verified: true, text: "Strong projection — a little goes a long way." },
    ],
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
    rating: 4.6,
    reviewCount: 156,
    reviews: [
      { name: "Bilal R.", rating: 5, verified: true, text: "My everyday scent now. Clean but never boring." },
      { name: "Noah T.", rating: 4, verified: true, text: "Great office scent, subtle projection." },
    ],
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
    rating: 4.9,
    reviewCount: 301,
    reviews: [
      { name: "Sana J.", rating: 5, verified: true, text: "Romantic without being overpowering. My signature scent." },
      { name: "Priya D.", rating: 5, verified: true, text: "Received so many compliments at my engagement." },
      { name: "Meera V.", rating: 5, verified: true, text: "Beautiful bottle, even more beautiful scent." },
    ],
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
    rating: 4.7,
    reviewCount: 98,
    reviews: [
      { name: "Zayn H.", rating: 5, verified: true, text: "Evening scent perfection. Gets attention immediately." },
    ],
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
    rating: 4.8,
    reviewCount: 176,
    reviews: [
      { name: "Hina A.", rating: 5, verified: true, text: "Elegant rose, not the powdery old-lady kind." },
    ],
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
    rating: 4.7,
    reviewCount: 132,
    reviews: [
      { name: "Omar F.", rating: 5, verified: true, text: "Unisex done right. My wife and I share this bottle." },
    ],
    stock: 59,
    featured: false,
    bestseller: false,
    texture: "texture-navy",
    variants: generateDefaultVariants(2500, "HM-GOL-105", 59),
  },
];

export const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
