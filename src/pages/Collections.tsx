import ShopPage from "../components/ShopPage";

export default function Collections() {
  return (
    <ShopPage
      eyebrow="OUR COLLECTIONS"
      title="Scented Stories"
      subtitle="Discover fragrances crafted to express different personalities, moods and moments."
      baseFilter={() => true}
      heroTexture="texture-marble-champagne"
    />
  );
}
