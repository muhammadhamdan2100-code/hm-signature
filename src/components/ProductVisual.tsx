import type { Product } from "../data/products";
import TexturePanel from "./TexturePanel";
import Bottle from "./Bottle";
import Pedestal from "./Pedestal";

interface Props {
  product: Product;
  photoIndex?: number;
  className?: string;
  bottleSize?: string;
}

export default function ProductVisual({ product, photoIndex = 0, className = "", bottleSize = "w-20" }: Props) {
  const photo = product.photos?.[photoIndex];

  if (photo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img src={photo} alt={product.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      </div>
    );
  }

  return (
    <TexturePanel texture={product.texture} className={className}>
      <div className="flex flex-col items-center">
        <Bottle className={bottleSize} />
        <Pedestal className="w-28 -mt-1" />
      </div>
    </TexturePanel>
  );
}
