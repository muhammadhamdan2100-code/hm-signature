import React from "react";
import { useAdminData } from "../context/AdminDataContext";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useAdminData();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 end-6 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success";
        const isError = toast.type === "error";

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded border backdrop-blur-md shadow-2xl transition-all duration-300 animate-slide-up ${
              isSuccess
                ? "bg-navy2/95 border-gold/40 text-ivory"
                : isError
                ? "bg-burgundy2/95 border-red-500/40 text-ivory"
                : "bg-navy2/95 border-gold/30 text-ivory"
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-gold" />}
              {isError && <AlertCircle className="w-5 h-5 text-red-400" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-goldLight" />}
            </div>
            <div className="flex-1 text-xs tracking-wide font-sans leading-relaxed">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-muted hover:text-ivory transition-colors p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
