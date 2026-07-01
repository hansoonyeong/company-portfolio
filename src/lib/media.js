const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|$)/i

export function isVideoSrc(src) {
  return VIDEO_EXT.test(String(src || ''))
}
