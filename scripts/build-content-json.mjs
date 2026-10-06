// Authors the catalog content translations as the two JSON inputs for build-content-sql.mjs.
//
// Keyed by the English source text, so a note or category that gains a row in the database
// without a matching translation here is reported loudly instead of quietly falling back to
// English on a localized page.
//
//   node scripts/build-content-json.mjs
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const source = JSON.parse(fs.readFileSync(path.join(ROOT, "tmp-i18n/content.json"), "utf8"));

const T = {
  ar: {
    note: {
      Amber: "عنبر",
      Ambroxan: "أمبروكسان",
      Bergamot: "برغموت",
      "Black Pepper": "فلفل أسود",
      "Bulgarian Rose": "ورد بلغاري",
      Cardamom: "هيل",
      "Cashmere Wood": "خشب الكشمير",
      Cedar: "أرز",
      Cedarwood: "خشب الأرز",
      Cinnamon: "قرفة",
      Grapefruit: "جريب فروت",
      Iris: "سوسن",
      Jasmine: "ياسمين",
      Leather: "جلد",
      Mandarin: "يوسفي",
      Musk: "مسك",
      Nutmeg: "جوزة الطيب",
      "Orange Blossom": "زهر البرتقال",
      "Oud Wood": "خشب العود",
      Pear: "كمثرى",
      Peony: "فاونيا",
      "Pink Pepper": "فلفل وردي",
      "Pink Peppercorn": "حبيبات الفلفل الوردي",
      Praline: "برالين",
      Raspberry: "توت العليق",
      Saffron: "زعفران",
      Sage: "مريمية",
      Sandalwood: "خشب الصندل",
      "Smoked Woods": "أخشاب مدخنة",
      Suede: "شامواه",
      "Tobacco Leaf": "ورقة تبغ",
      "Tonka Bean": "حبة التونكا",
      Tuberose: "زهر التوبروز",
      "Turkish Rose": "ورد تركي",
      Vanilla: "فانيليا",
      Vetiver: "نجيل الهند",
      Violet: "بنفسج",
      "White Musk": "مسك أبيض",
    },
    category: {
      "Woody Oriental": "خشبي شرقي",
      "Fresh Woods": "أخشاب منعشة",
      "Floral Amber": "عنبر زهري",
      "Spicy Woody": "خشبي حار",
      "Floral Musk": "مسك زهري",
      "Amber Vanilla": "عنبر وفانيليا",
    },
    collection: {
      "Men's Collection": "مجموعة الرجال",
      "Women's Collection": "مجموعة النساء",
      "Unisex Collection": "مجموعة للجنسين",
    },
    product: {
      "Aura Nocturne": {
        name: "أورا نوكتورن",
        description: "توابل مدخنة وجلد، لساعات ما بعد حلول الظلام.",
      },
      "Golden Hour": {
        name: "الساعة الذهبية",
        description: "عنبر وفانيليا دفئتهما الشمس — راحة خالصة في قارورة.",
      },
      "Harm Land": {
        name: "هارم لاند",
        description: "عنبر وورد برومانسية، ولمسة نهائية مخملية بنعومة البودرة.",
      },
      "Mystic Oud": {
        name: "ميستيك أود",
        description:
          "عود عميق مدخّن تعلوه طبقات من الزعفران والورد البلغاري، لبصمة عطرية لا تقبل المساومة.",
      },
      "Rose Ember": {
        name: "جذوة الورد",
        description: "ورد عصري أنيق بوهج مسكي دافئ كلظى الجمر.",
      },
      "Un Kimmy": {
        name: "آن كيمي",
        description: "أخشاب نظيفة عصرية تفتتح بالحمضيات المنعشة — تناسب كل يوم بلا تكلّف.",
      },
    },
  },

  ur: {
    note: {
      Amber: "عنبر",
      Ambroxan: "ایمبروکسان",
      Bergamot: "برگاموٹ",
      "Black Pepper": "کالا مرچ",
      "Bulgarian Rose": "بلغاری گلاب",
      Cardamom: "الائچی",
      "Cashmere Wood": "کشمیری لکڑی",
      Cedar: "دیودار",
      Cedarwood: "دیودار کی لکڑی",
      Cinnamon: "دار چینی",
      Grapefruit: "چکوتا",
      Iris: "آئرس",
      Jasmine: "چمیلی",
      Leather: "چمڑا",
      Mandarin: "مینڈارن",
      Musk: "مسک",
      Nutmeg: "جائفل",
      "Orange Blossom": "نارنگی کے پھول",
      "Oud Wood": "عود کی لکڑی",
      Pear: "ناشپاتی",
      Peony: "پیونی",
      "Pink Pepper": "گلابی مرچ",
      "Pink Peppercorn": "گلابی مرچ کے دانے",
      Praline: "پرالیں",
      Raspberry: "رسبری",
      Saffron: "زعفران",
      Sage: "مریمہ",
      Sandalwood: "چندن",
      "Smoked Woods": "دھوئیں دار لکڑیاں",
      Suede: "نرم چمڑا",
      "Tobacco Leaf": "تمباکو کا پتا",
      "Tonka Bean": "ٹونکا پھلی",
      Tuberose: "سمند پھول",
      "Turkish Rose": "ترکی گلاب",
      Vanilla: "وینلا",
      Vetiver: "کاس",
      Violet: "بنفشا",
      "White Musk": "سفید مسک",
    },
    category: {
      "Woody Oriental": "مشرقی خشوی",
      "Fresh Woods": "تازہ اخشاب",
      "Floral Amber": "پھولدار عنبر",
      "Spicy Woody": "مسالیدار خشوی",
      "Floral Musk": "پھولدار مسک",
      "Amber Vanilla": "عنبر اور وینلا",
    },
    collection: {
      "Men's Collection": "مردانہ مجموعہ",
      "Women's Collection": "زنانہ مجموعہ",
      "Unisex Collection": "یونسیکس مجموعہ",
    },
    product: {
      "Aura Nocturne": {
        name: "آورا نوکٹورن",
        description: "دھوئیں دار مصالحے اور چمڑا، اندھیرے کے بعد کی گھڑیوں کے لیے۔",
      },
      "Golden Hour": {
        name: "سنہری گھڑی",
        description: "دھوپ سے ہم آہنگ عنبر اور وینلا — بوتل میں قیام پذیر سکون۔",
      },
      "Harm Land": {
        name: "ہارم لینڈ",
        description: "رومانوی عنبر اور گلاب، باریک پاؤڈر جیسی مخملی تکمیل کے ساتھ۔",
      },
      "Mystic Oud": {
        name: "مسٹک عود",
        description:
          "گہرا، دھوئیں دار عود جس پر زعفران اور بلغاری گلاب کی تہیں چڑھی ہوئی ہیں — ایسی پہچان جس پر کوئی سمجھوتہ نہ ہو۔",
      },
      "Rose Ember": {
        name: "گلاب کی چنگاری",
        description: "خوبصورت جدید گلاب، گرم مسک والی چنگاری کی روشنی کے ساتھ۔",
      },
      "Un Kimmy": {
        name: "ان کیمی",
        description: "صاف ستھری اور جدید لکڑیاں، تیز لیموں کی خوشبو والی شروعات — بے تکلف روزمرہ۔",
      },
    },
  },

  fr: {
    note: {
      Amber: "Ambre",
      Ambroxan: "Ambroxan",
      Bergamot: "Bergamote",
      "Black Pepper": "Poivre noir",
      "Bulgarian Rose": "Rose de Bulgarie",
      Cardamom: "Cardamome",
      "Cashmere Wood": "Bois de cachemire",
      Cedar: "Cèdre",
      Cedarwood: "Bois de cèdre",
      Cinnamon: "Cannelle",
      Grapefruit: "Pamplemousse",
      Iris: "Iris",
      Jasmine: "Jasmin",
      Leather: "Cuir",
      Mandarin: "Mandarine",
      Musk: "Musc",
      Nutmeg: "Noix de muscade",
      "Orange Blossom": "Fleur d’oranger",
      "Oud Wood": "Bois de oud",
      Pear: "Poire",
      Peony: "Pivoine",
      "Pink Pepper": "Poivre rose",
      "Pink Peppercorn": "Baies de poivre rose",
      Praline: "Praline",
      Raspberry: "Framboise",
      Saffron: "Safran",
      Sage: "Sauge",
      Sandalwood: "Bois de santal",
      "Smoked Woods": "Bois fumés",
      Suede: "Daim",
      "Tobacco Leaf": "Feuille de tabac",
      "Tonka Bean": "Fève tonka",
      Tuberose: "Tubéreuse",
      "Turkish Rose": "Rose de Turquie",
      Vanilla: "Vanille",
      Vetiver: "Vétiver",
      Violet: "Violette",
      "White Musk": "Musc blanc",
    },
    category: {
      "Woody Oriental": "Oriental boisé",
      "Fresh Woods": "Bois frais",
      "Floral Amber": "Ambre floral",
      "Spicy Woody": "Boisé épicé",
      "Floral Musk": "Musc floral",
      "Amber Vanilla": "Ambre vanille",
    },
    collection: {
      "Men's Collection": "Collection Homme",
      "Women's Collection": "Collection Femme",
      "Unisex Collection": "Collection Mixte",
    },
    product: {
      "Aura Nocturne": {
        name: "Aura Nocturne",
        description: "Épices fumées et cuir, pour les heures de la nuit tombée.",
      },
      "Golden Hour": {
        name: "Heure Dorée",
        description: "Ambre vanille réchauffé par le soleil — un pur réconfort en flacon.",
      },
      "Harm Land": {
        name: "Harm Land",
        description: "Ambre romantique et rose, sur un fond de poudre veloutée.",
      },
      "Mystic Oud": {
        name: "Oud Mystique",
        description:
          "Oud profond et fumé, sublimé de safran et de rose de Bulgarie, pour une signature sans compromis.",
      },
      "Rose Ember": {
        name: "Rose Ardente",
        description: "Rose moderne et élégante, éclairée d’un musc chaud et incandescent.",
      },
      "Un Kimmy": {
        name: "Un Kimmy",
        description: "Bois nets et modernes, ouverture d’agrumes vive — une évidence au quotidien.",
      },
    },
  },

  es: {
    note: {
      Amber: "Ámbar",
      Ambroxan: "Ambroxán",
      Bergamot: "Bergamota",
      "Black Pepper": "Pimienta negra",
      "Bulgarian Rose": "Rosa búlgara",
      Cardamom: "Cardamomo",
      "Cashmere Wood": "Madera de cachemira",
      Cedar: "Cedro",
      Cedarwood: "Madera de cedro",
      Cinnamon: "Canela",
      Grapefruit: "Pomelo",
      Iris: "Iris",
      Jasmine: "Jazmín",
      Leather: "Cuero",
      Mandarin: "Mandarina",
      Musk: "Almizcle",
      Nutmeg: "Nuez moscada",
      "Orange Blossom": "Azahar",
      "Oud Wood": "Madera de oud",
      Pear: "Pera",
      Peony: "Peonía",
      "Pink Pepper": "Pimienta rosa",
      "Pink Peppercorn": "Granos de pimienta rosa",
      Praline: "Praliné",
      Raspberry: "Frambuesa",
      Saffron: "Azafrán",
      Sage: "Salvia",
      Sandalwood: "Sándalo",
      "Smoked Woods": "Maderas ahumadas",
      Suede: "Ante",
      "Tobacco Leaf": "Hoja de tabaco",
      "Tonka Bean": "Haba tonka",
      Tuberose: "Nardo",
      "Turkish Rose": "Rosa turca",
      Vanilla: "Vainilla",
      Vetiver: "Vetiver",
      Violet: "Violeta",
      "White Musk": "Almizcle blanco",
    },
    category: {
      "Woody Oriental": "Amaderado oriental",
      "Fresh Woods": "Maderas frescas",
      "Floral Amber": "Ámbar floral",
      "Spicy Woody": "Amaderado especiado",
      "Floral Musk": "Almizcle floral",
      "Amber Vanilla": "Ámbar y vainilla",
    },
    collection: {
      "Men's Collection": "Colección Hombre",
      "Women's Collection": "Colección Mujer",
      "Unisex Collection": "Colección Unisex",
    },
    product: {
      "Aura Nocturne": {
        name: "Aura Nocturna",
        description: "Especias ahumadas y cuero, para las horas tras el anochecer.",
      },
      "Golden Hour": {
        name: "Hora Dorada",
        description: "Ámbar y vainilla templados por el sol — puro confort en un frasco.",
      },
      "Harm Land": {
        name: "Harm Land",
        description: "Ámbar romántico y rosa con un acabado de terciopelo empolvado.",
      },
      "Mystic Oud": {
        name: "Oud Místico",
        description:
          "Oud profundo y ahumado, con capas de azafrán y rosa búlgara, para una firma sin concesiones.",
      },
      "Rose Ember": {
        name: "Rosa Incandescente",
        description: "Rosa moderna y elegante con el resplandor cálido del almizcle.",
      },
      "Un Kimmy": {
        name: "Un Kimmy",
        description:
          "Maderas limpias y modernas con una salida cítrica chispeante — perfecta para cada día sin esfuerzo.",
      },
    },
  },

  de: {
    note: {
      Amber: "Amber",
      Ambroxan: "Ambroxan",
      Bergamot: "Bergamotte",
      "Black Pepper": "Schwarzer Pfeffer",
      "Bulgarian Rose": "Bulgarische Rose",
      Cardamom: "Kardamom",
      "Cashmere Wood": "Kaschmirholz",
      Cedar: "Zeder",
      Cedarwood: "Zedernholz",
      Cinnamon: "Zimt",
      Grapefruit: "Grapefruit",
      Iris: "Iris",
      Jasmine: "Jasmin",
      Leather: "Leder",
      Mandarin: "Mandarine",
      Musk: "Moschus",
      Nutmeg: "Muskatnuss",
      "Orange Blossom": "Orangenblüte",
      "Oud Wood": "Oudholz",
      Pear: "Birne",
      Peony: "Pfingstrose",
      "Pink Pepper": "Rosa Pfeffer",
      "Pink Peppercorn": "Rosa Pfefferkörner",
      Praline: "Praline",
      Raspberry: "Himbeere",
      Saffron: "Safran",
      Sage: "Salbei",
      Sandalwood: "Sandelholz",
      "Smoked Woods": "Geräucherte Hölzer",
      Suede: "Wildleder",
      "Tobacco Leaf": "Tabakblatt",
      "Tonka Bean": "Tonkabohne",
      Tuberose: "Tuberose",
      "Turkish Rose": "Türkenrose",
      Vanilla: "Vanille",
      Vetiver: "Vetiver",
      Violet: "Veilchen",
      "White Musk": "Weißer Moschus",
    },
    category: {
      "Woody Oriental": "Holzig-Orientalisch",
      "Fresh Woods": "Frische Hölzer",
      "Floral Amber": "Floraler Amber",
      "Spicy Woody": "Würzig-Holzig",
      "Floral Musk": "Floraler Moschus",
      "Amber Vanilla": "Amber-Vanille",
    },
    collection: {
      "Men's Collection": "Herrenkollektion",
      "Women's Collection": "Damenkollektion",
      "Unisex Collection": "Unisex-Kollektion",
    },
    product: {
      "Aura Nocturne": {
        name: "Aura Nocturne",
        description: "Rauchige Gewürze und Leder für die Stunden nach Einbruch der Dunkelheit.",
      },
      "Golden Hour": {
        name: "Goldene Stunde",
        description: "Sonnengewärmter Amber und Vanille — pure Geborgenheit im Flakon.",
      },
      "Harm Land": {
        name: "Harm Land",
        description: "Romantischer Amber und Rose mit einem samtig-pudrigen Finale.",
      },
      "Mystic Oud": {
        name: "Mystischer Oud",
        description:
          "Tiefer, rauchiger Oud, mit Safran und bulgarischer Rose zu einer kompromisslosen Signatur geschichtet.",
      },
      "Rose Ember": {
        name: "Rosenglut",
        description: "Elegante, moderne Rose mit einem warmen, moschusglühenden Schimmer.",
      },
      "Un Kimmy": {
        name: "Un Kimmy",
        description:
          "Klare, moderne Hölzer mit einer frischen Zitrus-Eröffnung — ganz selbstverständlich im Alltag.",
      },
    },
  },
};

const missing = new Set();
const track = (lang, kind, text) => {
  missing.add(`${lang}.${kind}:${text}`);
  return null;
};

function build(lang) {
  const t = T[lang];
  const out = { products: {}, categories: {}, collections: {}, notes: {} };
  for (const p of source.products) {
    const hit = t.product[p.name];
    if (!hit) {
      track(lang, "product", p.name);
      continue;
    }
    const family = t.category[p.family] ?? track(lang, "category", p.family);
    out.products[p.id] = {
      name: hit.name,
      description: hit.description,
      fragranceFamily: family,
      // The read path prefers these over the English columns, so SEO metadata follows too.
      seoTitle: `${hit.name} — HM Signature`,
      seoDescription: hit.description,
    };
  }
  for (const c of source.categories) {
    if (!t.category[c.name]) track(lang, "category", c.name);
    else out.categories[c.id] = { name: t.category[c.name] };
  }
  for (const c of source.collections) {
    if (!t.collection[c.name]) track(lang, "collection", c.name);
    else out.collections[c.id] = { name: t.collection[c.name] };
  }
  for (const n of source.notes) {
    if (!t.note[n.name]) track(lang, "note", n.name);
    else out.notes[n.id] = { name: t.note[n.name] };
  }
  return out;
}

const files = {
  "tmp-i18n/content.ar-ur.json": ["ar", "ur"],
  "tmp-i18n/content.fr-es.json": ["fr", "es"],
  "tmp-i18n/content.de.json": ["de"],
};
for (const [file, langs] of Object.entries(files)) {
  const data = {};
  for (const lang of langs) data[lang] = build(lang);
  fs.writeFileSync(path.join(ROOT, file), JSON.stringify(data, null, 2), "utf8");
  const count = (o) => Object.values(o).reduce((a, list) => a + Object.keys(list).length, 0);
  console.log(`${file}: ${langs.map((l) => `${l}=${count(data[l])}`).join(" ")}`);
}
if (missing.size) {
  console.log(`UNTRANSLATED SOURCE STRINGS (${missing.size}):`);
  for (const m of missing) console.log(`  - ${m}`);
  process.exitCode = 1;
} else {
  console.log(
    `every product, category, collection and fragrance note in the source has a translation in all ${
      Object.keys(T).length
    } target languages`
  );
}
