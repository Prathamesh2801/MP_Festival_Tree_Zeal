# MP Festival Tree — React frontend

Face-swap photobooth for a festival. ~10 wall-mounted tablets ("walls") play a place video with a QR code. A dedicated handheld ("controller") scans a wall QR, the visitor picks Male/Female, takes a front-camera selfie, and the server face-swaps it. Wall and handheld both show live status, then the final image. The visitor takes it home by scanning a download QR (wall or handheld) (no WhatsApp, no place info: both removed 2026-10-06 at the user's request).

## Status (2026-10-05)
Flow and UI are **done**. Remaining work is **creatives only**: the user will supply final assets (e.g. logo SVG exports, favicon, possibly backgrounds/videos) — swap them in without touching the flow. Backend items still pending with the colleague: the gaps listed at the bottom.

The PHP backend is built by a colleague (separate repo). Docs: `https://mpfestivaltree.theeventpics.com/API/` (hosted).

## Commands
- `npm run dev` — **https** dev server (`@vitejs/plugin-basic-ssl`, self-signed: accept the warning once per device), `host: true`. Open the **Network** URL (`https://<pc-ip>:5173`) on devices, not `localhost` — the wall builds its QR link from its own URL.
- `npm run build` — build into `dist/` (`base: './'` + hash router → works from any folder), then `npm run zip` (`bestzip`) writes `dist.zip` with `dist/` contents at its root. Extract straight into the server folder. Gitignored.
- `npm run zip` — re-zip `dist/` without rebuilding. `npm run preview` — serve the build.
- No lint or tests.

## HTTPS and the dev proxy
- Only the controller's in-app scanner needs https (live camera = secure context). Wall, SSE and the selfie `<input capture>` work over http.
- Dev API is plain http, so in `npm run dev` API calls go through a Vite proxy derived from `apiBase` (`vite.config.js`), and `fromServer(url)` strips the API origin from server-built URLs (Video, final_image_url). Builds use `apiBase` and server URLs as-is. `view_url` is never rewritten (it goes to the visitor's phone).

## Stack and conventions
React + Vite, JSX only. TailwindCSS v4 (`@tailwindcss/vite`, theme in `src/index.css`), Framer Motion, React Router `createHashRouter`, `qrcode.react` (draw), `qr-scanner` (read). Icons: `react-icons/hi2` outline set; `react-icons/tb` (Tabler) for gender icons — professional, not childish.
- Follow the user's `react-architecture` skill: proportional architecture, no `features/` folder yet, no wrappers for trivial calls, reuse before creating.
- **No `.env` files** — every setting lives in `src/config/config.js` (user's choice).
- Plain `fetch`, no axios.
- Motion: only the presets in `src/constants/motion.js` (`ease`, `fadeUp`, `fade`, `stagger` + `rise` for staggered children, `tap`) and `Button`. `MotionConfig reducedMotion="user"` in `main.jsx`. Nested `AnimatePresence` inside an animating wrapper uses `initial={false}`.
- **Never leave a CSS `filter` on an ancestor of a glass panel** — it disables `backdrop-filter`. `fadeUp` ends with `transitionEnd: { filter: 'none' }` for this reason.
- Design: light beige glassmorphism in MP Travel Mart brand colours (logo source: `raw-docs/PLACEMENT OF LOGO FINAL.cdr`). `glass` utility + tokens: `sand` (bg), `ink` (text), `mist` (muted text), `plum` (primary accent) / `plum-soft`, `leaf`, `saffron`, `sky`; `font-display` Playfair, `font-sans` Inter. Body has faint brand-colour glows so the glass has something to blur. Reuse `GlassCard`. Handheld progress steps use plum → leaf (wordmark order). `public/favicon.svg` is a placeholder tile mark until the designer sends exports.
- Handheld layout must fit the visible screen: `min-h-dvh` + safe-area padding; size tall media by height (`max-w-[min(100%,42dvh)]`, `max-w-[calc(38dvh*3/4)]`, `max-h-[45dvh]`), not `vh`. Logo header takes ~9dvh. Result screen budget: ~50dvh + ~280px, so it fits ≥ 600px-tall screens without scrolling.
- Brand logo: `src/assets/logo.png` = main mark + tagline cropped from `raw-docs/assets/logo.png`, white made transparent (colour-to-alpha), so it sits on beige, glass or white. It already contains the tagline, so no separate tagline text. Partner logos (MP Govt, MP Tourism, MPT, FICCI) cropped the same way into `src/assets/partners/`, shown as a 2×2 square by `PartnerGrid`. The crops were made with a one-off Python/Pillow+numpy script (crop by bounding box, then `alpha = max(255-rgb)/255`, `rgb = 255-(255-rgb)/alpha`); when final creatives arrive, prefer the designer's transparent PNG/SVG and just replace the files under the same names.
- Fullscreen: double tap anywhere except buttons/links/inputs toggles fullscreen on every page (`useDoubleTapFullscreen` in `routes/index.jsx`; two `click`s < 300 ms, since Android Chrome doesn't fire `dblclick` reliably). `touch-action: manipulation` on `html` disables double-tap zoom. The selfie camera app drops fullscreen on Android — double tap again.

## Structure
```
src/
├── main.jsx                  RouterProvider inside MotionConfig
├── index.css                 Tailwind import, theme tokens, `glass` utility
├── assets/                   logo.png (main mark) + partners/*.png, all transparent
├── config/config.js          ALL settings: apiBase, wallIdPrefix, failedShowMs, prefetchVideos, deviceStorageKey
├── constants/motion.js       shared easing + presets
├── services/api/festival.js  sseUrl(id), generate({sseId,id,file}), fromServer(url)
├── services/videoCache.js    cachedVideo(url) → blob URL via Cache Storage (download once, survives reloads); prefetchVideos()
├── hooks/
│   ├── useFestivalStream.js  EventSource → { record, waitingSet }
│   └── useDevice.js          localStorage { role: 'wall'|'controller', channel } → [device, save]
├── components/ui/
│   ├── GlassCard.jsx         glass panel
│   ├── Button.jsx            primary/ghost button with tap animation
│   ├── PartnerGrid.jsx       2×2 partner logos (`row` → 1×4), sized by className
│   ├── QrScanner.jsx         rear-camera QR scanner, frame + sweep line, permission error + retry
│   └── StatusView.jsx        generating / completed (image + children, handheld only) / failed
├── pages/
│   ├── SettingsPage.jsx      pick role + channel
│   ├── WallPage.jsx          wall display (BackgroundVideo plays once → WallPanel + QrTile)
│   └── ControlPage.jsx       handheld flow (Shell w/ partners + logo header, StepHeader, GenderCard, Scan, Flow)
└── routes/index.jsx          RootLayout cross-fades pages by pathname + double tap (off controls) toggles fullscreen; '/' redirects by role (none → /settings)
```

## End-to-end flow
1. **Setup** (`#/settings`: faint gear on the handheld; on walls type the URL): pick role; walls also get a channel → stream id `wall-{channel}`. Stored in localStorage.
2. **Wall** (`#/wall`) opens `sse.php?sse_id=wall-N`. No text on the wall.
   - `waiting` event → video (portrait 1080×1920, ~35 s, 60–100 MB at the event) is fully downloaded into Cache Storage first (`cachedVideo`; QR panel shows meanwhile), then cross-fades in from a blob URL and plays **once**. After the first one, `prefetchVideos()` downloads `config.prefetchVideos` one by one, so every later set starts instantly. Caching needs https + same origin as the videos (`Videos/` sends no CORS); otherwise it falls back to streaming the URL. Replaced files under the same name stay stale → bump `CACHE` in `videoCache.js`. The video is `object-contain` (never cropped), no QR on top. On `ended` (or video error) `WallPanel` fades in: one full-bleed frosted layer (`bg-white/50 backdrop-blur-2xl`, no inset card), logo · `QrTile` (square, ~95vw: width `min(100%,74vh)`, never stretched; logo is `flex-1` and fills what is left) · partner row (`PartnerGrid row`). Real tablets are ~9:20 portrait, so the QR is limited by width. It stays until the next `waiting` set (60 s rotation) brings a new video. QR → `<app url>#/control?wall=wall-N&m=<Male>&f=<Female>` (kept short so the QR has fewer, bigger modules; old codes with `info` still parse).
   - `status`: `generating` → spinner overlay; `completed` (not `downloaded`) → `WallResult` in `WallPanel` (compact): image (flex-1) above a large `QrTile` of `view_url` (42vh) + "Scan to download"; if the image fails to load it is dropped and the QR grows to 60vh; `failed` → error for `config.failedShowMs`, then back to the last set locally.
   - No overlays on the wall (connection dot and settings gear removed at the user's request). To change a wall's channel, open `#/settings` by URL. EventSource auto-reconnects; server closes streams every 300 s.
3. **Handheld** (`#/control`):
   - Role not `controller` → "Not authorized" (localStorage lock).
   - No params → in-app scanner. `parseWallCode()` accepts only URLs whose hash query has `wall`, `m`, `f`; anything else → "That isn't a festival wall code". Native camera app scanning opens the same link.
   - Header on every screen: PartnerGrid · main logo (`--h: clamp(4rem,9dvh,7rem)`); settings gear faint bottom-right. Step cards share `StepHeader`: back button · plum/leaf progress · `n/2`.
   - Steps: **gender** (back → scanner; ♂/♀ icon cards, staggered in; picked card pulses 450 ms, then advances) → **selfie** (front camera, preview, retake) → **processing** (seconds counter) → **result** (image at 24dvh + download QR of `view_url`, same as the wall; "Next visitor" → scanner) or **error** ("Try again" → selfie).
   - Flow is keyed on the query string, so a new scan starts a fresh flow.
4. `generate()` POSTs with the **wall's** `sse_id`, so the wall also gets `generating` → `completed`.
5. Visitor scans the result QR → `view.php` resets the wall to `waiting`; `download.php` sets `downloaded: true`.

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
- Keep `assets/qr-scanner-worker.min-*.js` with the build.

## Known gaps / next steps
- A `failed` record stays `failed` forever (no reset, no `waiting` events) → a reloaded wall shows the old error, then blank. Ask colleague to reset `failed` → `waiting`. Manual clear: one successful `api.php` run + open its `view_url`.
- `Swap/` and `Final/` are directory-listable (visitor photos) — ask colleague for `Options -Indexes`.
- Wall stays on `completed` until the visitor opens/downloads — add a local timeout if walls get stuck.
- Wall keeps rotating while a visitor reads on the handheld (accepted).
- Selfies uploaded full size — add canvas downscale if uploads are slow.
- Device lock is a localStorage flag, not auth (backend has none either).
- Controller result screen checked on an Android phone (user screenshot); wall tablets and the in-app scanner not yet tested on real devices.
