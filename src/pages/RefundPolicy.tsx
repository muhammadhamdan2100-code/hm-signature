import LegalPage from "../components/LegalPage";

export default function RefundPolicy() {
  return (
    <LegalPage
      title="Refund Policy"
      updated="September 2026"
      sections={[
        {
          title: "Eligibility",
          body: [
            "Refunds are available for unopened, unused fragrances returned within 30 days of delivery in their original packaging. See our Returns & Exchanges page for the full process.",
          ],
        },
        {
          title: "Refund Method",
          body: [
            "Approved refunds are issued to your original payment method within 7 business days of us receiving the returned item. Cash-on-delivery orders are refunded via bank transfer.",
          ],
        },
        {
          title: "Damaged or Defective Items",
          body: [
            "If your order arrives damaged or defective, contact us within 48 hours of delivery with photos of the item and packaging for a full refund or free replacement — no return shipping required.",
          ],
        },
        {
          title: "Non-Refundable Situations",
          body: [
            "Opened or used fragrances, items returned after the 30-day window, and gift cards are not eligible for a refund.",
          ],
        },
        {
          title: "Shipping Costs",
          body: [
            "Original shipping fees are non-refundable unless the return is due to our error (wrong or damaged item).",
          ],
        },
      ]}
    />
  );
}
