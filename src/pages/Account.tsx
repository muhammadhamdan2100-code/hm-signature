import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAdminData } from "../admin/context/AdminDataContext";
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  LogOut,
  Package,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

export default function Account() {
  const { user, addresses, logout, updateProfile, addAddress, removeAddress } = useAuth();
  const { orders } = useAdminData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tab State: 'orders' | 'profile' | 'addresses' | 'wishlist' | 'password'
  const activeTabFromUrl = searchParams.get("tab") || "orders";
  const [activeTab, setActiveTab] = useState<string>(activeTabFromUrl);

  useEffect(() => {
    if (searchParams.get("tab")) {
      setActiveTab(searchParams.get("tab") || "orders");
    }
  }, [searchParams]);

  // Profile Edit State
  const [editName, setEditName] = useState(user?.fullName || "");
  const [editPhone, setEditPhone] = useState(user?.phone || "");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newTitle, setNewTitle] = useState("Residence");
  const [newLine1, setNewLine1] = useState("");
  const [newCity, setNewCity] = useState("Lahore");
  const [newPostal, setNewPostal] = useState("54600");

  if (!user) {
    return <Navigate to="/login?next=/account" replace />;
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ fullName: editName, phone: editPhone });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordMsg("Password updated successfully.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordMsg(""), 3000);
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLine1 || !newCity) return;
    addAddress({
      title: newTitle,
      addressLine1: newLine1,
      city: newCity,
      postalCode: newPostal,
      country: "Pakistan",
      isDefault: addresses.length === 0,
    });
    setNewLine1("");
    setShowAddressForm(false);
  };

  // Filter orders for logged-in user
  const clientOrders = orders.filter(
    (o) =>
      o.customerEmail.toLowerCase() === user.email.toLowerCase() ||
      o.customerName.toLowerCase() === user.fullName.toLowerCase() ||
      user.role !== "customer"
  );

  return (
    <div className="pt-28 pb-20 bg-navy min-h-screen text-ivory">
      <div className="max-w-6xl mx-auto px-6 space-y-8">
        {/* Header Card */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy2 p-6 rounded-xl border border-gold/30 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center font-serif text-gold font-bold text-2xl">
              {user.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-[2px] text-gold font-semibold">
                  PRIVILEGED MEMBER
                </span>
                {user.role !== "customer" && (
                  <span className="px-2 py-0.5 rounded text-[9px] bg-gold text-navy font-bold uppercase tracking-wider">
                    {user.role}
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-serif font-bold text-ivory">{user.fullName}</h1>
              <p className="text-xs text-muted font-sans">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {user.role !== "customer" && (
              <button
                onClick={() => navigate("/admin")}
                className="px-4 py-2 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs uppercase tracking-wider flex items-center space-x-2 shadow-lg transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Suite</span>
              </button>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 border border-rose-500/30 text-rose-300 hover:bg-rose-950/40 rounded text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-gold/20 pb-2 overflow-x-auto">
          {[
            { id: "orders", label: "My Orders", icon: ShoppingBag, count: clientOrders.length },
            { id: "profile", label: "Client Profile", icon: User },
            { id: "password", label: "Security & Password", icon: KeyRound },
            { id: "addresses", label: "Saved Addresses", icon: MapPin, count: addresses.length },
            { id: "wishlist", label: "Bespoke Wishlist", icon: Heart },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-xs font-sans uppercase tracking-wider font-semibold flex items-center space-x-2 transition-colors shrink-0 ${
                  isActive
                    ? "bg-gold text-navy shadow-md"
                    : "text-muted hover:text-ivory hover:bg-navy2/60 border border-gold/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? "bg-navy text-gold" : "bg-gold/20 text-gold"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Orders */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-serif text-xl font-bold text-ivory">Purchase & Dispatch History</h2>
            {clientOrders.length === 0 ? (
              <div className="bg-navy2 p-12 text-center rounded-xl border border-gold/20 space-y-4">
                <Package className="w-12 h-12 text-gold mx-auto opacity-60" />
                <h3 className="font-serif text-lg text-ivory">No Orders Recorded Yet</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  Your bespoke fragrance acquisitions will appear here alongside real-time laboratory status and tracking details.
                </p>
                <Link to="/collections" className="inline-block px-6 py-2.5 bg-gold text-navy font-bold rounded text-xs uppercase tracking-wider">
                  Explore Perfume Extraits
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {clientOrders.map((o) => (
                  <div key={o.id} className="bg-navy2 border border-gold/20 rounded-xl p-6 shadow-lg space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold/15 pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-gold tracking-widest block">ORDER REFERENCE</span>
                        <h3 className="font-mono font-bold text-lg text-ivory">{o.orderNumber}</h3>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider ${
                          o.status === "Delivered"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800/40"
                            : o.status === "Shipped"
                            ? "bg-indigo-950 text-indigo-300 border border-indigo-800/40"
                            : "bg-amber-950 text-amber-300 border border-amber-800/40"
                        }`}>
                          {o.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-gold">
                          Rs. {o.total.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                      <div>
                        <span className="text-muted block text-[10px] uppercase">Placement Date</span>
                        <span className="text-ivory font-medium">{o.createdAt}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px] uppercase">Payment Method</span>
                        <span className="text-ivory font-medium">{o.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-muted block text-[10px] uppercase">Shipping Destination</span>
                        <span className="text-ivory font-medium">{o.shippingAddress?.city || "Lahore"}, Pakistan</span>
                      </div>
                    </div>

                    {o.items && o.items.length > 0 && (
                      <div className="bg-navy/60 p-3 rounded border border-gold/10 space-y-2">
                        {o.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-ivory">{item.name || (item as any).productName} (x{item.quantity})</span>
                            <span className="font-mono text-gold">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Profile */}
        {activeTab === "profile" && (
          <div className="max-w-2xl bg-navy2 border border-gold/20 p-6 rounded-xl space-y-6 animate-fade-in">
            <h2 className="font-serif text-xl font-bold text-ivory">Client Profile Specifications</h2>

            {saveSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs rounded flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Profile details updated successfully.</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-4 font-sans text-xs">
              <label className="block">
                <span className="text-muted text-[10px] uppercase block mb-1">Full Name</span>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-navy border border-gold/20 px-3.5 py-2.5 text-ivory focus:outline-none focus:border-gold rounded"
                />
              </label>

              <label className="block">
                <span className="text-muted text-[10px] uppercase block mb-1">Email Address (Read Only)</span>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-navy/40 border border-gold/10 px-3.5 py-2.5 text-muted rounded cursor-not-allowed"
                />
              </label>

              <label className="block">
                <span className="text-muted text-[10px] uppercase block mb-1">Contact Phone Number</span>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full bg-navy border border-gold/20 px-3.5 py-2.5 text-ivory focus:outline-none focus:border-gold rounded"
                />
              </label>

              <button
                type="submit"
                className="px-6 py-2.5 bg-gold text-navy font-bold rounded text-xs uppercase tracking-wider hover:bg-goldLight transition-colors"
              >
                Save Profile Changes
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Password & Security */}
        {activeTab === "password" && (
          <div className="max-w-2xl bg-navy2 border border-gold/20 p-6 rounded-xl space-y-6 animate-fade-in">
            <h2 className="font-serif text-xl font-bold text-ivory">Security & Password</h2>

            {passwordMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 text-xs rounded flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{passwordMsg}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-rose-950/60 border border-rose-800/40 text-rose-300 text-xs rounded">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4 font-sans text-xs">
              <label className="block">
                <span className="text-muted text-[10px] uppercase block mb-1">Current Password</span>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-navy border border-gold/20 px-3.5 py-2.5 text-ivory focus:outline-none focus:border-gold rounded"
                />
              </label>

              <label className="block">
                <span className="text-muted text-[10px] uppercase block mb-1">New Password</span>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-navy border border-gold/20 px-3.5 py-2.5 text-ivory focus:outline-none focus:border-gold rounded"
                />
              </label>

              <label className="block">
                <span className="text-muted text-[10px] uppercase block mb-1">Confirm New Password</span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-navy border border-gold/20 px-3.5 py-2.5 text-ivory focus:outline-none focus:border-gold rounded"
                />
              </label>

              <button
                type="submit"
                className="px-6 py-2.5 bg-gold text-navy font-bold rounded text-xs uppercase tracking-wider hover:bg-goldLight transition-colors"
              >
                Update Password
              </button>
            </form>
          </div>
        )}

        {/* Tab 4: Addresses */}
        {activeTab === "addresses" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-ivory">Saved Delivery Addresses</h2>
              <button
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="px-4 py-2 bg-gold text-navy font-bold text-xs uppercase tracking-wider rounded"
              >
                {showAddressForm ? "Cancel" : "+ Add New Address"}
              </button>
            </div>

            {showAddressForm && (
              <form onSubmit={handleAddAddress} className="bg-navy2 border border-gold/30 p-6 rounded-xl space-y-4 max-w-xl font-sans text-xs">
                <h3 className="font-serif text-base text-ivory font-bold">New Delivery Address</h3>
                <div className="grid grid-cols-3 gap-3">
                  <label className="block">
                    <span className="text-muted text-[10px] uppercase block mb-1">Label</span>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-navy border border-gold/20 px-3 py-2 text-ivory rounded"
                    />
                  </label>
                  <label className="block">
                    <span className="text-muted text-[10px] uppercase block mb-1">City</span>
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full bg-navy border border-gold/20 px-3 py-2 text-ivory rounded"
                    />
                  </label>
                  <label className="block">
                    <span className="text-muted text-[10px] uppercase block mb-1">Postal Code</span>
                    <input
                      type="text"
                      value={newPostal}
                      onChange={(e) => setNewPostal(e.target.value)}
                      className="w-full bg-navy border border-gold/20 px-3 py-2 text-ivory rounded"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-muted text-[10px] uppercase block mb-1">Street Address</span>
                  <input
                    type="text"
                    required
                    value={newLine1}
                    onChange={(e) => setNewLine1(e.target.value)}
                    placeholder="Boutique Residence, Street Number..."
                    className="w-full bg-navy border border-gold/20 px-3 py-2 text-ivory rounded"
                  />
                </label>
                <button type="submit" className="px-5 py-2 bg-gold text-navy font-bold uppercase rounded text-xs">
                  Save Address
                </button>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="bg-navy2 border border-gold/20 p-5 rounded-xl space-y-2 relative font-sans text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gold uppercase tracking-wider">{addr.title}</span>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 rounded text-[9px] bg-gold/15 text-gold border border-gold/30">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-ivory font-medium">{addr.addressLine1}</p>
                  <p className="text-muted">{addr.city}, {addr.postalCode}, {addr.country}</p>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => removeAddress(addr.id)}
                      className="text-rose-400 text-[10px] uppercase hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Wishlist */}
        {activeTab === "wishlist" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="font-serif text-xl font-bold text-ivory">Bespoke Fragrance Wishlist</h2>
            <div className="bg-navy2 p-8 text-center rounded-xl border border-gold/20 space-y-4">
              <Heart className="w-10 h-10 text-gold mx-auto opacity-70" />
              <p className="text-xs text-muted max-w-sm mx-auto">
                Explore our catalog and save your favored extraits for future acquisition.
              </p>
              <Link to="/collections" className="inline-block px-5 py-2 bg-gold text-navy font-bold rounded text-xs uppercase tracking-wider">
                Browse Fragrances
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
