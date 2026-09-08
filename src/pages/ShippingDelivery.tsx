import { Truck, Clock, MapPin, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    icon: Clock,
    title: "Processing Time",
    text: "Orders are processed within 1–2 business days. You'll receive a confirmation email as soon as your fragrance is on its way.",
  },
  {
    icon: Truck,
    title: "Delivery Time",
    text: "Standard delivery takes 2–4 business days within major cities, and 4–7 business days to other areas across Pakistan.",
  },
  {
    icon: MapPin,
    title: "Coverage",
    text: "We currently deliver nationwide across Pakistan. International shipping is coming soon — join our newsletter to be notified.",
  },
  {
    icon: PackageCheck,
    title: "Shipping Costs",
    text: "Free shipping on all orders over Rs 6,000. Orders below this threshold incur a flat shipping fee of Rs 300.",
  },
];

export default function ShippingDelivery() {
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
            Once your order ships, you'll receive a tracking link by email and SMS. You can also check your order
            status any time on our <Link to="/track-order" className="text-goldLight hover:underline">Track Order</Link> page.
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
