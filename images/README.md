# Bhavika & Murli Wedding Site — Setup Guide

This is a static site with seven pages:
- `index.html` — the invitation, with a "Our Story" teaser and countdown
- `story.html` — the full "Our Story" page with a photo gallery
- `venue.html` — venue, directions/parking, things to do, and hotels
- `RSVP.html` — the RSVP form (only linked to from the two gated pages below)
- `events.html` — a **private, access-gated** detailed schedule for Haldi/Sangeet/Wedding guests (see Section 7 — intentionally not linked in the site's navigation)
- `mehendi.html` — the same idea, but for guests invited from Mehendi onward (all four days)

Plus an `images/` folder with the Ganesha crest, the Om symbol, and a full
set of icons — all recolored from the artwork you provided to match the
site's gold palette (see Section 9 below).

Styled with `style.css`, powered by `script.js`. RSVPs save to a Google Sheet
through a small Google Apps Script backend. No paid hosting needed.

---

## 1. Customize the content

- **Names/date/venue** — set to Bhavika & Murli (bride's name first
  throughout, as requested), November 25, 2026 (Baraat 2:00 PM), Mehendi
  Nov 23 4:00 PM, Haldi Nov 24 2:00 PM, Sangeet Nov 24 6:00 PM, at
  "Rancho Vista Gardens" in Vista, CA. Update the `.venue`/`.date` text
  in `index.html` and the `data-target="2026-11-25T14:00:00"` attribute
  on the `#countdown` div if anything changes (ISO format, venue's local time)
- **Schedule** — edit the `<li class="event">` blocks in `index.html`
- **Venue page** (`venue.html`) — replace the placeholder address
  (1245 Vista Ridge Lane, Vista, CA 92084) with your real venue address,
  update the Google Maps link, and swap the sample hotel names/details in
  "Book Your Stay" for your actual room block info and booking links.
  The "Things to Do Nearby" cards are generic Vista/Carlsbad-area suggestions
  — adjust to taste
- **RSVP form fields** — edit the event checkboxes and meal options in `RSVP.html` to match your actual events
- **Devanagari headings** — I've added Hindi translations under each
  English section title (e.g. "Our Story" / "हमारी कहानी"), plus the
  "॥ शुभ॥ ॥ लाभ॥" line in the footer. I'm not a native speaker, so
  **please have a Hindi speaker double-check these** before publishing —
  search for `class="dev"` and `footer-blessing` in the HTML files to find and edit them
- **Photos** — see Section 6 below for adding your own pictures to the
  "Our Story" sections
- **Footer credit line** — "Made by Murli for Bhavika with &lt;3" is in
  the `.footer-credit` paragraph at the bottom of every page — edit or remove as you like
- **Invitation card corners** — the homepage hero card has two small gold
  accent icons in the top corners (from your icon set). Swap
  `images/diya-icon.png` / `images/leaf-icon.png` for different files, or
  remove the `<img class="card-accent ...">` lines in `index.html` if you'd
  rather keep it plainer

---

## 2. Connect RSVPs to a Google Sheet

**a. Create the sheet**
1. Go to [sheets.google.com](https://sheets.google.com) → create a blank spreadsheet
2. Name it something like "Wedding RSVPs"

**b. Add the Apps Script backend**
1. In the sheet, go to **Extensions → Apps Script**
2. Delete any placeholder code, then paste in the contents of `apps-script.gs` (included in this project)
3. Click **Save** (disk icon), name the project (e.g. "RSVP Handler")

**c. Deploy it as a Web App**
1. Click **Deploy → New deployment**
2. Click the gear icon next to "Select type" → choose **Web app**
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**
5. Authorize when prompted (click through the "unverified app" warning — this is your own script)
6. Copy the **Web app URL** it gives you (ends in `/exec`)

**d. Connect it to the site**
1. Open `script.js`
2. Replace:
   ```js
   const APPS_SCRIPT_URL = "PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";
   ```
   with your copied URL, e.g.:
   ```js
   const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycb.../exec";
   ```
3. Save the file

Every RSVP submission will now appear as a new row in your Google Sheet,
with a timestamp, guest code, name, attendance, guest count, events, meal
choice, and message.

> **Note:** If you ever edit `apps-script.gs` after the first deploy, use
> **Deploy → Manage deployments → Edit (pencil icon) → New version** to
> push the update — the Web App URL stays the same.

---

## 3. Host it on GitHub Pages (free)

**a. Create a GitHub account** at [github.com](https://github.com) if you don't have one.

**b. Create a new repository**
1. Click **+ → New repository**
2. Name it anything, e.g. `bhavika-and-murli-wedding`
3. Set it to **Public** (required for free GitHub Pages)
4. Click **Create repository**

**c. Upload the site files**
1. On the new repo page, click **uploading an existing file**
2. Drag in all files from this project: `index.html`, `story.html`, `venue.html`, `RSVP.html`, `events.html`, `mehendi.html`, `style.css`, `script.js`, `robots.txt`, and the whole `images` folder
   (you don't need to upload `apps-script.gs` or this README — they're just for your reference)
3. Click **Commit changes**

**d. Turn on GitHub Pages**
1. In the repo, go to **Settings → Pages**
2. Under "Build and deployment" → **Source**, select **Deploy from a branch**
3. Under **Branch**, select `main` and folder `/ (root)` → **Save**
4. Wait about a minute, then refresh — GitHub will show your live URL, something like:
   ```
   https://yourusername.github.io/bhavika-and-murli-wedding/
   ```

Your RSVP page will be at:
```
https://yourusername.github.io/bhavika-and-murli-wedding/RSVP.html?code=YOURCODE
```

---

## 4. Get a custom domain (no "github" in the URL)

By default your site lives at `https://yourusername.github.io/repo-name/` —
functional, but with "github" in it. To use something like
`bhavikaandmurli.com` or `bhavika-murli.com` instead:

**a. Register the domain**
1. Check availability and buy one through a registrar — [Namecheap](https://namecheap.com),
   [Cloudflare Registrar](https://cloudflare.com/products/registrar), or
   [Google Domains via Squarespace](https://domains.squarespace.com) are all reputable.
   Try combinations like `bhavikaandmurli.com`, `bhavikamurli2026.com`,
   or `bhavikaweds.com`. Expect to pay roughly $10–20/year.
2. Complete the purchase (you don't need any hosting add-ons — just the domain).

**b. Point the domain at GitHub Pages**

In your domain registrar's DNS settings, add these records:

- If using the **root/apex domain** (`bhavikaandmurli.com`), add four **A records**
  for `@`, all pointing to GitHub's Pages IP addresses:
  ```
  185.199.108.153
  185.199.109.153
  185.199.110.153
  185.199.111.153
  ```
- If using a **`www` subdomain** (`www.bhavikaandmurli.com`), add a **CNAME record**:
  ```
  www  →  yourusername.github.io
  ```
- Doing both (apex + `www`) and redirecting one to the other is common —
  most registrars have a "redirect" or "URL forwarding" option for this.

**c. Tell GitHub about it**
1. In your repo: **Settings → Pages → Custom domain**, enter your domain, **Save**
   (GitHub adds a `CNAME` file to your repo automatically)
2. DNS changes can take anywhere from a few minutes to a few hours to propagate
3. Once GitHub shows a green checkmark next to your domain, check the
   **Enforce HTTPS** box — this gets you a free, auto-renewing SSL certificate

Your site is now live at your own domain, fully hosted on GitHub Pages,
with no "github" visible anywhere in the URL.

---

## 5. Guest codes (optional)

The RSVP page reads a `?code=` value from the URL and stores it with the
submission (e.g. `RSVP.html?code=SMITH-FAMILY`). This is just a label to
help you match responses back to your guest list in the spreadsheet — it
isn't validated against anything, so any code works. If you want to send
personalized links, just append a different code per invite when sharing
the RSVP link with each guest or family.

---

## 6. Adding your own photos

The "Our Story" sections (one photo on the home page, a gallery + three
more on `story.html`) currently show dashed placeholder boxes. To add real
photos:

1. Create a folder called `images` next to your HTML files and drop your
   photos in (e.g. `images/us-01.jpg`, `images/us-02.jpg`, ...). Keep file
   sizes reasonable (under ~500KB each) so the site loads quickly.
2. In `index.html` and `story.html`, find each `<div class="photo-placeholder">...</div>`
   block and replace it with a plain image tag, for example:
   ```html
   <img src="images/us-01.jpg" alt="Bhavika and Murli at the beach" style="width:100%; height:100%; object-fit:cover;">
   ```
3. Also rewrite the placeholder story text in `story.html` ("How We Met,"
   "Getting to Know Each Other," "The Proposal") with your actual story.
4. If you added a Content-Security-Policy image restriction, `img-src 'self'`
   already allows locally-hosted images like this without any changes.

---

## 7. The private, access-gated event pages

There are two gated pages, for two different guest groups. Both are
**deliberately left out of the site's navigation** — they only reveal
content (and the RSVP button) to guests who arrive with the right link:

**`events.html`** — for guests invited starting Haldi (3 days):

| Guest is invited for | Link to send | What they'll see |
|---|---|---|
| Haldi, Sangeet &amp; Wedding | `events.html?access=all` | All three event sections |
| Sangeet + Wedding (Nov 24–25) | `events.html?access=sangeet` | Sangeet + Wedding sections |
| Wedding day only (Nov 25) | `events.html?access=wedding` | Wedding section only |
| No code / wrong code | `events.html` | A polite "this is private" message, no event details |

**`mehendi.html`** — for guests invited starting Mehendi (all 4 days):

| Guest is invited for | Link to send | What they'll see |
|---|---|---|
| Mehendi, Haldi, Sangeet &amp; Wedding | `mehendi.html?access=all` | All four event sections |
| No code / wrong code | `mehendi.html` | The same "this is private" message |

(`mehendi.html` also understands `?access=sangeet` and `?access=wedding`
the same way `events.html` does, in case you ever need to send a narrower
link from that page — but its main purpose is the full four-day `?access=all` link.)

When you send each guest their invite (email, text, or however you're
sharing links), send the one gated link that matches how many days they're
invited for. **The RSVP button now lives on these gated pages** — it only
appears once a valid `?access=` code unlocks the page, right below the
event details. The public `index.html` no longer has an RSVP button at all,
so guests without a code can browse the invitation, Our Story, and venue
info, but can't reach the RSVP form.

You can combine the access code with a guest code too if useful, e.g.
`events.html?access=all&code=SMITH-FAMILY` (the `code` param is just
carried along, not currently displayed on that page).

**Important limitation:** this is convenience-level privacy, not real
security — anyone who has (or guesses) an `?access=all` link can see
everything, since there's no login system behind a static site. It's meant
to keep the full itinerary from being casually stumbled upon (e.g. by
search engines or someone poking at the URL), not to withstand someone
deliberately trying to see it. If you want true access control per guest,
that would require a backend with real authentication — a bigger step up
from this setup, and something I'm happy to help you think through if it
matters for your situation.

---

## 8. Security notes

A static site like this has a small attack surface, but a few things are
worth knowing and a few are already built in:

**Already built into this site:**
- **HTTPS everywhere** — GitHub Pages issues a free TLS certificate automatically
  once you enable "Enforce HTTPS," so all traffic (including RSVP submissions) is encrypted.
- **`noindex, nofollow`** meta tags and `robots.txt` on every page, so search
  engines won't crawl or list your guests' personal details in search results.
  (Anyone with the *direct link* can still open the site — this only affects
  search-engine indexing, not access. See the note above about `events.html`.)
- **A Content-Security-Policy** meta tag restricting each page to only load
  its own scripts/styles plus Google Fonts and the Apps Script endpoint —
  this blocks most injected third-party script attacks.
- **A honeypot field** on the RSVP form (invisible to real visitors, tempting
  to spam bots) that silently discards bot submissions before they reach your sheet.
- **Formula-injection sanitization** in `apps-script.gs` — a known Google
  Sheets attack where a form field like `=IMPORTXML(...)` gets executed as
  a live formula when it lands in a cell. Every field is now checked and
  neutralized before being written.

**Worth doing yourself:**
- **Turn on two-factor authentication** on both your GitHub account and the
  Google account hosting the Apps Script/Sheet — these are now the two keys
  to your guest list.
- **Don't share the Google Sheet or Apps Script project** beyond people who
  need it, and periodically check the Sheet for spam rows just in case.
- **The GitHub repo is public** (required for free GitHub Pages), which
  means your site's *source code* — the HTML/CSS/JS — is visible to anyone
  who looks at the repo, even though the rendered site itself isn't indexed
  by search engines. Don't put anything sensitive (passwords, personal
  addresses beyond the public venue, phone numbers) directly in the code —
  keep that kind of detail off the site entirely or behind the RSVP flow.
- **If you want real access control** (not just being hidden from search),
  a static GitHub Pages site can't password-protect itself on its own —
  that needs a server. The practical middle ground most couples use is
  what's already here: an unguessable, unlisted URL shared only with
  invited guests, which is a reasonable level of privacy for this kind of site.

---

## 9. The full icon set

`images/` now includes the whole icon collection you shared, recolored gold
and background-removed to match the site. `images/icon-set-preview.png` is
a labeled contact sheet so you can see everything at a glance (it's just
for your reference — don't need to upload it to GitHub Pages).

| File | Icon | A few ideas for where it could go |
|---|---|---|
| `ganesha-crest.png` | Full Ganesha | Already used as the crest on the invitation, venue, and RSVP cards |
| `ganesha-head-icon.png` | Ganesha head (smaller) | A lighter-weight alternative crest, or a favicon |
| `om-icon.png` | Om in a mandala | Already used in the footer |
| `diya-icon.png` | Diya (oil lamp) | Already used as a homepage card corner accent |
| `leaf-icon.png` | Flower/paisley | Already used as a homepage card corner accent |
| `kalash-icon.png` | Kalash (auspicious pot) | A welcoming touch near the top of `index.html` or `venue.html` |
| `swastika-icon.png` | Swastika in a lotus (a traditional Hindu auspicious symbol, distinct from the unrelated 20th-century hate symbol) | Near the Haldi or Mehendi sections, where this symbol traditionally appears |
| `throne-icon.png` | Ceremonial chair | Could mark the Baraat & Wedding Ceremony section |
| `scroll-icon.png` | Scroll/invitation | Could sit near the top of the invitation or RSVP page |
| `drum-icon.png` | Dholak (drum) | Sangeet section — matches the "come ready to dance" energy |
| `shehnai-icon.png` | Shehnai (instrument) | Also fits well near Baraat or Sangeet |
| `fire-icon.png` | Havan/fire | Wedding ceremony section, where the fire rites take place |
| `feet-icon.png` | Footprints | Less central to a wedding — kept for completeness, use if useful |
| `paisley-icon.png` | Second leaf/paisley variant | An alternate to `leaf-icon.png` for variety |
| `hands-icon.png` | Mehndi hands | A natural fit for the Mehendi page or section |

To add any of these somewhere, just drop an `<img>` tag pointing to the
file, e.g.:
```html
<img src="images/drum-icon.png" alt="" style="width:40px; height:auto;">
```
Sizing and placement will depend on where you put it — happy to help wire
any of these into a specific spot if you point me at one.
