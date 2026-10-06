import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";
import { useAdminData } from "../context/AdminDataContext";
import { getCurrentStaff, hasPermission } from "../../services/auth";
import { fetchDiscoveryTags, removeDiscoveryTag, saveDiscoveryTag, type DiscoveryTag } from "../../services/brandAdmin";
import { getCatalogProducts } from "../../services/catalog";
import { AccessDeniedNote } from "../components/Phase8Shared";
import type { Product } from "../../data/products";

const KINDS = ["mood", "occasion", "season", "longevity", "sillage", "gift_for"] as const;

export function DiscoveryTagsPage() {
  const { t } = useI18n();
  const { showToast } = useAdminData();
  const canManage = hasPermission(getCurrentStaff(), "discovery.manage");

  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<DiscoveryTag[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [draft, setDraft] = useState({ productId: "", kind: "mood", value: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tagResult, catalogue] = await Promise.all([fetchDiscoveryTags(), getCatalogProducts()]);
      setTags(tagResult.tags);
      setProducts(catalogue || []);
      if (tagResult.error) showToast("error", tagResult.error);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted font-mono uppercase tracking-wider py-10">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        {t("admin.shared.loading")}
      </div>
    );
  }

  if (!canManage) return <AccessDeniedNote>{t("admin.discovery.denied")}</AccessDeniedNote>;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl">{t("admin.discovery.title")}</h1>
        <p className="text-xs text-muted leading-relaxed max-w-2xl">{t("admin.discovery.body")}</p>
      </header>

      <section className="rounded-xl border border-gold/25 bg-navy2 p-6 space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <label className="space-y-1.5 block">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.discovery.fragrance")}</span>
            <select
              value={draft.productId}
              onChange={(event) => setDraft({ ...draft, productId: event.target.value })}
              className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              <option value="">{t("admin.discovery.chooseFragrance")}</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 block">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.discovery.attribute")}</span>
            <select
              value={draft.kind}
              onChange={(event) => setDraft({ ...draft, kind: event.target.value })}
              className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            >
              {KINDS.map((kind) => (
                <option key={kind} value={kind}>{kind}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1.5 block">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold">{t("admin.discovery.value")}</span>
            <input
              value={draft.value}
              onChange={(event) => setDraft({ ...draft, value: event.target.value.toLowerCase() })}
              placeholder={t("admin.discovery.valuePlaceholder")}
              className="w-full bg-navy border border-gold/25 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
            />
          </label>
        </div>

        <button
          type="button"
          disabled={busy || !draft.productId || draft.value.trim().length < 2}
          onClick={async () => {
            setBusy(true);
            const result = await saveDiscoveryTag(draft.productId, draft.kind, draft.value.trim());
            setBusy(false);
            if (result.success) {
              showToast("success", t("admin.discovery.saved"));
              setDraft({ ...draft, value: "" });
              await load();
            } else {
              showToast("error", result.error || t("admin.discovery.failed"));
            }
          }}
          className="btn-gold-fill font-sans text-xs disabled:opacity-50 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          {t("admin.discovery.addCta")}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg">{t("admin.discovery.listed", { count: tags.length })}</h2>
        {tags.length === 0 ? (
          <p className="text-xs text-muted border border-gold/20 rounded px-4 py-6 text-center leading-relaxed">
            {t("admin.discovery.empty")}
          </p>
        ) : (
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tags.map((tag) => (
              <li key={tag.id} className="border border-gold/15 bg-navy/50 rounded-lg p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-ivory truncate">{tag.productName}</p>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-gold">{tag.kind}: {tag.value}</p>
                </div>
                <button
                  type="button"
                  aria-label={t("admin.discovery.remove")}
                  onClick={async () => {
                    const result = await removeDiscoveryTag(tag.id);
                    if (result.success) await load();
                    else showToast("error", result.error || t("admin.discovery.failed"));
                  }}
                  className="text-muted hover:text-gold shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}


export default DiscoveryTagsPage;
