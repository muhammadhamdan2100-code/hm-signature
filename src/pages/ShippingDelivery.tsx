import { useEffect, useState } from "react";
import { Truck, Clock, MapPin, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchShippingConfig, DEFAULT_SHIPPING_CONFIG, type ShippingConfig } from "../services/storeConfig";
import { formatPKR } from "../utils/currency";
import { useI18n } from "../i18n/I18nProvider";

export default function ShippingDelivery() {
  const [shipping, setShipping] = useState<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);
  const { t } = useI18n();

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

  // Titles and bodies are dictionary copy; anything read from the shipping
  // configuration (the estimate, the threshold, the fee) is interpolated in.
  const sections = [
    {
      icon: Clock,
      titleKey: "legal.deliveryProcessingTitle",
      textKey: "legal.deliveryProcessingBody",
      vars: undefined as Record<string, string | number> | undefined,
    },
    {
      icon: Truck,
      titleKey: "legal.deliveryTimeTitle",
      textKey: "legal.deliveryTimeBody",
      vars: { days: estimatedDays },
    },
    {
      icon: MapPin,
      titleKey: "legal.deliveryCoverageTitle",
      textKey: "legal.deliveryCoverageBody",
      vars: undefined,
    },
    {
      icon: PackageCheck,
      titleKey: "legal.deliveryCostsTitle",
      textKey: "legal.deliveryCostsBody",
      vars: { threshold: formatPKR(shipping.freeThreshold), cost: formatPKR(shipping.standardCost) },
    },
  ];

  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="eyebrow mb-4">{t("footer.customerCare")}</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">{t("footer.shippingDelivery")}</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed">
            {t("legal.deliveryIntro")}
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[900px] mx-auto px-6 lg:px-10 grid sm:grid-cols-2 gap-8">
          {sections.map((s) => (
            <div key={s.titleKey} className="border border-gold/20 p-8">
              <s.icon size={26} strokeWidth={1.2} className="text-gold mb-5" />
              <h3 className="font-serif text-xl mb-3">{t(s.titleKey)}</h3>
              <p className="text-sm text-muted leading-relaxed">{t(s.textKey, s.vars)}</p>
            </div>
          ))}
        </div>

        <div className="max-w-[900px] mx-auto px-6 lg:px-10 mt-12 text-sm text-muted leading-relaxed border-t border-gold/15 pt-10">
          <p className="mb-4">
            {t("legal.deliveryTrackingPrefix")} <Link to="/track-order" className="text-goldLight hover:underline">{t("footer.trackOrder")}</Link> {t("legal.deliveryTrackingSuffix")}
          </p>
          <p>
            {t("legal.deliveryAccuracyBody")}
          </p>
        </div>
      </section>
    </div>
  );
}
