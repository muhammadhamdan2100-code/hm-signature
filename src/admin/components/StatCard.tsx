import React from "react";
import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  subtitle?: string;
  accent?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  subtitle,
  accent = false,
  onClick,
}) => {
  const cardClass = `relative p-5 rounded-lg border transition-all duration-300 h-full flex flex-col justify-between ${
    accent
      ? "bg-gradient-to-br from-navy2 to-burgundy/40 border-gold/40 backdrop-blur-md"
      : "bg-navy2/80 backdrop-blur-md border-gold/20"
  }`;

  const content = (
    <>
      <div>
        <div className="flex items-start justify-between">
          <span className="text-[11px] font-sans uppercase tracking-[2px] text-gold font-medium pr-8 leading-snug">
            {title}
          </span>
          <div className="p-2 rounded bg-navy/60 border border-gold/20 text-gold shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <h3 className="text-2xl font-sans font-bold text-ivory tracking-tight num-lining">
            {value}
          </h3>
          {change && (
            <span
              className={`inline-flex items-center text-xs font-sans font-medium num-lining ${
                isPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {change}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <p className="mt-3 text-[11px] text-muted font-sans font-light">
          {subtitle}
        </p>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${cardClass} w-full text-left cursor-pointer hover:border-gold/60 hover:shadow-lg focus:outline-none focus-visible:ring-1 focus-visible:ring-gold`}
      >
        {content}
      </button>
    );
  }

  return <div className={cardClass}>{content}</div>;
};
