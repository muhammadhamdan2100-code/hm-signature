import React, { type ReactNode } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "lg",
}) => {
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
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className={`w-full ${maxWidthClass} transform overflow-hidden rounded-lg bg-navy2/95 backdrop-blur-xl border border-gold/30 text-left align-middle shadow-2xl transition-all my-8`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gold/20 px-6 py-4 bg-navy/40">
            <div>
              <h3 className="font-serif text-lg font-bold text-ivory tracking-wide">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs font-sans text-muted mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-muted hover:text-gold transition-colors p-1 rounded-md hover:bg-navy/60"
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
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex items-start space-x-3 py-2">
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

      <div className="mt-6 flex items-center justify-end space-x-3 pt-3 border-t border-gold/10">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded text-xs font-sans tracking-wider uppercase text-muted hover:text-ivory border border-gold/20 hover:border-gold/40 transition-colors"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 rounded text-xs font-sans tracking-wider uppercase transition-colors ${
            isDanger
              ? "bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-500/40"
              : "bg-gold hover:bg-goldLight text-navy font-semibold"
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};
