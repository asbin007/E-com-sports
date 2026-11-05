# Kit Room — Brothers Sports House design system

Single source of truth for the storefront's visual language. Every colour, font, space,
radius and duration in `frontend/src` comes from here. No magic numbers, no rogue hex.

The shop is football-first: wall racks of bright and holographic firm-ground boots, then club
replica jerseys and plain team kit sets, Kelme footballs, a wall of trophies and medals, bags
and training wear — out of Chaudhary Market in Bardibas and shipped
across Nepal on cash on delivery. The identity borrows from the things already around that
trade: shirt numbering, size runs chalked on a board, squad team sheets, and the crimson and
marigold of a Dashain shopfront.

---

## Theses

**Visual.** A kit-room storefront on green-biased paper with flag crimson and Dashain
marigold accents, condensed athletic display numerals in Teko over a Devanagari-capable Mukta
body, dense 8px-grid spacing with wide section gutters, and flat 2-4px components outlined in
2px ink rules with hard offset shadows.

**Interaction.** Fast and physical: 120ms transitions on a sharp ease-out, hover lifts an
element 2px up and left onto a hard shadow, scroll reveals are a short 160ms fade with 40ms
stagger and never move more than 12px, and the page refuses bounce, elastic, parallax,
blurred glows and anything that keeps content invisible until it scrolls into view.

---

## Colour

Tokens live in `src/index.css` as space-separated RGB channels and are consumed through the
Tailwind mappings in `tailwind.config.js`. Never write a hex value in a component.

| Token | Tailwind utility | Light | Dark | Use |
|---|---|---|---|---|
| `--color-accent` | `accent`, `text-accent`, `bg-accent` | `#C8102E` | `#FF5366` | Primary action, price emphasis, brand marks |
| `--color-accent-hover` | `accent-hover` | `#A80A24` | `#FF7886` | Hover fill only |
| `--color-marigold` | `text-marigold`, `border-marigold` | `#895404` | `#FFC247` | Offer and sale **text** (AA-safe) |
| `--color-marigold-bright` | `bg-marigold-bright` | `#E8A317` | `#FFC247` | Decorative fill only, always with `text-ink-fixed` |
| `--color-ink-fixed` | `text-ink-fixed` | `#16180F` | `#16180F` | The one text colour that does **not** invert. Use it on any bright fill, where every other text token flips and fails in one theme. |
| `--color-marigold-bg` | `bg-marigold-soft` | `#F6D99B` | `#4A3708` | Offer chip ground |
| `--color-pitch` | `text-pitch`, `border-pitch` | `#1F3D2B` | `#8FD0A6` | In stock, delivered, success |
| `--color-bg-primary` | `bg-primary` | `#EEEFEA` | `#0E1A14` | Page ground |
| `--color-bg-secondary` | `bg-secondary` | `#E4E6DF` | `#13241B` | Alternating bands |
| `--color-bg-card` | `bg-card` | `#FFFFFF` | `#13241B` | Cards, panels |
| `--color-bg-inverse` | `bg-inverse` | `#16180F` | `#EDEFE6` | Outlines, hard shadows, small inverted chips |
| `--color-band` | `.band` (class, not a utility) | `#16180F` | `#1A3024` | Full-width inverted panels: announcement bar, footer, offer strip |
| `--color-text-primary` | `text-primary` | `#16180F` | `#F2F5EE` | Body and headings |
| `--color-text-tertiary` | `text-tertiary` | `#4F5548` | `#93A399` | Secondary labels |
| `--color-text-muted` | `text-muted` | `#64685C` | `#898E80` | De-emphasised text |
| `--color-border-primary` | `border-border-primary` | `#CFD3C6` | `#2A3D32` | Hairlines |

Neutrals are biased green toward a pitch. Nothing in the palette is a pure grey, and the
accent is the flag crimson, not Tailwind's stock orange.

**Dark is the default theme.** A first-time visitor gets the floodlit pitch; the toggle is
still there and a choice is remembered in `localStorage` under `bsh-theme`. The reason is the
catalogue: every product photo is shot under shop light against a pale wall, and on a pale
page the photos and the page fight. On the dark ground the photos are the only bright thing.
The pre-paint script in `index.html` and `ThemeContext.tsx` must agree on this default.

**A band is not the page inverted.** `.band` (see `index.css`) is the full-width panel used
by the announcement bar, the footer and the offer strip. It re-points `--color-bg-inverse`
and `--color-text-inverse` for its subtree, so children that already use `text-inverse` or
`border-inverse` keep working. In the dark theme a band is a raised pitch green, never paper:
a white slab would be the brightest thing on a page whose job is to show boots.

**Every text token in this table clears WCAG AA (4.5:1) against page, card and band grounds
in both themes.** The ratios were computed, not eyeballed. If you introduce a new colour,
compute it before shipping; a value that only passes in one theme is a bug.

**Semantic colour is separate from the accent.** Stock and delivery success use pitch; offers
and festival moments use marigold; errors use accent crimson. Do not use the accent to mean
"good".

---

## Typography

Loaded in `index.html` from Google Fonts. Both families carry Devanagari as well as Latin, so
Nepali and English set in the same voice.

| Role | Family | Tailwind | Notes |
|---|---|---|---|
| Display, numerals, prices, size runs, buttons | **Teko** | `font-display` | Condensed, athletic. Weights 400-700 only. |
| Body, labels, product detail | **Mukta** | `font-sans` (default) | Weights 300-700. |

Rules:

- **Teko stops at 700.** Never write `font-black` on a display element; it synthesises an ugly
  faux weight. Use `font-semibold` or `font-bold`.
- Teko sets tight: `leading-none` or `leading-[0.92]` on headings, and `uppercase`.
- Never use `italic` on Teko.
- Any element showing digits that line up in a column (prices, stock, sizes, view counts,
  order totals) gets `tabular-nums`.
- Uppercase micro-labels take `tracking-[0.12em]` or wider, at 11-12px, weight 700.
- Body copy stays near 62 characters wide.

Scale: `text-[11px]` labels, `text-sm` secondary, `text-base` body, then display sizes
clamped - hero `clamp(56px,13vw,128px)`, section heading `clamp(34px,6vw,56px)`,
card title `text-[29px]`.

---

## Space, shape, depth

- 8px grid: 4, 8, 12, 16, 24, 32, 48, 72.
- Radius: `rounded-tag` (2px) for chips and buttons, `rounded-card` (4px) for cards. Nothing
  larger. Never `rounded-xl`, `rounded-2xl` or `rounded-full` except on a genuine avatar.
- Borders: 2px ink rules on cards and buttons, 1px hairline for internal dividers, 3px solid
  rules between page sections.
- Depth: `shadow-hard` only - `4px 4px 0` in ink - and only on hover or an active state. No
  blurred shadows, no glow blobs, no backdrop blur panels.

---

## Motion

- Transition duration `120ms`, easing `cubic-bezier(.2,.7,.3,1)` (`ease-snap`).
- Hover on an interactive card or button: `translate(-2px,-2px)` plus `shadow-hard`. Active
  returns to `translate(0,0)` with no shadow.
- Scroll reveal: 160ms fade, at most 12px of travel, 40ms stagger, and the element's resting
  state is visible - never leave anything at `opacity:0` waiting for an observer.
- **The hero entrance is the one exception to the 300ms ceiling.** It plays once per page
  load, so it gets a real choreography: floodlight up over 620ms, headline lines rising out
  from under a mask at 420ms each 70ms apart, one 820ms pass of light across the section, and
  the deal card settling at 420ms. Nothing in it repeats, and the chain is finished inside
  1.1s. The ceiling still binds everything a visitor triggers more than once.
- Banned: bounce, elastic, spring overshoot, parallax, infinite float, infinite pulse-glow,
  marquees that run forever, and anything over 300ms outside the hero entrance.
- Every animation respects `prefers-reduced-motion`.

## Accessibility floor

Non-negotiable, checked in the audit:

- Interactive targets are at least 44x44px (size boxes, icon buttons, nav items, chips that act as filters).
- Colour is never the only signal: a sold-out size carries a strike, a status carries a word, an error carries text.
- Visible focus on everything focusable. The global ring is 3px marigold at 2px offset; do not set `outline-none` without an equally visible replacement.
- Semantic elements: real `<button>`, `<nav>`, `<main>`, one `<h1>` per page, labelled inputs.
- Layout holds with no horizontal scroll at 360px, 390px, 430px, 768px and 1024px.

---

## Components

**Button.** Teko, uppercase, 2px ink border, `rounded-tag`. Primary is accent fill; secondary
is transparent with ink text. Five states required: default, hover (lift onto hard shadow),
focus-visible (3px marigold outline, 2px offset), active (flat), disabled (secondary ground,
muted text, no lift).

**Product card.** 2px ink border, `rounded-card`, image in a 4:5 box with a 2px bottom rule.
Order inside the body: club/brand micro-label, product name in Teko, price row with
`tabular-nums` and struck-through compare price, then the **size run**, then chips.

**Size run.** The structural idea of the whole storefront: a real shop shows what it has in
your size before anything else. Each size is a bordered box in Teko. Available is an ink
border; selected is an ink fill with page-ground text; sold out is a muted border with a
diagonal strike, and is never addable to the cart.

The box is an interactive control, so its hit area is **at least 44x44px** (WCAG 2.5.5). Give
it `min-w-[44px] min-h-[44px]` and centre the glyph; the visible border may sit inside that
area but the tappable region may not shrink below it.

**Chips.** 11px uppercase, 1.5px border. Stock count in pitch, offers in marigold on
`bg-marigold-soft`, everything else neutral. COD and delivery time belong on the card, not
three clicks deep.

**Section header.** An eyebrow line (11px, uppercase, `tracking-[0.18em]`, tertiary, followed
by a hairline rule that fills the row), then a Teko heading. Sections are separated by a 3px
ink rule.

---

## Content rules

- Prices are `Rs 2,400` with `tabular-nums`.
- Say what the shop actually says: COD available, delivery all over Nepal, Bardibas
  (Chaudhary Market).
- Real product language from the catalogue: boots in UK sizes 6–11 by stud type (firm ground,
  turf, indoor/futsal) and colourway, jerseys by club and season (Man United away 24/25, Real
  Madrid third, Spain), plain team kit sets as jersey-and-shorts, football sizes 3/4/5,
  trophies by height in inches, medals on ribbons, brands Nike, Adidas, Puma, New Balance,
  Hummel, Kelme, Anda, Mitre.
- No invented review counts, no invented ratings, no "trusted by 10,000 athletes".

---

## Deliberately not doing

Near-black with a single acid-green or neon pop. Cream paper with a serif display and a
terracotta accent. Purple-to-blue gradient heroes, glass panels, floating blur blobs. Emoji as
section markers. Everything centred. A rounded card for every block. Inter or Space Grotesk.
These are the house styles of generated UI and the whole point of this system is to avoid
them.
