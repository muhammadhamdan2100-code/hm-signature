import { useCallback, useEffect, useMemo, useState } from "react";
import { Languages, Save, Trash2, Loader2 } from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import { getCatalogCategories, getCatalogCollections, getCatalogProducts } from "../../services/catalog";
import { fetchLanguages } from "../../services/internationalConfig";
import {
  deleteTranslation,
  readTranslationMap,
  saveTranslation,
  bundleFor,
  type EntityKind,
  type TranslationBundle,
} from "../../services/localizedContent";
import type { Product } from "../../data/products";
import { isSupabaseConfigured } from "../../lib/supabase";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../../i18n/I18nProvider";

// Localized marketing copy is edited here and nowhere else. Every save goes through the
// permission-checked database function, so the browser never writes the table directly.

const TRANSLATABLE_FIELDS: Record<EntityKind, { key: string; labelKey: string; long?: boolean }[]> = {
  product: [
    { key: "name", labelKey: "admin.localization.fieldProductName" },
    { key: "shortDescription", labelKey: "admin.localization.fieldShortDescription" },
    { key: "description", labelKey: "admin.localization.fieldDescription", long: true },
    { key: "scentProfile", labelKey: "admin.localization.fieldScentProfile" },
    { key: "fragranceFamily", labelKey: "admin.localization.fieldFragranceFamily" },
    { key: "seoTitle", labelKey: "admin.localization.fieldSeoTitle" },
    { key: "seoDescription", labelKey: "admin.localization.fieldSeoDescription", long: true },
  ],
  category: [
    { key: "name", labelKey: "admin.localization.fieldCategoryName" },
    { key: "description", labelKey: "admin.localization.fieldCategoryDescription", long: true },
  ],
  collection: [
    { key: "name", labelKey: "admin.localization.fieldCollectionName" },
    { key: "description", labelKey: "admin.localization.fieldCollectionDescription", long: true },
  ],
  homepage_section: [
    { key: "title", labelKey: "admin.localization.fieldTitle" },
    { key: "subtitle", labelKey: "admin.localization.fieldSubtitle" },
    { key: "content", labelKey: "admin.localization.fieldContent", long: true },
  ],
  fragrance_note: [{ key: "name", labelKey: "admin.localization.fieldNoteName" }],
};

const KINDS: { value: EntityKind; labelKey: string }[] = [
  { value: "product", labelKey: "admin.localization.kindProducts" },
  { value: "category", labelKey: "admin.localization.kindCategories" },
  { value: "collection", labelKey: "admin.localization.kindCollections" },
  { value: "homepage_section", labelKey: "admin.localization.kindHomepageSections" },
  { value: "fragrance_note", labelKey: "admin.localization.kindFragranceNotes" },
];

export function LocalizationPage() {
  const { t } = useI18n();
  const { showToast } = useAdminData();
  const canManage = hasPermission(getCurrentStaff(), "content.manage") || hasPermission(getCurrentStaff(), "settings.manage");

  const [kind, setKind] = useState<EntityKind>("product");
  const [language, setLanguage] = useState("ar");
  const [languages, setLanguages] = useState<{ code: string; nativeName: string }[]>([]);
  const [entities, setEntities] = useState<{ id: string; label: string; source: Record<string, string> }[]>([]);
  const [entityId, setEntityId] = useState("");
  const [values, setValues] = useState<TranslationBundle>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stored, setStored] = useState(false);

  const entity = useMemo(() => entities.find((e) => e.id === entityId) ?? null, [entities, entityId]);
  const fields = TRANSLATABLE_FIELDS[kind];

  useEffect(() => {
    fetchLanguages()
      .then((rows) => {
        const offered = rows.filter((r) => r.enabled && r.code !== "en");
        setLanguages(offered.map((r) => ({ code: r.code, nativeName: r.nativeName })));
        if (offered.length > 0 && !offered.some((r) => r.code === language)) setLanguage(offered[0].code);
      })
      .catch(() => setLanguages([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The English source is what an editor compares against, so it is read as the unlocalized
  // rows this page can show beside the translation.
  const loadEntities = useCallback(async () => {
    setLoading(true);
    setEntities([]);
    setEntityId("");
    setStored(false);
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }
    try {
      if (kind === "product") {
        const rows = await getCatalogProducts();
        setEntities(
          (rows as Product[]).map((p) => ({
            id: p.id,
            label: p.name,
            source: {
              name: p.name,
              shortDescription: p.shortDescription ?? "",
              description: p.description ?? "",
              scentProfile: p.scentProfile ?? "",
              fragranceFamily: p.fragranceFamily ?? "",
              seoTitle: p.seoTitle ?? "",
              seoDescription: p.seoDescription ?? "",
            },
          }))
        );
      } else if (kind === "category") {
        const rows = await getCatalogCategories();
        setEntities(rows.map((c) => ({ id: c.id, label: c.name, source: { name: c.name, description: c.description ?? "" } })));
      } else if (kind === "collection") {
        const rows = await getCatalogCollections();
        setEntities(rows.map((c) => ({ id: c.id, label: c.name, source: { name: c.name, description: c.description ?? "" } })));
      } else {
        const table = kind === "homepage_section" ? "homepage_sections" : "fragrance_notes";
        const select = kind === "homepage_section" ? "id, section_key, title, subtitle, content" : "id, name";
        const { data } = await supabase.from(table).select(select).order("id");
        setEntities(
          (data ?? []).map((row: any) => {
            const source: Record<string, string> = {};
            if (kind === "homepage_section") {
              source.title = row.title ?? "";
              source.subtitle = row.subtitle ?? "";
              source.content = row.content ?? "";
            } else {
              source.name = row.name ?? "";
            }
            return {
              id: row.id,
              label: row.title || row.name || row.section_key || row.id,
              source,
            };
          })
        );
      }
    } catch {
      showToast("error", t("admin.localization.contentListLoadFailed"));
    }
    setLoading(false);
    // `t` is read but deliberately not a dependency: re-creating this callback on every
    // interface-language change would refetch the catalogue and drop the selected item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, showToast]);

  useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  // Existing bundles are read once per entity+language; the same cache the storefront uses.
  useEffect(() => {
    let alive = true;
    if (!entityId) return;
    readTranslationMap(language).then((map) => {
      if (!alive) return;
      const bundle = bundleFor(map, kind, entityId);
      setValues(bundle);
      setStored(Object.keys(bundle).length > 0);
    });
    return () => {
      alive = false;
    };
  }, [entityId, kind, language]);

  const commit = async () => {
    if (!entityId) return;
    const trimmed: TranslationBundle = {};
    for (const field of fields) {
      const value = (values[field.key] ?? "").trim();
      if (value) trimmed[field.key] = value;
    }
    if (Object.keys(trimmed).length === 0) {
      showToast("error", t("admin.localization.fillAtLeastOneField"));
      return;
    }
    setSaving(true);
    const result = await saveTranslation({ entityType: kind, entityRef: entityId, language, values: trimmed });
    setSaving(false);
    if (!result.ok) {
      showToast("error", result.message ?? t("admin.localization.translationSaveFailed"));
      return;
    }
    setStored(true);
    showToast("success", t("admin.localization.translationSavedNote"));
  };

  const remove = async () => {
    if (!entityId) return;
    setSaving(true);
    const result = await deleteTranslation({ entityType: kind, entityRef: entityId, language });
    setSaving(false);
    if (!result.ok) {
      showToast("error", result.message ?? t("admin.localization.translationRemoveFailed"));
      return;
    }
    setValues({});
    setStored(false);
    showToast("success", t("admin.localization.translationRemovedNote"));
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="border-b border-gold/20 pb-4">
        <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
          {t("admin.localization.eyebrow")}
        </span>
        <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
          {t("admin.localization.title")}
        </h1>
        <p className="text-xs text-muted mt-1 max-w-2xl leading-relaxed">
          {t("admin.localization.introBody")}
        </p>
      </div>

      {!canManage && (
        <p className="text-xs text-muted border border-gold/20 bg-navy2/60 rounded-lg px-4 py-3">
          {t("admin.localization.readOnlyNote")}
        </p>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        <label className="block text-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1 block">{t("admin.localization.contentType")}</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as EntityKind)}
            className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {t(k.labelKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1 block">{t("admin.localization.language")}</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
          >
            {languages.length === 0 && <option value={language}>{language}</option>}
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName} ({l.code})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs">
          <span className="text-[10px] font-mono uppercase tracking-widest text-gold mb-1 block">{t("admin.localization.item")}</span>
          <select
            value={entityId}
            onChange={(e) => setEntityId(e.target.value)}
            className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-ivory focus:outline-none focus:border-gold"
          >
            <option value="">—</option>
            {entities.map((row) => (
              <option key={row.id} value={row.id}>
                {row.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-xs text-muted">
          <Loader2 className="w-4 h-4 animate-spin" /> {t("admin.localization.loadingContent")}
        </p>
      ) : !entity ? (
        <p className="text-xs text-muted border border-gold/15 bg-navy2/50 rounded-lg px-4 py-6 text-center">
          {t("admin.localization.chooseEntityNote")}
        </p>
      ) : (
        <div className="space-y-4">
          {stored && (
            <p className="text-[11px] text-emerald-300 font-mono uppercase tracking-wider flex items-center gap-2">
              <Languages className="w-3.5 h-3.5" /> {t("admin.localization.storedForLanguage", { language: language.toUpperCase() })}
            </p>
          )}

          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="block">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t(field.labelKey)}</span>
                  {field.long ? (
                    <textarea
                      rows={3}
                      disabled={!canManage}
                      value={values[field.key] ?? ""}
                      placeholder={entity.source[field.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                      className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold disabled:opacity-60"
                    />
                  ) : (
                    <input
                      disabled={!canManage}
                      value={values[field.key] ?? ""}
                      placeholder={entity.source[field.key] ?? ""}
                      onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                      className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold disabled:opacity-60"
                    />
                  )}
                </label>
                {entity.source[field.key] && (
                  <p className="text-[10px] text-muted truncate">
                    {t("admin.localization.englishSource")} {entity.source[field.key]}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={commit}
              disabled={!canManage || saving}
              className="flex-1 px-4 py-2.5 bg-gold hover:bg-goldLight text-navy rounded text-xs font-semibold uppercase tracking-wider disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" /> {saving ? t("admin.localization.saving") : t("admin.localization.saveTranslation")}
            </button>
            {stored && (
              <button
                onClick={remove}
                disabled={!canManage || saving}
                className="px-4 py-2.5 rounded text-xs uppercase tracking-wider border border-rose-500/40 text-rose-300 hover:border-rose-400 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> {t("common.remove")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LocalizationPage;
