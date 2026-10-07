# HM Signature — Complete English Master Content

Extracted verbatim from the project by `scripts/build-master-inventory.mjs`. English is the master
source: nothing here has been rewritten, shortened or paraphrased. `[REVIEW POSSIBLE]` marks an entry
whose wording or wiring a human should check before translating it blindly.

- Translation keys in the English dictionary: **2615**
- Keys referenced from source by a literal `t("…")` / `labelKey` / `titleKey`: **2484**
- Customer-facing routes: **32** · admin routes: **30**
- Supported languages to translate into: en, ar, ur, fr, es, de (`en, ar, fr, es, ur, de`)

## Route inventory

| Route | Screen |
| --- | --- |
| `/login` | Login |
| `/admin/login` | AdminLogin |
| `/admin/*` | AdminApp |
| `/` | Home |
| `/collections` | Collections |
| `/bestsellers` | Bestsellers |
| `/men` | Men |
| `/women` | Women |
| `/product/:slug` | ProductPage |
| `/cart` | Cart |
| `/checkout` | Checkout |
| `/order-confirmation/:orderId` | OrderConfirmation |
| `/scent-finder` | ScentFinder |
| `/journal` | Journal |
| `/wishlist` | Wishlist |
| `/account` | Account |
| `/account/orders` | Account |
| `/account/orders/:id` | Account |
| `/account/profile` | Account |
| `/account/addresses` | Account |
| `/account/wishlist` | Account |
| `/contact` | Contact |
| `/ingredients` | Ingredients |
| `/faq` | FAQ |
| `/shipping-delivery` | ShippingDelivery |
| `/returns-exchanges` | ReturnsExchanges |
| `/track-order` | TrackOrder |
| `/privacy-policy` | PrivacyPolicy |
| `/terms-conditions` | TermsConditions |
| `/refund-policy` | RefundPolicy |
| `/parent-company` | ParentCompany |
| `*` | NotFound |

### Admin routes

| Route | Screen |
| --- | --- |
| `login` | AdminLogin |
| `dashboard` | AdminDashboard |
| `products` | ProductsList |
| `products/new` | ProductFormPage |
| `products/:id` | ProductFormPage |
| `categories` | CategoriesPage |
| `collections` | CollectionsPage |
| `orders` | OrdersList |
| `orders/:id` | OrderDetailPage |
| `customers` | CustomersList |
| `customers/:id` | CustomerDetailPage |
| `inventory` | InventoryPage |
| `coupons` | CouponsPage |
| `shipping` | ShippingPage |
| `reviews` | ReviewsPage |
| `payments` | PaymentsPage |
| `payments/refunds` | RefundsPage |
| `payments/reconciliation` | ReconciliationPage |
| `homepage` | HomepageCmsPage |
| `marketing` | MarketingPage |
| `notifications` | NotificationsPage |
| `abandoned-carts` | AbandonedCartsPage |
| `automations` | AutomationsPage |
| `staff` | StaffPage |
| `settings` | SettingsPage |
| `international` | InternationalPage |
| `localization` | LocalizationPage |
| `seo` | SeoPage |
| `analytics` | AnalyticsPage |
| `*` | Navigate |

## Homepage

_64 string(s)_

```
KEY: home.collectionsEyebrow
EXACT ENGLISH: OUR COLLECTIONS
CONTEXT: Homepage — collections eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/Collections.tsx, src/pages/Home.tsx
NOTES: —
```

```
KEY: home.collectionsTitle
EXACT ENGLISH: Scented Stories
CONTEXT: Homepage — collections title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Collections.tsx, src/pages/Home.tsx
NOTES: —
```

```
KEY: home.collectionsBody
EXACT ENGLISH: Discover fragrances crafted to express different personalities, moods and moments.
CONTEXT: Homepage — collections body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Collections.tsx, src/pages/Home.tsx
NOTES: —
```

```
KEY: home.viewAllCollections
EXACT ENGLISH: VIEW ALL COLLECTIONS →
CONTEXT: Homepage — view all collections
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Home.tsx
NOTES: —
```

```
KEY: home.collectionsEmptyTitle
EXACT ENGLISH: A new collection is being composed
CONTEXT: Homepage — collections empty title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Home.tsx
NOTES: —
```

```
KEY: home.collectionsEmptyBody
EXACT ENGLISH: Our published fragrances will appear here. In the meantime, our Scent Finder can still guide you to the family that suits you.
CONTEXT: Homepage — collections empty body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Home.tsx
NOTES: —
```

```
KEY: home.collectionsEmptyCta
EXACT ENGLISH: FIND YOUR SCENT
CONTEXT: Homepage — collections empty cta
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/components/ShopPage.tsx, src/pages/Home.tsx
NOTES: —
```

```
KEY: home.heroDiscoverCta
EXACT ENGLISH: DISCOVER HM SIGNATURE
CONTEXT: Homepage — hero discover cta
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/components/Hero.tsx
NOTES: —
```

```
KEY: home.heroEyebrow
EXACT ENGLISH: HAUTE PARFUMERIE
CONTEXT: Homepage — hero eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.heroHeading
EXACT ENGLISH: THE SIGNATURE OF|WHO
CONTEXT: Homepage — hero heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · contains "|" = deliberate line break in the design · [REVIEW POSSIBLE]
```

```
KEY: home.heroHeadingAccent
EXACT ENGLISH: YOU ARE
CONTEXT: Homepage — hero heading accent
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.heroDescription
EXACT ENGLISH: DISCOVER YOUR|SIGNATURE SCENT.
CONTEXT: Homepage — hero description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · contains "|" = deliberate line break in the design · [REVIEW POSSIBLE]
```

```
KEY: home.heroCta
EXACT ENGLISH: SHOP NOW →
CONTEXT: Homepage — hero cta
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.heroImageAlt
EXACT ENGLISH: HM Signature — Mystic Oud
CONTEXT: Homepage — hero image alt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.valueLuxuryIngredients
EXACT ENGLISH: LUXURY INGREDIENTS
CONTEXT: Homepage — value luxury ingredients
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ValuesSection.tsx
NOTES: —
```

```
KEY: home.valueLuxuryIngredientsBody
EXACT ENGLISH: Rare raw materials from established suppliers
CONTEXT: Homepage — value luxury ingredients body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.valueExtraitConcentration
EXACT ENGLISH: EXTRAIT CONCENTRATION
CONTEXT: Homepage — value extrait concentration
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ValuesSection.tsx
NOTES: —
```

```
KEY: home.valueExtraitConcentrationBody
EXACT ENGLISH: A higher aromatic concentration than eau de parfum
CONTEXT: Homepage — value extrait concentration body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.valueSignatureScents
EXACT ENGLISH: SIGNATURE SCENTS
CONTEXT: Homepage — value signature scents
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ValuesSection.tsx
NOTES: —
```

```
KEY: home.valueSignatureScentsBody
EXACT ENGLISH: Blends created for HM Signature
CONTEXT: Homepage — value signature scents body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.valueElegantPackaging
EXACT ENGLISH: ELEGANT PACKAGING
CONTEXT: Homepage — value elegant packaging
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ValuesSection.tsx
NOTES: —
```

```
KEY: home.valueElegantPackagingBody
EXACT ENGLISH: Designed to reflect luxury and style
CONTEXT: Homepage — value elegant packaging body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.valueIngredientTransparency
EXACT ENGLISH: INGREDIENT TRANSPARENCY
CONTEXT: Homepage — value ingredient transparency
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ValuesSection.tsx
NOTES: —
```

```
KEY: home.valueIngredientTransparencyBody
EXACT ENGLISH: Ingredient listings published on product pages
CONTEXT: Homepage — value ingredient transparency body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.brandStoryEyebrow
EXACT ENGLISH: OUR HERITAGE
CONTEXT: Homepage — brand story eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/components/BrandStory.tsx
NOTES: —
```

```
KEY: home.brandStoryTitleLine1
EXACT ENGLISH: The Art of
CONTEXT: Homepage — brand story title line1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/BrandStory.tsx
NOTES: —
```

```
KEY: home.brandStoryTitleLine2
EXACT ENGLISH: Fine Fragrances
CONTEXT: Homepage — brand story title line2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/BrandStory.tsx
NOTES: —
```

```
KEY: home.brandStoryBody1
EXACT ENGLISH: At HM Signature, fragrance is more than a scent — it is an expression of elegance, personality and individuality.
CONTEXT: Homepage — brand story body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/BrandStory.tsx
NOTES: —
```

```
KEY: home.brandStoryBody2
EXACT ENGLISH: Each fragrance is carefully crafted using premium ingredients and refined craftsmanship, blended by experts who treat every bottle as a work of art.
CONTEXT: Homepage — brand story body2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/BrandStory.tsx
NOTES: —
```

```
KEY: home.brandStoryCta
EXACT ENGLISH: DISCOVER OUR STORY →
CONTEXT: Homepage — brand story cta
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/components/BrandStory.tsx
NOTES: —
```

```
KEY: home.featuredTitleLine1
EXACT ENGLISH: THE SIGNATURE
CONTEXT: Homepage — featured title line1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/FeaturedProduct.tsx
NOTES: —
```

```
KEY: home.featuredTitleLine2
EXACT ENGLISH: COLLECTION
CONTEXT: Homepage — featured title line2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/FeaturedProduct.tsx
NOTES: —
```

```
KEY: home.featuredBody
EXACT ENGLISH: A fragrance created to make an unforgettable impression — for the moments that deserve one.
CONTEXT: Homepage — featured body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/FeaturedProduct.tsx
NOTES: —
```

```
KEY: home.featuredShopNow
EXACT ENGLISH: SHOP NOW →
CONTEXT: Homepage — featured shop now
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/FeaturedProduct.tsx
NOTES: —
```

```
KEY: home.journalEyebrow
EXACT ENGLISH: THE HM JOURNAL
CONTEXT: Homepage — journal eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/components/JournalSection.tsx, src/pages/Journal.tsx
NOTES: —
```

```
KEY: home.journalSectionTitle
EXACT ENGLISH: Stories Worth Reading
CONTEXT: Homepage — journal section title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/JournalSection.tsx
NOTES: —
```

```
KEY: home.journalArticle1Title
EXACT ENGLISH: The Art of Perfumery
CONTEXT: Homepage — journal article1 title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/JournalSection.tsx
NOTES: —
```

```
KEY: home.journalArticle1Excerpt
EXACT ENGLISH: Understanding the craft behind fine fragrance.
CONTEXT: Homepage — journal article1 excerpt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/JournalSection.tsx
NOTES: —
```

```
KEY: home.journalArticle2Title
EXACT ENGLISH: The Language of Oud
CONTEXT: Homepage — journal article2 title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/JournalSection.tsx
NOTES: —
```

```
KEY: home.journalArticle2Excerpt
EXACT ENGLISH: Discover the story behind one of perfumery's most iconic ingredients.
CONTEXT: Homepage — journal article2 excerpt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/JournalSection.tsx
NOTES: —
```

```
KEY: home.journalArticle3Title
EXACT ENGLISH: How to Choose Your Signature Scent
CONTEXT: Homepage — journal article3 title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/JournalSection.tsx
NOTES: —
```

```
KEY: home.journalArticle3Excerpt
EXACT ENGLISH: A guide to choosing your perfect fragrance.
CONTEXT: Homepage — journal article3 excerpt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/JournalSection.tsx
NOTES: —
```

```
KEY: home.journalArticle4Title
EXACT ENGLISH: Fragrance & Personality
CONTEXT: Homepage — journal article4 title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/JournalSection.tsx
NOTES: —
```

```
KEY: home.journalArticle4Excerpt
EXACT ENGLISH: What your scent choice says about you.
CONTEXT: Homepage — journal article4 excerpt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/JournalSection.tsx
NOTES: —
```

```
KEY: home.reviewsEyebrowAtelier
EXACT ENGLISH: FROM THE ATELIER
CONTEXT: Homepage — reviews eyebrow atelier
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/components/Reviews.tsx
NOTES: —
```

```
KEY: home.reviewsEyebrowStories
EXACT ENGLISH: CUSTOMER STORIES
CONTEXT: Homepage — reviews eyebrow stories
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/components/Reviews.tsx
NOTES: —
```

```
KEY: home.reviewsTitleAtelier
EXACT ENGLISH: House Notes
CONTEXT: Homepage — reviews title atelier
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/Reviews.tsx
NOTES: —
```

```
KEY: home.reviewsTitleStories
EXACT ENGLISH: The HM Experience
CONTEXT: Homepage — reviews title stories
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/Reviews.tsx
NOTES: —
```

```
KEY: home.reviewsEditorialLabel
EXACT ENGLISH: EDITORIAL
CONTEXT: Homepage — reviews editorial label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/components/Reviews.tsx
NOTES: —
```

```
KEY: home.reviewsStarsAria
EXACT ENGLISH: {rating} out of 5 stars
CONTEXT: Homepage — reviews stars aria
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/components/Reviews.tsx
NOTES: interpolation: {rating}
```

```
KEY: home.reviewsVerifiedPurchase
EXACT ENGLISH: Verified Purchase
CONTEXT: Homepage — reviews verified purchase
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Reviews.tsx
NOTES: —
```

```
KEY: home.reviewsOnProduct
EXACT ENGLISH: on {product}
CONTEXT: Homepage — reviews on product
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Reviews.tsx
NOTES: interpolation: {product}
```

```
KEY: home.houseNote1Title
EXACT ENGLISH: On Opening
CONTEXT: Homepage — house note1 title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/Reviews.tsx
NOTES: —
```

```
KEY: home.houseNote1Body
EXACT ENGLISH: We write about a fragrance as it behaves on skin: how it unfolds in the first minutes, and how the top notes give way rather than simply disappearing.
CONTEXT: Homepage — house note1 body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.houseNote2Title
EXACT ENGLISH: On Heart and Drydown
CONTEXT: Homepage — house note2 title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/Reviews.tsx
NOTES: —
```

```
KEY: home.houseNote2Body
EXACT ENGLISH: The same scent reads differently from person to person, so our notes follow the heart as it settles and the drydown that remains hours later.
CONTEXT: Homepage — house note2 body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.houseNote3Title
EXACT ENGLISH: On Wearing
CONTEXT: Homepage — house note3 title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/Reviews.tsx
NOTES: —
```

```
KEY: home.houseNote3Body
EXACT ENGLISH: Two sprays at the pulse points are enough. A fragrance is meant to be discovered at a distance, not announced across a room.
CONTEXT: Homepage — house note3 body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: home.newsletterTitle
EXACT ENGLISH: Enter the World of HM
CONTEXT: Homepage — newsletter title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/Newsletter.tsx
NOTES: —
```

```
KEY: home.newsletterBody
EXACT ENGLISH: Newsletter sign-up is not live yet. Follow us on Instagram for new releases and journal stories.
CONTEXT: Homepage — newsletter body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Newsletter.tsx
NOTES: —
```

```
KEY: home.newsletterEmailPlaceholder
EXACT ENGLISH: YOUR EMAIL ADDRESS
CONTEXT: Homepage — newsletter email placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/components/Newsletter.tsx
NOTES: —
```

```
KEY: home.newsletterCta
EXACT ENGLISH: NOTIFY ME →
CONTEXT: Homepage — newsletter cta
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/components/Newsletter.tsx
NOTES: —
```

```
KEY: home.newsletterNoticeNotStored
EXACT ENGLISH: We cannot store this address yet — sign-up opens with our next release.
CONTEXT: Homepage — newsletter notice not stored
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Newsletter.tsx
NOTES: —
```

```
KEY: home.newsletterNoticeClosed
EXACT ENGLISH: Your address is not stored or sent while sign-up is closed.
CONTEXT: Homepage — newsletter notice closed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Newsletter.tsx
NOTES: —
```

## Navbar

_33 string(s)_

```
KEY: nav.collections
EXACT ENGLISH: Collections
CONTEXT: Navbar — collections
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: nav.men
EXACT ENGLISH: Men
CONTEXT: Navbar — men
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: nav.women
EXACT ENGLISH: Women
CONTEXT: Navbar — women
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: nav.bestsellers
EXACT ENGLISH: Bestsellers
CONTEXT: Navbar — bestsellers
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Bestsellers.tsx
NOTES: —
```

```
KEY: nav.scentFinder
EXACT ENGLISH: Scent Finder
CONTEXT: Navbar — scent finder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: nav.contact
EXACT ENGLISH: Contact
CONTEXT: Navbar — contact
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: nav.aboutUs
EXACT ENGLISH: About Us
CONTEXT: Navbar — about us
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: nav.journal
EXACT ENGLISH: Journal
CONTEXT: Navbar — journal
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: nav.parentCompany
EXACT ENGLISH: Parent Company
CONTEXT: Navbar — parent company
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: —
```

```
KEY: nav.main
EXACT ENGLISH: Main
CONTEXT: Navbar — main
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: nav.menu
EXACT ENGLISH: Menu
CONTEXT: Navbar — menu
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: nav.closeMenu
EXACT ENGLISH: Close menu
CONTEXT: Navbar — close menu
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: —
```

```
KEY: nav.search
EXACT ENGLISH: Search
CONTEXT: Navbar — search
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: nav.searchFragrances
EXACT ENGLISH: Search fragrances
CONTEXT: Navbar — search fragrances
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: —
```

```
KEY: nav.searchPlaceholder
EXACT ENGLISH: SEARCH FRAGRANCES…
CONTEXT: Navbar — search placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/components/Navbar.tsx
NOTES: —
```

```
KEY: nav.wishlist
EXACT ENGLISH: Wishlist
CONTEXT: Navbar — wishlist
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx, src/components/Navbar.tsx
NOTES: —
```

```
KEY: nav.bag
EXACT ENGLISH: Bag
CONTEXT: Navbar — bag
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: nav.account
EXACT ENGLISH: Account
CONTEXT: Navbar — account
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: nav.signIn
EXACT ENGLISH: Sign In
CONTEXT: Navbar — sign in
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: —
```

```
KEY: nav.signOut
EXACT ENGLISH: Sign Out
CONTEXT: Navbar — sign out
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx, src/pages/Account.tsx
NOTES: —
```

```
KEY: nav.myAccount
EXACT ENGLISH: My Account
CONTEXT: Navbar — my account
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: —
```

```
KEY: nav.myProfile
EXACT ENGLISH: My Profile
CONTEXT: Navbar — my profile
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: —
```

```
KEY: nav.boutiqueDashboard
EXACT ENGLISH: Boutique Dashboard
CONTEXT: Navbar — boutique dashboard
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Navbar.tsx
NOTES: —
```

```
KEY: nav.loggedInAs
EXACT ENGLISH: Logged in as {name}
CONTEXT: Navbar — logged in as
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Navbar.tsx
NOTES: interpolation: {name}
```

```
KEY: nav.accountSignIn
EXACT ENGLISH: Account Sign In
CONTEXT: Navbar — account sign in
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Navbar.tsx
NOTES: —
```

```
KEY: nav.skipToContent
EXACT ENGLISH: Skip to content
CONTEXT: Navbar — skip to content
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/App.tsx
NOTES: —
```

```
KEY: nav.loadingPage
EXACT ENGLISH: Loading page…
CONTEXT: Navbar — loading page
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/App.tsx
NOTES: —
```

```
KEY: nav.currency
EXACT ENGLISH: Currency
CONTEXT: Navbar — currency
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: nav.language
EXACT ENGLISH: Language
CONTEXT: Navbar — language
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: nav.destination
EXACT ENGLISH: Delivery
CONTEXT: Navbar — destination
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: nav.selectCurrency
EXACT ENGLISH: Select display currency
CONTEXT: Navbar — select currency
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/InternationalControls.tsx
NOTES: —
```

```
KEY: nav.selectLanguage
EXACT ENGLISH: Select language
CONTEXT: Navbar — select language
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/InternationalControls.tsx
NOTES: —
```

```
KEY: nav.selectDestination
EXACT ENGLISH: Select delivery country
CONTEXT: Navbar — select destination
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/InternationalControls.tsx
NOTES: —
```

## Collections & Shop

_49 string(s)_

```
KEY: shop.filters
EXACT ENGLISH: FILTERS
CONTEXT: Collections & Shop — filters
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: shop.loading
EXACT ENGLISH: LOADING…
CONTEXT: Collections & Shop — loading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.fragrance
EXACT ENGLISH: FRAGRANCE
CONTEXT: Collections & Shop — fragrance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.fragrances
EXACT ENGLISH: FRAGRANCES
CONTEXT: Collections & Shop — fragrances
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.sortBy
EXACT ENGLISH: SORT BY:
CONTEXT: Collections & Shop — sort by
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.sortFeatured
EXACT ENGLISH: Featured First
CONTEXT: Collections & Shop — sort featured
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.sortNewest
EXACT ENGLISH: New Arrivals
CONTEXT: Collections & Shop — sort newest
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.sortPriceLow
EXACT ENGLISH: Price: Low to High
CONTEXT: Collections & Shop — sort price low
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.sortPriceHigh
EXACT ENGLISH: Price: High to Low
CONTEXT: Collections & Shop — sort price high
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.sortRating
EXACT ENGLISH: Client Rating
CONTEXT: Collections & Shop — sort rating
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.sortAriaLabel
EXACT ENGLISH: Sort fragrances
CONTEXT: Collections & Shop — sort aria label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.searchLabel
EXACT ENGLISH: Search fragrances, notes and families
CONTEXT: Collections & Shop — search label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.searchPlaceholder
EXACT ENGLISH: Search names, notes, families…
CONTEXT: Collections & Shop — search placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.activeFilters
EXACT ENGLISH: Active filters
CONTEXT: Collections & Shop — active filters
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.removeFilter
EXACT ENGLISH: Remove filter: {label}
CONTEXT: Collections & Shop — remove filter
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/components/ShopPage.tsx
NOTES: interpolation: {label}
```

```
KEY: shop.clearAll
EXACT ENGLISH: CLEAR ALL
CONTEXT: Collections & Shop — clear all
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.clearAllFilters
EXACT ENGLISH: CLEAR ALL FILTERS
CONTEXT: Collections & Shop — clear all filters
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.refineCollection
EXACT ENGLISH: Refine Collection
CONTEXT: Collections & Shop — refine collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.closeFilters
EXACT ENGLISH: Close filters
CONTEXT: Collections & Shop — close filters
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.filterGender
EXACT ENGLISH: Gender
CONTEXT: Collections & Shop — filter gender
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: shop.filterFragranceFamily
EXACT ENGLISH: Fragrance Family
CONTEXT: Collections & Shop — filter fragrance family
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.filterSizeAvailable
EXACT ENGLISH: Size Available
CONTEXT: Collections & Shop — filter size available
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.filterIntensity
EXACT ENGLISH: Intensity
CONTEXT: Collections & Shop — filter intensity
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.filterOccasion
EXACT ENGLISH: Occasion
CONTEXT: Collections & Shop — filter occasion
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.filterSeason
EXACT ENGLISH: Season
CONTEXT: Collections & Shop — filter season
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: shop.inStockOnly
EXACT ENGLISH: In stock only
CONTEXT: Collections & Shop — in stock only
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.maximumPrice
EXACT ENGLISH: Maximum Price
CONTEXT: Collections & Shop — maximum price
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.genderMen
EXACT ENGLISH: men
CONTEXT: Collections & Shop — gender men
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: shop.genderWomen
EXACT ENGLISH: women
CONTEXT: Collections & Shop — gender women
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: shop.genderUnisex
EXACT ENGLISH: unisex
CONTEXT: Collections & Shop — gender unisex
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: shop.chipSearch
EXACT ENGLISH: Search: “{query}”
CONTEXT: Collections & Shop — chip search
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: interpolation: {query}
```

```
KEY: shop.chipFamily
EXACT ENGLISH: Family: {value}
CONTEXT: Collections & Shop — chip family
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: interpolation: {value}
```

```
KEY: shop.chipSize
EXACT ENGLISH: {value} available
CONTEXT: Collections & Shop — chip size
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: interpolation: {value}
```

```
KEY: shop.chipIntensity
EXACT ENGLISH: Intensity: {value}
CONTEXT: Collections & Shop — chip intensity
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: interpolation: {value}
```

```
KEY: shop.chipOccasion
EXACT ENGLISH: Occasion: {value}
CONTEXT: Collections & Shop — chip occasion
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: interpolation: {value}
```

```
KEY: shop.chipSeason
EXACT ENGLISH: Season: {value}
CONTEXT: Collections & Shop — chip season
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: interpolation: {value}
```

```
KEY: shop.chipUnder
EXACT ENGLISH: Under {amount}
CONTEXT: Collections & Shop — chip under
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ShopPage.tsx
NOTES: interpolation: {amount}
```

```
KEY: shop.emptyTitle
EXACT ENGLISH: No fragrances match these filters
CONTEXT: Collections & Shop — empty title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.emptyBody
EXACT ENGLISH: Try widening your search or removing a filter.
CONTEXT: Collections & Shop — empty body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.catalogueEmptyTitle
EXACT ENGLISH: The Atelier is Composing
CONTEXT: Collections & Shop — catalogue empty title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.catalogueEmptyBody
EXACT ENGLISH: Our catalogue is being prepared and no fragrances have been published yet. Please check back soon.
CONTEXT: Collections & Shop — catalogue empty body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: shop.forHim
EXACT ENGLISH: FOR HIM
CONTEXT: Collections & Shop — for him
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Men.tsx
NOTES: —
```

```
KEY: shop.menTitle
EXACT ENGLISH: Men's Collection
CONTEXT: Collections & Shop — men title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Men.tsx
NOTES: —
```

```
KEY: shop.menSubtitle
EXACT ENGLISH: Fresh woods, dark spice and quiet confidence — fragrances built for presence.
CONTEXT: Collections & Shop — men subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Men.tsx
NOTES: —
```

```
KEY: shop.forHer
EXACT ENGLISH: FOR HER
CONTEXT: Collections & Shop — for her
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Women.tsx
NOTES: —
```

```
KEY: shop.womenTitle
EXACT ENGLISH: Women's Collection
CONTEXT: Collections & Shop — women title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Women.tsx
NOTES: —
```

```
KEY: shop.womenSubtitle
EXACT ENGLISH: Florals, amber and warmth — fragrances that linger in memory.
CONTEXT: Collections & Shop — women subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Women.tsx
NOTES: —
```

```
KEY: shop.bestsellersEyebrow
EXACT ENGLISH: CHOSEN BY THE ATELIER
CONTEXT: Collections & Shop — bestsellers eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/Bestsellers.tsx
NOTES: —
```

```
KEY: shop.bestsellersSubtitle
EXACT ENGLISH: Fragrances the house puts forward as an introduction to its range.
CONTEXT: Collections & Shop — bestsellers subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Bestsellers.tsx
NOTES: —
```

## Product Details

_78 string(s)_

```
KEY: product.viewDetails
EXACT ENGLISH: VIEW DETAILS
CONTEXT: Product Details — view details
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ProductCard.tsx, src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: product.viewDetailsHint
EXACT ENGLISH: VIEW DETAILS →
CONTEXT: Product Details — view details hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/components/ProductCard.tsx
NOTES: —
```

```
KEY: product.addToBag
EXACT ENGLISH: ADD TO BAG
CONTEXT: Product Details — add to bag
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ProductCard.tsx
NOTES: —
```

```
KEY: product.soldOut
EXACT ENGLISH: SOLD OUT
CONTEXT: Product Details — sold out
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ProductCard.tsx
NOTES: —
```

```
KEY: product.soldOutName
EXACT ENGLISH: {name} is sold out
CONTEXT: Product Details — sold out name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ProductCard.tsx
NOTES: interpolation: {name}
```

```
KEY: product.soldOutBadge
EXACT ENGLISH: Sold Out
CONTEXT: Product Details — sold out badge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ProductCard.tsx
NOTES: —
```

```
KEY: product.newBadge
EXACT ENGLISH: New
CONTEXT: Product Details — new badge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ProductCard.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: product.onlyLeft
EXACT ENGLISH: Only {count} left ({size})
CONTEXT: Product Details — only left
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ProductCard.tsx
NOTES: interpolation: {count}, {size}
```

```
KEY: product.byBottleSize
EXACT ENGLISH: By bottle size
CONTEXT: Product Details — by bottle size
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ProductCard.tsx
NOTES: —
```

```
KEY: product.priceOnRequest
EXACT ENGLISH: Price on request
CONTEXT: Product Details — price on request
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ProductCard.tsx, src/pages/Product.tsx
NOTES: —
```

```
KEY: product.addToBagName
EXACT ENGLISH: Add {name} to bag
CONTEXT: Product Details — add to bag name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ProductCard.tsx
NOTES: interpolation: {name}
```

```
KEY: product.addToWishlist
EXACT ENGLISH: Add {name} to wishlist
CONTEXT: Product Details — add to wishlist
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ProductCard.tsx
NOTES: interpolation: {name}
```

```
KEY: product.removeFromWishlist
EXACT ENGLISH: Remove {name} from wishlist
CONTEXT: Product Details — remove from wishlist
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ProductCard.tsx
NOTES: interpolation: {name}
```

```
KEY: product.quickView
EXACT ENGLISH: Quick view {name}
CONTEXT: Product Details — quick view
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ProductCard.tsx
NOTES: interpolation: {name}
```

```
KEY: product.copyField
EXACT ENGLISH: Copy {label}
CONTEXT: Product Details — copy field
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {label}
```

```
KEY: product.removeFromBag
EXACT ENGLISH: Remove {name} from bag
CONTEXT: Product Details — remove from bag
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CartDrawer.tsx
NOTES: interpolation: {name}
```

```
KEY: product.selectBottleSize
EXACT ENGLISH: SELECT BOTTLE SIZE:
CONTEXT: Product Details — select bottle size
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.soldOutWord
EXACT ENGLISH: Sold out
CONTEXT: Product Details — sold out word
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.nLeft
EXACT ENGLISH: {count} left
CONTEXT: Product Details — n left
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: interpolation: {count}
```

```
KEY: product.priceOnRequestLower
EXACT ENGLISH: price on request
CONTEXT: Product Details — price on request lower
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.decreaseQuantity
EXACT ENGLISH: Decrease quantity
CONTEXT: Product Details — decrease quantity
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.increaseQuantity
EXACT ENGLISH: Increase quantity
CONTEXT: Product Details — increase quantity
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.addToWishlistShort
EXACT ENGLISH: Add to wishlist
CONTEXT: Product Details — add to wishlist short
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.removeFromWishlistShort
EXACT ENGLISH: Remove from wishlist
CONTEXT: Product Details — remove from wishlist short
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.addToBagSize
EXACT ENGLISH: ADD TO BAG ({size})
CONTEXT: Product Details — add to bag size
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx, src/pages/ScentFinder.tsx
NOTES: interpolation: {size}
```

```
KEY: product.buyNow
EXACT ENGLISH: BUY NOW
CONTEXT: Product Details — buy now
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.freeShippingShipsIn
EXACT ENGLISH: Free shipping on orders over {amount} · Ships in {estimate}
CONTEXT: Product Details — free shipping ships in
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: interpolation: {amount}, {estimate}
```

```
KEY: product.loadingAtelierCreation
EXACT ENGLISH: Loading Atelier Creation…
CONTEXT: Product Details — loading atelier creation
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.fragranceNotFound
EXACT ENGLISH: Fragrance not found.
CONTEXT: Product Details — fragrance not found
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.backToCollections
EXACT ENGLISH: BACK TO COLLECTIONS
CONTEXT: Product Details — back to collections
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.imageThumbnails
EXACT ENGLISH: Product image thumbnails
CONTEXT: Product Details — image thumbnails
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.viewImageOf
EXACT ENGLISH: View image {index} of {total}
CONTEXT: Product Details — view image of
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/pages/Product.tsx
NOTES: interpolation: {index}, {total}
```

```
KEY: product.reviewWord
EXACT ENGLISH: review
CONTEXT: Product Details — review word
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.reviewsWord
EXACT ENGLISH: reviews
CONTEXT: Product Details — reviews word
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.notYetRated
EXACT ENGLISH: Not yet rated by clients
CONTEXT: Product Details — not yet rated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.fragranceFamilyLabel
EXACT ENGLISH: FRAGRANCE FAMILY
CONTEXT: Product Details — fragrance family label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.intensityLabel
EXACT ENGLISH: INTENSITY
CONTEXT: Product Details — intensity label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.occasionLabel
EXACT ENGLISH: OCCASION
CONTEXT: Product Details — occasion label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.seasonLabel
EXACT ENGLISH: SEASON
CONTEXT: Product Details — season label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Product.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: product.concentrationLabel
EXACT ENGLISH: CONCENTRATION
CONTEXT: Product Details — concentration label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.scentProfileLabel
EXACT ENGLISH: SCENT PROFILE
CONTEXT: Product Details — scent profile label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.selectedSizeLabel
EXACT ENGLISH: SELECTED SIZE
CONTEXT: Product Details — selected size label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.availabilityLabel
EXACT ENGLISH: AVAILABILITY
CONTEXT: Product Details — availability label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.availabilityOutOfStock
EXACT ENGLISH: OUT OF STOCK
CONTEXT: Product Details — availability out of stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx, src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: product.availabilityOnlyLeft
EXACT ENGLISH: ONLY {count} LEFT
CONTEXT: Product Details — availability only left
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx, src/pages/ScentFinder.tsx
NOTES: interpolation: {count}
```

```
KEY: product.availabilityInStockCount
EXACT ENGLISH: IN STOCK ({count} available)
CONTEXT: Product Details — availability in stock count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: interpolation: {count}
```

```
KEY: product.genderLabel
EXACT ENGLISH: GENDER
CONTEXT: Product Details — gender label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Product.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: product.fragrancePyramid
EXACT ENGLISH: FRAGRANCE PYRAMID
CONTEXT: Product Details — fragrance pyramid
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.topNotes
EXACT ENGLISH: TOP NOTES
CONTEXT: Product Details — top notes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx, src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: product.heartNotes
EXACT ENGLISH: HEART NOTES
CONTEXT: Product Details — heart notes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx, src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: product.baseNotes
EXACT ENGLISH: BASE NOTES
CONTEXT: Product Details — base notes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx, src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: product.pyramidEmpty
EXACT ENGLISH: The full note pyramid for this fragrance hasn't been listed yet. Once our perfumers publish it, it will appear here.
CONTEXT: Product Details — pyramid empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.fragranceDetailsTabs
EXACT ENGLISH: Fragrance details
CONTEXT: Product Details — fragrance details tabs
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.tabDescription
EXACT ENGLISH: DESCRIPTION
CONTEXT: Product Details — tab description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.tabIngredients
EXACT ENGLISH: INGREDIENTS
CONTEXT: Product Details — tab ingredients
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.tabHowToWear
EXACT ENGLISH: HOW TO WEAR
CONTEXT: Product Details — tab how to wear
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.tabShippingReturns
EXACT ENGLISH: SHIPPING & RETURNS
CONTEXT: Product Details — tab shipping returns
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.tabReviews
EXACT ENGLISH: REVIEWS
CONTEXT: Product Details — tab reviews
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: product.ingredientsEmpty
EXACT ENGLISH: The full ingredient declaration for this fragrance is being prepared by the atelier.
CONTEXT: Product Details — ingredients empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.howToWearBody
EXACT ENGLISH: Apply to pulse points — wrists, neck and behind the ears — after showering, when skin is warm. {name} is an extrait de parfum, so it is highly concentrated: start with 2–3 sprays and add only if you want more presence.
CONTEXT: Product Details — how to wear body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: interpolation: {name}
```

```
KEY: product.shippingReturnsBody
EXACT ENGLISH: Free standard shipping on all orders over {amount}. Orders typically ship within {estimate}. Unopened items may be returned within 30 days of delivery for a full refund.
CONTEXT: Product Details — shipping returns body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: interpolation: {amount}, {estimate}
```

```
KEY: product.noReviewsYet
EXACT ENGLISH: No reviews yet. Be the first to share your impression.
CONTEXT: Product Details — no reviews yet
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.verifiedPurchase
EXACT ENGLISH: · Verified Purchase
CONTEXT: Product Details — verified purchase
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.writeAReview
EXACT ENGLISH: WRITE A REVIEW
CONTEXT: Product Details — write areview
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.rateStars
EXACT ENGLISH: Rate {count} stars
CONTEXT: Product Details — rate stars
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: interpolation: {count}
```

```
KEY: product.reviewTitlePlaceholder
EXACT ENGLISH: Title (optional)
CONTEXT: Product Details — review title placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.reviewCommentPlaceholder
EXACT ENGLISH: Share your impression of this fragrance…
CONTEXT: Product Details — review comment placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.submittingReview
EXACT ENGLISH: SUBMITTING…
CONTEXT: Product Details — submitting review
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.submitReview
EXACT ENGLISH: SUBMIT REVIEW
CONTEXT: Product Details — submit review
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.reviewAwaitingApproval
EXACT ENGLISH: Thank you — your review is awaiting approval.
CONTEXT: Product Details — review awaiting approval
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.reviewSubmitFailed
EXACT ENGLISH: Could not submit your review.
CONTEXT: Product Details — review submit failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.similarFragrances
EXACT ENGLISH: Similar Fragrances
CONTEXT: Product Details — similar fragrances
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.recentlyViewed
EXACT ENGLISH: Recently Viewed
CONTEXT: Product Details — recently viewed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.allFragrances
EXACT ENGLISH: ALL FRAGRANCES →
CONTEXT: Product Details — all fragrances
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.youMayAlsoLove
EXACT ENGLISH: You May Also Love
CONTEXT: Product Details — you may also love
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: product.wishlistTitle
EXACT ENGLISH: Your Wishlist
CONTEXT: Product Details — wishlist title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Wishlist.tsx
NOTES: —
```

```
KEY: product.wishlistSubtitle
EXACT ENGLISH: Fragrances you've saved for later.
CONTEXT: Product Details — wishlist subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Wishlist.tsx
NOTES: —
```

```
KEY: product.wishlistEmpty
EXACT ENGLISH: Your wishlist is empty.
CONTEXT: Product Details — wishlist empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Wishlist.tsx
NOTES: —
```

## Scent Finder

_84 string(s)_

```
KEY: scentFinder.availableSizes
EXACT ENGLISH: AVAILABLE SIZES
CONTEXT: Scent Finder — available sizes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.backButton
EXACT ENGLISH: BACK
CONTEXT: Scent Finder — back button
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/pages/ScentFinder.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: scentFinder.backToMatches
EXACT ENGLISH: BACK TO MATCHES
CONTEXT: Scent Finder — back to matches
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.browseCollection
EXACT ENGLISH: BROWSE THE COLLECTION
CONTEXT: Scent Finder — browse collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.captionEnormous
EXACT ENGLISH: Our most assertive declaration.
CONTEXT: Scent Finder — caption enormous
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.captionLight
EXACT ENGLISH: A close veil, kept near the skin.
CONTEXT: Scent Finder — caption light
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.captionModerate
EXACT ENGLISH: Clearly there, without announcing itself.
CONTEXT: Scent Finder — caption moderate
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.captionStrong
EXACT ENGLISH: Fills the space around you.
CONTEXT: Scent Finder — caption strong
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.change
EXACT ENGLISH: Change
CONTEXT: Scent Finder — change
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: scentFinder.chipForYourself
EXACT ENGLISH: For yourself
CONTEXT: Scent Finder — chip for yourself
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.chipGift
EXACT ENGLISH: A gift
CONTEXT: Scent Finder — chip gift
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.chipVersatile
EXACT ENGLISH: Versatile
CONTEXT: Scent Finder — chip versatile
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.clearThisAnswer
EXACT ENGLISH: CLEAR THIS ANSWER
CONTEXT: Scent Finder — clear this answer
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.closest
EXACT ENGLISH: CLOSEST
CONTEXT: Scent Finder — closest
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: scentFinder.continueButton
EXACT ENGLISH: CONTINUE
CONTEXT: Scent Finder — continue button
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.deviceNote
EXACT ENGLISH: Your answers are kept on this device, so you can leave and come back.
CONTEXT: Scent Finder — device note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.emptyBody
EXACT ENGLISH: No fragrances are listed just yet, so we would rather say so than show you anything invented. Please check again soon.
CONTEXT: Scent Finder — empty body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.emptyTitle
EXACT ENGLISH: The collection is being prepared
CONTEXT: Scent Finder — empty title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.errorBody
EXACT ENGLISH: Something interrupted the connection to our catalogue. Nothing you have entered is lost.
CONTEXT: Scent Finder — error body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.errorTitle
EXACT ENGLISH: The collection could not be reached
CONTEXT: Scent Finder — error title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.eyebrow
EXACT ENGLISH: SCENT FINDER
CONTEXT: Scent Finder — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.inStock
EXACT ENGLISH: IN STOCK
CONTEXT: Scent Finder — in stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.intentGift
EXACT ENGLISH: For someone else
CONTEXT: Scent Finder — intent gift
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.intentSelf
EXACT ENGLISH: For myself
CONTEXT: Scent Finder — intent self
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.intro
EXACT ENGLISH: A short consultation on family, projection, occasion and season — answered with the scents in stock today, and with nothing claimed about them that they do not declare.
CONTEXT: Scent Finder — intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.leaningFeminine
EXACT ENGLISH: A feminine character
CONTEXT: Scent Finder — leaning feminine
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.leaningMasculine
EXACT ENGLISH: A masculine character
CONTEXT: Scent Finder — leaning masculine
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.leaningVersatile
EXACT ENGLISH: Versatile — written for anyone
CONTEXT: Scent Finder — leaning versatile
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.liveMatchesMany
EXACT ENGLISH: {count} matches ready.
CONTEXT: Scent Finder — live matches many
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: interpolation: {count}
```

```
KEY: scentFinder.liveMatchesOne
EXACT ENGLISH: {count} match ready.
CONTEXT: Scent Finder — live matches one
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: interpolation: {count}
```

```
KEY: scentFinder.liveNoMatch
EXACT ENGLISH: No close match found.
CONTEXT: Scent Finder — live no match
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.liveQuestion
EXACT ENGLISH: Question {current} of {total}. {question}. {progress}.
CONTEXT: Scent Finder — live question
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: interpolation: {current}, {total}, {question}, {progress}
```

```
KEY: scentFinder.loading
EXACT ENGLISH: Preparing the collection…
CONTEXT: Scent Finder — loading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.loosenBody
EXACT ENGLISH: Try loosening one answer — the family or the projection level usually opens this up.
CONTEXT: Scent Finder — loosen body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.noMatchesBody
EXACT ENGLISH: We only put a scent forward when it genuinely shares what you asked for. None of the {count} fragrances listed today clears that bar — usually because their season, occasion or intensity details are still being completed.
CONTEXT: Scent Finder — no matches body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: interpolation: {count}
```

```
KEY: scentFinder.noMatchesEyebrow
EXACT ENGLISH: NOTHING TO RECOMMEND YET
CONTEXT: Scent Finder — no matches eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.noMatchesTitle
EXACT ENGLISH: Nothing matches this combination yet
CONTEXT: Scent Finder — no matches title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.notSpecified
EXACT ENGLISH: Not specified
CONTEXT: Scent Finder — not specified
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.notSureYet
EXACT ENGLISH: NOT SURE YET
CONTEXT: Scent Finder — not sure yet
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.notesFieldLabel
EXACT ENGLISH: SCENTS YOU HAVE LOVED (OPTIONAL)
CONTEXT: Scent Finder — notes field label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.progressAnswered
EXACT ENGLISH: {percent} percent answered
CONTEXT: Scent Finder — progress answered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: interpolation: {percent}
```

```
KEY: scentFinder.progressComplete
EXACT ENGLISH: complete
CONTEXT: Scent Finder — progress complete
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.questionCounter
EXACT ENGLISH: QUESTION {current} OF {total}
CONTEXT: Scent Finder — question counter
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: interpolation: {current}, {total}
```

```
KEY: scentFinder.refineFromFirst
EXACT ENGLISH: REFINE FROM THE FIRST QUESTION
CONTEXT: Scent Finder — refine from first
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.refining
EXACT ENGLISH: REFINING
CONTEXT: Scent Finder — refining
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.resultGifts
EXACT ENGLISH: {count} considered gifts
CONTEXT: Scent Finder — result gifts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: interpolation: {count}
```

```
KEY: scentFinder.resultOneGift
EXACT ENGLISH: One considered gift
CONTEXT: Scent Finder — result one gift
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.resultOneScent
EXACT ENGLISH: One scent worth trying
CONTEXT: Scent Finder — result one scent
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.resultScents
EXACT ENGLISH: {count} scents worth trying
CONTEXT: Scent Finder — result scents
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: interpolation: {count}
```

```
KEY: scentFinder.resultsBody
EXACT ENGLISH: Based on your answers — {answers}. Each card below lists the attributes that overlap.
CONTEXT: Scent Finder — results body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: interpolation: {answers}
```

```
KEY: scentFinder.seeMyMatches
EXACT ENGLISH: SEE MY MATCHES
CONTEXT: Scent Finder — see my matches
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.shortlistEyebrow
EXACT ENGLISH: YOUR SHORTLIST
CONTEXT: Scent Finder — shortlist eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.sizesAria
EXACT ENGLISH: {name} sizes and prices
CONTEXT: Scent Finder — sizes aria
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: interpolation: {name}
```

```
KEY: scentFinder.sparseNote
EXACT ENGLISH: Season and occasion details for this scent are still being listed.
CONTEXT: Scent Finder — sparse note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.startAgain
EXACT ENGLISH: START AGAIN
CONTEXT: Scent Finder — start again
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepFamilyEyebrow
EXACT ENGLISH: Family
CONTEXT: Scent Finder — step family eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/ScentFinder.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: scentFinder.stepFamilyHelp
EXACT ENGLISH: These are the families our collection is grouped by today.
CONTEXT: Scent Finder — step family help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepFamilyQuestion
EXACT ENGLISH: Which family draws you first?
CONTEXT: Scent Finder — step family question
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepIntensityEyebrow
EXACT ENGLISH: Projection
CONTEXT: Scent Finder — step intensity eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepIntensityHelp
EXACT ENGLISH: We describe projection as the atelier declares it — not a promise about hours.
CONTEXT: Scent Finder — step intensity help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepIntensityQuestion
EXACT ENGLISH: How present should it feel?
CONTEXT: Scent Finder — step intensity question
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepIntentEyebrow
EXACT ENGLISH: Purpose
CONTEXT: Scent Finder — step intent eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/ScentFinder.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: scentFinder.stepIntentHelp
EXACT ENGLISH: This only changes how we frame the result.
CONTEXT: Scent Finder — step intent help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepIntentQuestion
EXACT ENGLISH: Is this for you, or for someone else?
CONTEXT: Scent Finder — step intent question
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepLeaningEyebrow
EXACT ENGLISH: For whom
CONTEXT: Scent Finder — step leaning eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepLeaningHelp
EXACT ENGLISH: A direction, not a rule — every composition here can be worn by anyone.
CONTEXT: Scent Finder — step leaning help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepLeaningQuestion
EXACT ENGLISH: Whose skin will it live on?
CONTEXT: Scent Finder — step leaning question
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepNotesEyebrow
EXACT ENGLISH: Notes
CONTEXT: Scent Finder — step notes eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/ScentFinder.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: scentFinder.stepNotesHelp
EXACT ENGLISH: Optional. Name a note — we compare it only with notes each fragrance actually declares.
CONTEXT: Scent Finder — step notes help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepNotesPlaceholder
EXACT ENGLISH: Bergamot, oud, vanilla…
CONTEXT: Scent Finder — step notes placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepNotesQuestion
EXACT ENGLISH: Scents you have loved
CONTEXT: Scent Finder — step notes question
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepOccasionEyebrow
EXACT ENGLISH: Occasion
CONTEXT: Scent Finder — step occasion eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepOccasionHelp
EXACT ENGLISH: Pick the moment you have in mind.
CONTEXT: Scent Finder — step occasion help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepOccasionQuestion
EXACT ENGLISH: Where will it be worn?
CONTEXT: Scent Finder — step occasion question
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepSeasonEyebrow
EXACT ENGLISH: Season
CONTEXT: Scent Finder — step season eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/ScentFinder.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: scentFinder.stepSeasonHelp
EXACT ENGLISH: Weight and warmth are usually chosen with the calendar in hand.
CONTEXT: Scent Finder — step season help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.stepSeasonQuestion
EXACT ENGLISH: Which season is in mind?
CONTEXT: Scent Finder — step season question
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.titleLine1
EXACT ENGLISH: Find Your
CONTEXT: Scent Finder — title line1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.titleLine2
EXACT ENGLISH: Signature Scent
CONTEXT: Scent Finder — title line2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.tryAgain
EXACT ENGLISH: TRY AGAIN
CONTEXT: Scent Finder — try again
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.updateMatches
EXACT ENGLISH: UPDATE MATCHES
CONTEXT: Scent Finder — update matches
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.viewAllFragrances
EXACT ENGLISH: VIEW ALL FRAGRANCES
CONTEXT: Scent Finder — view all fragrances
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.whyMatched
EXACT ENGLISH: WHY THIS MATCHED
CONTEXT: Scent Finder — why matched
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: scentFinder.whyQuotedNote
EXACT ENGLISH: Every line under “why this matched” is quoted from what the fragrance declares in our catalogue. Where a detail is missing, we leave it out rather than guess.
CONTEXT: Scent Finder — why quoted note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

## Cart

_33 string(s)_

```
KEY: cart.shoppingBag
EXACT ENGLISH: Shopping bag
CONTEXT: Cart — shopping bag
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CartDrawer.tsx
NOTES: —
```

```
KEY: cart.yourBag
EXACT ENGLISH: Your Bag ({count})
CONTEXT: Cart — your bag
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CartDrawer.tsx
NOTES: interpolation: {count}
```

```
KEY: cart.closeCart
EXACT ENGLISH: Close cart
CONTEXT: Cart — close cart
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CartDrawer.tsx
NOTES: —
```

```
KEY: cart.freeShippingLead
EXACT ENGLISH: Add
CONTEXT: Cart — free shipping lead
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CartDrawer.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: cart.freeShippingTail
EXACT ENGLISH: more for free delivery
CONTEXT: Cart — free shipping tail
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CartDrawer.tsx
NOTES: —
```

```
KEY: cart.freeDeliveryUnlocked
EXACT ENGLISH: Free delivery unlocked
CONTEXT: Cart — free delivery unlocked
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CartDrawer.tsx
NOTES: —
```

```
KEY: cart.bagEmpty
EXACT ENGLISH: Your bag is empty.
CONTEXT: Cart — bag empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CartDrawer.tsx
NOTES: —
```

```
KEY: cart.discover
EXACT ENGLISH: DISCOVER FRAGRANCES →
CONTEXT: Cart — discover
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CartDrawer.tsx, src/pages/Cart.tsx, src/pages/Wishlist.tsx
NOTES: —
```

```
KEY: cart.decreaseQuantity
EXACT ENGLISH: Decrease quantity of {name}
CONTEXT: Cart — decrease quantity
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CartDrawer.tsx, src/pages/Cart.tsx
NOTES: interpolation: {name}
```

```
KEY: cart.increaseQuantity
EXACT ENGLISH: Increase quantity of {name}
CONTEXT: Cart — increase quantity
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CartDrawer.tsx, src/pages/Cart.tsx
NOTES: interpolation: {name}
```

```
KEY: cart.shipping
EXACT ENGLISH: Shipping
CONTEXT: Cart — shipping
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CartDrawer.tsx, src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.free
EXACT ENGLISH: Free
CONTEXT: Cart — free
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CartDrawer.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: cart.savingBag
EXACT ENGLISH: Saving your bag…
CONTEXT: Cart — saving bag
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CartDrawer.tsx
NOTES: —
```

```
KEY: cart.savedBag
EXACT ENGLISH: Saved to your bag
CONTEXT: Cart — saved bag
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/components/CartDrawer.tsx
NOTES: —
```

```
KEY: cart.viewCart
EXACT ENGLISH: VIEW CART
CONTEXT: Cart — view cart
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CartDrawer.tsx
NOTES: —
```

```
KEY: cart.checkout
EXACT ENGLISH: CHECKOUT →
CONTEXT: Cart — checkout
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CartDrawer.tsx
NOTES: —
```

```
KEY: cart.pageTitle
EXACT ENGLISH: Your Shopping Bag
CONTEXT: Cart — page title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.bagCurrentlyEmpty
EXACT ENGLISH: Your bag is currently empty.
CONTEXT: Cart — bag currently empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.saveForLater
EXACT ENGLISH: Save for later
CONTEXT: Cart — save for later
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.remove
EXACT ENGLISH: Remove
CONTEXT: Cart — remove
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Cart.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: cart.promotionCode
EXACT ENGLISH: Promotion code
CONTEXT: Cart — promotion code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.promoCodePlaceholder
EXACT ENGLISH: PROMO CODE
CONTEXT: Cart — promo code placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.apply
EXACT ENGLISH: APPLY
CONTEXT: Cart — apply
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Cart.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: cart.promoFailedFallback
EXACT ENGLISH: That code could not be applied.
CONTEXT: Cart — promo failed fallback
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.promoHint
EXACT ENGLISH: Enter a promotion code if you have one.
CONTEXT: Cart — promo hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.orderSummary
EXACT ENGLISH: Order Summary
CONTEXT: Cart — order summary
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.subtotal
EXACT ENGLISH: Subtotal
CONTEXT: Cart — subtotal
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.promoLine
EXACT ENGLISH: Promo {code}
CONTEXT: Cart — promo line
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Cart.tsx
NOTES: interpolation: {code}
```

```
KEY: cart.total
EXACT ENGLISH: Total
CONTEXT: Cart — total
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Cart.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: cart.addMoreForFreeDelivery
EXACT ENGLISH: Add {amount} more for complimentary delivery.
CONTEXT: Cart — add more for free delivery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Cart.tsx
NOTES: interpolation: {amount}
```

```
KEY: cart.checkoutConfirmationNote
EXACT ENGLISH: Delivery and any promotion are confirmed on the next step before you place the order.
CONTEXT: Cart — checkout confirmation note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.proceedToCheckout
EXACT ENGLISH: PROCEED TO CHECKOUT →
CONTEXT: Cart — proceed to checkout
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

```
KEY: cart.continueShopping
EXACT ENGLISH: Continue Shopping
CONTEXT: Cart — continue shopping
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Cart.tsx
NOTES: —
```

## Checkout

_105 string(s)_

```
KEY: checkout.empty
EXACT ENGLISH: Your bag is empty — add a fragrance before checking out.
CONTEXT: Checkout — empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.discover
EXACT ENGLISH: DISCOVER FRAGRANCES →
CONTEXT: Checkout — discover
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.stepContact
EXACT ENGLISH: CONTACT
CONTEXT: Checkout — step contact
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: checkout.stepShipping
EXACT ENGLISH: SHIPPING
CONTEXT: Checkout — step shipping
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.stepPayment
EXACT ENGLISH: PAYMENT
CONTEXT: Checkout — step payment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: checkout.stepConfirmation
EXACT ENGLISH: CONFIRMATION
CONTEXT: Checkout — step confirmation
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.stepOfThree
EXACT ENGLISH: STEP {n} OF 3
CONTEXT: Checkout — step of three
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {n}
```

```
KEY: checkout.contactHeading
EXACT ENGLISH: Client Contact Information
CONTEXT: Checkout — contact heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.shippingHeading
EXACT ENGLISH: Boutique Delivery Address
CONTEXT: Checkout — shipping heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.paymentHeading
EXACT ENGLISH: Select Payment Method ({country})
CONTEXT: Checkout — payment heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {country}
```

```
KEY: checkout.email
EXACT ENGLISH: Email Address
CONTEXT: Checkout — email
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.emailPlaceholder
EXACT ENGLISH: client@domain.com
CONTEXT: Checkout — email placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.fullName
EXACT ENGLISH: Full Legal Name
CONTEXT: Checkout — full name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.fullNamePlaceholder
EXACT ENGLISH: e.g. Lord Alexander Sinclair
CONTEXT: Checkout — full name placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Checkout.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: checkout.phone
EXACT ENGLISH: Contact Phone Number
CONTEXT: Checkout — phone
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.street
EXACT ENGLISH: Street Address
CONTEXT: Checkout — street
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.streetPlaceholder
EXACT ENGLISH: Residence, House / Apartment No…
CONTEXT: Checkout — street placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.city
EXACT ENGLISH: City
CONTEXT: Checkout — city
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx, src/pages/Checkout.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: checkout.postalCode
EXACT ENGLISH: Postal Code
CONTEXT: Checkout — postal code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.region
EXACT ENGLISH: Region / State
CONTEXT: Checkout — region
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.regionPlaceholder
EXACT ENGLISH: Province, state or emirate
CONTEXT: Checkout — region placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.country
EXACT ENGLISH: Country
CONTEXT: Checkout — country
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx, src/pages/Checkout.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: checkout.deliveryUnavailableSuffix
EXACT ENGLISH: delivery unavailable
CONTEXT: Checkout — delivery unavailable suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.giftTitle
EXACT ENGLISH: Present it as a gift
CONTEXT: Checkout — gift title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.giftBody
EXACT ENGLISH: Request a gift note and the atelier will confirm what it can do before dispatch.
CONTEXT: Checkout — gift body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.giftMessage
EXACT ENGLISH: Gift message
CONTEXT: Checkout — gift message
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.giftMessagePlaceholder
EXACT ENGLISH: Write the message you would like the atelier to include.
CONTEXT: Checkout — gift message placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.deliveryNotes
EXACT ENGLISH: Delivery notes (optional)
CONTEXT: Checkout — delivery notes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.deliveryNotesPlaceholder
EXACT ENGLISH: Gate code, preferred arrival window, who to call on arrival.
CONTEXT: Checkout — delivery notes placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.summary
EXACT ENGLISH: Acquisition Summary
CONTEXT: Checkout — summary
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.qty
EXACT ENGLISH: Qty: {n}
CONTEXT: Checkout — qty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {n}
```

```
KEY: checkout.subtotal
EXACT ENGLISH: Subtotal
CONTEXT: Checkout — subtotal
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.discount
EXACT ENGLISH: Discount ({code})
CONTEXT: Checkout — discount
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {code}
```

```
KEY: checkout.shipping
EXACT ENGLISH: Shipping
CONTEXT: Checkout — shipping
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx, src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: checkout.totalAmount
EXACT ENGLISH: Total Amount
CONTEXT: Checkout — total amount
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.back
EXACT ENGLISH: BACK
CONTEXT: Checkout — back
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: checkout.continue
EXACT ENGLISH: CONTINUE →
CONTEXT: Checkout — continue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.processing
EXACT ENGLISH: PROCESSING ORDER…
CONTEXT: Checkout — processing
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.confirmOrder
EXACT ENGLISH: CONFIRM {method} ORDER →
CONTEXT: Checkout — confirm order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {method}
```

```
KEY: checkout.paymentMethodGroup
EXACT ENGLISH: Payment method
CONTEXT: Checkout — payment method group
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.noMethods
EXACT ENGLISH: No payment methods are configured yet. Please contact the concierge to complete your order.
CONTEXT: Checkout — no methods
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.instructionsSuffix
EXACT ENGLISH: instructions
CONTEXT: Checkout — instructions suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.codBodyLead
EXACT ENGLISH: Pay the exact order total of
CONTEXT: Checkout — cod body lead
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.codBodyTail
EXACT ENGLISH: in cash to the courier when your parcel arrives.
CONTEXT: Checkout — cod body tail
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.referenceFallback
EXACT ENGLISH: Transaction Reference
CONTEXT: Checkout — reference fallback
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.referencePlaceholder
EXACT ENGLISH: Enter the reference from your transfer
CONTEXT: Checkout — reference placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.uploadProof
EXACT ENGLISH: Upload Payment Screenshot / Transfer Receipt
CONTEXT: Checkout — upload proof
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.clickSelect
EXACT ENGLISH: Click to select screenshot image
CONTEXT: Checkout — click select
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.supportsFiles
EXACT ENGLISH: Supports PNG, JPG, WebP up to 10MB
CONTEXT: Checkout — supports files
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.proofPreviewAlt
EXACT ENGLISH: Payment Screenshot Preview
CONTEXT: Checkout — proof preview alt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.attached
EXACT ENGLISH: ✓ Screenshot attached ({size} KB)
CONTEXT: Checkout — attached
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {size}
```

```
KEY: checkout.copied
EXACT ENGLISH: ✓ Copied to clipboard!
CONTEXT: Checkout — copied
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.orderRegistered
EXACT ENGLISH: ORDER REGISTERED
CONTEXT: Checkout — order registered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.acquisitionConfirmed
EXACT ENGLISH: Acquisition Confirmed
CONTEXT: Checkout — acquisition confirmed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.thankYou
EXACT ENGLISH: Thank you, {name}.
CONTEXT: Checkout — thank you
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {name}
```

```
KEY: checkout.valuedClient
EXACT ENGLISH: valued client
CONTEXT: Checkout — valued client
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.orderPlaced
EXACT ENGLISH: Your order
CONTEXT: Checkout — order placed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.hasBeenPlaced
EXACT ENGLISH: has been placed.
CONTEXT: Checkout — has been placed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.emailReceipt
EXACT ENGLISH: A receipt has been sent to {email}.
CONTEXT: Checkout — email receipt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {email}
```

```
KEY: checkout.emailFallback
EXACT ENGLISH: your email
CONTEXT: Checkout — email fallback
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.emailUnavailable
EXACT ENGLISH: Email delivery is not available on this store yet, so no receipt was sent — keep this reference and follow the order from your account or with the tracking page.
CONTEXT: Checkout — email unavailable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.orderReference
EXACT ENGLISH: Order Reference:
CONTEXT: Checkout — order reference
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.totalAmountLabel
EXACT ENGLISH: Total Amount:
CONTEXT: Checkout — total amount label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.taxLine
EXACT ENGLISH: Tax:
CONTEXT: Checkout — tax line
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: checkout.currencyLabel
EXACT ENGLISH: Currency:
CONTEXT: Checkout — currency label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.deliveryToLabel
EXACT ENGLISH: Delivered to:
CONTEXT: Checkout — delivery to label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.selectedPayment
EXACT ENGLISH: Selected Payment Method:
CONTEXT: Checkout — selected payment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.paymentStatusLabel
EXACT ENGLISH: Payment Status:
CONTEXT: Checkout — payment status label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.awaitingVerification
EXACT ENGLISH: Awaiting verification
CONTEXT: Checkout — awaiting verification
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.awaitingCollection
EXACT ENGLISH: Awaiting delivery collection
CONTEXT: Checkout — awaiting collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.typicalDeliveryLabel
EXACT ENGLISH: Typical Delivery:
CONTEXT: Checkout — typical delivery label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.giftPresentationLabel
EXACT ENGLISH: Gift Presentation:
CONTEXT: Checkout — gift presentation label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.withNoteCard
EXACT ENGLISH: Requested with note card
CONTEXT: Checkout — with note card
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.standardPackaging
EXACT ENGLISH: Standard packaging
CONTEXT: Checkout — standard packaging
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.trackNote
EXACT ENGLISH: You can follow this order from your account, or with the tracking reference on the Track Order page once it is dispatched.
CONTEXT: Checkout — track note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.trackOrder
EXACT ENGLISH: TRACK ORDER →
CONTEXT: Checkout — track order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.opening
EXACT ENGLISH: OPENING…
CONTEXT: Checkout — opening
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.continueSecure
EXACT ENGLISH: CONTINUE TO SECURE PAYMENT →
CONTEXT: Checkout — continue secure
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.contactConcierge
EXACT ENGLISH: We can arrange delivery to {country} once international payment methods are live. Contact the concierge to complete an order there.
CONTEXT: Checkout — contact concierge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {country}
```

```
KEY: checkout.contactUs
EXACT ENGLISH: CONTACT US
CONTEXT: Checkout — contact us
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.pricingUnavailable
EXACT ENGLISH: Pricing is unavailable right now. Please try again.
CONTEXT: Checkout — pricing unavailable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.sizeUnavailable
EXACT ENGLISH: One of the selected sizes is no longer available. Please review your bag.
CONTEXT: Checkout — size unavailable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.needReference
EXACT ENGLISH: Enter your {label} so we can match your payment.
CONTEXT: Checkout — need reference
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {label}
```

```
KEY: checkout.needProof
EXACT ENGLISH: Attach a screenshot of your payment confirmation.
CONTEXT: Checkout — need proof
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.signInForProof
EXACT ENGLISH: Please sign in to attach a payment screenshot, or send the reference with your order.
CONTEXT: Checkout — sign in for proof
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.proofUploadFailed
EXACT ENGLISH: Your payment screenshot could not be uploaded. Please try again.
CONTEXT: Checkout — proof upload failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.invalidImage
EXACT ENGLISH: Please select a valid image file (PNG, JPG, WebP).
CONTEXT: Checkout — invalid image
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.imageTooBig
EXACT ENGLISH: Payment screenshot file size must be less than 10MB.
CONTEXT: Checkout — image too big
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.orderFailed
EXACT ENGLISH: Your order could not be registered. Please try again.
CONTEXT: Checkout — order failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.placeFailed
EXACT ENGLISH: Your order could not be placed. Please try again.
CONTEXT: Checkout — place failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.proofNotAttached
EXACT ENGLISH: {order} was registered, but your payment evidence was not attached. Please send it to the concierge.
CONTEXT: Checkout — proof not attached
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {order}
```

```
KEY: checkout.giftNotSaved
EXACT ENGLISH: {order} was registered, but the gift presentation was not saved. Please tell the concierge so it can be added before dispatch.
CONTEXT: Checkout — gift not saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {order}
```

```
KEY: checkout.notesNotSaved
EXACT ENGLISH: {order} was registered, but your delivery note was not saved.
CONTEXT: Checkout — notes not saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {order}
```

```
KEY: checkout.payfastUnavailable
EXACT ENGLISH: Online card payment is not available on this store yet. Choose another payment method or contact the atelier.
CONTEXT: Checkout — payfast unavailable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: checkout.payfastNotOpened
EXACT ENGLISH: The payment page could not be opened. Please try again or choose another payment method.
CONTEXT: Checkout — payfast not opened
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: shipping.deliveryTo
EXACT ENGLISH: Delivery to {country}
CONTEXT: Checkout — delivery to
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {country}
```

```
KEY: shipping.complimentary
EXACT ENGLISH: Complimentary
CONTEXT: Checkout — complimentary
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx, src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: shipping.fee
EXACT ENGLISH: Shipping {amount}
CONTEXT: Checkout — fee
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {amount}
```

```
KEY: shipping.freeOver
EXACT ENGLISH: Complimentary shipping on orders over {amount}.
CONTEXT: Checkout — free over
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {amount}
```

```
KEY: shipping.restrictions
EXACT ENGLISH: Restrictions
CONTEXT: Checkout — restrictions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: shipping.daysOne
EXACT ENGLISH: {count} business day
CONTEXT: Checkout — days one
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {count}
```

```
KEY: shipping.daysRange
EXACT ENGLISH: {from}–{to} business days
CONTEXT: Checkout — days range
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx, src/pages/Product.tsx
NOTES: interpolation: {from}, {to}
```

```
KEY: shipping.daysUpTo
EXACT ENGLISH: Up to {count} business days
CONTEXT: Checkout — days up to
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {count}
```

```
KEY: tax.label
EXACT ENGLISH: {label} ({rate}%)
CONTEXT: Checkout — label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {label}, {rate}
```

```
KEY: tax.fallback
EXACT ENGLISH: Tax
CONTEXT: Checkout — fallback
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Checkout.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

## Currency, Country & International

_11 string(s)_

```
KEY: international.paymentsComingSoon
EXACT ENGLISH: International payment methods coming soon
CONTEXT: Currency, Country & International — payments coming soon
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: international.paymentsComingSoonBody
EXACT ENGLISH: Additional international payment options are being prepared for this destination. Orders to Pakistan continue to be settled by Cash on Delivery, JazzCash, Raast or direct bank transfer.
CONTEXT: Currency, Country & International — payments coming soon body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: international.paymentsNotSelect
EXACT ENGLISH: Not available yet
CONTEXT: Currency, Country & International — payments not select
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: international.ratesManualTitle
EXACT ENGLISH: Indicative exchange rates
CONTEXT: Currency, Country & International — rates manual title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/InternationalControls.tsx
NOTES: —
```

```
KEY: international.ratesManualBody
EXACT ENGLISH: Displayed prices use the atelier's own configured rates, not a live market feed. Every order is recorded in Pakistani Rupees at the rate shown when it was placed.
CONTEXT: Currency, Country & International — rates manual body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: international.currencyNote
EXACT ENGLISH: Prices shown in {currency} are indicative; the order itself is confirmed in Pakistani Rupees.
CONTEXT: Currency, Country & International — currency note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: interpolation: {currency}
```

```
KEY: international.deliveryUnavailable
EXACT ENGLISH: Delivery to {country} is not available yet. The atelier can still be contacted about it.
CONTEXT: Currency, Country & International — delivery unavailable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · interpolation: {country} · [REVIEW POSSIBLE]
```

```
KEY: international.deliveryUnavailableShort
EXACT ENGLISH: Delivery unavailable
CONTEXT: Currency, Country & International — delivery unavailable short
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: international.chooseCountry
EXACT ENGLISH: Choose a delivery country before checking out.
CONTEXT: Currency, Country & International — choose country
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: international.taxNotice
EXACT ENGLISH: Tax shown is the atelier's configured rate for this destination, not legal advice.
CONTEXT: Currency, Country & International — tax notice
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Checkout.tsx
NOTES: —
```

```
KEY: international.view
EXACT ENGLISH: View
CONTEXT: Currency, Country & International — view
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

## Order Tracking

_69 string(s)_

```
KEY: track.eyebrow
EXACT ENGLISH: BOUTIQUE CONCIERGE
CONTEXT: Order Tracking — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.title
EXACT ENGLISH: Track Your Fragrance Shipment
CONTEXT: Order Tracking — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.intro
EXACT ENGLISH: Enter your order number or tracking reference to see atelier preparation status, courier details and the full delivery timeline.
CONTEXT: Order Tracking — intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.lookupHeading
EXACT ENGLISH: Order Lookup
CONTEXT: Order Tracking — lookup heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.verifiedNote
EXACT ENGLISH: Verified against our fulfilment records
CONTEXT: Order Tracking — verified note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.referenceLabel
EXACT ENGLISH: Order Number or Tracking ID
CONTEXT: Order Tracking — reference label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.referenceHelp
EXACT ENGLISH: Shown on your confirmation page and in your account orders.
CONTEXT: Order Tracking — reference help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.emailLabel
EXACT ENGLISH: Email Used at Checkout
CONTEXT: Order Tracking — email label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.emailHelp
EXACT ENGLISH: Needed for guest orders so we can confirm the order belongs to you.
CONTEXT: Order Tracking — email help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.searching
EXACT ENGLISH: Searching…
CONTEXT: Order Tracking — searching
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.statusPendingReview
EXACT ENGLISH: Pending Review
CONTEXT: Order Tracking — status pending review
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.statusOrderConfirmed
EXACT ENGLISH: Order Confirmed
CONTEXT: Order Tracking — status order confirmed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.statusAtelierProcessing
EXACT ENGLISH: Atelier Processing
CONTEXT: Order Tracking — status atelier processing
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.statusShippedTransit
EXACT ENGLISH: Shipped · In Transit
CONTEXT: Order Tracking — status shipped transit
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.statusOutForDelivery
EXACT ENGLISH: Out For Delivery
CONTEXT: Order Tracking — status out for delivery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.statusUnavailable
EXACT ENGLISH: Status Unavailable
CONTEXT: Order Tracking — status unavailable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.statusUnavailableWord
EXACT ENGLISH: unavailable
CONTEXT: Order Tracking — status unavailable word
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.errorReferenceRequired
EXACT ENGLISH: Enter your order number or tracking reference.
CONTEXT: Order Tracking — error reference required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.errorReferenceIncomplete
EXACT ENGLISH: That reference looks incomplete. Please enter the full order number or tracking ID.
CONTEXT: Order Tracking — error reference incomplete
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.errorEmailInvalid
EXACT ENGLISH: Enter a valid email address, or leave this field empty.
CONTEXT: Order Tracking — error email invalid
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.searchingFor
EXACT ENGLISH: Searching for "{query}".
CONTEXT: Order Tracking — searching for
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: interpolation: {query}
```

```
KEY: track.foundStatus
EXACT ENGLISH: Order {order} found. Current status: {status}.
CONTEXT: Order Tracking — found status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: interpolation: {order}, {status}
```

```
KEY: track.notFoundStatus
EXACT ENGLISH: No order matched "{query}".
CONTEXT: Order Tracking — not found status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: interpolation: {query}
```

```
KEY: track.serviceUnreachable
EXACT ENGLISH: We could not reach the tracking service.
CONTEXT: Order Tracking — service unreachable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.notFoundTitle
EXACT ENGLISH: We Could Not Match That Reference
CONTEXT: Order Tracking — not found title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.notFoundPrefix
EXACT ENGLISH: Nothing in our fulfilment records matches
CONTEXT: Order Tracking — not found prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.notFoundSuffix
EXACT ENGLISH: Please check the following and try again:
CONTEXT: Order Tracking — not found suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.notFoundTip1
EXACT ENGLISH: Order numbers look like HMS-20261002-4173 — watch for a missing digit or an extra space.
CONTEXT: Order Tracking — not found tip1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: track.notFoundTip2
EXACT ENGLISH: Tracking IDs are only issued once your parcel leaves the atelier, so a dispatch reference may not exist yet.
CONTEXT: Order Tracking — not found tip2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: track.notFoundTip3
EXACT ENGLISH: For guest checkouts, enter the email address used at checkout as well — it confirms the order belongs to you.
CONTEXT: Order Tracking — not found tip3
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: track.notFoundTip4
EXACT ENGLISH: If you signed in at checkout, your full order history is on your account page.
CONTEXT: Order Tracking — not found tip4
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: track.askConciergeWhatsapp
EXACT ENGLISH: Ask the Concierge on WhatsApp
CONTEXT: Order Tracking — ask concierge whatsapp
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.viewAccountOrders
EXACT ENGLISH: View My Account Orders
CONTEXT: Order Tracking — view account orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.unavailableTitle
EXACT ENGLISH: Tracking Is Temporarily Unavailable
CONTEXT: Order Tracking — unavailable title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.unavailableBody
EXACT ENGLISH: We could not reach our fulfilment service just now. This is usually a connection issue — please try again in a moment.
CONTEXT: Order Tracking — unavailable body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.askConcierge
EXACT ENGLISH: Ask the Concierge
CONTEXT: Order Tracking — ask concierge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.matchedOrder
EXACT ENGLISH: Matched Order
CONTEXT: Order Tracking — matched order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.courierHeading
EXACT ENGLISH: Courier & Tracking
CONTEXT: Order Tracking — courier heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.courierService
EXACT ENGLISH: Courier Service
CONTEXT: Order Tracking — courier service
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.deliveryTeamFallback
EXACT ENGLISH: our delivery team
CONTEXT: Order Tracking — delivery team fallback
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.trackingReference
EXACT ENGLISH: Tracking Reference
CONTEXT: Order Tracking — tracking reference
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.trackingIssuedOnDispatch
EXACT ENGLISH: Issued as soon as your parcel is dispatched
CONTEXT: Order Tracking — tracking issued on dispatch
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.shipmentStatus
EXACT ENGLISH: Shipment Status
CONTEXT: Order Tracking — shipment status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.estimatedDelivery
EXACT ENGLISH: Estimated Delivery
CONTEXT: Order Tracking — estimated delivery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.destinationCity
EXACT ENGLISH: Destination City
CONTEXT: Order Tracking — destination city
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.liveCarrierPage
EXACT ENGLISH: Live Carrier Page
CONTEXT: Order Tracking — live carrier page
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.newTabHint
EXACT ENGLISH: (opens the carrier website in a new tab)
CONTEXT: Order Tracking — new tab hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.copyReference
EXACT ENGLISH: Copy tracking reference {reference}
CONTEXT: Order Tracking — copy reference
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: interpolation: {reference}
```

```
KEY: track.copied
EXACT ENGLISH: Copied to clipboard
CONTEXT: Order Tracking — copied
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.paymentStatus
EXACT ENGLISH: Payment Status
CONTEXT: Order Tracking — payment status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.paymentMethod
EXACT ENGLISH: Payment Method
CONTEXT: Order Tracking — payment method
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.notRecorded
EXACT ENGLISH: Not recorded
CONTEXT: Order Tracking — not recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.giftWrapIncluded
EXACT ENGLISH: Signature Gift Wrap Included
CONTEXT: Order Tracking — gift wrap included
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.giftWrapBody
EXACT ENGLISH: Your order is marked for gift presentation. The atelier confirms what can be included before dispatch.
CONTEXT: Order Tracking — gift wrap body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.orderContents
EXACT ENGLISH: Order Contents
CONTEXT: Order Tracking — order contents
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.noItems
EXACT ENGLISH: Item details are not available for this order.
CONTEXT: Order Tracking — no items
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.sizeNotRecorded
EXACT ENGLISH: Size not recorded
CONTEXT: Order Tracking — size not recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.qty
EXACT ENGLISH: Qty {n}
CONTEXT: Order Tracking — qty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: interpolation: {n}
```

```
KEY: track.fulfilmentTimeline
EXACT ENGLISH: Fulfilment Timeline
CONTEXT: Order Tracking — fulfilment timeline
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.recorded
EXACT ENGLISH: recorded
CONTEXT: Order Tracking — recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.updateOne
EXACT ENGLISH: update
CONTEXT: Order Tracking — update one
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.updatesMany
EXACT ENGLISH: updates
CONTEXT: Order Tracking — updates many
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.trackAnotherOrder
EXACT ENGLISH: Track Another Order
CONTEXT: Order Tracking — track another order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.askAboutOrder
EXACT ENGLISH: Ask About This Order
CONTEXT: Order Tracking — ask about order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.myAccountOrders
EXACT ENGLISH: My Account Orders
CONTEXT: Order Tracking — my account orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.idleBody
EXACT ENGLISH: Have your order number or tracking reference ready. Guest orders also need the email address used at checkout so we can verify the order belongs to you.
CONTEXT: Order Tracking — idle body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.needHelp
EXACT ENGLISH: Need a hand?
CONTEXT: Order Tracking — need help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.messageConcierge
EXACT ENGLISH: Message the boutique concierge
CONTEXT: Order Tracking — message concierge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: track.referencePlaceholder
EXACT ENGLISH: HMS-20261002-4173 or HMS-TRK-8F42A91
CONTEXT: Order Tracking — reference placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

## Authentication

_189 string(s)_

```
KEY: account.privilegedMember
EXACT ENGLISH: HM SIGNATURE PRIVILEGED MEMBER
CONTEXT: Authentication — privileged member
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.welcomeBack
EXACT ENGLISH: Welcome back, {name}
CONTEXT: Authentication — welcome back
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: interpolation: {name}
```

```
KEY: account.valuedPatron
EXACT ENGLISH: Valued Patron
CONTEXT: Authentication — valued patron
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.adminWorkspace
EXACT ENGLISH: Admin Workspace
CONTEXT: Authentication — admin workspace
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.ordersTab
EXACT ENGLISH: Orders
CONTEXT: Authentication — orders tab
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: account.addressesTab
EXACT ENGLISH: Saved addresses
CONTEXT: Authentication — addresses tab
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.ordersEyebrow
EXACT ENGLISH: HAUTE PARFUMERIE ACQUISITIONS
CONTEXT: Authentication — orders eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.ordersTitle
EXACT ENGLISH: Your Fragrance Orders ({count})
CONTEXT: Authentication — orders title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx
NOTES: interpolation: {count}
```

```
KEY: account.browseCatalog
EXACT ENGLISH: Browse Catalog
CONTEXT: Authentication — browse catalog
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.loadingOrders
EXACT ENGLISH: Loading your orders
CONTEXT: Authentication — loading orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.ordersLoadError
EXACT ENGLISH: We could not load your orders.
CONTEXT: Authentication — orders load error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.tryAgain
EXACT ENGLISH: Try Again
CONTEXT: Authentication — try again
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx, src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: account.noOrdersTitle
EXACT ENGLISH: No Orders Found
CONTEXT: Authentication — no orders title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.noOrdersBody
EXACT ENGLISH: Your haute parfumerie acquisitions will appear here alongside real-time laboratory status and tracking details.
CONTEXT: Authentication — no orders body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.exploreFragrances
EXACT ENGLISH: Explore Fragrances
CONTEXT: Authentication — explore fragrances
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.refLabel
EXACT ENGLISH: REF #
CONTEXT: Authentication — ref label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.placedOn
EXACT ENGLISH: Placed on
CONTEXT: Authentication — placed on
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx, src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: account.itemsHeading
EXACT ENGLISH: ORDERED EXTRAITS & ACQUISITIONS
CONTEXT: Authentication — items heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.quantityPrefix
EXACT ENGLISH: Qty:
CONTEXT: Authentication — quantity prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: account.skuLabel
EXACT ENGLISH: SKU:
CONTEXT: Authentication — sku label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Account.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: account.each
EXACT ENGLISH: each
CONTEXT: Authentication — each
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx, src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: account.stepperHeading
EXACT ENGLISH: DISPATCH PROGRESS & LAB STATUS
CONTEXT: Authentication — stepper heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.stageOrderPlaced
EXACT ENGLISH: Order Placed
CONTEXT: Authentication — stage order placed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.stageOrderPlacedDesc
EXACT ENGLISH: Acquisition registered
CONTEXT: Authentication — stage order placed desc
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: account.stagePaymentConfirmed
EXACT ENGLISH: Payment Confirmed
CONTEXT: Authentication — stage payment confirmed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.stagePaymentConfirmedDesc
EXACT ENGLISH: Order validated
CONTEXT: Authentication — stage payment confirmed desc
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: account.stageAtelierHandcrafting
EXACT ENGLISH: Atelier Handcrafting
CONTEXT: Authentication — stage atelier handcrafting
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.stageAtelierHandcraftingDesc
EXACT ENGLISH: Batch formulation
CONTEXT: Authentication — stage atelier handcrafting desc
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: account.stageDispatchedDesc
EXACT ENGLISH: Handed to courier
CONTEXT: Authentication — stage dispatched desc
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: account.stageOutForDeliveryDesc
EXACT ENGLISH: Arriving today
CONTEXT: Authentication — stage out for delivery desc
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: account.stageDeliveredDesc
EXACT ENGLISH: Signed by recipient
CONTEXT: Authentication — stage delivered desc
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: account.orderStatusPrefix
EXACT ENGLISH: Order Status:
CONTEXT: Authentication — order status prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.cancelledOrderBody
EXACT ENGLISH: This order was cancelled. Please contact atelier concierge for refunds or assistance.
CONTEXT: Authentication — cancelled order body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.returnedOrderBody
EXACT ENGLISH: Items from this order were returned and processed at our atelier.
CONTEXT: Authentication — returned order body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.deliveryHeading
EXACT ENGLISH: DELIVERY DESTINATION
CONTEXT: Authentication — delivery heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx, src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.addressFallback
EXACT ENGLISH: Address provided at checkout
CONTEXT: Authentication — address fallback
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.estimatedDelivery
EXACT ENGLISH: Estimated delivery:
CONTEXT: Authentication — estimated delivery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.courierHeading
EXACT ENGLISH: COURIER & TRACKING DETAILS
CONTEXT: Authentication — courier heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.courierLabel
EXACT ENGLISH: Courier:
CONTEXT: Authentication — courier label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.toBeAdvised
EXACT ENGLISH: To be advised
CONTEXT: Authentication — to be advised
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.trackingIdLabel
EXACT ENGLISH: Tracking ID:
CONTEXT: Authentication — tracking id label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.awaitingIssue
EXACT ENGLISH: Awaiting issue
CONTEXT: Authentication — awaiting issue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.openCourierTracking
EXACT ENGLISH: Open courier tracking
CONTEXT: Authentication — open courier tracking
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.trackingPending
EXACT ENGLISH: Tracking will appear here once your order has been dispatched.
CONTEXT: Authentication — tracking pending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.timelineHeading
EXACT ENGLISH: ORDER TIMELINE
CONTEXT: Authentication — timeline heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.refundHeading
EXACT ENGLISH: REFUND RECORDS
CONTEXT: Authentication — refund heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.deliveryNotesHeading
EXACT ENGLISH: DELIVERY NOTES
CONTEXT: Authentication — delivery notes heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.notesEditableHint
EXACT ENGLISH: Add delivery instructions while the order is still being prepared.
CONTEXT: Authentication — notes editable hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.notesLockedHint
EXACT ENGLISH: Notes can no longer be edited on this order.
CONTEXT: Authentication — notes locked hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.track
EXACT ENGLISH: Track
CONTEXT: Authentication — track
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: account.saveNote
EXACT ENGLISH: Save Note
CONTEXT: Authentication — save note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.addNote
EXACT ENGLISH: Add Note
CONTEXT: Authentication — add note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.working
EXACT ENGLISH: Working…
CONTEXT: Authentication — working
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.cancelOrder
EXACT ENGLISH: Cancel Order
CONTEXT: Authentication — cancel order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.notesAriaLabel
EXACT ENGLISH: Delivery notes for this order
CONTEXT: Authentication — notes aria label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.notesPlaceholder
EXACT ENGLISH: e.g. Please call on arrival, the gate code is 4412.
CONTEXT: Authentication — notes placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Account.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: account.cancelPrompt
EXACT ENGLISH: Cancel order {number}? Please tell us briefly why (optional).
CONTEXT: Authentication — cancel prompt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: interpolation: {number}
```

```
KEY: account.orderCancelled
EXACT ENGLISH: Order {number} was cancelled. Any reserved stock has been returned to the atelier.
CONTEXT: Authentication — order cancelled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: interpolation: {number}
```

```
KEY: account.cancelFailed
EXACT ENGLISH: This order could not be cancelled.
CONTEXT: Authentication — cancel failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.noteSaved
EXACT ENGLISH: Your note was added to this order.
CONTEXT: Authentication — note saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.noteSaveFailed
EXACT ENGLISH: Your note could not be saved.
CONTEXT: Authentication — note save failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.jazzCashWallet
EXACT ENGLISH: JazzCash Wallet
CONTEXT: Authentication — jazz cash wallet
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.raastInstantId
EXACT ENGLISH: Raast Instant ID
CONTEXT: Authentication — raast instant id
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.bankWireTransfer
EXACT ENGLISH: Bank Wire Transfer
CONTEXT: Authentication — bank wire transfer
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.payfastCardGateway
EXACT ENGLISH: PayFast Card Gateway
CONTEXT: Authentication — payfast card gateway
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.cashOnDelivery
EXACT ENGLISH: Cash on Delivery
CONTEXT: Authentication — cash on delivery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.proofHeading
EXACT ENGLISH: Payment Receipt & Screenshot Upload
CONTEXT: Authentication — proof heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.paymentMethodTag
EXACT ENGLISH: {method} Payment
CONTEXT: Authentication — payment method tag
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: interpolation: {method}
```

```
KEY: account.proofReviewNote
EXACT ENGLISH: Payment proof will be reviewed by our team. Order status remains pending verification until approved.
CONTEXT: Authentication — proof review note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.proofSubmitted
EXACT ENGLISH: Your payment screenshot is with us. The atelier confirms receipt once it has been reviewed.
CONTEXT: Authentication — proof submitted
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.proofUnavailable
EXACT ENGLISH: Payment proof upload is unavailable right now. Please contact the concierge.
CONTEXT: Authentication — proof unavailable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.proofSessionExpired
EXACT ENGLISH: Your session has expired. Please sign in again to submit your payment proof.
CONTEXT: Authentication — proof session expired
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.proofUploadFailed
EXACT ENGLISH: Your payment screenshot could not be uploaded. Please try again.
CONTEXT: Authentication — proof upload failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.proofAttachFailed
EXACT ENGLISH: The screenshot was uploaded but could not be attached to your order. Please try again.
CONTEXT: Authentication — proof attach failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.proofSubmitFailed
EXACT ENGLISH: Your payment screenshot could not be submitted. Please try again.
CONTEXT: Authentication — proof submit failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.proofImageAlt
EXACT ENGLISH: Payment Receipt
CONTEXT: Authentication — proof image alt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.proofAttached
EXACT ENGLISH: Payment Proof Attached
CONTEXT: Authentication — proof attached
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.uploadedReceipt
EXACT ENGLISH: Uploaded Receipt
CONTEXT: Authentication — uploaded receipt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.removeProofTitle
EXACT ENGLISH: Remove the selected screenshot
CONTEXT: Authentication — remove proof title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.submitProof
EXACT ENGLISH: Submit Proof
CONTEXT: Authentication — submit proof
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.replaceProofTitle
EXACT ENGLISH: Attach a new payment screenshot
CONTEXT: Authentication — replace proof title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.replaceProof
EXACT ENGLISH: Replace Proof
CONTEXT: Authentication — replace proof
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.proofDropzoneLabel
EXACT ENGLISH: Click to select receipt screenshot
CONTEXT: Authentication — proof dropzone label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.proofFormatsHint
EXACT ENGLISH: Supports JPG, PNG, WEBP (Max 10MB)
CONTEXT: Authentication — proof formats hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: account.orderRecordNotFound
EXACT ENGLISH: Order Record Not Found
CONTEXT: Authentication — order record not found
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.orderRecordNotFoundBody
EXACT ENGLISH: We could not locate the requested order reference. Please check your account history.
CONTEXT: Authentication — order record not found body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.viewMyOrders
EXACT ENGLISH: VIEW MY ORDERS
CONTEXT: Authentication — view my orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.continueShopping
EXACT ENGLISH: CONTINUE SHOPPING
CONTEXT: Authentication — continue shopping
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.viewMyOrdersPlain
EXACT ENGLISH: View My Orders
CONTEXT: Authentication — view my orders plain
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.continueShoppingPlain
EXACT ENGLISH: Continue Shopping
CONTEXT: Authentication — continue shopping plain
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.orderReceived
EXACT ENGLISH: ORDER RECEIVED
CONTEXT: Authentication — order received
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.thankYouForOrder
EXACT ENGLISH: Thank you for your order
CONTEXT: Authentication — thank you for order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.orderReceivedBody
EXACT ENGLISH: Your HM Signature order has been received and is awaiting payment confirmation. Preparation begins once we have confirmed your payment.
CONTEXT: Authentication — order received body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.orderNumberLabel
EXACT ENGLISH: ORDER NUMBER
CONTEXT: Authentication — order number label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.trackingReferenceLabel
EXACT ENGLISH: Tracking Reference
CONTEXT: Authentication — tracking reference label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.assignedOnceDispatched
EXACT ENGLISH: Assigned once dispatched
CONTEXT: Authentication — assigned once dispatched
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.orderDateLabel
EXACT ENGLISH: Order Date
CONTEXT: Authentication — order date label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.paymentMethodLabel
EXACT ENGLISH: Payment Method
CONTEXT: Authentication — payment method label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.paymentStatusLabel
EXACT ENGLISH: Payment Status
CONTEXT: Authentication — payment status label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.orderStatusLabel
EXACT ENGLISH: Order Status
CONTEXT: Authentication — order status label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.fragranceExtraits
EXACT ENGLISH: Fragrance Extraits
CONTEXT: Authentication — fragrance extraits
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.qtyWord
EXACT ENGLISH: Qty
CONTEXT: Authentication — qty word
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: account.itemsSubtotal
EXACT ENGLISH: Items Subtotal
CONTEXT: Authentication — items subtotal
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.totalAmountPaidPayable
EXACT ENGLISH: Total Amount Paid / Payable
CONTEXT: Authentication — total amount paid payable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.trackThisOrder
EXACT ENGLISH: Track this order
CONTEXT: Authentication — track this order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: account.deliveryDestinations
EXACT ENGLISH: DELIVERY DESTINATIONS
CONTEXT: Authentication — delivery destinations
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.savedAddressesTitle
EXACT ENGLISH: Your Saved Addresses ({count})
CONTEXT: Authentication — saved addresses title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/components/AddressBook.tsx
NOTES: interpolation: {count}
```

```
KEY: account.addAddress
EXACT ENGLISH: Add address
CONTEXT: Authentication — add address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.editAddress
EXACT ENGLISH: Edit address
CONTEXT: Authentication — edit address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.addDeliveryAddress
EXACT ENGLISH: Add a delivery address
CONTEXT: Authentication — add delivery address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.cancelAddressForm
EXACT ENGLISH: Cancel address form
CONTEXT: Authentication — cancel address form
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.addressLabelField
EXACT ENGLISH: Label
CONTEXT: Authentication — address label field
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/components/AddressBook.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: account.addressLabelPlaceholder
EXACT ENGLISH: Home, Atelier apartment, Office…
CONTEXT: Authentication — address label placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.recipientName
EXACT ENGLISH: Recipient name
CONTEXT: Authentication — recipient name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.recipientNamePlaceholder
EXACT ENGLISH: Full name on the parcel
CONTEXT: Authentication — recipient name placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.streetAddress
EXACT ENGLISH: Street address
CONTEXT: Authentication — street address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.streetAddressPlaceholder
EXACT ENGLISH: House / apartment number and street
CONTEXT: Authentication — street address placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.apartmentOptional
EXACT ENGLISH: Apartment, floor (optional)
CONTEXT: Authentication — apartment optional
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.apartmentPlaceholder
EXACT ENGLISH: Flat, building, landmark
CONTEXT: Authentication — apartment placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.stateRegion
EXACT ENGLISH: State / region
CONTEXT: Authentication — state region
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.postalCodeField
EXACT ENGLISH: Postal code
CONTEXT: Authentication — postal code field
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.contactNumber
EXACT ENGLISH: Contact number
CONTEXT: Authentication — contact number
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.useAsDefault
EXACT ENGLISH: Use this as my default delivery address
CONTEXT: Authentication — use as default
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.saving
EXACT ENGLISH: Saving…
CONTEXT: Authentication — saving
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: account.saveChanges
EXACT ENGLISH: Save changes
CONTEXT: Authentication — save changes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.saveAddress
EXACT ENGLISH: Save address
CONTEXT: Authentication — save address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.loadingAddresses
EXACT ENGLISH: Loading your saved addresses…
CONTEXT: Authentication — loading addresses
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.noAddressesTitle
EXACT ENGLISH: No saved addresses yet
CONTEXT: Authentication — no addresses title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.noAddressesBody
EXACT ENGLISH: Save a delivery destination once and use it on your next order. You can also enter an address at checkout without signing in.
CONTEXT: Authentication — no addresses body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.defaultWord
EXACT ENGLISH: Default
CONTEXT: Authentication — default word
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx, src/components/AddressBook.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: account.setAsDefault
EXACT ENGLISH: Set as default
CONTEXT: Authentication — set as default
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.editWord
EXACT ENGLISH: Edit
CONTEXT: Authentication — edit word
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: account.confirmRemove
EXACT ENGLISH: Confirm remove
CONTEXT: Authentication — confirm remove
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.keep
EXACT ENGLISH: Keep
CONTEXT: Authentication — keep
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: account.addressSaved
EXACT ENGLISH: Your address was saved.
CONTEXT: Authentication — address saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.addressUpdated
EXACT ENGLISH: Your address was updated.
CONTEXT: Authentication — address updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.addressNotSaved
EXACT ENGLISH: The address was not saved. Please try again.
CONTEXT: Authentication — address not saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.defaultAddressUpdated
EXACT ENGLISH: Default delivery address updated.
CONTEXT: Authentication — default address updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.defaultAddressFailed
EXACT ENGLISH: That address could not be set as default.
CONTEXT: Authentication — default address failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.addressRemoved
EXACT ENGLISH: Your address was removed.
CONTEXT: Authentication — address removed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.addressNotRemoved
EXACT ENGLISH: The address could not be removed.
CONTEXT: Authentication — address not removed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

```
KEY: account.emailPreferences
EXACT ENGLISH: Email preferences
CONTEXT: Authentication — email preferences
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CommunicationPreferences.tsx
NOTES: —
```

```
KEY: account.emailPreferencesHint
EXACT ENGLISH: Chosen by you and stored against your account.
CONTEXT: Authentication — email preferences hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/components/CommunicationPreferences.tsx
NOTES: —
```

```
KEY: account.promotionalReminders
EXACT ENGLISH: Promotional reminders
CONTEXT: Authentication — promotional reminders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CommunicationPreferences.tsx
NOTES: —
```

```
KEY: account.promotionalRemindersBody
EXACT ENGLISH: A single reminder if you leave a saved bag unpaid for a while. Nothing is sent about promotions you have not asked for, and switching this off stops the reminder at once.
CONTEXT: Authentication — promotional reminders body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CommunicationPreferences.tsx
NOTES: —
```

```
KEY: account.transactionalEmailsBody
EXACT ENGLISH: Order confirmations, payment receipts and delivery notices are part of your purchase and are not switched off here.
CONTEXT: Authentication — transactional emails body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CommunicationPreferences.tsx
NOTES: —
```

```
KEY: account.savingUpper
EXACT ENGLISH: SAVING…
CONTEXT: Authentication — saving upper
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CommunicationPreferences.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: account.savePreference
EXACT ENGLISH: Save preference
CONTEXT: Authentication — save preference
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CommunicationPreferences.tsx
NOTES: —
```

```
KEY: account.loadingChoice
EXACT ENGLISH: Loading your choice…
CONTEXT: Authentication — loading choice
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/CommunicationPreferences.tsx
NOTES: —
```

```
KEY: account.prefSavedMarketing
EXACT ENGLISH: Saved. A reminder may reach you if you leave a saved bag unpaid.
CONTEXT: Authentication — pref saved marketing
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/components/CommunicationPreferences.tsx
NOTES: —
```

```
KEY: account.prefSavedOff
EXACT ENGLISH: Saved. Promotional reminders are turned off for this account.
CONTEXT: Authentication — pref saved off
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/components/CommunicationPreferences.tsx
NOTES: —
```

```
KEY: account.prefSaveFailed
EXACT ENGLISH: Your choice could not be saved. Please try again.
CONTEXT: Authentication — pref save failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/components/CommunicationPreferences.tsx
NOTES: —
```

```
KEY: auth.tagline
EXACT ENGLISH: LUXURY PERFUMERY WORKSPACE
CONTEXT: Authentication — tagline
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.signInTitle
EXACT ENGLISH: Sign In to HM Signature
CONTEXT: Authentication — sign in title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.signUpTitle
EXACT ENGLISH: Join the House of HM Signature
CONTEXT: Authentication — sign up title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.signInSubtitle
EXACT ENGLISH: Access your client concierge or staff administrative portal.
CONTEXT: Authentication — sign in subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.signUpSubtitle
EXACT ENGLISH: Create your personal client account to experience bespoke fragrances.
CONTEXT: Authentication — sign up subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.fullNameLabel
EXACT ENGLISH: Full Name
CONTEXT: Authentication — full name label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Contact.tsx, src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.fullNamePlaceholder
EXACT ENGLISH: As you would like it on your orders
CONTEXT: Authentication — full name placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.emailLabel
EXACT ENGLISH: Email Address
CONTEXT: Authentication — email label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Contact.tsx, src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.passwordLabel
EXACT ENGLISH: Password
CONTEXT: Authentication — password label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/AdminLogin.tsx, src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.forgotPassword
EXACT ENGLISH: Forgot Password?
CONTEXT: Authentication — forgot password
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.showPassword
EXACT ENGLISH: Show password
CONTEXT: Authentication — show password
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminLogin.tsx, src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.hidePassword
EXACT ENGLISH: Hide password
CONTEXT: Authentication — hide password
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminLogin.tsx, src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.rememberMe
EXACT ENGLISH: Remember me on this browser
CONTEXT: Authentication — remember me
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.signIn
EXACT ENGLISH: Sign In
CONTEXT: Authentication — sign in
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.signUpCta
EXACT ENGLISH: Create Client Account
CONTEXT: Authentication — sign up cta
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.noAccount
EXACT ENGLISH: Don't have an account?
CONTEXT: Authentication — no account
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.createAccount
EXACT ENGLISH: Create account
CONTEXT: Authentication — create account
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.haveAccount
EXACT ENGLISH: Already have an account?
CONTEXT: Authentication — have account
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.signInHere
EXACT ENGLISH: Sign in here
CONTEXT: Authentication — sign in here
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.invalidCredentials
EXACT ENGLISH: Invalid email or password
CONTEXT: Authentication — invalid credentials
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.signUpFailed
EXACT ENGLISH: Failed to create account.
CONTEXT: Authentication — sign up failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.emailConfirmationSent
EXACT ENGLISH: Account created. Please check your inbox to confirm your email, then sign in.
CONTEXT: Authentication — email confirmation sent
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.accountCreated
EXACT ENGLISH: Account created successfully. Welcome to HM Signature.
CONTEXT: Authentication — account created
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.passwordRecoveryTitle
EXACT ENGLISH: Password Recovery
CONTEXT: Authentication — password recovery title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.closePasswordRecovery
EXACT ENGLISH: Close password recovery
CONTEXT: Authentication — close password recovery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.resetInstructionsSent
EXACT ENGLISH: Password Reset Instructions Sent
CONTEXT: Authentication — reset instructions sent
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.resetCheckInboxPrefix
EXACT ENGLISH: Check your inbox at
CONTEXT: Authentication — reset check inbox prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.resetCheckInboxSuffix
EXACT ENGLISH: for further steps.
CONTEXT: Authentication — reset check inbox suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.resetLinkVerified
EXACT ENGLISH: Your reset link was verified. Choose a new password for your account.
CONTEXT: Authentication — reset link verified
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.newPasswordLabel
EXACT ENGLISH: New Password
CONTEXT: Authentication — new password label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.newPasswordHint
EXACT ENGLISH: At least 6 characters.
CONTEXT: Authentication — new password hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.forgotPasswordHelp
EXACT ENGLISH: Enter the email address associated with your account and we will send you instructions to reset your password.
CONTEXT: Authentication — forgot password help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.setNewPassword
EXACT ENGLISH: Set New Password
CONTEXT: Authentication — set new password
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.sendInstructions
EXACT ENGLISH: Send Instructions
CONTEXT: Authentication — send instructions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.resetFailed
EXACT ENGLISH: Could not reset password.
CONTEXT: Authentication — reset failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.passwordUpdated
EXACT ENGLISH: Password updated. You are signed in.
CONTEXT: Authentication — password updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: auth.resetSendFailed
EXACT ENGLISH: Could not send reset instructions.
CONTEXT: Authentication — reset send failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Login.tsx
NOTES: —
```

## FAQ

_17 string(s)_

```
KEY: faq.eyebrow
EXACT ENGLISH: HELP CENTER
CONTEXT: FAQ — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/FAQ.tsx
NOTES: —
```

```
KEY: faq.title
EXACT ENGLISH: Frequently Asked Questions
CONTEXT: FAQ — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/FAQ.tsx
NOTES: —
```

```
KEY: faq.intro
EXACT ENGLISH: Everything you need to know before your next signature scent.
CONTEXT: FAQ — intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/FAQ.tsx
NOTES: —
```

```
KEY: faq.question1
EXACT ENGLISH: How long does an HM Signature fragrance last?
CONTEXT: FAQ — question1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.answer1
EXACT ENGLISH: Our fragrances are formulated as Extrait de Parfum — the most concentrated form of perfume. Because they are concentrated, a little goes far, and how a scent develops depends on your skin, so no two wear the same way.
CONTEXT: FAQ — answer1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.question2
EXACT ENGLISH: Are HM Signature fragrances unisex?
CONTEXT: FAQ — question2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.answer2
EXACT ENGLISH: Several of our fragrances are designed to be worn by anyone, while others lean toward traditionally masculine or feminine profiles. Each product page lists the intended gender, but we encourage you to wear whatever moves you.
CONTEXT: FAQ — answer2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.question3
EXACT ENGLISH: How do I choose the right fragrance for me?
CONTEXT: FAQ — question3
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.answer3
EXACT ENGLISH: Take our Scent Finder — seven questions that match your preferences to one of our signature blends. Every question can be skipped, and you can retake it as many times as you like.
CONTEXT: FAQ — answer3
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.question4
EXACT ENGLISH: Do you offer samples or discovery sets?
CONTEXT: FAQ — question4
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.answer4
EXACT ENGLISH: Not at this time, but our boutique team is happy to help you choose confidently — reach out via our Contact page with any questions before you order.
CONTEXT: FAQ — answer4
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.question5
EXACT ENGLISH: What payment methods do you accept?
CONTEXT: FAQ — question5
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.answer5
EXACT ENGLISH: Raast, JazzCash, direct bank transfer and cash on delivery. Card payments are not live yet. Payment instructions appear at checkout.
CONTEXT: FAQ — answer5
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.question6
EXACT ENGLISH: Can I return a fragrance if I don't like the scent?
CONTEXT: FAQ — question6
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.answer6
EXACT ENGLISH: Unopened, unused items may be returned within 30 days of delivery for a full refund. See our Returns & Exchanges page for full details.
CONTEXT: FAQ — answer6
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.question7
EXACT ENGLISH: Do you ship internationally?
CONTEXT: FAQ — question7
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: faq.answer7
EXACT ENGLISH: Currently we ship within Pakistan only. International shipping is not available yet.
CONTEXT: FAQ — answer7
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

## Journal

_4 string(s)_

```
KEY: journal.title
EXACT ENGLISH: Stories of Scent & Craft
CONTEXT: Journal — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Journal.tsx
NOTES: —
```

```
KEY: journal.issue
EXACT ENGLISH: JOURNAL · 0{n}
CONTEXT: Journal — issue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Journal.tsx
NOTES: interpolation: {n}
```

```
KEY: journal.articleBody
EXACT ENGLISH: A closer look at the craftsmanship, history and sensory detail that goes into every HM Signature creation — for those who want to understand the story behind the scent.
CONTEXT: Journal — article body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Journal.tsx
NOTES: —
```

```
KEY: journal.fullEssays
EXACT ENGLISH: Full essays accompany each release.
CONTEXT: Journal — full essays
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Journal.tsx
NOTES: —
```

## Contact

_24 string(s)_

```
KEY: contact.eyebrow
EXACT ENGLISH: GET IN TOUCH
CONTEXT: Contact — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.title
EXACT ENGLISH: Contact Us
CONTEXT: Contact — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.intro
EXACT ENGLISH: Questions about a fragrance, an order, or a private consultation — our team is here to help.
CONTEXT: Contact — intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.formTitle
EXACT ENGLISH: Send a Message
CONTEXT: Contact — form title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.sentTitle
EXACT ENGLISH: Message sent
CONTEXT: Contact — sent title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.sentBody
EXACT ENGLISH: Your enquiry has reached our inbox. We reply during working hours, Monday to Saturday.
CONTEXT: Contact — sent body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.failedTitle
EXACT ENGLISH: Not sent
CONTEXT: Contact — failed title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.failedBody
EXACT ENGLISH: Your message was not sent. This form forwards through the atelier inbox and needs you to be signed in, and it stays unavailable while this deployment has no email service configured. Open WhatsApp to reach us, or sign in and try again.
CONTEXT: Contact — failed body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.openWhatsappCta
EXACT ENGLISH: OPEN WHATSAPP →
CONTEXT: Contact — open whatsapp cta
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.editMessage
EXACT ENGLISH: Edit the message
CONTEXT: Contact — edit message
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.fieldSubject
EXACT ENGLISH: Subject
CONTEXT: Contact — field subject
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Contact.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: contact.fieldMessage
EXACT ENGLISH: MESSAGE
CONTEXT: Contact — field message
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Contact.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: contact.signInHelpPrefix
EXACT ENGLISH: Signing in lets this form reach the atelier inbox.
CONTEXT: Contact — sign in help prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.signInLink
EXACT ENGLISH: Sign in
CONTEXT: Contact — sign in link
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.signInHelpSuffix
EXACT ENGLISH: — or use WhatsApp and the details above, which work without an account.
CONTEXT: Contact — sign in help suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.sending
EXACT ENGLISH: SENDING…
CONTEXT: Contact — sending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.submit
EXACT ENGLISH: SEND MESSAGE →
CONTEXT: Contact — submit
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.labelBoutique
EXACT ENGLISH: BOUTIQUE
CONTEXT: Contact — label boutique
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.labelPhone
EXACT ENGLISH: PHONE
CONTEXT: Contact — label phone
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Contact.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: contact.labelEmail
EXACT ENGLISH: EMAIL
CONTEXT: Contact — label email
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Contact.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: contact.labelHours
EXACT ENGLISH: HOURS
CONTEXT: Contact — label hours
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Contact.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: contact.hoursValue
EXACT ENGLISH: Mon – Sat, 11:00 AM – 8:00 PM
CONTEXT: Contact — hours value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: contact.whatsappBody
EXACT ENGLISH: Chat with us instantly — +92 321 8602034
CONTEXT: Contact — whatsapp body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

```
KEY: contact.mapsCta
EXACT ENGLISH: OPEN IN GOOGLE MAPS →
CONTEXT: Contact — maps cta
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/pages/Contact.tsx
NOTES: —
```

## Legal & Policy Pages

_96 string(s)_

```
KEY: legal.eyebrow
EXACT ENGLISH: LEGAL
CONTEXT: Legal & Policy Pages — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/components/LegalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: legal.lastUpdated
EXACT ENGLISH: Last updated: {date}
CONTEXT: Legal & Policy Pages — last updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/LegalPage.tsx
NOTES: interpolation: {date}
```

```
KEY: legal.updatedDate
EXACT ENGLISH: September 2026
CONTEXT: Legal & Policy Pages — updated date
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/pages/PrivacyPolicy.tsx, src/pages/RefundPolicy.tsx, src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.privacyCollectTitle
EXACT ENGLISH: Information We Collect
CONTEXT: Legal & Policy Pages — privacy collect title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: legal.privacyCollectBody1
EXACT ENGLISH: When you place an order, create an account, or contact us, we collect information such as your name, email address, phone number, shipping address, and payment details necessary to fulfil your order.
CONTEXT: Legal & Policy Pages — privacy collect body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: legal.privacyCollectBody2
EXACT ENGLISH: We also collect basic usage data — pages visited, items viewed, and cart activity — to improve your shopping experience.
CONTEXT: Legal & Policy Pages — privacy collect body2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: legal.privacyUseTitle
EXACT ENGLISH: How We Use Your Information
CONTEXT: Legal & Policy Pages — privacy use title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: legal.privacyUseBody1
EXACT ENGLISH: Your information is used to process orders, provide customer support, personalize recommendations (such as Scent Finder results), and send order updates or marketing communications you've opted into.
CONTEXT: Legal & Policy Pages — privacy use body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: legal.privacyUseBody2
EXACT ENGLISH: We never sell your personal information to third parties.
CONTEXT: Legal & Policy Pages — privacy use body2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: legal.privacySecurityTitle
EXACT ENGLISH: Data Storage & Security
CONTEXT: Legal & Policy Pages — privacy security title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: legal.privacySecurityBody1
EXACT ENGLISH: We take reasonable technical and organizational measures to protect your data from unauthorized access, alteration, or disclosure. Payment details are processed through secure, encrypted channels.
CONTEXT: Legal & Policy Pages — privacy security body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: legal.privacyCookiesTitle
EXACT ENGLISH: Cookies
CONTEXT: Legal & Policy Pages — privacy cookies title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: legal.privacyCookiesBody1
EXACT ENGLISH: Our site uses cookies and local storage to remember your cart, wishlist, and preferences between visits. You can clear these at any time through your browser settings.
CONTEXT: Legal & Policy Pages — privacy cookies body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: legal.privacyRightsTitle
EXACT ENGLISH: Your Rights
CONTEXT: Legal & Policy Pages — privacy rights title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: legal.privacyRightsBody1
EXACT ENGLISH: You may request access to, correction of, or deletion of your personal data at any time by contacting us through our Contact page.
CONTEXT: Legal & Policy Pages — privacy rights body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: legal.termsAcceptanceTitle
EXACT ENGLISH: Acceptance of Terms
CONTEXT: Legal & Policy Pages — terms acceptance title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.termsAcceptanceBody1
EXACT ENGLISH: By accessing or using the HM Signature website, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use this site.
CONTEXT: Legal & Policy Pages — terms acceptance body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.termsOrdersTitle
EXACT ENGLISH: Orders & Pricing
CONTEXT: Legal & Policy Pages — terms orders title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.termsOrdersBody1
EXACT ENGLISH: All prices are listed in Pakistani Rupees (Rs) and are subject to change without prior notice. We reserve the right to refuse or cancel any order at our discretion, including in cases of suspected fraud or pricing errors.
CONTEXT: Legal & Policy Pages — terms orders body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.termsProductTitle
EXACT ENGLISH: Product Information
CONTEXT: Legal & Policy Pages — terms product title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.termsProductBody1
EXACT ENGLISH: We make every effort to display our fragrances accurately, including notes, concentration, and packaging. Minor variations in batch or bottle design may occur and do not affect the fragrance quality.
CONTEXT: Legal & Policy Pages — terms product body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.termsIpTitle
EXACT ENGLISH: Intellectual Property
CONTEXT: Legal & Policy Pages — terms ip title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.termsIpBody1
EXACT ENGLISH: All content on this site — including the HM Signature name, logo, product photography, and written copy — is the property of HM Signature and may not be reproduced without permission.
CONTEXT: Legal & Policy Pages — terms ip body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.termsLiabilityTitle
EXACT ENGLISH: Limitation of Liability
CONTEXT: Legal & Policy Pages — terms liability title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.termsLiabilityBody1
EXACT ENGLISH: HM Signature is not liable for any indirect or consequential damages arising from the use of our products or website, to the fullest extent permitted by law.
CONTEXT: Legal & Policy Pages — terms liability body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.termsLawTitle
EXACT ENGLISH: Governing Law
CONTEXT: Legal & Policy Pages — terms law title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.termsLawBody1
EXACT ENGLISH: These terms are governed by the laws of Pakistan, and any disputes shall be subject to the exclusive jurisdiction of the courts of Karachi.
CONTEXT: Legal & Policy Pages — terms law body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: legal.refundEligibilityTitle
EXACT ENGLISH: Eligibility
CONTEXT: Legal & Policy Pages — refund eligibility title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/RefundPolicy.tsx
NOTES: —
```

```
KEY: legal.refundEligibilityBody1
EXACT ENGLISH: Refunds are available for unopened, unused fragrances returned within 30 days of delivery in their original packaging. See our Returns & Exchanges page for the full process.
CONTEXT: Legal & Policy Pages — refund eligibility body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/RefundPolicy.tsx
NOTES: —
```

```
KEY: legal.refundMethodTitle
EXACT ENGLISH: Refund Method
CONTEXT: Legal & Policy Pages — refund method title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/RefundPolicy.tsx
NOTES: —
```

```
KEY: legal.refundMethodBody1
EXACT ENGLISH: Approved refunds are issued to the account you paid from within 7 business days of us receiving the returned item. Cash-on-delivery orders are refunded via bank transfer.
CONTEXT: Legal & Policy Pages — refund method body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/RefundPolicy.tsx
NOTES: —
```

```
KEY: legal.refundDamagedTitle
EXACT ENGLISH: Damaged or Defective Items
CONTEXT: Legal & Policy Pages — refund damaged title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/RefundPolicy.tsx
NOTES: —
```

```
KEY: legal.refundDamagedBody1
EXACT ENGLISH: If your order arrives damaged or defective, contact us within 48 hours of delivery with photos of the item and packaging for a full refund or free replacement — no return shipping required.
CONTEXT: Legal & Policy Pages — refund damaged body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/RefundPolicy.tsx
NOTES: —
```

```
KEY: legal.refundExcludedTitle
EXACT ENGLISH: Non-Refundable Situations
CONTEXT: Legal & Policy Pages — refund excluded title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/RefundPolicy.tsx
NOTES: —
```

```
KEY: legal.refundExcludedBody1
EXACT ENGLISH: Opened or used fragrances, and items returned after the 30-day window, are not eligible for a refund.
CONTEXT: Legal & Policy Pages — refund excluded body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/RefundPolicy.tsx
NOTES: —
```

```
KEY: legal.refundShippingTitle
EXACT ENGLISH: Shipping Costs
CONTEXT: Legal & Policy Pages — refund shipping title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/RefundPolicy.tsx
NOTES: —
```

```
KEY: legal.refundShippingBody1
EXACT ENGLISH: Original shipping fees are non-refundable unless the return is due to our error (wrong or damaged item).
CONTEXT: Legal & Policy Pages — refund shipping body1
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/RefundPolicy.tsx
NOTES: —
```

```
KEY: legal.returnsIntro
EXACT ENGLISH: We want you to love your signature scent — here's how we make it right if you don't.
CONTEXT: Legal & Policy Pages — returns intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsWindowTitle
EXACT ENGLISH: 30-Day Window
CONTEXT: Legal & Policy Pages — returns window title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsWindowBody
EXACT ENGLISH: Returns accepted within 30 days of delivery.
CONTEXT: Legal & Policy Pages — returns window body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsUnopenedTitle
EXACT ENGLISH: Unopened Only
CONTEXT: Legal & Policy Pages — returns unopened title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsUnopenedBody
EXACT ENGLISH: Items must be unused, sealed, and in original packaging.
CONTEXT: Legal & Policy Pages — returns unopened body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsFullRefundTitle
EXACT ENGLISH: Full Refund
CONTEXT: Legal & Policy Pages — returns full refund title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsFullRefundBody
EXACT ENGLISH: Refunded to the account you paid from, within 7 business days.
CONTEXT: Legal & Policy Pages — returns full refund body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsHowTitle
EXACT ENGLISH: How to Start a Return
CONTEXT: Legal & Policy Pages — returns how title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsHowBodyPrefix
EXACT ENGLISH: Contact our team via the
CONTEXT: Legal & Policy Pages — returns how body prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsHowBodySuffix
EXACT ENGLISH: with your order number and reason for return. We'll reply with return instructions and the address to send the item to.
CONTEXT: Legal & Policy Pages — returns how body suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsExchangesTitle
EXACT ENGLISH: Exchanges
CONTEXT: Legal & Policy Pages — returns exchanges title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsExchangesBody
EXACT ENGLISH: Prefer a different fragrance? We're happy to exchange an unopened item for another HM Signature product of equal or lesser value — any price difference for a higher-priced item can be paid at the time of exchange.
CONTEXT: Legal & Policy Pages — returns exchanges body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsNonReturnableTitle
EXACT ENGLISH: Non-Returnable Items
CONTEXT: Legal & Policy Pages — returns non returnable title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsNonReturnableBody
EXACT ENGLISH: For hygiene reasons, opened or used fragrances cannot be returned or exchanged unless the product arrived damaged or defective.
CONTEXT: Legal & Policy Pages — returns non returnable body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsDamagedTitle
EXACT ENGLISH: Damaged or Incorrect Orders
CONTEXT: Legal & Policy Pages — returns damaged title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.returnsDamagedBody
EXACT ENGLISH: If your order arrives damaged or you received the wrong item, contact us within 48 hours of delivery with photos of the product and packaging, and we'll arrange a free replacement or full refund.
CONTEXT: Legal & Policy Pages — returns damaged body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: legal.deliveryIntro
EXACT ENGLISH: Every order is packaged with the same care as the fragrance inside it.
CONTEXT: Legal & Policy Pages — delivery intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ShippingDelivery.tsx
NOTES: —
```

```
KEY: legal.deliveryProcessingTitle
EXACT ENGLISH: Processing Time
CONTEXT: Legal & Policy Pages — delivery processing title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ShippingDelivery.tsx
NOTES: —
```

```
KEY: legal.deliveryProcessingBody
EXACT ENGLISH: Orders enter preparation once your payment is confirmed; cash-on-delivery orders begin as soon as the order is placed.
CONTEXT: Legal & Policy Pages — delivery processing body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.deliveryTimeTitle
EXACT ENGLISH: Delivery Time
CONTEXT: Legal & Policy Pages — delivery time title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ShippingDelivery.tsx
NOTES: —
```

```
KEY: legal.deliveryTimeBody
EXACT ENGLISH: Standard delivery across Pakistan is estimated at {days}. Remote areas can take longer than the estimate.
CONTEXT: Legal & Policy Pages — delivery time body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · interpolation: {days} · [REVIEW POSSIBLE]
```

```
KEY: legal.deliveryCoverageTitle
EXACT ENGLISH: Coverage
CONTEXT: Legal & Policy Pages — delivery coverage title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ShippingDelivery.tsx
NOTES: —
```

```
KEY: legal.deliveryCoverageBody
EXACT ENGLISH: We deliver nationwide across Pakistan. International shipping is not available at this time.
CONTEXT: Legal & Policy Pages — delivery coverage body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.deliveryCostsTitle
EXACT ENGLISH: Shipping Costs
CONTEXT: Legal & Policy Pages — delivery costs title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ShippingDelivery.tsx
NOTES: —
```

```
KEY: legal.deliveryCostsBody
EXACT ENGLISH: Free shipping on orders of {threshold} or more. Below that threshold, a flat delivery fee of {cost} applies.
CONTEXT: Legal & Policy Pages — delivery costs body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · interpolation: {threshold}, {cost} · [REVIEW POSSIBLE]
```

```
KEY: legal.deliveryTrackingPrefix
EXACT ENGLISH: A tracking reference is assigned when your order is dispatched. You can check your order status any time on our
CONTEXT: Legal & Policy Pages — delivery tracking prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/pages/ShippingDelivery.tsx
NOTES: —
```

```
KEY: legal.deliveryTrackingSuffix
EXACT ENGLISH: page.
CONTEXT: Legal & Policy Pages — delivery tracking suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ShippingDelivery.tsx
NOTES: —
```

```
KEY: legal.deliveryAccuracyBody
EXACT ENGLISH: Please ensure your delivery address and phone number are accurate at checkout — HM Signature is not responsible for delays caused by incorrect address details.
CONTEXT: Legal & Policy Pages — delivery accuracy body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ShippingDelivery.tsx
NOTES: —
```

```
KEY: legal.parentEyebrow
EXACT ENGLISH: OUR PARENT COMPANY
CONTEXT: Legal & Policy Pages — parent eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/ParentCompany.tsx
NOTES: —
```

```
KEY: legal.parentIntro
EXACT ENGLISH: HM Signature is a brand under Xeltrio Technologies Private Limited — an AI product company building intelligent solutions for a better tomorrow.
CONTEXT: Legal & Policy Pages — parent intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ParentCompany.tsx
NOTES: —
```

```
KEY: legal.parentPillarAi
EXACT ENGLISH: Artificial Intelligence
CONTEXT: Legal & Policy Pages — parent pillar ai
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ParentCompany.tsx
NOTES: —
```

```
KEY: legal.parentPillarAutomation
EXACT ENGLISH: Automation Solutions
CONTEXT: Legal & Policy Pages — parent pillar automation
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ParentCompany.tsx
NOTES: —
```

```
KEY: legal.parentPillarSoftware
EXACT ENGLISH: Software Development
CONTEXT: Legal & Policy Pages — parent pillar software
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ParentCompany.tsx
NOTES: —
```

```
KEY: legal.parentPillarCloud
EXACT ENGLISH: Cloud & Enterprise
CONTEXT: Legal & Policy Pages — parent pillar cloud
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ParentCompany.tsx
NOTES: —
```

```
KEY: legal.parentPillarTransformation
EXACT ENGLISH: Digital Transformation
CONTEXT: Legal & Policy Pages — parent pillar transformation
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/ParentCompany.tsx
NOTES: —
```

```
KEY: legal.parentTagline
EXACT ENGLISH: INNOVATE  •  AUTOMATE  •  ELEVATE
CONTEXT: Legal & Policy Pages — parent tagline
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ParentCompany.tsx
NOTES: —
```

```
KEY: legal.parentVisitCta
EXACT ENGLISH: VISIT XELTRIO TECHNOLOGIES
CONTEXT: Legal & Policy Pages — parent visit cta
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/pages/ParentCompany.tsx
NOTES: —
```

```
KEY: legal.ingredientsEyebrow
EXACT ENGLISH: CRAFTSMANSHIP
CONTEXT: Legal & Policy Pages — ingredients eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/pages/Ingredients.tsx
NOTES: —
```

```
KEY: legal.ingredientsTitle
EXACT ENGLISH: Our Ingredients
CONTEXT: Legal & Policy Pages — ingredients title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Ingredients.tsx
NOTES: —
```

```
KEY: legal.ingredientsIntro
EXACT ENGLISH: What goes into a bottle matters as much as what it says on the label.
CONTEXT: Legal & Policy Pages — ingredients intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/pages/Ingredients.tsx
NOTES: —
```

```
KEY: legal.ingredientsSourcedTitle
EXACT ENGLISH: Sourced Globally
CONTEXT: Legal & Policy Pages — ingredients sourced title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Ingredients.tsx
NOTES: —
```

```
KEY: legal.ingredientsSourcedBody
EXACT ENGLISH: Our raw materials come from established suppliers across several growing regions — rose, sandalwood and oud among them — chosen for the character those origins give them.
CONTEXT: Legal & Policy Pages — ingredients sourced body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.ingredientsConcentrationTitle
EXACT ENGLISH: High Concentration
CONTEXT: Legal & Policy Pages — ingredients concentration title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Ingredients.tsx
NOTES: —
```

```
KEY: legal.ingredientsConcentrationBody
EXACT ENGLISH: Every HM Signature fragrance is formulated as an Extrait de Parfum — a higher aromatic concentration than eau de parfum or eau de toilette. How a fragrance then behaves depends on the skin it is worn on.
CONTEXT: Legal & Policy Pages — ingredients concentration body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.ingredientsNaturalsTitle
EXACT ENGLISH: Naturals & Fine Synthetics
CONTEXT: Legal & Policy Pages — ingredients naturals title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Ingredients.tsx
NOTES: —
```

```
KEY: legal.ingredientsNaturalsBody
EXACT ENGLISH: We blend natural absolutes and essential oils with fine synthetic molecules where they serve the composition — for character, stability or sustainability — never to cut cost or corners.
CONTEXT: Legal & Policy Pages — ingredients naturals body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.ingredientsSafetyTitle
EXACT ENGLISH: Safety & Disclosure
CONTEXT: Legal & Policy Pages — ingredients safety title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Ingredients.tsx
NOTES: —
```

```
KEY: legal.ingredientsSafetyBody
EXACT ENGLISH: We formulate to fragrance-industry safety guidance. Where a fragrance has a published ingredient declaration, it appears on its product page.
CONTEXT: Legal & Policy Pages — ingredients safety body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.ingredientsFamiliesTitle
EXACT ENGLISH: Our Fragrance Families
CONTEXT: Legal & Policy Pages — ingredients families title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Ingredients.tsx
NOTES: —
```

```
KEY: legal.familyOudAmber
EXACT ENGLISH: Oud & Amber
CONTEXT: Legal & Policy Pages — family oud amber
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.familyOudAmberDesc
EXACT ENGLISH: Deep, resinous, and warm — built around oud and amber notes.
CONTEXT: Legal & Policy Pages — family oud amber desc
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.familyWhiteFlorals
EXACT ENGLISH: White Florals
CONTEXT: Legal & Policy Pages — family white florals
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.familyWhiteFloralsDesc
EXACT ENGLISH: Jasmine, tuberose, and orange blossom — luminous and romantic.
CONTEXT: Legal & Policy Pages — family white florals desc
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.familyWoodsMusks
EXACT ENGLISH: Woods & Musks
CONTEXT: Legal & Policy Pages — family woods musks
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.familyWoodsMusksDesc
EXACT ENGLISH: Cedar, vetiver, and clean musks — the quiet confidence in our fresher blends.
CONTEXT: Legal & Policy Pages — family woods musks desc
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.familyGourmand
EXACT ENGLISH: Gourmand Accords
CONTEXT: Legal & Policy Pages — family gourmand
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.familyGourmandDesc
EXACT ENGLISH: Vanilla, tonka bean, and praline — comforting warmth in our amber creations.
CONTEXT: Legal & Policy Pages — family gourmand desc
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: legal.ingredientsClosingPrefix
EXACT ENGLISH: Ingredient listings are published on each product page under the "Ingredients" tab as soon as the atelier finalises them; where one is not yet shown, the page says so. For allergen information or specific sensitivities, please reach out via our
CONTEXT: Legal & Policy Pages — ingredients closing prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Ingredients.tsx
NOTES: —
```

```
KEY: legal.ingredientsClosingSuffix
EXACT ENGLISH: before ordering.
CONTEXT: Legal & Policy Pages — ingredients closing suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Ingredients.tsx
NOTES: —
```

## Footer

_25 string(s)_

```
KEY: footer.tagline
EXACT ENGLISH: Extrait de parfum blends, shipped across Pakistan.
CONTEXT: Footer — tagline
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/App.tsx, src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.shop
EXACT ENGLISH: SHOP
CONTEXT: Footer — shop
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: footer.discover
EXACT ENGLISH: DISCOVER
CONTEXT: Footer — discover
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.customerCare
EXACT ENGLISH: CUSTOMER CARE
CONTEXT: Footer — customer care
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx, src/pages/ReturnsExchanges.tsx, src/pages/ShippingDelivery.tsx
NOTES: —
```

```
KEY: footer.followUs
EXACT ENGLISH: FOLLOW US
CONTEXT: Footer — follow us
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.collections
EXACT ENGLISH: Collections
CONTEXT: Footer — collections
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.bestSellers
EXACT ENGLISH: Best Sellers
CONTEXT: Footer — best sellers
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.newArrivals
EXACT ENGLISH: New Arrivals
CONTEXT: Footer — new arrivals
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.giftSets
EXACT ENGLISH: Gift Sets
CONTEXT: Footer — gift sets
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.scentFinder
EXACT ENGLISH: Scent Finder
CONTEXT: Footer — scent finder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.ourStory
EXACT ENGLISH: Our Story
CONTEXT: Footer — our story
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.journal
EXACT ENGLISH: Journal
CONTEXT: Footer — journal
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: footer.parentCompany
EXACT ENGLISH: Parent Company
CONTEXT: Footer — parent company
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.ingredients
EXACT ENGLISH: Ingredients
CONTEXT: Footer — ingredients
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.contact
EXACT ENGLISH: Contact
CONTEXT: Footer — contact
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: footer.faq
EXACT ENGLISH: FAQ
CONTEXT: Footer — faq
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Footer.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: footer.shippingDelivery
EXACT ENGLISH: Shipping & Delivery
CONTEXT: Footer — shipping delivery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Footer.tsx, src/pages/ShippingDelivery.tsx
NOTES: —
```

```
KEY: footer.returnsExchanges
EXACT ENGLISH: Returns & Exchanges
CONTEXT: Footer — returns exchanges
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Footer.tsx, src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: footer.trackOrder
EXACT ENGLISH: Track Order
CONTEXT: Footer — track order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx, src/pages/ShippingDelivery.tsx, src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: footer.rights
EXACT ENGLISH: © {year} HM Signature. All Rights Reserved.
CONTEXT: Footer — rights
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Footer.tsx
NOTES: interpolation: {year}
```

```
KEY: footer.aBrandBy
EXACT ENGLISH: A brand by
CONTEXT: Footer — a brand by
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Footer.tsx
NOTES: —
```

```
KEY: footer.privacyPolicy
EXACT ENGLISH: Privacy Policy
CONTEXT: Footer — privacy policy
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx, src/pages/PrivacyPolicy.tsx
NOTES: —
```

```
KEY: footer.terms
EXACT ENGLISH: Terms & Conditions
CONTEXT: Footer — terms
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Footer.tsx, src/pages/TermsConditions.tsx
NOTES: —
```

```
KEY: footer.refundPolicy
EXACT ENGLISH: Refund Policy
CONTEXT: Footer — refund policy
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/Footer.tsx, src/pages/RefundPolicy.tsx
NOTES: —
```

```
KEY: footer.partOf
EXACT ENGLISH: Part of {brand}
CONTEXT: Footer — part of
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/Footer.tsx
NOTES: interpolation: {brand}
```

## System Messages

_89 string(s)_

```
KEY: common.add
EXACT ENGLISH: Add
CONTEXT: System Messages — add
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.addToBag
EXACT ENGLISH: Add to Bag
CONTEXT: System Messages — add to bag
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.added
EXACT ENGLISH: Added
CONTEXT: System Messages — added
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.viewDetails
EXACT ENGLISH: View Details
CONTEXT: System Messages — view details
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.shopNow
EXACT ENGLISH: Shop Now
CONTEXT: System Messages — shop now
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.continue
EXACT ENGLISH: Continue
CONTEXT: System Messages — continue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.back
EXACT ENGLISH: Back
CONTEXT: System Messages — back
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.cancel
EXACT ENGLISH: Cancel
CONTEXT: System Messages — cancel
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/AddressBook.tsx, src/pages/Login.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: common.close
EXACT ENGLISH: Close
CONTEXT: System Messages — close
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.save
EXACT ENGLISH: Save
CONTEXT: System Messages — save
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.saved
EXACT ENGLISH: Saved
CONTEXT: System Messages — saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.remove
EXACT ENGLISH: Remove
CONTEXT: System Messages — remove
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx, src/components/AddressBook.tsx, src/pages/Checkout.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: common.update
EXACT ENGLISH: Update
CONTEXT: System Messages — update
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.apply
EXACT ENGLISH: Apply
CONTEXT: System Messages — apply
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: common.loading
EXACT ENGLISH: Loading…
CONTEXT: System Messages — loading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.searchResults
EXACT ENGLISH: results
CONTEXT: System Messages — search results
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.quantity
EXACT ENGLISH: Quantity
CONTEXT: System Messages — quantity
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CartDrawer.tsx, src/pages/Product.tsx
NOTES: —
```

```
KEY: common.price
EXACT ENGLISH: Price
CONTEXT: System Messages — price
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.total
EXACT ENGLISH: Total
CONTEXT: System Messages — total
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx, src/components/CartDrawer.tsx, src/pages/Account.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: common.subtotal
EXACT ENGLISH: Subtotal
CONTEXT: System Messages — subtotal
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/CartDrawer.tsx
NOTES: —
```

```
KEY: common.discount
EXACT ENGLISH: Discount
CONTEXT: System Messages — discount
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/OrderConfirmation.tsx
NOTES: —
```

```
KEY: common.free
EXACT ENGLISH: Free
CONTEXT: System Messages — free
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.yes
EXACT ENGLISH: Yes
CONTEXT: System Messages — yes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.no
EXACT ENGLISH: No
CONTEXT: System Messages — no
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.enabled
EXACT ENGLISH: Enabled
CONTEXT: System Messages — enabled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.disabled
EXACT ENGLISH: Disabled
CONTEXT: System Messages — disabled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/NotificationsPage.tsx, src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: common.optional
EXACT ENGLISH: optional
CONTEXT: System Messages — optional
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx, src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: common.required
EXACT ENGLISH: required
CONTEXT: System Messages — required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.notAvailable
EXACT ENGLISH: Not available
CONTEXT: System Messages — not available
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.outOfStock
EXACT ENGLISH: Out of stock
CONTEXT: System Messages — out of stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: common.inStock
EXACT ENGLISH: In stock
CONTEXT: System Messages — in stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: common.errorCode
EXACT ENGLISH: Error
CONTEXT: System Messages — error code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: common.contactPage
EXACT ENGLISH: Contact page
CONTEXT: System Messages — contact page
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Ingredients.tsx, src/pages/ReturnsExchanges.tsx
NOTES: —
```

```
KEY: common.home
EXACT ENGLISH: Home
CONTEXT: System Messages — home
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Product.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: common.notFoundTitle
EXACT ENGLISH: This Page Has No Signature
CONTEXT: System Messages — not found title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/NotFound.tsx
NOTES: —
```

```
KEY: common.notFoundBody
EXACT ENGLISH: The page you're looking for doesn't exist.
CONTEXT: System Messages — not found body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/NotFound.tsx
NOTES: —
```

```
KEY: common.returnHome
EXACT ENGLISH: RETURN HOME
CONTEXT: System Messages — return home
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/NotFound.tsx, src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: common.chatWithConcierge
EXACT ENGLISH: Chat with the HM Signature concierge
CONTEXT: System Messages — chat with concierge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/WhatsAppButton.tsx
NOTES: —
```

```
KEY: common.conciergeDialogLabel
EXACT ENGLISH: HM Signature fragrance concierge
CONTEXT: System Messages — concierge dialog label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.fragranceConcierge
EXACT ENGLISH: Fragrance Concierge
CONTEXT: System Messages — fragrance concierge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.closeConcierge
EXACT ENGLISH: Close concierge
CONTEXT: System Messages — close concierge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.startNewConversation
EXACT ENGLISH: Start a new conversation
CONTEXT: System Messages — start new conversation
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.conciergeGreeting
EXACT ENGLISH: Welcome. I can help with fragrance families and notes, bottle sizes and prices, gifting, delivery across Pakistan, and the status of an order placed with this account.
CONTEXT: System Messages — concierge greeting
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.conciergeApology
EXACT ENGLISH: I could not complete that request. Please try again, or reach our concierge directly.
CONTEXT: System Messages — concierge apology
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.conciergeNotEnabled
EXACT ENGLISH: The assistant is not enabled on this deployment yet.
CONTEXT: System Messages — concierge not enabled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.conciergeDegradedBody
EXACT ENGLISH: Answers above are drawn directly from live catalogue and order records; the assistant could not add general guidance.
CONTEXT: System Messages — concierge degraded body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.consultingAtelier
EXACT ENGLISH: Consulting the atelier…
CONTEXT: System Messages — consulting atelier
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.conciergeSuggestionEvening
EXACT ENGLISH: Which fragrances suit evening wear?
CONTEXT: System Messages — concierge suggestion evening
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.conciergeSuggestionSizes
EXACT ENGLISH: What bottle sizes do you offer?
CONTEXT: System Messages — concierge suggestion sizes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.conciergeSuggestionRaast
EXACT ENGLISH: How do I pay with Raast?
CONTEXT: System Messages — concierge suggestion raast
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.conciergeSuggestionOrder
EXACT ENGLISH: Where is my order?
CONTEXT: System Messages — concierge suggestion order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: common.askTheConcierge
EXACT ENGLISH: Ask the concierge
CONTEXT: System Messages — ask the concierge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.conciergePlaceholderSignedIn
EXACT ENGLISH: Ask about scents, sizes or your order…
CONTEXT: System Messages — concierge placeholder signed in
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.conciergePlaceholderGuest
EXACT ENGLISH: Ask about scents, sizes or delivery…
CONTEXT: System Messages — concierge placeholder guest
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.sendMessage
EXACT ENGLISH: Send message
CONTEXT: System Messages — send message
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.whatsappConcierge
EXACT ENGLISH: WhatsApp concierge
CONTEXT: System Messages — whatsapp concierge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.signInForOrderStatus
EXACT ENGLISH: Sign in for order status
CONTEXT: System Messages — sign in for order status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/components/ConciergeChat.tsx
NOTES: —
```

```
KEY: common.complimentary
EXACT ENGLISH: Complimentary
CONTEXT: System Messages — complimentary
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx, src/pages/Cart.tsx
NOTES: —
```

```
KEY: status.pending
EXACT ENGLISH: Pending
CONTEXT: System Messages — pending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx, src/pages/TrackOrder.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: status.confirmed
EXACT ENGLISH: Confirmed
CONTEXT: System Messages — confirmed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: status.processing
EXACT ENGLISH: Processing
CONTEXT: System Messages — processing
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: status.shipped
EXACT ENGLISH: Shipped
CONTEXT: System Messages — shipped
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: status.outfordelivery
EXACT ENGLISH: Out for Delivery
CONTEXT: System Messages — outfordelivery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: status.delivered
EXACT ENGLISH: Delivered
CONTEXT: System Messages — delivered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx, src/components/OrderTimeline.tsx, src/pages/Account.tsx, src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: status.cancelled
EXACT ENGLISH: Cancelled
CONTEXT: System Messages — cancelled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: status.returned
EXACT ENGLISH: Returned
CONTEXT: System Messages — returned
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx, src/pages/TrackOrder.tsx
NOTES: —
```

```
KEY: status.preparing
EXACT ENGLISH: Preparing
CONTEXT: System Messages — preparing
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: status.dispatched
EXACT ENGLISH: Dispatched
CONTEXT: System Messages — dispatched
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: status.intransit
EXACT ENGLISH: In Transit
CONTEXT: System Messages — intransit
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: status.failedattempt
EXACT ENGLISH: Failed Attempt
CONTEXT: System Messages — failedattempt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: status.unfulfilled
EXACT ENGLISH: Unfulfilled
CONTEXT: System Messages — unfulfilled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: status.paid
EXACT ENGLISH: Paid
CONTEXT: System Messages — paid
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · very short string — translate by UI context, not by dictionary habit · [REVIEW POSSIBLE]
```

```
KEY: status.verified
EXACT ENGLISH: Verified
CONTEXT: System Messages — verified
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: status.refunded
EXACT ENGLISH: Refunded
CONTEXT: System Messages — refunded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: status.paidandverified
EXACT ENGLISH: Paid & Verified
CONTEXT: System Messages — paidandverified
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: status.paymentpending
EXACT ENGLISH: Payment Pending
CONTEXT: System Messages — paymentpending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: status.verificationpending
EXACT ENGLISH: Verification Pending
CONTEXT: System Messages — verificationpending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx, src/pages/Account.tsx
NOTES: —
```

```
KEY: status.paymentfailedrejected
EXACT ENGLISH: Payment Failed / Rejected
CONTEXT: System Messages — paymentfailedrejected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: status.noUpdates
EXACT ENGLISH: No status updates have been recorded for this order yet.
CONTEXT: System Messages — no updates
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/components/OrderTimeline.tsx
NOTES: —
```

```
KEY: status.finalStatus
EXACT ENGLISH: Final status
CONTEXT: System Messages — final status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/components/OrderTimeline.tsx
NOTES: —
```

```
KEY: status.currentStatus
EXACT ENGLISH: Current status
CONTEXT: System Messages — current status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/components/OrderTimeline.tsx
NOTES: —
```

```
KEY: validation.requiredFields
EXACT ENGLISH: Please complete all required fields.
CONTEXT: System Messages — required fields
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: validation.fullNameRequired
EXACT ENGLISH: Please enter your full name.
CONTEXT: System Messages — full name required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: validation.passwordMinCharacters
EXACT ENGLISH: Please choose a password of at least 6 characters.
CONTEXT: System Messages — password min characters
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Login.tsx
NOTES: —
```

```
KEY: validation.proofImageType
EXACT ENGLISH: Please select a valid image file (.jpg, .png, or .webp).
CONTEXT: System Messages — proof image type
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: validation.proofImageSize
EXACT ENGLISH: File size must be less than 10MB.
CONTEXT: System Messages — proof image size
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: validation.proofSelectFirst
EXACT ENGLISH: Select a receipt screenshot first.
CONTEXT: System Messages — proof select first
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Account.tsx
NOTES: —
```

```
KEY: validation.reviewCommentRequired
EXACT ENGLISH: Please write a few words about the fragrance.
CONTEXT: System Messages — review comment required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/pages/Product.tsx
NOTES: —
```

```
KEY: validation.addressRequired
EXACT ENGLISH: Street address and city are required.
CONTEXT: System Messages — address required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/components/AddressBook.tsx
NOTES: —
```

## SEO

_16 string(s)_

```
KEY: seo.homeTitle
EXACT ENGLISH: HM Signature — Haute Parfumerie
CONTEXT: SEO — home title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/pages/Home.tsx
NOTES: —
```

```
KEY: seo.homeDescription
EXACT ENGLISH: Luxury extrait de parfum crafted in small batches.
CONTEXT: SEO — home description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/pages/Home.tsx
NOTES: —
```

```
KEY: seo.scentFinderTitle
EXACT ENGLISH: Scent finder — HM Signature
CONTEXT: SEO — scent finder title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: seo.scentFinderDescription
EXACT ENGLISH: A short consultation on family, projection, occasion and season, matched to the scents we actually stock.
CONTEXT: SEO — scent finder description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/ScentFinder.tsx
NOTES: —
```

```
KEY: seo.collectionsTitle
EXACT ENGLISH: Curated Fragrance Collections — HM Signature
CONTEXT: SEO — collections title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: seo.menTitle
EXACT ENGLISH: Fragrances for Men — HM Signature
CONTEXT: SEO — men title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: seo.womenTitle
EXACT ENGLISH: Fragrances for Women — HM Signature
CONTEXT: SEO — women title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: seo.bestsellersTitle
EXACT ENGLISH: Bestselling Extraits de Parfum — HM Signature
CONTEXT: SEO — bestsellers title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: seo.shopDescription
EXACT ENGLISH: Extrait de parfum blends in 10ml to 100ml, each bottle size priced by the catalogue.
CONTEXT: SEO — shop description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

```
KEY: seo.journalTitle
EXACT ENGLISH: The Journal — HM Signature
CONTEXT: SEO — journal title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/pages/Journal.tsx
NOTES: —
```

```
KEY: seo.journalDescription
EXACT ENGLISH: Notes on raw materials, craftsmanship and the making of the collection.
CONTEXT: SEO — journal description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/pages/Journal.tsx
NOTES: —
```

```
KEY: seo.contactTitle
EXACT ENGLISH: Contact the atelier — HM Signature
CONTEXT: SEO — contact title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: seo.contactDescription
EXACT ENGLISH: Speak with the concierge about an order, a delivery or a presentation request.
CONTEXT: SEO — contact description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: seo.trackTitle
EXACT ENGLISH: Track your order — HM Signature
CONTEXT: SEO — track title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: seo.trackDescription
EXACT ENGLISH: Follow an HM Signature order from registration to delivery.
CONTEXT: SEO — track description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: seo.collectionsDescription
EXACT ENGLISH: Curated extrait de parfum collections, each bottle size priced by the catalogue.
CONTEXT: SEO — collections description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/components/ShopPage.tsx
NOTES: —
```

## Admin Panel

_1629 string(s)_

```
KEY: admin.inventory.atelierFlaconVault
EXACT ENGLISH: ATELIER FLACON VAULT
CONTEXT: Admin Panel — inventory — atelier flacon vault
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.inventoryFlaconStockControl
EXACT ENGLISH: Inventory & Flacon Stock Control
CONTEXT: Admin Panel — inventory — inventory flacon stock control
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.trackRealTimeBottle
EXACT ENGLISH: Track real-time bottle quantities, set low-stock thresholds, and inspect stock movement history logs.
CONTEXT: Admin Panel — inventory — track real time bottle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.currentFragranceStockRoster
EXACT ENGLISH: Current Fragrance Stock Roster ({count} SKUs)
CONTEXT: Admin Panel — inventory — current fragrance stock roster
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.inventory.fragrance
EXACT ENGLISH: Fragrance
CONTEXT: Admin Panel — inventory — fragrance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.sku
EXACT ENGLISH: SKU
CONTEXT: Admin Panel — inventory — sku
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx, src/admin/pages/InventoryPage.tsx, src/admin/pages/ProductFormPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.inventory.currentStock
EXACT ENGLISH: Current Stock
CONTEXT: Admin Panel — inventory — current stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.lowLimit
EXACT ENGLISH: Low Limit
CONTEXT: Admin Panel — inventory — low limit
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx, src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.inventory.stockStatus
EXACT ENGLISH: Stock Status
CONTEXT: Admin Panel — inventory — stock status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.stockAction
EXACT ENGLISH: Stock Action
CONTEXT: Admin Panel — inventory — stock action
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.units
EXACT ENGLISH: {count} units
CONTEXT: Admin Panel — inventory — units
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx, src/admin/pages/ProductsList.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.inventory.adjustStock
EXACT ENGLISH: Adjust Stock
CONTEXT: Admin Panel — inventory — adjust stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.inventoryPositionByBottleSize
EXACT ENGLISH: Inventory Position by Bottle Size
CONTEXT: Admin Panel — inventory — inventory position by bottle size
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.recalculate
EXACT ENGLISH: Recalculate
CONTEXT: Admin Panel — inventory — recalculate
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.reservedUnitsAreStock
EXACT ENGLISH: Reserved units are stock committed to orders that have not been dispatched yet; on-hand is already reduced at checkout, so these figures are context rather than an addition.
CONTEXT: Admin Panel — inventory — reserved units are stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.noSizeLevelMovements
EXACT ENGLISH: No size-level movements recorded yet.
CONTEXT: Admin Panel — inventory — no size level movements
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.size
EXACT ENGLISH: Size
CONTEXT: Admin Panel — inventory — size
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx, src/admin/pages/InventoryPage.tsx, src/admin/pages/ProductFormPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.inventory.onHand
EXACT ENGLISH: On Hand
CONTEXT: Admin Panel — inventory — on hand
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.reserved
EXACT ENGLISH: Reserved
CONTEXT: Admin Panel — inventory — reserved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.sold
EXACT ENGLISH: Sold
CONTEXT: Admin Panel — inventory — sold
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.inventory.restocked
EXACT ENGLISH: Restocked
CONTEXT: Admin Panel — inventory — restocked
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.unitsPutBackOnThe
EXACT ENGLISH: Units put back on the shelf by returns and cancellations
CONTEXT: Admin Panel — inventory — units put back on the
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.adjustments
EXACT ENGLISH: Adjustments
CONTEXT: Admin Panel — inventory — adjustments
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.unitsDay
EXACT ENGLISH: Units / Day
CONTEXT: Admin Panel — inventory — units day
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.lastMovement
EXACT ENGLISH: Last Movement
CONTEXT: Admin Panel — inventory — last movement
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.inventoryMovementStock
EXACT ENGLISH: Inventory Movement & Stock History Audit Log
CONTEXT: Admin Panel — inventory — inventory movement stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.date
EXACT ENGLISH: Date
CONTEXT: Admin Panel — inventory — date
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.inventory.change
EXACT ENGLISH: Change
CONTEXT: Admin Panel — inventory — change
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.inventory.newStock
EXACT ENGLISH: New Stock
CONTEXT: Admin Panel — inventory — new stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.reasonNote
EXACT ENGLISH: Reason Note
CONTEXT: Admin Panel — inventory — reason note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.adjustedBy
EXACT ENGLISH: Adjusted By
CONTEXT: Admin Panel — inventory — adjusted by
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.adjustStockName
EXACT ENGLISH: Adjust Stock — {name}
CONTEXT: Admin Panel — inventory — adjust stock name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.inventory.currentStock2
EXACT ENGLISH: Current Stock:
CONTEXT: Admin Panel — inventory — current stock2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.adjustmentMode
EXACT ENGLISH: Adjustment Mode
CONTEXT: Admin Panel — inventory — adjustment mode
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.addStock
EXACT ENGLISH: Add Stock
CONTEXT: Admin Panel — inventory — add stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.deductStock
EXACT ENGLISH: Deduct Stock
CONTEXT: Admin Panel — inventory — deduct stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.quantityCount
EXACT ENGLISH: Quantity Count *
CONTEXT: Admin Panel — inventory — quantity count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.adjustmentReasonNote
EXACT ENGLISH: Adjustment Reason / Note *
CONTEXT: Admin Panel — inventory — adjustment reason note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.inventory.restockBatchFromLaboratory
EXACT ENGLISH: e.g. Restock batch from laboratory
CONTEXT: Admin Panel — inventory — restock batch from laboratory
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.inventory.confirmAdjustment
EXACT ENGLISH: Confirm Adjustment
CONTEXT: Admin Panel — inventory — confirm adjustment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InventoryPage.tsx
NOTES: —
```

```
KEY: admin.staff.productsManagement
EXACT ENGLISH: Products Management
CONTEXT: Admin Panel — staff — products management
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.ordersFulfilment
EXACT ENGLISH: Orders & Fulfilment
CONTEXT: Admin Panel — staff — orders fulfilment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.clientRecords
EXACT ENGLISH: Client Records
CONTEXT: Admin Panel — staff — client records
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.inventoryControl
EXACT ENGLISH: Inventory Control
CONTEXT: Admin Panel — staff — inventory control
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.couponsDiscounts
EXACT ENGLISH: Coupons & Discounts
CONTEXT: Admin Panel — staff — coupons discounts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.shippingLogistics
EXACT ENGLISH: Shipping Logistics
CONTEXT: Admin Panel — staff — shipping logistics
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.reviewsModeration
EXACT ENGLISH: Reviews Moderation
CONTEXT: Admin Panel — staff — reviews moderation
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.homepageCms
EXACT ENGLISH: Homepage CMS
CONTEXT: Admin Panel — staff — homepage cms
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.marketingCampaigns
EXACT ENGLISH: Marketing Campaigns
CONTEXT: Admin Panel — staff — marketing campaigns
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.analyticsTelemetry
EXACT ENGLISH: Analytics & Telemetry
CONTEXT: Admin Panel — staff — analytics telemetry
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.websiteSettings
EXACT ENGLISH: Website Settings
CONTEXT: Admin Panel — staff — website settings
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.staffManagement
EXACT ENGLISH: Staff Management
CONTEXT: Admin Panel — staff — staff management
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.staffMember
EXACT ENGLISH: Staff Member
CONTEXT: Admin Panel — staff — staff member
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.roleAssignment
EXACT ENGLISH: Role Assignment
CONTEXT: Admin Panel — staff — role assignment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.loginAccessStatus
EXACT ENGLISH: Login Access & Status
CONTEXT: Admin Panel — staff — login access status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.dashboardAccess
EXACT ENGLISH: Dashboard Access
CONTEXT: Admin Panel — staff — dashboard access
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.lastLogin
EXACT ENGLISH: Last Login
CONTEXT: Admin Panel — staff — last login
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.actions
EXACT ENGLISH: Actions
CONTEXT: Admin Panel — staff — actions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.staff.protectedPrimaryAdmin
EXACT ENGLISH: Protected Primary Admin
CONTEXT: Admin Panel — staff — protected primary admin
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.enabled
EXACT ENGLISH: Enabled
CONTEXT: Admin Panel — staff — enabled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.staff.disabled
EXACT ENGLISH: Disabled
CONTEXT: Admin Panel — staff — disabled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.editPermissionsMatrix
EXACT ENGLISH: Edit Permissions Matrix
CONTEXT: Admin Panel — staff — edit permissions matrix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.permissions
EXACT ENGLISH: Permissions
CONTEXT: Admin Panel — staff — permissions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.protected
EXACT ENGLISH: Protected
CONTEXT: Admin Panel — staff — protected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.deactivateStaffAccount
EXACT ENGLISH: Deactivate Staff Account
CONTEXT: Admin Panel — staff — deactivate staff account
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.activateStaffAccount
EXACT ENGLISH: Activate Staff Account
CONTEXT: Admin Panel — staff — activate staff account
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.deactivate
EXACT ENGLISH: Deactivate
CONTEXT: Admin Panel — staff — deactivate
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.activate
EXACT ENGLISH: Activate
CONTEXT: Admin Panel — staff — activate
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.removeStaffAccess
EXACT ENGLISH: Remove Staff Access
CONTEXT: Admin Panel — staff — remove staff access
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.never
EXACT ENGLISH: Never
CONTEXT: Admin Panel — staff — never
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.staff.atelierGovernanceAccess
EXACT ENGLISH: ATELIER GOVERNANCE & ACCESS CONTROL
CONTEXT: Admin Panel — staff — atelier governance access
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.staffLoginAccessControl
EXACT ENGLISH: Staff & Login Access Control
CONTEXT: Admin Panel — staff — staff login access control
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.manageAuthenticatedStaff
EXACT ENGLISH: Manage authenticated staff accounts, audit login access, and assign role-specific dashboards.
CONTEXT: Admin Panel — staff — manage authenticated staff
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.addStaffAccount
EXACT ENGLISH: Add Staff Account
CONTEXT: Admin Panel — staff — add staff account
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.totalStaff
EXACT ENGLISH: TOTAL STAFF
CONTEXT: Admin Panel — staff — total staff
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.activeLoginAccess
EXACT ENGLISH: ACTIVE LOGIN ACCESS
CONTEXT: Admin Panel — staff — active login access
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.superAdmins
EXACT ENGLISH: SUPER ADMINS
CONTEXT: Admin Panel — staff — super admins
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.operationalManagers
EXACT ENGLISH: OPERATIONAL MANAGERS
CONTEXT: Admin Panel — staff — operational managers
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.searchStaffByNameEmail
EXACT ENGLISH: Search staff by name, email, or role…
CONTEXT: Admin Panel — staff — search staff by name email
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.noStaffMembersFound
EXACT ENGLISH: No staff members found
CONTEXT: Admin Panel — staff — no staff members found
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.createStaffAccount
EXACT ENGLISH: Create Staff Account
CONTEXT: Admin Panel — staff — create staff account
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.fullNameRequired
EXACT ENGLISH: Full Name *
CONTEXT: Admin Panel — staff — full name required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.aliKhanPlaceholder
EXACT ENGLISH: e.g. Ali Khan
CONTEXT: Admin Panel — staff — ali khan placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.staff.staffEmailAddressRequired
EXACT ENGLISH: Staff Email Address *
CONTEXT: Admin Panel — staff — staff email address required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.staffEmailPlaceholder
EXACT ENGLISH: e.g. ali@hmsignature.com
CONTEXT: Admin Panel — staff — staff email placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.staff.assignedStaffRoleRequired
EXACT ENGLISH: Assigned Staff Role *
CONTEXT: Admin Panel — staff — assigned staff role required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.orderManagerFulfilmentTracking
EXACT ENGLISH: Order Manager (Fulfilment & Tracking)
CONTEXT: Admin Panel — staff — order manager fulfilment tracking
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.contentManagerCatalog
EXACT ENGLISH: Content Manager (Catalog & CMS)
CONTEXT: Admin Panel — staff — content manager catalog
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.managerBoutiqueOperations
EXACT ENGLISH: Manager (Boutique Store Operations)
CONTEXT: Admin Panel — staff — manager boutique operations
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.superAdminFullGovernance
EXACT ENGLISH: Super Admin (Full Governance Access)
CONTEXT: Admin Panel — staff — super admin full governance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.authenticationNote
EXACT ENGLISH: Authentication Note:
CONTEXT: Admin Panel — staff — authentication note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.staffAccountsRequireAuth
EXACT ENGLISH: Staff accounts require authentication via Supabase Auth. Passwords are never stored in plain text or public tables.
CONTEXT: Admin Panel — staff — staff accounts require auth
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.createAccount
EXACT ENGLISH: Create Account
CONTEXT: Admin Panel — staff — create account
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.permissionsMatrixName
EXACT ENGLISH: Permissions Matrix: {name}
CONTEXT: Admin Panel — staff — permissions matrix name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.staff.assignedRoleName
EXACT ENGLISH: Assigned Role: {role}
CONTEXT: Admin Panel — staff — assigned role name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: interpolation: {role}
```

```
KEY: admin.staff.fullUnrestrictedAccess
EXACT ENGLISH: FULL UNRESTRICTED ACCESS
CONTEXT: Admin Panel — staff — full unrestricted access
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.close
EXACT ENGLISH: Close
CONTEXT: Admin Panel — staff — close
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.staff.savePermissions
EXACT ENGLISH: Save Permissions
CONTEXT: Admin Panel — staff — save permissions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.deactivateRemoveStaffAccess
EXACT ENGLISH: Deactivate & Remove Staff Access
CONTEXT: Admin Panel — staff — deactivate remove staff access
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.staff.removeAccessConfirm
EXACT ENGLISH: Are you sure you want to deactivate and remove login access for {name} ({email})?
CONTEXT: Admin Panel — staff — remove access confirm
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: interpolation: {name}, {email}
```

```
KEY: admin.staff.removeAccess
EXACT ENGLISH: Remove Access
CONTEXT: Admin Panel — staff — remove access
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/StaffPage.tsx
NOTES: —
```

```
KEY: admin.coupons.promotionalDiscountsVouchers
EXACT ENGLISH: PROMOTIONAL DISCOUNTS & VOUCHERS
CONTEXT: Admin Panel — coupons — promotional discounts vouchers
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.couponsExclusiveClient
EXACT ENGLISH: Coupons & Exclusive Client Offers
CONTEXT: Admin Panel — coupons — coupons exclusive client
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.createPercentageDiscounts
EXACT ENGLISH: Create percentage discounts or fixed value promo codes for boutique checkouts.
CONTEXT: Admin Panel — coupons — create percentage discounts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.createCouponCode
EXACT ENGLISH: Create Coupon Code
CONTEXT: Admin Panel — coupons — create coupon code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.voucherCode
EXACT ENGLISH: Voucher Code
CONTEXT: Admin Panel — coupons — voucher code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.discountValue
EXACT ENGLISH: Discount Value
CONTEXT: Admin Panel — coupons — discount value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.minOrder
EXACT ENGLISH: Min Order
CONTEXT: Admin Panel — coupons — min order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.usageCount
EXACT ENGLISH: Usage Count
CONTEXT: Admin Panel — coupons — usage count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.validPeriod
EXACT ENGLISH: Valid Period
CONTEXT: Admin Panel — coupons — valid period
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.actions
EXACT ENGLISH: Actions
CONTEXT: Admin Panel — coupons — actions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.coupons.percentOff
EXACT ENGLISH: {percent}% OFF
CONTEXT: Admin Panel — coupons — percent off
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx, src/admin/pages/MarketingPage.tsx
NOTES: interpolation: {percent}
```

```
KEY: admin.coupons.rupeesOff
EXACT ENGLISH: Rs. {amount} OFF
CONTEXT: Admin Panel — coupons — rupees off
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: interpolation: {amount}
```

```
KEY: admin.coupons.validPeriodRange
EXACT ENGLISH: {start} to {end}
CONTEXT: Admin Panel — coupons — valid period range
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx, src/admin/pages/MarketingPage.tsx
NOTES: interpolation: {start}, {end}
```

```
KEY: admin.coupons.searchCouponCode
EXACT ENGLISH: Search coupon code...
CONTEXT: Admin Panel — coupons — search coupon code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.noPromoCodesFound
EXACT ENGLISH: No promo codes found
CONTEXT: Admin Panel — coupons — no promo codes found
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.editVoucherCode
EXACT ENGLISH: Edit Voucher Code
CONTEXT: Admin Panel — coupons — edit voucher code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.createExclusivePromoCode
EXACT ENGLISH: Create Exclusive Promo Code
CONTEXT: Admin Panel — coupons — create exclusive promo code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.voucherCodeRequired
EXACT ENGLISH: Voucher Code *
CONTEXT: Admin Panel — coupons — voucher code required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.generate
EXACT ENGLISH: Generate
CONTEXT: Admin Panel — coupons — generate
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.discountType
EXACT ENGLISH: Discount Type
CONTEXT: Admin Panel — coupons — discount type
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.percentagePercent
EXACT ENGLISH: Percentage (%)
CONTEXT: Admin Panel — coupons — percentage percent
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.fixedAmountPkr
EXACT ENGLISH: Fixed Amount (PKR)
CONTEXT: Admin Panel — coupons — fixed amount pkr
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.discountValueRequired
EXACT ENGLISH: Discount Value *
CONTEXT: Admin Panel — coupons — discount value required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.minimumOrderValuePkr
EXACT ENGLISH: Minimum Order Value (PKR)
CONTEXT: Admin Panel — coupons — minimum order value pkr
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.maximumDiscountPkr
EXACT ENGLISH: Maximum Discount (PKR)
CONTEXT: Admin Panel — coupons — maximum discount pkr
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.unlimitedIfEmpty
EXACT ENGLISH: Unlimited if empty
CONTEXT: Admin Panel — coupons — unlimited if empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.totalGlobalUsesLimit
EXACT ENGLISH: Total Global Uses Limit
CONTEXT: Admin Panel — coupons — total global uses limit
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.limitPerClient
EXACT ENGLISH: Limit Per Client
CONTEXT: Admin Panel — coupons — limit per client
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.startDate
EXACT ENGLISH: Start Date
CONTEXT: Admin Panel — coupons — start date
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.expiryDate
EXACT ENGLISH: Expiry Date
CONTEXT: Admin Panel — coupons — expiry date
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.activeCouponStatus
EXACT ENGLISH: Active Coupon Status
CONTEXT: Admin Panel — coupons — active coupon status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.saveCoupon
EXACT ENGLISH: Save Coupon
CONTEXT: Admin Panel — coupons — save coupon
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.deleteCouponCode
EXACT ENGLISH: Delete Coupon Code
CONTEXT: Admin Panel — coupons — delete coupon code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.deleteVoucherConfirm
EXACT ENGLISH: Are you sure you want to permanently delete this voucher code?
CONTEXT: Admin Panel — coupons — delete voucher confirm
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.coupons.deleteVoucher
EXACT ENGLISH: Delete Voucher
CONTEXT: Admin Panel — coupons — delete voucher
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CouponsPage.tsx
NOTES: —
```

```
KEY: admin.collections.curatedAnthologies
EXACT ENGLISH: CURATED ANTHOLOGIES
CONTEXT: Admin Panel — collections — curated anthologies
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.boutiqueCollectionsGift
EXACT ENGLISH: Boutique Collections & Gift Anthologies
CONTEXT: Admin Panel — collections — boutique collections gift
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.manageSignatureLines
EXACT ENGLISH: Manage signature lines (Men's, Women's, Unisex, Oud Collection, Luxury Gift Sets).
CONTEXT: Admin Panel — collections — manage signature lines
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.newCollection
EXACT ENGLISH: New Collection
CONTEXT: Admin Panel — collections — new collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.featured
EXACT ENGLISH: Featured
CONTEXT: Admin Panel — collections — featured
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx, src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.collections.fragrancesAssigned
EXACT ENGLISH: {count} Fragrances Assigned
CONTEXT: Admin Panel — collections — fragrances assigned
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.collections.editAssign
EXACT ENGLISH: Edit & Assign
CONTEXT: Admin Panel — collections — edit assign
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.delete
EXACT ENGLISH: Delete
CONTEXT: Admin Panel — collections — delete
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.collections.editFragranceCollection
EXACT ENGLISH: Edit Fragrance Collection
CONTEXT: Admin Panel — collections — edit fragrance collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.createNewCollection
EXACT ENGLISH: Create New Collection
CONTEXT: Admin Panel — collections — create new collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.collectionNameRequired
EXACT ENGLISH: Collection Name *
CONTEXT: Admin Panel — collections — collection name required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.urlSlug
EXACT ENGLISH: URL Slug
CONTEXT: Admin Panel — collections — url slug
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.description
EXACT ENGLISH: Description
CONTEXT: Admin Panel — collections — description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.textureTheme
EXACT ENGLISH: Texture Theme
CONTEXT: Admin Panel — collections — texture theme
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.oudCollectionPlaceholder
EXACT ENGLISH: e.g. Oud Collection
CONTEXT: Admin Panel — collections — oud collection placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.collections.preciousRoyalOud
EXACT ENGLISH: Precious Royal Oud oils blended with saffron...
CONTEXT: Admin Panel — collections — precious royal oud
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.velvetCrimson
EXACT ENGLISH: Velvet Crimson
CONTEXT: Admin Panel — collections — velvet crimson
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.darkObsidianMarble
EXACT ENGLISH: Dark Obsidian Marble
CONTEXT: Admin Panel — collections — dark obsidian marble
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.champagneMarble
EXACT ENGLISH: Champagne Marble
CONTEXT: Admin Panel — collections — champagne marble
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.stoneBeige
EXACT ENGLISH: Stone Beige
CONTEXT: Admin Panel — collections — stone beige
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.ebonyWood
EXACT ENGLISH: Ebony Wood
CONTEXT: Admin Panel — collections — ebony wood
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.midnightNavy
EXACT ENGLISH: Midnight Navy
CONTEXT: Admin Panel — collections — midnight navy
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.activeCollection
EXACT ENGLISH: Active Collection
CONTEXT: Admin Panel — collections — active collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.featuredOnHomepageGrid
EXACT ENGLISH: Featured on Homepage Grid
CONTEXT: Admin Panel — collections — featured on homepage grid
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.assignFragrancesToCollection
EXACT ENGLISH: Assign Fragrances to Collection ({count} Selected)
CONTEXT: Admin Panel — collections — assign fragrances to collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.collections.saveCollection
EXACT ENGLISH: Save Collection
CONTEXT: Admin Panel — collections — save collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.deleteFragranceCollection
EXACT ENGLISH: Delete Fragrance Collection
CONTEXT: Admin Panel — collections — delete fragrance collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.deleteCollectionConfirm
EXACT ENGLISH: Are you sure you want to delete this collection?
CONTEXT: Admin Panel — collections — delete collection confirm
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.collections.deleteCollection
EXACT ENGLISH: Delete Collection
CONTEXT: Admin Panel — collections — delete collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CollectionsPage.tsx
NOTES: —
```

```
KEY: admin.categories.olfactoryTaxonomy
EXACT ENGLISH: OLFACTORY TAXONOMY
CONTEXT: Admin Panel — categories — olfactory taxonomy
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.fragranceFamiliesCategories
EXACT ENGLISH: Fragrance Families & Categories
CONTEXT: Admin Panel — categories — fragrance families categories
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.organizeExtraitsDeParfum
EXACT ENGLISH: Organize extraits de parfum into Woody Oriental, Floral Amber, Fresh Woods, and spicy gourmands.
CONTEXT: Admin Panel — categories — organize extraits de parfum
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.newCategory
EXACT ENGLISH: New Category
CONTEXT: Admin Panel — categories — new category
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.productsCount
EXACT ENGLISH: {count} Products
CONTEXT: Admin Panel — categories — products count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.categories.edit
EXACT ENGLISH: Edit
CONTEXT: Admin Panel — categories — edit
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.categories.delete
EXACT ENGLISH: Delete
CONTEXT: Admin Panel — categories — delete
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.categories.editOlfactoryCategory
EXACT ENGLISH: Edit Olfactory Category
CONTEXT: Admin Panel — categories — edit olfactory category
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.createFragranceFamily
EXACT ENGLISH: Create Fragrance Family
CONTEXT: Admin Panel — categories — create fragrance family
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.categoryNameRequired
EXACT ENGLISH: Category Name *
CONTEXT: Admin Panel — categories — category name required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.slug
EXACT ENGLISH: Slug
CONTEXT: Admin Panel — categories — slug
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.categories.description
EXACT ENGLISH: Description
CONTEXT: Admin Panel — categories — description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.textureThemeBanner
EXACT ENGLISH: Texture Theme Banner
CONTEXT: Admin Panel — categories — texture theme banner
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.woodyOrientalPlaceholder
EXACT ENGLISH: e.g. Woody Oriental
CONTEXT: Admin Panel — categories — woody oriental placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.categories.sensualFloralBouquets
EXACT ENGLISH: Sensual floral bouquets layered over warm golden vanilla...
CONTEXT: Admin Panel — categories — sensual floral bouquets
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.velvetCrimson
EXACT ENGLISH: Velvet Crimson
CONTEXT: Admin Panel — categories — velvet crimson
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.darkObsidianMarble
EXACT ENGLISH: Dark Obsidian Marble
CONTEXT: Admin Panel — categories — dark obsidian marble
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.champagneMarble
EXACT ENGLISH: Champagne Marble
CONTEXT: Admin Panel — categories — champagne marble
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.stoneBeige
EXACT ENGLISH: Stone Beige
CONTEXT: Admin Panel — categories — stone beige
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.ebonyWood
EXACT ENGLISH: Ebony Wood
CONTEXT: Admin Panel — categories — ebony wood
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.midnightNavy
EXACT ENGLISH: Midnight Navy
CONTEXT: Admin Panel — categories — midnight navy
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.activeInBoutiqueNavbar
EXACT ENGLISH: Active in Boutique Navbar
CONTEXT: Admin Panel — categories — active in boutique navbar
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.saveCategory
EXACT ENGLISH: Save Category
CONTEXT: Admin Panel — categories — save category
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.deleteOlfactoryCategory
EXACT ENGLISH: Delete Olfactory Category
CONTEXT: Admin Panel — categories — delete olfactory category
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.deleteCategoryConfirm
EXACT ENGLISH: Are you sure you want to delete this fragrance category?
CONTEXT: Admin Panel — categories — delete category confirm
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.categories.deleteCategory
EXACT ENGLISH: Delete Category
CONTEXT: Admin Panel — categories — delete category
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CategoriesPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.abandonedCartsCount
EXACT ENGLISH: Abandoned Carts Count
CONTEXT: Admin Panel — abandoned carts — abandoned carts count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.abandonedDate
EXACT ENGLISH: Abandoned Date
CONTEXT: Admin Panel — abandoned carts — abandoned date
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.abandonedShoppingBagsTitle
EXACT ENGLISH: Abandoned Shopping Bags & Recovery Reminders
CONTEXT: Admin Panel — abandoned carts — abandoned shopping bags title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.allCarts
EXACT ENGLISH: All Carts
CONTEXT: Admin Panel — abandoned carts — all carts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.cartContents
EXACT ENGLISH: Cart Contents
CONTEXT: Admin Panel — abandoned carts — cart contents
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.cartRecoveryConcierge
EXACT ENGLISH: CART RECOVERY CONCIERGE
CONTEXT: Admin Panel — abandoned carts — cart recovery concierge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.cartValue
EXACT ENGLISH: Cart Value
CONTEXT: Admin Panel — abandoned carts — cart value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.cartValue2
EXACT ENGLISH: Cart Value:
CONTEXT: Admin Panel — abandoned carts — cart value2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.conciergeMessageDraft
EXACT ENGLISH: Concierge Message Draft
CONTEXT: Admin Panel — abandoned carts — concierge message draft
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.markRecovered
EXACT ENGLISH: Mark Recovered
CONTEXT: Admin Panel — abandoned carts — mark recovered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.noAbandonedCarts
EXACT ENGLISH: No abandoned carts
CONTEXT: Admin Panel — abandoned carts — no abandoned carts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.nothingIsEmailedNote
EXACT ENGLISH: Nothing is emailed from this screen — the mail service is not configured, so no client is contacted. Recording stamps this bag as reminded, which is what stops the same prompt being issued twice before the client changes it.
CONTEXT: Admin Panel — abandoned carts — nothing is emailed note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.pendingReminder
EXACT ENGLISH: Pending Reminder
CONTEXT: Admin Panel — abandoned carts — pending reminder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.recipient
EXACT ENGLISH: Recipient:
CONTEXT: Admin Panel — abandoned carts — recipient
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.recordReminder
EXACT ENGLISH: Record Reminder
CONTEXT: Admin Panel — abandoned carts — record reminder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.recoverUncompletedCheckouts
EXACT ENGLISH: Recover uncompleted boutique checkouts by sending personalized invitation notes and exclusive vouchers.
CONTEXT: Admin Panel — abandoned carts — recover uncompleted checkouts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.recoveryAction
EXACT ENGLISH: Recovery Action
CONTEXT: Admin Panel — abandoned carts — recovery action
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.reminderRecorded
EXACT ENGLISH: Reminder Recorded
CONTEXT: Admin Panel — abandoned carts — reminder recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.reopenBag
EXACT ENGLISH: Reopen Bag
CONTEXT: Admin Panel — abandoned carts — reopen bag
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.searchClientNameEmail
EXACT ENGLISH: Search client name, email…
CONTEXT: Admin Panel — abandoned carts — search client name email
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.totalUnrecoveredValue
EXACT ENGLISH: Total Unrecovered Value
CONTEXT: Admin Panel — abandoned carts — total unrecovered value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.voucherCodeToQuoteLater
EXACT ENGLISH: Voucher Code To Quote Later
CONTEXT: Admin Panel — abandoned carts — voucher code to quote later
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.abandonedCarts.bagsCount
EXACT ENGLISH: {count} Bags
CONTEXT: Admin Panel — abandoned carts — bags count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.abandonedCarts.highValueCarts
EXACT ENGLISH: High Value Carts (> {amount})
CONTEXT: Admin Panel — abandoned carts — high value carts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: interpolation: {amount}
```

```
KEY: admin.abandonedCarts.highValueOption
EXACT ENGLISH: High Value (> {amount})
CONTEXT: Admin Panel — abandoned carts — high value option
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: interpolation: {amount}
```

```
KEY: admin.abandonedCarts.recordReminderTitle
EXACT ENGLISH: Record Cart Recovery Reminder — {name}
CONTEXT: Admin Panel — abandoned carts — record reminder title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.abandonedCarts.recoveryMessageDraftDefault
EXACT ENGLISH: Dear Client, we noticed you left your signature extraits in your boutique bag. Complete your order at your convenience.
CONTEXT: Admin Panel — abandoned carts — recovery message draft default
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.bagMarkedAsRecovered
EXACT ENGLISH: Bag marked as recovered.
CONTEXT: Admin Panel — admin data context — bag marked as recovered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.campaignRemoved
EXACT ENGLISH: Campaign removed.
CONTEXT: Admin Panel — admin data context — campaign removed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.campaignSavedAs
EXACT ENGLISH: Marketing campaign "{name}" saved as {status}.
CONTEXT: Admin Panel — admin data context — campaign saved as
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}, {status}
```

```
KEY: admin.adminDataContext.campaignSavedAs2
EXACT ENGLISH: Marketing campaign "{name}" saved as {status}.
CONTEXT: Admin Panel — admin data context — campaign saved as2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}, {status}
```

```
KEY: admin.adminDataContext.campaignUpdated
EXACT ENGLISH: Campaign updated.
CONTEXT: Admin Panel — admin data context — campaign updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.categoryProcessed
EXACT ENGLISH: Category processed.
CONTEXT: Admin Panel — admin data context — category processed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.categoryUpdated
EXACT ENGLISH: Category updated.
CONTEXT: Admin Panel — admin data context — category updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.codPaymentMarkedAsCollected
EXACT ENGLISH: COD payment marked as Collected.
CONTEXT: Admin Panel — admin data context — cod payment marked as collected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.collectionProcessed
EXACT ENGLISH: Collection processed.
CONTEXT: Admin Panel — admin data context — collection processed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.collectionUpdated
EXACT ENGLISH: Collection updated.
CONTEXT: Admin Panel — admin data context — collection updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.couponCodeCreated
EXACT ENGLISH: Coupon code "{code}" created.
CONTEXT: Admin Panel — admin data context — coupon code created
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {code}
```

```
KEY: admin.adminDataContext.couponCodeCreated2
EXACT ENGLISH: Coupon code "{code}" created.
CONTEXT: Admin Panel — admin data context — coupon code created2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {code}
```

```
KEY: admin.adminDataContext.couponRemoved
EXACT ENGLISH: Coupon removed.
CONTEXT: Admin Panel — admin data context — coupon removed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.couponUpdated
EXACT ENGLISH: Coupon updated.
CONTEXT: Admin Panel — admin data context — coupon updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.duplicatedProduct
EXACT ENGLISH: Duplicated product "{name}".
CONTEXT: Admin Panel — admin data context — duplicated product
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.adminDataContext.failedToCreateCampaign
EXACT ENGLISH: Failed to create campaign.
CONTEXT: Admin Panel — admin data context — failed to create campaign
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToCreateCouponIn
EXACT ENGLISH: Failed to create coupon in database.
CONTEXT: Admin Panel — admin data context — failed to create coupon in
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToMarkCodAs
EXACT ENGLISH: Failed to mark COD as collected.
CONTEXT: Admin Panel — admin data context — failed to mark cod as
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToRecordCartRecovery
EXACT ENGLISH: Failed to record cart recovery.
CONTEXT: Admin Panel — admin data context — failed to record cart recovery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToRejectPayment
EXACT ENGLISH: Failed to reject payment.
CONTEXT: Admin Panel — admin data context — failed to reject payment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToRemoveCampaign
EXACT ENGLISH: Failed to remove campaign.
CONTEXT: Admin Panel — admin data context — failed to remove campaign
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToSaveHomepageSettings
EXACT ENGLISH: Failed to save homepage settings to database.
CONTEXT: Admin Panel — admin data context — failed to save homepage settings
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToSaveSeoEntry
EXACT ENGLISH: Failed to save SEO entry.
CONTEXT: Admin Panel — admin data context — failed to save seo entry
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToSaveStoreSettings
EXACT ENGLISH: Failed to save store settings to database.
CONTEXT: Admin Panel — admin data context — failed to save store settings
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToUpdateCampaign
EXACT ENGLISH: Failed to update campaign.
CONTEXT: Admin Panel — admin data context — failed to update campaign
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToUpdateCoupon
EXACT ENGLISH: Failed to update coupon.
CONTEXT: Admin Panel — admin data context — failed to update coupon
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToUpdateOrderStatus
EXACT ENGLISH: Failed to update order status in database.
CONTEXT: Admin Panel — admin data context — failed to update order status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToUpdateReviewStatus
EXACT ENGLISH: Failed to update review status.
CONTEXT: Admin Panel — admin data context — failed to update review status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToUpdateShippingMethod
EXACT ENGLISH: Failed to update shipping method.
CONTEXT: Admin Panel — admin data context — failed to update shipping method
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToUpdateTemplate
EXACT ENGLISH: Failed to update template.
CONTEXT: Admin Panel — admin data context — failed to update template
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.failedToVerifyPaymentCheck
EXACT ENGLISH: Failed to verify payment. Check staff authorization.
CONTEXT: Admin Panel — admin data context — failed to verify payment check
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.fragranceRemovedOrArchivedArchived
EXACT ENGLISH: Fragrance removed or archived (archived when it has order or stock history).
CONTEXT: Admin Panel — admin data context — fragrance removed or archived archived
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.homepageCmsSettingsSaved
EXACT ENGLISH: Homepage CMS settings saved.
CONTEXT: Admin Panel — admin data context — homepage cms settings saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.internalNoteCouldNotBeSaved
EXACT ENGLISH: Internal note could not be saved.
CONTEXT: Admin Panel — admin data context — internal note could not be saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.internalNoteSaved
EXACT ENGLISH: Internal note saved.
CONTEXT: Admin Panel — admin data context — internal note saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.newOrderPlacedVia
EXACT ENGLISH: New Order #{number} placed via {method}.
CONTEXT: Admin Panel — admin data context — new order placed via
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {number}, {method}
```

```
KEY: admin.adminDataContext.newOrderPlacedVia2
EXACT ENGLISH: New Order #{number} placed via {method}.
CONTEXT: Admin Panel — admin data context — new order placed via2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {number}, {method}
```

```
KEY: admin.adminDataContext.notificationTemplateUpdated
EXACT ENGLISH: Notification template updated.
CONTEXT: Admin Panel — admin data context — notification template updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.orderStatusChangedTo
EXACT ENGLISH: Order status changed to {status}.
CONTEXT: Admin Panel — admin data context — order status changed to
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {status}
```

```
KEY: admin.adminDataContext.orderStatusChangedToId
EXACT ENGLISH: Order #{id} status changed to {status}.
CONTEXT: Admin Panel — admin data context — order status changed to id
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {id}, {status}
```

```
KEY: admin.adminDataContext.paymentFullyRefunded
EXACT ENGLISH: Payment fully refunded.
CONTEXT: Admin Panel — admin data context — payment fully refunded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.paymentRejected
EXACT ENGLISH: Payment rejected.
CONTEXT: Admin Panel — admin data context — payment rejected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.paymentVerifiedSuccessfully
EXACT ENGLISH: Payment verified successfully.
CONTEXT: Admin Panel — admin data context — payment verified successfully
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.productCouldNotBeSaved
EXACT ENGLISH: Product could not be saved. Check the size, SKU and price values.
CONTEXT: Admin Panel — admin data context — product could not be saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.productCouldNotBeSavedName
EXACT ENGLISH: Product "{name}" could not be saved. Check the size, SKU and price values.
CONTEXT: Admin Panel — admin data context — product could not be saved name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.adminDataContext.recoveryReminderRecorded
EXACT ENGLISH: Recovery reminder recorded.
CONTEXT: Admin Panel — admin data context — recovery reminder recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.recoveryStateCleared
EXACT ENGLISH: Recovery state cleared.
CONTEXT: Admin Panel — admin data context — recovery state cleared
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.refundCouldNotBeRecorded
EXACT ENGLISH: Refund could not be recorded.
CONTEXT: Admin Panel — admin data context — refund could not be recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx, src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.refundRecorded
EXACT ENGLISH: Refund recorded.
CONTEXT: Admin Panel — admin data context — refund recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.refundsRequireSupabase
EXACT ENGLISH: Refunds require the Supabase backend to be configured.
CONTEXT: Admin Panel — admin data context — refunds require supabase
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.reviewDeleted
EXACT ENGLISH: Review deleted.
CONTEXT: Admin Panel — admin data context — review deleted
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.reviewStatusChangedTo
EXACT ENGLISH: Review status changed to {status}.
CONTEXT: Admin Panel — admin data context — review status changed to
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {status}
```

```
KEY: admin.adminDataContext.seoMetadataUpdated
EXACT ENGLISH: SEO metadata updated.
CONTEXT: Admin Panel — admin data context — seo metadata updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.shippingMethodUpdated
EXACT ENGLISH: Shipping method updated.
CONTEXT: Admin Panel — admin data context — shipping method updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.staffAdded
EXACT ENGLISH: Staff member "{name}" added.
CONTEXT: Admin Panel — admin data context — staff added
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.adminDataContext.staffPermissionsSaved
EXACT ENGLISH: Staff permissions saved.
CONTEXT: Admin Panel — admin data context — staff permissions saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.staffProfileUpdated
EXACT ENGLISH: Staff profile updated.
CONTEXT: Admin Panel — admin data context — staff profile updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.staffRemoved
EXACT ENGLISH: Staff member {name} removed successfully.
CONTEXT: Admin Panel — admin data context — staff removed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.adminDataContext.staffStatusSetTo
EXACT ENGLISH: Staff member {name} status set to {status}.
CONTEXT: Admin Panel — admin data context — staff status set to
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}, {status}
```

```
KEY: admin.adminDataContext.statusUpdatedForCountProducts
EXACT ENGLISH: Status updated for {count} products.
CONTEXT: Admin Panel — admin data context — status updated for count products
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.adminDataContext.storeSettingsSaved
EXACT ENGLISH: Store settings saved.
CONTEXT: Admin Panel — admin data context — store settings saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.theFragranceCouldNotBe
EXACT ENGLISH: The fragrance could not be removed or archived. Please try again.
CONTEXT: Admin Panel — admin data context — the fragrance could not be
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.thePrimarySuperAdminMuhammad
EXACT ENGLISH: The Primary Super Admin (Muhammad Hamdan) is protected and cannot be deactivated.
CONTEXT: Admin Panel — admin data context — the primary super admin muhammad
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.thePrimarySuperAdminMuhammad2
EXACT ENGLISH: The Primary Super Admin (Muhammad Hamdan) is protected and cannot be removed.
CONTEXT: Admin Panel — admin data context — the primary super admin muhammad2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.trackingInformationSaved
EXACT ENGLISH: Tracking information saved.
CONTEXT: Admin Panel — admin data context — tracking information saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminDataContext.productNameSaved
EXACT ENGLISH: Product "{name}" saved.
CONTEXT: Admin Panel — admin data context — product name saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.adminDataContext.nameUpdated
EXACT ENGLISH: {name} updated.
CONTEXT: Admin Panel — admin data context — name updated
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.adminDataContext.countProductsProcessed
EXACT ENGLISH: {count} products processed.
CONTEXT: Admin Panel — admin data context — count products processed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.adminDataContext.categoryNameCreated
EXACT ENGLISH: Category "{name}" created.
CONTEXT: Admin Panel — admin data context — category name created
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.adminDataContext.collectionNameCreated
EXACT ENGLISH: Collection "{name}" created.
CONTEXT: Admin Panel — admin data context — collection name created
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.adminDataContext.trackingSavedWithId
EXACT ENGLISH: Tracking saved — {id}.
CONTEXT: Admin Panel — admin data context — tracking saved with id
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {id}
```

```
KEY: admin.adminDataContext.stockAdjustedFor
EXACT ENGLISH: Stock for "{name}" adjusted by {amount}.
CONTEXT: Admin Panel — admin data context — stock adjusted for
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: interpolation: {name}, {amount}
```

```
KEY: admin.adminDataContext.reminderRecordedNoEmail
EXACT ENGLISH: Recovery reminder recorded.
CONTEXT: Admin Panel — admin data context — reminder recorded no email
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/context/AdminDataContext.tsx
NOTES: —
```

```
KEY: admin.adminLayout.accessRestricted
EXACT ENGLISH: Access Restricted
CONTEXT: Admin Panel — admin layout — access restricted
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminLayout.tsx
NOTES: —
```

```
KEY: admin.adminLayout.returnToPermittedWorkspace
EXACT ENGLISH: Return to Permitted Workspace
CONTEXT: Admin Panel — admin layout — return to permitted workspace
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminLayout.tsx
NOTES: —
```

```
KEY: admin.adminLayout.skipToContent
EXACT ENGLISH: Skip to content
CONTEXT: Admin Panel — admin layout — skip to content
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminLayout.tsx
NOTES: —
```

```
KEY: admin.adminLayout.roleDeniedPrefix
EXACT ENGLISH: Your assigned staff role (
CONTEXT: Admin Panel — admin layout — role denied prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminLayout.tsx
NOTES: —
```

```
KEY: admin.adminLayout.roleDeniedSuffix
EXACT ENGLISH: ) does not have authorization to view or manage the section at
CONTEXT: Admin Panel — admin layout — role denied suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/components/AdminLayout.tsx
NOTES: —
```

```
KEY: admin.adminSearchModal.searchProductsSkusOrdersCustomers
EXACT ENGLISH: Search products, SKUs, orders, customers, coupons…
CONTEXT: Admin Panel — admin search modal — search products skus orders customers
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminSearchModal.tsx
NOTES: —
```

```
KEY: admin.adminSidebar.liveStorefront
EXACT ENGLISH: Live Storefront
CONTEXT: Admin Panel — admin sidebar — live storefront
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.adminSidebar.logout
EXACT ENGLISH: Logout
CONTEXT: Admin Panel — admin sidebar — logout
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.adminSidebar.signOutOfAdminConsole
EXACT ENGLISH: Sign out of Admin Console
CONTEXT: Admin Panel — admin sidebar — sign out of admin console
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.adminSidebar.signedOutOfAdminSession
EXACT ENGLISH: Signed out of admin session.
CONTEXT: Admin Panel — admin sidebar — signed out of admin session
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.adminSidebar.viewLiveBoutiqueStorefront
EXACT ENGLISH: View Live Boutique Storefront
CONTEXT: Admin Panel — admin sidebar — view live boutique storefront
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.adminSidebar.brandTooltip
EXACT ENGLISH: HM Signature Luxury Fragrance
CONTEXT: Admin Panel — admin sidebar — brand tooltip
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.adminSidebar.luxuryFragrance
EXACT ENGLISH: LUXURY FRAGRANCE
CONTEXT: Admin Panel — admin sidebar — luxury fragrance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.breadcrumb.admin
EXACT ENGLISH: Admin
CONTEXT: Admin Panel — breadcrumb — admin
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/Breadcrumb.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.chartCard.bucket
EXACT ENGLISH: Bucket
CONTEXT: Admin Panel — chart card — bucket
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ChartCard.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.chartCard.hideData
EXACT ENGLISH: Hide data
CONTEXT: Admin Panel — chart card — hide data
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ChartCard.tsx
NOTES: —
```

```
KEY: admin.chartCard.noRowsForPanel
EXACT ENGLISH: The aggregation returned no rows for this panel.
CONTEXT: Admin Panel — chart card — no rows for panel
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AnalyticsBreakdownTable.tsx, src/admin/components/ChartCard.tsx
NOTES: —
```

```
KEY: admin.chartCard.presentedAsTable
EXACT ENGLISH: {title}, presented as a table.
CONTEXT: Admin Panel — chart card — presented as table
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/components/ChartCard.tsx
NOTES: interpolation: {title}
```

```
KEY: admin.chartCard.secondary
EXACT ENGLISH: secondary
CONTEXT: Admin Panel — chart card — secondary
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ChartCard.tsx
NOTES: —
```

```
KEY: admin.chartCard.showData
EXACT ENGLISH: Show data
CONTEXT: Admin Panel — chart card — show data
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ChartCard.tsx
NOTES: —
```

```
KEY: admin.chartCard.totalPeak
EXACT ENGLISH: total · peak
CONTEXT: Admin Panel — chart card — total peak
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/ChartCard.tsx
NOTES: —
```

```
KEY: admin.chartCard.value
EXACT ENGLISH: Value
CONTEXT: Admin Panel — chart card — value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ChartCard.tsx, src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.chartCard.seriesNoRows
EXACT ENGLISH: {label}: no rows.
CONTEXT: Admin Panel — chart card — series no rows
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/components/ChartCard.tsx
NOTES: interpolation: {label}
```

```
KEY: admin.chartCard.pointsCount
EXACT ENGLISH: {count} points
CONTEXT: Admin Panel — chart card — points count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ChartCard.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.chartCard.rowAllZero
EXACT ENGLISH: 1 row returned, every value is zero.
CONTEXT: Admin Panel — chart card — row all zero
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/ChartCard.tsx
NOTES: —
```

```
KEY: admin.chartCard.rowsAllZero
EXACT ENGLISH: {count} rows returned, every value is zero.
CONTEXT: Admin Panel — chart card — rows all zero
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/ChartCard.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.customerDetail.activity
EXACT ENGLISH: Activity
CONTEXT: Admin Panel — customer detail — activity
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.addressesTheClientSavedTo
EXACT ENGLISH: Addresses the client saved to their account. Read-only for staff, and only visible here because staff policies grant SELECT on the address table.
CONTEXT: Admin Panel — customer detail — addresses the client saved to
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.addressesUsedOnOrders
EXACT ENGLISH: Addresses used on orders
CONTEXT: Admin Panel — customer detail — addresses used on orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.allValuesReturnedByThe
EXACT ENGLISH: All values returned by the customer aggregates query.
CONTEXT: Admin Panel — customer detail — all values returned by the
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.backToCustomers
EXACT ENGLISH: Back to Customers
CONTEXT: Admin Panel — customer detail — back to customers
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.clientProfileNotFound
EXACT ENGLISH: Client Profile Not Found
CONTEXT: Admin Panel — customer detail — client profile not found
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.clientProfileSections
EXACT ENGLISH: Client profile sections
CONTEXT: Admin Panel — customer detail — client profile sections
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.clientProfileUnavailable
EXACT ENGLISH: Client profile unavailable
CONTEXT: Admin Panel — customer detail — client profile unavailable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.clientReview
EXACT ENGLISH: Client review
CONTEXT: Admin Panel — customer detail — client review
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.countFromTheCustomerAggregates
EXACT ENGLISH: Count from the customer aggregates query (wishlist_items joined through this client's wishlist).
CONTEXT: Admin Panel — customer detail — count from the customer aggregates
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.derivedFromTheShippingAddress
EXACT ENGLISH: Derived from the shipping address on this client's orders. These are the destinations actually used at checkout, which can differ from the saved address book above.
CONTEXT: Admin Panel — customer detail — derived from the shipping address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.itemLevelWishlistNotAvailable
EXACT ENGLISH: Item-level wishlist: not available
CONTEXT: Admin Panel — customer detail — item level wishlist not available
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.lifetimeSpend
EXACT ENGLISH: Lifetime Spend
CONTEXT: Admin Panel — customer detail — lifetime spend
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.mergedChronologicalFeedOfOrder
EXACT ENGLISH: Merged chronological feed of order status events, payments and refunds for this client. Status-change notes and payment references are omitted here.
CONTEXT: Admin Panel — customer detail — merged chronological feed of order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noEmailOnFile
EXACT ENGLISH: No email on file
CONTEXT: Admin Panel — customer detail — no email on file
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx, src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noOrdersAvailable
EXACT ENGLISH: No orders available
CONTEXT: Admin Panel — customer detail — no orders available
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noPhoneOnFile
EXACT ENGLISH: No phone on file
CONTEXT: Admin Panel — customer detail — no phone on file
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.notAvailable
EXACT ENGLISH: Not available
CONTEXT: Admin Panel — customer detail — not available
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.notFound
EXACT ENGLISH: Not found
CONTEXT: Admin Panel — customer detail — not found
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.orderRecordsReturnedByThe
EXACT ENGLISH: Order records returned by the admin orders feed for this client.
CONTEXT: Admin Panel — customer detail — order records returned by the
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.recordedCounts
EXACT ENGLISH: Recorded Counts
CONTEXT: Admin Panel — customer detail — recorded counts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.refundRequested
EXACT ENGLISH: Refund requested
CONTEXT: Admin Panel — customer detail — refund requested
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.reloadClientProfile
EXACT ENGLISH: Reload client profile
CONTEXT: Admin Panel — customer detail — reload client profile
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.reviewRowsReturnedByThe
EXACT ENGLISH: Review rows returned by the admin reviews feed that match this client's email.
CONTEXT: Admin Panel — customer detail — review rows returned by the
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.savedAddressBook
EXACT ENGLISH: Saved address book
CONTEXT: Admin Panel — customer detail — saved address book
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.wishlist
EXACT ENGLISH: Wishlist
CONTEXT: Admin Panel — customer detail — wishlist
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.wishlistItems
EXACT ENGLISH: Wishlist items
CONTEXT: Admin Panel — customer detail — wishlist items
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.anyStatus
EXACT ENGLISH: Any status
CONTEXT: Admin Panel — customer detail — any status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.clientId
EXACT ENGLISH: Client ID
CONTEXT: Admin Panel — customer detail — client id
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.clientSince
EXACT ENGLISH: Client since {date}
CONTEXT: Admin Panel — customer detail — client since
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: interpolation: {date}
```

```
KEY: admin.customerDetail.computedByTheDatabase
EXACT ENGLISH: Computed by the database
CONTEXT: Admin Panel — customer detail — computed by the database
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.dateNotRecorded
EXACT ENGLISH: Date not recorded
CONTEXT: Admin Panel — customer detail — date not recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.email
EXACT ENGLISH: Email
CONTEXT: Admin Panel — customer detail — email
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.customerDetail.excludesCancelled
EXACT ENGLISH: Excludes cancelled
CONTEXT: Admin Panel — customer detail — excludes cancelled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.itemCountMany
EXACT ENGLISH: {count} items
CONTEXT: Admin Panel — customer detail — item count many
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.customerDetail.itemCountOne
EXACT ENGLISH: {count} item
CONTEXT: Admin Panel — customer detail — item count one
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.customerDetail.joined
EXACT ENGLISH: Joined
CONTEXT: Admin Panel — customer detail — joined
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.customerDetail.lastUsedOn
EXACT ENGLISH: Last used {date}
CONTEXT: Admin Panel — customer detail — last used on
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: interpolation: {date}
```

```
KEY: admin.customerDetail.methodNotRecorded
EXACT ENGLISH: method not recorded
CONTEXT: Admin Panel — customer detail — method not recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.name
EXACT ENGLISH: Name
CONTEXT: Admin Panel — customer detail — name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.customerDetail.noActivityEvents
EXACT ENGLISH: No order, payment or refund events were returned for this client.
CONTEXT: Admin Panel — customer detail — no activity events
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noDateRecorded
EXACT ENGLISH: date not recorded
CONTEXT: Admin Panel — customer detail — no date recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noLineItemsReturned
EXACT ENGLISH: No line items returned
CONTEXT: Admin Panel — customer detail — no line items returned
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noOrderRecordsReason
EXACT ENGLISH: No order records were returned for this client, so there is nothing to show here.
CONTEXT: Admin Panel — customer detail — no order records reason
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noOrdersToDeriveAddresses
EXACT ENGLISH: This client has no orders in the admin feed, so there are no shipping addresses to derive.
CONTEXT: Admin Panel — customer detail — no orders to derive addresses
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noRecipientRecorded
EXACT ENGLISH: No recipient recorded
CONTEXT: Admin Panel — customer detail — no recipient recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noReviewRowsAvailable
EXACT ENGLISH: No review rows available
CONTEXT: Admin Panel — customer detail — no review rows available
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noReviewsSubmitted
EXACT ENGLISH: This client has not submitted any reviews.
CONTEXT: Admin Panel — customer detail — no reviews submitted
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noWishlistItemsBody
EXACT ENGLISH: This client has no saved wishlist items, and no item list is available through the admin services.
CONTEXT: Admin Panel — customer detail — no wishlist items body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.noneRecorded
EXACT ENGLISH: None recorded
CONTEXT: Admin Panel — customer detail — none recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.notFoundBody
EXACT ENGLISH: The client directory returned no record for this identifier. The account may have been removed, or your staff role may not have visibility of it.
CONTEXT: Admin Panel — customer detail — not found body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.notRecorded
EXACT ENGLISH: Not recorded
CONTEXT: Admin Panel — customer detail — not recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.openOrder
EXACT ENGLISH: Open order
CONTEXT: Admin Panel — customer detail — open order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.orderActivityTitle
EXACT ENGLISH: Order {number}
CONTEXT: Admin Panel — customer detail — order activity title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: interpolation: {number}
```

```
KEY: admin.customerDetail.orderCountMany
EXACT ENGLISH: {count} orders
CONTEXT: Admin Panel — customer detail — order count many
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.customerDetail.orderCountMismatchNote
EXACT ENGLISH: Note: the aggregates query counts orders linked to this account id ({aggregateCount}); the orders feed scoped to this profile returned {feedCount} (matched by email or phone).
CONTEXT: Admin Panel — customer detail — order count mismatch note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: interpolation: {aggregateCount}, {feedCount}
```

```
KEY: admin.customerDetail.orderCountOne
EXACT ENGLISH: {count} order
CONTEXT: Admin Panel — customer detail — order count one
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.customerDetail.ordersWithoutShippingAddress
EXACT ENGLISH: The orders linked to this client did not include a shipping address.
CONTEXT: Admin Panel — customer detail — orders without shipping address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.paymentActivityTitle
EXACT ENGLISH: Payment · {method}
CONTEXT: Admin Panel — customer detail — payment activity title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: interpolation: {method}
```

```
KEY: admin.customerDetail.paymentMethodNotRecorded
EXACT ENGLISH: Payment method not recorded
CONTEXT: Admin Panel — customer detail — payment method not recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.read
EXACT ENGLISH: Read
CONTEXT: Admin Panel — customer detail — read
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.customerDetail.readFullReviewFor
EXACT ENGLISH: Read full review for {product}
CONTEXT: Admin Panel — customer detail — read full review for
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: interpolation: {product}
```

```
KEY: admin.customerDetail.retry
EXACT ENGLISH: Retry
CONTEXT: Admin Panel — customer detail — retry
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.customerDetail.reviewRowsFeedMismatchBody
EXACT ENGLISH: The database reports {count} review(s) for this account, but the reviews feed returned no matching rows (they are counted by account id, and the feed exposes email only).
CONTEXT: Admin Panel — customer detail — review rows feed mismatch body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.customerDetail.savedItems
EXACT ENGLISH: Saved items
CONTEXT: Admin Panel — customer detail — saved items
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.segment
EXACT ENGLISH: Segment
CONTEXT: Admin Panel — customer detail — segment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.customerDetail.tabActivity
EXACT ENGLISH: Activity
CONTEXT: Admin Panel — customer detail — tab activity
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.tabAddresses
EXACT ENGLISH: Addresses
CONTEXT: Admin Panel — customer detail — tab addresses
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customerDetail.wishlistCountOnlyBody
EXACT ENGLISH: The admin services expose the wishlist count but no query for the individual saved products, so the items themselves are not shown rather than guessed.
CONTEXT: Admin Panel — customer detail — wishlist count only body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.customers.accountStatus
EXACT ENGLISH: Account Status
CONTEXT: Admin Panel — customers — account status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx, src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.allSegments
EXACT ENGLISH: All segments
CONTEXT: Admin Panel — customers — all segments
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.allStatuses
EXACT ENGLISH: All statuses
CONTEXT: Admin Panel — customers — all statuses
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.atLeastOneNonCancelled
EXACT ENGLISH: At least one non-cancelled order
CONTEXT: Admin Panel — customers — at least one non cancelled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.clientDirectory
EXACT ENGLISH: Client directory unavailable
CONTEXT: Admin Panel — customers — client directory
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.clientsWithOrders
EXACT ENGLISH: Clients With Orders
CONTEXT: Admin Panel — customers — clients with orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.customer
EXACT ENGLISH: Customer
CONTEXT: Admin Panel — customers — customer
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.filterClientsByAccountStatus
EXACT ENGLISH: Filter clients by account status
CONTEXT: Admin Panel — customers — filter clients by account status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.filterClientsBySegment
EXACT ENGLISH: Filter clients by segment
CONTEXT: Admin Panel — customers — filter clients by segment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.lastOrder
EXACT ENGLISH: Last Order
CONTEXT: Admin Panel — customers — last order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx, src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.loadingClientDirectory
EXACT ENGLISH: Loading client directory…
CONTEXT: Admin Panel — customers — loading client directory
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.noOrdersYet
EXACT ENGLISH: No orders yet
CONTEXT: Admin Panel — customers — no orders yet
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.phone
EXACT ENGLISH: Phone
CONTEXT: Admin Panel — customers — phone
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx, src/admin/pages/CustomersList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.customers.registeredCustomerAccounts
EXACT ENGLISH: Registered customer accounts
CONTEXT: Admin Panel — customers — registered customer accounts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.reload
EXACT ENGLISH: Reload
CONTEXT: Admin Panel — customers — reload
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.customers.reloadClientDirectory
EXACT ENGLISH: Reload client directory
CONTEXT: Admin Panel — customers — reload client directory
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.repeatClients
EXACT ENGLISH: Repeat Clients
CONTEXT: Admin Panel — customers — repeat clients
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.searchNameEmailOrPhone
EXACT ENGLISH: Search name, email or phone...
CONTEXT: Admin Panel — customers — search name email or phone
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.segment
EXACT ENGLISH: segment
CONTEXT: Admin Panel — customers — segment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.sortClients
EXACT ENGLISH: Sort clients
CONTEXT: Admin Panel — customers — sort clients
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.sumOfLifetimeSpendExcludes
EXACT ENGLISH: Sum of lifetime spend, excludes cancelled
CONTEXT: Admin Panel — customers — sum of lifetime spend excludes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.totalCapturedValue
EXACT ENGLISH: Total Captured Value
CONTEXT: Admin Panel — customers — total captured value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.totalClients
EXACT ENGLISH: Total Clients
CONTEXT: Admin Panel — customers — total clients
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx, src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.totalSpent
EXACT ENGLISH: Total Spent
CONTEXT: Admin Panel — customers — total spent
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.twoOrMoreOrders
EXACT ENGLISH: Two or more orders
CONTEXT: Admin Panel — customers — two or more orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.ascending
EXACT ENGLISH: Ascending
CONTEXT: Admin Panel — customers — ascending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.changeSortDirection
EXACT ENGLISH: Change sort direction (currently {direction})
CONTEXT: Admin Panel — customers — change sort direction
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: interpolation: {direction}
```

```
KEY: admin.customers.clientsEmptyBody
EXACT ENGLISH: Customer accounts created on the storefront appear here, together with their order activity.
CONTEXT: Admin Panel — customers — clients empty body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.clientsFilteredEmptyBody
EXACT ENGLISH: Adjust the search term or clear the segment and status filters.
CONTEXT: Admin Panel — customers — clients filtered empty body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.descending
EXACT ENGLISH: Descending
CONTEXT: Admin Panel — customers — descending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.directoryOverview
EXACT ENGLISH: Directory overview
CONTEXT: Admin Panel — customers — directory overview
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.eyebrow
EXACT ENGLISH: Client Relations
CONTEXT: Admin Panel — customers — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.intro
EXACT ENGLISH: Order counts, lifetime spend and segments come from the customer aggregates query and exclude cancelled orders.
CONTEXT: Admin Panel — customers — intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.noClientsMatchFilters
EXACT ENGLISH: No clients match these filters
CONTEXT: Admin Panel — customers — no clients match filters
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.noClientsRegisteredYet
EXACT ENGLISH: No clients registered yet
CONTEXT: Admin Panel — customers — no clients registered yet
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.openProfileFor
EXACT ENGLISH: Open profile for {name}
CONTEXT: Admin Panel — customers — open profile for
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.customers.pageTitle
EXACT ENGLISH: Registered Clients
CONTEXT: Admin Panel — customers — page title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.customers.retry
EXACT ENGLISH: Retry
CONTEXT: Admin Panel — customers — retry
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.customers.shownSummary
EXACT ENGLISH: {shown} of {total} clients shown. Search is applied to the loaded client records. Lifetime spend and order counts exclude cancelled orders; “Last Order” reflects the most recent order of any status.
CONTEXT: Admin Panel — customers — shown summary
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: interpolation: {shown}, {total}
```

```
KEY: admin.customers.shownSummaryFiltered
EXACT ENGLISH: {shown} of {total} clients shown (filtered). Search is applied to the loaded client records. Lifetime spend and order counts exclude cancelled orders; “Last Order” reflects the most recent order of any status.
CONTEXT: Admin Panel — customers — shown summary filtered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: interpolation: {shown}, {total}
```

```
KEY: admin.customers.sortClientName
EXACT ENGLISH: Sort: Client name
CONTEXT: Admin Panel — customers — sort client name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.customers.sortJoined
EXACT ENGLISH: Sort: Joined
CONTEXT: Admin Panel — customers — sort joined
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.customers.sortLastOrder
EXACT ENGLISH: Sort: Last order
CONTEXT: Admin Panel — customers — sort last order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.customers.sortOrders
EXACT ENGLISH: Sort: Orders
CONTEXT: Admin Panel — customers — sort orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.customers.sortSegment
EXACT ENGLISH: Sort: Segment
CONTEXT: Admin Panel — customers — sort segment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.customers.sortTotalSpent
EXACT ENGLISH: Sort: Total spent
CONTEXT: Admin Panel — customers — sort total spent
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.dashboard.actionRequired
EXACT ENGLISH: Action required
CONTEXT: Admin Panel — dashboard — action required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.cancelledOrders
EXACT ENGLISH: Cancelled Orders
CONTEXT: Admin Panel — dashboard — cancelled orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx, src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.dashboard.client
EXACT ENGLISH: Client
CONTEXT: Admin Panel — dashboard — client
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.dashboard.completedAcquisitions
EXACT ENGLISH: Completed acquisitions
CONTEXT: Admin Panel — dashboard — completed acquisitions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.contentManagerFallback
EXACT ENGLISH: Content Manager
CONTEXT: Admin Panel — dashboard — content manager fallback
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.courierDispatched
EXACT ENGLISH: Courier dispatched
CONTEXT: Admin Panel — dashboard — courier dispatched
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.deliveredOrders
EXACT ENGLISH: Delivered Orders
CONTEXT: Admin Panel — dashboard — delivered orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.destinationTransit
EXACT ENGLISH: Destination transit
CONTEXT: Admin Panel — dashboard — destination transit
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.inAtelierPackaging
EXACT ENGLISH: In Atelier Packaging
CONTEXT: Admin Panel — dashboard — in atelier packaging
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.liveOperationsWorkspace
EXACT ENGLISH: Live operations workspace for pending acquisitions, courier tracking IDs, payment verification, and order dispatch.
CONTEXT: Admin Panel — dashboard — live operations workspace
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.manageAll
EXACT ENGLISH: Manage All
CONTEXT: Admin Panel — dashboard — manage all
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.monitorStatusTransitions
EXACT ENGLISH: Monitor status transitions, courier dispatch, and tracking IDs
CONTEXT: Admin Panel — dashboard — monitor status transitions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.newOrdersToday
EXACT ENGLISH: New Orders Today
CONTEXT: Admin Panel — dashboard — new orders today
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.notAssigned
EXACT ENGLISH: Not Assigned
CONTEXT: Admin Panel — dashboard — not assigned
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.orderFulfilmentDispatchConcierge
EXACT ENGLISH: ORDER FULFILMENT & DISPATCH CONCIERGE
CONTEXT: Admin Panel — dashboard — order fulfilment dispatch concierge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.orderManagerFallback
EXACT ENGLISH: Order Manager
CONTEXT: Admin Panel — dashboard — order manager fallback
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.orderNumber
EXACT ENGLISH: Order Number
CONTEXT: Admin Panel — dashboard — order number
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.payment
EXACT ENGLISH: Payment
CONTEXT: Admin Panel — dashboard — payment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.dashboard.pendingReview
EXACT ENGLISH: Pending Review
CONTEXT: Admin Panel — dashboard — pending review
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.processingBatch
EXACT ENGLISH: Processing batch
CONTEXT: Admin Panel — dashboard — processing batch
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.receivedToday
EXACT ENGLISH: Received today
CONTEXT: Admin Panel — dashboard — received today
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.recentOrdersRequiringFulfilment
EXACT ENGLISH: Recent Orders Requiring Fulfilment
CONTEXT: Admin Panel — dashboard — recent orders requiring fulfilment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.repositoryTotal
EXACT ENGLISH: Repository total
CONTEXT: Admin Panel — dashboard — repository total
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.shippedInTransit
EXACT ENGLISH: Shipped In Transit
CONTEXT: Admin Panel — dashboard — shipped in transit
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.storeManagerFallback
EXACT ENGLISH: Store Manager
CONTEXT: Admin Panel — dashboard — store manager fallback
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.totalLifetimeOrders
EXACT ENGLISH: Total Lifetime Orders
CONTEXT: Admin Panel — dashboard — total lifetime orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.trackingId
EXACT ENGLISH: Tracking ID
CONTEXT: Admin Panel — dashboard — tracking id
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.voidedRequests
EXACT ENGLISH: Voided requests
CONTEXT: Admin Panel — dashboard — voided requests
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.goodMorning
EXACT ENGLISH: Good morning
CONTEXT: Admin Panel — dashboard — good morning
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.dashboard.goodAfternoon
EXACT ENGLISH: Good afternoon
CONTEXT: Admin Panel — dashboard — good afternoon
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.dashboard.goodEvening
EXACT ENGLISH: Good evening
CONTEXT: Admin Panel — dashboard — good evening
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.dashboard.orderOperations
EXACT ENGLISH: Order Operations
CONTEXT: Admin Panel — dashboard — order operations
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.contentOperations
EXACT ENGLISH: Content Operations
CONTEXT: Admin Panel — dashboard — content operations
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.boutiqueOverview
EXACT ENGLISH: Boutique Overview
CONTEXT: Admin Panel — dashboard — boutique overview
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.brandOverview
EXACT ENGLISH: HM Signature Overview
CONTEXT: Admin Panel — dashboard — brand overview
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.fulfilArrow
EXACT ENGLISH: Fulfil →
CONTEXT: Admin Panel — dashboard — fulfil arrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.viewAllOrdersCount
EXACT ENGLISH: View All Orders ({count})
CONTEXT: Admin Panel — dashboard — view all orders count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.dashboard.activeCampaigns
EXACT ENGLISH: Active Campaigns
CONTEXT: Admin Panel — dashboard — active campaigns
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.activeCatalogSkus
EXACT ENGLISH: Active catalog SKUs
CONTEXT: Admin Panel — dashboard — active catalog skus
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.activeExtraits
EXACT ENGLISH: Active extraits
CONTEXT: Admin Panel — dashboard — active extraits
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.activeFragrances
EXACT ENGLISH: Active Fragrances
CONTEXT: Admin Panel — dashboard — active fragrances
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.addFragrance
EXACT ENGLISH: Add Fragrance
CONTEXT: Admin Panel — dashboard — add fragrance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.addNewFragrance
EXACT ENGLISH: Add New Fragrance
CONTEXT: Admin Panel — dashboard — add new fragrance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.aiBusinessIntelligence
EXACT ENGLISH: AI Business Intelligence
CONTEXT: Admin Panel — dashboard — ai business intelligence
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.analysing
EXACT ENGLISH: Analysing…
CONTEXT: Admin Panel — dashboard — analysing
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.approveOrRejectTestimonials
EXACT ENGLISH: Approve or reject client testimonials
CONTEXT: Admin Panel — dashboard — approve or reject testimonials
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.atelierPipelineTelemetry
EXACT ENGLISH: Atelier Pipeline Telemetry:
CONTEXT: Admin Panel — dashboard — atelier pipeline telemetry
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.atelierRestockAlert
EXACT ENGLISH: Atelier restock alert
CONTEXT: Admin Panel — dashboard — atelier restock alert
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.auditArrow
EXACT ENGLISH: Audit →
CONTEXT: Admin Panel — dashboard — audit arrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.bannersAndSales
EXACT ENGLISH: Banners & sales
CONTEXT: Admin Panel — dashboard — banners and sales
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.catalogSkus
EXACT ENGLISH: Catalog SKUs
CONTEXT: Admin Panel — dashboard — catalog skus
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.category
EXACT ENGLISH: Category
CONTEXT: Admin Panel — dashboard — category
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.cmsCatalogContentWorkspace
EXACT ENGLISH: CMS CATALOG & CONTENT WORKSPACE
CONTEXT: Admin Panel — dashboard — cms catalog content workspace
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.cmsLayoutBlocks
EXACT ENGLISH: CMS layout blocks
CONTEXT: Admin Panel — dashboard — cms layout blocks
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.codCollectionReview
EXACT ENGLISH: COD Collection Review
CONTEXT: Admin Panel — dashboard — cod collection review
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.codOrdersPendingCollection
EXACT ENGLISH: {count} COD orders pending collection
CONTEXT: Admin Panel — dashboard — cod orders pending collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.dashboard.completedDeliveries
EXACT ENGLISH: Completed deliveries
CONTEXT: Admin Panel — dashboard — completed deliveries
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.computedFromStoredOrders
EXACT ENGLISH: Computed from stored orders; cancelled orders are excluded.
CONTEXT: Admin Panel — dashboard — computed from stored orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.courierDispatchReminder
EXACT ENGLISH: Courier Dispatch Reminder:
CONTEXT: Admin Panel — dashboard — courier dispatch reminder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.courierDispatchReminderNote
EXACT ENGLISH: Confirm tracking ID and assign express courier before updating status to "Shipped". Automated tracking notifications will be dispatched to clients immediately.
CONTEXT: Admin Panel — dashboard — courier dispatch reminder note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.curateRareExtraitsIntro
EXACT ENGLISH: Curate rare extraits de parfum, categories, homepage CMS blocks, and moderate client reviews.
CONTEXT: Admin Panel — dashboard — curate rare extraits intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.curatedCollections
EXACT ENGLISH: Curated Collections
CONTEXT: Admin Panel — dashboard — curated collections
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.dailyOrderValueLastDays
EXACT ENGLISH: Daily order value, last 90 days
CONTEXT: Admin Panel — dashboard — daily order value last days
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.day
EXACT ENGLISH: Day
CONTEXT: Admin Panel — dashboard — day
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.dashboard.deliveredOfTotalOrders
EXACT ENGLISH: {delivered} of {total} orders
CONTEXT: Admin Panel — dashboard — delivered of total orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {delivered}, {total}
```

```
KEY: admin.dashboard.deliveredRate
EXACT ENGLISH: Delivered Rate
CONTEXT: Admin Panel — dashboard — delivered rate
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.digitalProofAudit
EXACT ENGLISH: Digital Proof Audit
CONTEXT: Admin Panel — dashboard — digital proof audit
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.editCmsArrow
EXACT ENGLISH: Edit CMS →
CONTEXT: Admin Panel — dashboard — edit cms arrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.editDescriptionsNotePyramids
EXACT ENGLISH: Edit descriptions, note pyramids, prices, and obsidian flacon imagery
CONTEXT: Admin Panel — dashboard — edit descriptions note pyramids
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.feedbackTotal
EXACT ENGLISH: Feedback total
CONTEXT: Admin Panel — dashboard — feedback total
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.fragranceCategories
EXACT ENGLISH: Fragrance Categories
CONTEXT: Admin Panel — dashboard — fragrance categories
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.fragranceExtraitsCatalog
EXACT ENGLISH: Fragrance Extraits Catalog
CONTEXT: Admin Panel — dashboard — fragrance extraits catalog
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.generateInsights
EXACT ENGLISH: Generate insights
CONTEXT: Admin Panel — dashboard — generate insights
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.generatedInsightsFooter
EXACT ENGLISH: Generated {at} · aggregated metrics only, no customer records shared
CONTEXT: Admin Panel — dashboard — generated insights footer
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {at}
```

```
KEY: admin.dashboard.highestRevenueLastDays
EXACT ENGLISH: Highest revenue in the last {days} days
CONTEXT: Admin Panel — dashboard — highest revenue last days
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {days}
```

```
KEY: admin.dashboard.homepageSections
EXACT ENGLISH: Homepage Sections
CONTEXT: Admin Panel — dashboard — homepage sections
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.inBottlePackaging
EXACT ENGLISH: In bottle packaging
CONTEXT: Admin Panel — dashboard — in bottle packaging
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.insightsUnavailable
EXACT ENGLISH: Insights are unavailable.
CONTEXT: Admin Panel — dashboard — insights unavailable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.inventoryThresholdsReplenishment
EXACT ENGLISH: Inventory thresholds requiring replenishment
CONTEXT: Admin Panel — dashboard — inventory thresholds replenishment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.latestTransactionsRequiringDispatch
EXACT ENGLISH: Latest transactions requiring dispatch and review
CONTEXT: Admin Panel — dashboard — latest transactions requiring dispatch
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.liveStatusRatiosComputed
EXACT ENGLISH: Live status ratios computed from real order repository
CONTEXT: Admin Panel — dashboard — live status ratios computed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.lowStockRestockAlerts
EXACT ENGLISH: Low Stock Restock Alerts
CONTEXT: Admin Panel — dashboard — low stock restock alerts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.lowStockWarning
EXACT ENGLISH: Low Stock Warning
CONTEXT: Admin Panel — dashboard — low stock warning
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.lowStockWarnings
EXACT ENGLISH: Low Stock Warnings
CONTEXT: Admin Panel — dashboard — low stock warnings
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.manageOrders
EXACT ENGLISH: Manage Orders
CONTEXT: Admin Panel — dashboard — manage orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.moderateArrow
EXACT ENGLISH: Moderate →
CONTEXT: Admin Panel — dashboard — moderate arrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.moderationQueue
EXACT ENGLISH: Moderation queue
CONTEXT: Admin Panel — dashboard — moderation queue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.nOrders
EXACT ENGLISH: {count} orders
CONTEXT: Admin Panel — dashboard — n orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.dashboard.noAiProviderConfigured
EXACT ENGLISH: No AI provider is configured on this deployment.
CONTEXT: Admin Panel — dashboard — no ai provider configured
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.noOrderValueInWindow
EXACT ENGLISH: No order value recorded in this window yet.
CONTEXT: Admin Panel — dashboard — no order value in window
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.noOrdersToDistribute
EXACT ENGLISH: No orders have been placed yet, so there is nothing to distribute.
CONTEXT: Admin Panel — dashboard — no orders to distribute
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.noPendingReviewsToModerate
EXACT ENGLISH: No pending reviews requiring moderation.
CONTEXT: Admin Panel — dashboard — no pending reviews to moderate
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.noSalesInAnalyticsWindow
EXACT ENGLISH: No sales recorded in the analytics window yet.
CONTEXT: Admin Panel — dashboard — no sales in analytics window
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.observationsFromYourMetrics
EXACT ENGLISH: Observations from your own metrics
CONTEXT: Admin Panel — dashboard — observations from your metrics
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.olfactoryFamilies
EXACT ENGLISH: Olfactory families
CONTEXT: Admin Panel — dashboard — olfactory families
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.orderPipelineDistribution
EXACT ENGLISH: Order Pipeline Distribution
CONTEXT: Admin Panel — dashboard — order pipeline distribution
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.orders
EXACT ENGLISH: Orders
CONTEXT: Admin Panel — dashboard — orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.dashboard.ordersToday
EXACT ENGLISH: {live} of {total} orders today
CONTEXT: Admin Panel — dashboard — orders today
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {live}, {total}
```

```
KEY: admin.dashboard.ordersTodayWithCancelled
EXACT ENGLISH: {live} of {total} orders today ({cancelled} cancelled)
CONTEXT: Admin Panel — dashboard — orders today with cancelled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {live}, {total}, {cancelled}
```

```
KEY: admin.dashboard.paymentAuditVerification
EXACT ENGLISH: Payment Audit & Verification
CONTEXT: Admin Panel — dashboard — payment audit verification
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.paymentsPendingVerification
EXACT ENGLISH: {count} payments pending verification
CONTEXT: Admin Panel — dashboard — payments pending verification
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.dashboard.pendingOrders
EXACT ENGLISH: Pending Orders
CONTEXT: Admin Panel — dashboard — pending orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.pendingReviews
EXACT ENGLISH: Pending Reviews
CONTEXT: Admin Panel — dashboard — pending reviews
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.pipelineTelemetryNote
EXACT ENGLISH: {pending} pending order(s) awaiting verification and {delivered} completed delivery record(s) logged in the database.
CONTEXT: Admin Panel — dashboard — pipeline telemetry note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {pending}, {delivered}
```

```
KEY: admin.dashboard.primaryAtelierExecutiveOverview
EXACT ENGLISH: PRIMARY ATELIER EXECUTIVE OVERVIEW
CONTEXT: Admin Panel — dashboard — primary atelier executive overview
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.processingOrders
EXACT ENGLISH: Processing Orders
CONTEXT: Admin Panel — dashboard — processing orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.produceShortWrittenReading
EXACT ENGLISH: Produce a short written reading of revenue, cancellations, refunds, coupon performance and inventory risk using the figures already shown on this page.
CONTEXT: Admin Panel — dashboard — produce short written reading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.publishedFragrances
EXACT ENGLISH: Published Fragrances
CONTEXT: Admin Panel — dashboard — published fragrances
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.rankedOnceFirstOrdersLand
EXACT ENGLISH: Ranked once the first orders land
CONTEXT: Admin Panel — dashboard — ranked once first orders land
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.realtimeTelemetryIntro
EXACT ENGLISH: Real-time telemetry for private fragrance orders, inventory extraits, client subscriptions, staff access, and boutique revenue streams.
CONTEXT: Admin Panel — dashboard — realtime telemetry intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.recentClientOrders
EXACT ENGLISH: Recent Client Orders
CONTEXT: Admin Panel — dashboard — recent client orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.registeredProfiles
EXACT ENGLISH: Registered profiles
CONTEXT: Admin Panel — dashboard — registered profiles
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.requiresAtelierReview
EXACT ENGLISH: Requires atelier review
CONTEXT: Admin Panel — dashboard — requires atelier review
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.restockArrow
EXACT ENGLISH: Restock →
CONTEXT: Admin Panel — dashboard — restock arrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.restockRequired
EXACT ENGLISH: Restock required
CONTEXT: Admin Panel — dashboard — restock required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.revenue
EXACT ENGLISH: Revenue
CONTEXT: Admin Panel — dashboard — revenue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.dashboard.revenueTrend
EXACT ENGLISH: Revenue Trend
CONTEXT: Admin Panel — dashboard — revenue trend
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.reviewArrow
EXACT ENGLISH: Review →
CONTEXT: Admin Panel — dashboard — review arrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.reviewJazzcashRaastReferences
EXACT ENGLISH: Review JazzCash, Raast references and COD collection notices
CONTEXT: Admin Panel — dashboard — review jazzcash raast references
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.reviewsModerationQueue
EXACT ENGLISH: Reviews Moderation Queue
CONTEXT: Admin Panel — dashboard — reviews moderation queue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.specialEditions
EXACT ENGLISH: Special editions
CONTEXT: Admin Panel — dashboard — special editions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.statusOrdersPercent
EXACT ENGLISH: {count} orders ({percent}%)
CONTEXT: Admin Panel — dashboard — status orders percent
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {count}, {percent}
```

```
KEY: admin.dashboard.stockBottlesMin
EXACT ENGLISH: Stock: {count} bottles (Min: {min})
CONTEXT: Admin Panel — dashboard — stock bottles min
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: interpolation: {count}, {min}
```

```
KEY: admin.dashboard.storeManagementWorkspace
EXACT ENGLISH: STORE MANAGEMENT WORKSPACE
CONTEXT: Admin Panel — dashboard — store management workspace
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.storeOperationsOverview
EXACT ENGLISH: Store operations overview, inventory telemetry, client order fulfilment, and sales reports.
CONTEXT: Admin Panel — dashboard — store operations overview
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.todaysRevenue
EXACT ENGLISH: Today's Revenue
CONTEXT: Admin Panel — dashboard — todays revenue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.topPerfumes
EXACT ENGLISH: Top Perfumes
CONTEXT: Admin Panel — dashboard — top perfumes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.totalCatalogSkus
EXACT ENGLISH: Total Catalog SKUs
CONTEXT: Admin Panel — dashboard — total catalog skus
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.totalClientReviews
EXACT ENGLISH: Total Client Reviews
CONTEXT: Admin Panel — dashboard — total client reviews
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.totalFragrances
EXACT ENGLISH: Total Fragrances
CONTEXT: Admin Panel — dashboard — total fragrances
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.totalOrders
EXACT ENGLISH: Total Orders
CONTEXT: Admin Panel — dashboard — total orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.totalRevenue
EXACT ENGLISH: Total Revenue
CONTEXT: Admin Panel — dashboard — total revenue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.unitAcrossOrder
EXACT ENGLISH: {units} unit across {orders} order
CONTEXT: Admin Panel — dashboard — unit across order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · interpolation: {units}, {orders} · [REVIEW POSSIBLE]
```

```
KEY: admin.dashboard.unitAcrossOrders
EXACT ENGLISH: {units} unit across {orders} orders
CONTEXT: Admin Panel — dashboard — unit across orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · interpolation: {units}, {orders} · [REVIEW POSSIBLE]
```

```
KEY: admin.dashboard.unitsAcrossOrder
EXACT ENGLISH: {units} units across {orders} order
CONTEXT: Admin Panel — dashboard — units across order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · interpolation: {units}, {orders} · [REVIEW POSSIBLE]
```

```
KEY: admin.dashboard.unitsAcrossOrders
EXACT ENGLISH: {units} units across {orders} orders
CONTEXT: Admin Panel — dashboard — units across orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · interpolation: {units}, {orders} · [REVIEW POSSIBLE]
```

```
KEY: admin.dashboard.viewAll
EXACT ENGLISH: View All
CONTEXT: Admin Panel — dashboard — view all
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.viewOrderDetails
EXACT ENGLISH: View order details
CONTEXT: Admin Panel — dashboard — view order details
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dashboard.vipAndClientProfiles
EXACT ENGLISH: VIP & Client profiles
CONTEXT: Admin Panel — dashboard — vip and client profiles
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.dataTable.nextPage
EXACT ENGLISH: Next page
CONTEXT: Admin Panel — data table — next page
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/DataTable.tsx
NOTES: —
```

```
KEY: admin.dataTable.noRecordsFound
EXACT ENGLISH: No records found
CONTEXT: Admin Panel — data table — no records found
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/DataTable.tsx
NOTES: —
```

```
KEY: admin.dataTable.noSortableValue
EXACT ENGLISH: {column} has no sortable value
CONTEXT: Admin Panel — data table — no sortable value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/components/DataTable.tsx
NOTES: interpolation: {column}
```

```
KEY: admin.dataTable.previousPage
EXACT ENGLISH: Previous page
CONTEXT: Admin Panel — data table — previous page
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/DataTable.tsx
NOTES: —
```

```
KEY: admin.dataTable.searchRecords
EXACT ENGLISH: Search records...
CONTEXT: Admin Panel — data table — search records
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/DataTable.tsx
NOTES: —
```

```
KEY: admin.dataTable.selectAllRowsOnThis
EXACT ENGLISH: Select all rows on this page
CONTEXT: Admin Panel — data table — select all rows on this
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/admin/components/DataTable.tsx
NOTES: —
```

```
KEY: admin.dataTable.selectThisRow
EXACT ENGLISH: Select this row
CONTEXT: Admin Panel — data table — select this row
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/DataTable.tsx
NOTES: —
```

```
KEY: admin.dataTable.sortBy
EXACT ENGLISH: Sort by {column}
CONTEXT: Admin Panel — data table — sort by
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/components/DataTable.tsx
NOTES: interpolation: {column}
```

```
KEY: admin.dataTable.tryAdjustingFilters
EXACT ENGLISH: Try adjusting your search filters or add a new record.
CONTEXT: Admin Panel — data table — try adjusting filters
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/DataTable.tsx
NOTES: —
```

```
KEY: admin.dataTable.showingRange
EXACT ENGLISH: Showing {from} to {to} of {total} entries
CONTEXT: Admin Panel — data table — showing range
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/DataTable.tsx
NOTES: interpolation: {from}, {to}, {total}
```

```
KEY: admin.googleSeoPreview.snippetPreview
EXACT ENGLISH: Google Search Result Snippet Preview
CONTEXT: Admin Panel — google seo preview — snippet preview
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/GoogleSeoPreview.tsx
NOTES: —
```

```
KEY: admin.imageUploader.altText
EXACT ENGLISH: Alt text
CONTEXT: Admin Panel — image uploader — alt text
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.clickOrDragToUpload
EXACT ENGLISH: Click or drag and drop product photography to upload
CONTEXT: Admin Panel — image uploader — click or drag to upload
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.customImageUrlLabel
EXACT ENGLISH: custom-image-url
CONTEXT: Admin Panel — image uploader — custom image url label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.describeThisImage
EXACT ENGLISH: Describe this image
CONTEXT: Admin Panel — image uploader — describe this image
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.makeImagePrimary
EXACT ENGLISH: Make image {number} primary
CONTEXT: Admin Panel — image uploader — make image primary
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: interpolation: {number}
```

```
KEY: admin.imageUploader.makeThisThePrimaryImage
EXACT ENGLISH: Make this the primary image
CONTEXT: Admin Panel — image uploader — make this the primary image
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.moveImageEarlier
EXACT ENGLISH: Move image earlier
CONTEXT: Admin Panel — image uploader — move image earlier
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.moveImageEarlierNumbered
EXACT ENGLISH: Move image {number} earlier
CONTEXT: Admin Panel — image uploader — move image earlier numbered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: interpolation: {number}
```

```
KEY: admin.imageUploader.moveImageLater
EXACT ENGLISH: Move image later
CONTEXT: Admin Panel — image uploader — move image later
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.moveImageLaterNumbered
EXACT ENGLISH: Move image {number} later
CONTEXT: Admin Panel — image uploader — move image later numbered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: interpolation: {number}
```

```
KEY: admin.imageUploader.primary
EXACT ENGLISH: Primary
CONTEXT: Admin Panel — image uploader — primary
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.imageUploader.productImageNumbered
EXACT ENGLISH: Product image {number}
CONTEXT: Admin Panel — image uploader — product image numbered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: interpolation: {number}
```

```
KEY: admin.imageUploader.removeImage
EXACT ENGLISH: Remove image
CONTEXT: Admin Panel — image uploader — remove image
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.removeImageNumbered
EXACT ENGLISH: Remove image {number}
CONTEXT: Admin Panel — image uploader — remove image numbered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: interpolation: {number}
```

```
KEY: admin.imageUploader.uploadingPhotography
EXACT ENGLISH: Uploading photography to Atelier Storage…
CONTEXT: Admin Panel — image uploader — uploading photography
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.uploadFailed
EXACT ENGLISH: The image could not be uploaded to Supabase Storage. Check the network or permissions.
CONTEXT: Admin Panel — image uploader — upload failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.supportedFormats
EXACT ENGLISH: Supports PNG, JPG and WebP up to 10 MB per image. High resolution is recommended.
CONTEXT: Admin Panel — image uploader — supported formats
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.addCustomImageUrl
EXACT ENGLISH: Add a custom image URL or path
CONTEXT: Admin Panel — image uploader — add custom image url
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.altTextHelp
EXACT ENGLISH: Alternative text is read by screen readers and shown when the image fails to load.
CONTEXT: Admin Panel — image uploader — alt text help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.velvetCrimson
EXACT ENGLISH: Velvet Crimson
CONTEXT: Admin Panel — image uploader — velvet crimson
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ImageUploader.tsx, src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.imageUploader.darkMarble
EXACT ENGLISH: Dark Marble
CONTEXT: Admin Panel — image uploader — dark marble
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ImageUploader.tsx, src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.imageUploader.champagneMarble
EXACT ENGLISH: Champagne Marble
CONTEXT: Admin Panel — image uploader — champagne marble
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ImageUploader.tsx, src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.imageUploader.beigeStone
EXACT ENGLISH: Beige Stone
CONTEXT: Admin Panel — image uploader — beige stone
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.richEbonyWood
EXACT ENGLISH: Rich Ebony Wood
CONTEXT: Admin Panel — image uploader — rich ebony wood
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.imageUploader.midnightSapphire
EXACT ENGLISH: Midnight Sapphire
CONTEXT: Admin Panel — image uploader — midnight sapphire
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: —
```

```
KEY: admin.modal.cancel
EXACT ENGLISH: Cancel
CONTEXT: Admin Panel — modal — cancel
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ImageUploader.tsx, src/admin/components/Modal.tsx, src/admin/pages/AbandonedCartsPage.tsx, src/admin/pages/CategoriesPage.tsx (+11 more)
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.modal.close
EXACT ENGLISH: Close {title}
CONTEXT: Admin Panel — modal — close
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/Modal.tsx
NOTES: interpolation: {title}
```

```
KEY: admin.modal.confirm
EXACT ENGLISH: Confirm
CONTEXT: Admin Panel — modal — confirm
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/Modal.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.nav.coupons
EXACT ENGLISH: Coupons
CONTEXT: Admin Panel — nav — coupons
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSearchModal.tsx, src/admin/components/AdminSidebar.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.nav.customers
EXACT ENGLISH: Customers
CONTEXT: Admin Panel — nav — customers
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSearchModal.tsx, src/admin/components/AdminSidebar.tsx, src/admin/pages/CustomerDetailPage.tsx
NOTES: —
```

```
KEY: admin.nav.orders
EXACT ENGLISH: Orders
CONTEXT: Admin Panel — nav — orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSearchModal.tsx, src/admin/components/AdminSidebar.tsx, src/admin/pages/CustomerDetailPage.tsx, src/admin/pages/CustomersList.tsx (+1 more)
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.nav.products
EXACT ENGLISH: Products
CONTEXT: Admin Panel — nav — products
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSearchModal.tsx, src/admin/components/AdminSidebar.tsx, src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.nav.reconciliation
EXACT ENGLISH: Reconciliation
CONTEXT: Admin Panel — nav — reconciliation
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx, src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.nav.reviews
EXACT ENGLISH: Reviews
CONTEXT: Admin Panel — nav — reviews
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx, src/admin/pages/CustomerDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.nav.staffAndRoles
EXACT ENGLISH: Staff & Roles
CONTEXT: Admin Panel — nav — staff and roles
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminSidebar.tsx, src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.nav.dashboard
EXACT ENGLISH: Dashboard
CONTEXT: Admin Panel — nav — dashboard
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.categories
EXACT ENGLISH: Categories
CONTEXT: Admin Panel — nav — categories
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.collections
EXACT ENGLISH: Collections
CONTEXT: Admin Panel — nav — collections
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.inventory
EXACT ENGLISH: Inventory
CONTEXT: Admin Panel — nav — inventory
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.shipping
EXACT ENGLISH: Shipping
CONTEXT: Admin Panel — nav — shipping
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.homepageCms
EXACT ENGLISH: Homepage CMS
CONTEXT: Admin Panel — nav — homepage cms
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.marketing
EXACT ENGLISH: Marketing
CONTEXT: Admin Panel — nav — marketing
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.notifications
EXACT ENGLISH: Notifications
CONTEXT: Admin Panel — nav — notifications
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.automations
EXACT ENGLISH: Automations
CONTEXT: Admin Panel — nav — automations
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.payments
EXACT ENGLISH: Payments
CONTEXT: Admin Panel — nav — payments
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.refunds
EXACT ENGLISH: Refunds
CONTEXT: Admin Panel — nav — refunds
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.nav.abandonedCarts
EXACT ENGLISH: Abandoned Carts
CONTEXT: Admin Panel — nav — abandoned carts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.seoManagement
EXACT ENGLISH: SEO Management
CONTEXT: Admin Panel — nav — seo management
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.analytics
EXACT ENGLISH: Analytics
CONTEXT: Admin Panel — nav — analytics
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.storeSettings
EXACT ENGLISH: Store Settings
CONTEXT: Admin Panel — nav — store settings
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.international
EXACT ENGLISH: International
CONTEXT: Admin Panel — nav — international
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.nav.localization
EXACT ENGLISH: Localization
CONTEXT: Admin Panel — nav — localization
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.navGroup.overview
EXACT ENGLISH: Overview
CONTEXT: Admin Panel — nav group — overview
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.navGroup.commerce
EXACT ENGLISH: Commerce
CONTEXT: Admin Panel — nav group — commerce
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.navGroup.customers
EXACT ENGLISH: Customers
CONTEXT: Admin Panel — nav group — customers
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.navGroup.content
EXACT ENGLISH: Content
CONTEXT: Admin Panel — nav group — content
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.navGroup.operations
EXACT ENGLISH: Operations
CONTEXT: Admin Panel — nav group — operations
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.navGroup.management
EXACT ENGLISH: Management
CONTEXT: Admin Panel — nav group — management
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.orderStatusTimeline.fulfilmentPipeline
EXACT ENGLISH: Order Fulfilment Pipeline
CONTEXT: Admin Panel — order status timeline — fulfilment pipeline
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/OrderStatusTimeline.tsx
NOTES: —
```

```
KEY: admin.orderStatusTimeline.lifecycleHistory
EXACT ENGLISH: Live lifecycle history from reception to customer delivery.
CONTEXT: Admin Panel — order status timeline — lifecycle history
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/OrderStatusTimeline.tsx
NOTES: —
```

```
KEY: admin.orderStatusTimeline.updateStatus
EXACT ENGLISH: Update Status:
CONTEXT: Admin Panel — order status timeline — update status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/components/OrderStatusTimeline.tsx
NOTES: —
```

```
KEY: admin.orderStatusTimeline.orderStatus
EXACT ENGLISH: Order {status}
CONTEXT: Admin Panel — order status timeline — order status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/components/OrderStatusTimeline.tsx
NOTES: interpolation: {status}
```

```
KEY: admin.orderStatusTimeline.markedAs
EXACT ENGLISH: This order has been marked as {status}.
CONTEXT: Admin Panel — order status timeline — marked as
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/components/OrderStatusTimeline.tsx
NOTES: interpolation: {status}
```

```
KEY: admin.orders.action
EXACT ENGLISH: Action
CONTEXT: Admin Panel — orders — action
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx, src/admin/pages/CustomersList.tsx, src/admin/pages/OrdersList.tsx, src/admin/pages/ProductFormPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.orders.allOrders
EXACT ENGLISH: All Orders
CONTEXT: Admin Panel — orders — all orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.orders.date
EXACT ENGLISH: Date
CONTEXT: Admin Panel — orders — date
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx, src/admin/pages/OrdersList.tsx, src/admin/pages/ReviewsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.orders.itemsCount
EXACT ENGLISH: Items Count
CONTEXT: Admin Panel — orders — items count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.orders.manage
EXACT ENGLISH: Manage
CONTEXT: Admin Panel — orders — manage
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.orders.noOrdersFound
EXACT ENGLISH: No orders found
CONTEXT: Admin Panel — orders — no orders found
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.orders.noTransactionsMatchYourCurrent
EXACT ENGLISH: No transactions match your current status filter.
CONTEXT: Admin Panel — orders — no transactions match your current
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.orders.orderId
EXACT ENGLISH: Order ID
CONTEXT: Admin Panel — orders — order id
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx, src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.orders.searchOrderCustomerNameEmail
EXACT ENGLISH: Search order #, customer name, email...
CONTEXT: Admin Panel — orders — search order customer name email
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.orders.totalAmount
EXACT ENGLISH: Total Amount
CONTEXT: Admin Panel — orders — total amount
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.ordersList.boutiqueOrdersDirectory
EXACT ENGLISH: Boutique Orders Directory
CONTEXT: Admin Panel — orders list — boutique orders directory
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.ordersList.clientConciergeFulfilment
EXACT ENGLISH: CLIENT CONCIERGE & FULFILLMENT
CONTEXT: Admin Panel — orders list — client concierge fulfilment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.ordersList.trackOrderStatusDescription
EXACT ENGLISH: Track order status, manage tracking numbers, verify payments, and inspect client shipping addresses.
CONTEXT: Admin Panel — orders list — track order status description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.addressNotConfirmed
EXACT ENGLISH: This address is not yet confirmed in Supabase Auth.
CONTEXT: Admin Panel — primary admin security card — address not confirmed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.currentAddressStillWorks
EXACT ENGLISH: Your current address still works until you confirm the link.
CONTEXT: Admin Panel — primary admin security card — current address still works
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.currentSignInAddress
EXACT ENGLISH: Current sign-in address
CONTEXT: Admin Panel — primary admin security card — current sign in address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.loadingAccountDetails
EXACT ENGLISH: Loading account details…
CONTEXT: Admin Panel — primary admin security card — loading account details
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.newSignInAddress
EXACT ENGLISH: New sign-in address
CONTEXT: Admin Panel — primary admin security card — new sign in address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.none
EXACT ENGLISH: None
CONTEXT: Admin Panel — primary admin security card — none
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx, src/admin/pages/AbandonedCartsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.primaryAdminSecurityCard.pendingChange
EXACT ENGLISH: Pending change
CONTEXT: Admin Panel — primary admin security card — pending change
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.primarySuperAdminSignIn
EXACT ENGLISH: Primary Super Admin sign-in email
CONTEXT: Admin Panel — primary admin security card — primary super admin sign in
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.requestEmailChange
EXACT ENGLISH: Request email change
CONTEXT: Admin Panel — primary admin security card — request email change
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.sending
EXACT ENGLISH: Sending…
CONTEXT: Admin Panel — primary admin security card — sending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.supabaseNotConnected
EXACT ENGLISH: Supabase Auth is not connected in this environment, so the sign-in address cannot be changed
CONTEXT: Admin Panel — primary admin security card — supabase not connected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.enterACompleteEmailAddress
EXACT ENGLISH: Enter a complete email address before requesting the change.
CONTEXT: Admin Panel — primary admin security card — enter acomplete email address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.roleLockedNote
EXACT ENGLISH: The Super Admin role itself is locked: it cannot be removed, downgraded or handed to another account from this dashboard. Only this address is yours to change.
CONTEXT: Admin Panel — primary admin security card — role locked note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.protected
EXACT ENGLISH: Protected
CONTEXT: Admin Panel — primary admin security card — protected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.primaryAdminSecurityCard.awaitingConfirmation
EXACT ENGLISH: {email} — awaiting confirmation
CONTEXT: Admin Panel — primary admin security card — awaiting confirmation
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: interpolation: {email}
```

```
KEY: admin.primaryAdminSecurityCard.confirmationLinkNote
EXACT ENGLISH: Supabase Auth sends a confirmation link before the address takes effect, so a mistyped or abandoned request cannot lock you out. Sign in with the new address once it is confirmed.
CONTEXT: Admin Panel — primary admin security card — confirmation link note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/PrimaryAdminSecurityCard.tsx
NOTES: —
```

```
KEY: admin.products.actions
EXACT ENGLISH: Actions
CONTEXT: Admin Panel — products — actions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx, src/admin/pages/ProductsList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.products.activateSelected
EXACT ENGLISH: Activate Selected
CONTEXT: Admin Panel — products — activate selected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.activeOnly
EXACT ENGLISH: Active Only
CONTEXT: Admin Panel — products — active only
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.addNewPerfume
EXACT ENGLISH: Add New Perfume
CONTEXT: Admin Panel — products — add new perfume
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.allFamilies
EXACT ENGLISH: All Families
CONTEXT: Admin Panel — products — all families
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.allGenders
EXACT ENGLISH: All Genders
CONTEXT: Admin Panel — products — all genders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.allStatuses
EXACT ENGLISH: All Statuses
CONTEXT: Admin Panel — products — all statuses
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/PaymentsPage.tsx, src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.availableSizes
EXACT ENGLISH: Available Sizes:
CONTEXT: Admin Panel — products — available sizes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.baseNotes
EXACT ENGLISH: Base Notes:
CONTEXT: Admin Panel — products — base notes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.categoryGender
EXACT ENGLISH: Category & Gender
CONTEXT: Admin Panel — products — category gender
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.collection
EXACT ENGLISH: Collection:
CONTEXT: Admin Panel — products — collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.concentration
EXACT ENGLISH: Concentration:
CONTEXT: Admin Panel — products — concentration
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.deactivateSelected
EXACT ENGLISH: Deactivate Selected
CONTEXT: Admin Panel — products — deactivate selected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.deleteAllSelected
EXACT ENGLISH: Delete All Selected
CONTEXT: Admin Panel — products — delete all selected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.deleteFragranceRecord
EXACT ENGLISH: Delete Fragrance Record
CONTEXT: Admin Panel — products — delete fragrance record
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.deleteProduct
EXACT ENGLISH: Delete product
CONTEXT: Admin Panel — products — delete product
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.deleteProduct2
EXACT ENGLISH: Delete Product
CONTEXT: Admin Panel — products — delete product2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.deleteSelected
EXACT ENGLISH: Delete Selected
CONTEXT: Admin Panel — products — delete selected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.duplicateProduct
EXACT ENGLISH: Duplicate product
CONTEXT: Admin Panel — products — duplicate product
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.editFullProduct
EXACT ENGLISH: Edit Full Product
CONTEXT: Admin Panel — products — edit full product
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.editProduct
EXACT ENGLISH: Edit product
CONTEXT: Admin Panel — products — edit product
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.fragrance
EXACT ENGLISH: Fragrance
CONTEXT: Admin Panel — products — fragrance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx, src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.fragranceType
EXACT ENGLISH: Fragrance Type:
CONTEXT: Admin Panel — products — fragrance type
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.heartNotes
EXACT ENGLISH: Heart Notes:
CONTEXT: Admin Panel — products — heart notes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.inactiveOnly
EXACT ENGLISH: Inactive Only
CONTEXT: Admin Panel — products — inactive only
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.lowStockOnly
EXACT ENGLISH: Low Stock Only
CONTEXT: Admin Panel — products — low stock only
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.men
EXACT ENGLISH: men
CONTEXT: Admin Panel — products — men
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx, src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.noPerfumesFound
EXACT ENGLISH: No perfumes found
CONTEXT: Admin Panel — products — no perfumes found
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.price
EXACT ENGLISH: Price
CONTEXT: Admin Panel — products — price
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AdminDashboard.tsx, src/admin/pages/ProductsList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.products.quickViewProductDetails
EXACT ENGLISH: Quick view product details
CONTEXT: Admin Panel — products — quick view product details
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.searchByNameSkuOr
EXACT ENGLISH: Search by name, SKU, or category...
CONTEXT: Admin Panel — products — search by name sku or
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.stockLowestSize
EXACT ENGLISH: Stock (lowest size)
CONTEXT: Admin Panel — products — stock lowest size
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.targetGender
EXACT ENGLISH: Target Gender:
CONTEXT: Admin Panel — products — target gender
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.topNotes
EXACT ENGLISH: Top Notes:
CONTEXT: Admin Panel — products — top notes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.tryResettingYourCategoryOr
EXACT ENGLISH: Try resetting your category or status filters, or add a new fragrance to the catalog.
CONTEXT: Admin Panel — products — try resetting your category or
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.unisex
EXACT ENGLISH: unisex
CONTEXT: Admin Panel — products — unisex
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx, src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.women
EXACT ENGLISH: women
CONTEXT: Admin Panel — products — women
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx, src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.bulkDeleteConfirmMessage
EXACT ENGLISH: Are you sure you want to permanently delete these {count} products?
CONTEXT: Admin Panel — products — bulk delete confirm message
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.products.deleteConfirmMessage
EXACT ENGLISH: Are you sure you want to delete this perfume from the catalog? This action cannot be undone.
CONTEXT: Admin Panel — products — delete confirm message
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.deleteNProducts
EXACT ENGLISH: Delete {count} Products
CONTEXT: Admin Panel — products — delete nproducts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.products.descriptionLabel
EXACT ENGLISH: DESCRIPTION
CONTEXT: Admin Panel — products — description label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.eyebrow
EXACT ENGLISH: CATALOG CONTROL
CONTEXT: Admin Panel — products — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.introBody
EXACT ENGLISH: Manage luxury perfumes, stock levels, pricing, notes, and collection assignments.
CONTEXT: Admin Panel — products — intro body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.inventoryStock
EXACT ENGLISH: Inventory Stock
CONTEXT: Admin Panel — products — inventory stock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.nSelected
EXACT ENGLISH: {count} Selected
CONTEXT: Admin Panel — products — n selected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.products.olfactoryPyramid
EXACT ENGLISH: OLFACTORY PYRAMID
CONTEXT: Admin Panel — products — olfactory pyramid
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.placeholderCaption
EXACT ENGLISH: HM Signature Extrait De Parfum
CONTEXT: Admin Panel — products — placeholder caption
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.skuCategoryLine
EXACT ENGLISH: SKU: {sku} • {category}
CONTEXT: Admin Panel — products — sku category line
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: interpolation: {sku}, {category}
```

```
KEY: admin.products.specsClassification
EXACT ENGLISH: SPECS & CLASSIFICATION
CONTEXT: Admin Panel — products — specs classification
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.products.title
EXACT ENGLISH: Fragrance Products Directory
CONTEXT: Admin Panel — products — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.reconciliation.awaitingPayment
EXACT ENGLISH: Awaiting payment
CONTEXT: Admin Panel — reconciliation — awaiting payment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.difference
EXACT ENGLISH: Difference
CONTEXT: Admin Panel — reconciliation — difference
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.expected
EXACT ENGLISH: Expected
CONTEXT: Admin Panel — reconciliation — expected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.financialControl
EXACT ENGLISH: FINANCIAL CONTROL
CONTEXT: Admin Panel — reconciliation — financial control
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.lastDays
EXACT ENGLISH: Last {days} days
CONTEXT: Admin Panel — reconciliation — last days
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: interpolation: {days}
```

```
KEY: admin.reconciliation.matched
EXACT ENGLISH: Matched
CONTEXT: Admin Panel — reconciliation — matched
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.reconciliation.mismatchMissingRecordOrRefund
EXACT ENGLISH: Mismatch, missing record or refund question
CONTEXT: Admin Panel — reconciliation — mismatch missing record or refund
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.needsAttention
EXACT ENGLISH: Needs attention
CONTEXT: Admin Panel — reconciliation — needs attention
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.noConfirmationRecordedYet
EXACT ENGLISH: No confirmation recorded yet
CONTEXT: Admin Panel — reconciliation — no confirmation recorded yet
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.noOrdersMatchThisFilter
EXACT ENGLISH: No orders match this filter.
CONTEXT: Admin Panel — reconciliation — no orders match this filter
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.noProviderId
EXACT ENGLISH: no provider id
CONTEXT: Admin Panel — reconciliation — no provider id
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.noStatedReference
EXACT ENGLISH: no stated reference
CONTEXT: Admin Panel — reconciliation — no stated reference
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.orderPaymentStatus
EXACT ENGLISH: Order / Payment status
CONTEXT: Admin Panel — reconciliation — order payment status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.ordersInWindow
EXACT ENGLISH: Orders in window
CONTEXT: Admin Panel — reconciliation — orders in window
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.paymentDate
EXACT ENGLISH: Payment date
CONTEXT: Admin Panel — reconciliation — payment date
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.paymentReconciliation
EXACT ENGLISH: Payment Reconciliation
CONTEXT: Admin Panel — reconciliation — payment reconciliation
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.providerMethod
EXACT ENGLISH: Provider / Method
CONTEXT: Admin Panel — reconciliation — provider method
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.recorded
EXACT ENGLISH: Recorded
CONTEXT: Admin Panel — reconciliation — recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.recordedAmountEqualsTheOrder
EXACT ENGLISH: Recorded amount equals the order total
CONTEXT: Admin Panel — reconciliation — recorded amount equals the order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.references
EXACT ENGLISH: References
CONTEXT: Admin Panel — reconciliation — references
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.repeatedProviderTransactions
EXACT ENGLISH: Repeated provider transactions
CONTEXT: Admin Panel — reconciliation — repeated provider transactions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.searchOrderNumberOrReference
EXACT ENGLISH: Search order number or reference…
CONTEXT: Admin Panel — reconciliation — search order number or reference
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.allStatesCount
EXACT ENGLISH: all ({count})
CONTEXT: Admin Panel — reconciliation — all states count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.reconciliation.duplicatePaymentNote
EXACT ENGLISH: {reference} recorded {count} times for {orders}
CONTEXT: Admin Panel — reconciliation — duplicate payment note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: interpolation: {reference}, {count}, {orders}
```

```
KEY: admin.reconciliation.emptyWindowBody
EXACT ENGLISH: No orders were returned for this window. That is either a genuinely empty period or the staff-only reconciliation query was refused for the current session — reloading with a staff sign-in distinguishes the two.
CONTEXT: Admin Panel — reconciliation — empty window body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.intro
EXACT ENGLISH: Compares each order's recorded total with its payment record, provider transaction and processed refunds. This view only reports: nothing here marks an order paid, and a mismatch is never corrected automatically.
CONTEXT: Admin Panel — reconciliation — intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.reconciliation.reload
EXACT ENGLISH: Reload
CONTEXT: Admin Panel — reconciliation — reload
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.refunds.allRefundEntries
EXACT ENGLISH: All refund entries
CONTEXT: Admin Panel — refunds — all refund entries
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.awaitingBankSettlement
EXACT ENGLISH: Awaiting bank settlement
CONTEXT: Admin Panel — refunds — awaiting bank settlement
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.backToPayments
EXACT ENGLISH: Back to Payments
CONTEXT: Admin Panel — refunds — back to payments
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.client
EXACT ENGLISH: Client
CONTEXT: Admin Panel — refunds — client
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx, src/admin/pages/RefundsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.refunds.financialAuditVerification
EXACT ENGLISH: FINANCIAL AUDIT & VERIFICATION
CONTEXT: Admin Panel — refunds — financial audit verification
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx, src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.manualRefundRecordsNote
EXACT ENGLISH: Manual refund records for COD, JazzCash, Raast and Bank Transfer settlements.
CONTEXT: Admin Panel — refunds — manual refund records note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.noRefundsRecordedYet
EXACT ENGLISH: No refunds recorded yet
CONTEXT: Admin Panel — refunds — no refunds recorded yet
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.notes
EXACT ENGLISH: Notes
CONTEXT: Admin Panel — refunds — notes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.refunds.orderDate
EXACT ENGLISH: Order & Date
CONTEXT: Admin Panel — refunds — order date
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.originalPayment
EXACT ENGLISH: Original Payment
CONTEXT: Admin Panel — refunds — original payment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.pendingRefunds
EXACT ENGLISH: Pending Refunds
CONTEXT: Admin Panel — refunds — pending refunds
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.processedRefunds
EXACT ENGLISH: Processed refunds
CONTEXT: Admin Panel — refunds — processed refunds
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.referenceReason
EXACT ENGLISH: Reference / Reason
CONTEXT: Admin Panel — refunds — reference reason
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.refundAmount
EXACT ENGLISH: Refund Amount
CONTEXT: Admin Panel — refunds — refund amount
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.refundLedger
EXACT ENGLISH: Refund Ledger
CONTEXT: Admin Panel — refunds — refund ledger
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx, src/admin/pages/PaymentsPage.tsx, src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.refundRecords
EXACT ENGLISH: Refund Records
CONTEXT: Admin Panel — refunds — refund records
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx, src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.refundStatus
EXACT ENGLISH: Refund Status
CONTEXT: Admin Panel — refunds — refund status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/PaymentsPage.tsx, src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.searchRefundsByOrderClient
EXACT ENGLISH: Search refunds by order, client or reference…
CONTEXT: Admin Panel — refunds — search refunds by order client
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.totalRefunded
EXACT ENGLISH: Total Refunded
CONTEXT: Admin Panel — refunds — total refunded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.viewArrow
EXACT ENGLISH: View →
CONTEXT: Admin Panel — refunds — view arrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.refunds.refundsAppearHereNote
EXACT ENGLISH: Refunds issued from the Payments page will appear here with full audit detail.
CONTEXT: Admin Panel — refunds — refunds appear here note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/RefundsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.allModerationStatuses
EXACT ENGLISH: All Moderation Statuses
CONTEXT: Admin Panel — reviews — all moderation statuses
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.approveReviewForFrontendDisplay
EXACT ENGLISH: Approve review for frontend display
CONTEXT: Admin Panel — reviews — approve review for frontend display
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.clientProduct
EXACT ENGLISH: Client & Product
CONTEXT: Admin Panel — reviews — client product
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.deleteFragranceReview
EXACT ENGLISH: Delete Fragrance Review
CONTEXT: Admin Panel — reviews — delete fragrance review
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.deleteReview
EXACT ENGLISH: Delete review
CONTEXT: Admin Panel — reviews — delete review
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.deleteReview2
EXACT ENGLISH: Delete Review
CONTEXT: Admin Panel — reviews — delete review2
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.moderationActions
EXACT ENGLISH: Moderation Actions
CONTEXT: Admin Panel — reviews — moderation actions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.noReviewsFound
EXACT ENGLISH: No reviews found
CONTEXT: Admin Panel — reviews — no reviews found
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.ratingTitle
EXACT ENGLISH: Rating & Title
CONTEXT: Admin Panel — reviews — rating title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.rejectReview
EXACT ENGLISH: Reject review
CONTEXT: Admin Panel — reviews — reject review
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.reviewTestimonial
EXACT ENGLISH: Review Testimonial
CONTEXT: Admin Panel — reviews — review testimonial
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.searchReviewTitleTextCustomer
EXACT ENGLISH: Search review title, text, customer...
CONTEXT: Admin Panel — reviews — search review title text customer
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.approvedLiveReviews
EXACT ENGLISH: Approved Live Reviews
CONTEXT: Admin Panel — reviews — approved live reviews
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.averageClientRating
EXACT ENGLISH: Average Client Rating
CONTEXT: Admin Panel — reviews — average client rating
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.deleteConfirmMessage
EXACT ENGLISH: Are you sure you want to delete this review from the moderation queue?
CONTEXT: Admin Panel — reviews — delete confirm message
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.eyebrow
EXACT ENGLISH: CLIENT TESTIMONIALS & MODERATION
CONTEXT: Admin Panel — reviews — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.forProduct
EXACT ENGLISH: For: {product}
CONTEXT: Admin Panel — reviews — for product
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: interpolation: {product}
```

```
KEY: admin.reviews.intro
EXACT ENGLISH: Only approved client reviews appear on the customer-facing e-commerce frontend.
CONTEXT: Admin Panel — reviews — intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.pageTitle
EXACT ENGLISH: Fragrance Reviews Moderation Queue
CONTEXT: Admin Panel — reviews — page title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.pendingApprovalQueue
EXACT ENGLISH: Pending Approval Queue
CONTEXT: Admin Panel — reviews — pending approval queue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.reviews.pendingModerationCount
EXACT ENGLISH: Pending Moderation ({count})
CONTEXT: Admin Panel — reviews — pending moderation count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.reviews.reviewsCount
EXACT ENGLISH: {count} Reviews
CONTEXT: Admin Panel — reviews — reviews count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.searchModal.close
EXACT ENGLISH: Close
CONTEXT: Admin Panel — search modal — close
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminSearchModal.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.searchModal.quickNavigateHint
EXACT ENGLISH: Type a product name, order # (e.g., HMS-8921), customer email, or coupon code to quick-navigate.
CONTEXT: Admin Panel — search modal — quick navigate hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/components/AdminSearchModal.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.searchModal.noMatchingRecords
EXACT ENGLISH: No matching records found for "{query}".
CONTEXT: Admin Panel — search modal — no matching records
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminSearchModal.tsx
NOTES: interpolation: {query}
```

```
KEY: admin.shared.add
EXACT ENGLISH: Add
CONTEXT: Admin Panel — shared — add
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/ImageUploader.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.shared.clientContact
EXACT ENGLISH: Client & Contact
CONTEXT: Admin Panel — shared — client contact
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx, src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.shared.loading
EXACT ENGLISH: Loading…
CONTEXT: Admin Panel — shared — loading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.shared.order
EXACT ENGLISH: Order
CONTEXT: Admin Panel — shared — order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx, src/admin/pages/NotificationsPage.tsx, src/admin/pages/ReconciliationPage.tsx, src/admin/pages/RefundsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.shared.profile
EXACT ENGLISH: Profile
CONTEXT: Admin Panel — shared — profile
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomerDetailPage.tsx, src/admin/pages/CustomersList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.shared.status
EXACT ENGLISH: Status
CONTEXT: Admin Panel — shared — status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx, src/admin/pages/AdminDashboard.tsx, src/admin/pages/AnalyticsPage.tsx, src/admin/pages/AutomationsPage.tsx (+8 more)
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.sidebar.collapseSidebar
EXACT ENGLISH: Collapse sidebar (72px)
CONTEXT: Admin Panel — sidebar — collapse sidebar
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.sidebar.expandSidebar
EXACT ENGLISH: Expand sidebar (260px)
CONTEXT: Admin Panel — sidebar — expand sidebar
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminSidebar.tsx
NOTES: —
```

```
KEY: admin.status.active
EXACT ENGLISH: Active
CONTEXT: Admin Panel — status — active
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.status.approved
EXACT ENGLISH: Approved
CONTEXT: Admin Panel — status — approved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.status.cancelled
EXACT ENGLISH: Cancelled
CONTEXT: Admin Panel — status — cancelled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/MarketingPage.tsx, src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.status.confirmed
EXACT ENGLISH: Confirmed
CONTEXT: Admin Panel — status — confirmed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.status.delivered
EXACT ENGLISH: Delivered
CONTEXT: Admin Panel — status — delivered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.status.inactive
EXACT ENGLISH: Inactive
CONTEXT: Admin Panel — status — inactive
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.status.new
EXACT ENGLISH: New
CONTEXT: Admin Panel — status — new
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.status.pending
EXACT ENGLISH: Pending
CONTEXT: Admin Panel — status — pending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.status.processing
EXACT ENGLISH: Processing
CONTEXT: Admin Panel — status — processing
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: —
```

```
KEY: admin.status.recovered
EXACT ENGLISH: recovered
CONTEXT: Admin Panel — status — recovered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AbandonedCartsPage.tsx
NOTES: —
```

```
KEY: admin.status.refunded
EXACT ENGLISH: Refunded
CONTEXT: Admin Panel — status — refunded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx, src/admin/pages/ReconciliationPage.tsx
NOTES: —
```

```
KEY: admin.status.rejected
EXACT ENGLISH: Rejected
CONTEXT: Admin Panel — status — rejected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx, src/admin/pages/ReviewsPage.tsx
NOTES: —
```

```
KEY: admin.status.returning
EXACT ENGLISH: Returning
CONTEXT: Admin Panel — status — returning
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.status.shipped
EXACT ENGLISH: Shipped
CONTEXT: Admin Panel — status — shipped
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrdersList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.status.suspended
EXACT ENGLISH: suspended
CONTEXT: Admin Panel — status — suspended
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.status.unconverted
EXACT ENGLISH: Unconverted
CONTEXT: Admin Panel — status — unconverted
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: —
```

```
KEY: admin.status.vip
EXACT ENGLISH: VIP
CONTEXT: Admin Panel — status — vip
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/CustomersList.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.status.outfordelivery
EXACT ENGLISH: Out for Delivery
CONTEXT: Admin Panel — status — outfordelivery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminDashboard.tsx
NOTES: —
```

```
KEY: admin.status.instock
EXACT ENGLISH: In Stock
CONTEXT: Admin Panel — status — instock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.status.lowstock
EXACT ENGLISH: Low Stock
CONTEXT: Admin Panel — status — lowstock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.status.outofstock
EXACT ENGLISH: Out of Stock
CONTEXT: Admin Panel — status — outofstock
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.orderDetail.orderRecordNotFound
EXACT ENGLISH: Order Record Not Found
CONTEXT: Admin Panel — order detail — order record not found
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.backToOrders
EXACT ENGLISH: Back to Orders
CONTEXT: Admin Panel — order detail — back to orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.orderNumberTitle
EXACT ENGLISH: Order {number}
CONTEXT: Admin Panel — order detail — order number title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: interpolation: {number}
```

```
KEY: admin.orderDetail.placedOnWithPayment
EXACT ENGLISH: Placed on {date} • Payment via {method}
CONTEXT: Admin Panel — order detail — placed on with payment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: interpolation: {date}, {method}
```

```
KEY: admin.orderDetail.printInvoice
EXACT ENGLISH: Print Invoice
CONTEXT: Admin Panel — order detail — print invoice
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.handcraftedFragrancesOrdered
EXACT ENGLISH: Handcrafted Fragrances Ordered ({count})
CONTEXT: Admin Panel — order detail — handcrafted fragrances ordered
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.orderDetail.item
EXACT ENGLISH: Item
CONTEXT: Admin Panel — order detail — item
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.orderDetail.price
EXACT ENGLISH: Price
CONTEXT: Admin Panel — order detail — price
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.orderDetail.qty
EXACT ENGLISH: Qty
CONTEXT: Admin Panel — order detail — qty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.orderDetail.subtotal
EXACT ENGLISH: Subtotal
CONTEXT: Admin Panel — order detail — subtotal
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.itemsSubtotal
EXACT ENGLISH: Items Subtotal:
CONTEXT: Admin Panel — order detail — items subtotal
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.voucherDiscount
EXACT ENGLISH: Voucher Discount:
CONTEXT: Admin Panel — order detail — voucher discount
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.shippingFee
EXACT ENGLISH: Shipping Fee:
CONTEXT: Admin Panel — order detail — shipping fee
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.tax
EXACT ENGLISH: Tax
CONTEXT: Admin Panel — order detail — tax
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.orderDetail.orderTotal
EXACT ENGLISH: Order Total:
CONTEXT: Admin Panel — order detail — order total
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.chargedInDestination
EXACT ENGLISH: Charged in / Destination:
CONTEXT: Admin Panel — order detail — charged in destination
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.dispatchCourierTrackingInfo
EXACT ENGLISH: Dispatch Courier & Tracking Info
CONTEXT: Admin Panel — order detail — dispatch courier tracking info
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.courierCarrier
EXACT ENGLISH: Courier Carrier
CONTEXT: Admin Panel — order detail — courier carrier
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.trackingNumber
EXACT ENGLISH: Tracking Number
CONTEXT: Admin Panel — order detail — tracking number
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.autoOrManual
EXACT ENGLISH: Auto or manual
CONTEXT: Admin Panel — order detail — auto or manual
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.generateUniqueTrackingReference
EXACT ENGLISH: Generate a unique tracking reference
CONTEXT: Admin Panel — order detail — generate unique tracking reference
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.generate
EXACT ENGLISH: Generate
CONTEXT: Admin Panel — order detail — generate
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.shippingStatus
EXACT ENGLISH: Shipping Status
CONTEXT: Admin Panel — order detail — shipping status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.estimatedDelivery
EXACT ENGLISH: Estimated Delivery
CONTEXT: Admin Panel — order detail — estimated delivery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.trackingUrl
EXACT ENGLISH: Tracking URL
CONTEXT: Admin Panel — order detail — tracking url
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.shownToClientNote
EXACT ENGLISH: Shown to the client on their order and on Track Order.
CONTEXT: Admin Panel — order detail — shown to client note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.everyChangeWrittenNote
EXACT ENGLISH: Every change is written to the shipment record and the order timeline.
CONTEXT: Admin Panel — order detail — every change written note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.saveCourierInfo
EXACT ENGLISH: Save Courier Info
CONTEXT: Admin Panel — order detail — save courier info
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.internalNotes
EXACT ENGLISH: Internal Notes
CONTEXT: Admin Panel — order detail — internal notes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx, src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.internalNotesLabel
EXACT ENGLISH: Internal notes
CONTEXT: Admin Panel — order detail — internal notes label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.visibleToStaffOnly
EXACT ENGLISH: Visible to staff only. Never shown to the client.
CONTEXT: Admin Panel — order detail — visible to staff only
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.saving
EXACT ENGLISH: Saving…
CONTEXT: Admin Panel — order detail — saving
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.orderDetail.saveNote
EXACT ENGLISH: Save Note
CONTEXT: Admin Panel — order detail — save note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.clientNote
EXACT ENGLISH: Client note
CONTEXT: Admin Panel — order detail — client note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.clientProfile
EXACT ENGLISH: Client Profile
CONTEXT: Admin Panel — order detail — client profile
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.clientName
EXACT ENGLISH: Client Name
CONTEXT: Admin Panel — order detail — client name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.emailAddress
EXACT ENGLISH: Email Address
CONTEXT: Admin Panel — order detail — email address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.phoneNumber
EXACT ENGLISH: Phone Number
CONTEXT: Admin Panel — order detail — phone number
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.shippingAddress
EXACT ENGLISH: Shipping Address
CONTEXT: Admin Panel — order detail — shipping address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.paymentVerification
EXACT ENGLISH: Payment Verification
CONTEXT: Admin Panel — order detail — payment verification
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.paymentMethodLabel
EXACT ENGLISH: Payment Method:
CONTEXT: Admin Panel — order detail — payment method label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.paymentStatusLabel
EXACT ENGLISH: Payment Status:
CONTEXT: Admin Panel — order detail — payment status label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.transactionReferenceId
EXACT ENGLISH: Transaction / Reference ID
CONTEXT: Admin Panel — order detail — transaction reference id
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.transferNote
EXACT ENGLISH: Transfer Note
CONTEXT: Admin Panel — order detail — transfer note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.paymentScreenshotProof
EXACT ENGLISH: Payment Screenshot / Proof
CONTEXT: Admin Panel — order detail — payment screenshot proof
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.paymentTransferProofScreenshotAlt
EXACT ENGLISH: Payment Transfer Proof Screenshot
CONTEXT: Admin Panel — order detail — payment transfer proof screenshot alt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.inspectScreenshot
EXACT ENGLISH: Inspect Screenshot
CONTEXT: Admin Panel — order detail — inspect screenshot
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.viewFullScreenshot
EXACT ENGLISH: View Full Screenshot
CONTEXT: Admin Panel — order detail — view full screenshot
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.loadingSignedScreenshot
EXACT ENGLISH: Loading signed screenshot URL…
CONTEXT: Admin Panel — order detail — loading signed screenshot
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.noScreenshotAttached
EXACT ENGLISH: No screenshot attached for this transaction.
CONTEXT: Admin Panel — order detail — no screenshot attached
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.verifyPayment
EXACT ENGLISH: Verify Payment
CONTEXT: Admin Panel — order detail — verify payment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.reject
EXACT ENGLISH: Reject
CONTEXT: Admin Panel — order detail — reject
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.orderDetail.paymentTransferScreenshotProof
EXACT ENGLISH: Payment Transfer Screenshot Proof
CONTEXT: Admin Panel — order detail — payment transfer screenshot proof
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.orderReferenceLine
EXACT ENGLISH: Order #{number} • Reference: {reference}
CONTEXT: Admin Panel — order detail — order reference line
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: interpolation: {number}, {reference}
```

```
KEY: admin.orderDetail.fullPaymentScreenshotAlt
EXACT ENGLISH: Full Payment Screenshot
CONTEXT: Admin Panel — order detail — full payment screenshot alt
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.openImageInNewTab
EXACT ENGLISH: Open image in new tab
CONTEXT: Admin Panel — order detail — open image in new tab
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/pages/OrderDetailPage.tsx
NOTES: —
```

```
KEY: admin.orderDetail.closePreview
EXACT ENGLISH: Close Preview
CONTEXT: Admin Panel — order detail — close preview
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/OrderDetailPage.tsx, src/admin/pages/ProductsList.tsx
NOTES: —
```

```
KEY: admin.international.setFeeAndCurrencyFirst
EXACT ENGLISH: Set a shipping fee and a currency before enabling this country.
CONTEXT: Admin Panel — international — set fee and currency first
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.taxRateRange
EXACT ENGLISH: A tax rate must be between 0 and 100.
CONTEXT: Admin Panel — international — tax rate range
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.maxWindowShorter
EXACT ENGLISH: The maximum delivery window cannot be shorter than the minimum.
CONTEXT: Admin Panel — international — max window shorter
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.nameSaved
EXACT ENGLISH: {name} saved.
CONTEXT: Admin Panel — international — name saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.international.rateAboveZero
EXACT ENGLISH: An exchange rate must be greater than zero.
CONTEXT: Admin Panel — international — rate above zero
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.codeSaved
EXACT ENGLISH: {code} saved.
CONTEXT: Admin Panel — international — code saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: interpolation: {code}
```

```
KEY: admin.international.code
EXACT ENGLISH: Code
CONTEXT: Admin Panel — international — code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.country
EXACT ENGLISH: Country
CONTEXT: Admin Panel — international — country
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.delivering
EXACT ENGLISH: Delivering
CONTEXT: Admin Panel — international — delivering
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.closed
EXACT ENGLISH: Closed
CONTEXT: Admin Panel — international — closed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.currency
EXACT ENGLISH: Currency
CONTEXT: Admin Panel — international — currency
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.fee
EXACT ENGLISH: Fee
CONTEXT: Admin Panel — international — fee
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.freeOver
EXACT ENGLISH: Free over
CONTEXT: Admin Panel — international — free over
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.delivery
EXACT ENGLISH: Delivery
CONTEXT: Admin Panel — international — delivery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.daysRange
EXACT ENGLISH: {min}–{max} days
CONTEXT: Admin Panel — international — days range
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: interpolation: {min}, {max}
```

```
KEY: admin.international.tax
EXACT ENGLISH: Tax
CONTEXT: Admin Panel — international — tax
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.none
EXACT ENGLISH: None
CONTEXT: Admin Panel — international — none
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.configureDestination
EXACT ENGLISH: Configure destination
CONTEXT: Admin Panel — international — configure destination
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.settingsAccessRequired
EXACT ENGLISH: Settings access required
CONTEXT: Admin Panel — international — settings access required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.name
EXACT ENGLISH: Name
CONTEXT: Admin Panel — international — name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.symbol
EXACT ENGLISH: Symbol
CONTEXT: Admin Panel — international — symbol
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.minorUnits
EXACT ENGLISH: Minor units
CONTEXT: Admin Panel — international — minor units
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.rateToPkr
EXACT ENGLISH: Rate to PKR
CONTEXT: Admin Panel — international — rate to pkr
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.baseRate
EXACT ENGLISH: base (1)
CONTEXT: Admin Panel — international — base rate
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.rateLine
EXACT ENGLISH: 1 {code} = PKR {rate}
CONTEXT: Admin Panel — international — rate line
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: interpolation: {code}, {rate}
```

```
KEY: admin.international.source
EXACT ENGLISH: Source
CONTEXT: Admin Panel — international — source
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.shown
EXACT ENGLISH: Shown
CONTEXT: Admin Panel — international — shown
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.hidden
EXACT ENGLISH: Hidden
CONTEXT: Admin Panel — international — hidden
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.configureCurrency
EXACT ENGLISH: Configure currency
CONTEXT: Admin Panel — international — configure currency
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.language
EXACT ENGLISH: Language
CONTEXT: Admin Panel — international — language
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.native
EXACT ENGLISH: Native
CONTEXT: Admin Panel — international — native
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.direction
EXACT ENGLISH: Direction
CONTEXT: Admin Panel — international — direction
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.locale
EXACT ENGLISH: Locale
CONTEXT: Admin Panel — international — locale
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.defaultLabel
EXACT ENGLISH: Default
CONTEXT: Admin Panel — international — default label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.available
EXACT ENGLISH: Available
CONTEXT: Admin Panel — international — available
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.configureLanguage
EXACT ENGLISH: Configure language
CONTEXT: Admin Panel — international — configure language
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.eyebrow
EXACT ENGLISH: INTERNATIONAL COMMERCE CONFIGURATION
CONTEXT: Admin Panel — international — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.title
EXACT ENGLISH: Countries, Currencies & Languages
CONTEXT: Admin Panel — international — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.introBody
EXACT ENGLISH: Destinations, display currencies and interface languages are decided here and priced by the database. Orders keep the country, tax and currency recorded at the time they were placed.
CONTEXT: Admin Panel — international — intro body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.reload
EXACT ENGLISH: Reload
CONTEXT: Admin Panel — international — reload
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.roleReadOnlyNote
EXACT ENGLISH: Your role can review these settings but not change them. International configuration requires the settings permission.
CONTEXT: Admin Panel — international — role read only note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.destinationsHeading
EXACT ENGLISH: Destination countries
CONTEXT: Admin Panel — international — destinations heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.loadingDestinations
EXACT ENGLISH: Loading destinations…
CONTEXT: Admin Panel — international — loading destinations
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.noCountriesConfigured
EXACT ENGLISH: No countries configured
CONTEXT: Admin Panel — international — no countries configured
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.searchCountries
EXACT ENGLISH: Search countries…
CONTEXT: Admin Panel — international — search countries
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.currenciesHeading
EXACT ENGLISH: Currencies
CONTEXT: Admin Panel — international — currencies heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.loadingCurrencies
EXACT ENGLISH: Loading currencies…
CONTEXT: Admin Panel — international — loading currencies
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.noCurrenciesConfigured
EXACT ENGLISH: No currencies configured
CONTEXT: Admin Panel — international — no currencies configured
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.ratesNotePrefix
EXACT ENGLISH: Rates are the atelier's own configured figures. They are marked
CONTEXT: Admin Panel — international — rates note prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.ratesNoteSuffix
EXACT ENGLISH: because no live exchange-rate provider is connected yet; editing a rate here records the change and its date.
CONTEXT: Admin Panel — international — rates note suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.languagesHeading
EXACT ENGLISH: Interface languages
CONTEXT: Admin Panel — international — languages heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.loadingLanguages
EXACT ENGLISH: Loading languages…
CONTEXT: Admin Panel — international — loading languages
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.noLanguagesConfigured
EXACT ENGLISH: No languages configured
CONTEXT: Admin Panel — international — no languages configured
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.deliveryTo
EXACT ENGLISH: Delivery to {name}
CONTEXT: Admin Panel — international — delivery to
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.international.countryCode
EXACT ENGLISH: Country code {code}
CONTEXT: Admin Panel — international — country code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: interpolation: {code}
```

```
KEY: admin.international.deliverToThisCountry
EXACT ENGLISH: Deliver to this country
CONTEXT: Admin Panel — international — deliver to this country
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.shippingFeeBase
EXACT ENGLISH: Shipping fee (base currency)
CONTEXT: Admin Panel — international — shipping fee base
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.exampleFee
EXACT ENGLISH: e.g. 250
CONTEXT: Admin Panel — international — example fee
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.international.freeShippingOver
EXACT ENGLISH: Free shipping over
CONTEXT: Admin Panel — international — free shipping over
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.deliveryMethod
EXACT ENGLISH: Delivery method
CONTEXT: Admin Panel — international — delivery method
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.deliveryMethodExample
EXACT ENGLISH: e.g. Courier — Leopards / TCS
CONTEXT: Admin Panel — international — delivery method example
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.international.minimumDays
EXACT ENGLISH: Minimum days
CONTEXT: Admin Panel — international — minimum days
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.maximumDays
EXACT ENGLISH: Maximum days
CONTEXT: Admin Panel — international — maximum days
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.chargeTaxOnDestination
EXACT ENGLISH: Charge tax on this destination
CONTEXT: Admin Panel — international — charge tax on destination
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.taxRatePercentage
EXACT ENGLISH: Tax rate (percentage)
CONTEXT: Admin Panel — international — tax rate percentage
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.taxLabel
EXACT ENGLISH: Tax label
CONTEXT: Admin Panel — international — tax label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.taxLabelExample
EXACT ENGLISH: e.g. VAT, GST
CONTEXT: Admin Panel — international — tax label example
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.international.taxConfigNote
EXACT ENGLISH: These figures are the atelier's own business configuration. Nothing here determines a country's tax law, and every order keeps the rate and amount used when it was placed.
CONTEXT: Admin Panel — international — tax config note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.notesShownAtCheckout
EXACT ENGLISH: Notes shown at checkout
CONTEXT: Admin Panel — international — notes shown at checkout
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.restrictions
EXACT ENGLISH: Restrictions
CONTEXT: Admin Panel — international — restrictions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.saving
EXACT ENGLISH: Saving…
CONTEXT: Admin Panel — international — saving
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.international.saveDestination
EXACT ENGLISH: Save destination
CONTEXT: Admin Panel — international — save destination
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.currencyTitle
EXACT ENGLISH: Currency {code}
CONTEXT: Admin Panel — international — currency title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: interpolation: {code}
```

```
KEY: admin.international.baseCurrency
EXACT ENGLISH: Base currency
CONTEXT: Admin Panel — international — base currency
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.displayCurrency
EXACT ENGLISH: Display currency
CONTEXT: Admin Panel — international — display currency
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.minorUnitsHint
EXACT ENGLISH: Minor units (0, 1, 2, 3)
CONTEXT: Admin Panel — international — minor units hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.sortOrder
EXACT ENGLISH: Sort order
CONTEXT: Admin Panel — international — sort order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.pkrPerUnit
EXACT ENGLISH: PKR per 1 unit
CONTEXT: Admin Panel — international — pkr per unit
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.baseCurrencyNote
EXACT ENGLISH: The base currency is always 1 and always available.
CONTEXT: Admin Panel — international — base currency note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.offerCurrency
EXACT ENGLISH: Offer this currency in the storefront selector
CONTEXT: Admin Panel — international — offer currency
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.saveCurrency
EXACT ENGLISH: Save currency
CONTEXT: Admin Panel — international — save currency
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.languageTitle
EXACT ENGLISH: Language {code}
CONTEXT: Admin Panel — international — language title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: interpolation: {code}
```

```
KEY: admin.international.offerLanguage
EXACT ENGLISH: Offer this language in the header
CONTEXT: Admin Panel — international — offer language
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.defaultLanguage
EXACT ENGLISH: Default language for new visitors
CONTEXT: Admin Panel — international — default language
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.languageNote
EXACT ENGLISH: Arabic renders the storefront right-to-left. A language can only be chosen as default while it is offered, and English stays available so the source copy is never unreachable.
CONTEXT: Admin Panel — international — language note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.international.saveLanguage
EXACT ENGLISH: Save language
CONTEXT: Admin Panel — international — save language
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/InternationalPage.tsx
NOTES: —
```

```
KEY: admin.payments.allMethods
EXACT ENGLISH: All Methods
CONTEXT: Admin Panel — payments — all methods
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.allPaymentRecords
EXACT ENGLISH: All payment records
CONTEXT: Admin Panel — payments — all payment records
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.amount
EXACT ENGLISH: Amount
CONTEXT: Admin Panel — payments — amount
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.payments.awaitingCourierCash
EXACT ENGLISH: Awaiting courier delivery cash
CONTEXT: Admin Panel — payments — awaiting courier cash
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.bankTransfer
EXACT ENGLISH: Bank Transfer
CONTEXT: Admin Panel — payments — bank transfer
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.cod
EXACT ENGLISH: COD
CONTEXT: Admin Panel — payments — cod
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.payments.codPendingCollection
EXACT ENGLISH: COD Pending Collection
CONTEXT: Admin Panel — payments — cod pending collection
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.collectCash
EXACT ENGLISH: Collect Cash
CONTEXT: Admin Panel — payments — collect cash
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.digitalPendingSubtitle
EXACT ENGLISH: Verification Pending {pendingProof} · Awaiting proof {awaitingProof}
CONTEXT: Admin Panel — payments — digital pending subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: interpolation: {pendingProof}, {awaitingProof}
```

```
KEY: admin.payments.digitalPendingVerification
EXACT ENGLISH: Digital Pending Verification
CONTEXT: Admin Panel — payments — digital pending verification
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.failed
EXACT ENGLISH: Failed
CONTEXT: Admin Panel — payments — failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.payments.financeRecordNotePlaceholder
EXACT ENGLISH: Optional note for finance records
CONTEXT: Admin Panel — payments — finance record note placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.fullyRefunded
EXACT ENGLISH: Fully Refunded
CONTEXT: Admin Panel — payments — fully refunded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.introBody
EXACT ENGLISH: Verify Pakistan digital transfers (JazzCash, Raast, Bank Transfer) and audit Cash on Delivery collections.
CONTEXT: Admin Panel — payments — intro body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.issueRefund
EXACT ENGLISH: Issue Refund
CONTEXT: Admin Panel — payments — issue refund
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.issueRefundForThisPayment
EXACT ENGLISH: Issue refund for this payment
CONTEXT: Admin Panel — payments — issue refund for this payment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.orderAndDate
EXACT ENGLISH: Order & Date
CONTEXT: Admin Panel — payments — order and date
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.paidCodCollected
EXACT ENGLISH: Paid (COD Collected)
CONTEXT: Admin Panel — payments — paid cod collected
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.partialRefund
EXACT ENGLISH: Partial Refund
CONTEXT: Admin Panel — payments — partial refund
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.paymentMethodColumn
EXACT ENGLISH: Payment Method
CONTEXT: Admin Panel — payments — payment method column
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.paymentMethodLabel
EXACT ENGLISH: Payment Method:
CONTEXT: Admin Panel — payments — payment method label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.processing
EXACT ENGLISH: Processing…
CONTEXT: Admin Panel — payments — processing
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.reason
EXACT ENGLISH: Reason
CONTEXT: Admin Panel — payments — reason
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.payments.reasonPlaceholder
EXACT ENGLISH: e.g. Damaged flacon on delivery
CONTEXT: Admin Panel — payments — reason placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.payments.recordRefund
EXACT ENGLISH: Record Refund
CONTEXT: Admin Panel — payments — record refund
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.refund
EXACT ENGLISH: Refund
CONTEXT: Admin Panel — payments — refund
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.payments.refundAmountAboveZero
EXACT ENGLISH: Refund amount must be greater than zero.
CONTEXT: Admin Panel — payments — refund amount above zero
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.refundAmountPkr
EXACT ENGLISH: Refund Amount (PKR)
CONTEXT: Admin Panel — payments — refund amount pkr
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.refundBankReference
EXACT ENGLISH: Refund / Bank Reference
CONTEXT: Admin Panel — payments — refund bank reference
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.refundExceedsRemaining
EXACT ENGLISH: Refund exceeds remaining refundable amount (Rs. {amount}).
CONTEXT: Admin Panel — payments — refund exceeds remaining
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: interpolation: {amount}
```

```
KEY: admin.payments.refundPending
EXACT ENGLISH: Refund Pending
CONTEXT: Admin Panel — payments — refund pending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.refundPendingOption
EXACT ENGLISH: Pending — bank transfer in progress
CONTEXT: Admin Panel — payments — refund pending option
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.refundProcessedOption
EXACT ENGLISH: Processed — funds returned
CONTEXT: Admin Panel — payments — refund processed option
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.refundReferencePlaceholder
EXACT ENGLISH: e.g. HBL-REF-88213
CONTEXT: Admin Panel — payments — refund reference placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.payments.refundSubtitle
EXACT ENGLISH: Order {order} • {method} • Paid Rs. {paid} • Remaining Rs. {remaining}
CONTEXT: Admin Panel — payments — refund subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: interpolation: {order}, {method}, {paid}, {remaining}
```

```
KEY: admin.payments.refunds
EXACT ENGLISH: Refunds
CONTEXT: Admin Panel — payments — refunds
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.payments.reject
EXACT ENGLISH: Reject
CONTEXT: Admin Panel — payments — reject
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.payments.searchByOrderClientOrReference
EXACT ENGLISH: Search by order number, client name, email, or transaction reference...
CONTEXT: Admin Panel — payments — search by order client or reference
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.settledVerifiedPayments
EXACT ENGLISH: Settled & verified payments
CONTEXT: Admin Panel — payments — settled verified payments
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.title
EXACT ENGLISH: Boutique Payment Gateway Management
CONTEXT: Admin Panel — payments — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.totalTransactions
EXACT ENGLISH: Total Transactions
CONTEXT: Admin Panel — payments — total transactions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.totalVerifiedSettlement
EXACT ENGLISH: Total Verified Settlement
CONTEXT: Admin Panel — payments — total verified settlement
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.verify
EXACT ENGLISH: Verify
CONTEXT: Admin Panel — payments — verify
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.payments.viewOrder
EXACT ENGLISH: View Order
CONTEXT: Admin Panel — payments — view order
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.payments.referenceNote
EXACT ENGLISH: Reference / Note
CONTEXT: Admin Panel — payments — reference note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/PaymentsPage.tsx
NOTES: —
```

```
KEY: admin.settings.addDetailRow
EXACT ENGLISH: Add detail row
CONTEXT: Admin Panel — settings — add detail row
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.adminSecurityHeading
EXACT ENGLISH: Admin Profile & Security Authentication
CONTEXT: Admin Panel — settings — admin security heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.atLeastOneMethodAvailable
EXACT ENGLISH: At least one payment method must stay available.
CONTEXT: Admin Panel — settings — at least one method available
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.atelierAddress
EXACT ENGLISH: Atelier Address
CONTEXT: Admin Panel — settings — atelier address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.availableAtCheckout
EXACT ENGLISH: Available at checkout
CONTEXT: Admin Panel — settings — available at checkout
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.availableAtCheckoutHint
EXACT ENGLISH: Turn off to hide this method from every shopper. At least one payment method must stay available.
CONTEXT: Admin Panel — settings — available at checkout hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.bankTransferRowsHint
EXACT ENGLISH: Bank Name, Account Title, Account Number and IBAN are editable rows below.
CONTEXT: Admin Panel — settings — bank transfer rows hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.baseCurrencyCode
EXACT ENGLISH: Base Currency Code
CONTEXT: Admin Panel — settings — base currency code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.bearerToken
EXACT ENGLISH: a Bearer token
CONTEXT: Admin Panel — settings — bearer token
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.boutiqueContactHeading
EXACT ENGLISH: Boutique Contact & Brand Information
CONTEXT: Admin Panel — settings — boutique contact heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.cardPaymentsLaterRelease
EXACT ENGLISH: Card payments arrive in a later release
CONTEXT: Admin Panel — settings — card payments later release
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.cardPaymentsNote
EXACT ENGLISH: These four manual methods write the instructions and requirements shoppers see on the payment step. Nothing here stores gateway credentials, and there is no PayFast, Stripe or card switch to flip — checkout instructions are read publicly, so keep them free of secrets.
CONTEXT: Admin Panel — settings — card payments note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.checkTheValue
EXACT ENGLISH: Check the value
CONTEXT: Admin Panel — settings — check the value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.checkoutCouldNotBeSaved
EXACT ENGLISH: Checkout payment instructions could not be saved.
CONTEXT: Admin Panel — settings — checkout could not be saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.checkoutInstructionsSaved
EXACT ENGLISH: Checkout payment instructions saved
CONTEXT: Admin Panel — settings — checkout instructions saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.checkoutNotSavedToast
EXACT ENGLISH: Checkout payment instructions not saved: fix the listed problems first.
CONTEXT: Admin Panel — settings — checkout not saved toast
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Toast message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.checkoutRequirements
EXACT ENGLISH: Checkout requirements
CONTEXT: Admin Panel — settings — checkout requirements
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.checkoutSavedToast
EXACT ENGLISH: Checkout payment instructions saved.
CONTEXT: Admin Panel — settings — checkout saved toast
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Toast message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.checkoutSettingsUnavailable
EXACT ENGLISH: Checkout settings unavailable
CONTEXT: Admin Panel — settings — checkout settings unavailable
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.conciergeEmail
EXACT ENGLISH: Concierge Email
CONTEXT: Admin Panel — settings — concierge email
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.copyValueHint
EXACT ENGLISH: Copied to the clipboard when it differs from the displayed value; leave blank to copy as shown.
CONTEXT: Admin Panel — settings — copy value hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.copyValueOptional
EXACT ENGLISH: Copy value (optional)
CONTEXT: Admin Panel — settings — copy value optional
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.currencyMaintenanceHeading
EXACT ENGLISH: Currency & Store Maintenance Control
CONTEXT: Admin Panel — settings — currency maintenance heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.currencySymbol
EXACT ENGLISH: Currency Symbol
CONTEXT: Admin Panel — settings — currency symbol
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.currentPassword
EXACT ENGLISH: Current Password
CONTEXT: Admin Panel — settings — current password
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.deliveryAuthoritativeMiddle
EXACT ENGLISH: key (
CONTEXT: Admin Panel — settings — delivery authoritative middle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.deliveryAuthoritativePrefix
EXACT ENGLISH: These are the authoritative delivery figures. The database reads the same
CONTEXT: Admin Panel — settings — delivery authoritative prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.deliveryAuthoritativeSuffix
EXACT ENGLISH: ) when an order is registered, so the amount charged on the order is decided there — a cart or checkout total shown in the browser may differ slightly until the order is registered.
CONTEXT: Admin Panel — settings — delivery authoritative suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.deliveryCouldNotBeSaved
EXACT ENGLISH: Delivery pricing could not be saved.
CONTEXT: Admin Panel — settings — delivery could not be saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.deliveryNotSavedToast
EXACT ENGLISH: Delivery pricing not saved: fix the listed problems first.
CONTEXT: Admin Panel — settings — delivery not saved toast
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Toast message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.deliveryPreviewLine
EXACT ENGLISH: Subtotal above {threshold} ships free — otherwise {cost} standard delivery, {window}.
CONTEXT: Admin Panel — settings — delivery preview line
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {threshold}, {cost}, {window}
```

```
KEY: admin.settings.deliveryPricingRules
EXACT ENGLISH: Delivery Pricing Rules
CONTEXT: Admin Panel — settings — delivery pricing rules
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.deliveryPricingSavedLabel
EXACT ENGLISH: Delivery pricing saved
CONTEXT: Admin Panel — settings — delivery pricing saved label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.deliveryProblemHeading
EXACT ENGLISH: Delivery pricing not saved
CONTEXT: Admin Panel — settings — delivery problem heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.deliveryRulesSrOnly
EXACT ENGLISH: Delivery pricing rules applied when an order is placed
CONTEXT: Admin Panel — settings — delivery rules sr only
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.deliverySavedToast
EXACT ENGLISH: Delivery pricing saved.
CONTEXT: Admin Panel — settings — delivery saved toast
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Toast message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.detailRowNumber
EXACT ENGLISH: Detail {number}
CONTEXT: Admin Panel — settings — detail row number
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {number}
```

```
KEY: admin.settings.detailRowRef
EXACT ENGLISH: {name} → detail {number}
CONTEXT: Admin Panel — settings — detail row ref
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {name}, {number}
```

```
KEY: admin.settings.displayedValue
EXACT ENGLISH: Displayed value
CONTEXT: Admin Panel — settings — displayed value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.displayedValueHint
EXACT ENGLISH: Exactly what the shopper reads.
CONTEXT: Admin Panel — settings — displayed value hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.enabled
EXACT ENGLISH: Enabled
CONTEXT: Admin Panel — settings — enabled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.settings.enterAmountsToPreview
EXACT ENGLISH: Enter both rupee amounts to preview the delivery rule.
CONTEXT: Admin Panel — settings — enter amounts to preview
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.estimatedDaysEmptyError
EXACT ENGLISH: Estimated delivery time cannot be empty — shoppers read it beside the shipping cost.
CONTEXT: Admin Panel — settings — estimated days empty error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.estimatedDaysPlaceholder
EXACT ENGLISH: 2 - 3 Business Days
CONTEXT: Admin Panel — settings — estimated days placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.estimatedDaysSecretError
EXACT ENGLISH: Estimated delivery time looks like {secret}. Delivery pricing is public; remove it before saving.
CONTEXT: Admin Panel — settings — estimated days secret error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {secret}
```

```
KEY: admin.settings.estimatedDeliveryHint
EXACT ENGLISH: Text shown beside the shipping cost.
CONTEXT: Admin Panel — settings — estimated delivery hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.estimatedDeliveryTime
EXACT ENGLISH: Estimated delivery time
CONTEXT: Admin Panel — settings — estimated delivery time
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.everyRowPrintedHint
EXACT ENGLISH: Every row is printed in the checkout instruction card.
CONTEXT: Admin Panel — settings — every row printed hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.eyebrow
EXACT ENGLISH: SYSTEM CONTROL PANEL
CONTEXT: Admin Panel — settings — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.facebookUrl
EXACT ENGLISH: Facebook URL
CONTEXT: Admin Panel — settings — facebook url
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.fieldCopyValueWord
EXACT ENGLISH: copy value
CONTEXT: Admin Panel — settings — field copy value word
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.fieldLabelWord
EXACT ENGLISH: label
CONTEXT: Admin Panel — settings — field label word
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.fieldValueWord
EXACT ENGLISH: value
CONTEXT: Admin Panel — settings — field value word
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.freeDeliveryAbove
EXACT ENGLISH: Free Delivery Above
CONTEXT: Admin Panel — settings — free delivery above
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.freeDeliveryAboveField
EXACT ENGLISH: Free delivery above (Rs)
CONTEXT: Admin Panel — settings — free delivery above field
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.freeDeliveryAboveHint
EXACT ENGLISH: Subtotal that unlocks complimentary courier.
CONTEXT: Admin Panel — settings — free delivery above hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.freeDeliveryAboveSubtitle
EXACT ENGLISH: Applied by the database when the order is registered
CONTEXT: Admin Panel — settings — free delivery above subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.freeThresholdRangeError
EXACT ENGLISH: Free-delivery threshold must be a rupee amount between 0 and 100,000,000.
CONTEXT: Admin Panel — settings — free threshold range error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.headingMissingError
EXACT ENGLISH: {name}: add the instruction heading shoppers see above the details.
CONTEXT: Admin Panel — settings — heading missing error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.settings.hidden
EXACT ENGLISH: Hidden
CONTEXT: Admin Panel — settings — hidden
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.settings.instagramUrl
EXACT ENGLISH: Instagram URL
CONTEXT: Admin Panel — settings — instagram url
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.instructionHeadingField
EXACT ENGLISH: Instruction heading
CONTEXT: Admin Panel — settings — instruction heading field
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.instructionHeadingHint
EXACT ENGLISH: Headline above the account details in the checkout panel.
CONTEXT: Admin Panel — settings — instruction heading hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.introBody
EXACT ENGLISH: Configure boutique contact details, currency standards, tax rules, checkout payment instructions, delivery pricing, maintenance flags, and account security.
CONTEXT: Admin Panel — settings — intro body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.jwtToken
EXACT ENGLISH: a JWT-style token
CONTEXT: Admin Panel — settings — jwt token
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.keepOneDetailError
EXACT ENGLISH: {name}: keep at least one payment detail row so there is something to pay into.
CONTEXT: Admin Panel — settings — keep one detail error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.settings.keepOneDetailRow
EXACT ENGLISH: Keep at least one payment detail row
CONTEXT: Admin Panel — settings — keep one detail row
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.labelEmptyError
EXACT ENGLISH: {name}: the display label cannot be empty.
CONTEXT: Admin Panel — settings — label empty error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.settings.labelValueRequiredError
EXACT ENGLISH: {where}: label and value are both required.
CONTEXT: Admin Panel — settings — label value required error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {where}
```

```
KEY: admin.settings.liveOnline
EXACT ENGLISH: Live Online
CONTEXT: Admin Panel — settings — live online
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.loadedFromSettings
EXACT ENGLISH: Loaded from site settings.
CONTEXT: Admin Panel — settings — loaded from settings
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.loadingCheckoutConfig
EXACT ENGLISH: Loading checkout payment instructions and delivery rules…
CONTEXT: Admin Panel — settings — loading checkout config
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.maintenanceMode
EXACT ENGLISH: Maintenance Mode
CONTEXT: Admin Panel — settings — maintenance mode
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.methodLabelField
EXACT ENGLISH: Method label
CONTEXT: Admin Panel — settings — method label field
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.methodLabelHint
EXACT ENGLISH: Name shown on the payment step.
CONTEXT: Admin Panel — settings — method label hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.methodSettingsLegend
EXACT ENGLISH: Settings for the {label} payment method
CONTEXT: Admin Panel — settings — method settings legend
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {label}
```

```
KEY: admin.settings.methodsAvailable
EXACT ENGLISH: Methods Available
CONTEXT: Admin Panel — settings — methods available
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.methodsAvailableSummary
EXACT ENGLISH: {enabled} of {total} methods available
CONTEXT: Admin Panel — settings — methods available summary
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {enabled}, {total}
```

```
KEY: admin.settings.newPassword
EXACT ENGLISH: New Password
CONTEXT: Admin Panel — settings — new password
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.noDetailRowsYet
EXACT ENGLISH: No detail rows yet — add one so shoppers know where to send the money.
CONTEXT: Admin Panel — settings — no detail rows yet
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.noTransitTimeSet
EXACT ENGLISH: No transit time set
CONTEXT: Admin Panel — settings — no transit time set
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.noTransitTimeSetLower
EXACT ENGLISH: no transit time set
CONTEXT: Admin Panel — settings — no transit time set lower
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.nothingSavedCount
EXACT ENGLISH: Nothing was saved — {count} item(s) need attention.
CONTEXT: Admin Panel — settings — nothing saved count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.settings.paymentDetails
EXACT ENGLISH: Payment details
CONTEXT: Admin Panel — settings — payment details
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.paymentMethodsHeading
EXACT ENGLISH: Payment Methods & Checkout Instructions
CONTEXT: Admin Panel — settings — payment methods heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.paymentProblemHeading
EXACT ENGLISH: Checkout payment instructions not saved
CONTEXT: Admin Panel — settings — payment problem heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.paymentScreenshotRequired
EXACT ENGLISH: Payment screenshot required
CONTEXT: Admin Panel — settings — payment screenshot required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.paymentScreenshotRequiredHint
EXACT ENGLISH: Shopper must attach the bank or wallet confirmation image.
CONTEXT: Admin Panel — settings — payment screenshot required hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.phoneNumber
EXACT ENGLISH: Phone Number
CONTEXT: Admin Panel — settings — phone number
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.previewLabel
EXACT ENGLISH: Preview
CONTEXT: Admin Panel — settings — preview label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.settings.publishImmediatelyNote
EXACT ENGLISH: Values are published to the storefront immediately after a successful save. Do not paste API keys, tokens or passwords into any field on this tab.
CONTEXT: Admin Panel — settings — publish immediately note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.readSettingsFailed
EXACT ENGLISH: The payment and delivery settings could not be read.
CONTEXT: Admin Panel — settings — read settings failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.referenceFieldLabel
EXACT ENGLISH: Reference field label
CONTEXT: Admin Panel — settings — reference field label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.referenceFieldLabelHint
EXACT ENGLISH: Example: Transaction Reference / TID (12 Digits).
CONTEXT: Admin Panel — settings — reference field label hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.settings.referenceNeedsBothError
EXACT ENGLISH: {name}: a mandatory reference needs both a label and a placeholder.
CONTEXT: Admin Panel — settings — reference needs both error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.settings.referencePlaceholderField
EXACT ENGLISH: Reference placeholder
CONTEXT: Admin Panel — settings — reference placeholder field
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.referencePlaceholderHint
EXACT ENGLISH: Example: e.g. 098234112984.
CONTEXT: Admin Panel — settings — reference placeholder hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.settings.referenceRequired
EXACT ENGLISH: Reference required
CONTEXT: Admin Panel — settings — reference required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.referenceRequiredHint
EXACT ENGLISH: Shopper must type a transaction reference with the order.
CONTEXT: Admin Panel — settings — reference required hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.remove
EXACT ENGLISH: Remove
CONTEXT: Admin Panel — settings — remove
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.settings.restoreAllDefaults
EXACT ENGLISH: Restore all defaults
CONTEXT: Admin Panel — settings — restore all defaults
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.restoreDefaultFields
EXACT ENGLISH: Restore default fields
CONTEXT: Admin Panel — settings — restore default fields
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.restoreDefaults
EXACT ENGLISH: Restore defaults
CONTEXT: Admin Panel — settings — restore defaults
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.retry
EXACT ENGLISH: Retry
CONTEXT: Admin Panel — settings — retry
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.settings.retrySave
EXACT ENGLISH: Retry save
CONTEXT: Admin Panel — settings — retry save
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.rowLabel
EXACT ENGLISH: Row label
CONTEXT: Admin Panel — settings — row label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.rowLabelHint
EXACT ENGLISH: Shown on the left of the row.
CONTEXT: Admin Panel — settings — row label hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.salesTaxRate
EXACT ENGLISH: Sales Tax Rate (%)
CONTEXT: Admin Panel — settings — sales tax rate
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.saveDeliveryRules
EXACT ENGLISH: Save Delivery Rules
CONTEXT: Admin Panel — settings — save delivery rules
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.saveGeneralSettings
EXACT ENGLISH: Save General Settings
CONTEXT: Admin Panel — settings — save general settings
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.savePaymentConfiguration
EXACT ENGLISH: Save Payment Configuration
CONTEXT: Admin Panel — settings — save payment configuration
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.saveStoreSettings
EXACT ENGLISH: Save Store Settings
CONTEXT: Admin Panel — settings — save store settings
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.savedAtLine
EXACT ENGLISH: {label} at {stamp}.
CONTEXT: Admin Panel — settings — saved at line
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {label}, {stamp}
```

```
KEY: admin.settings.savingDeliveryRules
EXACT ENGLISH: Saving delivery rules…
CONTEXT: Admin Panel — settings — saving delivery rules
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.savingPaymentConfiguration
EXACT ENGLISH: Saving payment configuration…
CONTEXT: Admin Panel — settings — saving payment configuration
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.secretApiKey
EXACT ENGLISH: a secret API key (sk_…)
CONTEXT: Admin Panel — settings — secret api key
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.secretInFieldError
EXACT ENGLISH: {where}: {field} looks like {secret}. Checkout instructions are readable by anyone — remove it before saving.
CONTEXT: Admin Panel — settings — secret in field error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {where}, {field}, {secret}
```

```
KEY: admin.settings.secretInMethodError
EXACT ENGLISH: {name}: one of the text fields looks like {secret}. Nothing was saved.
CONTEXT: Admin Panel — settings — secret in method error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {name}, {secret}
```

```
KEY: admin.settings.settingsRejectedDeliveryWrite
EXACT ENGLISH: The settings service rejected the write, so order pricing still uses the previous amounts. Retry, or confirm your staff sign-in.
CONTEXT: Admin Panel — settings — settings rejected delivery write
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.settingsRejectedPaymentWrite
EXACT ENGLISH: The settings service rejected the write, so checkout still shows the previous instructions. Your edits are kept here — retry, or confirm your staff sign-in.
CONTEXT: Admin Panel — settings — settings rejected payment write
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.shortDescriptionField
EXACT ENGLISH: Short description
CONTEXT: Admin Panel — settings — short description field
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.shortDescriptionHint
EXACT ENGLISH: One line under the method name, e.g. “Instant mobile wallet transfer”.
CONTEXT: Admin Panel — settings — short description hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.settings.shownAtCheckout
EXACT ENGLISH: Shown at checkout
CONTEXT: Admin Panel — settings — shown at checkout
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.standardCostRangeError
EXACT ENGLISH: Standard delivery cost must be a rupee amount between 0 and 100,000,000.
CONTEXT: Admin Panel — settings — standard cost range error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.standardDelivery
EXACT ENGLISH: Standard Delivery
CONTEXT: Admin Panel — settings — standard delivery
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.standardDeliveryField
EXACT ENGLISH: Standard delivery (Rs)
CONTEXT: Admin Panel — settings — standard delivery field
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.standardDeliveryHint
EXACT ENGLISH: Flat courier charge below the threshold.
CONTEXT: Admin Panel — settings — standard delivery hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.storeName
EXACT ENGLISH: Store Name
CONTEXT: Admin Panel — settings — store name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.storedAsJsonMiddle
EXACT ENGLISH: under
CONTEXT: Admin Panel — settings — stored as json middle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.storedAsJsonPrefix
EXACT ENGLISH: Stored as JSON in
CONTEXT: Admin Panel — settings — stored as json prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.storedAsJsonSuffix
EXACT ENGLISH: Checkout renders exactly what is saved here; the four supported method ids are fixed so the storefront keeps recognising them.
CONTEXT: Admin Panel — settings — stored as json suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.storefrontStatus
EXACT ENGLISH: Storefront Status
CONTEXT: Admin Panel — settings — storefront status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.tabAccount
EXACT ENGLISH: Admin Security
CONTEXT: Admin Panel — settings — tab account
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.tabGeneral
EXACT ENGLISH: General & Social
CONTEXT: Admin Panel — settings — tab general
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.tabPayment
EXACT ENGLISH: Payment & Delivery
CONTEXT: Admin Panel — settings — tab payment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.tabStore
EXACT ENGLISH: Store & Currency
CONTEXT: Admin Panel — settings — tab store
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.tagline
EXACT ENGLISH: Tagline
CONTEXT: Admin Panel — settings — tagline
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.settings.thisLooksLikeSecret
EXACT ENGLISH: This looks like {secret}. These settings are readable by anyone, so it cannot be saved.
CONTEXT: Admin Panel — settings — this looks like secret
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {secret}
```

```
KEY: admin.settings.title
EXACT ENGLISH: Website & Atelier Storefront Settings
CONTEXT: Admin Panel — settings — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.twoFactor
EXACT ENGLISH: Two-Factor Authentication (2FA)
CONTEXT: Admin Panel — settings — two factor
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.twoFactorHint
EXACT ENGLISH: Require an authenticator app OTP when accessing /admin console.
CONTEXT: Admin Panel — settings — two factor hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.unrecognisedMethodNote
EXACT ENGLISH: Unrecognised method id. The storefront only offers Cash on Delivery, JazzCash, Raast and Bank Transfer, so this row is ignored at checkout.
CONTEXT: Admin Panel — settings — unrecognised method note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.unsavedChanges
EXACT ENGLISH: Unsaved changes.
CONTEXT: Admin Panel — settings — unsaved changes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.settings.valueTooLongError
EXACT ENGLISH: {where}: value is longer than {max} characters.
CONTEXT: Admin Panel — settings — value too long error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: interpolation: {where}, {max}
```

```
KEY: admin.settings.whatsappBusinessNumber
EXACT ENGLISH: WhatsApp Business Number
CONTEXT: Admin Panel — settings — whatsapp business number
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SettingsPage.tsx
NOTES: —
```

```
KEY: admin.topbar.accountMenu
EXACT ENGLISH: Account menu
CONTEXT: Admin Panel — topbar — account menu
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.addProduct
EXACT ENGLISH: Add Product
CONTEXT: Admin Panel — topbar — add product
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.createCoupon
EXACT ENGLISH: Create Coupon
CONTEXT: Admin Panel — topbar — create coupon
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.logoutSession
EXACT ENGLISH: Logout Session
CONTEXT: Admin Panel — topbar — logout session
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.newCampaign
EXACT ENGLISH: New Campaign
CONTEXT: Admin Panel — topbar — new campaign
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.notifications
EXACT ENGLISH: Notifications
CONTEXT: Admin Panel — topbar — notifications
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.openNavigation
EXACT ENGLISH: Open navigation menu
CONTEXT: Admin Panel — topbar — open navigation
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.primaryAdmin
EXACT ENGLISH: Primary Admin
CONTEXT: Admin Panel — topbar — primary admin
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.quickAction
EXACT ENGLISH: Quick Action
CONTEXT: Admin Panel — topbar — quick action
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.quickActions
EXACT ENGLISH: Quick actions
CONTEXT: Admin Panel — topbar — quick actions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.store
EXACT ENGLISH: Store:
CONTEXT: Admin Panel — topbar — store
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.topbar.viewNotifications
EXACT ENGLISH: View Notifications
CONTEXT: Admin Panel — topbar — view notifications
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.selectLanguage
EXACT ENGLISH: Select language
CONTEXT: Admin Panel — topbar — select language
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.languageAppliesEverywhere
EXACT ENGLISH: Your language applies across the dashboard.
CONTEXT: Admin Panel — topbar — language applies everywhere
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.storeLive
EXACT ENGLISH: Live
CONTEXT: Admin Panel — topbar — store live
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.topbar.storeMaintenance
EXACT ENGLISH: Maintenance
CONTEXT: Admin Panel — topbar — store maintenance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.searchPlaceholder
EXACT ENGLISH: Search products, orders, customers (Ctrl+K)...
CONTEXT: Admin Panel — topbar — search placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.topbar.notificationsUnread
EXACT ENGLISH: Notifications, {count} unread
CONTEXT: Admin Panel — topbar — notifications unread
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.topbar.unreadCount
EXACT ENGLISH: {count} Unread
CONTEXT: Admin Panel — topbar — unread count
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.topbar.adminProfileAndSettings
EXACT ENGLISH: Admin Profile & Settings
CONTEXT: Admin Panel — topbar — admin profile and settings
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/components/AdminTopbar.tsx
NOTES: —
```

```
KEY: admin.analytics.averageOrderValue
EXACT ENGLISH: Average Order Value
CONTEXT: Admin Panel — analytics — average order value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.averageOrderValueSubtitle
EXACT ENGLISH: Mean order total, cancellations excluded
CONTEXT: Admin Panel — analytics — average order value subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.cancellationsNote
EXACT ENGLISH: Reported for every order row, independent of the window selector.
CONTEXT: Admin Panel — analytics — cancellations note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.cancellationsReturns
EXACT ENGLISH: Cancellations & Returns
CONTEXT: Admin Panel — analytics — cancellations returns
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.cancelledOrdersLabel
EXACT ENGLISH: Cancelled orders
CONTEXT: Admin Panel — analytics — cancelled orders label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.cancelledOrdersSubtitle
EXACT ENGLISH: {cancelled} cancelled · {returned} returned
CONTEXT: Admin Panel — analytics — cancelled orders subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {cancelled}, {returned}
```

```
KEY: admin.analytics.cancelledValue
EXACT ENGLISH: Cancelled value
CONTEXT: Admin Panel — analytics — cancelled value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.catalogueNote
EXACT ENGLISH: Product and size rows are windowed by the aggregation to the last {days} days, ranked and capped at the server.
CONTEXT: Admin Panel — analytics — catalogue note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {days}
```

```
KEY: admin.analytics.catalogueSignals
EXACT ENGLISH: Catalogue Signals
CONTEXT: Admin Panel — analytics — catalogue signals
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.code
EXACT ENGLISH: Code
CONTEXT: Admin Panel — analytics — code
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.analytics.couponDetail
EXACT ENGLISH: Coupon Detail
CONTEXT: Admin Panel — analytics — coupon detail
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.couponDetailCaption
EXACT ENGLISH: Same rows that feed the coupon chart, ranked by discount given.
CONTEXT: Admin Panel — analytics — coupon detail caption
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.couponDetailSubtitle
EXACT ENGLISH: Code, lifecycle status, uses and discount given
CONTEXT: Admin Panel — analytics — coupon detail subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.couponEmpty
EXACT ENGLISH: No coupons exist in the catalog yet.
CONTEXT: Admin Panel — analytics — coupon empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.couponOne
EXACT ENGLISH: {count} coupon
CONTEXT: Admin Panel — analytics — coupon one
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · interpolation: {count} · [REVIEW POSSIBLE]
```

```
KEY: admin.analytics.couponPerformance
EXACT ENGLISH: Coupon Performance
CONTEXT: Admin Panel — analytics — coupon performance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.couponPerformanceCaption
EXACT ENGLISH: Codes with zero redemptions are returned by the aggregation too, so unused promotions stay visible.
CONTEXT: Admin Panel — analytics — coupon performance caption
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.couponPerformanceSubtitle
EXACT ENGLISH: Redemptions per coupon code · all time
CONTEXT: Admin Panel — analytics — coupon performance subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.coupons
EXACT ENGLISH: {count} coupons
CONTEXT: Admin Panel — analytics — coupons
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · interpolation: {count} · [REVIEW POSSIBLE]
```

```
KEY: admin.analytics.customerGrowth
EXACT ENGLISH: Customer Growth
CONTEXT: Admin Panel — analytics — customer growth
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.customerGrowthCaption
EXACT ENGLISH: One row per month of profile creation. The aggregation is not windowed, so this series spans the full lifetime of the boutique.
CONTEXT: Admin Panel — analytics — customer growth caption
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.customerGrowthEmpty
EXACT ENGLISH: No customer profiles with the customer role yet.
CONTEXT: Admin Panel — analytics — customer growth empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.customerGrowthSubtitle
EXACT ENGLISH: Signups per calendar month · all time
CONTEXT: Admin Panel — analytics — customer growth subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.customers
EXACT ENGLISH: Customers
CONTEXT: Admin Panel — analytics — customers
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.customersSubtitle
EXACT ENGLISH: Distinct order emails on record
CONTEXT: Admin Panel — analytics — customers subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.discountGivenHeader
EXACT ENGLISH: Discount Given
CONTEXT: Admin Panel — analytics — discount given header
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.discountGivenLabel
EXACT ENGLISH: Discount given
CONTEXT: Admin Panel — analytics — discount given label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.emptyBody
EXACT ENGLISH: The aggregation answered for the last {days} days, but there is nothing to report yet: no orders, refunds, cancellations, signups, coupon usage or stock alerts. Numbers appear as soon as real activity is recorded.
CONTEXT: Admin Panel — analytics — empty body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {days}
```

```
KEY: admin.analytics.emptyTitle
EXACT ENGLISH: No telemetry yet
CONTEXT: Admin Panel — analytics — empty title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.eyebrow
EXACT ENGLISH: Telemetry & Business Intelligence
CONTEXT: Admin Panel — analytics — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.footerNote
EXACT ENGLISH: Figures are re-read from the server aggregation whenever this page mounts or the reporting window changes. Where the aggregation carries no comparable prior window, no trend or percentage is shown rather than an estimate.
CONTEXT: Admin Panel — analytics — footer note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.inactiveVariants
EXACT ENGLISH: Inactive variants
CONTEXT: Admin Panel — analytics — inactive variants
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.inventoryAlerts
EXACT ENGLISH: Inventory Alerts
CONTEXT: Admin Panel — analytics — inventory alerts
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.inventoryAlertsNote
EXACT ENGLISH: Current state of every product variant, not a historical series.
CONTEXT: Admin Panel — analytics — inventory alerts note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.inventoryAlertsSubtitle
EXACT ENGLISH: {outOfStock} out of stock · {lowStock} low stock · {inactive} inactive
CONTEXT: Admin Panel — analytics — inventory alerts subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {outOfStock}, {lowStock}, {inactive}
```

```
KEY: admin.analytics.loadingDays
EXACT ENGLISH: Querying the boutique analytics aggregation for the last {count} days…
CONTEXT: Admin Panel — analytics — loading days
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.analytics.loadingMonths
EXACT ENGLISH: Querying the boutique analytics aggregation for the last 12 months…
CONTEXT: Admin Panel — analytics — loading months
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.lowStockLabel
EXACT ENGLISH: Low stock
CONTEXT: Admin Panel — analytics — low stock label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.method
EXACT ENGLISH: Method
CONTEXT: Admin Panel — analytics — method
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.analytics.month
EXACT ENGLISH: Month
CONTEXT: Admin Panel — analytics — month
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.analytics.netRevenue
EXACT ENGLISH: Net Revenue
CONTEXT: Admin Panel — analytics — net revenue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.netRevenueSubtitle
EXACT ENGLISH: {gross} gross less {refunds} processed refunds
CONTEXT: Admin Panel — analytics — net revenue subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {gross}, {refunds}
```

```
KEY: admin.analytics.noDatedOrderRows
EXACT ENGLISH: no dated order rows in this window
CONTEXT: Admin Panel — analytics — no dated order rows
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.noResultMessage
EXACT ENGLISH: The analytics aggregation returned no result. This happens when the session is not a staff session or the RPC call failed.
CONTEXT: Admin Panel — analytics — no result message
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · [REVIEW POSSIBLE]
```

```
KEY: admin.analytics.orderStatus
EXACT ENGLISH: Order Status
CONTEXT: Admin Panel — analytics — order status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.orderStatusCaption
EXACT ENGLISH: Every order row grouped by its current status, including cancelled and returned rows.
CONTEXT: Admin Panel — analytics — order status caption
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.orderStatusEmpty
EXACT ENGLISH: No orders recorded yet.
CONTEXT: Admin Panel — analytics — order status empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.orderStatusMix
EXACT ENGLISH: Order Status & Payment Mix
CONTEXT: Admin Panel — analytics — order status mix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.orderStatusMixNote
EXACT ENGLISH: Distributions are counted across every row in the database, so they describe the full order book rather than the selected window.
CONTEXT: Admin Panel — analytics — order status mix note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.orderStatusSubtitle
EXACT ENGLISH: Order rows by status · all time
CONTEXT: Admin Panel — analytics — order status subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.orders
EXACT ENGLISH: Orders
CONTEXT: Admin Panel — analytics — orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.analytics.ordersSubtitle
EXACT ENGLISH: Non-cancelled order rows
CONTEXT: Admin Panel — analytics — orders subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.pageIntro
EXACT ENGLISH: Every figure is returned by the server-side aggregation RPC. Series, distributions and money values are read straight from the snapshot — no sample data and no estimated percentages.
CONTEXT: Admin Panel — analytics — page intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.pageTitle
EXACT ENGLISH: Boutique Performance & Revenue Analytics
CONTEXT: Admin Panel — analytics — page title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.paymentMethod
EXACT ENGLISH: Payment Method
CONTEXT: Admin Panel — analytics — payment method
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.paymentMethodCaption
EXACT ENGLISH: Cancelled orders are excluded from the payment method rollup.
CONTEXT: Admin Panel — analytics — payment method caption
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.paymentMethodEmpty
EXACT ENGLISH: No payment method recorded on any order yet.
CONTEXT: Admin Panel — analytics — payment method empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.paymentMethodSubtitle
EXACT ENGLISH: Revenue by method · all time
CONTEXT: Admin Panel — analytics — payment method subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.paymentStatus
EXACT ENGLISH: Payment Status
CONTEXT: Admin Panel — analytics — payment status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.paymentStatusCaption
EXACT ENGLISH: Counted from the payments table, one row per recorded payment.
CONTEXT: Admin Panel — analytics — payment status caption
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.paymentStatusEmpty
EXACT ENGLISH: No payment records verified yet.
CONTEXT: Admin Panel — analytics — payment status empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.paymentStatusSubtitle
EXACT ENGLISH: Payment records by status · all time
CONTEXT: Admin Panel — analytics — payment status subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.pendingAmount
EXACT ENGLISH: Pending amount
CONTEXT: Admin Panel — analytics — pending amount
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.processedAmount
EXACT ENGLISH: Processed amount
CONTEXT: Admin Panel — analytics — processed amount
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.product
EXACT ENGLISH: Product
CONTEXT: Admin Panel — analytics — product
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.analytics.promotions
EXACT ENGLISH: Promotions
CONTEXT: Admin Panel — analytics — promotions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.promotionsNote
EXACT ENGLISH: Coupon usage is counted across all time: {redemptions} recorded against {coupons} in the catalog.
CONTEXT: Admin Panel — analytics — promotions note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {redemptions}, {coupons}
```

```
KEY: admin.analytics.rank
EXACT ENGLISH: Rank
CONTEXT: Admin Panel — analytics — rank
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.analytics.records
EXACT ENGLISH: Records
CONTEXT: Admin Panel — analytics — records
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.analytics.redemptionOne
EXACT ENGLISH: {count} redemption
CONTEXT: Admin Panel — analytics — redemption one
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · interpolation: {count} · [REVIEW POSSIBLE]
```

```
KEY: admin.analytics.redemptions
EXACT ENGLISH: {count} redemptions
CONTEXT: Admin Panel — analytics — redemptions
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: no literal call site found
NOTES: not referenced by a literal t()/key prop — confirm the call site or drop it · interpolation: {count} · [REVIEW POSSIBLE]
```

```
KEY: admin.analytics.refundLedgerNote
EXACT ENGLISH: Refund rows are counted across all time, which is why they are deducted from lifetime gross revenue.
CONTEXT: Admin Panel — analytics — refund ledger note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.refundRecordsLabel
EXACT ENGLISH: Refund records
CONTEXT: Admin Panel — analytics — refund records label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.refundRecordsSubtitle
EXACT ENGLISH: {processed} processed · {pending} pending
CONTEXT: Admin Panel — analytics — refund records subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {processed}, {pending}
```

```
KEY: admin.analytics.rejectedOrFailed
EXACT ENGLISH: Rejected or failed
CONTEXT: Admin Panel — analytics — rejected or failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.reportingWindow
EXACT ENGLISH: Reporting window
CONTEXT: Admin Panel — analytics — reporting window
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.retryRequest
EXACT ENGLISH: Retry request
CONTEXT: Admin Panel — analytics — retry request
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.returnedOrders
EXACT ENGLISH: Returned orders
CONTEXT: Admin Panel — analytics — returned orders
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.revenue
EXACT ENGLISH: Revenue
CONTEXT: Admin Panel — analytics — revenue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.analytics.revenueOrderVolume
EXACT ENGLISH: Revenue & Order Volume
CONTEXT: Admin Panel — analytics — revenue order volume
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.revenueVolume
EXACT ENGLISH: Revenue & Volume
CONTEXT: Admin Panel — analytics — revenue volume
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.revenueVolumeNote
EXACT ENGLISH: Aggregation window reported by the server: {days} days. Totals exclude cancelled orders; cancelled and returned rows are reported separately below.
CONTEXT: Admin Panel — analytics — revenue volume note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {days}
```

```
KEY: admin.analytics.signups
EXACT ENGLISH: Signups
CONTEXT: Admin Panel — analytics — signups
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.analytics.topBottleSizes
EXACT ENGLISH: Top Bottle Sizes
CONTEXT: Admin Panel — analytics — top bottle sizes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.topBottleSizesCaption
EXACT ENGLISH: Bars show units sold; the ivory series shows the revenue those units generated, scaled to its own maximum.
CONTEXT: Admin Panel — analytics — top bottle sizes caption
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.topBottleSizesEmpty
EXACT ENGLISH: No sized variants were ordered inside this window.
CONTEXT: Admin Panel — analytics — top bottle sizes empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.topBottleSizesSubtitle
EXACT ENGLISH: Units per variant size · last {days} days
CONTEXT: Admin Panel — analytics — top bottle sizes subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {days}
```

```
KEY: admin.analytics.topProducts
EXACT ENGLISH: Top Products
CONTEXT: Admin Panel — analytics — top products
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.topProductsCaption
EXACT ENGLISH: Revenue is the sum of order line totals per product name, with cancelled orders excluded.
CONTEXT: Admin Panel — analytics — top products caption
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.topProductsDetail
EXACT ENGLISH: Top Products Detail
CONTEXT: Admin Panel — analytics — top products detail
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.topProductsDetailCaption
EXACT ENGLISH: Same rows that feed the Top Products chart, with the untruncated product name.
CONTEXT: Admin Panel — analytics — top products detail caption
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.topProductsDetailEmpty
EXACT ENGLISH: No products sold inside this window.
CONTEXT: Admin Panel — analytics — top products detail empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.topProductsDetailSubtitle
EXACT ENGLISH: Full names, units, orders and revenue · last {days} days
CONTEXT: Admin Panel — analytics — top products detail subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {days}
```

```
KEY: admin.analytics.topProductsEmpty
EXACT ENGLISH: No line items were sold inside this window.
CONTEXT: Admin Panel — analytics — top products empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.topProductsSubtitle
EXACT ENGLISH: Revenue per product · last {days} days
CONTEXT: Admin Panel — analytics — top products subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {days}
```

```
KEY: admin.analytics.trendCaption
EXACT ENGLISH: The aggregation emits daily rows for the last 90 days; they are summed into 7-day buckets so the series stays readable. Weeks between the first and last order with no activity are true zeros.
CONTEXT: Admin Panel — analytics — trend caption
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.trendEmpty
EXACT ENGLISH: No dated order rows fall inside this window yet.
CONTEXT: Admin Panel — analytics — trend empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.trendsNote
EXACT ENGLISH: Derived from the daily and monthly rows the aggregation returns. Each chart exposes the same numbers in a collapsible table.
CONTEXT: Admin Panel — analytics — trends note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.trendsOverTime
EXACT ENGLISH: Trends Over Time
CONTEXT: Admin Panel — analytics — trends over time
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.unavailableTitle
EXACT ENGLISH: Analytics unavailable
CONTEXT: Admin Panel — analytics — unavailable title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.unexpectedError
EXACT ENGLISH: Unexpected error while loading analytics.
CONTEXT: Admin Panel — analytics — unexpected error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.units
EXACT ENGLISH: Units
CONTEXT: Admin Panel — analytics — units
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.analytics.unitsSold
EXACT ENGLISH: Units Sold
CONTEXT: Admin Panel — analytics — units sold
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.unitsSoldSubtitle
EXACT ENGLISH: Bottles across non-cancelled orders
CONTEXT: Admin Panel — analytics — units sold subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.uses
EXACT ENGLISH: Uses
CONTEXT: Admin Panel — analytics — uses
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.analytics.weekStarting
EXACT ENGLISH: Week starting
CONTEXT: Admin Panel — analytics — week starting
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.weeklyBucketsSubtitle
EXACT ENGLISH: Weekly buckets · {range}
CONTEXT: Admin Panel — analytics — weekly buckets subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {range}
```

```
KEY: admin.analytics.windowDays
EXACT ENGLISH: {count} days
CONTEXT: Admin Panel — analytics — window days
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.analytics.windowHint
EXACT ENGLISH: The window is applied by the aggregation to top products and bottle sizes, and is used to slice the daily trend. Lifetime panels carry their own scope label.
CONTEXT: Admin Panel — analytics — window hint
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.analytics.windowMonths
EXACT ENGLISH: 12 months
CONTEXT: Admin Panel — analytics — window months
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AnalyticsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.announcementMessage
EXACT ENGLISH: Announcement Message
CONTEXT: Admin Panel — homepage cms — announcement message
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.announcementTickerPreview
EXACT ENGLISH: ANNOUNCEMENT TICKER PREVIEW
CONTEXT: Admin Panel — homepage cms — announcement ticker preview
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.buttonCtaLink
EXACT ENGLISH: Button CTA Link
CONTEXT: Admin Panel — homepage cms — button cta link
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.buttonCtaText
EXACT ENGLISH: Button CTA Text
CONTEXT: Admin Panel — homepage cms — button cta text
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Button / CTA
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.enableTicker
EXACT ENGLISH: Enable Ticker
CONTEXT: Admin Panel — homepage cms — enable ticker
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.eyebrow
EXACT ENGLISH: STOREFRONT CONTENT MANAGEMENT SYSTEM
CONTEXT: Admin Panel — homepage cms — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.heroBodyCopy
EXACT ENGLISH: Hero Body Copy
CONTEXT: Admin Panel — homepage cms — hero body copy
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.heroEyebrowSubheading
EXACT ENGLISH: Hero Eyebrow Subheading
CONTEXT: Admin Panel — homepage cms — hero eyebrow subheading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.heroImage
EXACT ENGLISH: Hero Image
CONTEXT: Admin Panel — homepage cms — hero image
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.heroImageNote
EXACT ENGLISH: The most recently added image is the one shown in the hero circle. Leave this untouched to keep the current photography.
CONTEXT: Admin Panel — homepage cms — hero image note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.heroSectionBannerConfiguration
EXACT ENGLISH: Hero Section Banner Configuration
CONTEXT: Admin Panel — homepage cms — hero section banner configuration
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.hidden
EXACT ENGLISH: Hidden
CONTEXT: Admin Panel — homepage cms — hidden
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.homepageCms.homepageLayoutSectionOrdering
EXACT ENGLISH: Homepage Layout & Section Ordering
CONTEXT: Admin Panel — homepage cms — homepage layout section ordering
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.introBody
EXACT ENGLISH: Control headlines, hero banners, section ordering, and top announcement tickers without modifying code.
CONTEXT: Admin Panel — homepage cms — intro body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.liveStorefrontSimulator
EXACT ENGLISH: Live Storefront Simulator
CONTEXT: Admin Panel — homepage cms — live storefront simulator
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.mainHeroTitle
EXACT ENGLISH: Main Hero Title
CONTEXT: Admin Panel — homepage cms — main hero title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.pipeHintPrefix
EXACT ENGLISH: A vertical bar
CONTEXT: Admin Panel — homepage cms — pipe hint prefix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.pipeHintSuffix
EXACT ENGLISH: in the title or body copy starts a new line on the storefront, exactly where the headline currently breaks.
CONTEXT: Admin Panel — homepage cms — pipe hint suffix
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.previewRealtimeNote
EXACT ENGLISH: Preview updates in real-time as you edit form fields above.
CONTEXT: Admin Panel — homepage cms — preview realtime note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.saveHomepageCms
EXACT ENGLISH: Save Homepage CMS
CONTEXT: Admin Panel — homepage cms — save homepage cms
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.tickerClickTargetUrl
EXACT ENGLISH: Ticker Click Target URL
CONTEXT: Admin Panel — homepage cms — ticker click target url
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.title
EXACT ENGLISH: Homepage Content & Hero Banner CMS
CONTEXT: Admin Panel — homepage cms — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.titleAccentGoldItalic
EXACT ENGLISH: Title Accent (gold italic)
CONTEXT: Admin Panel — homepage cms — title accent gold italic
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.toggleVisibilityNote
EXACT ENGLISH: Toggle visibility or reorder sections on the live customer website.
CONTEXT: Admin Panel — homepage cms — toggle visibility note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.topTickerAnnouncementBar
EXACT ENGLISH: Top Ticker Announcement Bar
CONTEXT: Admin Panel — homepage cms — top ticker announcement bar
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: —
```

```
KEY: admin.homepageCms.visible
EXACT ENGLISH: Visible
CONTEXT: Admin Panel — homepage cms — visible
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/HomepageCmsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.localization.chooseEntityNote
EXACT ENGLISH: Choose a content type, a language and an item to edit its translation.
CONTEXT: Admin Panel — localization — choose entity note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.contentListLoadFailed
EXACT ENGLISH: The content list could not be loaded.
CONTEXT: Admin Panel — localization — content list load failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.contentType
EXACT ENGLISH: Content type
CONTEXT: Admin Panel — localization — content type
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.englishSource
EXACT ENGLISH: English source:
CONTEXT: Admin Panel — localization — english source
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.eyebrow
EXACT ENGLISH: CONTENT LOCALIZATION
CONTEXT: Admin Panel — localization — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldCategoryDescription
EXACT ENGLISH: Category description
CONTEXT: Admin Panel — localization — field category description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldCategoryName
EXACT ENGLISH: Category name
CONTEXT: Admin Panel — localization — field category name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldCollectionDescription
EXACT ENGLISH: Collection description
CONTEXT: Admin Panel — localization — field collection description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldCollectionName
EXACT ENGLISH: Collection name
CONTEXT: Admin Panel — localization — field collection name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldContent
EXACT ENGLISH: Content
CONTEXT: Admin Panel — localization — field content
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.localization.fieldDescription
EXACT ENGLISH: Description
CONTEXT: Admin Panel — localization — field description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldFragranceFamily
EXACT ENGLISH: Fragrance family
CONTEXT: Admin Panel — localization — field fragrance family
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldNoteName
EXACT ENGLISH: Note name
CONTEXT: Admin Panel — localization — field note name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldProductName
EXACT ENGLISH: Product name
CONTEXT: Admin Panel — localization — field product name
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldScentProfile
EXACT ENGLISH: Scent profile
CONTEXT: Admin Panel — localization — field scent profile
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldSeoDescription
EXACT ENGLISH: SEO description
CONTEXT: Admin Panel — localization — field seo description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldSeoTitle
EXACT ENGLISH: SEO title
CONTEXT: Admin Panel — localization — field seo title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldShortDescription
EXACT ENGLISH: Short description
CONTEXT: Admin Panel — localization — field short description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldSubtitle
EXACT ENGLISH: Subtitle
CONTEXT: Admin Panel — localization — field subtitle
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.fieldTitle
EXACT ENGLISH: Title
CONTEXT: Admin Panel — localization — field title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.localization.fillAtLeastOneField
EXACT ENGLISH: Fill in at least one field, or remove this translation instead.
CONTEXT: Admin Panel — localization — fill at least one field
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.introBody
EXACT ENGLISH: Names, descriptions and search metadata are stored per language against the existing product, category and collection rows. Prices, SKUs, stock and order history are never part of a translation, and a field left empty falls back to the original English text.
CONTEXT: Admin Panel — localization — intro body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.item
EXACT ENGLISH: Item
CONTEXT: Admin Panel — localization — item
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.localization.kindCategories
EXACT ENGLISH: Categories
CONTEXT: Admin Panel — localization — kind categories
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.kindCollections
EXACT ENGLISH: Collections
CONTEXT: Admin Panel — localization — kind collections
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.kindFragranceNotes
EXACT ENGLISH: Fragrance notes
CONTEXT: Admin Panel — localization — kind fragrance notes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.kindHomepageSections
EXACT ENGLISH: Homepage sections
CONTEXT: Admin Panel — localization — kind homepage sections
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.kindProducts
EXACT ENGLISH: Products
CONTEXT: Admin Panel — localization — kind products
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.language
EXACT ENGLISH: Language
CONTEXT: Admin Panel — localization — language
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.loadingContent
EXACT ENGLISH: Loading content…
CONTEXT: Admin Panel — localization — loading content
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.readOnlyNote
EXACT ENGLISH: You can review translations. Saving or removing them requires content or settings permission.
CONTEXT: Admin Panel — localization — read only note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.saveTranslation
EXACT ENGLISH: Save translation
CONTEXT: Admin Panel — localization — save translation
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.saving
EXACT ENGLISH: Saving…
CONTEXT: Admin Panel — localization — saving
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.localization.storedForLanguage
EXACT ENGLISH: A translation is stored for this item in {language}
CONTEXT: Admin Panel — localization — stored for language
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: interpolation: {language}
```

```
KEY: admin.localization.title
EXACT ENGLISH: Translated product and collection copy
CONTEXT: Admin Panel — localization — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.translationRemoveFailed
EXACT ENGLISH: The translation could not be removed.
CONTEXT: Admin Panel — localization — translation remove failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.translationRemovedNote
EXACT ENGLISH: Translation removed. That content now shows its original English text.
CONTEXT: Admin Panel — localization — translation removed note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.translationSaveFailed
EXACT ENGLISH: The translation could not be saved.
CONTEXT: Admin Panel — localization — translation save failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.localization.translationSavedNote
EXACT ENGLISH: Translation saved. The storefront shows it on the next load.
CONTEXT: Admin Panel — localization — translation saved note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/LocalizationPage.tsx
NOTES: —
```

```
KEY: admin.login.accessStaffWorkspace
EXACT ENGLISH: Access Staff Workspace
CONTEXT: Admin Panel — login — access staff workspace
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminLogin.tsx
NOTES: —
```

```
KEY: admin.login.boutiqueStaffLogin
EXACT ENGLISH: Boutique Staff Login
CONTEXT: Admin Panel — login — boutique staff login
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminLogin.tsx
NOTES: —
```

```
KEY: admin.login.introBody
EXACT ENGLISH: Sign in with your authorized staff credentials to access your workspace.
CONTEXT: Admin Panel — login — intro body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminLogin.tsx
NOTES: —
```

```
KEY: admin.login.invalidEmailOrPassword
EXACT ENGLISH: Invalid email address or password.
CONTEXT: Admin Panel — login — invalid email or password
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AdminLogin.tsx
NOTES: —
```

```
KEY: admin.login.rememberStaffSession
EXACT ENGLISH: Remember staff session
CONTEXT: Admin Panel — login — remember staff session
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminLogin.tsx
NOTES: —
```

```
KEY: admin.login.staffAdministrativePortal
EXACT ENGLISH: STAFF ADMINISTRATIVE PORTAL
CONTEXT: Admin Panel — login — staff administrative portal
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminLogin.tsx
NOTES: —
```

```
KEY: admin.login.staffEmailAddress
EXACT ENGLISH: Staff Email Address
CONTEXT: Admin Panel — login — staff email address
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AdminLogin.tsx
NOTES: —
```

```
KEY: admin.login.staffEmailRequired
EXACT ENGLISH: Please enter your staff email address.
CONTEXT: Admin Panel — login — staff email required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AdminLogin.tsx
NOTES: —
```

```
KEY: admin.login.staffPasswordRequired
EXACT ENGLISH: Please enter your security password.
CONTEXT: Admin Panel — login — staff password required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AdminLogin.tsx
NOTES: —
```

```
KEY: admin.notifications.activeNotificationTemplate
EXACT ENGLISH: Active Notification Template
CONTEXT: Admin Panel — notifications — active notification template
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.activeTemplate
EXACT ENGLISH: Active Template
CONTEXT: Admin Panel — notifications — active template
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.activityLogHeading
EXACT ENGLISH: Telemetry & Order System Activity Log
CONTEXT: Admin Panel — notifications — activity log heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.checkingEmailCapability
EXACT ENGLISH: Checking whether this deployment can deliver email…
CONTEXT: Admin Panel — notifications — checking email capability
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.drainResultNote
EXACT ENGLISH: Sent {sent}, failed {failed}, skipped {skipped} — from this account's own queued messages. Staff copies wait for the scheduler.
CONTEXT: Admin Panel — notifications — drain result note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: interpolation: {sent}, {failed}, {skipped}
```

```
KEY: admin.notifications.editTemplate
EXACT ENGLISH: Edit Template
CONTEXT: Admin Panel — notifications — edit template
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.editTemplateNamed
EXACT ENGLISH: Edit Template — {name}
CONTEXT: Admin Panel — notifications — edit template named
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.notifications.emailBodyContent
EXACT ENGLISH: Email Body Content
CONTEXT: Admin Panel — notifications — email body content
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.emailNotConfiguredNote
EXACT ENGLISH: Email delivery is not configured on this deployment, so nothing was sent.
CONTEXT: Admin Panel — notifications — email not configured note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.emailReadyNote
EXACT ENGLISH: Order, payment and refund events are queued by the database and delivered by the server worker. A browser session can only claim messages addressed to its own account; staff copies and time-based reminders wait for the scheduler.
CONTEXT: Admin Panel — notifications — email ready note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.emailSubjectLineRequired
EXACT ENGLISH: Email Subject Line *
CONTEXT: Admin Panel — notifications — email subject line required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.emailUnavailableNote
EXACT ENGLISH: No email service is configured for this deployment, so queued messages stay recorded and nothing is sent. Delivery claims are never simulated.
CONTEXT: Admin Panel — notifications — email unavailable note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.event
EXACT ENGLISH: Event
CONTEXT: Admin Panel — notifications — event
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.notifications.eyebrow
EXACT ENGLISH: SYSTEM NOTIFICATIONS & MESSAGE DRAFTS
CONTEXT: Admin Panel — notifications — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.introBody
EXACT ENGLISH: Manage system activity logs and message drafts. Customer email is not sent from these.
CONTEXT: Admin Panel — notifications — intro body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.messageDraftsHeading
EXACT ENGLISH: Message Drafts — Stored For Reference
CONTEXT: Admin Panel — notifications — message drafts heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.nothingQueued
EXACT ENGLISH: Nothing is queued. Messages appear here as soon as an order, payment or refund event is recorded.
CONTEXT: Admin Panel — notifications — nothing queued
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.outboundMessageQueue
EXACT ENGLISH: Outbound Message Queue
CONTEXT: Admin Panel — notifications — outbound message queue
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.recorded
EXACT ENGLISH: Recorded
CONTEXT: Admin Panel — notifications — recorded
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.refresh
EXACT ENGLISH: Refresh
CONTEXT: Admin Panel — notifications — refresh
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.notifications.saveTemplate
EXACT ENGLISH: Save Template
CONTEXT: Admin Panel — notifications — save template
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.sendQueuedNow
EXACT ENGLISH: Send queued now
CONTEXT: Admin Panel — notifications — send queued now
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.sending
EXACT ENGLISH: SENDING…
CONTEXT: Admin Panel — notifications — sending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.supportsTags
EXACT ENGLISH: (Supports tags:
CONTEXT: Admin Panel — notifications — supports tags
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.title
EXACT ENGLISH: Notifications & Message Drafts
CONTEXT: Admin Panel — notifications — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: —
```

```
KEY: admin.notifications.to
EXACT ENGLISH: To
CONTEXT: Admin Panel — notifications — to
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.notifications.tries
EXACT ENGLISH: Tries
CONTEXT: Admin Panel — notifications — tries
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/NotificationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.seo.action
EXACT ENGLISH: Action
CONTEXT: Admin Panel — seo — action
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.seo.canonicalLinkUrl
EXACT ENGLISH: Canonical Link URL
CONTEXT: Admin Panel — seo — canonical link url
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.canonicalUrl
EXACT ENGLISH: Canonical URL
CONTEXT: Admin Panel — seo — canonical url
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.editSeoMetadataNamed
EXACT ENGLISH: Edit SEO Metadata — {name}
CONTEXT: Admin Panel — seo — edit seo metadata named
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.seo.eyebrow
EXACT ENGLISH: SEARCH ENGINE OPTIMIZATION & OPEN GRAPH
CONTEXT: Admin Panel — seo — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.googleMetaDescriptionRequired
EXACT ENGLISH: Google Meta Description *
CONTEXT: Admin Panel — seo — google meta description required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.googleMetaTitle
EXACT ENGLISH: Google Meta Title
CONTEXT: Admin Panel — seo — google meta title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.googleSearchTitleTagRequired
EXACT ENGLISH: Google Search Title Tag *
CONTEXT: Admin Panel — seo — google search title tag required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.introBody
EXACT ENGLISH: Manage page titles, meta descriptions, canonical links, and social card preview tags across all website routes.
CONTEXT: Admin Panel — seo — intro body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.manageSeo
EXACT ENGLISH: Manage SEO
CONTEXT: Admin Panel — seo — manage seo
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.metaDescription
EXACT ENGLISH: Meta Description
CONTEXT: Admin Panel — seo — meta description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.noSeoRecords
EXACT ENGLISH: No SEO records
CONTEXT: Admin Panel — seo — no seo records
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.pageTarget
EXACT ENGLISH: Page Target
CONTEXT: Admin Panel — seo — page target
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.saveSeoMetadata
EXACT ENGLISH: Save SEO Metadata
CONTEXT: Admin Panel — seo — save seo metadata
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.searchPageNameMetaTitle
EXACT ENGLISH: Search page name, meta title...
CONTEXT: Admin Panel — seo — search page name meta title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.socialOpenGraphImageUrl
EXACT ENGLISH: Social Open Graph Image URL
CONTEXT: Admin Panel — seo — social open graph image url
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.seo.title
EXACT ENGLISH: SEO Indexing & Metadata Control
CONTEXT: Admin Panel — seo — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/pages/SeoPage.tsx
NOTES: —
```

```
KEY: admin.shipping.aboveAmount
EXACT ENGLISH: Above {amount}
CONTEXT: Admin Panel — shipping — above amount
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: interpolation: {amount}
```

```
KEY: admin.shipping.activeMethod
EXACT ENGLISH: Active Method
CONTEXT: Admin Panel — shipping — active method
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.activeMethodAtCheckout
EXACT ENGLISH: Active Method at Checkout
CONTEXT: Admin Panel — shipping — active method at checkout
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.baseChargePkr
EXACT ENGLISH: Base Charge (PKR)
CONTEXT: Admin Panel — shipping — base charge pkr
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.complimentaryWithAmount
EXACT ENGLISH: Complimentary ({amount})
CONTEXT: Admin Panel — shipping — complimentary with amount
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: interpolation: {amount}
```

```
KEY: admin.shipping.configureMethod
EXACT ENGLISH: Configure Method
CONTEXT: Admin Panel — shipping — configure method
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.configureShippingMethodNamed
EXACT ENGLISH: Configure Shipping Method — {name}
CONTEXT: Admin Panel — shipping — configure shipping method named
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.shipping.estimatedDeliveryLabel
EXACT ENGLISH: Estimated Delivery:
CONTEXT: Admin Panel — shipping — estimated delivery label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.estimatedTransitPlaceholder
EXACT ENGLISH: 2–3 business days
CONTEXT: Admin Panel — shipping — estimated transit placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.estimatedTransitTime
EXACT ENGLISH: Estimated Transit Time
CONTEXT: Admin Panel — shipping — estimated transit time
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.eyebrow
EXACT ENGLISH: DELIVERY PRICING RECORDS
CONTEXT: Admin Panel — shipping — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.freeShippingMinimumPkr
EXACT ENGLISH: Free Shipping Minimum (PKR)
CONTEXT: Admin Panel — shipping — free shipping minimum pkr
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.freeThreshold
EXACT ENGLISH: Free Threshold:
CONTEXT: Admin Panel — shipping — free threshold
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.introBody
EXACT ENGLISH: Delivery pricing records (not shown to clients). Rates and transit times here are stored for reference; the charges applied at checkout come from the delivery pricing rules in Settings.
CONTEXT: Admin Panel — shipping — intro body
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.methodNameRequired
EXACT ENGLISH: Method Name *
CONTEXT: Admin Panel — shipping — method name required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.rateCharge
EXACT ENGLISH: Rate Charge:
CONTEXT: Admin Panel — shipping — rate charge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.saveConfiguration
EXACT ENGLISH: Save Configuration
CONTEXT: Admin Panel — shipping — save configuration
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.serviceDescription
EXACT ENGLISH: Service Description
CONTEXT: Admin Panel — shipping — service description
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.shipping.title
EXACT ENGLISH: Shipping Charges & Delivery Rates
CONTEXT: Admin Panel — shipping — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ShippingPage.tsx
NOTES: —
```

```
KEY: admin.automations.accessDenied
EXACT ENGLISH: The automation board is staff-only and the current session was not accepted, or the database is unreachable. Sign in as staff and reload.
CONTEXT: Admin Panel — automations — access denied
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.capEmailTransport
EXACT ENGLISH: Email transport (SMTP)
CONTEXT: Admin Panel — automations — cap email transport
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.capMissing
EXACT ENGLISH: missing
CONTEXT: Admin Panel — automations — cap missing
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.capReady
EXACT ENGLISH: ready
CONTEXT: Admin Panel — automations — cap ready
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.capSchedulerSecret
EXACT ENGLISH: Scheduler secret
CONTEXT: Admin Panel — automations — cap scheduler secret
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.capServerDatabase
EXACT ENGLISH: Server database access
CONTEXT: Admin Panel — automations — cap server database
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.chipDisabled
EXACT ENGLISH: disabled
CONTEXT: Admin Panel — automations — chip disabled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.chipEnabled
EXACT ENGLISH: enabled
CONTEXT: Admin Panel — automations — chip enabled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.colCustomers
EXACT ENGLISH: Customers
CONTEXT: Admin Panel — automations — col customers
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.colDue
EXACT ENGLISH: Due
CONTEXT: Admin Panel — automations — col due
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.automations.colProcessed
EXACT ENGLISH: Processed
CONTEXT: Admin Panel — automations — col processed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.colQueued
EXACT ENGLISH: Queued
CONTEXT: Admin Panel — automations — col queued
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.automations.colResult
EXACT ENGLISH: Result
CONTEXT: Admin Panel — automations — col result
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.automations.colRuleApplied
EXACT ENGLISH: Rule applied
CONTEXT: Admin Panel — automations — col rule applied
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.colSegment
EXACT ENGLISH: Segment
CONTEXT: Admin Panel — automations — col segment
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.automations.colStarted
EXACT ENGLISH: Started
CONTEXT: Admin Panel — automations — col started
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.automations.colTries
EXACT ENGLISH: Tries
CONTEXT: Admin Panel — automations — col tries
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.automations.colWhy
EXACT ENGLISH: Why
CONTEXT: Admin Panel — automations — col why
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.automations.colWorkflow
EXACT ENGLISH: Workflow
CONTEXT: Admin Panel — automations — col workflow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.consentRequired
EXACT ENGLISH: Marketing consent required — customers who did not opt in are skipped.
CONTEXT: Admin Panel — automations — consent required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.delayDays
EXACT ENGLISH: {days} d
CONTEXT: Admin Panel — automations — delay days
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: interpolation: {days}
```

```
KEY: admin.automations.delayHours
EXACT ENGLISH: {hours} h
CONTEXT: Admin Panel — automations — delay hours
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: interpolation: {hours}
```

```
KEY: admin.automations.delayMinutes
EXACT ENGLISH: {minutes} min
CONTEXT: Admin Panel — automations — delay minutes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: interpolation: {minutes}
```

```
KEY: admin.automations.disableWorkflow
EXACT ENGLISH: Disable workflow
CONTEXT: Admin Panel — automations — disable workflow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.dtPending
EXACT ENGLISH: pending
CONTEXT: Admin Panel — automations — dt pending
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.dtSent
EXACT ENGLISH: sent
CONTEXT: Admin Panel — automations — dt sent
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Success message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.dtSkipped
EXACT ENGLISH: skipped
CONTEXT: Admin Panel — automations — dt skipped
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.dtWait
EXACT ENGLISH: wait
CONTEXT: Admin Panel — automations — dt wait
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.emailQueueEmpty
EXACT ENGLISH: The email queue is empty.
CONTEXT: Admin Panel — automations — email queue empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.emailQueueHeading
EXACT ENGLISH: Email queue after these workflows
CONTEXT: Admin Panel — automations — email queue heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.enableWorkflow
EXACT ENGLISH: Enable workflow
CONTEXT: Admin Panel — automations — enable workflow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.eyebrow
EXACT ENGLISH: AUTOMATION CONTROL
CONTEXT: Admin Panel — automations — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.failureAlert
EXACT ENGLISH: A task or scheduler run has failed. The reason is stored with the row above; it names the step that failed, never a credential.
CONTEXT: Admin Panel — automations — failure alert
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.fullSweep
EXACT ENGLISH: full sweep
CONTEXT: Admin Panel — automations — full sweep
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.intro
EXACT ENGLISH: Abandoned-bag reminders, review requests and delivery check-ins. Every workflow starts disabled, promotional ones are sent only to customers who accepted marketing email, and a bag can never be reminded twice. Nothing here sends from the browser — delivery happens in the server worker, and an email is only claimed when the transport actually reports it.
CONTEXT: Admin Panel — automations — intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.lastRunLabel
EXACT ENGLISH: last run:
CONTEXT: Admin Panel — automations — last run label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.lastRunNever
EXACT ENGLISH: never
CONTEXT: Admin Panel — automations — last run never
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.noBrowserSweepNote
EXACT ENGLISH: A browser cannot trigger a sweep: the queue functions are executable only by the server role, so no customer session or admin page can cause a send.
CONTEXT: Admin Panel — automations — no browser sweep note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.notReadyNote
EXACT ENGLISH: Until all three are present, enabling a workflow queues tasks and messages without delivering them. Nothing is discarded and no delivery is claimed.
CONTEXT: Admin Panel — automations — not ready note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.readinessHeading
EXACT ENGLISH: What this deployment can do right now
CONTEXT: Admin Panel — automations — readiness heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.reload
EXACT ENGLISH: Reload
CONTEXT: Admin Panel — automations — reload
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.automations.roleReadOnly
EXACT ENGLISH: Your staff role can review automations; changing them needs settings permission.
CONTEXT: Admin Panel — automations — role read only
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.savingUpper
EXACT ENGLISH: SAVING…
CONTEXT: Admin Panel — automations — saving upper
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.automations.schedulerRunsEmpty
EXACT ENGLISH: The scheduler has not run yet.
CONTEXT: Admin Panel — automations — scheduler runs empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.schedulerRunsHeading
EXACT ENGLISH: Scheduler runs
CONTEXT: Admin Panel — automations — scheduler runs heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.schedulingNote
EXACT ENGLISH: Scheduling: vercel.json calls /api/automation-worker daily at 04:20 UTC, which queues follow-ups and then drains the email queue in the same run. Vercel does not report a next-run timestamp to the application, so the next execution is the schedule rather than a measured time. A Pro plan can tighten that cron to every few minutes; a Hobby plan is limited to one run per day.
CONTEXT: Admin Panel — automations — scheduling note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.segmentsHeading
EXACT ENGLISH: Customer segments
CONTEXT: Admin Panel — automations — segments heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.segmentsIntro
EXACT ENGLISH: Counts derived from real orders, bags and consent records. No individual customer is listed or exported, and a segment cannot be targeted from this screen — bulk campaigns still require explicit approval.
CONTEXT: Admin Panel — automations — segments intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.sentMeansNote
EXACT ENGLISH: “sent” means the mail transport accepted the message for a recipient. It does not prove delivery to an inbox. Failed rows are retried with a backoff and stop after the attempt ceiling, where they stay visible.
CONTEXT: Admin Panel — automations — sent means note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.statAvailable
EXACT ENGLISH: {count} available
CONTEXT: Admin Panel — automations — stat available
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.automations.statFollowUpsSent
EXACT ENGLISH: Follow-ups sent
CONTEXT: Admin Panel — automations — stat follow ups sent
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.statFollowUpsSentSub
EXACT ENGLISH: Handed to the email queue
CONTEXT: Admin Panel — automations — stat follow ups sent sub
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.statSkippedOrFailed
EXACT ENGLISH: Skipped or failed
CONTEXT: Admin Panel — automations — stat skipped or failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.statSkippedOrFailedSub
EXACT ENGLISH: Consent, recovered bags, errors
CONTEXT: Admin Panel — automations — stat skipped or failed sub
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.statTasksWaiting
EXACT ENGLISH: Tasks waiting
CONTEXT: Admin Panel — automations — stat tasks waiting
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.statTasksWaitingSub
EXACT ENGLISH: Queued, not yet due
CONTEXT: Admin Panel — automations — stat tasks waiting sub
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.statWorkflowsEnabled
EXACT ENGLISH: Workflows enabled
CONTEXT: Admin Panel — automations — stat workflows enabled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.taskQueueEmpty
EXACT ENGLISH: No follow-up tasks recorded.
CONTEXT: Admin Panel — automations — task queue empty
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.taskQueueHeading
EXACT ENGLISH: Follow-up task queue
CONTEXT: Admin Panel — automations — task queue heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.taskSearchPlaceholder
EXACT ENGLISH: Search workflow or order number…
CONTEXT: Admin Panel — automations — task search placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.title
EXACT ENGLISH: Follow-up Automations
CONTEXT: Admin Panel — automations — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.toastChangeFailed
EXACT ENGLISH: The change could not be recorded.
CONTEXT: Admin Panel — automations — toast change failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.toastDisabled
EXACT ENGLISH: Disabled. Tasks already queued stay in the queue and are skipped when they come due.
CONTEXT: Admin Panel — automations — toast disabled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Toast message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.toastEnabled
EXACT ENGLISH: Enabled. It will be picked up the next time the server scheduler runs.
CONTEXT: Admin Panel — automations — toast enabled
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Toast message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.toastTimingFailed
EXACT ENGLISH: The waiting period could not be saved.
CONTEXT: Admin Panel — automations — toast timing failed
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.toastTimingSaved
EXACT ENGLISH: Waiting period saved. Bags newer than that period are left alone.
CONTEXT: Admin Panel — automations — toast timing saved
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Toast message
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.updating
EXACT ENGLISH: UPDATING…
CONTEXT: Admin Panel — automations — updating
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.automations.waitingPeriodLabel
EXACT ENGLISH: Waiting period (minutes)
CONTEXT: Admin Panel — automations — waiting period label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/AutomationsPage.tsx
NOTES: —
```

```
KEY: admin.marketing.bannerTextureStyle
EXACT ENGLISH: Banner Texture Style
CONTEXT: Admin Panel — marketing — banner texture style
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.campaignStatus
EXACT ENGLISH: Campaign Status
CONTEXT: Admin Panel — marketing — campaign status
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.campaignTitlePlaceholder
EXACT ENGLISH: e.g. Autumn Private Atelier Sale
CONTEXT: Admin Panel — marketing — campaign title placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.marketing.campaignTitleRequired
EXACT ENGLISH: Campaign Title *
CONTEXT: Admin Panel — marketing — campaign title required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.couponsOnlyNote
EXACT ENGLISH: Coupons are the only thing that changes a price. A campaign recorded here is an internal plan: it does not discount a product until a matching coupon is created in Coupons, and checkout totals are always recalculated server-side.
CONTEXT: Admin Panel — marketing — coupons only note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.delete
EXACT ENGLISH: Delete
CONTEXT: Admin Panel — marketing — delete
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.marketing.deleteCampaign
EXACT ENGLISH: Delete Campaign
CONTEXT: Admin Panel — marketing — delete campaign
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.deleteCampaignConfirm
EXACT ENGLISH: Are you sure you want to delete this campaign?
CONTEXT: Admin Panel — marketing — delete campaign confirm
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.deleteCampaignTitle
EXACT ENGLISH: Delete Marketing Campaign
CONTEXT: Admin Panel — marketing — delete campaign title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.discountPercentage
EXACT ENGLISH: Discount Percentage (%)
CONTEXT: Admin Panel — marketing — discount percentage
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.ebonyWood
EXACT ENGLISH: Ebony Wood
CONTEXT: Admin Panel — marketing — ebony wood
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.edit
EXACT ENGLISH: Edit
CONTEXT: Admin Panel — marketing — edit
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.marketing.editTitle
EXACT ENGLISH: Edit Marketing Campaign
CONTEXT: Admin Panel — marketing — edit title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.endDate
EXACT ENGLISH: End Date
CONTEXT: Admin Panel — marketing — end date
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.eyebrow
EXACT ENGLISH: CAMPAIGNS & PROMOTIONAL BANNERS
CONTEXT: Admin Panel — marketing — eyebrow
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Subheading / eyebrow
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.intro
EXACT ENGLISH: Launch seasonal sales, flash campaigns, and homepage promotional spotlight banners.
CONTEXT: Admin Panel — marketing — intro
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.launchCampaign
EXACT ENGLISH: Launch Campaign
CONTEXT: Admin Panel — marketing — launch campaign
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.launchNewTitle
EXACT ENGLISH: Launch New Campaign
CONTEXT: Admin Panel — marketing — launch new title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.outsideWindowNote
EXACT ENGLISH: Recorded as sending but outside its date window — not presented as an offer.
CONTEXT: Admin Panel — marketing — outside window note
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.saveCampaign
EXACT ENGLISH: Save Campaign
CONTEXT: Admin Panel — marketing — save campaign
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.startDate
EXACT ENGLISH: Start Date
CONTEXT: Admin Panel — marketing — start date
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.statusCompletedOption
EXACT ENGLISH: Completed
CONTEXT: Admin Panel — marketing — status completed option
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.statusDraftOption
EXACT ENGLISH: Draft — not presented anywhere
CONTEXT: Admin Panel — marketing — status draft option
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.statusScheduledOption
EXACT ENGLISH: Scheduled — starts on its start date
CONTEXT: Admin Panel — marketing — status scheduled option
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.statusSendingOption
EXACT ENGLISH: Sending — live inside its date window
CONTEXT: Admin Panel — marketing — status sending option
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Status label
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.marketing.title
EXACT ENGLISH: Marketing & Private Atelier Campaigns
CONTEXT: Admin Panel — marketing — title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/MarketingPage.tsx
NOTES: —
```

```
KEY: admin.productForm.activeInBoutique
EXACT ENGLISH: Active in Boutique
CONTEXT: Admin Panel — product form — active in boutique
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.activeSrLabel
EXACT ENGLISH: Active for {size}
CONTEXT: Admin Panel — product form — active sr label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.addCustomSize
EXACT ENGLISH: Add Custom Size
CONTEXT: Admin Panel — product form — add custom size
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.addPresetSize
EXACT ENGLISH: Add preset size:
CONTEXT: Admin Panel — product form — add preset size
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.addRow
EXACT ENGLISH: Add row
CONTEXT: Admin Panel — product form — add row
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.addSignatureExtrait
EXACT ENGLISH: Add Signature Extrait
CONTEXT: Admin Panel — product form — add signature extrait
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.assignPhotoAria
EXACT ENGLISH: Assign photo {number} for {size}
CONTEXT: Admin Panel — product form — assign photo aria
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {number}, {size}
```

```
KEY: admin.productForm.assignPhotos
EXACT ENGLISH: Assign
CONTEXT: Admin Panel — product form — assign photos
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.productForm.atelierStoryLabel
EXACT ENGLISH: Full Atelier Story & Formulation
CONTEXT: Admin Panel — product form — atelier story label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.atelierStoryPlaceholder
EXACT ENGLISH: Handcrafted in small batches using rare botanical extracts…
CONTEXT: Admin Panel — product form — atelier story placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.autoBadge
EXACT ENGLISH: AUTO
CONTEXT: Admin Panel — product form — auto badge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.productForm.autoPriceSrLabel
EXACT ENGLISH: Automatic price for {size}
CONTEXT: Admin Panel — product form — auto price sr label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.autoPriceTitle
EXACT ENGLISH: Calculated automatically from the 50ml base price
CONTEXT: Admin Panel — product form — auto price title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.baseFlaconSizeLabel
EXACT ENGLISH: Base Flacon Size
CONTEXT: Admin Panel — product form — base flacon size label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.baseNotesLabel
EXACT ENGLISH: Base Notes (Dry Down Longevity)
CONTEXT: Admin Panel — product form — base notes label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.basePriceBadge
EXACT ENGLISH: 50ML BASE PRICE
CONTEXT: Admin Panel — product form — base price badge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.basePriceHeading
EXACT ENGLISH: Base 50ml Reference Price
CONTEXT: Admin Panel — product form — base price heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.basePriceRequiredError
EXACT ENGLISH: The 50ml base price is required and must be greater than 0.
CONTEXT: Admin Panel — product form — base price required error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.basePriceRequiredLabel
EXACT ENGLISH: 50ml Base Price (PKR) *
CONTEXT: Admin Panel — product form — base price required label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.basePriceSrLabel
EXACT ENGLISH: 50ml base price
CONTEXT: Admin Panel — product form — base price sr label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.baseSkuRequired
EXACT ENGLISH: Base SKU Code *
CONTEXT: Admin Panel — product form — base sku required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.bestsellerBadge
EXACT ENGLISH: Bestseller Badge
CONTEXT: Admin Panel — product form — bestseller badge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.bottleSizeForRow
EXACT ENGLISH: Bottle size for row {row}
CONTEXT: Admin Panel — product form — bottle size for row
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {row}
```

```
KEY: admin.productForm.collectionLabel
EXACT ENGLISH: Collection Assignment
CONTEXT: Admin Panel — product form — collection label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.concentrationLabel
EXACT ENGLISH: Concentration Tier
CONTEXT: Admin Panel — product form — concentration label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.createNewFragrance
EXACT ENGLISH: CREATE NEW FRAGRANCE
CONTEXT: Admin Panel — product form — create new fragrance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.customSizeDuplicateError
EXACT ENGLISH: A {size} row already exists.
CONTEXT: Admin Panel — product form — custom size duplicate error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.duplicateSizeRow
EXACT ENGLISH: A {size} row already exists. Each bottle size can appear only once.
CONTEXT: Admin Panel — product form — duplicate size row
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.duplicateSizeSubmitError
EXACT ENGLISH: The {size} size appears more than once. Each bottle size can appear only once.
CONTEXT: Admin Panel — product form — duplicate size submit error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.editFragranceRecord
EXACT ENGLISH: EDIT FRAGRANCE RECORD
CONTEXT: Admin Panel — product form — edit fragrance record
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.editProductCrumb
EXACT ENGLISH: Edit Product
CONTEXT: Admin Panel — product form — edit product crumb
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.editingFragranceTitle
EXACT ENGLISH: Editing "{name}"
CONTEXT: Admin Panel — product form — editing fragrance title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {name}
```

```
KEY: admin.productForm.emptySizeValue
EXACT ENGLISH: Empty
CONTEXT: Admin Panel — product form — empty size value
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.productForm.familyCategoryLabel
EXACT ENGLISH: Fragrance Family / Category
CONTEXT: Admin Panel — product form — family category label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.featuredFragrance
EXACT ENGLISH: Featured Fragrance
CONTEXT: Admin Panel — product form — featured fragrance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.fragranceFamilyHelp
EXACT ENGLISH: Choose a listed family or type your own.
CONTEXT: Admin Panel — product form — fragrance family help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.fragranceFamilyLabel
EXACT ENGLISH: Fragrance family
CONTEXT: Admin Panel — product form — fragrance family label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.genderLabel
EXACT ENGLISH: Gender Classification
CONTEXT: Admin Panel — product form — gender label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.heartNotesLabel
EXACT ENGLISH: Heart / Middle Notes (Core Heart)
CONTEXT: Admin Panel — product form — heart notes label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.identityHeading
EXACT ENGLISH: Fragrance Identity & Nomenclature
CONTEXT: Admin Panel — product form — identity heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.intensityLabel
EXACT ENGLISH: Intensity
CONTEXT: Admin Panel — product form — intensity label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.invalidBottleSizeError
EXACT ENGLISH: “{size}” is not a valid bottle size. {hint}
CONTEXT: Admin Panel — product form — invalid bottle size error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}, {hint}
```

```
KEY: admin.productForm.invalidVariantPriceError
EXACT ENGLISH: Invalid price for {size}. Prices must be numbers greater than 0, and a sale price must be below the price.
CONTEXT: Admin Panel — product form — invalid variant price error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.lowLimitHelp
EXACT ENGLISH: Default for new size rows. Adjust each size in the table.
CONTEXT: Admin Panel — product form — low limit help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.lowStockAlertColumn
EXACT ENGLISH: Low-stock alert
CONTEXT: Admin Panel — product form — low stock alert column
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.lowStockSrLabel
EXACT ENGLISH: Low-stock alert threshold for {size}
CONTEXT: Admin Panel — product form — low stock sr label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.manualBadge
EXACT ENGLISH: MANUAL
CONTEXT: Admin Panel — product form — manual badge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.productForm.manualPriceSrLabel
EXACT ENGLISH: Manual price for {size}
CONTEXT: Admin Panel — product form — manual price sr label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.newArrivalBadge
EXACT ENGLISH: New Arrival Badge
CONTEXT: Admin Panel — product form — new arrival badge
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.newFragrance
EXACT ENGLISH: New Fragrance
CONTEXT: Admin Panel — product form — new fragrance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.newSizeHelp
EXACT ENGLISH: Enter a whole millilitre value, for example 75ml.
CONTEXT: Admin Panel — product form — new size help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.newSizeLabel
EXACT ENGLISH: New size
CONTEXT: Admin Panel — product form — new size label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.notSet
EXACT ENGLISH: Not set
CONTEXT: Admin Panel — product form — not set
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.notesHeading
EXACT ENGLISH: Olfactory Pyramid (Fragrance Notes)
CONTEXT: Admin Panel — product form — notes heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.notesHelp
EXACT ENGLISH: Comma-separated list of key essence notes.
CONTEXT: Admin Panel — product form — notes help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.occasionsLegend
EXACT ENGLISH: Occasions
CONTEXT: Admin Panel — product form — occasions legend
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.optionalPlaceholder
EXACT ENGLISH: Optional
CONTEXT: Admin Panel — product form — optional placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.overridePriceAria
EXACT ENGLISH: Override the {size} price manually
CONTEXT: Admin Panel — product form — override price aria
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.overridePriceTitle
EXACT ENGLISH: Override this size's price manually
CONTEXT: Admin Panel — product form — override price title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.photosAssigned
EXACT ENGLISH: {count} assigned
CONTEXT: Admin Panel — product form — photos assigned
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {count}
```

```
KEY: admin.productForm.photosColumn
EXACT ENGLISH: Photos
CONTEXT: Admin Panel — product form — photos column
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.productForm.photosShownFor
EXACT ENGLISH: Photos shown for {size}
CONTEXT: Admin Panel — product form — photos shown for
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.presetAdd
EXACT ENGLISH: + {size}
CONTEXT: Admin Panel — product form — preset add
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.presetAdded
EXACT ENGLISH: Added {size}
CONTEXT: Admin Panel — product form — preset added
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.pricePkrColumn
EXACT ENGLISH: Price (PKR)
CONTEXT: Admin Panel — product form — price pkr column
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.productNamePlaceholder
EXACT ENGLISH: e.g. Royal Amber Oud
CONTEXT: Admin Panel — product form — product name placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: sample/example content — decide per language whether to localise the example · [REVIEW POSSIBLE]
```

```
KEY: admin.productForm.productNameRequired
EXACT ENGLISH: Product Name *
CONTEXT: Admin Panel — product form — product name required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.profileHeading
EXACT ENGLISH: Fragrance Profile
CONTEXT: Admin Panel — product form — profile heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.profileHelp
EXACT ENGLISH: The details shoppers scan before they buy: a one-line summary, family, character and when to wear it.
CONTEXT: Admin Panel — product form — profile help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.promoPricePlaceholder
EXACT ENGLISH: Optional promo price
CONTEXT: Admin Panel — product form — promo price placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.publishFragrance
EXACT ENGLISH: Publish Fragrance
CONTEXT: Admin Panel — product form — publish fragrance
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.removePhotoAria
EXACT ENGLISH: Remove photo {number} for {size}
CONTEXT: Admin Panel — product form — remove photo aria
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {number}, {size}
```

```
KEY: admin.productForm.removeVariantAria
EXACT ENGLISH: Remove the {size} variant
CONTEXT: Admin Panel — product form — remove variant aria
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.resetAutoAria
EXACT ENGLISH: Reset the {size} price to automatic
CONTEXT: Admin Panel — product form — reset auto aria
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.resetAutoTitle
EXACT ENGLISH: Reset to automatic pricing
CONTEXT: Admin Panel — product form — reset auto title
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.salePriceColumn
EXACT ENGLISH: Sale Price
CONTEXT: Admin Panel — product form — sale price column
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.salePriceSrLabel
EXACT ENGLISH: Sale price for {size}
CONTEXT: Admin Panel — product form — sale price sr label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.saveChanges
EXACT ENGLISH: Save Changes
CONTEXT: Admin Panel — product form — save changes
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.scentProfileHelp
EXACT ENGLISH: A short description of how the fragrance reads on skin.
CONTEXT: Admin Panel — product form — scent profile help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.scentProfileLabel
EXACT ENGLISH: Scent profile
CONTEXT: Admin Panel — product form — scent profile label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.scentProfilePlaceholder
EXACT ENGLISH: Smoky, resinous, softly sweet
CONTEXT: Admin Panel — product form — scent profile placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.seasonsLegend
EXACT ENGLISH: Seasons
CONTEXT: Admin Panel — product form — seasons legend
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Small UI label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.productForm.seoDescriptionLabel
EXACT ENGLISH: SEO Meta Description
CONTEXT: Admin Panel — product form — seo description label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.seoDescriptionPlaceholder
EXACT ENGLISH: Discover Royal Amber Oud extrait de parfum…
CONTEXT: Admin Panel — product form — seo description placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.seoHeading
EXACT ENGLISH: SEO Engine Optimization & Snippet Preview
CONTEXT: Admin Panel — product form — seo heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.seoTitleLabel
EXACT ENGLISH: SEO Meta Title
CONTEXT: Admin Panel — product form — seo title label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: SEO metadata
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.shortDescriptionHelp
EXACT ENGLISH: One line used on cards and search results. Up to {max} characters.
CONTEXT: Admin Panel — product form — short description help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {max}
```

```
KEY: admin.productForm.shortDescriptionLabel
EXACT ENGLISH: Short description
CONTEXT: Admin Panel — product form — short description label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.shortDescriptionPlaceholder
EXACT ENGLISH: A magnetic oud wrapped in amber and rose.
CONTEXT: Admin Panel — product form — short description placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.shortTeaserLabel
EXACT ENGLISH: Short Teaser Description
CONTEXT: Admin Panel — product form — short teaser label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.shortTeaserPlaceholder
EXACT ENGLISH: A rich, magnetic blend of oud and amber…
CONTEXT: Admin Panel — product form — short teaser placeholder
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Placeholder
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.sizeInputError
EXACT ENGLISH: Use a whole millilitre value such as 75ml.
CONTEXT: Admin Panel — product form — size input error
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.sizeRejectedOnAdd
EXACT ENGLISH: "{size}" is not a valid size. {hint}
CONTEXT: Admin Panel — product form — size rejected on add
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}, {hint}
```

```
KEY: admin.productForm.sizeUsedByAnotherRow
EXACT ENGLISH: This size is used by another row.
CONTEXT: Admin Panel — product form — size used by another row
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Body copy
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.specialSalePriceLabel
EXACT ENGLISH: Special Sale Price (PKR)
CONTEXT: Admin Panel — product form — special sale price label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.specsHeading
EXACT ENGLISH: Flacon Specifications
CONTEXT: Admin Panel — product form — specs heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.stockColumn
EXACT ENGLISH: Stock
CONTEXT: Admin Panel — product form — stock column
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: very short string — translate by UI context, not by dictionary habit
```

```
KEY: admin.productForm.stockSrLabel
EXACT ENGLISH: Stock for {size}
CONTEXT: Admin Panel — product form — stock sr label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.stockUnitsRequired
EXACT ENGLISH: Stock Units *
CONTEXT: Admin Panel — product form — stock units required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.topNotesLabel
EXACT ENGLISH: Top Notes (Initial Opening)
CONTEXT: Admin Panel — product form — top notes label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Label / column header
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.uploadPhotosFirst
EXACT ENGLISH: Upload photos above before assigning images to a size.
CONTEXT: Admin Panel — product form — upload photos first
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Image alt text
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.urlSlugRequired
EXACT ENGLISH: URL Slug *
CONTEXT: Admin Panel — product form — url slug required
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Error / validation message
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.variantSkuColumn
EXACT ENGLISH: Variant SKU
CONTEXT: Admin Panel — product form — variant sku column
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.variantSkuSrLabel
EXACT ENGLISH: Variant SKU for {size}
CONTEXT: Admin Panel — product form — variant sku sr label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: interpolation: {size}
```

```
KEY: admin.productForm.variantsHeading
EXACT ENGLISH: Bottle Sizes & ML Variants
CONTEXT: Admin Panel — product form — variants heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.variantsHelp
EXACT ENGLISH: Manage variant prices, sale prices, SKUs, stock, low-stock alerts and active availability for each size. Non-50ml sizes price automatically from the 50ml base (proportional per ml) unless manually overridden.
CONTEXT: Admin Panel — product form — variants help
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.variantsRegionLabel
EXACT ENGLISH: Bottle size variants
CONTEXT: Admin Panel — product form — variants region label
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Accessibility label
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.visibilityHeading
EXACT ENGLISH: Visibility & Badges
CONTEXT: Admin Panel — product form — visibility heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

```
KEY: admin.productForm.visualsHeading
EXACT ENGLISH: Product Visuals & Presentation Cards
CONTEXT: Admin Panel — product form — visuals heading
SOURCE: translation file (src/i18n/dictionaries/en.ts)
TYPE: Heading
USED WHERE: src/admin/pages/ProductFormPage.tsx
NOTES: —
```

## Database Content

_These values live in database rows (seeded from `src/data/products.ts`) and are the English_
_master copy for the product/category/collection content that the `content_translations`_
_mechanism overrides per language. IDs, SKUs and slugs are technical and must NOT be translated._

```
PRODUCT ID: 1
SKU: —   (technical — do not translate)
SLUG: mystic-oud   (technical — do not translate)
EXACT ENGLISH (name): Mystic Oud
short description: A rich, magnetic blend of oud and amber — for those who leave a lasting impression from the moment they enter a room.
full description: —
fragrance family: —
category: Woody Oriental
concentration: Extrait de Parfum
top notes: Saffron, Bergamot, Pink Pepper
heart notes: Bulgarian Rose, Oud Wood, Cedar
base notes: Amber, Vanilla, Leather
ingredients: Alcohol Denat., Parfum (Fragrance), Aqua, Oud Extract, Amber Resinoid, Vanillin.
longevity: —
sillage: —
occasion: —
season: —
gender: unisex
intensity: —
sizes: —
variants: 10ml → stock 33, 30ml → stock 37, 50ml → stock 42, 100ml → stock 46
image alt: —
SEO title: —
SEO description: —
story / atelier copy: —
badge/labels: —
```

```
PRODUCT ID: 2
SKU: —   (technical — do not translate)
SLUG: un-kimmy   (technical — do not translate)
EXACT ENGLISH (name): Un Kimmy
short description: A refined composition of fresh woods and musk — quietly confident, effortlessly modern, built for the everyday signature.
full description: —
fragrance family: —
category: Fresh Woods
concentration: Extrait de Parfum
top notes: Bergamot, Cardamom, Grapefruit
heart notes: Vetiver, Iris, Sage
base notes: Musk, Cedarwood, Ambroxan
ingredients: Alcohol Denat., Parfum (Fragrance), Aqua, Vetiver Oil, Musk Blend, Ambroxan.
longevity: —
sillage: —
occasion: —
season: —
gender: men
intensity: —
sizes: —
variants: 10ml → stock 52, 30ml → stock 58, 50ml → stock 65, 100ml → stock 71
image alt: —
SEO title: —
SEO description: —
story / atelier copy: —
badge/labels: —
```

```
PRODUCT ID: 3
SKU: —   (technical — do not translate)
SLUG: harm-land   (technical — do not translate)
EXACT ENGLISH (name): Harm Land
short description: A luminous bouquet of florals and golden notes — warm, romantic and unforgettable, like candlelight on skin.
full description: —
fragrance family: —
category: Floral Amber
concentration: Extrait de Parfum
top notes: Mandarin, Pear, Pink Peppercorn
heart notes: Jasmine, Tuberose, Orange Blossom
base notes: Amber, Sandalwood, White Musk
ingredients: Alcohol Denat., Parfum (Fragrance), Aqua, Jasmine Absolute, Amber Resinoid, Sandalwood Oil.
longevity: —
sillage: —
occasion: —
season: —
gender: women
intensity: —
sizes: —
variants: 10ml → stock 30, 30ml → stock 34, 50ml → stock 38, 100ml → stock 41
image alt: —
SEO title: —
SEO description: —
story / atelier copy: —
badge/labels: —
```

```
PRODUCT ID: 4
SKU: —   (technical — do not translate)
SLUG: aura-nocturne   (technical — do not translate)
EXACT ENGLISH (name): Aura Nocturne
short description: Dark spice wrapped in soft cashmere musk — a scent for the confident hours after sunset.
full description: —
fragrance family: —
category: Spicy Woody
concentration: Extrait de Parfum
top notes: Black Pepper, Nutmeg, Cardamom
heart notes: Cashmere Wood, Tobacco Leaf, Iris
base notes: Suede, Amber, Tonka Bean
ingredients: Alcohol Denat., Parfum (Fragrance), Aqua, Tobacco Absolute, Tonka Bean, Amber Resinoid.
longevity: —
sillage: —
occasion: —
season: —
gender: men
intensity: —
sizes: —
variants: 10ml → stock 40, 30ml → stock 45, 50ml → stock 51, 100ml → stock 56
image alt: —
SEO title: —
SEO description: —
story / atelier copy: —
badge/labels: —
```

```
PRODUCT ID: 5
SKU: —   (technical — do not translate)
SLUG: rose-ember   (technical — do not translate)
EXACT ENGLISH (name): Rose Ember
short description: Rose petals warmed by smoky embers — soft, sensual, and quietly powerful.
full description: —
fragrance family: —
category: Floral Musk
concentration: Extrait de Parfum
top notes: Raspberry, Pink Pepper, Bergamot
heart notes: Turkish Rose, Peony, Violet
base notes: Smoked Woods, Musk, Vanilla
ingredients: Alcohol Denat., Parfum (Fragrance), Aqua, Rose Absolute, Peony Extract, Musk Blend.
longevity: —
sillage: —
occasion: —
season: —
gender: women
intensity: —
sizes: —
variants: 10ml → stock 37, 30ml → stock 42, 50ml → stock 47, 100ml → stock 51
image alt: —
SEO title: —
SEO description: —
story / atelier copy: —
badge/labels: —
```

```
PRODUCT ID: 6
SKU: —   (technical — do not translate)
SLUG: golden-hour   (technical — do not translate)
EXACT ENGLISH (name): Golden Hour
short description: Warm amber and vanilla caught in the last light of day — HM Signature's most versatile creation.
full description: —
fragrance family: —
category: Amber Vanilla
concentration: Extrait de Parfum
top notes: Bergamot, Mandarin, Saffron
heart notes: Amber, Cinnamon, Praline
base notes: Vanilla, Tonka Bean, Sandalwood
ingredients: Alcohol Denat., Parfum (Fragrance), Aqua, Vanilla Absolute, Amber Resinoid, Tonka Bean.
longevity: —
sillage: —
occasion: —
season: —
gender: unisex
intensity: —
sizes: —
variants: 10ml → stock 47, 30ml → stock 53, 50ml → stock 59, 100ml → stock 64
image alt: —
SEO title: —
SEO description: —
story / atelier copy: —
badge/labels: —
```

## CMS

_Default homepage records held in `DEFAULT_HOMEPAGE_CONFIG` (AdminDataContext). The same fields_
_are editable by staff in Homepage CMS, and are translated either through `content_translations`_
_or, for unedited values, through the dictionary keys listed above._

```
KEY: cms.homepage.hero.heading
EXACT ENGLISH: THE SIGNATURE OF|WHO
CONTEXT: stored homepage content — homepage.hero.heading
SOURCE: CMS (homepage config, database row)
TYPE: Heading
USED WHERE: storefront homepage sections
NOTES: contains "|" = deliberate line break · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.hero.headingAccent
EXACT ENGLISH: YOU ARE
CONTEXT: stored homepage content — homepage.hero.headingAccent
SOURCE: CMS (homepage config, database row)
TYPE: Heading
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.hero.subheading
EXACT ENGLISH: HAUTE PARFUMERIE
CONTEXT: stored homepage content — homepage.hero.subheading
SOURCE: CMS (homepage config, database row)
TYPE: Heading
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.hero.description
EXACT ENGLISH: DISCOVER YOUR|SIGNATURE SCENT.
CONTEXT: stored homepage content — homepage.hero.description
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: contains "|" = deliberate line break · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.hero.image
EXACT ENGLISH: /products/mystic-oud-1.jpg
CONTEXT: stored homepage content — homepage.hero.image
SOURCE: CMS (homepage config, database row)
TYPE: Image alt text
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.hero.imageAlt
EXACT ENGLISH: HM Signature — Mystic Oud
CONTEXT: stored homepage content — homepage.hero.imageAlt
SOURCE: CMS (homepage config, database row)
TYPE: Image alt text
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.hero.ctaText
EXACT ENGLISH: SHOP NOW →
CONTEXT: stored homepage content — homepage.hero.ctaText
SOURCE: CMS (homepage config, database row)
TYPE: Button / CTA
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.hero.ctaLink
EXACT ENGLISH: /collections
CONTEXT: stored homepage content — homepage.hero.ctaLink
SOURCE: CMS (homepage config, database row)
TYPE: Button / CTA
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.announcementBar.link
EXACT ENGLISH: /collections
CONTEXT: stored homepage content — homepage.announcementBar.link
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[0].id
EXACT ENGLISH: hero
CONTEXT: stored homepage content — homepage.sections[0].id
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[0].name
EXACT ENGLISH: Hero Banner
CONTEXT: stored homepage content — homepage.sections[0].name
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[1].id
EXACT ENGLISH: collections
CONTEXT: stored homepage content — homepage.sections[1].id
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[1].name
EXACT ENGLISH: Scented Stories Collection Grid
CONTEXT: stored homepage content — homepage.sections[1].name
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[2].id
EXACT ENGLISH: values
CONTEXT: stored homepage content — homepage.sections[2].id
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[2].name
EXACT ENGLISH: House Values Panel
CONTEXT: stored homepage content — homepage.sections[2].name
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[3].id
EXACT ENGLISH: story
CONTEXT: stored homepage content — homepage.sections[3].id
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[3].name
EXACT ENGLISH: Brand Heritage Story
CONTEXT: stored homepage content — homepage.sections[3].name
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[4].id
EXACT ENGLISH: spotlight
CONTEXT: stored homepage content — homepage.sections[4].id
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[4].name
EXACT ENGLISH: Featured Fragrance Spotlight
CONTEXT: stored homepage content — homepage.sections[4].name
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[5].id
EXACT ENGLISH: journal
CONTEXT: stored homepage content — homepage.sections[5].id
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[5].name
EXACT ENGLISH: Journal & Notes Editor
CONTEXT: stored homepage content — homepage.sections[5].name
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[6].id
EXACT ENGLISH: reviews
CONTEXT: stored homepage content — homepage.sections[6].id
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[6].name
EXACT ENGLISH: Client Reviews
CONTEXT: stored homepage content — homepage.sections[6].name
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[7].id
EXACT ENGLISH: newsletter
CONTEXT: stored homepage content — homepage.sections[7].id
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

```
KEY: cms.homepage.sections[7].name
EXACT ENGLISH: Private Atelier Newsletter
CONTEXT: stored homepage content — homepage.sections[7].name
SOURCE: CMS (homepage config, database row)
TYPE: Body copy
USED WHERE: storefront homepage sections
NOTES: — · edited values are shown exactly as typed by staff
```

## Hardcoded Strings

_User-facing English found OUTSIDE the i18n system (JSX text, wrapped JSX text, and visible_
_attributes). Each must be classified by a human before it is moved into the dictionaries._

_38 raw candidates found (many are brand names, sample values or technical identifiers — classified below)_

| Scope | Where | Kind | Exact English |
| --- | --- | --- | --- |
| admin | `src/admin/components/AdminLayout.tsx:71` | wrapped JSX text | HM SIGNATURE SECURITY |
| admin | `src/admin/components/AdminSidebar.tsx:172` | alt attribute | HM Signature |
| admin | `src/admin/components/AdminSidebar.tsx:177` | wrapped JSX text | HM SIGNATURE |
| admin | `src/admin/pages/AdminLogin.tsx:70` | alt attribute | HM Signature |
| admin | `src/admin/pages/CouponsPage.tsx:211` | placeholder attribute | LUXURY10 |
| admin | `src/admin/pages/CustomerDetailPage.tsx:4` | wrapped JSX text | Activity as ActivityIcon, |
| admin | `src/admin/pages/HomepageCmsPage.tsx:149` | placeholder attribute | COMPLIMENTARY SHIPPING ON ORDERS ABOVE PKR 5,000 |
| admin | `src/admin/pages/HomepageCmsPage.tsx:185` | placeholder attribute | HAUTE PARFUMERIE |
| admin | `src/admin/pages/HomepageCmsPage.tsx:198` | placeholder attribute | THE SIGNATURE OF\|WHO |
| admin | `src/admin/pages/HomepageCmsPage.tsx:217` | placeholder attribute | YOU ARE |
| admin | `src/admin/pages/HomepageCmsPage.tsx:231` | placeholder attribute | DISCOVER YOUR\|SIGNATURE SCENT. |
| admin | `src/admin/pages/HomepageCmsPage.tsx:266` | placeholder attribute | DISCOVER THE COLLECTION |
| admin | `src/admin/pages/OrderDetailPage.tsx:312` | placeholder attribute | Leopards / TCS / DHL |
| admin | `src/admin/pages/ProductFormPage.tsx:564` | placeholder attribute | HM-ROU-100 |
| admin | `src/admin/pages/ProductFormPage.tsx:666` | placeholder attribute | Woody Oriental |
| admin | `src/admin/pages/ProductFormPage.tsx:1205` | placeholder attribute | Bergamot, Saffron, Pink Pepper |
| admin | `src/admin/pages/ProductFormPage.tsx:1219` | placeholder attribute | Bulgarian Rose, Oud Wood, Cedar |
| admin | `src/admin/pages/ProductFormPage.tsx:1233` | placeholder attribute | Amber, Vanilla, Leather, White Musk |
| admin | `src/admin/pages/ProductFormPage.tsx:1277` | placeholder attribute | Royal Amber Oud — HM Signature Extrait |
| admin | `src/admin/pages/ProductFormPage.tsx:1422` | placeholder attribute | Extrait de Parfum (25-30% Oil) |
| admin | `src/admin/pages/SettingsPage.tsx:618` | placeholder attribute | PK36 MEZN 0001 0293 8475 6101 |
| admin | `src/admin/pages/SettingsPage.tsx:631` | placeholder attribute | PK36MEZN0001029384756101 |
| admin | `src/admin/pages/SettingsPage.tsx:1302` | title attribute | Cash on Delivery · JazzCash · Raast · Bank Transfer |
| storefront | `src/components/AddressBook.tsx:256` | placeholder attribute | Punjab |
| storefront | `src/components/AddressBook.tsx:271` | placeholder attribute | Pakistan |
| storefront | `src/components/Bottle.tsx:63` | wrapped JSX text | EXTRAIT DE PARFUM |
| storefront | `src/components/BrandStory.tsx:49` | alt attribute | HM Signature |
| storefront | `src/components/ConciergeChat.tsx:195` | JSX text | HM Signature |
| storefront | `src/components/Footer.tsx:23` | alt attribute | HM Signature |
| storefront | `src/components/Footer.tsx:78` | alt attribute | Xeltrio Technologies |
| storefront | `src/components/Navbar.tsx:104` | alt attribute | HM Signature |
| storefront | `src/components/Navbar.tsx:140` | title attribute | Xeltrio Technologies — Parent Company |
| storefront | `src/components/Navbar.tsx:283` | alt attribute | HM Signature |
| storefront | `src/pages/Contact.tsx:208` | JSX text | Rahim Yar Khan, Pakistan |
| storefront | `src/pages/Login.tsx:175` | alt attribute | HM Signature |
| storefront | `src/pages/ParentCompany.tsx:27` | alt attribute | Xeltrio Technologies |
| storefront | `src/pages/ParentCompany.tsx:28` | JSX text | Xeltrio Technologies |
| storefront | `src/pages/ParentCompany.tsx:41` | alt attribute | Xeltrio Technologies |

## Localization Architecture Notes

- One entity row per product/category/collection; per-language copy lives in
  `content_translations` keyed by `(entity_type, entity_ref, language_code)` with a flat JSON
  payload of the translated fields. Nothing is duplicated per language.
- Interface copy lives in the six dictionaries; `Dict = typeof en` makes English the shape
  authority, and `tests/i18n-dictionaries.test.ts` enforces identical leaf-key sets,
  placeholder parity, direction metadata, and that no value is leftover source code.
- `translateFor()` falls back English → humanized label only as a safety net; a missing key
  is a build failure, never a UI state.
- Currency codes (PKR, AED, SAR, USD, GBP, EUR), SKUs, IDs, slugs, routes, email addresses and
  interpolation tokens must never be translated. `{token}` names are fixed across languages.
- RTL is driven by the `languages` table (`ar`, `ur`); layout uses logical CSS utilities only.
- SEO: `useSeoMeta` writes localized title/description/canonical/og:locale/og:locale:alternate
  plus hreflang alternates; `api/sitemap.js` lists the same six language codes.
