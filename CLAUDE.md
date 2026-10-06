# MP Festival Tree — React frontend

Face-swap photobooth for a festival. ~10 wall-mounted tablets ("walls") play a place video with a QR code. The visitor scans it with **their own phone's camera** (no dedicated handheld, no in-app scanner: removed 2026-10-06), which opens the app with the wall + set in the link: Know more (mptourism.com) or Capture image → Male/Female → front-camera selfie → the server face-swaps it. Wall and phone both show live status, then the final image; the phone gets a direct Download button (no page change), the wall a download QR (no WhatsApp, no place info).

## Status (2026-10-06)
Flow and UI are **done**. Remaining work is **creatives only**: the user will supply final assets (e.g. logo SVG exports, favicon, possibly backgrounds/videos) — swap them in without touching the flow. Backend items still pending with the colleague: the gaps listed at the bottom.

The PHP backend is built by a colleague (separate repo). Docs: `https://mpfestivaltree.theeventpics.com/API/` (hosted).

## Commands
- `npm run dev` — **https** dev server (`@vitejs/plugin-basic-ssl`, self-signed: accept the warning once per device), `host: true`. Open the **Network** URL (`https://<pc-ip>:5173`) on devices, not `localhost` — the wall builds its QR link from its own URL.
- `npm run build` — build into `dist/` (`base: './'` + hash router → works from any folder), then `npm run zip` (`bestzip`) writes `dist.zip` with `dist/` contents at its root. Extract straight into the server folder. Gitignored.
- `npm run zip` — re-zip `dist/` without rebuilding. `npm run preview` — serve the build.
- No lint or tests.

## HTTPS and the dev proxy
- Nothing needs https any more (the in-app scanner is gone); it's kept for wall video caching parity with production. Wall, SSE and the selfie `<input capture>` work over http.
- Dev API is plain http, so in `npm run dev` API calls go through a Vite proxy derived from `apiBase` (`vite.config.js`), and `fromServer(url)` strips the API origin from server-built URLs (Video, final_image_url). Builds use `apiBase` and server URLs as-is. `view_url` is never rewritten (it goes to the visitor's phone).

## Stack and conventions
React + Vite, JSX only. TailwindCSS v4 (`@tailwindcss/vite`, theme in `src/index.css`), Framer Motion, React Router `createHashRouter`, `qrcode.react` (wall QRs). Icons: `react-icons/hi2` outline set; `react-icons/tb` (Tabler) for gender icons — professional, not childish.
- Follow the user's `react-architecture` skill: proportional architecture, no `features/` folder yet, no wrappers for trivial calls, reuse before creating.
- **No `.env` files** — every setting lives in `src/config/config.js` (user's choice).
- Plain `fetch`, no axios.
- Motion: only the presets in `src/constants/motion.js` (`ease`, `fadeUp`, `fade`, `stagger` + `rise` for staggered children, `tap`) and `Button`. `MotionConfig reducedMotion="user"` in `main.jsx`. Nested `AnimatePresence` inside an animating wrapper uses `initial={false}`.
- **Never leave a CSS `filter` on an ancestor of a glass panel** — it disables `backdrop-filter`. `fadeUp` ends with `transitionEnd: { filter: 'none' }` for this reason.
- Design: light beige glassmorphism in MP Travel Mart brand colours (logo source: `raw-docs/PLACEMENT OF LOGO FINAL.cdr`). `glass` utility + tokens: `sand` (bg), `ink` (text), `mist` (muted text), `plum` (primary accent) / `plum-soft`, `leaf`, `saffron`, `sky`; `font-display` Playfair, `font-sans` Inter. Body has faint brand-colour glows so the glass has something to blur. Reuse `GlassCard`. `Button` with `href` renders a link. Phone progress steps use plum → leaf (wordmark order). `public/favicon.svg` is a placeholder tile mark until the designer sends exports.
- Phone layout must fit the visible screen: `min-h-dvh` + safe-area padding; size tall media by height (`max-w-[min(100%,42dvh)]`, `max-w-[calc(38dvh*3/4)]`, `max-h-[45dvh]`), not `vh`. Logo header takes ~20dvh (`clamp(7rem,20dvh,12rem)`); on the light screens it grows via `data-logo` on the step + `group-has-[[data-logo=…]]/shell` (intro `xl` ≈ 42dvh, gender `lg` ≈ 30dvh, both capped by width), with a 700 ms height transition. Result screen: header + image 24dvh + Download/Know more buttons, so it fits ≥ 600px-tall screens without scrolling.
- Brand logo: `src/assets/header-logo.png` = the designer's combined lockup (partner row MP Govt · MP Tourism · MPT · FICCI above the main MP Travel Mart mark, dates, tagline) from `raw-docs/assets/final logo placement.png`: white margins trimmed, resized to 900 px wide, white made transparent (`alpha = max(255-rgb)/255`, `rgb = 255-(255-rgb)/alpha`, one-off Pillow script; `py -3.13` has Pillow, no numpy). It is the only logo in the app (phone header only). For a new export, redo the trim/alpha and replace the file under the same name.
- Visitor phones are any Android or iPhone (opened from the native camera, so Safari/Chrome/Samsung Internet). Rules: `viewport-fit=cover` + `env(safe-area-inset-*)` on all four sides of `Shell` (notch / Dynamic Island / gesture bar, also landscape); `dvh` not `vh`; brand glows on a fixed `body::before` (iOS ignores `background-attachment: fixed`); `overscroll-behavior: none` (no pull-to-refresh mid-flow); `color-scheme: light only` (no Android force-dark); `text-size-adjust: 100%`; `hover:` is touch-safe (Tailwind v4 wraps it in `@media (hover: hover)`); Wake Lock during processing; result image keeps the iOS long-press save menu (logo doesn't). iPhone has no fullscreen API, so double tap is a no-op there.
- Fullscreen: double tap anywhere except buttons/links/inputs toggles fullscreen on every page (`useDoubleTapFullscreen` in `routes/index.jsx`; two `click`s < 300 ms, since Android Chrome doesn't fire `dblclick` reliably). `touch-action: manipulation` on `html` disables double-tap zoom. The selfie camera app drops fullscreen on Android — double tap again.

## Structure
```
src/
├── main.jsx                  RouterProvider inside MotionConfig
├── index.css                 Tailwind import, theme tokens, `glass` utility
├── assets/                   header-logo.png (combined logo lockup, transparent)
├── config/config.js          ALL settings: apiBase, wallIdPrefix, failedShowMs, prefetchVideos, knowMoreUrl
├── constants/motion.js       shared easing + presets
├── services/api/festival.js  sseUrl(id), generate({sseId,id,file}), fromServer(url)
├── services/videoCache.js    cachedVideo(url) → blob URL via Cache Storage (download once, survives reloads); prefetchVideos()
├── hooks/
│   └── useFestivalStream.js  EventSource → { record, waitingSet }
├── components/ui/
│   ├── GlassCard.jsx         glass panel
│   ├── Button.jsx            primary/ghost button with tap animation (`href` → link)
│   └── StatusView.jsx        generating / completed (image + children, phone only) / failed
├── pages/
│   ├── WallSetupPage.jsx     '/': channel number → #/wall/N
│   ├── WallPage.jsx          wall display (BackgroundVideo plays once → WallPanel + QrTile)
│   └── ControlPage.jsx       visitor phone flow (Shell w/ logo header, StepHeader, GenderCard, IntroAction, Flow)
└── routes/index.jsx          RootLayout cross-fades pages by pathname + double tap (off controls) toggles fullscreen; '/', '/wall/:channel', '/control'
```

## End-to-end flow
1. **Wall setup**: open the app root (`#/`), enter the channel → `#/wall/N` (stream id `wall-N`). The channel lives in the URL only (no localStorage, no roles), so bookmark/kiosk `#/wall/N` directly. Invalid channel → back to setup.
2. **Wall** (`#/wall/N`) opens `sse.php?sse_id=wall-N`. No text on the wall.
   - `waiting` event → video (portrait 1080×1920, ~35 s, 60–100 MB at the event) is fully downloaded into Cache Storage first (`cachedVideo`; QR panel shows meanwhile), then cross-fades in from a blob URL and plays **once**. After the first one, `prefetchVideos()` downloads `config.prefetchVideos` one by one, so every later set starts instantly. Caching needs https + same origin as the videos (`Videos/` sends no CORS); otherwise it falls back to streaming the URL. Replaced files under the same name stay stale → bump `CACHE` in `videoCache.js`. The video is `object-contain` (never cropped), no QR on top. On `ended` (or video error) `WallPanel` fades in: one full-bleed frosted layer (`bg-white/50 backdrop-blur-2xl`, no inset card) with just the centred `QrTile` (square, ~95vw: width `min(100%,74vh)`, never stretched). **No brand logos anywhere on the wall** (removed 2026-10-06 at the user's request). Real tablets are ~9:20 portrait, so the QR is limited by width. It stays until the next `waiting` set (60 s rotation) brings a new video. QR → `<app url>#/control?wall=wall-N&m=<Male>&f=<Female>` (kept short so the QR has fewer, bigger modules; old codes with `info` still work).
   - `status`: `generating` → spinner overlay; `completed` (not `downloaded`) → `WallResult` in `WallPanel` (compact): image (flex-1) above a large `QrTile` of `view_url` (42vh) + "Scan to download"; if the image fails to load it is dropped and the QR grows to 60vh; `failed` → error for `config.failedShowMs`, then back to the last set locally.
   - No overlays on the wall (connection dot and settings gear removed at the user's request). To change a wall's channel, edit the URL. EventSource auto-reconnects; server closes streams every 300 s.
3. **Visitor phone** (`#/control?wall=..&m=..&f=..`, opened by the phone's camera from the wall QR):
   - Missing params → "Scan a wall to begin" card. No device lock (any phone).
   - Header on every screen: the single `header-logo.png`. Step cards share `StepHeader`: back button · plum/leaf progress · `n/2`.
   - Steps: **intro** (no title, logo + two `IntroAction` tiles: Capture image (plum) · Know more (glass) → `config.knowMoreUrl` in a new tab) → **gender** (back → intro; ♂/♀ icon cards, staggered in; picked card pulses 450 ms, then advances) → **selfie** (native front camera via `<input capture="user">`, preview, retake) → **processing** (seconds counter) → **result** (image + Download) → **done** (leaf check badge springs in + ripple rings, "Downloaded", countdown bar, `DONE_MS` = 4 s → back to intro with state reset) or **error** ("Try again" → selfie).
   - Download: the result image is fetched as a blob as soon as it shows (needs same origin as `Final/`, which has no CORS), the tap saves it via `<a download>` (instant, so iOS keeps the user activation), then `markDownloaded()` HEAD-pings `download.php` (→ `downloaded: true`) and `view.php` (→ wall back to `waiting`/rotation). If the blob fetch failed, it falls back to navigating to `download.php` (attachment, page stays). Android saves to Downloads; iPhone asks, then saves to Files (long-press on the image saves to Photos).
   - Flow is keyed on the query string, so a new scan starts a fresh flow.
4. `generate()` POSTs with the **wall's** `sse_id`, so the wall also gets `generating` → `completed`.
5. Visitor taps Download (phone, pings both endpoints) or scans the wall's result QR → `view.php` resets the wall to `waiting`; `download.php` sets `downloaded: true`.

## Backend contract (verified end-to-end 2026-10-03)
Base: `config.apiBase` = hosted `https://mpfestivaltree.theeventpics.com/API` (docs at that URL; same contract as the old LAN server `http://192.168.1.88/ministack/MP_Festival_Tree`). SSE streams unbuffered there; videos 301–304 present.
- `GET sse.php?sse_id=X` — creates the record if missing, never resets on reconnect; must be open before `api.php` (else 404). Events:
  - `status`: `{sse_id, status: waiting|generating|completed|failed, version, id, final_image_url, swap_image_url, view_url, error, downloaded, ...}`.
  - `waiting`: `{set, Male, Female, Video, Info, sse_id}` (absolute URLs from the server host); only while `waiting`, new random set every 60 s.
- `POST api.php` multipart: `sse_id`, `id` (Male/Female value), `source` (selfie), optional `mapping`, `upscale`, `weight` → `{success, final_image_url, view_url, ...}` or `{success:false, error}`. ~11 s observed, up to ~2 min (two AI calls on a separate machine, ports 8000/8002).
- `Info/40x.json` (`{title, description}`) exists but the app no longer uses it. `Videos/30x.mp4`. Sets: Male 101–104, Female 201–204.
- `view.php` / `download.php?file=Final/...` — visitor-facing.
- CORS `*` on `sse.php`, `api.php`, `Info/*`; media and links need none.

## Deployment: the event is ONLINE
- `config.apiBase` already points at the hosted https API. Its `data.json` was copied from the LAN server, so old records (e.g. `wall-1`, `completed`) still carry `192.168.1.88` image URLs until a new generation overwrites them.
- Extract `dist.zip` on the **same domain as the API** (e.g. `https://mpfestivaltree.theeventpics.com/app/`): wall video caching needs it, since `Videos/` has no CORS header (or ask the colleague to add `Access-Control-Allow-Origin: *` there). Wall QR links and SSE media URLs follow the real hosts automatically.
- PHP holds one worker per open SSE stream → 10+ walls = 10+ long-lived workers; confirm the host allows it and doesn't buffer `text/event-stream`.

## Known gaps / next steps
- A `failed` record stays `failed` forever (no reset, no `waiting` events) → a reloaded wall shows the old error, then blank. Ask colleague to reset `failed` → `waiting`. Manual clear: one successful `api.php` run + open its `view_url`.
- `Swap/` and `Final/` are directory-listable (visitor photos) — ask colleague for `Options -Indexes`.
- Wall stays on `completed` until the visitor opens/downloads — add a local timeout if walls get stuck.
- Wall keeps rotating while a visitor is on their phone (accepted).
- Selfies uploaded full size — add canvas downscale if uploads are slow.
- No auth: anyone with a wall link can submit to that wall (backend has none either).
- Visitor-phone flow (intro/Know more/Download, 2026-10-06) not yet tested on real devices; wall tablets neither.
