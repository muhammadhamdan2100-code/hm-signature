import ShopPage from "../components/ShopPage";
import { useI18n } from "../i18n/I18nProvider";

export default function Bestsellers() {
  const { t } = useI18n();
  return (
    <ShopPage
      eyebrow={t("shop.bestsellersEyebrow")}
      title={t("nav.bestsellers")}
      subtitle={t("shop.bestsellersSubtitle")}
      baseFilter={(p) => p.bestseller}
      heroTexture="texture-velvet"
    />
  );
}
