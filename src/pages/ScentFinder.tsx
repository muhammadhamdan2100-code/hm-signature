import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import type { Product } from "../data/products";
import { getCatalogProducts } from "../services/catalog";
import { useCart } from "../context/CartContext";
import { useSeoMeta } from "../hooks/useSeoMeta";
import ProductVisual from "../components/ProductVisual";
import { useCurrency } from "../context/CurrencyContext";
import { useI18n } from "../i18n/I18nProvider";
import {
  FINDER_STEPS,
  STRONG_MATCH_SCORE,
  UNSPECIFIED,
  availabilityLabel,
  defaultFinderAnswers,
  describeAnswers,
  familyOptionsForCatalogue,
  scoreProducts,
  selectRecommendations,
  sizesFor,
  type FinderAnswerKey,
  type FinderAnswers,
  type FinderOption,
  type FinderSize,
  type FinderStep,
  type RankedProduct,
} from "../lib/fragranceMatch";

/** Namespaced session key, in the same shape as the site's `hm-signature-cart` / `hm-signature-recent`. */
const SESSION_KEY = "hm-signature-scent-finder";

type ViewMode = "questions" | "results";
type LoadStatus = "loading" | "ready" | "error";

interface FinderSession {
  version: 1;
  answers: FinderAnswers;
  step: number;
  view: ViewMode;
}

const asString = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim() ? value : fallback;

/** Restore the last consultation. Any drift in shape falls back to a clean start. */
function readSession(): FinderSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<FinderSession>;
    const savedAnswers = (saved.answers || {}) as Partial<FinderAnswers>;
    const answers: FinderAnswers = {
      family: asString(savedAnswers.family, UNSPECIFIED),
      intensity: asString(savedAnswers.intensity, UNSPECIFIED),
      occasion: asString(savedAnswers.occasion, UNSPECIFIED),
      season: asString(savedAnswers.season, UNSPECIFIED),
      leaning: asString(savedAnswers.leaning, UNSPECIFIED),
      intent: asString(savedAnswers.intent, UNSPECIFIED),
      notesText: typeof savedAnswers.notesText === "string" ? savedAnswers.notesText : "",
    };
    const totalSteps = FINDER_STEPS.length;
    const step = Number.isInteger(saved.step) && saved.step! >= 0 && saved.step! < totalSteps ? saved.step! : 0;
    return { version: 1, answers, step, view: saved.view === "results" ? "results" : "questions" };
  } catch {
    return null;
  }
}

function writeSession(session: FinderSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage is unavailable (private mode) — the consultation still works in memory.
  }
}

const capitalise = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

const restore = readSession();

export default function ScentFinder() {
  const { t, language, direction } = useI18n();
  useSeoMeta(
"/scent-finder",
    t("seo.scentFinderTitle"),
    t("seo.scentFinderDescription")
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [attempt, setAttempt] = useState(0);

  const [answers, setAnswers] = useState<FinderAnswers>(restore?.answers ?? defaultFinderAnswers());
  const [step, setStep] = useState(restore?.step ?? 0);
  const [view, setView] = useState<ViewMode>(restore?.view ?? "questions");
  const [refining, setRefining] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    let mounted = true;
    getCatalogProducts()
      .then((list) => {
        if (!mounted) return;
        setProducts(Array.isArray(list) ? list : []);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Scent finder catalog error:", err);
        if (mounted) setStatus("error");
      });
    return () => {
      mounted = false;
    };
  }, [attempt, language.code]);

  useEffect(() => {
    writeSession({ version: 1, answers, step, view });
  }, [answers, step, view]);

  const steps: FinderStep[] = useMemo(() => {
    const familyOptions = familyOptionsForCatalogue(products);
    return FINDER_STEPS.map((s) => (s.key === "family" ? { ...s, options: familyOptions } : s));
  }, [products]);

  const current = steps[Math.min(step, steps.length - 1)];
  const total = steps.length;

  const ranked = useMemo<RankedProduct[]>(
    () => (view === "results" ? scoreProducts(answers, products) : []),
    [view, answers, products]
  );
  const { matches, hasConfidentMatch } = useMemo(() => selectRecommendations(ranked), [ranked]);
  const answerChips = useMemo(() => describeAnswers(answers), [answers]);

  const focusHeading = () => {
    // Move the reader back to the question after any step change.
    window.setTimeout(() => headingRef.current?.focus(), 0);
  };

  const goToStep = (next: number, refine: boolean) => {
    setStep(Math.max(0, Math.min(next, total - 1)));
    setRefining(refine);
    setView("questions");
    focusHeading();
  };

  const setValue = (key: FinderAnswerKey, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const advance = () => {
    if (step < total - 1) {
      setStep(step + 1);
      focusHeading();
    } else {
      setView("results");
      setRefining(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      focusHeading();
    }
  };

  const blankFor = (definition: FinderStep): string => (definition.freeText ? "" : UNSPECIFIED);

  const skip = () => {
    setValue(current.key, blankFor(current));
    advance();
  };

  const clearAnswer = () => {
    setValue(current.key, blankFor(current));
  };

  const back = () => {
    if (refining) {
      setView("results");
      setRefining(false);
      focusHeading();
      return;
    }
    if (step > 0) {
      setStep(step - 1);
      focusHeading();
    }
  };

  const restart = () => {
    setAnswers(defaultFinderAnswers());
    setStep(0);
    setView("questions");
    setRefining(false);
    focusHeading();
  };

  const retry = () => {
    setStatus("loading");
    setAttempt((a) => a + 1);
  };

  const onOptionKeyDown = (event: KeyboardEvent<HTMLDivElement>, optionCount: number) => {
    // In a right-to-left script the arrow that moves forward points the other way.
    const forwardKey = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
    const backKey = direction === "rtl" ? "ArrowRight" : "ArrowLeft";
    const keys = [forwardKey, "ArrowDown", backKey, "ArrowUp"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const active = document.activeElement;
    const index = optionRefs.current.findIndex((el) => el === active);
    if (index < 0) return;
    const forward = event.key === forwardKey || event.key === "ArrowDown";
    const next = (index + (forward ? 1 : -1) + optionCount) % optionCount;
    optionRefs.current[next]?.focus();
  };

  /* ------------------------------------------------------------------ */
  /* Consultation copy                                                   */
  /*                                                                     */
  /* `FINDER_STEPS` and the answer chips are data, so the strings they   */
  /* carry are resolved to a dictionary key here rather than at module   */
  /* scope (where `t` does not exist). Catalogue attribute values — the  */
  /* families, seasons, occasions and intensities a fragrance declares — */
  /* are rendered as declared, exactly as on the product and shop pages. */
  /* ------------------------------------------------------------------ */

  const stepEyebrow = (definition: FinderStep): string => {
    switch (definition.key) {
      case "family":
        return t("scentFinder.stepFamilyEyebrow");
      case "intensity":
        return t("scentFinder.stepIntensityEyebrow");
      case "occasion":
        return t("scentFinder.stepOccasionEyebrow");
      case "season":
        return t("scentFinder.stepSeasonEyebrow");
      case "leaning":
        return t("scentFinder.stepLeaningEyebrow");
      case "intent":
        return t("scentFinder.stepIntentEyebrow");
      case "notesText":
        return t("scentFinder.stepNotesEyebrow");
    }
    return definition.eyebrow;
  };

  const stepQuestion = (definition: FinderStep): string => {
    switch (definition.key) {
      case "family":
        return t("scentFinder.stepFamilyQuestion");
      case "intensity":
        return t("scentFinder.stepIntensityQuestion");
      case "occasion":
        return t("scentFinder.stepOccasionQuestion");
      case "season":
        return t("scentFinder.stepSeasonQuestion");
      case "leaning":
        return t("scentFinder.stepLeaningQuestion");
      case "intent":
        return t("scentFinder.stepIntentQuestion");
      case "notesText":
        return t("scentFinder.stepNotesQuestion");
    }
    return definition.question;
  };

  const stepHelp = (definition: FinderStep): string => {
    switch (definition.key) {
      case "family":
        return t("scentFinder.stepFamilyHelp");
      case "intensity":
        return t("scentFinder.stepIntensityHelp");
      case "occasion":
        return t("scentFinder.stepOccasionHelp");
      case "season":
        return t("scentFinder.stepSeasonHelp");
      case "leaning":
        return t("scentFinder.stepLeaningHelp");
      case "intent":
        return t("scentFinder.stepIntentHelp");
      case "notesText":
        return t("scentFinder.stepNotesHelp");
    }
    return definition.help;
  };

  const stepPlaceholder = (definition: FinderStep): string => {
    if (definition.key === "notesText") return t("scentFinder.stepNotesPlaceholder");
    return definition.placeholder || "";
  };

  const optionLabel = (definition: FinderStep, option: FinderOption): string => {
    if (definition.key === "leaning") {
      if (option.value === "masculine") return t("scentFinder.leaningMasculine");
      if (option.value === "feminine") return t("scentFinder.leaningFeminine");
      if (option.value === "versatile") return t("scentFinder.leaningVersatile");
    }
    if (definition.key === "intent") {
      if (option.value === "self") return t("scentFinder.intentSelf");
      if (option.value === "gift") return t("scentFinder.intentGift");
    }
    return option.label;
  };

  const optionCaption = (definition: FinderStep, option: FinderOption): string | undefined => {
    if (definition.key === "intensity") {
      if (option.value === "Light") return t("scentFinder.captionLight");
      if (option.value === "Moderate") return t("scentFinder.captionModerate");
      if (option.value === "Strong") return t("scentFinder.captionStrong");
      if (option.value === "Enormous") return t("scentFinder.captionEnormous");
    }
    return option.caption;
  };

  /** The shopper's own answer restated on a refine chip. */
  const chipLabel = (chip?: { key: FinderAnswerKey; label: string; specified: boolean }): string => {
    if (!chip?.specified) return t("scentFinder.notSpecified");
    if (chip.key === "leaning") {
      if (answers.leaning === "masculine") return t("scentFinder.leaningMasculine");
      if (answers.leaning === "feminine") return t("scentFinder.leaningFeminine");
      if (answers.leaning === "versatile") return t("scentFinder.chipVersatile");
    }
    if (chip.key === "intent") {
      if (answers.intent === "gift") return t("scentFinder.chipGift");
      if (answers.intent === "self") return t("scentFinder.chipForYourself");
    }
    return chip.label;
  };

  /** Honest result wording, mirroring `resultHeading` in the matching library. */
  const resultHeadingText = (count: number): string => {
    if (answers.intent === "gift") {
      return count === 1 ? t("scentFinder.resultOneGift") : t("scentFinder.resultGifts", { count });
    }
    return count === 1 ? t("scentFinder.resultOneScent") : t("scentFinder.resultScents", { count });
  };

  const answeredCount = answerChips.filter((chip) => chip.specified).length;
  const answeredLabels = answerChips.filter((chip) => chip.specified).map((chip) => chipLabel(chip)).join(", ");
  const progressLabel =
    view === "results"
      ? t("scentFinder.progressComplete")
      : t("scentFinder.progressAnswered", { percent: Math.round((answeredCount / total) * 100) });

  return (
    <div className="pt-24 min-h-screen bg-navy relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-70 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 20%, rgba(16,40,61,0.8), transparent 60%)" }}
      />

      <div className="max-w-[980px] mx-auto px-5 sm:px-6 lg:px-10 py-16 lg:py-20 relative">
        <header className="text-center mb-12 lg:mb-16">
          <div className="eyebrow mb-4">{t("scentFinder.eyebrow")}</div>
          <h1 className="font-serif text-4xl lg:text-6xl leading-tight">
            {t("scentFinder.titleLine1")}
            <br />
            <span className="italic text-goldLight">{t("scentFinder.titleLine2")}</span>
          </h1>
          <p className="text-muted mt-6 text-sm leading-relaxed max-w-md mx-auto">
            {t("scentFinder.intro")}
          </p>
        </header>

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs font-mono uppercase tracking-[2px] text-gold">{t("scentFinder.loading")}</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center border border-gold/25 bg-navy2/40 px-6 py-12">
            <h2 className="font-serif text-2xl mb-3">{t("scentFinder.errorTitle")}</h2>
            <p className="text-muted text-sm leading-relaxed mb-7 max-w-sm mx-auto">
              {t("scentFinder.errorBody")}
            </p>
            <button onClick={retry} className="btn-gold-fill inline-flex items-center gap-2">
              <RotateCcw size={14} /> {t("scentFinder.tryAgain")}
            </button>
          </div>
        )}

        {status === "ready" && products.length === 0 && (
          <div className="text-center border border-gold/25 bg-navy2/40 px-6 py-14">
            <h2 className="font-serif text-2xl lg:text-3xl mb-3">{t("scentFinder.emptyTitle")}</h2>
            <p className="text-muted text-sm leading-relaxed mb-7 max-w-md mx-auto">
              {t("scentFinder.emptyBody")}
            </p>
            <Link to="/" className="btn-gold">{t("common.returnHome")}</Link>
          </div>
        )}

        {status === "ready" && products.length > 0 && view === "questions" && (
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] tracking-[1.5px] text-muted font-mono">
                {t("scentFinder.questionCounter", { current: step + 1, total })}
              </span>
              <span className="text-[11px] tracking-[1.5px] text-muted font-mono">
                {refining ? t("scentFinder.refining") : t("scentFinder.eyebrow")}
              </span>
            </div>

            <div className="flex gap-2 mb-10" aria-hidden="true">
              {steps.map((s, i) => (
                <div key={s.key} className={`h-[2px] flex-1 ${i <= step ? "bg-gold" : "bg-gold/20"}`} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.key}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="text-center"
              >
                <div className="eyebrow mb-3">{stepEyebrow(current)}</div>
                <h2
                  ref={headingRef}
                  tabIndex={-1}
                  id={`step-${current.key}`}
                  className="font-serif text-2xl lg:text-3xl leading-snug mb-3 focus:outline-none"
                >
                  {stepQuestion(current)}
                </h2>
                <p id={`step-help-${current.key}`} className="text-muted text-xs leading-relaxed mb-9 max-w-md mx-auto">
                  {stepHelp(current)}
                </p>

                {current.freeText ? (
                  <div className="text-start">
                    <label htmlFor="notes-text" className="block text-[11px] tracking-[1.5px] text-goldLight mb-3">
                      {t("scentFinder.notesFieldLabel")}
                    </label>
                    <textarea
                      id="notes-text"
                      rows={3}
                      value={answers.notesText}
                      onChange={(e) => setValue("notesText", e.target.value)}
                      placeholder={stepPlaceholder(current)}
                      aria-describedby={`step-help-${current.key}`}
                      className="w-full bg-transparent border border-gold/25 rounded-sm px-4 py-3 text-sm text-ivory placeholder:text-muted/60 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50 leading-relaxed"
                    />
                  </div>
                ) : (
                  <div
                    role="group"
                    aria-labelledby={`step-${current.key}`}
                    aria-describedby={`step-help-${current.key}`}
                    onKeyDown={(e) => onOptionKeyDown(e, (current.options || []).length)}
                    className="grid gap-3 sm:grid-cols-2 text-start"
                  >
                    {(current.options || []).map((option, i) => {
                      const selected = answers[current.key] === option.value;
                      const caption = optionCaption(current, option);
                      return (
                        <button
                          key={option.value}
                          type="button"
                          ref={(el) => {
                            optionRefs.current[i] = el;
                          }}
                          aria-pressed={selected}
                          onClick={() => setValue(current.key, option.value)}
                          className={`min-h-[56px] w-full px-5 py-3 border transition-colors text-start flex items-start justify-between gap-3 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/60 ${
                            selected
                              ? "border-gold bg-gold/10 text-ivory"
                              : "border-gold/25 hover:border-gold/70 hover:bg-gold/5 text-ivory/90"
                          }`}
                        >
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm break-words">{optionLabel(current, option)}</span>
                            {caption && (
                              <span className="block text-[11px] text-muted mt-1 leading-relaxed">
                                {caption}
                              </span>
                            )}
                          </span>
                          {selected && <Check size={14} className="text-gold shrink-0 mt-1" aria-hidden="true" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-10">
                  {(step > 0 || refining) && (
                    <button
                      onClick={back}
                      className="btn-gold inline-flex items-center justify-center gap-2 min-h-[48px] text-[11px]"
                    >
                      <ArrowLeft size={14} aria-hidden="true" className="rtl:rotate-180" />
                      {refining ? t("scentFinder.backToMatches") : t("scentFinder.backButton")}
                    </button>
                  )}
                  {current.skippable && (
                    <button
                      onClick={refining ? clearAnswer : skip}
                      className="link-underline text-[11px] sm:ms-auto py-3 min-h-[44px]"
                    >
                      {refining ? t("scentFinder.clearThisAnswer") : t("scentFinder.notSureYet")}
                    </button>
                  )}
                  <button
                    onClick={advance}
                    className="btn-gold-fill inline-flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    {refining
                      ? t("scentFinder.updateMatches")
                      : step === total - 1
                        ? t("scentFinder.seeMyMatches")
                        : t("scentFinder.continueButton")}
                    <ArrowRight size={14} aria-hidden="true" className="rtl:rotate-180" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>

            <p className="text-center text-muted text-[11px] mt-14 leading-relaxed">
              {t("scentFinder.deviceNote")}{" "}
              <button onClick={restart} className="link-underline text-[11px] py-1">
                {t("scentFinder.startAgain")}
              </button>
            </p>
          </div>
        )}

        {status === "ready" && products.length > 0 && view === "results" && (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex gap-2 mb-8" aria-hidden="true">
              {steps.map((s) => (
                <div key={s.key} className="h-[2px] flex-1 bg-gold" />
              ))}
            </div>

            <div className="text-center mb-10">
              <div className="eyebrow mb-3">
                {hasConfidentMatch ? t("scentFinder.shortlistEyebrow") : t("scentFinder.noMatchesEyebrow")}
              </div>
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="font-serif text-3xl lg:text-5xl leading-tight focus:outline-none"
              >
                {hasConfidentMatch ? resultHeadingText(matches.length) : t("scentFinder.noMatchesTitle")}
              </h2>
              <p className="text-muted text-sm leading-relaxed mt-5 max-w-lg mx-auto">
                {hasConfidentMatch
                  ? t("scentFinder.resultsBody", { answers: answeredLabels })
                  : t("scentFinder.noMatchesBody", { count: products.length })}
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {steps.map((s, i) => {
                const chip = answerChips.find((c) => c.key === s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => goToStep(i, true)}
                    className={`min-h-[44px] px-4 py-2 border text-[11px] tracking-[1px] transition-colors focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/60 ${
                      chip?.specified
                        ? "border-gold/40 text-ivory hover:border-gold hover:bg-gold/5"
                        : "border-gold/15 text-muted hover:border-gold/50"
                    }`}
                  >
                    {capitalise(chipLabel(chip))}
                    <span className="text-gold ms-2">{t("scentFinder.change")}</span>
                  </button>
                );
              })}
            </div>

            {hasConfidentMatch ? (
              <div className={matches.length === 1 ? "grid gap-6 lg:gap-8 mx-auto max-w-[520px]" : "grid gap-6 md:grid-cols-2 lg:gap-8"}>
                {matches.map((item, i) => (
                  <ResultCard
                    key={item.product.id}
                    item={item}
                    rank={i}
                    strong={i === 0 && item.score >= STRONG_MATCH_SCORE}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center border border-gold/25 bg-navy2/40 px-6 py-12">
                <p className="text-muted text-sm leading-relaxed mb-7 max-w-sm mx-auto">
                  {t("scentFinder.loosenBody")}
                </p>
                <Link to="/collections" className="btn-gold-fill">{t("scentFinder.browseCollection")}</Link>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 mt-14 pt-8 border-t border-gold/15">
              <Link to="/collections" className="link-underline py-2 min-h-[44px]">{t("scentFinder.viewAllFragrances")}</Link>
              <button
                onClick={() => goToStep(0, true)}
                className="link-underline py-2 min-h-[44px]"
              >
                {t("scentFinder.refineFromFirst")}
              </button>
              <button onClick={restart} className="link-underline py-2 min-h-[44px]">
                {t("scentFinder.startAgain")}
              </button>
            </div>

            <p className="text-center text-muted text-[11px] mt-8 leading-relaxed max-w-md mx-auto">
              {t("scentFinder.whyQuotedNote")}
            </p>
          </motion.section>
        )}

        <span className="sr-only" aria-live="polite">
          {view === "results"
            ? hasConfidentMatch
              ? matches.length === 1
                ? t("scentFinder.liveMatchesOne", { count: matches.length })
                : t("scentFinder.liveMatchesMany", { count: matches.length })
              : t("scentFinder.liveNoMatch")
            : t("scentFinder.liveQuestion", {
                current: step + 1,
                total,
                question: stepQuestion(current),
                progress: progressLabel,
              })}
        </span>
      </div>
    </div>
  );
}

function ResultCard({ item, rank, strong }: { item: RankedProduct; rank: number; strong: boolean }) {
  const { t } = useI18n();
  const { format } = useCurrency();
  const { product, reasons } = item;
  const { addToCart } = useCart();
  const sizes = useMemo(() => sizesFor(product), [product]);
  const [sizeIndex, setSizeIndex] = useState(() => {
    const available = sizes.findIndex((s) => s.stock > 0);
    const preferred = sizes.findIndex((s) => s.size.toLowerCase() === "50ml" && s.stock > 0);
    return preferred >= 0 ? preferred : available >= 0 ? available : 0;
  });

  const safeIndex = Math.min(sizeIndex, Math.max(sizes.length - 1, 0));
  const size = sizes[safeIndex];
  const availability = availabilityLabel(size);
  /** Same thresholds the matching library reports, worded in the active language. */
  const availabilityText = (option: FinderSize): string => {
    if (option.stock <= 0) return t("product.availabilityOutOfStock");
    if (option.stock <= (option.lowStockThreshold ?? 5)) {
      return t("product.availabilityOnlyLeft", { count: option.stock });
    }
    return t("scentFinder.inStock");
  };
  const pyramid = [
    { labelKey: "product.topNotes", items: product.topNotes || [] },
    { labelKey: "product.heartNotes", items: product.heartNotes || [] },
    { labelKey: "product.baseNotes", items: product.baseNotes || [] },
  ].filter((group) => group.items.length > 0);
  const sparseData = !product.seasons?.length && !product.occasions?.length && !product.intensity;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: rank * 0.06 }}
      className="flex flex-col border border-gold/25 bg-navy2/40"
    >
      <ProductVisual product={product} photoIndex={0} className="aspect-[4/3]" bottleSize="w-24" />

      <div className="p-5 sm:p-6 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="eyebrow break-words">{product.fragranceFamily || product.category}</div>
          {strong && (
            <span className="text-[10px] tracking-[1.5px] text-gold border border-gold/40 px-2 py-1 shrink-0">
              {t("scentFinder.closest")}
            </span>
          )}
        </div>

        <h3 className="font-serif text-2xl mb-2 break-words">{product.name}</h3>
        <p className="text-muted text-sm leading-relaxed mb-5 line-clamp-3">
          {product.shortDescription || product.description}
        </p>

        <div className="mb-5">
          <div className="text-[11px] tracking-[1.5px] text-goldLight mb-3">{t("scentFinder.whyMatched")}</div>
          <ul className="space-y-2 text-sm text-ivory/90">
            {reasons.map((reason) => (
              <li key={reason} className="flex gap-2 leading-relaxed">
                <span className="text-gold shrink-0" aria-hidden="true">
                  ·
                </span>
                <span className="min-w-0 break-words">{reason}</span>
              </li>
            ))}
          </ul>
          {sparseData && (
            <p className="text-muted text-[11px] mt-3 leading-relaxed">
              {t("scentFinder.sparseNote")}
            </p>
          )}
        </div>

        {pyramid.length > 0 && (
          <div className="mb-6 pt-5 border-t border-gold/15">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {pyramid.map((group) => (
                <div key={group.labelKey}>
                  <div className="text-[10px] text-muted tracking-[1.5px] mb-2">{t(group.labelKey)}</div>
                  {group.items.slice(0, 4).map((note) => (
                    <div key={note} className="text-ivory/90 mb-0.5 break-words">
                      {note}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto">
          <div className="text-[11px] tracking-[1.5px] text-goldLight mb-3">{t("scentFinder.availableSizes")}</div>
          <div
            role="group"
            aria-label={t("scentFinder.sizesAria", { name: product.name })}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4"
          >
            {sizes.map((option, i) => {
              const selected = i === safeIndex;
              const state = availabilityLabel(option);
              return (
                <button
                  key={`${option.size}-${i}`}
                  type="button"
                  onClick={() => setSizeIndex(i)}
                  aria-pressed={selected}
                  className={`min-h-[44px] px-2 py-2 border text-center transition-colors focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/60 flex flex-col items-center justify-center ${
                    selected
                      ? "border-gold bg-gold/10 text-ivory"
                      : "border-gold/20 text-muted hover:border-gold/60 hover:text-ivory"
                  } ${state.available ? "" : "opacity-50"}`}
                >
                  <span className="text-[11px] font-mono tracking-wider">{option.size}</span>
                  <span className="text-[10px] font-mono text-goldLight">{format(option.price)}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 mb-4 text-[11px] font-mono tracking-wider">
            <span className={availability.available ? "text-goldLight" : "text-muted"}>
              {availabilityText(size)}
            </span>
            <span className="text-gold font-bold text-sm">{format(size.price)}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={!availability.available}
              onClick={() => addToCart(product, size.size, 1, size.price, size.sku)}
              className="btn-gold-fill flex-1 text-center min-h-[48px] disabled:opacity-40"
            >
              {t("product.addToBagSize", { size: size.size })}
            </button>
            <Link to={`/product/${product.slug}`} className="btn-gold flex-1 text-center min-h-[48px]">
              {t("product.viewDetails")}
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
