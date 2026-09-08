import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, User, Heart, ShoppingBag, Menu, X, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

const navLinks = [
  { label: "COLLECTIONS", to: "/collections" },
  { label: "MEN", to: "/men" },
  { label: "WOMEN", to: "/women" },
  { label: "BESTSELLERS", to: "/bestsellers" },
  { label: "SCENT FINDER", to: "/scent-finder" },
  { label: "ABOUT US", to: "/?section=about" },
  { label: "JOURNAL", to: "/journal" },
  { label: "CONTACT", to: "/contact" },
  { label: "PARENT COMPANY", to: "/parent-company" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { itemCount, openCart } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/collections?q=${encodeURIComponent(query.trim())}`);
      setSearchOpen(false);
      setQuery("");
    }
  };

  return (
    <>
      <nav
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

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link key={l.label} to={l.to} className="relative text-[11px] tracking-[2px] group py-1">
                {l.label}
                <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-gold transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <button aria-label="Search" className="hidden sm:block hover:text-goldLight transition-colors" onClick={() => setSearchOpen((s) => !s)}>
              <Search size={18} strokeWidth={1.3} />
            </button>
            <Link to="/wishlist" aria-label="Wishlist" className="hidden sm:block relative hover:text-goldLight transition-colors">
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
              className="hidden sm:block hover:text-goldLight transition-colors"
            >
              <Building2 size={18} strokeWidth={1.3} />
            </Link>
            <Link to="/account" aria-label="Account" className="hidden sm:block hover:text-goldLight transition-colors">
              <User size={18} strokeWidth={1.3} />
            </Link>
            <button aria-label="Bag" className="relative hover:text-goldLight transition-colors" onClick={openCart}>
              <ShoppingBag size={18} strokeWidth={1.3} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-navy text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-medium">
                  {itemCount}
                </span>
              )}
            </button>
            <button className="lg:hidden" aria-label="Menu" onClick={() => setMenuOpen(true)}>
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
              className="overflow-hidden border-t border-gold/20 mt-4"
            >
              <div className="max-w-[1400px] mx-auto px-6 lg:px-10 py-4">
                <input
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
            className="fixed inset-0 z-50 bg-navy flex flex-col"
          >
            <div className="flex justify-between items-center px-6 py-6 border-b border-gold/20">
              <img src="/logo.png" alt="HM Signature" className="h-9" />
              <button onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-8">
              {navLinks.map((l, i) => (
                <motion.div key={l.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
                  <Link to={l.to} onClick={() => setMenuOpen(false)} className="font-serif text-3xl tracking-wide">
                    {l.label.charAt(0) + l.label.slice(1).toLowerCase()}
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
