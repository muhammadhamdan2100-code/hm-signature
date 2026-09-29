import React, { useState } from "react";
import { TrendingUp, BarChart2, PieChart } from "lucide-react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  timeRanges?: string[];
  onTimeRangeChange?: (range: string) => void;
  type?: "line" | "bar" | "distribution";
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  timeRanges = ["7 days", "30 days", "3 months", "12 months"],
  onTimeRangeChange,
  type = "line",
}) => {
  const [activeRange, setActiveRange] = useState(timeRanges[1] || "30 days");

  const handleRangeClick = (range: string) => {
    setActiveRange(range);
    if (onTimeRangeChange) onTimeRangeChange(range);
  };

  // Generate realistic data points based on selected range
  const getPoints = () => {
    switch (activeRange) {
      case "7 days":
        return [
          { label: "Mon", value: 34000 },
          { label: "Tue", value: 42000 },
          { label: "Wed", value: 38000 },
          { label: "Thu", value: 51000 },
          { label: "Fri", value: 68000 },
          { label: "Sat", value: 89000 },
          { label: "Sun", value: 74000 },
        ];
      case "3 months":
        return [
          { label: "Jul W1", value: 180000 },
          { label: "Jul W3", value: 240000 },
          { label: "Aug W1", value: 310000 },
          { label: "Aug W3", value: 290000 },
          { label: "Sep W1", value: 380000 },
          { label: "Sep W3", value: 440000 },
        ];
      case "12 months":
        return [
          { label: "Oct", value: 420000 },
          { label: "Nov", value: 680000 },
          { label: "Dec", value: 950000 },
          { label: "Jan", value: 510000 },
          { label: "Feb", value: 480000 },
          { label: "Mar", value: 610000 },
          { label: "Apr", value: 580000 },
          { label: "May", value: 720000 },
          { label: "Jun", value: 790000 },
          { label: "Jul", value: 840000 },
          { label: "Aug", value: 910000 },
          { label: "Sep", value: 1120000 },
        ];
      default: // 30 days
        return [
          { label: "Day 1", value: 12000 },
          { label: "Day 5", value: 18000 },
          { label: "Day 10", value: 24000 },
          { label: "Day 15", value: 31000 },
          { label: "Day 20", value: 28000 },
          { label: "Day 25", value: 42000 },
          { label: "Day 30", value: 49000 },
        ];
    }
  };

  const points = getPoints();
  const maxValue = Math.max(...points.map((p) => p.value));

  return (
    <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 shadow-xl space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold/15 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              {title}
            </h3>
            <span className="p-1 rounded bg-gold/10 text-gold">
              {type === "line" && <TrendingUp className="w-4 h-4" />}
              {type === "bar" && <BarChart2 className="w-4 h-4" />}
              {type === "distribution" && <PieChart className="w-4 h-4" />}
            </span>
          </div>
          {subtitle && (
            <p className="text-xs text-muted font-sans font-light mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        {/* Time Tabs */}
        <div className="flex items-center space-x-1 bg-navy/80 p-1 rounded border border-gold/20 self-start sm:self-auto">
          {timeRanges.map((range) => (
            <button
              key={range}
              onClick={() => handleRangeClick(range)}
              className={`px-3 py-1 rounded text-[11px] font-sans transition-all ${
                activeRange === range
                  ? "bg-gold text-navy font-semibold shadow"
                  : "text-muted hover:text-ivory"
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Visualizer */}
      {type === "line" && (
        <div className="pt-2">
          {/* SVG Line Chart */}
          <div className="h-56 w-full relative flex items-end pt-4 pb-6">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150">
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C8A96B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#C8A96B" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="0" x2="500" y2="0" stroke="rgba(200,169,107,0.1)" strokeDasharray="4" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(200,169,107,0.1)" strokeDasharray="4" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(200,169,107,0.1)" strokeDasharray="4" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(200,169,107,0.1)" />

              {/* Area & Line */}
              {(() => {
                const stepX = 500 / (points.length - 1);
                const coords = points.map((p, i) => {
                  const x = i * stepX;
                  const y = 140 - (p.value / maxValue) * 120;
                  return { x, y };
                });

                const dPath = coords.reduce((acc, pt, i) => {
                  return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
                }, "");

                const areaPath = `${dPath} L 500,150 L 0,150 Z`;

                return (
                  <>
                    <path d={areaPath} fill="url(#goldGradient)" />
                    <path d={dPath} fill="none" stroke="#C8A96B" strokeWidth="3" />
                    {coords.map((pt, i) => (
                      <g key={i} className="group cursor-pointer">
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="4"
                          fill="#08111C"
                          stroke="#E0C27A"
                          strokeWidth="2"
                        />
                        <title>{`${points[i].label}: Rs. ${points[i].value.toLocaleString()}`}</title>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* Labels */}
          <div className="flex justify-between border-t border-gold/10 pt-3 text-[11px] text-muted font-mono num-lining">
            {points.map((p, idx) => (
              <span key={idx}>{p.label}</span>
            ))}
          </div>
        </div>
      )}

      {type === "bar" && (
        <div className="pt-2 space-y-4">
          <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2">
            {points.map((p, idx) => {
              const heightPct = Math.round((p.value / maxValue) * 100);

              return (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <div className="text-[10px] text-gold font-mono mb-2 opacity-0 group-hover:opacity-100 transition-opacity num-lining">
                    Rs.{(p.value / 1000).toFixed(0)}k
                  </div>
                  <div className="w-full bg-navy border border-gold/20 rounded-t h-full flex items-end p-1">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-gold/40 to-gold rounded-t transition-all duration-500 group-hover:from-gold group-hover:to-goldLight"
                    />
                  </div>
                  <span className="text-[11px] text-muted font-mono mt-3 num-lining">
                    {p.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
