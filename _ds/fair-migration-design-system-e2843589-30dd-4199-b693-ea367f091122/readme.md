# Fair Migration — Design System

A brand & UI design system for **Fair Migration** (fairmigration.vote), an Australian
political-advocacy campaign pushing for migration-policy reform. The tone is serious,
professional and urgent; the visual language is restrained navy-and-white civic design,
with a colourful wordmark used for brand moments.

> **Sources**
> - Live site: https://fairmigration.vote (built on Campaign Nucleus)
> - Supplied brand brief (colours, type, voice) — see "Brand brief" below
> - Uploaded assets: `uploads/fair-migration-logo.png`, `uploads/fair-migration-favicon.png`,
>   `uploads/fair-migration-hero.png`
>
> The uploaded `Fair Migration Logo.png` is the **official full-colour wordmark** (red "FAIR",
> navy "MIGRATION", coral star) on a cream field. It was background-knocked-out and cropped to
> `assets/logo-full.png` (transparent). The earlier white-knockout favicon/logo are kept for dark
> backgrounds; a mono-navy wordmark (`assets/logo-navy.png`) is available for single-colour use.

---

## Brand at a glance

Fair Migration campaigns for "Australians first" migration reform. The product is a single
**campaign marketing site**: a hero, a persuasive argument, a petition sign-up (the core
conversion unit), and a donate ask. Everything funnels toward **Sign the petition** and
**Donate**.

- **Wordmark:** stacked "FAIR ★ MIGRATION" with a 7-point Commonwealth star. In full colour
  it reads red "FAIR", navy "MIGRATION", coral star. On light UI it is used in solid navy;
  on navy it is a white knockout.
- **UI palette:** deep navy (#0D3B66), slate (#374151), near-black text (#111827) on white,
  generous whitespace.

---

## CONTENT FUNDAMENTALS — how Fair Migration writes

**Voice:** direct, urgent, civic. Medium-energy advocacy. It speaks *for* "Australians",
"everyday Australians", "our" leaders — collective first-person plural. It addresses the
reader by implicating them in a shared cause rather than "you" marketing speak.

**Casing — the signature device:** one or two **key words are set in ALL CAPS** mid-sentence
for emphasis — never whole sentences. Real examples from the site:
- "Our Government **MUST** put Australians first."
- "…migration is done in **OUR** best interests."

**Sentence style:** short, declarative, confident. Bold (700) is used liberally on lead
statements. Claims stack as a drumbeat: problem → stakes → demand → call to action.

**Calls to action:** imperative and unambiguous — "Sign the petition", "Act now",
"Donate", "Demand the Federal Government acts now", "Add your name", "Join the fight".

**Representative copy (verbatim from the live site):**
- H1: "Australians don't have to live like this…"
- "Australia's migration system has reached a critical tipping point."
- "This has placed an unsustainable burden on our housing market, healthcare system, and
  public transport networks — leaving everyday Australians to suffer."
- Petition: "We demand an immediate overhaul of Australia's migration system. The current
  system is broken, unsustainable and putting an unfair strain on Australians."

**Do:** lead with urgency; caps a single key word; keep sentences short; name the institution
("the Federal Government", "our leaders"). **Don't:** hedge, use policy jargon, shout in full
caps, or soften the ask. **Emoji:** never. This is a serious civic brand.

---

## VISUAL FOUNDATIONS

**Colour.** A high-contrast civic palette. **Deep navy #0D3B66** carries structure (the wordmark,
dark sections, links on hover, secondary fills). **Brand red #A20100** is the **action colour** —
primary CTAs, the Donate button, and danger. Body text is **near-black #111827 on white**;
**slate #374151** is secondary. Backgrounds are white or the faintest grey wash (`--mist-50`).
The **coral star #ECBFAA** and **cream #F1EFE7** are brand-moment colours (logo lockups), not UI
chrome. Status colours stay muted (forest-green success, amber warning).

**Typography.** **Roboto** everywhere — headings and body. **Open Sans** is the secondary
family for long-form supporting copy. Headlines are heavy (700–900), near-black, with tight
leading (~1.05) and slightly negative tracking. H1/H2 run large (~58px). Body is 16px Roboto
regular at relaxed 1.65–1.7 line-height. Lead paragraphs are 19–20px and often bold.

**Spacing & layout.** 4px base unit. Generous whitespace; content sits in a ~1120px container
with a narrow ~720px measure for reading. Sections breathe with 64–80px vertical padding.
Layout is calm and grid-based — a wide argument column beside a sticky petition card is the
signature homepage composition.

**Corners & shape.** Mostly **squared**. Interactive controls (buttons, inputs) get a small
**~5px radius**; cards use 8px. No pills except small status chips.

**Borders.** Hairline 1px `--line-200` (#E5E7EB) dividers and field outlines. Inputs are
near-borderless at rest (sit on a hairline + xs shadow) and gain a navy border + focus ring
when active.

**Shadows.** Subtle and civic. The primary button uses `0 1px 2px rgba(0,0,0,0.05)`
(`--shadow-xs`); cards use a soft `--shadow-sm`/`--shadow-md`. No dramatic elevation, no glows.

**Backgrounds & imagery.** Photographic, documentary — crowds of everyday Australians, shot
or treated **desaturated / cool grey** so the colourful wordmark pops. The hero is a
full-bleed crowd photo with the wordmark overlaid. **No illustration**, no gradients as decor,
no textures or patterns.

**Motion.** Minimal and functional. Short fades and 0.15s ease colour transitions on hover;
a 1px press translate on buttons; smooth-scroll to the petition. No bounces, no infinite
decorative loops.

**Hover / press states.** Links darken toward navy on hover. Solid navy buttons go one step
darker (`--navy-800`); white "primary" buttons pick up a faint grey fill; donate red goes to
`--red-600`. Press = a 1px downward nudge.

**Transparency / blur.** Used sparingly — a translucent navy caption chip over imagery is
about the extent of it. No glassmorphism.

---

## ICONOGRAPHY

Fair Migration is an **almost icon-free brand.** The live site uses no icon font and no
decorative iconography; social links in the footer are rendered as **plain text** ("Twitter",
"Facebook", "Instagram", "YouTube"). The only recurring graphic device is the **7-point
Commonwealth star** from the wordmark (`assets/favicon-navy.png` / `favicon-white.png`) — treat
it as a brand mark, not a UI icon. **No emoji, ever.**

When a UI genuinely needs functional icons (e.g. form affordances, future app work), use
**[Lucide](https://lucide.dev)** at a 2px stroke in navy/slate — a clean, neutral, civic line
set that matches the brand's restraint. *This is a substitution: the brand ships no icon set
of its own.* Keep icons sparse and purposeful.

---

## VISUAL INDEX — what's in this folder

**Foundations / tokens** (`tokens/`, linked by root `styles.css`)
- `tokens/colors.css` — navy ramp, red/coral accents, neutral ramp, semantic aliases
- `tokens/typography.css` — families, weights, type scale, leading, tracking
- `tokens/spacing.css` — 4px spacing scale, radii, shadows, layout maxes
- `tokens/fonts.css` — Roboto + Open Sans (Google Fonts CDN — see Caveats)

**Specimen cards** (`guidelines/*.card.html`) — render in the Design System tab
- Colors: primary navy, brand accents, neutrals, semantic/status
- Type: headings, body & supporting, all-caps emphasis
- Spacing: spacing scale, radius & shadow
- Brand: logo lockups, hero lockup, voice & tone

**Components** (`components/<group>/`) — React primitives, bundled for consumers
- `buttons/Button` — primary (red CTA) / solid (navy) / donate (red) / outline / ghost · sm/md/lg
- `forms/Input` — labelled field / textarea, navy focus ring, invalid state
- `content/Card`, `content/Badge` — surfaces + status / caps pills
- `navigation/SiteHeader` — wordmark + nav + Donate
- `campaign/PetitionForm` — the core sign-up conversion card

**UI kit** (`ui_kits/website/`)
- `index.html` — interactive Fair Migration campaign homepage (hero → argument → petition →
  demand → footer), composing the components above

**Assets** (`assets/`)
- `logo-full.png` — official full-colour stacked wordmark (transparent)
- `logo-navy.png` / `logo-white.png` — mono wordmark (navy / knockout)
- `favicon-navy.png` / `favicon-white.png` — Commonwealth star
- `hero-crowd.png` — full-colour wordmark over a desaturated crowd

---

## Using this system

Consumers link the single entry point:

```html
<link rel="stylesheet" href="styles.css" />
```

…then use tokens via CSS custom properties (`var(--navy-700)`, `var(--space-6)`, …) and mount
components from the compiled bundle:

```html
<script src="_ds_bundle.js"></script>
<script type="text/babel">
  const { Button, PetitionForm } = window.FairMigrationDesignSystem_e28435;
</script>
```

---

## Caveats

- **Fonts load from the Google Fonts CDN**, not self-hosted binaries (Roboto + Open Sans).
  These are the exact brand families; if you need offline/self-hosted `.woff2` files, drop them
  in `assets/fonts/` and swap the `@import` in `tokens/fonts.css` for local `@font-face` rules.
- **Brand colours are trued to the official logo:** red #A20100, navy #0D3B66, coral #ECBFAA,
  cream #F1EFE7 (sampled from `Fair Migration Logo.png`).
- **Icons:** the brand ships none — Lucide is a documented substitution for any functional need.
