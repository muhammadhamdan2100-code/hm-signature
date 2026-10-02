import React from "react";
import { useAdminData } from "../context/AdminDataContext";
import { ChartCard } from "../components/ChartCard";
import { StatCard } from "../components/StatCard";
import {
  DollarSign,
  TrendingUp,
  Users,
  Package,
} from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  const { products, orders } = useAdminData();

  const totalRevenue = orders.filter((o) => o.status !== "Cancelled").reduce((acc, o) => acc + o.total, 0);
  const totalItemsSold = orders.reduce(
    (acc, o) => acc + o.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            TELEMETRY & BUSINESS INTELLIGENCE
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Boutique Performance & Revenue Analytics
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Deep insights into order velocity, client acquisition metrics, top fragrance sales, and regional distribution.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Gross Revenue"
          value={`Rs. ${totalRevenue.toLocaleString()}`}
          change="+18.4%"
          isPositive={true}
          icon={DollarSign}
          accent={true}
        />
        <StatCard
          title="Average Order Value"
          value={`Rs. ${avgOrderValue.toLocaleString()}`}
          change="+5.2%"
          isPositive={true}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Bottles Sold"
          value={totalItemsSold}
          change="+12.0%"
          isPositive={true}
          icon={Package}
        />
        <StatCard
          title="Client Retention Rate"
          value="42.8%"
          change="+3.1%"
          isPositive={true}
          icon={Users}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard
          title="Revenue & Order Trajectory"
          subtitle="Monthly gross revenue and volume progression"
          type="line"
        />
        <ChartCard
          title="Sales by Olfactory Family"
          subtitle="Revenue distribution across fragrance categories"
          type="bar"
        />
      </div>

      {/* Regional & Top Fragrances Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Perfume Performers Table */}
        <div className="lg:col-span-2 bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              Top Perfumes by Revenue Generation
            </h3>
            <p className="text-xs text-muted font-light">
              Most requested extraits de parfum in the boutique catalog
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
                <tr>
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Fragrance</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3 text-right">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-ivory">
                {products.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-navy/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-gold font-bold">
                      #{idx + 1}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-serif font-bold text-sm text-ivory">
                        {p.name}
                      </div>
                      <span className="text-[10px] font-mono text-muted">{p.sku}</span>
                    </td>
                    <td className="py-3 px-3 text-muted">{p.category}</td>
                    <td className="py-3 px-3 font-mono text-gold font-semibold">
                      Rs. {p.price.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {p.stock} left
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Regional Breakdown */}
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              Orders by Regional Market
            </h3>
            <p className="text-xs text-muted font-light">Client delivery destinations</p>
          </div>

          <div className="space-y-4 font-sans">
            {[
              { region: "United Arab Emirates (Dubai / Abu Dhabi)", pct: 42, color: "bg-gold" },
              { region: "United Kingdom (London)", pct: 28, color: "bg-emerald-400" },
              { region: "Pakistan (Lahore / Karachi)", pct: 18, color: "bg-sky-400" },
              { region: "United States (New York)", pct: 12, color: "bg-indigo-400" },
            ].map((reg) => (
              <div key={reg.region} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-ivory">{reg.region}</span>
                  <span className="text-gold font-mono font-bold">{reg.pct}%</span>
                </div>
                <div className="w-full h-2 bg-navy rounded-full overflow-hidden border border-gold/10">
                  <div
                    style={{ width: `${reg.pct}%` }}
                    className={`h-full ${reg.color} transition-all duration-500`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
