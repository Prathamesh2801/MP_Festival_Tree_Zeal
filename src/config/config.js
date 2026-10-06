// All app settings live here. Edit before `npm run dev` / `npm run build`.
const config = {
  // PHP API folder (full URL). The server sends CORS headers, so the app calls it directly.
  apiBase: 'https://mpfestivaltree.theeventpics.com/API',

  // Wall stream id = wallIdPrefix + channel number.
  wallIdPrefix: 'wall-',

  // How long the wall shows a failed result before returning to the video.
  failedShowMs: 8000,

  // Wall videos (relative to apiBase) downloaded into the cache after the first one plays, so every set starts instantly.
  // Add new ones when sets are added on the server; a video missing here is still cached the first time it arrives.
  prefetchVideos: ['Videos/301.mp4', 'Videos/302.mp4', 'Videos/303.mp4', 'Videos/304.mp4'],

  // localStorage key for this device's role and channel.
  deviceStorageKey: 'mpft.device',
}

export default config
