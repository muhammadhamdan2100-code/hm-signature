import ShopPage from "../components/ShopPage";

export default function Women() {
  return (
    <ShopPage
      eyebrow="FOR HER"
      title="Women's Collection"
      subtitle="Florals, amber and warmth — fragrances that linger in memory."
      baseFilter={(p) => p.gender === "women" || p.gender === "unisex"}
      heroTexture="texture-marble-champagne"
    />
  );
}
