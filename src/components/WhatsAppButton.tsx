import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "923218602034"; // +92 321 8602034, no leading zero, no plus/spaces

export default function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi, I'd like to ask about HM Signature fragrances.")}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105"
      style={{ background: "#25D366" }}
    >
      <MessageCircle size={26} color="#FFFFFF" fill="#FFFFFF" strokeWidth={0} />
      <span className="absolute inset-0 rounded-full animate-ping" style={{ background: "#25D366", opacity: 0.4 }} />
    </a>
  );
}
