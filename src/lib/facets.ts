// Catalogue facets are stored as English enum tokens ("Night Out", "All Season", "Strong"),
// because that is what the product rows and the matching engine compare. A shopper reading in
// Spanish should still see "Intenso" on the spec sheet, so every screen renders the token
// through this table instead of printing the raw value.
//
// Anything not listed here is returned unchanged: a product whose family or concentration is
// free text is not made worse by a missing entry, and the finder never invents a label.

const KEYS: Record<string, string> = {
  Light: "facet.intensity.light",
  Moderate: "facet.intensity.moderate",
  Strong: "facet.intensity.strong",
  Enormous: "facet.intensity.enormous",

  Spring: "facet.season.spring",
  Summer: "facet.season.summer",
  Autumn: "facet.season.autumn",
  Winter: "facet.season.winter",
  "All Season": "facet.season.allSeason",

  Day: "facet.occasion.day",
  Evening: "facet.occasion.evening",
  Office: "facet.occasion.office",
  Wedding: "facet.occasion.wedding",
  "Night Out": "facet.occasion.nightOut",
  Everyday: "facet.occasion.everyday",
  Gifting: "facet.occasion.gifting",

  // Gender reuses the shop's filter-chip words rather than inventing a second set: the
  // product spec sheet and the sidebar filter must not disagree about what "unisex" reads as.
  Men: "shop.genderMen",
  Women: "shop.genderWomen",
  Unisex: "shop.genderUnisex",
};

/** Title-cases each word so "all season" and "All Season" reach the same key. */
const normalise = (value: string): string =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export function facetKey(value: string | null | undefined): string | null {
  if (!value) return null;
  return KEYS[normalise(value)] ?? null;
}

export function facetLabel(
  t: (key: string, params?: Record<string, string | number>) => string,
  value: string | null | undefined
): string {
  if (!value) return "";
  const key = facetKey(value);
  return key ? t(key) : value;
}

/** A facet list joined the way the spec sheet already joins it. */
export function facetListLabel(
  t: (key: string, params?: Record<string, string | number>) => string,
  values: readonly (string | null | undefined)[] | null | undefined,
  separator = " · "
): string {
  if (!values?.length) return "";
  return values.map((v) => facetLabel(t, v)).filter(Boolean).join(separator);
}
