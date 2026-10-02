import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth, isStaffRole } from "../context/AuthContext";

export default function Login() {
  const { user, login, signup, forgotPassword, completePasswordReset, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Next param redirection destination
  const nextParam = searchParams.get("next");
  // Recovery mode: arriving from a password-reset email link (?reset=1)
  const resetMode = searchParams.get("reset") === "1";

  // Mode: 'signin' or 'signup'
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);

  // Form fields - MUST start completely empty
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Status & Messaging
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetBusy, setResetBusy] = useState(false);

  // Auto-redirect if already authenticated (except while completing a password reset)
  useEffect(() => {
    if (user && !resetMode) {
      if (isStaffRole(user.role)) {
        const target = nextParam && nextParam.startsWith("/admin") ? nextParam : "/admin";
        navigate(target, { replace: true });
      } else {
        const target = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("/admin") ? nextParam : "/account";
        navigate(target, { replace: true });
      }
    }
  }, [user, navigate, nextParam, resetMode]);

  // Open the recovery modal automatically when arriving from the reset email
  useEffect(() => {
    if (resetMode) {
      setIsResetOpen(true);
      setResetSuccess(false);
    }
  }, [resetMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (mode === "signin") {
      const result = await login(email, password, rememberMe);
      if (!result.success) {
        setErrorMessage(result.error || "Invalid email or password");
        return;
      }

      // Redirection handled by useEffect once user state updates
      const userRole = result.role || "customer";
      if (isStaffRole(userRole)) {
        const target = nextParam && nextParam.startsWith("/admin") ? nextParam : "/admin";
        navigate(target, { replace: true });
      } else {
        const target = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("/admin") ? nextParam : "/account";
        navigate(target, { replace: true });
      }
    } else {
      if (!fullName) {
        setErrorMessage("Please enter your full name.");
        return;
      }

      const result = await signup(email, password, fullName);
      if (!result.success) {
        setErrorMessage(result.error || "Failed to create account.");
        return;
      }

      if (result.needsEmailConfirmation) {
        setSuccessMessage("Account created. Please check your inbox to confirm your email, then sign in.");
        return;
      }

      setSuccessMessage("Account created successfully. Welcome to HM Signature.");
      setTimeout(() => {
        navigate("/account", { replace: true });
      }, 1000);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    if (resetMode) {
      // Completing reset: session already established via the emailed link
      setResetBusy(true);
      const res = await completePasswordReset(newPassword);
      setResetBusy(false);
      if (!res.success) {
        setErrorMessage(res.error || "Could not reset password.");
        return;
      }
      setSuccessMessage("Password updated. You are signed in.");
      setTimeout(() => {
        setIsResetOpen(false);
        navigate("/account", { replace: true });
      }, 1200);
      return;
    }

    const res = await forgotPassword(resetEmail);
    if (!res.success) {
      setErrorMessage(res.error || "Could not send reset instructions.");
      return;
    }
    setResetSuccess(true);
    setTimeout(() => {
      setIsResetOpen(false);
      setResetSuccess(false);
      setResetEmail("");
    }, 3500);
  };

  return (
    <div className="min-h-dvh bg-navy flex items-center justify-center p-4 relative overflow-hidden pt-24 pb-12">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gold/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="HM Signature" className="h-10 mx-auto" />
          </Link>
          <p className="text-[10px] font-mono tracking-[4px] uppercase text-gold">
            LUXURY PERFUMERY WORKSPACE
          </p>
          <h1 className="text-2xl font-serif font-bold text-ivory tracking-wide">
            {mode === "signin" ? "Sign In to HM Signature" : "Join the House of HM Signature"}
          </h1>
          <p className="text-xs font-sans text-muted font-light">
            {mode === "signin"
              ? "Access your client concierge or staff administrative portal."
              : "Create your personal client account to experience bespoke fragrances."}
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy2/90 border border-gold/30 rounded-xl p-6 sm:p-8 shadow-2xl backdrop-blur-md"
        >
          {/* Error & Success Banner */}
          <div aria-live="polite">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-5 p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-start space-x-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-5 p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-start space-x-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </motion.div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name field (Signup Mode Only) */}
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-sans text-ivory/80 font-medium mb-1.5">
                  Full Name <span className="text-gold">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gold/60 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Lord Alexander Sinclair"
                    className="w-full bg-navy border border-gold/20 focus:border-gold rounded-lg pl-10 pr-4 py-2.5 text-xs text-ivory placeholder:text-muted focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-sans text-ivory/80 font-medium mb-1.5">
                Email Address <span className="text-gold">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gold/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-navy border border-gold/20 focus:border-gold rounded-lg pl-10 pr-4 py-2.5 text-xs text-ivory placeholder:text-muted focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-sans text-ivory/80 font-medium">
                  Password <span className="text-gold">*</span>
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setIsResetOpen(true)}
                    className="text-[11px] font-sans text-gold hover:text-goldLight transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gold/60 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
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

            {/* Remember Me Checkbox (Signin Mode) */}
            {mode === "signin" && (
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gold/30 bg-navy text-gold focus:ring-gold focus:ring-offset-navy"
                />
                <label htmlFor="remember" className="text-xs font-sans text-muted select-none">
                  Remember me on this browser
                </label>
              </div>
            )}

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
                  <span>{mode === "signin" ? "Sign In" : "Create Client Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 pt-5 border-t border-gold/15 text-center">
            {mode === "signin" ? (
              <p className="text-xs text-muted">
                Don't have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setErrorMessage("");
                  }}
                  className="text-gold font-semibold hover:text-goldLight underline underline-offset-4 transition-colors"
                >
                  Create account
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted">
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("signin");
                    setErrorMessage("");
                  }}
                  className="text-gold font-semibold hover:text-goldLight underline underline-offset-4 transition-colors"
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {isResetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-navy/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-navy2 border border-gold/30 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gold/20 pb-3">
                <h3 className="font-serif font-bold text-lg text-ivory">Password Recovery</h3>
                <button onClick={() => setIsResetOpen(false)} className="text-muted hover:text-ivory">
                  ✕
                </button>
              </div>

              {resetSuccess ? (
                <div className="py-4 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm text-ivory font-serif font-bold">Password Reset Instructions Sent</p>
                  <p className="text-xs text-muted">
                    Check your inbox at <span className="text-gold font-mono">{resetEmail}</span> for further steps.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  {resetMode ? (
                    <>
                      <p className="text-xs text-muted">
                        Your reset link was verified. Choose a new password for your account.
                      </p>
                      <div>
                        <label className="block text-xs text-ivory mb-1">New Password</label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-navy border border-gold/20 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted">
                        Enter the email address associated with your account and we will send you instructions to reset your password.
                      </p>
                      <div>
                        <label className="block text-xs text-ivory mb-1">Email Address</label>
                        <input
                          type="email"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="name@domain.com"
                          className="w-full bg-navy border border-gold/20 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsResetOpen(false)}
                      className="px-4 py-2 rounded text-xs text-muted hover:text-ivory"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetBusy}
                      className="px-4 py-2 bg-gold text-navy font-semibold text-xs rounded hover:bg-goldLight disabled:opacity-50"
                    >
                      {resetMode ? "Set New Password" : "Send Instructions"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
