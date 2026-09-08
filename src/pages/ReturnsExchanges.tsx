import { RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function ReturnsExchanges() {
  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="eyebrow mb-4">CUSTOMER CARE</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">Returns &amp; Exchanges</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed">
            We want you to love your signature scent — here's how we make it right if you don't.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[900px] mx-auto px-6 lg:px-10 grid sm:grid-cols-3 gap-8 mb-16">
          <div className="border border-gold/20 p-8 text-center">
            <RotateCcw size={26} strokeWidth={1.2} className="text-gold mx-auto mb-5" />
            <h3 className="font-serif text-lg mb-3">30-Day Window</h3>
            <p className="text-sm text-muted leading-relaxed">Returns accepted within 30 days of delivery.</p>
          </div>
          <div className="border border-gold/20 p-8 text-center">
            <ShieldCheck size={26} strokeWidth={1.2} className="text-gold mx-auto mb-5" />
            <h3 className="font-serif text-lg mb-3">Unopened Only</h3>
            <p className="text-sm text-muted leading-relaxed">Items must be unused, sealed, and in original packaging.</p>
          </div>
          <div className="border border-gold/20 p-8 text-center">
            <XCircle size={26} strokeWidth={1.2} className="text-gold mx-auto mb-5" />
            <h3 className="font-serif text-lg mb-3">Full Refund</h3>
            <p className="text-sm text-muted leading-relaxed">Refunded to your original payment method within 7 business days.</p>
          </div>
        </div>

        <div className="max-w-[800px] mx-auto px-6 lg:px-10 space-y-8 text-sm text-muted leading-relaxed">
          <div>
            <h3 className="font-serif text-xl text-ivory mb-3">How to Start a Return</h3>
            <p>
              Contact our team via the <Link to="/contact" className="text-goldLight hover:underline">Contact page</Link> with
              your order number and reason for return. We'll send you return instructions and a prepaid shipping label
              where applicable.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ivory mb-3">Exchanges</h3>
            <p>
              Prefer a different fragrance? We're happy to exchange an unopened item for another HM Signature product
              of equal or lesser value — any price difference for a higher-priced item can be paid at the time of exchange.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ivory mb-3">Non-Returnable Items</h3>
            <p>
              For hygiene reasons, opened or used fragrances cannot be returned or exchanged unless the product arrived
              damaged or defective.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ivory mb-3">Damaged or Incorrect Orders</h3>
            <p>
              If your order arrives damaged or you received the wrong item, contact us within 48 hours of delivery with
              photos of the product and packaging, and we'll arrange a free replacement or full refund.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
