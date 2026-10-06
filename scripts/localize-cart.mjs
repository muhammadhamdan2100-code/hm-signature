// Localizes the Cart page: patches src/pages/Cart.tsx to use t() and adds the new cart.* keys
// to every dictionary except ur.ts when ur.ts is still incomplete (run with --skip-ur then).
//
// Run only when no other agent is writing the dictionary files — the script reads and rewrites
// whole files, so a concurrent write from another process would be lost.
//
//   node scripts/localize-cart.mjs [--skip-ur]
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SKIP_UR = process.argv.includes("--skip-ur");

const KEYS = {
  en: {
    pageTitle: "Your Shopping Bag",
    bagCurrentlyEmpty: "Your bag is currently empty.",
    saveForLater: "Save for later",
    remove: "Remove",
    promotionCode: "Promotion code",
    promoCodePlaceholder: "PROMO CODE",
    apply: "APPLY",
    promoFailedFallback: "That code could not be applied.",
    promoHint: "Enter a promotion code if you have one.",
    orderSummary: "Order Summary",
    subtotal: "Subtotal",
    promoLine: "Promo {code}",
    total: "Total",
    addMoreForFreeDelivery: "Add {amount} more for complimentary delivery.",
    checkoutConfirmationNote:
      "Delivery and any promotion are confirmed on the next step before you place the order.",
    proceedToCheckout: "PROCEED TO CHECKOUT →",
    continueShopping: "Continue Shopping",
  },
  ar: {
    pageTitle: "حقيبة التسوق",
    bagCurrentlyEmpty: "حقيبتك فارغة حالياً.",
    saveForLater: "احفظها لاحقاً",
    remove: "إزالة",
    promotionCode: "رمز العرض",
    promoCodePlaceholder: "رمز العرض",
    apply: "تطبيق",
    promoFailedFallback: "تعذّر تطبيق هذا الرمز.",
    promoHint: "أدخل رمز العرض إن كان لديك واحد.",
    orderSummary: "ملخص الطلب",
    subtotal: "المجموع الفرعي",
    promoLine: "العرض {code}",
    total: "الإجمالي",
    addMoreForFreeDelivery: "أضف {amount} للحصول على توصيل مجاني.",
    checkoutConfirmationNote: "تتم تأكيد التوصيل وأي عرض في الخطوة التالية قبل إتمام الطلب.",
    proceedToCheckout: "الانتقال إلى إتمام الشراء →",
    continueShopping: "متابعة التسوق",
  },
  ur: {
    pageTitle: "خریداری کی ٹوکری",
    bagCurrentlyEmpty: "آپ کی ٹوکری فی الحال خالی ہے۔",
    saveForLater: "بعداً محفوظ کریں",
    remove: "ہٹائیں",
    promotionCode: "پرومو کوڈ",
    promoCodePlaceholder: "پرومو کوڈ",
    apply: "لاگو کریں",
    promoFailedFallback: "یہ کوڈ لاگو نہیں کیا جا سکا۔",
    promoHint: "اگر آپ کے پاس پرومو کوڈ ہے تو اسے درج کریں۔",
    orderSummary: "آرڈر کا خلاصہ",
    subtotal: "ذیلی رقم",
    promoLine: "پرومو {code}",
    total: "کل رقم",
    addMoreForFreeDelivery: "مفت ترسیل کے لیے {amount} مزید شامل کریں۔",
    checkoutConfirmationNote:
      "ترسیل اور کسی بھی پرومو کی تصدیق آرڈر دینے سے پہلے اگلے مرحلے میں کی جاتی ہے۔",
    proceedToCheckout: "چیک آؤٹ پر جائیں →",
    continueShopping: "خریداری جاری رکھیں",
  },
  fr: {
    pageTitle: "Votre panier",
    bagCurrentlyEmpty: "Votre panier est actuellement vide.",
    saveForLater: "Enregistrer pour plus tard",
    remove: "Retirer",
    promotionCode: "Code promotionnel",
    promoCodePlaceholder: "CODE PROMO",
    apply: "APPLIQUER",
    promoFailedFallback: "Ce code n’a pas pu être appliqué.",
    promoHint: "Saisissez un code promotionnel si vous en avez un.",
    orderSummary: "Récapitulatif de commande",
    subtotal: "Sous-total",
    promoLine: "Code promo {code}",
    total: "Total",
    addMoreForFreeDelivery: "Ajoutez {amount} pour bénéficier d’une livraison offerte.",
    checkoutConfirmationNote:
      "La livraison et toute promotion sont confirmées à l’étape suivante, avant la validation de la commande.",
    proceedToCheckout: "ALLER À LA CAISSE →",
    continueShopping: "Continuer vos achats",
  },
  es: {
    pageTitle: "Bolsa de compras",
    bagCurrentlyEmpty: "Su bolsa de compras está vacía en este momento.",
    saveForLater: "Guardar para más tarde",
    remove: "Eliminar",
    promotionCode: "Código promocional",
    promoCodePlaceholder: "CÓDIGO PROMOCIONAL",
    apply: "APLICAR",
    promoFailedFallback: "No se ha podido aplicar este código.",
    promoHint: "Introduzca un código promocional si dispone de uno.",
    orderSummary: "Resumen del pedido",
    subtotal: "Subtotal",
    promoLine: "Promoción {code}",
    total: "Total",
    addMoreForFreeDelivery: "Añada {amount} más para recibir envío gratuito.",
    checkoutConfirmationNote:
      "El envío y cualquier promoción se confirman en el siguiente paso, antes de realizar el pedido.",
    proceedToCheckout: "TRAMITAR PEDIDO →",
    continueShopping: "Seguir comprando",
  },
};

for (const [lang, map] of Object.entries(KEYS)) {
  if (SKIP_UR && lang === "ur") {
    console.log("ur: skipped (--skip-ur)");
    continue;
  }
  const file = path.join(ROOT, "src/i18n/dictionaries", `${lang}.ts`);
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const open = lines.findIndex((l) => /^  cart: \{$/.test(l));
  if (open === -1) throw new Error(`${file}: cart namespace not found`);
  let close = open + 1;
  while (close < lines.length && !/^  \},?$/.test(lines[close])) close += 1;
  const body = lines.slice(open + 1, close).join("\n");
  const add = Object.entries(map)
    .filter(([k]) => !new RegExp(`^\\s{4}"?${k}"?:`, "m").test(body))
    .map(([k, v]) => `    ${k}: ${JSON.stringify(v)},`);
  lines.splice(close, 0, ...add);
  fs.writeFileSync(file, lines.join("\n"), "utf8");
  console.log(`${lang}: +${add.length} cart keys`);
}

const cartFile = path.join(ROOT, "src/pages/Cart.tsx");
let src = fs.readFileSync(cartFile, "utf8");
const swaps = [
  ['import { useCart } from "../context/CartContext";', 'import { useCart } from "../context/CartContext";\nimport { useI18n } from "../i18n/I18nProvider";'],
  ["        <h1 className=\"font-serif text-4xl mb-12\">Your Shopping Bag</h1>", "        <h1 className=\"font-serif text-4xl mb-12\">{t(\"cart.pageTitle\")}</h1>"],
  ["<p className=\"text-muted mb-8\">Your bag is currently empty.</p>", "<p className=\"text-muted mb-8\">{t(\"cart.bagCurrentlyEmpty\")}</p>"],
  ["className=\"btn-gold-fill\">DISCOVER FRAGRANCES →</Link>", "className=\"btn-gold-fill\">{t(\"cart.discover\")}</Link>"],
  ['aria-label="Decrease quantity"', 'aria-label={t("cart.decreaseQuantity", { name: item.product.name })}'],
  ['aria-label="Increase quantity"', 'aria-label={t("cart.increaseQuantity", { name: item.product.name })}'],
  ["<Heart size={13} /> Save for later", "<Heart size={13} /> {t(\"cart.saveForLater\")}"],
  ["<Trash2 size={13} /> Remove", "<Trash2 size={13} /> {t(\"cart.remove\")}"],
  ['aria-label="Promotion code"', 'aria-label={t(\"cart.promotionCode\")}'],
  ['placeholder="PROMO CODE"', 'placeholder={t("cart.promoCodePlaceholder")}'],
  ["<button type=\"submit\" className=\"btn-gold\">APPLY</button>", "<button type=\"submit\" className=\"btn-gold\">{t(\"cart.apply\")}</button>"],
  ['promoFailed ? promoError || "That code could not be applied." : promoMsg || "Enter a promotion code if you have one."', 'promoFailed ? promoError || t("cart.promoFailedFallback") : promoMsg || t("cart.promoHint")'],
  ["<h3 className=\"font-serif text-xl mb-6\">Order Summary</h3>", "<h3 className=\"font-serif text-xl mb-6\">{t(\"cart.orderSummary\")}</h3>"],
  ["<span>Subtotal</span>", "<span>{t(\"cart.subtotal\")}</span>"],
  ["<span>Promo {promoCode}</span>", "<span>{t(\"cart.promoLine\", { code: promoCode })}</span>"],
  ["<span>Shipping</span>", "<span>{t(\"cart.shipping\")}</span>"],
  ['shipping === 0 ? "Complimentary" : format(shipping)', 'shipping === 0 ? t("common.complimentary") : format(shipping)'],
  ["<span className=\"font-serif text-lg\">Total</span>", "<span className=\"font-serif text-lg\">{t(\"cart.total\")}</span>"],
  ["Add {format(remainingForFreeShipping)} more for complimentary delivery.", "{t(\"cart.addMoreForFreeDelivery\", { amount: format(remainingForFreeShipping) })}"],
  ["Delivery and any promotion are confirmed on the next step before you place the order.", "{t(\"cart.checkoutConfirmationNote\")}"],
  ["PROCEED TO CHECKOUT →", "{t(\"cart.proceedToCheckout\")}"],
  ["Continue Shopping", "{t(\"cart.continueShopping\")}"],
];
for (const [from, to] of swaps) {
  if (!src.includes(from)) throw new Error(`Cart.tsx: anchor not found -> ${from.slice(0, 60)}`);
  src = src.replace(from, to);
}
// The hook goes in the component body, next to the other context hooks.
src = src.replace(
  "  const { format } = useCurrency();",
  "  const { format } = useCurrency();\n  const { t } = useI18n();"
);
if (!/const \{ t \} = useI18n\(\);/.test(src)) throw new Error("Cart.tsx: could not add the useI18n hook");
fs.writeFileSync(cartFile, src, "utf8");
console.log("Cart.tsx converted to t()");
