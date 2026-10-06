import React from "react";
import { Globe, Search } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

interface GoogleSeoPreviewProps {
  title: string;
  description: string;
  url: string;
}

export const GoogleSeoPreview: React.FC<GoogleSeoPreviewProps> = ({
  title,
  description,
  url,
}) => {
  const { t } = useI18n();
  return (
    <div className="bg-navy border border-gold/20 rounded-lg p-5 space-y-3">
      <div className="flex items-center gap-2 text-muted text-xs border-b border-gold/10 pb-2">
        <Search className="w-3.5 h-3.5 text-gold" />
        <span className="uppercase tracking-widest text-[10px] text-gold font-mono">
          {t("admin.googleSeoPreview.snippetPreview")}
        </span>
      </div>

      <div className="space-y-1 font-sans">
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono truncate">
          <Globe className="w-3.5 h-3.5 shrink-0" />
          <span>{url || "https://hmsignature.com"}</span>
        </div>
        <h4 className="text-base font-medium text-sky-400 hover:underline cursor-pointer tracking-tight line-clamp-1">
          {title || "HM Signature — Luxury Fragrance Commerce"}
        </h4>
        <p className="text-xs text-muted/90 leading-relaxed line-clamp-2">
          {description ||
"Discover HM Signature's luxury extraits de parfum, artisanal bottles, rare botanical oils, and signature wooden presentation flacons."}
        </p>
      </div>
    </div>
  );
};
