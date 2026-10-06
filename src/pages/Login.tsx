import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User, X, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth, isStaffRole } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nProvider";

export default function Login() {
  const { user, login, signup, forgotPassword, completePasswordReset, isLoading } = useAuth();
  const { t } = useI18n();
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

  // Keep focus inside the recovery dialog while open, then hand it back to the trigger.
  const resetPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isResetOpen) return;
    const trigger = document.activeElement;
    resetPanelRef.current?.querySelector<HTMLElement>("input")?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsResetOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, [isResetOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !password) {
      setErrorMessage(t("validation.requiredFields"));
      return;
    }

    if (mode === "signin") {
      const result = await login(email, password, rememberMe);
      if (!result.success) {
        setErrorMessage(result.error || t("auth.invalidCredentials"));
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
        setErrorMessage(t("validation.fullNameRequired"));
        return;
      }

      const result = await signup(email, password, fullName);
      if (!result.success) {
        setErrorMessage(result.error || t("auth.signUpFailed"));
        return;
      }

      if (result.needsEmailConfirmation) {
        setSuccessMessage(t("auth.emailConfirmationSent"));
        return;
      }

      setSuccessMessage(t("auth.accountCreated"));
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
      if (newPassword.length < 6) {
        setErrorMessage(t("validation.passwordMinCharacters"));
        return;
      }
      setResetBusy(true);
      const res = await completePasswordReset(newPassword);
      setResetBusy(false);
      if (!res.success) {
        setErrorMessage(res.error || t("auth.resetFailed"));
        return;
      }
      setSuccessMessage(t("auth.passwordUpdated"));
      setTimeout(() => {
        setIsResetOpen(false);
        navigate("/account", { replace: true });
      }, 1200);
      return;
    }

    const res = await forgotPassword(resetEmail);
    if (!res.success) {
      setErrorMessage(res.error || t("auth.resetSendFailed"));
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
    <main className="min-h-dvh bg-navy flex items-center justify-center p-4 relative overflow-hidden pt-24 pb-12">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gold/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="HM Signature" className="h-10 mx-auto" />
          </Link>
          <p className="text-[10px] font-mono tracking-[4px] uppercase text-gold">
            {t("auth.tagline")}
          </p>
          <h1 className="text-2xl font-serif font-bold text-ivory tracking-wide">
            {mode === "signin" ? t("auth.signInTitle") : t("auth.signUpTitle")}
          </h1>
          <p className="text-xs font-sans text-muted font-light">
            {mode === "signin"
              ? t("auth.signInSubtitle")
              : t("auth.signUpSubtitle")}
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
            {errorMessage && !isResetOpen && (
              <motion.div
                id="login-form-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-5 p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mb-5 p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2"
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
                <label htmlFor="login-full-name" className="block text-xs font-sans text-ivory/80 font-medium mb-1.5">
                  {t("auth.fullNameLabel")} <span className="text-gold">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gold/60 absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("auth.fullNamePlaceholder")}
                    className="w-full bg-navy border border-gold/20 focus:border-gold rounded-lg ps-10 pe-4 py-2.5 min-h-11 text-xs text-ivory placeholder:text-muted focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-sans text-ivory/80 font-medium mb-1.5">
                {t("auth.emailLabel")} <span className="text-gold">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gold/60 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="username"
                  aria-invalid={errorMessage ? true : undefined}
                  aria-describedby={errorMessage ? "login-form-error" : undefined}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-navy border border-gold/20 focus:border-gold rounded-lg ps-10 pe-4 py-2.5 min-h-11 text-xs text-ivory placeholder:text-muted focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-sans text-ivory/80 font-medium">
                  {t("auth.passwordLabel")} <span className="text-gold">*</span>
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage("");
                      setIsResetOpen(true);
                    }}
                    className="px-1 -mx-1 py-2 -my-2 rounded text-[11px] font-sans text-gold hover:text-goldLight transition-colors"
                  >
                    {t("auth.forgotPassword")}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gold/60 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  aria-invalid={errorMessage ? true : undefined}
                  aria-describedby={errorMessage ? "login-form-error" : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-navy border border-gold/20 focus:border-gold rounded-lg ps-10 pe-12 py-2.5 min-h-11 text-xs text-ivory placeholder:text-muted focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-0 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-gold transition-colors"
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox (Signin Mode) */}
            {mode === "signin" && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-gold/30 bg-navy text-gold focus:ring-gold focus:ring-offset-navy"
                />
                <label htmlFor="remember" className="text-xs font-sans text-muted select-none py-1.5 -my-1.5">
                  {t("auth.rememberMe")}
                </label>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 min-h-11 bg-gold hover:bg-goldLight text-navy font-semibold font-sans text-xs tracking-wider uppercase rounded-lg transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === "signin" ? t("auth.signIn") : t("auth.signUpCta")}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="mt-6 pt-5 border-t border-gold/15 text-center">
            {mode === "signin" ? (
              <p className="text-xs text-muted">
                {t("auth.noAccount")}{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setErrorMessage("");
                  }}
                  className="text-gold font-semibold hover:text-goldLight underline underline-offset-4 transition-colors"
                >
                  {t("auth.createAccount")}
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted">
                {t("auth.haveAccount")}{" "}
                <button
                  onClick={() => {
                    setMode("signin");
                    setErrorMessage("");
                  }}
                  className="text-gold font-semibold hover:text-goldLight underline underline-offset-4 transition-colors"
                >
                  {t("auth.signInHere")}
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
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setIsResetOpen(false);
            }}
          >
            <motion.div
              ref={resetPanelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="password-recovery-title"
              tabIndex={-1}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-navy2 border border-gold/30 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl focus:outline-none"
            >
              <div className="flex items-center justify-between border-b border-gold/20 pb-3">
                <h3 id="password-recovery-title" className="font-serif font-bold text-lg text-ivory">
                  {t("auth.passwordRecoveryTitle")}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  aria-label={t("auth.closePasswordRecovery")}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted hover:text-ivory hover:bg-navy transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {resetSuccess ? (
                <div role="status" className="py-4 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm text-ivory font-serif font-bold">{t("auth.resetInstructionsSent")}</p>
                  <p className="text-xs text-muted">
                    {t("auth.resetCheckInboxPrefix")} <span className="text-gold font-mono">{resetEmail}</span> {t("auth.resetCheckInboxSuffix")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  {errorMessage && (
                    <p id="recovery-form-error" role="alert" className="text-xs text-rose-300">
                      {errorMessage}
                    </p>
                  )}
                  {resetMode ? (
                    <>
                      <p className="text-xs text-muted">
                        {t("auth.resetLinkVerified")}
                      </p>
                      <div>
                        <label htmlFor="recovery-password" className="block text-xs text-ivory mb-1">
                          {t("auth.newPasswordLabel")}
                        </label>
                        <input
                          id="recovery-password"
                          type="password"
                          required
                          minLength={6}
                          aria-invalid={errorMessage ? true : undefined}
                          aria-describedby={errorMessage ? "recovery-form-error" : undefined}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-navy border border-gold/20 rounded px-3 py-2 min-h-11 text-xs text-ivory focus:outline-none focus:border-gold"
                        />
                        <p className="text-[10px] text-muted mt-1">{t("auth.newPasswordHint")}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-muted">
                        {t("auth.forgotPasswordHelp")}
                      </p>
                      <div>
                        <label htmlFor="recovery-email" className="block text-xs text-ivory mb-1">
                          {t("auth.emailLabel")}
                        </label>
                        <input
                          id="recovery-email"
                          type="email"
                          required
                          aria-invalid={errorMessage ? true : undefined}
                          aria-describedby={errorMessage ? "recovery-form-error" : undefined}
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="name@domain.com"
                          className="w-full bg-navy border border-gold/20 rounded px-3 py-2 min-h-11 text-xs text-ivory focus:outline-none focus:border-gold"
                        />
                      </div>
                    </>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsResetOpen(false)}
                      className="px-4 py-2 min-h-11 rounded text-xs text-muted hover:text-ivory"
                    >
                      {t("common.cancel")}
                    </button>
                    <button
                      type="submit"
                      disabled={resetBusy}
                      className="px-4 py-2 min-h-11 bg-gold text-navy font-semibold text-xs rounded hover:bg-goldLight disabled:opacity-50"
                    >
                      {resetMode ? t("auth.setNewPassword") : t("auth.sendInstructions")}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
