# Reference review: bodo.ua → Cadeau

Before building, the full bodo.ua site was reviewed (November 2026): the homepage, the gift-catalog mega-menu, catalog and category pages, product pages, the multi-step gift checkout, the certificate activation flow, *How it works*, delivery & payment, corporate gifts, the help centre, contacts, about, team, reviews and legal pages, on desktop and mobile.

Cadeau reproduces bodo's **structure, features and business mechanics** with **original branding, copy, photography and a new visual identity** (calm and organic rather than bodo's bright red/green). No bodo text, logos or images are used.

## The business model (identical)

| bodo.ua | Cadeau |
|---|---|
| Put **1–5 experiences** into one gift | Same — `rules.maxGiftItems = 5` |
| **Pay for the most expensive** experience in the set | Same — `certificateValueCents()` in `src/lib/pricing.ts` |
| Recipient activates with **certificate number + secret code** | One **random 14-character code** (70 bits, unguessable — it is the number *and* the secret) |
| Recipient may pick another experience **within the nominal** | Same — "swap" from any catalog page in redeem mode |
| **Pay the difference** for something pricier (new certificate number issued) | Same — top-up payment, booking created on success (same code) |
| **Split** the nominal; remainder becomes a new certificate | Remainder simply **stays on the same code** (simpler for customers) |
| **Price protection** — price rises don't affect a sold certificate | Same — prices are snapshotted per gift item |
| Validity 9 months | Configurable; default **no expiry** (Ontario gift-card rules) |
| Booking: choose location, date/time + alternatives; confirmed by email in a few hours | Same — two preferred slots, admin confirms, guest emailed |
| Merge several certificates (once) | Not built (rare; can be added) |

## Site structure

| bodo.ua | Cadeau route |
|---|---|
| Top bar: experiences/travel, city, language | Announcement bar (5-for-1, never expires, redeem) |
| Mega-menu: by recipient (her/him/couple/kids/family/company), by occasion (birthday, anniversaries, holidays…), categories, by age | **Gift ideas** mega-menu: who it's for (grouped), occasions, categories, by budget |
| "Experiences for yourself" menu | **For yourself** menu + `/for-yourself` |
| Activate certificate button | **Redeem a gift** (`/redeem`) |
| Search, wishlist ("share wishes with friends"), cart | Search, wishlist with share link, gift box |
| Catalog filters: city, who for, price range, category, people, sort | `/experiences` filter bar: location, who for, category, price, group size, sort |
| Product cards: photo, badge, rating, "bought N times", options (price/people/duration), *Buy for yourself* + *Gift* | Experience cards with the same pieces (*Add to gift* + *For me*) |
| Product page: gallery, anchors (description, location, reviews, how it works, how it looks, how to get), FAQ, similar | `/experiences/[slug]` with the same sections |
| Cart pop-up "max 5 experiences" | Slide-in gift drawer with 5-slot progress |
| Checkout: 1 contents → 2 packaging (box colours / e-certificate) → 3 contacts → 4 recipient → 5 payment | `/gift-box` → `/checkout` (packaging, your details, recipient & delivery, review & pay) |
| E-certificate scheduled to date/time, greeting, copy to buyer | Same (+ greeting suggestions) |
| Delivery: 3-hour express, Nova Poshta, e-certificate, office pickup | Same-day courier (Toronto), Canada Post Xpresspost, e-certificate, studio pickup |
| How it works: *I give / I received / I book for myself* tabs | `/how-it-works` with the same three tabs |
| Help centre tabs: ordering, payment, delivery, using, returns, trust | `/faq` with the same sections |
| Corporate: use cases, why, formats, how it works, contact form, client logos | `/corporate` (no fake client logos) |
| Reviews page, about, contacts, complaint form, team, vacancies | `/reviews`, `/about`, `/contact` (team/vacancies omitted until you have them) |
| Legal: offer, privacy, cookies, returns | `/legal/terms`, `/legal/privacy`, `/legal/cookies`, `/legal/refunds` (templates — see README) |
| Chat bubble (Telegram/Viber/Messenger) | "Questions?" help bubble (phone, email, FAQ, redeem) |
| Back office (not public) | `/admin`: orders, fulfilment, bookings, gift codes, catalog editor, reviews, enquiries, email outbox |
