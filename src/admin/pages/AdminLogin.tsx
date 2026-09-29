import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { loginStaff, getCurrentStaff } from "../../services/auth";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // If already logged in as staff, redirect to role dashboard
  useEffect(() => {
    const current = getCurrentStaff();
    if (current) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setAuthError("Please enter your staff email address.");
      return;
    }

    if (!password) {
      setAuthError("Please enter your security password.");
      return;
    }

    setIsLoading(true);
    const res = await loginStaff(trimmedEmail, password);
    setIsLoading(false);

    if (!res.success || !res.staff) {
      setAuthError(res.error || "Invalid email address or password.");
      return;
    }

    // Role-specific redirect
    const role = res.staff.role;
    if (role === "Order Manager") {
      navigate("/admin/orders", { replace: true });
    } else if (role === "Content Manager") {
      navigate("/admin/products", { replace: true });
    } else {
      navigate("/admin/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-dvh bg-navy flex items-center justify-center p-4 relative overflow-hidden">
      {/* Radial Gold Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <img src="/logo.png" alt="HM Signature" className="h-10 mx-auto" />
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-[10px] font-mono tracking-widest uppercase mt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span>STAFF ADMINISTRATIVE PORTAL</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-ivory tracking-wide pt-1">
            Boutique Staff Login
          </h1>
          <p className="text-xs font-sans text-muted font-light">
            Sign in with your authorized staff credentials to access your workspace.
          </p>
        </div>

        {/* Premium Glass Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy2/90 border border-gold/30 rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-md"
        >
          {/* Error Banner */}
          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-3.5 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start space-x-2"
                aria-live="polite"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLoginSubmit} className="space-y-4 font-sans text-xs">
            {/* Email Field */}
            <div>
              <label className="block text-ivory/80 font-medium mb-1.5">
                Staff Email Address <span className="text-gold">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gold/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@hmsignature.com"
                  className="w-full bg-navy border border-gold/20 focus:border-gold rounded-lg pl-10 pr-4 py-2.5 text-xs text-ivory placeholder:text-muted focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-ivory/80 font-medium mb-1.5">
                Password <span className="text-gold">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gold/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-navy border border-gold/20 focus:border-gold rounded-lg pl-10 pr-10 py-2.5 text-xs text-ivory placeholder:text-muted focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-gold transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gold/30 bg-navy text-gold focus:ring-gold"
                />
                <span>Remember staff session</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gold hover:bg-goldLight text-navy font-semibold font-sans text-xs tracking-wider uppercase rounded-lg transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Access Staff Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
