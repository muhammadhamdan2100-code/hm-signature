import ShopPage from "../components/ShopPage";
import { useI18n } from "../i18n/I18nProvider";

export default function Collections() {
  const { t } = useI18n();
  return (
    <ShopPage
      eyebrow={t("home.collectionsEyebrow")}
      title={t("home.collectionsTitle")}
      subtitle={t("home.collectionsBody")}
      baseFilter={() => true}
      heroTexture="texture-marble-champagne"
    />
  );
}
