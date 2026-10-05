# MP Festival Tree — React frontend

Face-swap photobooth for a festival. ~10 wall-mounted tablets ("walls") play a place video with a QR code. A dedicated handheld ("controller") scans a wall QR, shows that place's info, the visitor picks Male/Female, takes a front-camera selfie, and the server face-swaps it. Wall and handheld both show live status, then the final image. The visitor takes it home by scanning a download QR (wall or handheld) or by entering a WhatsApp number on the handheld.

## Status (2026-10-05)
Flow and UI are **done**. Remaining work is **creatives only**: the user will supply final assets (e.g. logo SVG exports, favicon, possibly backgrounds/videos) — swap them in without touching the flow. Backend items still pending with the colleague: `whatsapp.php` and the gaps listed at the bottom.

The PHP backend is built by a colleague (separate repo). Docs: `http://192.168.1.88/ministack/MP_Festival_Tree/` (LAN dev server).

## Commands
- `npm run dev` — **https** dev server (`@vitejs/plugin-basic-ssl`, self-signed: accept the warning once per device), `host: true`. Open the **Network** URL (`https://<pc-ip>:5173`) on devices, not `localhost` — the wall builds its QR link from its own URL.
- `npm run build` — build into `dist/` (`base: './'` + hash router → works from any folder), then `npm run zip` (`bestzip`) writes `dist.zip` with `dist/` contents at its root. Extract straight into the server folder. Gitignored.
- `npm run zip` — re-zip `dist/` without rebuilding. `npm run preview` — serve the build.
- No lint or tests.

## HTTPS and the dev proxy
- Only the controller's in-app scanner needs https (live camera = secure context). Wall, SSE and the selfie `<input capture>` work over http.
- Dev API is plain http, so in `npm run dev` API calls go through a Vite proxy derived from `apiBase` (`vite.config.js`), and `fromServer(url)` strips the API origin from server-built URLs (Video, Info, final_image_url). Builds use `apiBase` and server URLs as-is. `view_url` is never rewritten (it goes to the visitor's phone).

## Stack and conventions
React + Vite, JSX only. TailwindCSS v4 (`@tailwindcss/vite`, theme in `src/index.css`), Framer Motion, React Router `createHashRouter`, `qrcode.react` (draw), `qr-scanner` (read). Icons: `react-icons/hi2` outline set; `react-icons/tb` (Tabler) for gender icons — professional, not childish.
- Follow the user's `react-architecture` skill: proportional architecture, no `features/` folder yet, no wrappers for trivial calls, reuse before creating.
- **No `.env` files** — every setting lives in `src/config/config.js` (user's choice).
- Plain `fetch`, no axios.
- Motion: only the presets in `src/constants/motion.js` (`ease`, `fadeUp`, `fade`, `stagger` + `rise` for staggered children, `tap`) and `Button`. `MotionConfig reducedMotion="user"` in `main.jsx`. Nested `AnimatePresence` inside an animating wrapper uses `initial={false}`.
- **Never leave a CSS `filter` on an ancestor of a glass panel** — it disables `backdrop-filter`. `fadeUp` ends with `transitionEnd: { filter: 'none' }` for this reason.
- Design: light beige glassmorphism in MP Travel Mart brand colours (logo source: `raw-docs/PLACEMENT OF LOGO FINAL.cdr`). `glass` utility + tokens: `sand` (bg), `ink` (text), `mist` (muted text), `plum` (primary accent) / `plum-soft`, `leaf`, `saffron`, `sky`; `font-display` Playfair, `font-sans` Inter. Body has faint brand-colour glows so the glass has something to blur. Reuse `GlassCard`. Handheld progress steps use plum → leaf → saffron (wordmark order). `public/favicon.svg` is a placeholder tile mark until the designer sends exports.
- Handheld layout must fit the visible screen: `min-h-dvh` + safe-area padding; size tall media by height (`max-w-[min(100%,42dvh)]`, `max-w-[calc(38dvh*3/4)]`, `max-h-[45dvh]`), not `vh`. Logo header takes ~9dvh. Result screen budget: ~50dvh + ~280px, so it fits ≥ 600px-tall screens without scrolling.
- Brand logo: `src/assets/logo.png` = main mark + tagline cropped from `raw-docs/assets/logo.png`, white made transparent (colour-to-alpha), so it sits on beige, glass or white. It already contains the tagline, so no separate tagline text. Partner logos (MP Govt, MP Tourism, MPT, FICCI) cropped the same way into `src/assets/partners/`, shown as a 2×2 square by `PartnerGrid`. The crops were made with a one-off Python/Pillow+numpy script (crop by bounding box, then `alpha = max(255-rgb)/255`, `rgb = 255-(255-rgb)/alpha`); when final creatives arrive, prefer the designer's transparent PNG/SVG and just replace the files under the same names.
- Fullscreen: double tap anywhere except buttons/links/inputs toggles fullscreen on every page (`useDoubleTapFullscreen` in `routes/index.jsx`; two `click`s < 300 ms, since Android Chrome doesn't fire `dblclick` reliably). `touch-action: manipulation` on `html` disables double-tap zoom. The selfie camera app drops fullscreen on Android — double tap again.

## Structure
```
src/
├── main.jsx                  RouterProvider inside MotionConfig
├── index.css                 Tailwind import, theme tokens, `glass` utility
├── assets/                   logo.png (main mark) + partners/*.png, all transparent
├── config/config.js          ALL settings: apiBase, whatsappEndpoint, wallIdPrefix, failedShowMs, deviceStorageKey
├── constants/motion.js       shared easing + presets
├── services/api/festival.js  sseUrl(id), fetchInfo(url), generate({sseId,id,file}), sendWhatsApp({sseId,phone,imageUrl,viewUrl}), fromServer(url)
├── hooks/
│   ├── useFestivalStream.js  EventSource → { record, waitingSet, online }
│   └── useDevice.js          localStorage { role: 'wall'|'controller', channel } → [device, save]
├── components/ui/
│   ├── GlassCard.jsx         glass panel
│   ├── Button.jsx            primary/ghost button with tap animation
│   ├── BrandQr.jsx           white bar: partners 2×2 · QR · main logo, one height (--s, vmin), 4-colour rule at bottom; QR cross-fades — wall idle + completed
│   ├── PartnerGrid.jsx       2×2 partner logos, sized by className
│   ├── QrScanner.jsx         rear-camera QR scanner, frame + sweep line, permission error + retry
│   └── StatusView.jsx        generating / completed (image + BrandQr of view_url, or children) / failed — wall and handheld
├── pages/
│   ├── SettingsPage.jsx      pick role + channel
│   ├── WallPage.jsx          wall display
│   └── ControlPage.jsx       handheld flow (Shell w/ partners + logo header, StepHeader, GenderCard, ShareOptions, WhatsAppForm, Scan, Flow)
└── routes/index.jsx          RootLayout cross-fades pages by pathname + double tap (off controls) toggles fullscreen; '/' redirects by role (none → /settings)
```

## End-to-end flow
1. **Setup** (`#/settings`, faint gear top-right): pick role; walls also get a channel → stream id `wall-{channel}`. Stored in localStorage.
2. **Wall** (`#/wall`) opens `sse.php?sse_id=wall-N`. No text on the wall.
   - `waiting` event → video cross-fades in once playable; BrandQr bar bottom-centre (`--s: clamp(110px,20vmin,230px)`) over a scrim rising from the bottom edge; QR cross-fades with each set, logos stay. QR → `<app url>#/control?wall=wall-N&m=<Male>&f=<Female>&info=<Info url>`.
   - `status`: `generating` → spinner overlay; `completed` (not `downloaded`) → image stacked above a BrandQr bar of `view_url` + "Scan to download"; `failed` → error for `config.failedShowMs`, then back to the last set locally.
   - Connection dot top-right: green = stream open, red = reconnecting (EventSource auto-reconnects; server closes streams every 300 s).
3. **Handheld** (`#/control`):
   - Role not `controller` → "Not authorized" (localStorage lock).
   - No params → in-app scanner. `parseWallCode()` accepts only URLs whose hash query has `wall`, `m`, `f`, `info`; anything else → "That isn't a festival wall code". Native camera app scanning opens the same link.
   - Header on every screen: PartnerGrid · main logo (`--h: clamp(4rem,9dvh,7rem)`); settings gear faint bottom-right. Step cards share `StepHeader`: back button · plum/leaf/saffron progress · `n/3`.
   - Steps: **info** (Info JSON title/description; back → scanner) → **gender** (♂/♀ icon cards, staggered in; picked card pulses 450 ms, then advances) → **selfie** (front camera, preview, retake) → **processing** (seconds counter) → **result** (image at 24dvh + `ShareOptions`: "Scan QR" (view_url, same as wall) / "WhatsApp" (number form) switcher, both panels stacked in one grid cell so height never jumps; "Next visitor" → scanner) or **error** ("Try again" → selfie).
   - Flow is keyed on the query string, so a new scan starts a fresh flow.
4. `generate()` POSTs with the **wall's** `sse_id`, so the wall also gets `generating` → `completed`.
5. Visitor scans the result QR → `view.php` resets the wall to `waiting`; `download.php` sets `downloaded: true`.

## Backend contract (verified end-to-end 2026-10-03)
Base: `config.apiBase` (now `http://192.168.1.88/ministack/MP_Festival_Tree`).
- `GET sse.php?sse_id=X` — creates the record if missing, never resets on reconnect; must be open before `api.php` (else 404). Events:
  - `status`: `{sse_id, status: waiting|generating|completed|failed, version, id, final_image_url, swap_image_url, view_url, error, downloaded, ...}`.
  - `waiting`: `{set, Male, Female, Video, Info, sse_id}` (absolute URLs from the server host); only while `waiting`, new random set every 60 s.
- `POST api.php` multipart: `sse_id`, `id` (Male/Female value), `source` (selfie), optional `mapping`, `upscale`, `weight` → `{success, final_image_url, view_url, ...}` or `{success:false, error}`. ~11 s observed, up to ~2 min (two AI calls on a separate machine, ports 8000/8002).
- `Info/40x.json` → `{title, description}`. `Videos/30x.mp4`. Sets: Male 101–104, Female 201–204.
- `view.php` / `download.php?file=Final/...` — visitor-facing.
- **Not built yet:** `POST whatsapp.php` (`config.whatsappEndpoint`) multipart `sse_id`, `phone` (digits incl. country code, no `+`), `final_image_url`, `view_url` → `{success}` / `{success:false, error}`. Our proposal; it should also reset the wall to `waiting` (visitor won't scan the wall QR).
- CORS `*` on `sse.php`, `api.php`, `Info/*`; media and links need none.

## Deployment: the event is ONLINE
- `192.168.1.88` is dev only. Before `npm run build`, set `config.apiBase` to the hosted API's **https** URL (https page can't call http API; scanner needs https).
- Extract `dist.zip` anywhere (same domain as the API is simplest). Wall QR links and SSE media URLs follow the real hosts automatically.
- PHP holds one worker per open SSE stream → 10+ walls = 10+ long-lived workers; confirm the host allows it and doesn't buffer `text/event-stream`.
- Keep `assets/qr-scanner-worker.min-*.js` with the build.

## Known gaps / next steps
- A `failed` record stays `failed` forever (no reset, no `waiting` events) → a reloaded wall shows the old error, then blank. Ask colleague to reset `failed` → `waiting`. Manual clear: one successful `api.php` run + open its `view_url`.
- `Swap/` and `Final/` are directory-listable (visitor photos) — ask colleague for `Options -Indexes`.
- WhatsApp send fails until the colleague builds `whatsapp.php` (see contract).
- Wall stays on `completed` until the visitor opens/downloads — add a local timeout if walls get stuck.
- Wall keeps rotating while a visitor reads on the handheld (accepted).
- Selfies uploaded full size — add canvas downscale if uploads are slow.
- Device lock is a localStorage flag, not auth (backend has none either).
- Controller result screen checked on an Android phone (user screenshot); wall tablets and the in-app scanner not yet tested on real devices.
