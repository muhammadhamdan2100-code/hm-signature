import { useEffect } from "react";
import { useAdminData } from "../admin/context/AdminDataContext";

/**
 * Applies admin-managed SEO metadata (seo_settings) for a storefront path.
 */
export function useSeoMeta(path: string, fallbackTitle: string, fallbackDescription?: string) {
  const { seoEntries } = useAdminData();

  useEffect(() => {
    const entry = seoEntries.find((s) => s.path === path);
    const title = entry?.metaTitle || fallbackTitle;
    const description = entry?.metaDescription || fallbackDescription || "";

    document.title = title;

    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag && description) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    if (tag && description) tag.content = description;

    let og = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (og) og.content = title;
    let ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDesc && description) ogDesc.content = description;
  }, [path, fallbackTitle, fallbackDescription, seoEntries]);
}
