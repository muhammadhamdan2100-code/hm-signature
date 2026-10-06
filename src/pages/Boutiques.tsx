import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Clock, ExternalLink, MapPin, Phone } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n/I18nProvider";
import { useSeoMeta } from "../hooks/useSeoMeta";
import { listBoutiques, type BoutiqueRow } from "../services/paymentArchitecture";

// Our Boutiques. The records come from the boutiques table, which is intentionally empty until
// the business confirms a real address - this page never invents a location to fill a grid.

export default function Boutiques() {
  const { t } = useI18n();
  const { countries } = useCurrency();
  const [rows, setRows] = useState<BoutiqueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    let timer = 0;
    setLoading(true);
    setFailed(false);
    // A dropped connection can leave the request unsettled, and an endless skeleton is worse than
    // an honest failure the customer can act on, so the wait has a deadline.
    const deadline = new Promise<never>((_resolve, reject) => {
      timer = window.setTimeout(() => reject(new Error("boutique request timed out")), 10000);
    });
    Promise.race([listBoutiques(false), deadline])
      .then((list) => {
        if (alive) setRows(list);
      })
      .catch(() => {
        // A failure must not look like "no boutiques exist" — the two say different things to a
        // customer, and only one of them is recoverable by trying again.
        if (alive) {
          setRows([]);
          setFailed(true);
        }
      })
      .finally(() => {
        window.clearTimeout(timer);
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [attempt]);

  const byCountry = useMemo(() => {
    const map = new Map<string, BoutiqueRow[]>();
    rows.forEach((row) => {
      const list = map.get(row.countryCode) || [];
      list.push(row);
      map.set(row.countryCode, list);
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  useSeoMeta("/boutiques", t("seo.boutiquesTitle"), t("seo.boutiquesDescription"));

  const statusLabel = (status: string) =>
    status === "live"
      ? t("boutique.statusLive")
      : status === "closed"
      ? t("boutique.statusClosed")
      : t("checkout.methodComingSoon");

  return (
    <div className="pt-24 bg-navy min-h-screen pb-24">
      <section className="border-b border-gold/15">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="eyebrow mb-4">{t("boutique.eyebrow")}</div>
            <h1 className="font-serif text-4xl lg:text-5xl mb-4">{t("boutique.title")}</h1>
            <p className="text-muted leading-relaxed">{t("boutique.intro")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 space-y-14">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" role="status" aria-live="polite">
              <span className="sr-only">{t("nav.loadingPage")}</span>
              {[0, 1, 2].map((i) => (
                <div key={i} className="border border-gold/15 bg-navy2/40 rounded-lg p-6 space-y-3 animate-pulse">
                  <div className="h-4 w-2/3 bg-gold/10 rounded" />
                  <div className="h-3 w-1/3 bg-gold/10 rounded" />
                  <div className="h-3 w-full bg-gold/10 rounded" />
                  <div className="h-3 w-5/6 bg-gold/10 rounded" />
                </div>
              ))}
            </div>
          ) : failed ? (
            <div className="border border-gold/25 bg-navy2/60 rounded-lg p-10 text-center space-y-3 max-w-xl mx-auto">
              <AlertTriangle className="w-8 h-8 text-gold mx-auto" />
              <h2 className="font-serif text-2xl text-ivory">{t("boutique.errorTitle")}</h2>
              <p className="text-sm text-muted leading-relaxed">{t("boutique.errorBody")}</p>
              <button
                type="button"
                onClick={() => setAttempt((n) => n + 1)}
                className="btn-gold font-sans text-xs"
              >
                {t("common.retry")}
              </button>
            </div>
          ) : byCountry.length === 0 ? (
            <div className="border border-gold/25 bg-navy2/60 rounded-lg p-10 text-center space-y-3 max-w-xl mx-auto">
              <MapPin className="w-8 h-8 text-gold mx-auto" />
              <h2 className="font-serif text-2xl text-ivory">{t("boutique.emptyTitle")}</h2>
              <p className="text-sm text-muted leading-relaxed">{t("boutique.emptyBody")}</p>
            </div>
          ) : (
            byCountry.map(([countryCode, list]) => {
              const countryName = countries.find((c) => c.code === countryCode)?.name || countryCode;
              return (
                <div key={countryCode} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h2 className="font-serif text-2xl text-gold">{countryName}</h2>
                    <div className="flex-1 h-px bg-gold/20" />
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {list.map((row, i) => (
                      <motion.article
                        key={row.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-40px" }}
                        transition={{ duration: 0.5, delay: i * 0.05 }}
                        className="border border-gold/25 bg-navy2/60 rounded-lg p-6 space-y-3 flex flex-col"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-serif text-lg text-ivory font-bold leading-snug">{row.name}</h3>
                          <span className="shrink-0 px-2 py-0.5 rounded-full border border-gold/40 text-[9px] font-mono uppercase tracking-[1.5px] text-gold">
                            {statusLabel(row.status)}
                          </span>
                        </div>
                        <p className="text-xs text-muted flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" /> {row.city}
                        </p>
                        {row.address && <p className="text-xs text-muted leading-relaxed">{row.address}</p>}
                        {row.phone && (
                          <p className="text-xs text-muted flex items-center gap-2 font-mono">
                            <Phone className="w-3.5 h-3.5 shrink-0" /> {row.phone}
                          </p>
                        )}
                        {row.openingHours && (
                          <p className="text-xs text-muted flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5 shrink-0" /> {row.openingHours}
                          </p>
                        )}
                        {row.mapsUrl && (
                          <a
                            href={row.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-auto inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-gold hover:text-goldLight transition-colors"
                          >
                            {t("boutique.mapsLink")} <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </motion.article>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
