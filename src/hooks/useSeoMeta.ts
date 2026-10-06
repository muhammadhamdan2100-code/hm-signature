import { useEffect } from "react";
import { useAdminData } from "../admin/context/AdminDataContext";
import { useI18n } from "../i18n/I18nProvider";
import {
  SEO_LANGUAGES,
  absoluteUrl,
  applyLanguageAlternates,
  replaceMeta,
  siteOrigin,
  upsertLink,
  upsertMeta,
} from "../lib/seo";

interface SeoOptions {
  type?: "website" | "product" | "article";
  image?: string;
  /** Product pages already carry their own canonical with a size parameter. */
  canonical?: string;
}

/**
 * Applies admin-managed SEO metadata (seo_settings) for a storefront path, then layers the
 * international signals on top: a localized title, a canonical for the current path, the
 * per-language alternates, and the social tags the crawler reads.
 *
 * The path argument stays exactly as it was so existing call sites keep their behaviour.
 */
export function useSeoMeta(
  path: string,
  fallbackTitle: string,
  fallbackDescription?: string,
  options: SeoOptions = {}
) {
  const { seoEntries } = useAdminData();
  const { language } = useI18n();

  useEffect(() => {
    const entry = seoEntries.find((s) => s.path === path);
    const title = entry?.metaTitle || fallbackTitle;
    const description = entry?.metaDescription || fallbackDescription || "";
    const origin = siteOrigin();
    const canonical = options.canonical
      ? absoluteUrl(options.canonical)
      : origin
        ? absoluteUrl(path.split("?")[0])
        : "";
    const image = options.image ? absoluteUrl(options.image) : "";

    document.title = title;

    upsertMeta("name", "description", description);
    if (canonical) upsertLink("canonical", canonical);
    applyLanguageAlternates(path.split("?")[0]);

    upsertMeta("property", "og:site_name", "HM Signature");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:type", options.type ?? "website");
    if (canonical) upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:description", description);
    if (image) upsertMeta("property", "og:image", image);

    // The language the page is being read in, plus the alternates, without claiming a
    // separate URL for each one. Both lists come from the single SEO_LANGUAGES source so a
    // new language cannot be added to the sitemap while still missing here.
    upsertMeta("property", "og:locale", (language.locale || language.code).replace(/-/g, "_"));
    replaceMeta(
      "property",
      "og:locale:alternate",
      SEO_LANGUAGES.filter((code) => code !== language.code)
    );

    upsertMeta("name", "twitter:card", image ? "summary_large_image" : "summary");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    if (image) upsertMeta("name", "twitter:image", image);
  }, [path, fallbackTitle, fallbackDescription, seoEntries, language, options.type, options.image, options.canonical]);
}
