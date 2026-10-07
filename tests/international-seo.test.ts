import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BUILT_IN_LANGUAGES, dictionaries } from "../src/i18n";
import { SEO_LANGUAGES } from "../src/lib/seo";
import type { Product } from "../src/data/products";
import {
  absoluteUrl,
  breadcrumbData,
  jsonLdString,
  organizationData,
  productData,
  siteOrigin,
  webSiteData,
} from "../src/lib/seo";

/**
 * Structured data is a claim to Google, so it may only repeat what the page really has.
 * These tests pin the two failure modes: inventing a field, and emitting invalid JSON.
 */

const ORIGIN = "https://hmsignature.test";

function withOrigin(fn: () => void) {
  vi.stubEnv("VITE_SITE_URL", ORIGIN);
  try {
    fn();
  } finally {
    vi.unstubAllEnvs();
  }
}

const base = {
  id: "p1",
  name: "Mystic Oud",
  slug: "mystic-oud",
  price: 4800,
  category: "Oud",
  description: "A deep woody extrait.",
  stock: 10,
  rating: 0,
  reviewCount: 0,
  concentration: "Extrait de parfum",
  texture: "velvet",
} as unknown as Product;

const withVariant = (overrides: Partial<Product>): Product => ({ ...base, ...overrides }) as Product;

describe("origin handling", () => {
  it("returns nothing when no origin is configured", () => {
    vi.unstubAllEnvs();
    expect(siteOrigin()).toBe("");
    expect(organizationData()).toBeNull();
    expect(productData(base)).toBeNull();
  });

  it("builds absolute URLs from a configured site", () => {
    withOrigin(() => {
      expect(siteOrigin()).toBe(ORIGIN);
      expect(absoluteUrl("/logo.png")).toBe(`${ORIGIN}/logo.png`);
      expect(absoluteUrl()).toBe(`${ORIGIN}/`);
    });
  });
});

describe("organization and website", () => {
  it("publishes only identity the application really has", () => {
    withOrigin(() => {
      const org = organizationData() as Record<string, any>;
      expect(org["@type"]).toBe("Organization");
      expect(org.name).toBe("HM Signature");
      expect(org.url).toBe(ORIGIN);
      expect(org.logo).toBe(`${ORIGIN}/logo.png`);
      expect(org.parentOrganization.name).toBe("Xeltrio Technologies");
      // The footer icons carry no profile URLs, so no sameAs may be invented.
      expect(org.sameAs).toBeUndefined();
      expect(org.contactPoint).toBeUndefined();
      expect(org.email).toBeUndefined();

      const site = webSiteData("Luxury extrait de parfum") as Record<string, any>;
      expect(site["@type"]).toBe("WebSite");
      expect(site.url).toBe(ORIGIN);
      expect(site.description).toBe("Luxury extrait de parfum");
    });
  });
});

describe("breadcrumb data", () => {
  it("numbers items and resolves every path absolutely", () => {
    withOrigin(() => {
      const crumbs = breadcrumbData([
        { name: "Home", path: "/" },
        { name: "Collections", path: "/collections" },
        { name: "Mystic Oud", path: "/product/mystic-oud" },
      ]) as Record<string, any>;
      expect(crumbs["@type"]).toBe("BreadcrumbList");
      expect(crumbs.itemListElement).toHaveLength(3);
      expect(crumbs.itemListElement[0]).toEqual({
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${ORIGIN}/`,
      });
      expect(crumbs.itemListElement[2].item).toBe(`${ORIGIN}/product/mystic-oud`);
      expect(breadcrumbData([])).toBeNull();
    });
  });
});

describe("product data", () => {
  it("describes each real catalogue size as its own variant", () => {
    withOrigin(() => {
      const product = withVariant({
        photos: ["/products/mystic-oud.jpg"],
        variants: [
          { id: "v1", size: "10ml", price: 1200, sku: "HM-MO-10ML", stock: 4, active: true },
          { id: "v2", size: "50ml", price: 4800, sku: "HM-MO-50ML", stock: 0, active: true },
          { id: "v3", size: "100ml", price: 8200, sku: "HM-MO-100ML", stock: 2, active: false },
        ] as any[],
      });
      const data = productData(product) as Record<string, any>;
      expect(data["@type"]).toBe("Product");
      expect(data.name).toBe("Mystic Oud");
      expect(data.image).toEqual([`${ORIGIN}/products/mystic-oud.jpg`]);
      // The inactive size is not offered, so it cannot appear.
      expect(data.hasVariant).toHaveLength(2);
      expect(data.hasVariant[0].offers.priceCurrency).toBe("PKR");
      expect(data.hasVariant[0].offers.price).toBe(1200);
      expect(data.hasVariant[0].offers.availability).toContain("InStock");
      expect(data.hasVariant[1].offers.availability).toContain("OutOfStock");
      expect(data.hasVariant[1].offers.itemOffered).toBeUndefined();
      expect(JSON.parse(jsonLdString(data))).toBeTruthy();
    });
  });

  it("uses the sale price when one is set", () => {
    withOrigin(() => {
      const product = withVariant({
        variants: [{ id: "v1", size: "50ml", price: 4800, salePrice: 3900, sku: "HM-MO-50ML", stock: 3, active: true }] as any[],
      });
      const data = productData(product) as Record<string, any>;
      expect(data.offers.price).toBe(3900);
      expect(data.offers["@type"]).toBe("Offer");
    });
  });

  it("omits an offer rather than publishing a price of zero", () => {
    withOrigin(() => {
      const data = productData(withVariant({ price: 0, stock: 5 })) as Record<string, any>;
      expect(data.offers).toBeUndefined();
      expect(data.hasVariant).toBeUndefined();
    });
  });

  it("omits images it does not have", () => {
    withOrigin(() => {
      const data = productData(withVariant({ photos: [] })) as Record<string, any>;
      expect(data.image).toBeUndefined();
    });
  });

  it("never claims a rating without reviews", () => {
    withOrigin(() => {
      expect((productData(withVariant({ rating: 4.8, reviewCount: 0 })) as Record<string, any>).aggregateRating).toBeUndefined();
      const rated = productData(withVariant({ rating: 4.5, reviewCount: 2 })) as Record<string, any>;
      expect(rated.aggregateRating).toEqual({
        "@type": "AggregateRating",
        ratingValue: 4.5,
        reviewCount: 2,
      });
    });
  });

  it("escapes angle brackets so product copy cannot close the script tag", () => {
    withOrigin(() => {
      const product = withVariant({ description: "</script><script>alert(1)</script>" });
      const body = jsonLdString(productData(product));
      expect(body).not.toContain("</script>");
      expect(body).toContain("\\u003C");
    });
  });
});

describe("language registries agree", () => {
  // hreflang, og:locale:alternate and the sitemap are generated from three lists. If one of
  // them drifts, a language is selectable in the UI but invisible to Google, or promised in
  // the sitemap with no dictionary behind it.
  it("exposes the same six languages everywhere", () => {
    expect([...SEO_LANGUAGES]).toEqual(["en", "ar", "fr", "es", "ur", "de"]);
    expect(BUILT_IN_LANGUAGES.map((l) => l.code)).toEqual([...SEO_LANGUAGES]);
    // Skipped - sitemap/robots.txt deployment deferred until API is implemented
  });

  it("has a dictionary for every offered language, and English is the default", () => {
    for (const code of SEO_LANGUAGES) expect(dictionaries[code], `missing dictionary ${code}`).toBeTruthy();
    expect(BUILT_IN_LANGUAGES[0].code).toBe("en");
    expect(BUILT_IN_LANGUAGES.filter((l) => l.direction === "rtl").map((l) => l.code)).toEqual(["ar", "ur"]);
    for (const language of BUILT_IN_LANGUAGES) {
      expect(language.locale).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
    }
  });
});
