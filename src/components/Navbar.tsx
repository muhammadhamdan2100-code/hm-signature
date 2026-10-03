import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Heart, ShoppingBag, Menu, X, Building2, LogOut, LayoutDashboard, UserCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";

const navLinks = [
  { label: "Collections", to: "/collections" },
  { label: "Men", to: "/men" },
  { label: "Women", to: "/women" },
  { label: "Bestsellers", to: "/bestsellers" },
  { label: "Scent Finder", to: "/scent-finder" },
  { label: "Contact", to: "/contact" },
  { label: "About Us", to: "/?section=about", secondary: true },
  { label: "Journal", to: "/journal", secondary: true },
  { label: "Parent Company", to: "/parent-company", secondary: true },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [query, setQuery] = useState("");

  const { itemCount, openCart } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Escape closes the account dropdown and the full-screen menu.
  useEffect(() => {
    if (!menuOpen && !userDropdownOpen && !searchOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      setUserDropdownOpen(false);
      setSearchOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen, userDropdownOpen, searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/collections?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  const handleUserClick = () => {
    if (!user) {
      navigate("/login");
    } else {
      setUserDropdownOpen((prev) => !prev);
    }
  };

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    await logout();
    navigate("/");
  };

  const firstName = user?.fullName ? user.fullName.split(" ")[0] : "Account";

  return (
    <>
      <nav
        aria-label="Main"
        className={`fixed top-0 left-0 right-0 z-40 border-b transition-all duration-300 ${
          scrolled
            ? "bg-navy/90 backdrop-blur-md py-3 border-gold/30"
            : "bg-navy py-5 border-gold/20"
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 flex items-center justify-between">
          <Link to="/" className="flex items-center shrink-0">
            <img src="/logo.png" alt="HM Signature" className={`transition-all duration-300 ${scrolled ? "h-9" : "h-11"}`} />
          </Link>

          <div className="hidden lg:flex items-center gap-5 xl:gap-6 2xl:gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.label}
                to={l.to}
                className={`relative text-[11px] tracking-[2px] uppercase group py-1${
                  (l as any).secondary ? " hidden xl:inline-block" : ""
                }`}
              >
                {l.label}
                <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3 lg:gap-4 xl:gap-5">
            <button aria-label="Search" aria-expanded={searchOpen} aria-controls="navbar-search" className="hidden sm:inline-flex items-center justify-center min-h-11 min-w-11 hover:text-goldLight transition-colors" onClick={() => setSearchOpen((s) => !s)}>
              <Search size={18} strokeWidth={1.3} />
            </button>
            <Link to="/wishlist" aria-label="Wishlist" className="hidden sm:inline-flex items-center justify-center relative min-h-11 min-w-11 hover:text-goldLight transition-colors">
              <Heart size={18} strokeWidth={1.3} />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-navy text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link
              to="/parent-company"
              aria-label="Parent Company"
              title="Xeltrio Technologies — Parent Company"
              className="hidden sm:block xl:hidden hover:text-goldLight transition-colors"
            >
              <Building2 size={18} strokeWidth={1.3} />
            </Link>

            {/* Unified User / Account Icon Dropdown */}
            <div className="relative hidden sm:block" ref={dropdownRef}>
              <button
                aria-label="Account"
                aria-haspopup="true"
                aria-expanded={userDropdownOpen}
                onClick={handleUserClick}
                className="hover:text-goldLight transition-colors flex items-center justify-center space-x-1 min-h-11 px-1"
                title={user ? `Logged in as ${user.fullName}` : "Account Sign In"}
              >
                <User size={18} strokeWidth={1.3} className={user ? "text-gold" : ""} />
                {user && (
                  <span className="text-[11px] font-sans font-medium text-gold ml-1 max-w-[80px] truncate">
                    {firstName}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {userDropdownOpen && user && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-56 bg-navy2 border border-gold/30 rounded-lg shadow-2xl py-2 z-50 overflow-hidden"
                  >
                    {/* Header info */}
                    <div className="px-4 py-2.5 border-b border-gold/15 bg-navy/60">
                      <p className="text-xs font-serif font-bold text-ivory truncate">{user.fullName}</p>
                      <p className="text-[10px] font-mono text-muted truncate">{user.email}</p>

                      <span className="inline-block mt-1 text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-gold/15 text-gold border border-gold/30 font-semibold tracking-wider">
                        {user.role}
                      </span>
                    </div>

                    {/* Menu links */}
                    <div className="py-1">
                      {isAdmin ? (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="w-full text-left px-4 py-2 text-xs font-sans text-gold hover:text-ivory hover:bg-gold/10 transition-colors flex items-center space-x-2"
                          >
                            <LayoutDashboard size={14} className="text-gold" />
                            <span>Boutique Dashboard</span>
                          </Link>

                          <Link
                            to="/account"
                            onClick={() => setUserDropdownOpen(false)}
                            className="w-full text-left px-4 py-2 text-xs font-sans text-ivory hover:text-gold hover:bg-gold/10 transition-colors flex items-center space-x-2"
                          >
                            <UserCheck size={14} className="text-muted" />
                            <span>My Profile</span>
                          </Link>
                        </>
                      ) : (
                        <Link
                          to="/account"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs font-sans text-ivory hover:text-gold hover:bg-gold/10 transition-colors flex items-center space-x-2"
                        >
                          <UserCheck size={14} className="text-gold" />
                          <span>My Account</span>
                        </Link>
                      )}

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-xs font-sans text-rose-300 hover:text-rose-100 hover:bg-rose-950/30 transition-colors flex items-center space-x-2 border-t border-gold/10 mt-1 pt-2"
                      >
                        <LogOut size={14} />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button aria-label="Bag" className="relative inline-flex items-center justify-center min-h-11 min-w-11 hover:text-goldLight transition-colors" onClick={openCart}>
              <ShoppingBag size={18} strokeWidth={1.3} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-navy text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </button>
            <button className="lg:hidden inline-flex items-center justify-center min-h-11 min-w-11" aria-label="Menu" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
              <Menu size={22} strokeWidth={1.3} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={submitSearch}
              id="navbar-search"
              className="overflow-hidden border-t border-gold/20 mt-4"
            >
              <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4">
                <label htmlFor="navbar-search-input" className="sr-only">
                  Search fragrances
                </label>
                <input
                  id="navbar-search-input"
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="SEARCH FRAGRANCES…"
                  className="w-full bg-transparent border-b border-gold/30 py-2 text-sm tracking-widest placeholder:text-muted focus:outline-none focus:border-gold"
                />
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
            className="fixed inset-0 z-50 bg-navy flex flex-col"
          >
            <div className="flex justify-between items-center px-6 py-6 border-b border-gold/20">
              <img src="/logo.png" alt="HM Signature" className="h-9" />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                autoFocus
                className="inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-navy2 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-8">
              {navLinks.map((l, i) => (
                <motion.div key={l.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                  <Link to={l.to} onClick={() => setMenuOpen(false)} className="font-serif text-3xl tracking-wide">
                    {l.label}
                  </Link>
                </motion.div>
              ))}

              <div className="pt-4 flex flex-col items-center gap-4">
                {user ? (
                  <>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="text-gold font-sans text-sm tracking-widest uppercase flex items-center space-x-2"
                      >
                        <LayoutDashboard size={16} />
                        <span>Boutique Dashboard</span>
                      </Link>
                    )}
                    <Link
                      to="/account"
                      onClick={() => setMenuOpen(false)}
                      className="text-ivory font-sans text-sm tracking-widest uppercase flex items-center space-x-2"
                    >
                      <User size={16} />
                      <span>My Account ({firstName})</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleSignOut();
                      }}
                      className="text-rose-300 font-sans text-sm tracking-widest uppercase"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMenuOpen(false)}
                    className="text-gold font-sans text-sm tracking-widest uppercase flex items-center space-x-2 border border-gold/40 px-6 py-2 rounded"
                  >
                    <User size={16} />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
