import LegalPage from "../components/LegalPage";
import { useI18n } from "../i18n/I18nProvider";

export default function TermsConditions() {
  const { t } = useI18n();
  return (
    <LegalPage
      title={t("footer.terms")}
      updated={t("legal.updatedDate")}
      sections={[
        {
          title: t("legal.termsAcceptanceTitle"),
          body: [t("legal.termsAcceptanceBody1")],
        },
        {
          title: t("legal.termsOrdersTitle"),
          body: [t("legal.termsOrdersBody1")],
        },
        {
          title: t("legal.termsProductTitle"),
          body: [t("legal.termsProductBody1")],
        },
        {
          title: t("legal.termsIpTitle"),
          body: [t("legal.termsIpBody1")],
        },
        {
          title: t("legal.termsLiabilityTitle"),
          body: [t("legal.termsLiabilityBody1")],
        },
        {
          title: t("legal.termsLawTitle"),
          body: [t("legal.termsLawBody1")],
        },
      ]}
    />
  );
}
