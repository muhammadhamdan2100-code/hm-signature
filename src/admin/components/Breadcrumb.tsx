import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const { t } = useI18n();
  return (
    <nav className="flex items-center gap-2 text-xs font-sans text-muted mb-2">
      <Link
        to="/admin/dashboard"
        className="flex items-center gap-1 hover:text-gold transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>{t("admin.breadcrumb.admin")}</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-gold/60 shrink-0 rtl:rotate-180" />
            {isLast || !item.path ? (
              <span className="text-ivory font-medium truncate max-w-[200px]">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.path}
                className="hover:text-gold transition-colors truncate max-w-[200px]"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
