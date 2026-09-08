import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "923218602034";
const MAPS_QUERY = encodeURIComponent("Rahim Yar Khan, Pakistan");

const info = [
  {
    icon: MapPin,
    label: "BOUTIQUE",
    text: "Rahim Yar Khan, Pakistan",
    href: `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`,
  },
  {
    icon: Phone,
    label: "PHONE",
    text: "+92 321 8602034",
    href: `tel:+${WHATSAPP_NUMBER}`,
  },
  {
    icon: Mail,
    label: "EMAIL",
    text: "xeltriotechnologies@gmail.com",
    href: "mailto:xeltriotechnologies@gmail.com",
  },
  {
    icon: Clock,
    label: "HOURS",
    text: "Mon – Sat, 11:00 AM – 8:00 PM",
    href: null,
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="pt-24 bg-navy min-h-screen">
      <section className="py-20 border-b border-gold/15 text-center">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10">
          <div className="eyebrow mb-4">GET IN TOUCH</div>
          <h1 className="font-serif text-4xl lg:text-6xl mb-4">Contact Us</h1>
          <p className="text-muted max-w-lg mx-auto leading-relaxed">
            Questions about a fragrance, an order, or a private consultation — our team is here to help.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-10 grid lg:grid-cols-[1fr_420px] gap-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <h2 className="font-serif text-2xl mb-8">Send a Message</h2>

            {sent ? (
              <div className="border border-gold/25 p-10 text-center">
                <p className="text-goldLight font-serif text-xl mb-3">Message Sent</p>
                <p className="text-muted">Thank you for reaching out — our team will respond within 24 hours.</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSent(true);
                }}
                className="space-y-6"
              >
                <div className="grid sm:grid-cols-2 gap-6">
                  <Field label="Full Name" value={form.name} onChange={(v) => update("name", v)} required />
                  <Field label="Email Address" type="email" value={form.email} onChange={(v) => update("email", v)} required />
                </div>
                <Field label="Subject" value={form.subject} onChange={(v) => update("subject", v)} required />
                <label className="block">
                  <span className="text-[11px] tracking-widest text-muted mb-2 block">MESSAGE</span>
                  <textarea
                    required
                    rows={6}
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    className="w-full bg-transparent border border-gold/25 px-4 py-3 text-sm focus:outline-none focus:border-gold resize-none"
                  />
                </label>
                <button type="submit" className="btn-gold-fill">SEND MESSAGE →</button>
              </form>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="space-y-6"
          >
            {info.map((i) =>
              i.href ? (
                <a
                  key={i.label}
                  href={i.href}
                  target={i.href.startsWith("http") ? "_blank" : undefined}
                  rel={i.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="border border-gold/20 p-6 flex gap-4 hover:border-gold/50 hover:bg-gold/5 transition-colors"
                >
                  <i.icon size={20} className="text-gold shrink-0 mt-1" strokeWidth={1.3} />
                  <div>
                    <div className="text-[11px] tracking-[1.5px] text-goldLight mb-1">{i.label}</div>
                    <div className="text-sm text-muted leading-relaxed">{i.text}</div>
                  </div>
                </a>
              ) : (
                <div key={i.label} className="border border-gold/20 p-6 flex gap-4">
                  <i.icon size={20} className="text-gold shrink-0 mt-1" strokeWidth={1.3} />
                  <div>
                    <div className="text-[11px] tracking-[1.5px] text-goldLight mb-1">{i.label}</div>
                    <div className="text-sm text-muted leading-relaxed">{i.text}</div>
                  </div>
                </div>
              )
            )}

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi, I'd like to ask about HM Signature fragrances.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gold/20 p-6 flex gap-4 hover:border-gold/50 hover:bg-gold/5 transition-colors"
            >
              <MessageCircle size={20} className="text-gold shrink-0 mt-1" strokeWidth={1.3} />
              <div>
                <div className="text-[11px] tracking-[1.5px] text-goldLight mb-1">WHATSAPP</div>
                <div className="text-sm text-muted leading-relaxed">Chat with us instantly — +92 321 8602034</div>
              </div>
            </a>

            <a
              href={`https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-gold/20 aspect-[4/3] flex items-center justify-center texture-navy relative overflow-hidden group"
            >
              <div
                className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity"
                style={{ background: "radial-gradient(circle at 50% 40%, rgba(200,169,107,0.12), transparent 60%)" }}
              />
              <div className="relative text-center">
                <MapPin size={28} className="text-gold mx-auto mb-3" strokeWidth={1} />
                <p className="text-xs text-muted tracking-wide">Rahim Yar Khan, Pakistan</p>
                <p className="text-[10px] text-goldLight tracking-widest mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  OPEN IN GOOGLE MAPS →
                </p>
              </div>
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text", required = false,
}: {
  label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] tracking-widest text-muted mb-2 block">{label.toUpperCase()}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border border-gold/25 px-4 py-3 text-sm focus:outline-none focus:border-gold"
      />
    </label>
  );
}
