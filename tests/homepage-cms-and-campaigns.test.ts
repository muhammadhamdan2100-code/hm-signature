import { describe, expect, it } from "vitest";
import {
  DEFAULT_HOMEPAGE_CONFIG,
  withHomepageDefaults,
  campaignDisplayState,
  type HomepageConfig,
} from "../src/admin/context/AdminDataContext";

/**
 * Phase 3 rules that decide what the storefront shows, independent of the network:
 * a partially-saved CMS record must still render a complete homepage, and a campaign
 * may only be presented as a live offer inside its own date window.
 *
 *     npx vitest run tests/homepage-cms-and-campaigns.test.ts
 */

// The blocks Home.tsx can actually render. A CMS section id outside this list is
// ignored, and a block missing from a stored record comes back enabled.
const STOREFRONT_BLOCKS = [
  "hero",
  "collections",
  "values",
  "story",
  "spotlight",
  "journal",
  "reviews",
  "newsletter",
];

describe("homepage CMS record", () => {
  it("falls back to the shipped defaults when nothing is stored", () => {
    expect(withHomepageDefaults(null)).toBe(DEFAULT_HOMEPAGE_CONFIG);
    expect(withHomepageDefaults(undefined).hero.heading).toBe(DEFAULT_HOMEPAGE_CONFIG.hero.heading);
  });

  it("fills fields a saved record predates so the hero never renders empty", () => {
    const legacy = {
      hero: { heading: "THE SIGNATURE OF|WHO", subheading: "HAUTE PARFUMERIE" },
      announcementBar: { enabled: true, text: "STORED TICKER" },
    } as unknown as Partial<HomepageConfig>;

    const merged = withHomepageDefaults(legacy);
    expect(merged.hero.headingAccent).toBe(DEFAULT_HOMEPAGE_CONFIG.hero.headingAccent);
    expect(merged.hero.image).toBe(DEFAULT_HOMEPAGE_CONFIG.hero.image);
    expect(merged.hero.imageAlt).toBe(DEFAULT_HOMEPAGE_CONFIG.hero.imageAlt);
    expect(merged.hero.ctaLink).toBe(DEFAULT_HOMEPAGE_CONFIG.hero.ctaLink);
    expect(merged.announcementBar).toEqual({
      enabled: true,
      text: "STORED TICKER",
      link: DEFAULT_HOMEPAGE_CONFIG.announcementBar.link,
    });
  });

  it("keeps every storefront block that a stale record does not mention", () => {
    const stale = {
      hero: DEFAULT_HOMEPAGE_CONFIG.hero,
      announcementBar: DEFAULT_HOMEPAGE_CONFIG.announcementBar,
      sections: [
        { id: "hero", name: "Hero Banner", enabled: true, order: 1 },
        { id: "bestsellers", name: "Bestsellers Carousel", enabled: true, order: 2 },
      ],
    } satisfies HomepageConfig;

    const merged = withHomepageDefaults(stale);
    const ids = merged.sections.map((s) => s.id);
    // The removed "bestsellers" id cannot delete a block, and the untouched blocks
    // are re-added rather than vanishing from the homepage.
    expect(ids).not.toContain("bestsellers");
    expect([...STOREFRONT_BLOCKS].sort()).toEqual([...ids].sort());
    expect(merged.sections.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("honours a stored hide flag and a stored reorder", () => {
    const stored = structuredClone(DEFAULT_HOMEPAGE_CONFIG);
    const journal = stored.sections.find((s) => s.id === "journal")!;
    journal.enabled = false;
    journal.order = 1;
    stored.sections
      .filter((s) => s.id !== "journal")
      .forEach((s, index) => (s.order = index + 2));

    const merged = withHomepageDefaults(stored);
    expect(merged.sections[0]).toMatchObject({ id: "journal", enabled: false, order: 1 });
    const visible = merged.sections.filter((s) => s.enabled).map((s) => s.id);
    expect(visible).not.toContain("journal");
    expect(visible.length).toBe(STOREFRONT_BLOCKS.length - 1);
  });

  it("ships defaults that match the blocks the homepage renders", () => {
    expect(DEFAULT_HOMEPAGE_CONFIG.sections.map((s) => s.id)).toEqual(STOREFRONT_BLOCKS);
    expect(DEFAULT_HOMEPAGE_CONFIG.sections.every((s) => s.enabled)).toBe(true);
    // The announcement bar is a promise about the store, so it starts switched off
    // rather than pre-filled with an unverified offer.
    expect(DEFAULT_HOMEPAGE_CONFIG.announcementBar.enabled).toBe(false);
    expect(DEFAULT_HOMEPAGE_CONFIG.announcementBar.text).toBe("");
  });
});

describe("campaign presentation window", () => {
  const today = new Date("2026-10-15T09:00:00.000Z");
  const shape = { discountPercentage: 10, bannerImage: "texture-wood", targetProducts: [] };

  it("never presents a draft or a completed plan as an offer", () => {
    expect(campaignDisplayState({ ...shape, status: "Draft", startDate: "2026-10-01", endDate: "2026-10-20" }, today))
      .toEqual({ label: "Draft", live: false });
    expect(campaignDisplayState({ ...shape, status: "Completed", startDate: "2026-10-01", endDate: "2026-10-20" }, today))
      .toEqual({ label: "Completed", live: false });
    expect(campaignDisplayState({ ...shape, status: "Cancelled", startDate: "2026-10-01", endDate: "2026-10-20" }, today))
      .toEqual({ label: "Cancelled", live: false });
  });

  it("holds a scheduled campaign back until its start date", () => {
    expect(campaignDisplayState({ ...shape, status: "Scheduled", startDate: "2026-11-01", endDate: "2026-11-11" }, today))
      .toEqual({ label: "Scheduled", live: false });
    expect(campaignDisplayState({ ...shape, status: "Scheduled", startDate: "2026-10-10", endDate: "2026-10-20" }, today).live)
      .toBe(true);
  });

  it("reports a window that has closed as Expired even while marked Sending", () => {
    expect(campaignDisplayState({ ...shape, status: "Sending", startDate: "2026-10-01", endDate: "2026-10-14" }, today))
      .toEqual({ label: "Expired", live: false });
  });

  it("shows the live discount only inside the window", () => {
    expect(campaignDisplayState({ ...shape, status: "Sending", startDate: "2026-10-10", endDate: "2026-10-20" }, today))
      .toEqual({ label: "Active", live: true });
    // An open-ended plan has no expiry to breach.
    expect(campaignDisplayState({ ...shape, status: "Sending", startDate: "2026-10-01", endDate: "" }, today).live)
      .toBe(true);
  });
});
