import LegalPage from "../components/LegalPage";
import { useI18n } from "../i18n/I18nProvider";

export default function RefundPolicy() {
  const { t } = useI18n();
  return (
    <LegalPage
      title={t("footer.refundPolicy")}
      updated={t("legal.updatedDate")}
      sections={[
        {
          title: t("legal.refundEligibilityTitle"),
          body: [t("legal.refundEligibilityBody1")],
        },
        {
          title: t("legal.refundMethodTitle"),
          body: [t("legal.refundMethodBody1")],
        },
        {
          title: t("legal.refundDamagedTitle"),
          body: [t("legal.refundDamagedBody1")],
        },
        {
          title: t("legal.refundExcludedTitle"),
          body: [t("legal.refundExcludedBody1")],
        },
        {
          title: t("legal.refundShippingTitle"),
          body: [t("legal.refundShippingBody1")],
        },
      ]}
    />
  );
}
