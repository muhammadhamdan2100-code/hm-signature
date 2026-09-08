import ShopPage from "../components/ShopPage";

export default function Men() {
  return (
    <ShopPage
      eyebrow="FOR HIM"
      title="Men's Collection"
      subtitle="Fresh woods, dark spice and quiet confidence — fragrances built for presence."
      baseFilter={(p) => p.gender === "men" || p.gender === "unisex"}
      heroTexture="texture-wood"
    />
  );
}
