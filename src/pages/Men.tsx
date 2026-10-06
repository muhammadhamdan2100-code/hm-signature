import ShopPage from "../components/ShopPage";
import { useI18n } from "../i18n/I18nProvider";

export default function Men() {
  const { t } = useI18n();
  return (
    <ShopPage
      eyebrow={t("shop.forHim")}
      title={t("shop.menTitle")}
      subtitle={t("shop.menSubtitle")}
      baseFilter={(p) => p.gender === "men" || p.gender === "unisex"}
      heroTexture="texture-wood"
    />
  );
}
