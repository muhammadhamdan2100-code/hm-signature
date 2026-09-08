import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Account() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="pt-24 bg-navy min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md border border-gold/25 p-10 my-16"
      >
        <div className="text-center mb-10">
          <div className="eyebrow mb-3">HM SIGNATURE</div>
          <h1 className="font-serif text-3xl">{mode === "signin" ? "Welcome Back" : "Create Your Account"}</h1>
          <p className="text-muted text-sm mt-3 leading-relaxed">
            {mode === "signin"
              ? "Sign in to view your orders, wishlist and saved details."
              : "Join HM Signature for early access to new fragrances and exclusive releases."}
          </p>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <p className="text-goldLight mb-6">
              {mode === "signin" ? "You're signed in." : "Your account has been created."}
            </p>
            <Link to="/" className="btn-gold-fill">RETURN HOME</Link>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
            }}
            className="space-y-5"
          >
            {mode === "signup" && (
              <label className="block">
                <span className="text-[11px] tracking-widest text-muted mb-2 block">FULL NAME</span>
                <input
                  required
                  type="text"
                  className="w-full bg-transparent border border-gold/25 px-4 py-3 text-sm focus:outline-none focus:border-gold"
                />
              </label>
            )}
            <label className="block">
              <span className="text-[11px] tracking-widest text-muted mb-2 block">EMAIL ADDRESS</span>
              <input
                required
                type="email"
                className="w-full bg-transparent border border-gold/25 px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="text-[11px] tracking-widest text-muted mb-2 block">PASSWORD</span>
              <input
                required
                type="password"
                className="w-full bg-transparent border border-gold/25 px-4 py-3 text-sm focus:outline-none focus:border-gold"
              />
            </label>

            {mode === "signin" && (
              <div className="text-right">
                <span className="text-xs text-muted hover:text-gold cursor-pointer transition-colors">Forgot password?</span>
              </div>
            )}

            <button type="submit" className="btn-gold-fill w-full text-center">
              {mode === "signin" ? "SIGN IN →" : "CREATE ACCOUNT →"}
            </button>
          </form>
        )}

        {!submitted && (
          <div className="text-center mt-8 text-sm text-muted">
            {mode === "signin" ? (
              <>
                New to HM Signature?{" "}
                <button onClick={() => setMode("signup")} className="text-goldLight hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="text-goldLight hover:underline">
                  Sign in
                </button>
              </>
            )}
          </div>
        )}

        <p className="text-center text-[11px] text-muted mt-8 pt-6 border-t border-gold/10">
          This is a UI demo — no account data is stored or authenticated.
        </p>
      </motion.div>
    </div>
  );
}
