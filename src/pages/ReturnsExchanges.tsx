import { RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nProvider";

export default function ReturnsExchanges() {
  const { t } = useI18n();
  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="eyebrow mb-4">{t("footer.customerCare")}</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">{t("footer.returnsExchanges")}</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed">
            {t("legal.returnsIntro")}
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[900px] mx-auto px-6 lg:px-10 grid sm:grid-cols-3 gap-8 mb-16">
          <div className="border border-gold/20 p-8 text-center">
            <RotateCcw size={26} strokeWidth={1.2} className="text-gold mx-auto mb-5" />
            <h3 className="font-serif text-lg mb-3">{t("legal.returnsWindowTitle")}</h3>
            <p className="text-sm text-muted leading-relaxed">{t("legal.returnsWindowBody")}</p>
          </div>
          <div className="border border-gold/20 p-8 text-center">
            <ShieldCheck size={26} strokeWidth={1.2} className="text-gold mx-auto mb-5" />
            <h3 className="font-serif text-lg mb-3">{t("legal.returnsUnopenedTitle")}</h3>
            <p className="text-sm text-muted leading-relaxed">{t("legal.returnsUnopenedBody")}</p>
          </div>
          <div className="border border-gold/20 p-8 text-center">
            <XCircle size={26} strokeWidth={1.2} className="text-gold mx-auto mb-5" />
            <h3 className="font-serif text-lg mb-3">{t("legal.returnsFullRefundTitle")}</h3>
            <p className="text-sm text-muted leading-relaxed">{t("legal.returnsFullRefundBody")}</p>
          </div>
        </div>

        <div className="max-w-[800px] mx-auto px-6 lg:px-10 space-y-8 text-sm text-muted leading-relaxed">
          <div>
            <h3 className="font-serif text-xl text-ivory mb-3">{t("legal.returnsHowTitle")}</h3>
            <p>
              {t("legal.returnsHowBodyPrefix")} <Link to="/contact" className="text-goldLight hover:underline">{t("common.contactPage")}</Link> {t("legal.returnsHowBodySuffix")}
            </p>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ivory mb-3">{t("legal.returnsExchangesTitle")}</h3>
            <p>
              {t("legal.returnsExchangesBody")}
            </p>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ivory mb-3">{t("legal.returnsNonReturnableTitle")}</h3>
            <p>
              {t("legal.returnsNonReturnableBody")}
            </p>
          </div>
          <div>
            <h3 className="font-serif text-xl text-ivory mb-3">{t("legal.returnsDamagedTitle")}</h3>
            <p>
              {t("legal.returnsDamagedBody")}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
