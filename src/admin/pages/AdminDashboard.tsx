import React from "react";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff } from "../../services/auth";
import { toDisplayRole } from "../../types/staff";
import { StatCard } from "../components/StatCard";
import { ChartCard } from "../components/ChartCard";
import { StatusBadge } from "../components/StatusBadge";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  PackageCheck,
  Truck,
  Users,
  Package,
  AlertTriangle,
  ArrowUpRight,
  Eye,
  Plus,
  TrendingUp,
  Layers,
  Sparkles,
  Star,
  Globe,
  Check,
  CreditCard,
  Ban,
  Boxes,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- 1. ORDER MANAGER DEDICATED DASHBOARD ---
const OrderManagerDashboard: React.FC = () => {
  const { orders } = useAdminData();
  const navigate = useNavigate();
  const currentStaff = getCurrentStaff();

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const processingOrders = orders.filter((o) => o.status === "Processing");
  const shippedOrders = orders.filter((o) => o.status === "Shipped");
  const outForDeliveryOrders = orders.filter((o) => o.status === "Out for Delivery");
  const deliveredOrders = orders.filter((o) => o.status === "Delivered");
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled");
  const newOrders = orders.filter((o) => o.createdAt === "2026-09-29");

  const pendingCodPayment = orders.filter(
    (o) => o.paymentMethod === "Cash on Delivery" && o.paymentStatus === "Pending"
  );
  const pendingTidVerification = orders.filter(
    (o) => o.paymentMethod !== "Cash on Delivery" && o.paymentStatus === "Pending"
  );

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-navy2 via-navy2 to-sky-950/40 p-6 rounded-xl border border-gold/30 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-sky-400 font-semibold">
            ORDER FULFILLMENT & DISPATCH CONCIERGE
          </span>
          <h1 className="text-2xl md:text-3xl font-serif text-ivory font-bold tracking-tight mt-1">
            Good morning, {currentStaff?.name || "Order Manager"} — Order Operations
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-xl">
            Live operations workspace for pending acquisitions, courier tracking IDs, payment verification, and order dispatch.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/orders")}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center space-x-2 shadow-lg shrink-0"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>View All Orders ({totalOrders})</span>
        </button>
      </div>

      {/* KPI Cards (8 Order Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        <StatCard
          title="New Orders Today"
          value={newOrders.length}
          subtitle="Received today"
          icon={ShoppingBag}
          accent={true}
          onClick={() => navigate("/admin/orders")}
        />
        <StatCard
          title="Pending Review"
          value={pendingOrders.length}
          subtitle="Action required"
          icon={Clock}
          onClick={() => navigate("/admin/orders?status=Pending")}
        />
        <StatCard
          title="In Atelier Packaging"
          value={processingOrders.length}
          subtitle="Processing batch"
          icon={PackageCheck}
          onClick={() => navigate("/admin/orders?status=Processing")}
        />
        <StatCard
          title="Shipped In Transit"
          value={shippedOrders.length}
          subtitle="Courier dispatched"
          icon={Truck}
          onClick={() => navigate("/admin/orders?status=Shipped")}
        />
        <StatCard
          title="Out for Delivery"
          value={outForDeliveryOrders.length}
          subtitle="Destination transit"
          icon={Truck}
        />
        <StatCard
          title="Delivered Orders"
          value={deliveredOrders.length}
          subtitle="Completed acquisitions"
          icon={Check}
        />
        <StatCard
          title="Cancelled Orders"
          value={cancelledOrders.length}
          subtitle="Voided requests"
          icon={Ban}
        />
        <StatCard
          title="Total Lifetime Orders"
          value={totalOrders}
          subtitle="Repository total"
          icon={Boxes}
          onClick={() => navigate("/admin/orders")}
        />
      </div>

      {/* Main Order Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-navy2/90 border border-gold/20 rounded-lg p-6 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-gold/15 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
                Recent Orders Requiring Fulfillment
              </h3>
              <p className="text-xs text-muted font-light">
                Monitor status transitions, courier dispatch, and tracking IDs
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-xs font-sans text-gold hover:text-goldLight flex items-center space-x-1 uppercase tracking-wider font-semibold"
            >
              <span>Manage All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
                <tr>
                  <th className="py-2.5 px-3">Order Number</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Tracking ID</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-ivory">
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id} className="hover:bg-navy/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-gold font-semibold num-lining">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium">{o.customerName}</div>
                      <div className="text-[10px] text-muted font-mono">{o.customerEmail}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="text-[11px] font-mono text-ivory block">{o.paymentMethod}</span>
                      <span className="text-[10px] text-gold font-mono uppercase">{o.paymentStatus}</span>
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-muted num-lining">
                      {o.trackingNumber || "Not Assigned"}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/orders/${o.id}`)}
                        className="px-3 py-1 bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory rounded text-[11px] font-sans transition-colors"
                      >
                        Fulfill →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Payment & Audit Actions */}
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-5 shadow-xl backdrop-blur-md">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              Payment Audit & Verification
            </h3>
            <p className="text-xs text-muted font-light mt-0.5">
              Review JazzCash, Raast references and COD collection notices
            </p>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-navy/80 border border-gold/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-ivory block">Digital Proof Audit</span>
                  <span className="text-[10px] text-muted font-mono">{pendingTidVerification.length} payments pending verification</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/admin/payments")}
                className="text-[11px] font-mono text-gold hover:underline"
              >
                Audit →
              </button>
            </div>

            <div className="p-3.5 bg-navy/80 border border-gold/20 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-ivory block">COD Collection Review</span>
                  <span className="text-[10px] text-muted font-mono">{pendingCodPayment.length} COD orders pending collection</span>
                </div>
              </div>
              <button
                onClick={() => navigate("/admin/payments")}
                className="text-[11px] font-mono text-gold hover:underline"
              >
                Review →
              </button>
            </div>
          </div>

          <div className="p-4 rounded bg-navy/60 border border-gold/15 text-xs text-muted leading-relaxed">
            <span className="text-gold font-bold uppercase tracking-wider block mb-1 font-serif">
              Courier Dispatch Reminder:
            </span>
            Confirm tracking ID and assign express courier before updating status to &quot;Shipped&quot;. Automated tracking notifications will be dispatched to clients immediately.
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 2. CONTENT MANAGER DEDICATED DASHBOARD ---
const ContentManagerDashboard: React.FC = () => {
  const { products, categories, collections, reviews, homepageConfig, campaigns } = useAdminData();
  const navigate = useNavigate();
  const currentStaff = getCurrentStaff();

  const activeProducts = products.filter((p) => p.active);
  const pendingReviews = reviews.filter((r) => r.status === "Pending");
  const activeCampaigns = campaigns.filter((c) => c.status === "Active");

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-navy2 via-navy2 to-emerald-950/40 p-6 rounded-xl border border-gold/30 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-emerald-400 font-semibold">
            CMS CATALOG & CONTENT WORKSPACE
          </span>
          <h1 className="text-2xl md:text-3xl font-serif text-ivory font-bold tracking-tight mt-1">
            Good morning, {currentStaff?.name || "Content Manager"} — Content Operations
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-xl">
            Curate rare extraits de parfum, categories, homepage CMS blocks, and moderate client reviews.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/products/new")}
          className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center space-x-2 shadow-lg shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Fragrance</span>
        </button>
      </div>

      {/* KPI Cards (Content Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        <StatCard
          title="Published Fragrances"
          value={activeProducts.length}
          subtitle="Active extraits"
          icon={Package}
          accent={true}
          onClick={() => navigate("/admin/products")}
        />
        <StatCard
          title="Fragrance Categories"
          value={categories.length}
          subtitle="Olfactory families"
          icon={Layers}
          onClick={() => navigate("/admin/categories")}
        />
        <StatCard
          title="Curated Collections"
          value={collections.length}
          subtitle="Special editions"
          icon={Sparkles}
          onClick={() => navigate("/admin/collections")}
        />
        <StatCard
          title="Pending Reviews"
          value={pendingReviews.length}
          subtitle="Moderation queue"
          icon={Star}
          onClick={() => navigate("/admin/reviews")}
        />
        <StatCard
          title="Homepage Sections"
          value={homepageConfig.sections.length}
          subtitle="CMS layout blocks"
          icon={Globe}
          onClick={() => navigate("/admin/homepage")}
        />
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns.length}
          subtitle="Banners & sales"
          icon={TrendingUp}
          onClick={() => navigate("/admin/marketing")}
        />
        <StatCard
          title="Total Client Reviews"
          value={reviews.length}
          subtitle="Feedback total"
          icon={Star}
          onClick={() => navigate("/admin/reviews")}
        />
        <StatCard
          title="Total Catalog SKUs"
          value={products.length}
          subtitle="Repository total"
          icon={Package}
          onClick={() => navigate("/admin/products")}
        />
      </div>

      {/* Content Management Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fragrance Catalog Overview Table */}
        <div className="lg:col-span-2 bg-navy2/90 border border-gold/20 rounded-lg p-6 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-gold/15 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
                Fragrance Extraits Catalog
              </h3>
              <p className="text-xs text-muted font-light">
                Edit descriptions, note pyramids, prices, and obsidian flacon imagery
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/products")}
              className="text-xs font-sans text-gold hover:text-goldLight flex items-center space-x-1 uppercase tracking-wider font-semibold"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
                <tr>
                  <th className="py-2.5 px-3">Fragrance</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Price</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-ivory">
                {products.slice(0, 6).map((p) => (
                  <tr key={p.id} className="hover:bg-navy/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-serif font-bold text-sm text-ivory">{p.name}</div>
                      <div className="text-[10px] text-muted font-mono">{p.concentration}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-gold num-lining">{p.sku}</td>
                    <td className="py-3 px-3">{p.category}</td>
                    <td className="py-3 px-3 font-mono num-lining">Rs. {p.price.toLocaleString()}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/products/${p.id}`)}
                        className="px-3 py-1 bg-navy border border-gold/30 hover:border-gold text-gold hover:text-ivory rounded text-[11px] font-sans transition-colors"
                      >
                        Edit CMS →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Reviews Moderation Widget */}
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl backdrop-blur-md">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              Reviews Moderation Queue
            </h3>
            <p className="text-xs text-muted font-light">Approve or reject client testimonials</p>
          </div>

          <div className="space-y-3">
            {pendingReviews.length > 0 ? (
              pendingReviews.map((r) => (
                <div key={r.id} className="p-3 rounded bg-navy/60 border border-gold/15 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-ivory">{r.customerName}</span>
                    <span className="text-gold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-gold text-gold" /> {r.rating}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted italic line-clamp-2">&quot;{r.review}&quot;</p>
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => navigate("/admin/reviews")}
                      className="text-[10px] font-mono text-gold hover:underline"
                    >
                      Moderate →
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted text-xs font-sans">
                No pending reviews requiring moderation.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 3. STORE MANAGER DASHBOARD ---
const ManagerDashboard: React.FC = () => {
  const { products, orders, customers } = useAdminData();
  const navigate = useNavigate();
  const currentStaff = getCurrentStaff();

  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-navy2 via-navy2 to-amber-950/40 p-6 rounded-xl border border-gold/30 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-amber-400 font-semibold">
            STORE MANAGEMENT WORKSPACE
          </span>
          <h1 className="text-2xl md:text-3xl font-serif text-ivory font-bold tracking-tight mt-1">
            Good morning, {currentStaff?.name || "Store Manager"} — Boutique Overview
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-xl">
            Store operations overview, inventory telemetry, client order fulfillment, and sales reports.
          </p>
        </div>
      </div>

      {/* KPI Cards (Manager Scope) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Revenue"
          value={`Rs. ${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          accent={true}
          onClick={() => navigate("/admin/analytics")}
        />
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={ShoppingBag}
          onClick={() => navigate("/admin/orders")}
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders.length}
          subtitle="Action required"
          icon={Clock}
          onClick={() => navigate("/admin/orders?status=Pending")}
        />
        <StatCard
          title="Active Fragrances"
          value={products.length}
          subtitle="Catalog SKUs"
          icon={Package}
          onClick={() => navigate("/admin/products")}
        />
        <StatCard
          title="Total Clients"
          value={customers.length}
          subtitle="VIP & Client profiles"
          icon={Users}
          onClick={() => navigate("/admin/customers")}
        />
        <StatCard
          title="Low Stock Warnings"
          value={lowStockProducts.length}
          subtitle="Restock required"
          icon={AlertTriangle}
          onClick={() => navigate("/admin/inventory")}
        />
      </div>

      {/* Main Charts & Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue Performance Trajectory"
            subtitle="Store sales metrics across selected horizons"
            type="line"
          />
        </div>

        {/* Low Stock Alerts Widget */}
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl backdrop-blur-md">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              Low Stock Restock Alerts
            </h3>
            <p className="text-xs text-muted font-light">Inventory thresholds requiring replenishment</p>
          </div>

          <div className="space-y-3">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="p-3 rounded bg-navy/60 border border-gold/15 flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-bold text-sm text-ivory">{p.name}</h4>
                  <p className="text-[10px] font-mono text-gold">Stock: {p.stock} bottles (Min: {p.lowStockThreshold})</p>
                </div>
                <button
                  onClick={() => navigate("/admin/inventory")}
                  className="px-2.5 py-1 bg-navy border border-gold/30 text-gold rounded text-[10px] font-mono"
                >
                  Restock →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 4. PRIMARY / SUPER ADMIN FULL EXECUTIVE DASHBOARD ---
const FullAdminDashboard: React.FC = () => {
  const { products, orders, customers } = useAdminData();
  const navigate = useNavigate();

  const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
  const todaysOrders = orders.filter((o) => o.createdAt === "2026-09-29");
  const todaysRevenue = todaysOrders.reduce((acc, o) => acc + o.total, 0);

  const pendingOrders = orders.filter((o) => o.status === "Pending");
  const processingOrders = orders.filter((o) => o.status === "Processing");
  const deliveredOrders = orders.filter((o) => o.status === "Delivered");
  const shippedOrders = orders.filter((o) => o.status === "Shipped");

  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);

  const totalOrdersCount = orders.length;
  const deliveredOrdersCount = deliveredOrders.length;
  const deliveredRatePct =
    totalOrdersCount > 0 ? ((deliveredOrdersCount / totalOrdersCount) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Top Executive Overview Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-navy2 via-navy2 to-burgundy/40 p-6 rounded-xl border border-gold/30 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            PRIMARY ATELIER EXECUTIVE OVERVIEW
          </span>
          <h1 className="text-2xl md:text-3xl font-serif text-ivory font-bold tracking-tight mt-1">
            Good morning, Muhammad Hamdan — HM Signature Overview
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-1 max-w-xl">
            Real-time telemetry for private fragrance orders, inventory extraits, client subscriptions, staff access, and boutique revenue streams.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => navigate("/admin/products/new")}
            className="px-4 py-2.5 bg-gold hover:bg-goldLight text-navy font-semibold rounded text-xs font-sans tracking-wider uppercase transition-colors flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Add Fragrance</span>
          </button>
          <button
            onClick={() => navigate("/admin/orders")}
            className="px-4 py-2.5 bg-navy border border-gold/30 hover:border-gold text-ivory rounded text-xs font-sans tracking-wider uppercase transition-colors"
          >
            Manage Orders
          </button>
        </div>
      </div>

      {/* Grid of Key Performance Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Revenue"
          value={`Rs. ${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          accent={true}
          onClick={() => navigate("/admin/analytics")}
        />
        <StatCard
          title="Today's Revenue"
          value={`Rs. ${todaysRevenue.toLocaleString()}`}
          subtitle={`${todaysOrders.length} orders today`}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Orders"
          value={orders.length}
          icon={ShoppingBag}
          onClick={() => navigate("/admin/orders")}
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrders.length}
          subtitle="Requires atelier review"
          icon={Clock}
          onClick={() => navigate("/admin/orders?status=Pending")}
        />
        <StatCard
          title="Processing Orders"
          value={processingOrders.length}
          subtitle="In bottle packaging"
          icon={PackageCheck}
        />
        <StatCard
          title="Delivered Orders"
          value={deliveredOrders.length}
          subtitle="Completed deliveries"
          icon={Truck}
        />
        <StatCard
          title="Total Clients"
          value={customers.length}
          subtitle="Registered profiles"
          icon={Users}
          onClick={() => navigate("/admin/customers")}
        />
        <StatCard
          title="Total Fragrances"
          value={products.length}
          subtitle="Active catalog SKUs"
          icon={Package}
          onClick={() => navigate("/admin/products")}
        />
        <StatCard
          title="Low Stock Warning"
          value={lowStockProducts.length}
          subtitle="Atelier restock alert"
          icon={AlertTriangle}
          onClick={() => navigate("/admin/inventory")}
        />
        <StatCard
          title="Delivered Rate"
          value={`${deliveredRatePct}%`}
          subtitle={`${deliveredOrdersCount} of ${totalOrdersCount} orders`}
          icon={PackageCheck}
        />
      </div>

      {/* Main Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartCard
            title="Revenue Performance Trend"
            subtitle="Extrait sales trajectory across selected time horizons"
            type="line"
          />
        </div>

        {/* Orders Status Distribution */}
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-5 shadow-xl backdrop-blur-md">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              Order Pipeline Distribution
            </h3>
            <p className="text-xs text-muted font-light mt-0.5">
              Live status ratios computed from real order repository
            </p>
          </div>

          <div className="space-y-4">
            {[
              { label: "Delivered", count: deliveredOrdersCount, color: "bg-emerald-400" },
              { label: "Processing", count: processingOrders.length, color: "bg-amber-400" },
              { label: "Pending", count: pendingOrders.length, color: "bg-sky-400" },
              { label: "Shipped", count: shippedOrders.length, color: "bg-indigo-400" },
            ].map((item) => {
              const pct = totalOrdersCount > 0 ? Math.round((item.count / totalOrdersCount) * 100) : 0;

              return (
                <div key={item.label} className="space-y-1.5 font-sans">
                  <div className="flex justify-between text-xs">
                    <span className="text-ivory font-medium">{item.label}</span>
                    <span className="text-gold font-mono num-lining">
                      {item.count} orders ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-navy rounded-full overflow-hidden border border-gold/10">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full ${item.color} transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-4 rounded bg-navy/60 border border-gold/15 text-xs text-muted leading-relaxed">
            <span className="text-gold font-bold uppercase tracking-wider block mb-1 font-serif">
              Atelier Pipeline Telemetry:
            </span>
            {pendingOrders.length} pending order(s) awaiting verification and {deliveredOrdersCount} completed delivery record(s) logged in the database.
          </div>
        </div>
      </div>

      {/* Recent Orders & Top Selling Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-navy2/90 border border-gold/20 rounded-lg p-6 shadow-xl space-y-4 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-gold/15 pb-3">
            <div>
              <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
                Recent Client Orders
              </h3>
              <p className="text-xs text-muted font-light">
                Latest transactions requiring dispatch and review
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-xs font-sans text-gold hover:text-goldLight flex items-center space-x-1 uppercase tracking-wider font-semibold"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-navy text-gold uppercase tracking-widest text-[10px] border-b border-gold/15">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Total</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10 text-ivory">
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="hover:bg-navy/50 transition-colors">
                    <td className="py-3 px-3 font-mono text-gold font-semibold num-lining">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-3">{o.customerName}</td>
                    <td className="py-3 px-3 font-mono num-lining font-medium">
                      Rs. {o.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="py-3 px-3 text-muted num-lining">{o.createdAt}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => navigate(`/admin/orders/${o.id}`)}
                        className="p-1 rounded text-gold hover:text-ivory hover:bg-navy transition-colors"
                        title="View order details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 shadow-xl space-y-4 backdrop-blur-md">
          <div className="border-b border-gold/15 pb-3">
            <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
              Top Perfumes
            </h3>
            <p className="text-xs text-muted font-light">Highest revenue extraits</p>
          </div>

          <div className="space-y-3">
            {products.slice(0, 4).map((p, idx) => (
              <div
                key={p.id}
                onClick={() => navigate(`/admin/products/${p.id}`)}
                className="flex items-center justify-between p-3 rounded bg-navy/60 border border-gold/10 hover:border-gold/30 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded bg-navy border border-gold/20 flex items-center justify-center shrink-0">
                    <span className="font-sans text-gold font-bold text-sm num-lining">
                      #{idx + 1}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-ivory">
                      {p.name}
                    </h4>
                    <p className="text-[10px] font-mono text-muted num-lining">{p.sku}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-gold font-semibold num-lining">
                  Rs. {p.price.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- DYNAMIC ROLE DASHBOARD SELECTOR ---
export const AdminDashboard: React.FC = () => {
  const currentStaff = getCurrentStaff();
  const displayRole = currentStaff ? toDisplayRole(currentStaff.role) : "Super Admin";

  if (displayRole === "Order Manager") {
    return <OrderManagerDashboard />;
  }

  if (displayRole === "Content Manager") {
    return <ContentManagerDashboard />;
  }

  if (displayRole === "Manager") {
    return <ManagerDashboard />;
  }

  return <FullAdminDashboard />;
};
