// Fills the admin.payments group that the previous pass converted in code but could not
// finish in the dictionaries, plus the one key it left out of English entirely.
// Insert-only and idempotent: an existing key is never rewritten.
//
//   node scripts/fill-payments-keys.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");

const T = {
  en: {
    referenceNote: "Reference / Note",
  },
  ar: {
    referenceNote: "مرجع / ملاحظة",
  },
  fr: {
    referenceNote: "Référence / Note",
    allMethods: "Toutes les méthodes",
    allPaymentRecords: "Tous les relevés de paiement",
    amount: "Montant",
    awaitingCourierCash: "En attente de l’espèces du livreur",
    bankTransfer: "Virement bancaire",
    cod: "Paiement à la livraison",
    codPendingCollection: "Paiement à la livraison — encaissement en attente",
    collectCash: "Encaisser l’espèce",
    digitalPendingSubtitle: "Vérification en attente {pendingProof} · Reçu attendu {awaitingProof}",
    digitalPendingVerification: "Vérification du paiement numérique en attente",
    failed: "Échoué",
    financeRecordNotePlaceholder: "Note facultative pour les registres financiers",
    fullyRefunded: "Intégralement remboursé",
    introBody:
      "Vérifiez les transferts numériques pakistanais (JazzCash, Raast, virement bancaire) et contrôlez les encaissements en paiement à la livraison.",
    issueRefund: "Émettre un remboursement",
    issueRefundForThisPayment: "Émettre un remboursement pour ce paiement",
    orderAndDate: "Commande et date",
    paidCodCollected: "Payé (espèces remises)",
    partialRefund: "Remboursement partiel",
    paymentMethodColumn: "Moyen de paiement",
    paymentMethodLabel: "Moyen de paiement :",
    processing: "Traitement…",
    reason: "Motif",
    reasonPlaceholder: "ex. flacon endommagé à la livraison",
    recordRefund: "Enregistrer un remboursement",
    refund: "Remboursement",
    refundAmountAboveZero: "Le montant du remboursement doit être supérieur à zéro.",
    refundAmountPkr: "Montant du remboursement (PKR)",
    refundBankReference: "Référence du remboursement / bancaire",
    refundExceedsRemaining: "Le remboursement dépasse le montant remboursable restant ({amount} Rs).",
    refundPending: "Remboursement en attente",
    refundPendingOption: "En attente — virement en cours",
    refundProcessedOption: "Traité — fonds restitués",
    refundReferencePlaceholder: "ex. HBL-REF-88213",
    refundSubtitle: "Commande {order} • {method} • Payé {paid} Rs • Restant {remaining} Rs",
    refunds: "Remboursements",
    reject: "Rejeter",
    searchByOrderClientOrReference:
      "Recherchez par numéro de commande, nom du client, e-mail ou référence de transaction...",
    settledVerifiedPayments: "Paiements réglés et vérifiés",
    title: "Gestion des paiements de la boutique",
    totalTransactions: "Total des transactions",
    totalVerifiedSettlement: "Total des encaissements vérifiés",
    verify: "Vérifier",
    viewOrder: "Voir la commande",
  },
  es: {
    referenceNote: "Referencia / Nota",
    allMethods: "Todos los métodos",
    allPaymentRecords: "Todos los registros de pago",
    amount: "Importe",
    awaitingCourierCash: "Esperando el efectivo del repartidor",
    bankTransfer: "Transferencia bancaria",
    cod: "Contra reembolso",
    codPendingCollection: "Contra reembolso — cobro pendiente",
    collectCash: "Cobrar efectivo",
    digitalPendingSubtitle: "Verificación pendiente {pendingProof} · Esperando comprobante {awaitingProof}",
    digitalPendingVerification: "Verificación digital pendiente",
    failed: "Fallido",
    financeRecordNotePlaceholder: "Nota opcional para los registros financieros",
    fullyRefunded: "Reembolsado íntegramente",
    introBody:
      "Verifique las transferencias digitales en Pakistán (JazzCash, Raast, transferencia bancaria) y revise los cobros contra reembolso.",
    issueRefund: "Emitir reembolso",
    issueRefundForThisPayment: "Emitir un reembolso para este pago",
    orderAndDate: "Pedido y fecha",
    paidCodCollected: "Pagado (efectivo cobrado)",
    paymentMethodColumn: "Método de pago",
    paymentMethodLabel: "Método de pago:",
    partialRefund: "Reembolso parcial",
    processing: "Procesando…",
    reason: "Motivo",
    reasonPlaceholder: "p. ej., frasco dañado en la entrega",
    recordRefund: "Registrar reembolso",
    refund: "Reembolso",
    refundAmountAboveZero: "El importe del reembolso debe ser superior a cero.",
    refundAmountPkr: "Importe del reembolso (PKR)",
    refundBankReference: "Referencia del reembolso / bancaria",
    refundExceedsRemaining: "El reembolso supera el importe reembolsable restante ({amount} Rs).",
    refundPending: "Reembolso pendiente",
    refundPendingOption: "Pendiente — transferencia en curso",
    refundProcessedOption: "Procesado — fondos devueltos",
    refundReferencePlaceholder: "p. ej., HBL-REF-88213",
    refundSubtitle: "Pedido {order} • {method} • Pagado {paid} Rs • Restante {remaining} Rs",
    refunds: "Reembolsos",
    reject: "Rechazar",
    searchByOrderClientOrReference:
      "Busque por número de pedido, nombre del cliente, correo o referencia de la transacción...",
    settledVerifiedPayments: "Pagos liquidados y verificados",
    title: "Gestión de pagos de la boutique",
    totalTransactions: "Total de transacciones",
    totalVerifiedSettlement: "Total de cobros verificados",
    verify: "Verificar",
    viewOrder: "Ver pedido",
  },
  ur: {
    referenceNote: "حوالہ / نوٹ",
    allMethods: "تمام طریقے",
    allPaymentRecords: "تمام ادائیگی کے ریکارڈ",
    amount: "رقم",
    awaitingCourierCash: "کوریئر کے کیش کا انتظار",
    bankTransfer: "بینک ٹرانسفر",
    cod: "کیش آن ڈیلیوری",
    codPendingCollection: "کیش آن ڈیلیوری — وصولی باقی",
    collectCash: "کیش وصول کریں",
    digitalPendingSubtitle: "تصدیق زیر التوا {pendingProof} · رسید کا انتظار {awaitingProof}",
    digitalPendingVerification: "ڈیجیٹل ادائیگی کی تصدیق زیر التوا",
    failed: "ناکام",
    financeRecordNotePlaceholder: "فنانس ریکارڈ کے لیے اختیاری نوٹ",
    fullyRefunded: "مکمل واپسی ہو گئی",
    introBody:
      "پاکستان کی ڈیجیٹل ترسیلات (JazzCash، Raast، بینک ٹرانسفر) کی تصدیق کریں اور کیش آن ڈیلیوری وصولیوں کا جائزہ لیں۔",
    issueRefund: "واپسی جاری کریں",
    issueRefundForThisPayment: "اس ادائیگی کے لیے واپسی جاری کریں",
    orderAndDate: "آرڈر اور تاریخ",
    paidCodCollected: "ادائیگی مکمل (کیش وصول ہو گئی)",
    partialRefund: "جزوی واپسی",
    paymentMethodColumn: "ادائیگی کا طریقہ",
    paymentMethodLabel: "ادائیگی کا طریقہ:",
    processing: "کارروائی جاری…",
    reason: "وجہ",
    reasonPlaceholder: "مثلاً ڈیلیوری پر بوتل ٹوٹ گئی",
    recordRefund: "واپسی درج کریں",
    refund: "واپسی",
    refundAmountAboveZero: "واپسی کی رقم صفر سے زیادہ ہونی چاہیے۔",
    refundAmountPkr: "واپسی کی رقم (PKR)",
    refundBankReference: "واپسی / بینک حوالہ",
    refundExceedsRemaining: "واپسی باقی رقم سے زیادہ ہے ({amount} روپے)۔",
    refundPending: "واپسی زیر التوا",
    refundPendingOption: "زیر التوا — بینک ٹرانسفر جاری",
    refundProcessedOption: "مکمل — رقم واپس کر دی گئی",
    refundReferencePlaceholder: "مثلاً HBL-REF-88213",
    refundSubtitle: "آرڈر {order} • {method} • ادا شدہ {paid} روپے • باقی {remaining} روپے",
    refunds: "واپسیاں",
    reject: "رد کریں",
    searchByOrderClientOrReference:
      "آرڈر نمبر، گاہک کا نام، ای میل یا ٹرانزیکشن حوالے سے تلاش کریں...",
    settledVerifiedPayments: "تصدیق شدہ اور مکمل ادائیگیاں",
    title: "اسٹور ادائیگیوں کا انتظام",
    totalTransactions: "کل لین دین",
    totalVerifiedSettlement: "تصدیق شدہ کل وصولی",
    verify: "تصدیق کریں",
    viewOrder: "آرڈر دیکھیں",
  },
  de: {
    referenceNote: "Referenz / Hinweis",
    allMethods: "Alle Zahlarten",
    allPaymentRecords: "Alle Zahlungsnachweise",
    amount: "Betrag",
    awaitingCourierCash: "Wartet auf Boten-Bargeld",
    bankTransfer: "Banküberweisung",
    cod: "Nachnahme",
    codPendingCollection: "Nachnahme — Eingang ausstehend",
    collectCash: "Bargeld kassieren",
    digitalPendingSubtitle: "Prüfung ausstehend {pendingProof} · Beleg erwartet {awaitingProof}",
    digitalPendingVerification: "Digitale Zahlung noch unbestätigt",
    failed: "Fehlgeschlagen",
    financeRecordNotePlaceholder: "Optionale Notiz für die Finanzbuchhaltung",
    fullyRefunded: "Vollständig erstattet",
    introBody:
      "Prüfen Sie digitale Zahlungen in Pakistan (JazzCash, Raast, Banküberweisung) und kontrollieren die Nachnahme-Eingänge.",
    issueRefund: "Erstattung ausstellen",
    issueRefundForThisPayment: "Erstattung für diese Zahlung ausstellen",
    orderAndDate: "Bestellung und Datum",
    paidCodCollected: "Bezahlt (Bargeld vereinnahmt)",
    partialRefund: "Teilrückerstattung",
    paymentMethodColumn: "Zahlart",
    paymentMethodLabel: "Zahlart:",
    processing: "Wird verarbeitet…",
    reason: "Grund",
    reasonPlaceholder: "z. B. Fläschchen bei Lieferung beschädigt",
    recordRefund: "Erstattung erfassen",
    refund: "Erstattung",
    refundAmountAboveZero: "Der Erstattungsbetrag muss über null liegen.",
    refundAmountPkr: "Erstattungsbetrag (PKR)",
    refundBankReference: "Erstattungs- / Bankreferenz",
    refundExceedsRemaining: "Die Erstattung übersteigt den verbleibenden Betrag ({amount} Rs).",
    refundPending: "Erstattung ausstehend",
    refundPendingOption: "Ausstehend — Überweisung läuft",
    refundProcessedOption: "Verarbeitet — Betrag zurückgezahlt",
    refundReferencePlaceholder: "z. B. HBL-REF-88213",
    refundSubtitle: "Bestellung {order} • {method} • Bezahlt {paid} Rs • Verbleibend {remaining} Rs",
    refunds: "Erstattungen",
    reject: "Ablehnen",
    searchByOrderClientOrReference:
      "Suche nach Bestellnummer, Kundenname, E-Mail oder Transaktionsreferenz...",
    settledVerifiedPayments: "Beglichene und geprüfte Zahlungen",
    title: "Zahlungsverwaltung der Boutique",
    totalTransactions: "Transaktionen gesamt",
    totalVerifiedSettlement: "Geprüfter Zahlungseingang gesamt",
    verify: "Prüfen",
    viewOrder: "Bestellung ansehen",
  },
};

for (const [lang, entries] of Object.entries(T)) {
  const file = path.join(ROOT, "src/i18n/dictionaries", `${lang}.ts`);
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const adminOpen = lines.findIndex((l) => /^  admin: \{$/.test(l));
  if (adminOpen === -1) throw new Error(`${file}: no admin block`);
  let payments = lines.findIndex((l, i) => i > adminOpen && /^    "?payments"? \{$/.test(l));
  let inserted = 0;
  let replaced = 0;
  if (payments === -1) {
    let end = adminOpen + 1;
    while (end < lines.length && !/^  \},$/.test(lines[end])) end += 1;
    const block = ["    payments: {", ...Object.entries(entries).map(([k, v]) => `      "${k}": ${JSON.stringify(v)},`), "    },"];
    lines.splice(end, 0, ...block);
    inserted = Object.keys(entries).length;
  } else {
    let end = payments + 1;
    while (end < lines.length && !/^    \},$/.test(lines[end])) end += 1;
    const body = lines.slice(payments + 1, end);
    const additions = [];
    for (const [key, value] of Object.entries(entries)) {
      const existing = body.findIndex((l) => new RegExp(`^      "?${key}"?:`).test(l));
      if (existing === -1) additions.push(`      "${key}": ${JSON.stringify(value)},`);
      else if (lang === "en" && /"Reference \/ Note"/.test(body[existing]) === false) {
        // never overwrite a value another pass already authored
        replaced += 0;
      }
    }
    lines.splice(end, 0, ...additions);
    inserted = additions.length;
  }
  fs.writeFileSync(file, lines.join("\n"), "utf8");
  console.log(`${lang}: +${inserted} payments key(s)`);
}
