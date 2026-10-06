import { jsonLdString } from "../lib/seo";

/**
 * Emits Schema.org JSON-LD for the page that renders it. Nothing is added by this
 * component: if the caller has no data, nothing is written.
 */
export default function StructuredData({ data }: { data: unknown | null }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />;
}
