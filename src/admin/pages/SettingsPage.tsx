import React, { useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import { Save, CreditCard, Shield, Globe, Radio } from "lucide-react";

export const SettingsPage: React.FC = () => {
  const { storeSettings, updateStoreSettings } = useAdminData();

  const [activeTab, setActiveTab] = useState<"general" | "store" | "account" | "payment">(
    "general"
  );

  // General Form
  const [storeName, setStoreName] = useState(storeSettings.storeName);
  const [tagline, setTagline] = useState(storeSettings.tagline);
  const [email, setEmail] = useState(storeSettings.email);
  const [phone, setPhone] = useState(storeSettings.phone);
  const [whatsApp, setWhatsApp] = useState(storeSettings.whatsApp);
  const [address, setAddress] = useState(storeSettings.address);
  const [instagram, setInstagram] = useState(storeSettings.socialLinks.instagram);
  const [facebook, setFacebook] = useState(storeSettings.socialLinks.facebook);

  // Store Form
  const [currency, setCurrency] = useState(storeSettings.currency);
  const [currencySymbol, setCurrencySymbol] = useState(storeSettings.currencySymbol);
  const [taxRate, setTaxRate] = useState(storeSettings.taxRate);
  const [storeStatus, setStoreStatus] = useState(storeSettings.storeStatus);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      storeName,
      tagline,
      email,
      phone,
      whatsApp,
      address,
      socialLinks: {
        ...storeSettings.socialLinks,
        instagram,
        facebook,
      },
    });
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings({
      currency,
      currencySymbol,
      taxRate: Number(taxRate),
      storeStatus,
    });
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            SYSTEM CONTROL PANEL
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            Website & Atelier Storefront Settings
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            Configure boutique contact details, currency standards, tax rules, maintenance flags, and account security.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gold/15 pb-1">
        {[
          { id: "general", label: "General & Social", icon: Globe },
          { id: "store", label: "Store & Currency", icon: Radio },
          { id: "account", label: "Admin Security", icon: Shield },
          { id: "payment", label: "Payment Gateway Integration", icon: CreditCard },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-t text-xs font-sans uppercase tracking-wider flex items-center space-x-2 transition-all border-b-2 ${
                activeTab === tab.id
                  ? "border-gold text-gold font-bold bg-navy2/60"
                  : "border-transparent text-muted hover:text-ivory"
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-gold" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* General Settings */}
      {activeTab === "general" && (
        <form onSubmit={handleSaveGeneral} className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-6 shadow-xl">
          <h3 className="font-serif text-lg font-bold text-ivory border-b border-gold/15 pb-3">
            Boutique Contact & Brand Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Store Name *
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Concierge Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                WhatsApp Business Number
              </label>
              <input
                type="text"
                value={whatsApp}
                onChange={(e) => setWhatsApp(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Atelier Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gold/15 pt-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Instagram URL
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Facebook URL
              </label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save General Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Store & Currency */}
      {activeTab === "store" && (
        <form onSubmit={handleSaveStore} className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-6 shadow-xl">
          <h3 className="font-serif text-lg font-bold text-ivory border-b border-gold/15 pb-3">
            Currency & Store Maintenance Control
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Base Currency Code
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-gold font-mono font-bold focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Currency Symbol
              </label>
              <input
                type="text"
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Sales Tax Rate (%)
              </label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
              Storefront Status
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="Live"
                  checked={storeStatus === "Live"}
                  onChange={() => setStoreStatus("Live")}
                  className="text-gold focus:ring-0"
                />
                <span className="text-xs text-emerald-300 font-bold uppercase">
                  Live Online
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="Maintenance"
                  checked={storeStatus === "Maintenance"}
                  onChange={() => setStoreStatus("Maintenance")}
                  className="text-gold focus:ring-0"
                />
                <span className="text-xs text-amber-300 font-bold uppercase">
                  Maintenance Mode
                </span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Store Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* Account Security */}
      {activeTab === "account" && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-6 shadow-xl">
          <h3 className="font-serif text-lg font-bold text-ivory border-b border-gold/15 pb-3">
            Admin Profile & Security Authentication
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                Current Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <div className="p-4 rounded bg-navy border border-gold/15 flex items-center justify-between text-xs font-sans">
            <div>
              <p className="font-bold text-ivory">Two-Factor Authentication (2FA)</p>
              <p className="text-muted text-[11px]">
                Require an authenticator app OTP when accessing /admin console.
              </p>
            </div>
            <span className="text-emerald-400 font-mono uppercase font-bold text-[10px]">
              Enabled
            </span>
          </div>
        </div>
      )}

      {/* Payment Gateway Preparedness */}
      {activeTab === "payment" && (
        <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-gold/15 pb-3">
            <CreditCard className="w-5 h-5 text-gold" />
            <h3 className="font-serif text-lg font-bold text-ivory">
              Payment Gateway Readiness & Architecture
            </h3>
          </div>

          <div className="p-4 rounded bg-navy border border-gold/20 space-y-3 text-xs font-sans leading-relaxed text-muted">
            <span className="text-gold font-bold uppercase tracking-wider block">
              Architectural Preparedness Notice:
            </span>
            <p>
              The HM Signature Order & Database schemas are fully prepared for seamless connection to Stripe, PayPal, local bank payment gateways, or Supabase PostgreSQL database schemas.
            </p>
            <p>
              Fields for <code className="text-gold">paymentStatus</code>, <code className="text-gold">transactionId</code>, <code className="text-gold">refundStatus</code>, and <code className="text-gold">paymentMethod</code> are active across the entire order pipeline.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
