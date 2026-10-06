import type { Product } from "../data/products";
import { effectiveVariantPrice } from "../data/products";

// Search engines must only ever be told what the page actually shows. Every builder here
// reads from the same catalogue object the component rendered, and drops any field the
// application does not really have rather than filling it in.

export const SEO_LANGUAGES = ["en", "ar", "fr", "es", "ur", "de"] as const;
export const DEFAULT_SEO_LANGUAGE = "en";

export function siteOrigin(): string {
  const configured = (import.meta.env.VITE_SITE_URL as string | undefined) || "";
  if (configured) return configured.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin.replace(/\/+$/, "");
  return "";
}

export function absoluteUrl(path = "/"): string {
  const origin = siteOrigin();
  if (!origin) return path;
  if (/^https?:\/\//i.test(path)) return path;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function upsertMeta(attr: "name" | "property", key: string, content: string): void {
  if (!content) return;
  const selector = `meta[${attr}="${key}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

/**
 * Replaces every `<meta property|name="key">` with the given values. `og:locale:alternate`
 * legitimately repeats, so upserting one tag per language would leave only the last one.
 */
export function replaceMeta(attr: "name" | "property", key: string, contents: string[]): void {
  document.head.querySelectorAll(`meta[${attr}="${key}"]`).forEach((tag) => tag.remove());
  for (const content of contents) {
    if (!content) continue;
    const tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    tag.content = content;
    document.head.appendChild(tag);
  }
}

export function upsertLink(rel: string, href: string, hreflang?: string): void {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let link = document.head.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement("link");
    link.rel = rel;
    if (hreflang) link.setAttribute("hreflang", hreflang);
    document.head.appendChild(link);
  }
  link.href = href;
}

/**
 * A query-parameter alternate per language. The storefront renders one URL for every
 * language, so `?lang=` gives crawlers a distinct, self-consistent address to map and
 * `x-default` points at the un-parameterised page.
 */
export function applyLanguageAlternates(path: string): void {
  const origin = siteOrigin();
  if (!origin) return;
  const clean = path.split("?")[0];
  for (const code of SEO_LANGUAGES) {
    upsertLink("alternate", `${origin}${clean}?lang=${code}`, code);
  }
  upsertLink("alternate", `${origin}${clean}`, "x-default");
}

const ORG_NAME = "HM Signature";
const PARENT_NAME = "Xeltrio Technologies";
const LOGO_PATH = "/logo.png";

export function organizationData() {
  const origin = siteOrigin();
  if (!origin) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: origin,
    logo: absoluteUrl(LOGO_PATH),
    parentOrganization: {
      "@type": "Organization",
      name: PARENT_NAME,
      url: absoluteUrl("/parent-company"),
    },
  };
}

export function webSiteData(description: string) {
  const origin = siteOrigin();
  if (!origin) return null;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORG_NAME,
    url: origin,
    description,
    inLanguage: DEFAULT_SEO_LANGUAGE,
    publisher: { "@type": "Organization", name: ORG_NAME, url: origin },
  };
}

export interface Crumb {
  name: string;
  path: string;
}

export function breadcrumbData(crumbs: Crumb[]) {
  const origin = siteOrigin();
  if (!origin || crumbs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * One Offer per real catalogue size. Price and currency are the base currency the order
 * is actually written in — the display currency a shopper was browsing in is a presentation
 * detail, and must never be what a crawl sees.
 */
export function productData(product: Product): Record<string, unknown> | null {
  const origin = siteOrigin();
  if (!origin) return null;

  const path = `/product/${product.slug}`;
  const variants = (product.variants ?? []).filter((v) => v.active !== false);

  const offerFor = (price: number, url: string, sku?: string, name?: string) => ({
    "@type": "Offer" as const,
    url,
    priceCurrency: "PKR",
    price,
    availability: "https://schema.org/InStock",
    ...(sku ? { sku } : {}),
    ...(name ? { itemOffered: { "@type": "Product", name } } : {}),
  });

  const sizeOffers = variants
    .map((v) => ({
      variant: v,
      offer: offerFor(
        effectiveVariantPrice(v),
        absoluteUrl(`${path}?size=${encodeURIComponent(v.size)}`),
        v.sku,
        `${product.name} — ${v.size}`
      ),
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    }))
    .filter((entry) => Number.isFinite(entry.offer.price) && entry.offer.price > 0);

  const singleOffer =
    sizeOffers.length === 0 && Number(product.price) > 0
      ? [
          offerFor(Number(product.price), absoluteUrl(path), product.sku) ,
        ].map((offer) => ({
          ...offer,
          availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        }))
      : [];

  const images = (product.photos ?? []).filter(Boolean).map(absoluteUrl);

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seoDescription || product.shortDescription || product.description,
    category: product.category,
    url: absoluteUrl(path),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.concentration ? { additionalProperty: { "@type": "PropertyValue", name: "Concentration", value: product.concentration } } : {}),
    ...(images.length > 0 ? { image: images } : {}),
    ...(sizeOffers.length > 1
      ? {
          hasVariant: sizeOffers.map((entry) => ({
            "@type": "Product",
            name: entry.offer.itemOffered?.name,
            sku: entry.offer.sku,
            offers: { ...entry.offer, itemOffered: undefined, availability: entry.availability },
          })),
        }
      : sizeOffers.length === 1
        ? { offers: { ...sizeOffers[0].offer, availability: sizeOffers[0].availability } }
        : singleOffer.length === 1
          ? { offers: singleOffer[0] }
          : {}),
    ...(Number(product.reviewCount) > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(product.rating),
            reviewCount: Number(product.reviewCount),
          },
        }
      : {}),
  };
  return data;
}

/** `<script type="application/ld+json">` bodies must never be closed by content. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003C");
}
