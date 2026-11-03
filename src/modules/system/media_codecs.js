/**
 * Media codecs card: playback, recording and DRM support. Support depends on browser build,
 * OS media stack and hardware decoders, so the pattern narrows down the platform.
 */

const MDN = 'https://developer.mozilla.org/en-US/docs/Web/API/';

const AUDIO_TYPES = {
  'MP3': 'audio/mpeg',
  'AAC': 'audio/mp4; codecs="mp4a.40.2"',
  'Opus (Ogg)': 'audio/ogg; codecs="opus"',
  'Vorbis (Ogg)': 'audio/ogg; codecs="vorbis"',
  'FLAC': 'audio/flac',
  'WAV': 'audio/wav; codecs="1"',
};

const VIDEO_TYPES = {
  'H.264': 'video/mp4; codecs="avc1.42E01E"',
  'H.265/HEVC': 'video/mp4; codecs="hvc1.1.6.L93.B0"',
  'VP8': 'video/webm; codecs="vp8"',
  'VP9': 'video/webm; codecs="vp9"',
  'AV1': 'video/mp4; codecs="av01.0.05M.08"',
  'Theora (Ogg)': 'video/ogg; codecs="theora"',
};

const RECORDER_TYPES = ['video/webm', 'video/mp4', 'video/x-matroska', 'audio/webm', 'audio/ogg', 'audio/mp4'];

const DRM_SYSTEMS = [
  ['Widevine', 'com.widevine.alpha'],
  ['PlayReady', 'com.microsoft.playready'],
  ['FairPlay', 'com.apple.fps'],
  ['ClearKey', 'org.w3.clearkey'],
];

async function drmSupported(keySystem) {
  try {
    await navigator.requestMediaKeySystemAccess(keySystem, [{
      initDataTypes: ['cenc'],
      videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }],
    }]);
    return true;
  } catch {
    return false;
  }
}

export async function collectMediaCodecs() {
  const data = {};
  const canPlay = (element, types) => {
    for (const [name, type] of Object.entries(types)) {
      const answer = element.canPlayType(type);
      data[name] = {
        value: answer === 'probably' ? 'Supported' : answer === 'maybe' ? 'Maybe' : 'Not Supported',
        url: `${MDN}HTMLMediaElement/canPlayType`,
      };
    }
  };
  canPlay(document.createElement('audio'), AUDIO_TYPES);
  canPlay(document.createElement('video'), VIDEO_TYPES);

  if (typeof MediaRecorder !== 'undefined') {
    data['MediaRecorder Formats'] = {
      value: RECORDER_TYPES.filter((t) => MediaRecorder.isTypeSupported(t)).join(', ') || 'None',
      url: `${MDN}MediaRecorder/isTypeSupported_static`,
    };
  }

  const emeUrl = `${MDN}Encrypted_Media_Extensions_API`;
  if (navigator.requestMediaKeySystemAccess) {
    const results = await Promise.all(DRM_SYSTEMS.map(([, keySystem]) => drmSupported(keySystem)));
    DRM_SYSTEMS.forEach(([name], i) => {
      data[`DRM: ${name}`] = { value: results[i] ? 'Supported' : 'Not Supported', url: emeUrl };
    });
  } else {
    data['DRM (EME)'] = { value: 'Not Supported', url: emeUrl };
  }

  return data;
}
