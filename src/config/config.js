// All app settings live here. Edit before `npm run dev` / `npm run build`.
const config = {
  // PHP API folder (full URL). The server sends CORS headers, so the app calls it directly.
  // Online event: change to the https URL of the hosted API.
  apiBase: 'http://192.168.1.88/ministack/MP_Festival_Tree',

  // Endpoint (relative to apiBase) that WhatsApps the final image to the visitor. Not built on the server yet.
  whatsappEndpoint: 'whatsapp.php',

  // Wall stream id = wallIdPrefix + channel number.
  wallIdPrefix: 'wall-',

  // How long the wall shows a failed result before returning to the video.
  failedShowMs: 8000,

  // localStorage key for this device's role and channel.
  deviceStorageKey: 'mpft.device',
}

export default config
