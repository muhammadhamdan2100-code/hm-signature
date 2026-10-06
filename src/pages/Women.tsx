import ShopPage from "../components/ShopPage";
import { useI18n } from "../i18n/I18nProvider";

export default function Women() {
  const { t } = useI18n();
  return (
    <ShopPage
      eyebrow={t("shop.forHer")}
      title={t("shop.womenTitle")}
      subtitle={t("shop.womenSubtitle")}
      baseFilter={(p) => p.gender === "women" || p.gender === "unisex"}
      heroTexture="texture-marble-champagne"
    />
  );
}
