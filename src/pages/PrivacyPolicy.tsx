import LegalPage from "../components/LegalPage";
import { useI18n } from "../i18n/I18nProvider";

export default function PrivacyPolicy() {
  const { t } = useI18n();
  return (
    <LegalPage
      title={t("footer.privacyPolicy")}
      updated={t("legal.updatedDate")}
      sections={[
        {
          title: t("legal.privacyCollectTitle"),
          body: [t("legal.privacyCollectBody1"), t("legal.privacyCollectBody2")],
        },
        {
          title: t("legal.privacyUseTitle"),
          body: [t("legal.privacyUseBody1"), t("legal.privacyUseBody2")],
        },
        {
          title: t("legal.privacySecurityTitle"),
          body: [t("legal.privacySecurityBody1")],
        },
        {
          title: t("legal.privacyCookiesTitle"),
          body: [t("legal.privacyCookiesBody1")],
        },
        {
          title: t("legal.privacyRightsTitle"),
          body: [t("legal.privacyRightsBody1")],
        },
      ]}
    />
  );
}
