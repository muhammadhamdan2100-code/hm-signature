import ShopPage from "../components/ShopPage";

export default function Bestsellers() {
  return (
    <ShopPage
      eyebrow="CHOSEN BY THE ATELIER"
      title="Bestsellers"
      subtitle="Fragrances the house puts forward as an introduction to its range."
      baseFilter={(p) => p.bestseller}
      heroTexture="texture-velvet"
    />
  );
}
