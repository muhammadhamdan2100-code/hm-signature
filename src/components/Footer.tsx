import { Link } from "react-router-dom";

function SocialIcon({ path }: { path: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="hover:text-goldLight cursor-pointer transition-colors">
      <path d={path} />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer
      className="pt-20 pb-8 border-t border-gold/25"
      style={{ background: "linear-gradient(180deg, #2A0D13 0%, #1C0F0F 100%)" }}
    >
      <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          <div className="col-span-2 lg:col-span-1">
            <img src="/logo.png" alt="HM Signature" className="h-12 mb-4" />
            <p className="text-muted text-sm leading-relaxed max-w-[220px]">
              Timeless scents crafted for unforgettable moments.
            </p>
          </div>
          <div>
            <h4 className="text-goldLight text-xs tracking-[1.5px] mb-5">SHOP</h4>
            <div className="flex flex-col gap-3 text-sm text-muted">
              <Link to="/collections" className="hover:text-ivory transition-colors">Collections</Link>
              <Link to="/bestsellers" className="hover:text-ivory transition-colors">Best Sellers</Link>
              <Link to="/collections" className="hover:text-ivory transition-colors">New Arrivals</Link>
              <Link to="/collections" className="hover:text-ivory transition-colors">Gift Sets</Link>
            </div>
          </div>
          <div>
            <h4 className="text-goldLight text-xs tracking-[1.5px] mb-5">DISCOVER</h4>
            <div className="flex flex-col gap-3 text-sm text-muted">
              <Link to="/scent-finder" className="hover:text-ivory transition-colors">Scent Finder</Link>
              <Link to="/?section=about" className="hover:text-ivory transition-colors">Our Story</Link>
              <Link to="/journal" className="hover:text-ivory transition-colors">Journal</Link>
              <Link to="/parent-company" className="hover:text-ivory transition-colors">Parent Company</Link>
              <Link to="/ingredients" className="hover:text-ivory transition-colors">Ingredients</Link>
            </div>
          </div>
          <div>
            <h4 className="text-goldLight text-xs tracking-[1.5px] mb-5">CUSTOMER CARE</h4>
            <div className="flex flex-col gap-3 text-sm text-muted">
              <Link to="/contact" className="hover:text-ivory transition-colors">Contact</Link>
              <Link to="/faq" className="hover:text-ivory transition-colors">FAQ</Link>
              <Link to="/shipping-delivery" className="hover:text-ivory transition-colors">Shipping &amp; Delivery</Link>
              <Link to="/returns-exchanges" className="hover:text-ivory transition-colors">Returns &amp; Exchanges</Link>
              <Link to="/track-order" className="hover:text-ivory transition-colors">Track Order</Link>
            </div>
          </div>
          <div>
            <h4 className="text-goldLight text-xs tracking-[1.5px] mb-5">FOLLOW US</h4>
            <div className="flex gap-4 text-muted">
              <SocialIcon path="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5-1.2a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
              <SocialIcon path="M15 4h-2a4 4 0 0 0-4 4v2H7v3h2v7h3v-7h2.5l.5-3H12V8a1 1 0 0 1 1-1h2z" />
              <SocialIcon path="M14 3v10.5a3.5 3.5 0 1 1-2-3.16V6.5a5 5 0 1 0 5 5V7.8A6 6 0 0 0 21 9V6a6 6 0 0 1-4-1.7A6 6 0 0 1 15.5 2H14z" />
              <SocialIcon path="M22 8.5s-.2-1.5-.8-2.1c-.8-.8-1.7-.8-2.1-.9C16 5 12 5 12 5h0s-4 0-7.1.5c-.4 0-1.3.1-2.1.9C2.2 7 2 8.5 2 8.5S1.8 10.2 1.8 12v1.9c0 1.8.2 3.5.2 3.5s.2 1.5.8 2.1c.8.8 1.8.8 2.3.9C7 20.7 12 20.7 12 20.7s4 0 7.1-.5c.4-.1 1.3-.1 2.1-.9.6-.6.8-2.1.8-2.1s.2-1.7.2-3.5V12c0-1.8-.2-3.5-.2-3.5zM9.8 15.3V9.4l5.4 3z" />
            </div>
          </div>
        </div>

        <div className="mt-16 pt-6 border-t border-gold/15 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted">
          <span>© 2026 HM Signature. All Rights Reserved.</span>
          <Link
            to="/parent-company"
            className="flex items-center gap-2 shrink-0 whitespace-nowrap hover:opacity-80 transition-opacity"
            title="Part of Xeltrio Technologies"
          >
            <span className="text-muted">A brand by</span>
            <img
              src="/xeltrio-logo.png"
              alt="Xeltrio Technologies"
              style={{ height: "18px", width: "auto" }}
            />
          </Link>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="hover:text-ivory transition-colors">Privacy Policy</Link>
            <Link to="/terms-conditions" className="hover:text-ivory transition-colors">Terms &amp; Conditions</Link>
            <Link to="/refund-policy" className="hover:text-ivory transition-colors">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
