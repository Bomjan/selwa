# Selwa Design System

**Selwa** is a Bhutanese artisan e-commerce marketplace that connects traditional craftspeople with global buyers. It celebrates Bhutan's rich cultural heritage — textiles, woodcraft, jewellery, pottery, and wellness products — while supporting the livelihoods of artisans across the country.

## Sources

- **GitHub Codebase**: `https://github.com/Bomjan/selwa` (branch: `main`)
  - Frontend: `frontend/` — HTML pages, CSS design system, JavaScript
  - Backend: `backend/` — Go REST API (Gorilla Mux + PostgreSQL)
  - Architecture guide: `ARCHITECTURE_GUIDE.md`

---

## Products / Surfaces

| Surface | Description |
|---------|-------------|
| **Marketing Website** | Multi-page HTML/CSS/JS site — homepage, products listing, product detail, artisans directory, about, FAQ, cart, auth |
| **Go REST API** | CRUD backend for products, artisans, users, orders, cart management |

---

## CONTENT FUNDAMENTALS

### Voice & Tone
- **Warm, respectful, cultural pride** — copy celebrates Bhutan's heritage without being overly formal
- **Second person "you"** — e.g. *"Selwa connects you directly with Bhutanese artisans"*
- **Present tense, active voice** — *"Every purchase supports a local craftsperson"*
- **Poetic but not flowery** — names like *"Himalayan tea"*, *"High-altitude honey"*, *"Happiness tea"* feel evocative but grounded
- **Sentence case** for most headings — *"Discover the art of Bhutan"* not *"Discover The Art Of Bhutan"*
- **No emoji** in copy — product categories use emoji icons in code but these are UI tokens, not copy voice
- **Lowercase for UI microcopy** — nav links, buttons, filter labels all sentence case or title case minimally: *"Shop now"*, *"Meet artisans"*, *"See all"*, *"Add"*

### Casing
- **Headings**: Sentence case
- **Nav links**: Title case minimal — *Home, Products, Artisans, About*
- **Buttons**: Sentence case — *"Shop now"*, *"Add to cart"*
- **Eyebrow labels**: ALL CAPS — *"AUTHENTIC BHUTANESE CRAFTS"*, *"HIMALAYAN ARTISAN MARKETPLACE"*
- **Filter labels & column headers**: ALL CAPS with letter-spacing

### Example Copy Patterns
- Hero heading: *"Discover the art of Bhutan, crafted with heart"* (italic Playfair Display)
- Hero sub: *"Selwa connects you directly with Bhutanese artisans — bringing traditional handcrafted products to the global market while preserving centuries-old traditions."*
- Product attribution: *"By Karma Wangmo, Bumthang"*
- CTA: *"Every purchase supports a local craftsperson."*
- Footer tagline: *"Proudly promoting Bhutanese heritage."*

---

## VISUAL FOUNDATIONS

### Colors
The palette is inspired by **Himalayan earth tones** — deep bark, warm gold, and parchment cream — evoking aged timber, beeswax, and monastery walls.

- **Ink** (`#0F0A05`, `#1C1208`) — near-black, used for dark section backgrounds and text on dark
- **Bark** (`#3D2008` → `#8B6040`) — warm mid-dark browns, used for text hierarchy and artisan accents
- **Gold** (`#B8701A` primary; `#9A5C12` deep; `#D4920A` warm; `#EDD09A` pale; `#FAF1E2` mist) — the primary brand accent; used for CTAs, links, highlights, active states
- **Cream** (`#FAF7F2` → `#DDD0B8`) — four-step background scale; all page backgrounds use cream, not white
- **Surface** `#FFFFFF` — cards and form fields only
- **Semantic text**: body `#2C1A06`, muted `#8B6040`, faint `#B8A080`

### Typography
- **Display / Headings**: `Playfair Display` — a classic editorial serif with optical italic for hero use; weights 400–700
- **Body / UI**: `DM Sans` — modern geometric sans-serif; weights 300, 400, 500, 600
- **No monospace** font in use on the frontend
- Fonts loaded via Google Fonts CDN

### Backgrounds
- Page background is always **cream** (`--cream: #FAF7F2`), never white
- Dark sections use `--ink-2` (`#1C1208`) — the About hero, footer, auth split-panel, CTA sections
- Alternate sections use `--cream-2` (`#F4EDE0`) for subtle rhythm
- **No full-bleed photography** as page backgrounds (hero uses a photo *underneath* a dark overlay gradient, then content is center-bottom)
- **No patterns, textures, or illustrated backgrounds** in v2 — clean flat surfaces
- Auth page uses a split layout: dark image panel left + cream form panel right

### Layout
- Max content width: `1280px`
- Section vertical padding: `80px` (`--sec`)
- Horizontal page padding: `48px` desktop, `32px` tablet, `20px` mobile
- Sticky navigation: `64px` tall, blurred backdrop (`backdrop-filter: blur(14px)`)
- Grid: Bootstrap 5 columns + custom CSS Grid for footer/trust/section layouts
- Product grids: 3-up on desktop, 2-up on tablet, 1-up mobile

### Spacing / Radius
| Token | Value | Usage |
|-------|-------|-------|
| `--r-sm` | 5px | Badges, small chips |
| `--r` | 10px | Inputs, filter items |
| `--r-md` | 14px | Some containers |
| `--r-lg` | 20px | Product cards, artisan cards |
| `--r-xl` | 28px | Auth modal, detail image |
| `--r-pill` | 9999px | Buttons, search bar, category pills |

### Shadows
All shadows use warm-tinted rgba (`44,26,6`) to stay on-brand:
- `--sh-sm` — cards at rest: barely-there
- `--sh-md` — value/team cards on hover
- `--sh-lg` — product/artisan cards on hover; mobile nav dropdown
- `--sh-xl` — modals, auth form, toasts

### Buttons
- **Primary** `.s-btn--gold`: solid `--gold` fill, white text, pill radius, subtle lift + shadow on hover
- **Outline light** `.s-btn--outline`: transparent + white border (for use over dark backgrounds)
- **Outline dark** `.s-btn--outline-dark`: `--gold` border + text (for use over cream backgrounds)
- **Dark** `.s-btn--dark`: `--ink-2` background + `--gold-pale` text
- **Add-to-cart** `.s-btn--add`: cream fill, gold text; fills gold on hover
- Sizes: `--sm` (8px 18px), default (11px 24px), `--lg` (14px 32px)
- All buttons: pill radius (`--r-pill`), 600 weight, `DM Sans`, `transition: all .2s`

### Cards
- Background: `--surface` (white)
- Border: `1px solid --border` (`#E2D8C8`)
- Border radius: `--r-lg` (20px)
- Shadow at rest: `--sh-sm`
- Hover: `translateY(-4px)` + `--sh-lg` + image scale `1.05`
- Product card images: 1:1 aspect ratio, `object-fit: cover`
- Category chip on image: dark blurred overlay pill, gold-pale text

### Hover & Interaction States
- **Links**: `color: --gold` → `--gold-deep` transition 0.2s
- **Nav links**: background fill `--gold-mist` + color `--gold`
- **Buttons**: `translateY(-1px)` + deepened background + optional glow shadow
- **Cards**: `translateY(-4px)` + `--sh-lg`
- **Filter/tab pills**: border `--gold`, text `--gold`; active = solid `--gold` background white text
- **Inputs focus**: `border-color: --gold` + `box-shadow: 0 0 0 3px rgba(184,112,26,.1)`

### Animation
- Ease: `cubic-bezier(.25,.46,.45,.94)` — a smooth, slightly-slow-out curve
- Hero content: `fadeUp` (opacity 0→1, translateY 28→0, 0.9s)
- Hero scroll indicator: `scrollBob` (7px vertical bob, 2.2s infinite)
- Transitions: typically `0.2s` to `0.3s`; cards `0.28s`; image zoom `0.45s`
- No bounce, spring, or overshoot animations — everything is smooth and dignified

### Imagery
- Product images: square aspect ratio, warm-toned photography of Bhutanese crafts
- AVIF format used for product images (modern compression)
- Color vibe: warm, earthy tones consistent with the palette
- No grain, no desaturation — full color, natural light

---

## ICONOGRAPHY

- **Icon set**: Bootstrap Icons (`bootstrap-icons@1.11.3`) loaded via CDN
  - `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css`
- Usage: `<i class="bi bi-[name]">` — icon font, no SVGs
- Key icons in use: `bi-search`, `bi-bag`, `bi-star-fill`, `bi-geo-alt`, `bi-check2`, `bi-plus`, `bi-dash`, `bi-x`, `bi-chevron-right`, `bi-truck`, `bi-shield-check`, `bi-arrow-repeat`
- Color: icons inherit text color or are set to `--gold` for featured use
- **No custom SVG illustrations** — the brand does not use decorative illustration
- **Emoji** appear in placeholder/fallback product image slots in the codebase (🧵, 🪵, 📿, 🫙) but are **not** part of production design intent
- Product category icons are represented by emoji in the HTML as placeholders where real product photography would go

---

## File Index

```
/
├── README.md                  — This file
├── SKILL.md                   — Agent skill definition
├── colors_and_type.css        — Full CSS token library (colors, type, spacing, radii, shadows)
│
├── assets/                    — Brand images & product photography
│   ├── selwa.bt.jpeg          — Brand / storefront photo
│   ├── gift.webp              — Gift/packaging image
│   ├── bangchung.avif         — Product: Bangchung (woven container)
│   ├── cordyceps.avif         — Product: Cordyceps
│   ├── himalayan-tea.avif     — Product: Himalayan tea
│   ├── honey-bumthang.avif    — Product: Bumthang honey
│   ├── palang.avif            — Product: Palang (traditional item)
│   ├── taktshang-souvenir.avif— Product: Taktshang souvenir
│   ├── tsholam-keychain.avif  — Product: Tsholam keychain
│   ├── tea-cup.avif           — Product: Tea cup
│   ├── bumthapa-puta.avif     — Product: Bumthapa puta
│   ├── zoedow-ezay.avif       — Product: Zoedow ezay
│   ├── incense-stick.avif     — Product: Incense stick
│   ├── menjong-sorig.avif     — Product: Menjong sorig
│   ├── lemongrass-spray.avif  — Product: Lemongrass spray
│   ├── high-altitude-honey.avif — Product: High altitude honey
│   └── happiness-tea.avif     — Product: Happiness tea
│
├── preview/                   — Design System card previews
│   ├── colors-brand.html      — Brand color palette
│   ├── colors-semantic.html   — Semantic text & surface colors
│   ├── colors-dark.html       — Dark/ink palette
│   ├── typography-display.html— Playfair Display specimens
│   ├── typography-body.html   — DM Sans specimens
│   ├── typography-scale.html  — Full type scale
│   ├── spacing-tokens.html    — Radius + shadow tokens
│   ├── components-buttons.html— Button variants
│   ├── components-cards.html  — Product & artisan cards
│   ├── components-inputs.html — Form inputs
│   ├── components-nav.html    — Navigation bar
│   ├── components-badges.html — Badges, pills, tags
│   └── brand-imagery.html     — Product photography samples
│
└── ui_kits/
    └── website/
        ├── README.md          — UI kit overview
        └── index.html         — Interactive website prototype
```
