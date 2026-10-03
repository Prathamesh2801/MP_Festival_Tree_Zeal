# MP Festival Tree — React frontend

Face-swap photobooth for a festival. ~10 wall-mounted tablets ("walls") play a place video with a QR code. A dedicated handheld ("controller", iPad/tablet/phone) scans a wall QR, shows that place's info, the visitor picks a gender portrait, takes a front-camera selfie, and the server face-swaps it. Wall and handheld both show live status, then the final image with a download QR.

The PHP backend is built by a colleague (separate repo). Its docs: `http://192.168.1.88/ministack/MP_Festival_Tree/` (dev server on LAN).

## Commands
- `npm run dev` — dev server, `host: true` so tablets on the LAN can open it. Open the **Network** URL on devices, not `localhost` (the wall builds its QR link from its own URL).
- `npm run build` — static build into `dist/` (`base: './'`, hash router → works from any folder), then zips it to `dist.zip` in the project root (via `npm run zip`, `bestzip`). Zip holds the contents of `dist/` at its root (`index.html`, `assets/`) — extract straight into the server folder. `dist.zip` is gitignored.
- `npm run zip` — re-zip an existing `dist/` without rebuilding.
- `npm run preview` — serve the build.
- No lint or tests configured.

## Stack and conventions
React + Vite, JavaScript/JSX only (no TypeScript). TailwindCSS v4 (`@tailwindcss/vite`, theme in `src/index.css`), Framer Motion, React Icons (`react-icons/hi2` outline set — professional, not childish), React Router `createHashRouter`, `qrcode.react`.
- Follow the user's `react-architecture` skill: architecture proportional to size, no `features/` folder until needed, no service wrappers for trivial calls, reuse before creating.
- **No `.env` files.** Every setting lives in `src/config/config.js` (user's explicit choice).
- Plain `fetch`, no axios. Native camera via `<input type="file" accept="image/*" capture="user">`, no camera/scanner libs.
- Design: dark, elegant glassmorphism. `glass` utility + tokens (`ink`, `gold`, `gold-soft`, `mist`, `font-display` Playfair Display, `font-sans` Inter) in `src/index.css`. Reuse `GlassCard` for panels.

## Structure
```
src/
├── main.jsx                  RouterProvider
├── index.css                 Tailwind import, theme tokens, `glass` utility
├── config/config.js          ALL settings: apiBase, wallIdPrefix, failedShowMs, deviceStorageKey
├── services/api/festival.js  sseUrl(id), targetImg(id), fetchInfo(url), generate({sseId,id,file})
├── hooks/
│   ├── useFestivalStream.js  EventSource → { record, waitingSet, online }
│   └── useDevice.js          localStorage { role: 'wall'|'controller', channel } → [device, save]
├── components/ui/
│   ├── GlassCard.jsx         glass panel
│   └── StatusView.jsx        generating / completed (image + QR of view_url) / failed — shared by wall and handheld
├── pages/
│   ├── SettingsPage.jsx      pick role + channel
│   ├── WallPage.jsx          wall display
│   └── ControlPage.jsx       handheld flow
└── routes/index.jsx          '/' redirects by role (none → /settings), /settings, /wall, /control, * → /
```

## End-to-end flow
1. **Setup** (`#/settings`, also via faint gear icon top-right): each device picks a role. Walls also get a channel number → stream id `wall-{channel}` (`config.wallIdPrefix`). Stored in localStorage.
2. **Wall** (`#/wall`) opens `sse.php?sse_id=wall-N`.
   - `waiting` event (every 60 s, random set) → full-screen muted looping `Video`, place title from `Info` JSON, and a QR linking to
     `<app url>#/control?wall=wall-N&m=<Male id>&f=<Female id>&info=<Info url>`.
   - `status` event: `generating` → spinner overlay; `completed` (and not `downloaded`) → final image + QR of `view_url`; `failed` → error for `config.failedShowMs`, then back to the last set locally (server sends no `waiting` events while failed).
   - "Reconnecting…" badge when the EventSource errors (it reconnects by itself; server closes streams every 300 s).
3. **Handheld** scans the wall QR with its **native camera** app → opens `#/control?...` in its browser.
   - Not set to role `controller` → "Not authorized" (localStorage lock keeps random phones out).
   - No params → "Scan a wall to begin".
   - Steps: **info** (title/description from Info JSON) → **gender** (Male/Female cards with `Target/{id}.png`) → **selfie** (native front camera, preview, retake) → **processing** (seconds counter) → **result** (StatusView + "Next visitor" → back to idle) or **error** ("Try again" → selfie).
   - A new scan (different query string) restarts the flow (`key={params.toString()}`).
4. `generate()` POSTs to `api.php` with the **wall's** `sse_id`, so the wall's stream gets `generating` → `completed` too.
5. Visitor scans the result QR → `view.php` (server resets the wall to `waiting`). Downloading via `download.php` sets `downloaded: true` → wall goes back to the video.

## Backend contract (verified 2026-10-03)
Base: `config.apiBase` (currently `http://192.168.1.88/ministack/MP_Festival_Tree`).
- `GET sse.php?sse_id=X` — SSE. Events:
  - `status`: full record `{sse_id, status: waiting|generating|completed|failed, version, id, final_image_url, swap_image_url, view_url, error, downloaded, ...}`.
  - `waiting`: `{set, Male, Female, Video, Info, sse_id}` (Video/Info are absolute URLs built from the server host). Only while status is `waiting`, rotates every 60 s.
  - Creates the record if missing; never resets on reconnect. Must be open before `api.php` is called (else 404).
- `POST api.php` multipart: `sse_id`, `id` (target id = Male/Female value), `source` (jpg/png/webp selfie), optional `mapping`, `upscale`, `weight`. Returns `{success, final_image_url, view_url, ...}` or `{success:false, error}`. Can take ~1–2 min (two AI calls, 60 s timeout each).
- `Info/40x.json` → `{title, description}`. `Target/{id}.png` portraits (101–104 male, 201–204 female). `Videos/30x.mp4`.
- `view.php?file=Final/...`, `download.php?file=Final/...` — opened by visitors from the result QR.
- **CORS:** `Access-Control-Allow-Origin: *` on `sse.php`, `api.php`, `Info/*`. Images/videos/view/download are loaded via tags/links, so need none. App calls the API directly — no Vite proxy.

## Deployment: the event is ONLINE
- `192.168.1.88` is only the dev server. At the event, set `config.apiBase` to the **https** URL of the hosted API before `npm run build`.
- HTTPS on both app and API (an https page can't call an http API — mixed content). Video/Info URLs from SSE follow the server host automatically.
- Upload/extract `dist.zip` anywhere (same domain as the API is simplest). Wall QR links follow the app's real URL.
- PHP holds one worker per open SSE stream → 10+ walls means 10+ long-lived workers; confirm the host allows it and doesn't buffer `text/event-stream`.
- HTTPS would allow an in-app QR scanner later (getUserMedia); current choice is native camera.

## Known gaps / next steps
- `Videos/301–304.mp4` not uploaded yet (404) — wall shows just the background until then.
- Server lists `Swap/` and `Final/` directories publicly (visitor photos) — ask colleague for `Options -Indexes`.
- Wall rotation continues while a visitor reads on the handheld (accepted; handheld keeps its scanned set). Optional future: server "lock" when scanned.
- Wall stays on `completed` until visitor opens/downloads — add a local timeout if walls get stuck.
- Selfies uploaded at full size — add canvas downscale if uploads are slow.
- Device lock is a localStorage flag, not auth (backend has no auth either).
- Not yet tested on real tablets (native camera, QR scan) or a full end-to-end upload.
