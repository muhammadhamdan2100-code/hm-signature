import { useState } from "react";
import { MessageCircle } from "lucide-react";
import ConciergeChat from "./ConciergeChat";
import { useI18n } from "../i18n/I18nProvider";

const WHATSAPP_NUMBER = "923218602034"; // +92 321 8602034, no leading zero, no plus/spaces

// The floating concierge entry keeps its established look; it now opens the
// on-site assistant, with WhatsApp still one tap away inside the panel.
export default function WhatsAppButton() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("common.chatWithConcierge")}
        aria-expanded={open}
        title={t("common.chatWithConcierge")}
        className="fixed bottom-6 end-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105"
        style={{ background: "#25D366" }}
      >
        <MessageCircle size={26} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
        {!open && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "#25D366", opacity: 0.4 }} />
        )}
      </button>

      <ConciergeChat
        open={open}
        onClose={() => setOpen(false)}
        whatsappHref={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi, I'd like to ask about HM Signature fragrances.")}`}
      />
    </>
  );
}
