import React, { useEffect, useState } from "react";
import { useAdminData } from "../context/AdminDataContext";
import { ImageUploader } from "../components/ImageUploader";
import { Save, Eye, ArrowUp, ArrowDown } from "lucide-react";
import { useI18n } from "../../i18n/I18nProvider";

export const HomepageCmsPage: React.FC = () => {
  const { t } = useI18n();
  const { homepageConfig, updateHomepageConfig } = useAdminData();

  // Hero Form State
  const [heroHeading, setHeroHeading] = useState(homepageConfig.hero.heading);
  const [heroAccent, setHeroAccent] = useState(homepageConfig.hero.headingAccent);
  const [heroSubheading, setHeroSubheading] = useState(homepageConfig.hero.subheading);
  const [heroDescription, setHeroDescription] = useState(homepageConfig.hero.description);
  const [heroImage, setHeroImage] = useState<string[]>([homepageConfig.hero.image]);
  const [heroImageAlt, setHeroImageAlt] = useState<string[]>([homepageConfig.hero.imageAlt]);
  const [heroCtaText, setHeroCtaText] = useState(homepageConfig.hero.ctaText);
  const [heroCtaLink, setHeroCtaLink] = useState(homepageConfig.hero.ctaLink);

  // Announcement Bar State
  const [announcementEnabled, setAnnouncementEnabled] = useState(
    homepageConfig.announcementBar.enabled
  );
  const [announcementText, setAnnouncementText] = useState(
    homepageConfig.announcementBar.text
  );
  const [announcementLink, setAnnouncementLink] = useState(
    homepageConfig.announcementBar.link
  );

  // Sections Order & Toggle
  const [sections, setSections] = useState(homepageConfig.sections);

  // The panel mounts before the async hydrate resolves, so re-seed every field when
  // the stored record actually arrives — otherwise the form edits defaults.
  useEffect(() => {
    setHeroHeading(homepageConfig.hero.heading);
    setHeroAccent(homepageConfig.hero.headingAccent);
    setHeroSubheading(homepageConfig.hero.subheading);
    setHeroDescription(homepageConfig.hero.description);
    setHeroImage([homepageConfig.hero.image]);
    setHeroImageAlt([homepageConfig.hero.imageAlt]);
    setHeroCtaText(homepageConfig.hero.ctaText);
    setHeroCtaLink(homepageConfig.hero.ctaLink);
    setAnnouncementEnabled(homepageConfig.announcementBar.enabled);
    setAnnouncementText(homepageConfig.announcementBar.text);
    setAnnouncementLink(homepageConfig.announcementBar.link);
    setSections(homepageConfig.sections);
  }, [homepageConfig]);

  const heroImageValue = heroImage[heroImage.length - 1] ?? "";

  const handleToggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const updated = [...sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= updated.length) return;

    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // re-index order
    const reordered = updated.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(reordered);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateHomepageConfig({
      hero: {
        heading: heroHeading,
        headingAccent: heroAccent,
        subheading: heroSubheading,
        description: heroDescription,
        image: heroImageValue || homepageConfig.hero.image,
        imageAlt: heroImageAlt[heroImageAlt.length - 1] || homepageConfig.hero.imageAlt,
        ctaText: heroCtaText,
        ctaLink: heroCtaLink,
      },
      announcementBar: {
        enabled: announcementEnabled,
        text: announcementText,
        link: announcementLink,
      },
      sections,
    });
  };

  return (
    <form onSubmit={handleSaveAll} className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[3px] text-gold font-semibold">
            {t("admin.homepageCms.eyebrow")}
          </span>
          <h1 className="text-2xl font-serif text-ivory font-bold tracking-tight mt-0.5">
            {t("admin.homepageCms.title")}
          </h1>
          <p className="text-xs text-muted font-sans font-light mt-0.5">
            {t("admin.homepageCms.introBody")}
          </p>
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-gold hover:bg-goldLight text-navy font-bold rounded text-xs font-sans uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{t("admin.homepageCms.saveHomepageCms")}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Editors */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcement Bar Editor */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-gold/15 pb-3">
              <h3 className="font-serif text-base font-bold text-ivory">
                {t("admin.homepageCms.topTickerAnnouncementBar")}
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcementEnabled}
                  onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                  className="rounded border-gold/30 bg-navy text-gold focus:ring-0"
                />
                <span className="text-xs text-gold font-medium">{t("admin.homepageCms.enableTicker")}</span>
              </label>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  {t("admin.homepageCms.announcementMessage")}
                </label>
                <input
                  type="text"
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="COMPLIMENTARY SHIPPING ON ORDERS ABOVE PKR 5,000"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  {t("admin.homepageCms.tickerClickTargetUrl")}
                </label>
                <input
                  type="text"
                  value={announcementLink}
                  onChange={(e) => setAnnouncementLink(e.target.value)}
                  placeholder="/collections"
                  className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                />
              </div>
            </div>
          </div>

          {/* Hero Section Editor */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-3">
              {t("admin.homepageCms.heroSectionBannerConfiguration")}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                    {t("admin.homepageCms.heroEyebrowSubheading")}
                  </label>
                  <input
                    type="text"
                    value={heroSubheading}
                    onChange={(e) => setHeroSubheading(e.target.value)}
                    placeholder="HAUTE PARFUMERIE"
                    className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-gold uppercase tracking-widest focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                    {t("admin.homepageCms.mainHeroTitle")}
                  </label>
                  <input
                    type="text"
                    value={heroHeading}
                    onChange={(e) => setHeroHeading(e.target.value)}
                    placeholder="THE SIGNATURE OF|WHO"
                    className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-serif font-bold focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <p className="text-[11px] font-sans text-muted -mt-2">
                {t("admin.homepageCms.pipeHintPrefix")} <span className="text-gold font-mono">|</span> {t("admin.homepageCms.pipeHintSuffix")}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                    {t("admin.homepageCms.titleAccentGoldItalic")}
                  </label>
                  <input
                    type="text"
                    value={heroAccent}
                    onChange={(e) => setHeroAccent(e.target.value)}
                    placeholder="YOU ARE"
                    className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-goldLight italic font-serif focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                  {t("admin.homepageCms.heroBodyCopy")}
                </label>
                <textarea
                  rows={3}
                  value={heroDescription}
                  onChange={(e) => setHeroDescription(e.target.value)}
                  placeholder="DISCOVER YOUR|SIGNATURE SCENT."
                  className="w-full bg-navy border border-gold/30 rounded p-3 text-xs text-ivory focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-sans text-muted mb-2 uppercase tracking-wider">
                  {t("admin.homepageCms.heroImage")}
                </label>
                <ImageUploader
                  images={heroImage}
                  onChange={(next) => {
                    setHeroImage(next);
                    setHeroImageAlt((alts) => {
                      const nextAlts = next.map((_, i) => alts[i] ?? alts[alts.length - 1] ?? "");
                      return nextAlts.length ? nextAlts : [""];
                    });
                  }}
                  altTexts={heroImageAlt}
                  onAltTextsChange={setHeroImageAlt}
                />
                <p className="text-[11px] font-sans text-muted mt-2">
                  {t("admin.homepageCms.heroImageNote")}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                    {t("admin.homepageCms.buttonCtaText")}
                  </label>
                  <input
                    type="text"
                    value={heroCtaText}
                    onChange={(e) => setHeroCtaText(e.target.value)}
                    placeholder="DISCOVER THE COLLECTION"
                    className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-sans uppercase focus:outline-none focus:border-gold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-sans text-muted mb-1 uppercase tracking-wider">
                    {t("admin.homepageCms.buttonCtaLink")}
                  </label>
                  <input
                    type="text"
                    value={heroCtaLink}
                    onChange={(e) => setHeroCtaLink(e.target.value)}
                    placeholder="/collections"
                    className="w-full bg-navy border border-gold/30 rounded px-3 py-2 text-xs text-ivory font-mono focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section Ordering & Visibility */}
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl">
            <h3 className="font-serif text-base font-bold text-ivory border-b border-gold/15 pb-3">
              {t("admin.homepageCms.homepageLayoutSectionOrdering")}
            </h3>
            <p className="text-xs text-muted font-light">
              {t("admin.homepageCms.toggleVisibilityNote")}
            </p>

            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="flex items-center justify-between p-3 rounded bg-navy border border-gold/15 hover:border-gold/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gold font-bold text-xs">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-serif font-bold text-ivory">
                      {sec.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSection(idx, "up")}
                      className="p-1 rounded text-muted hover:text-gold disabled:opacity-20"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => handleMoveSection(idx, "down")}
                      className="p-1 rounded text-muted hover:text-gold disabled:opacity-20"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleSection(sec.id)}
                      className={`px-3 py-1 rounded text-[10px] font-mono uppercase tracking-wider transition-colors ${
                        sec.enabled
                          ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
                          : "bg-navy text-muted border border-gold/20"
                      }`}
                    >
                      {sec.enabled ? t("admin.homepageCms.visible") : t("admin.homepageCms.hidden")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Simulator */}
        <div className="space-y-6">
          <div className="bg-navy2/90 border border-gold/20 rounded-lg p-6 space-y-4 shadow-xl sticky top-24">
            <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
              <Eye className="w-4 h-4 text-gold" />
              <h3 className="font-serif text-base font-bold text-ivory">
                {t("admin.homepageCms.liveStorefrontSimulator")}
              </h3>
            </div>

            {/* Announcement Bar Preview */}
            {announcementEnabled && (
              <div className="bg-gold text-navy text-[10px] font-sans font-bold tracking-widest text-center py-1.5 px-2 uppercase truncate">
                {announcementText || t("admin.homepageCms.announcementTickerPreview")}
              </div>
            )}

            {/* Hero Card Preview */}
            <div className="relative h-64 rounded border border-gold/30 texture-velvet p-4 flex flex-col justify-end text-center space-y-2 overflow-hidden shadow-inner">
              <span className="text-[9px] font-mono uppercase tracking-[3px] text-gold">
                {heroSubheading}
              </span>
              <h4 className="font-serif text-lg font-bold text-ivory leading-tight">
                {heroHeading.split("|").join(" ")}{" "}
                <span className="text-goldLight italic">{heroAccent}</span>
              </h4>
              <p className="text-[10px] text-muted line-clamp-2">{heroDescription.split("|").join(" ")}</p>
              <div className="pt-2">
                <span className="inline-block px-3 py-1.5 border border-gold text-gold text-[9px] font-mono tracking-widest uppercase rounded">
                  {heroCtaText}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-muted text-center italic">
              {t("admin.homepageCms.previewRealtimeNote")}
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};
