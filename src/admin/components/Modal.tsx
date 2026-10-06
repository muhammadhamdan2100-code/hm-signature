import React, { useEffect, useId, useRef, type ReactNode } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
}

const FOCUSABLE_SELECTOR = [
"a[href]",
"button:not([disabled])",
"input:not([disabled])",
"select:not([disabled])",
"textarea:not([disabled])",
"[tabindex]:not([tabindex='-1'])",
].join(",");

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "lg",
}) => {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const subtitleId = useId();

  // Move focus into the dialog on open, restore it to the trigger on close.
  useEffect(() => {
    if (!isOpen) return;
    const activeElement = document.activeElement;
    returnFocusRef.current =
      activeElement instanceof HTMLElement ? activeElement : null;
    panelRef.current?.focus();

    return () => {
      const trigger = returnFocusRef.current;
      returnFocusRef.current = null;
      if (trigger && trigger.isConnected) trigger.focus();
    };
  }, [isOpen]);

  // Escape closes, Tab stays inside the dialog.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusables = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      ).filter((el) => el.offsetParent !== null || el === document.activeElement);

      if (focusables.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement as HTMLElement | null;

      if (!current || !panel.contains(current)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
"2xl": "max-w-2xl",
"4xl": "max-w-4xl",
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy/80 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      <div
        className="flex min-h-full items-center justify-center p-4 text-center"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={subtitle ? subtitleId : undefined}
          tabIndex={-1}
          className={`w-full ${maxWidthClass} transform overflow-hidden rounded-lg bg-navy2/95 backdrop-blur-xl border border-gold/30 text-start align-middle shadow-2xl transition-all my-8 focus:outline-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gold/20 px-6 py-4 bg-navy/40">
            <div>
              <h3
                id={titleId}
                className="font-serif text-lg font-bold text-ivory tracking-wide"
              >
                {title}
              </h3>
              {subtitle && (
                <p id={subtitleId} className="text-xs font-sans text-muted mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("admin.modal.close", { title })}
              className="text-muted hover:text-gold transition-colors p-1 rounded-md hover:bg-navy/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 max-h-[75vh] overflow-y-auto text-ivory">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  isDanger = false,
}) => {
  const { t } = useI18n();
  const confirmLabel = confirmText ?? t("admin.modal.confirm");
  const cancelLabel = cancelText ?? t("admin.modal.cancel");

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex items-start gap-3 py-2">
        <div
          className={`p-2 rounded-full shrink-0 ${
            isDanger ? "bg-rose-950/60 text-rose-400" : "bg-gold/10 text-gold"
          }`}
        >
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-xs font-sans text-muted leading-relaxed pt-1">
          {message}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-gold/10">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded text-xs font-sans tracking-wider uppercase text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 rounded text-xs font-sans tracking-wider uppercase transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold ${
            isDanger
              ? "bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-500/40"
              : "bg-gold hover:bg-goldLight text-navy font-semibold"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
};
