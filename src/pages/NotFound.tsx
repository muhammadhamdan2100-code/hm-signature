import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nProvider";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="pt-40 pb-40 text-center bg-navy min-h-screen">
      <div className="eyebrow mb-4">404</div>
      <h1 className="font-serif text-4xl mb-6">{t("common.notFoundTitle")}</h1>
      <p className="text-muted mb-10">{t("common.notFoundBody")}</p>
      <Link to="/" className="btn-gold-fill">{t("common.returnHome")}</Link>
    </div>
  );
}
