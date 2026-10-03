import { useEffect, useState } from "react";
import { Truck, Clock, MapPin, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchShippingConfig, DEFAULT_SHIPPING_CONFIG, type ShippingConfig } from "../services/storeConfig";
import { formatPKR } from "../utils/currency";

export default function ShippingDelivery() {
  const [shipping, setShipping] = useState<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);

  useEffect(() => {
    let mounted = true;
    fetchShippingConfig()
      .then((config) => {
        if (mounted) setShipping(config);
      })
      .catch(() => {
        if (mounted) setShipping(DEFAULT_SHIPPING_CONFIG);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const estimatedDays = shipping.estimatedDays.toLowerCase();

  const sections = [
    {
      icon: Clock,
      title: "Processing Time",
      text: "Orders enter preparation once your payment is confirmed; cash-on-delivery orders begin as soon as the order is placed.",
    },
    {
      icon: Truck,
      title: "Delivery Time",
      text: `Standard delivery across Pakistan is estimated at ${estimatedDays}. Remote areas can take longer than the estimate.`,
    },
    {
      icon: MapPin,
      title: "Coverage",
      text: "We deliver nationwide across Pakistan. International shipping is not available at this time.",
    },
    {
      icon: PackageCheck,
      title: "Shipping Costs",
      text: `Free shipping on orders of ${formatPKR(shipping.freeThreshold)} or more. Below that threshold, a flat delivery fee of ${formatPKR(shipping.standardCost)} applies.`,
    },
  ];

  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="eyebrow mb-4">CUSTOMER CARE</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">Shipping &amp; Delivery</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed">
            Every order is packaged with the same care as the fragrance inside it.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[900px] mx-auto px-6 lg:px-10 grid sm:grid-cols-2 gap-8">
          {sections.map((s) => (
            <div key={s.title} className="border border-gold/20 p-8">
              <s.icon size={26} strokeWidth={1.2} className="text-gold mb-5" />
              <h3 className="font-serif text-xl mb-3">{s.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="max-w-[900px] mx-auto px-6 lg:px-10 mt-12 text-sm text-muted leading-relaxed border-t border-gold/15 pt-10">
          <p className="mb-4">
            A tracking reference is assigned when your order is dispatched. You can check your order status any
            time on our <Link to="/track-order" className="text-goldLight hover:underline">Track Order</Link> page.
          </p>
          <p>
            Please ensure your delivery address and phone number are accurate at checkout — HM Signature is not
            responsible for delays caused by incorrect address details.
          </p>
        </div>
      </section>
    </div>
  );
}
