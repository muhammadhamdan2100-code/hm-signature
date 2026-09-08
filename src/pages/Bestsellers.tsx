import ShopPage from "../components/ShopPage";

export default function Bestsellers() {
  return (
    <ShopPage
      eyebrow="MOST LOVED"
      title="Bestsellers"
      subtitle="The signature scents our clients return for, again and again."
      baseFilter={(p) => p.bestseller}
      heroTexture="texture-velvet"
    />
  );
}
