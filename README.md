# Comity — Homepage (Phase 06)

Working name **Comity** is a recommendation from Phase 04 and is **not cleared**.
Trademark and bar-name clearance in New York and Argentina must complete before
any public use. See "Blocking items" below.

## Structure

```
index.html            English homepage
es/index.html         Spanish homepage — full parity, localised slugs
assets/styles.css     Design system tokens + components (Phase 04)
assets/main.js        Navigation panels and mobile menu. No other JS.
build-preview.sh      Generates single-file previews for review
```

Open `index.html` directly in a browser. No build step, no dependencies, no
package manager. Fonts load from Google Fonts; everything else is local.

## Status of the content

**Nothing on these pages may be published as-is.**

- Every article card and featured item is a **commissioning brief from Phase 03
  §09**, not a published piece. They carry `data-state="draft"`. Each must clear
  both legal review gates before it can go live.
- Every unverified fact is marked `[VERIFY]` in oxblood and is visible on the
  page by design — so it cannot be missed and cannot ship by accident.
- No lawyer, credential, admission, client, matter, award, ranking, result or
  office is asserted anywhere. People and Experience are absent entirely, per
  Phase 01 §11.2.

## Blocking items

| Item | Blocks | Owner |
|---|---|---|
| Attorney-advertising identification floor (NY + AR) | Footer identification block, Organization schema | Admitted counsel |
| Entity structure confirmation | Capabilities disclosure, How We Work, jurisdiction pages | Founders + counsel |
| Whether a physical office may be presented | Jurisdiction sections | Admitted counsel |
| Trademark + bar-name clearance on "Comity" | Everything | Counsel |
| Consent wording for the newsletter and contact forms | Both forms | Counsel |

The footer identification block is built with final structure and placeholder
content, so resolving it is a content change rather than a redesign.

## Homepage regions

Your §09 specified thirteen. Eleven ship; two are held and one is reframed.

| § | Brief | Disposition |
|---|---|---|
| 01 | Hero | Ships |
| 02 | Argentina × New York | Ships — typographic corridor diagram, no map |
| 03 | Practices | Ships as **Capabilities**, legal and advisory visibly separated |
| 04 | Industries | Ships — five, not twelve |
| 05 | Featured insights | Ships, and **moved earlier** — see note |
| 06 | Cross-border capabilities | Ships as the three journeys |
| 07 | Featured report | Ships |
| 08 | People / expertise | **Held** — replaced by How We Work |
| 09 | Representative experience | **Held** — replaced by How We Work |
| 10 | Locations | Reframed as **Jurisdictions** (Phase 02 §01) |
| 11 | Newsletter | Ships |
| 12 | Contact | Ships |
| 13 | Footer | Ships, with identification block pending |

**On moving insights earlier:** the featured insight now sits directly after the
corridor, ahead of the capability lists. A firm with no name recognition and no
visible roster has exactly one credibility instrument — evidence of thinking —
and it should appear before the list of services rather than after it.

**On How We Work:** the homepage would otherwise have a hole where every firm
puts people and deals. Three pillars — admitted on both sides, counsel and
advisory separated, published and dated analysis — fill it with something true
and differentiating rather than with placeholders.

## Porting to Next.js + Payload (Phase 05)

This is deliberately framework-free so it can be lifted cleanly:

- `assets/styles.css` becomes the global stylesheet unchanged. Tokens are already
  CSS custom properties with all three theme states defined.
- Each `<section class="region">` maps to one React component. Boundaries are
  already clean; no section reaches into another.
- `main.js` becomes a single client component for the navigation. Everything
  else stays a server component — the page ships almost no JavaScript.
- Card and list markup is the `Article`, `Capability` and `Industry` shapes from
  the Phase 02 content graph. The `data-state` attribute maps to `reviewState`.
- `[VERIFY]` spans map to CMS fields that block publication while unresolved.

## Accessibility

Skip link, semantic landmarks, `aria-expanded` on panel triggers, Escape to
close, visible focus at 2px/3px offset, `prefers-reduced-motion` honoured,
`lang` and `hreflang` on every cross-language link. Jurisdiction is carried by
text, never by colour — an accessibility outcome of the Phase 04 brand rule.
