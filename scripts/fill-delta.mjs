// Backfills the keys that landed in en.ts after the language dictionaries were built.
// Table-driven so the wording is authored by hand, not guessed, and re-running is a no-op.
//
//   node scripts/fill-delta.mjs [--langs=ar,fr,es,de,en]
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const langs = (process.argv.find((a) => a.startsWith("--langs=")) || "--langs=ar,fr,es,de")
  .replace("--langs=", "")
  .split(",")
  .filter(Boolean);

// key -> [ar, ur, fr, es, de]  (en is already present; common.complimentary is added to en too)
const T = {
  "admin.dashboard.actionRequired": ["إجراء مطلوب", "کارروائی درکار", "Action requise", "Acción requerida", "Aktion erforderlich"],
  "admin.dashboard.cancelledOrders": ["الطلبات الملغاة", "منسوخ آرڈر", "Commandes annulées", "Pedidos cancelados", "Stornierte Bestellungen"],
  "admin.dashboard.client": ["العميل", "گاہک", "Client", "Cliente", "Kundschaft"],
  "admin.dashboard.completedAcquisitions": ["الطلبات المكتملة", "مکمل شدہ آرڈرز", "Commandes terminées", "Pedidos completados", "Abgeschlossene Bestellungen"],
  "admin.dashboard.courierDispatched": ["تم إرسال المندوب", "کوریئر روانہ ہوا", "Livreur expédié", "Mensajero enviado", "Kurier versandt"],
  "admin.dashboard.deliveredOrders": ["الطلبات المسلّمة", "پہنچائے گئے آرڈرز", "Commandes livrées", "Pedidos entregados", "Zugestellte Bestellungen"],
  "admin.dashboard.destinationTransit": ["في الطريق إلى الوجهة", "منزل کی جانب راستے میں", "En transit vers la destination", "En tránsito al destino", "Transport zum Zielort"],
  "admin.dashboard.inAtelierPackaging": ["قيد التغليف في الأتيلييه", "ایٹیلیر میں پیکنگ جاری", "En emballage atelier", "En embalaje del atelier", "In Atelier-Verpackung"],
  "admin.dashboard.liveOperationsWorkspace": [
    "مساحة عمل حيّة للطلبات المعلقة، وأرقام تتبّع المندوبين، والتحقق من المدفوعات، وإرسال الطلبات.",
    "زبستہ آرڈرز، کوریئر ٹریکنگ آئی ڈی، ادائیگی کی تصدیق اور آرڈر روانگی کے لیے لائیو آپریشنز اسپیس۔",
    "Espace de travail en direct pour les commandes en attente, les numéros de suivi, la vérification des paiements et l'expédition des commandes.",
    "Espacio de trabajo en directo para pedidos pendientes, IDs de seguimiento, verificación de pagos y envío de pedidos.",
    "Live-Ops-Bereich für offene Bestellungen, Sendungsnummern, Zahlungsprüfung und Bestellversand.",
  ],
  "admin.dashboard.manageAll": ["إدارة الكل", "سب کا انتظام", "Tout gérer", "Gestionar todo", "Alle verwalten"],
  "admin.dashboard.monitorStatusTransitions": [
    "راقب تغيّرات الحالة، وإرسال المندوب، وأرقام التتبّع",
    "حالت کی تبدیلیاں، کوریئر روانگی اور ٹریکنگ آئی ڈیز پر نظر رکھیں",
    "Suivez les changements de statut, l'expédition et les numéros de suivi",
    "Supervisa los cambios de estado, el envío y los IDs de seguimiento",
    "Statuswechsel, Kurier Versand und Sendungsnummern überwachen",
  ],
  "admin.dashboard.newOrdersToday": ["طلبات جديدة اليوم", "آج کے نئے آرڈر", "Nouvelles commandes aujourd'hui", "Pedidos nuevos hoy", "Neue Bestellungen heute"],
  "admin.dashboard.notAssigned": ["غير مُسند", "تفویض نہیں کیا گیا", "Non attribué", "Sin asignar", "Nicht zugewiesen"],
  "admin.dashboard.orderFulfilmentDispatchConcierge": [
    "كونسيرج تجهيز الطلبات وإرسالها",
    "آرڈر تیاری اور روانگی کونسرج",
    "Conciergerie de traitement et d'expédition des commandes",
    "Concierje de preparación y envío de pedidos",
    "Concierge für Bestellabwicklung und Versand",
  ],
  "admin.dashboard.orderNumber": ["رقم الطلب", "آرڈر نمبر", "Numéro de commande", "Número de pedido", "Bestellnummer"],
  "admin.dashboard.payment": ["الدفع", "ادائیگی", "Paiement", "Pago", "Zahlung"],
  "admin.dashboard.pendingReview": ["بانتظار المراجعة", "جائزہ زیر التوا", "En attente de vérification", "Pendiente de revisión", "Prüfung ausstehend"],
  "admin.dashboard.processingBatch": ["دفعة قيد المعالجة", "پروسیسنگ بیچ", "Lot en traitement", "Lote en procesamiento", "Charge in Bearbeitung"],
  "admin.dashboard.receivedToday": ["ورد اليوم", "آج موصول", "Reçues aujourd'hui", "Recibidos hoy", "Heute eingegangen"],
  "admin.dashboard.recentOrdersRequiringFulfilment": [
    "أحدث الطلبات التي تحتاج إلى تجهيز",
    "حالیہ آرڈر جن کی تیاری باقی ہے",
    "Commandes récentes à traiter",
    "Pedidos recientes por preparar",
    "Kürzlich abzuwickelnde Bestellungen",
  ],
  "admin.dashboard.repositoryTotal": ["الإجمالي في المستودع", "ذخیروں کی کل تعداد", "Total du dépôt", "Total del repositorio", "Gesamtbestand"],
  "admin.dashboard.shippedInTransit": ["تم الشحن وهو في الطريق", "روانہ، راستے میں", "Expédiées en transit", "Enviados en tránsito", "Versandt · unterwegs"],
  "admin.dashboard.totalLifetimeOrders": ["إجمالي الطلبات منذ الانطلاق", "کل آرڈرز (مجموعی طور پر)", "Total des commandes", "Total de pedidos históricos", "Bestellungen insgesamt"],
  "admin.dashboard.trackingId": ["رقم التتبّع", "ٹریکنگ آئی ڈی", "Numéro de suivi", "ID de seguimiento", "Sendungsnummer"],
  "admin.dashboard.voidedRequests": ["طلبات مُلغاة", "منسوخ درخواستیں", "Demandes annulées", "Solicitudes anuladas", "Stornierte Anfragen"],
  "admin.dashboard.fulfilArrow": ["تجهيز →", "تیار کریں →", "Traiter →", "Gestionar →", "Abwickeln →"],
  "admin.dashboard.viewAllOrdersCount": [
    "عرض جميع الطلبات ({count})",
    "تمام آرڈر دیکھیں ({count})",
    "Voir toutes les commandes ({count})",
    "Ver todos los pedidos ({count})",
    "Alle Bestellungen anzeigen ({count})",
  ],
  "admin.navGroup.overview": ["نظرة عامة", "جائزہ", "Aperçu", "Resumen", "Übersicht"],
  "admin.navGroup.commerce": ["التجارة", "کاروبار", "Commerce", "Comercio", "Handel"],
  "admin.navGroup.customers": ["العملاء", "گاہک", "Clientèle", "Clientes", "Kundschaft"],
  "admin.navGroup.content": ["المحتوى", "مواد", "Contenu", "Contenido", "Inhalte"],
  "admin.navGroup.operations": ["العمليات", "عملیات", "Opérations", "Operaciones", "Betrieb"],
  "admin.navGroup.management": ["الإدارة", "انتظام", "Gestion", "Gestión", "Verwaltung"],
  "admin.status.outfordelivery": ["في طريقه للتسليم", "ترسیل کے لیے روانہ", "En cours de livraison", "En reparto", "Zustellung läuft"],
  "common.complimentary": ["مجاني", "مفت", "Offerts", "Gratis", "Kostenlos"],
};

const SLOT = { ar: 0, ur: 1, fr: 2, es: 3, de: 4 };

function insertLeaf(lines, nsName, leaf, value) {
  const open = lines.findIndex((l) => new RegExp(`^  ${nsName}: \\{$`).test(l));
  if (open === -1) return false;
  let close = open + 1;
  const groupRe = nsName === "admin" ? /^    "?([A-Za-z][\w]*)"?: \{$/ : null;
  if (nsName === "admin") {
    // admin.<group>.<leaf>: find the group, then its closing brace.
    const group = leaf.split(".")[0];
    let gIdx = -1;
    let g = null;
    for (let i = open + 1; i < lines.length; i += 1) {
      if (/^  \},$/.test(lines[i])) break;
      const m = groupRe.exec(lines[i]);
      if (m) {
        g = m[1];
        if (g === group) { gIdx = i; break; }
      }
    }
    if (gIdx === -1) return false;
    let end = gIdx + 1;
    while (end < lines.length && !/^    \},$/.test(lines[end])) end += 1;
    if (lines.slice(gIdx, end).some((l) => new RegExp(`^      "?${leaf.split(".").pop()}"?:`).test(l))) return true;
    lines.splice(end, 0, `      "${leaf.split(".").pop()}": ${JSON.stringify(value)},`);
    return true;
  }
  while (close < lines.length && !/^  \},?$/.test(lines[close])) close += 1;
  if (lines.slice(open, close).some((l) => new RegExp(`^    "?${leaf}"?:`).test(l))) return true;
  lines.splice(close, 0, `    ${leaf}: ${JSON.stringify(value)},`);
  return true;
}

for (const lang of langs) {
  const file = path.join(ROOT, "src/i18n/dictionaries", `${lang}.ts`);
  const lines = fs.readFileSync(file, "utf8").split("\n");
  let placed = 0;
  let skipped = 0;
  for (const [key, values] of Object.entries(T)) {
    const value = lang === "en" ? null : values[SLOT[lang]];
    if (value === null) continue;
    const parts = key.split(".");
    const ns = parts[0];
    const leaf = parts.slice(1).join(".");
    if (insertLeaf(lines, ns, leaf, value)) placed += 1;
    else skipped += 1;
  }
  fs.writeFileSync(file, lines.join("\n"), "utf8");
  console.log(`${lang}: touched ${placed} key slot(s)${skipped ? `, ${skipped} could not be placed` : ""}`);
}
