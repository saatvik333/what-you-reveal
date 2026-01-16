/**
 * Media Codec detection module
 * Checks support for various audio and video codecs
 */

/**
 * Checks support for media types
 * @returns {Object} Media codec support data
 */
export async function collectMediaData() {
  const audio = document.createElement('audio');
  const video = document.createElement('video');

  const audioTypes = {
    MP3: 'audio/mpeg',
    AAC: 'audio/mp4; codecs="mp4a.40.2"',
    'Ogg Vorbis': 'audio/ogg; codecs="vorbis"',
    'Ogg Opus': 'audio/ogg; codecs="opus"',
    WAV: 'audio/wav; codecs="1"',
    FLAC: 'audio/flac',
    'WebM Audio': 'audio/webm; codecs="vorbis"',
  };

  const videoTypes = {
    'H.264 (MP4)': 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
    'H.265 (HEVC)': 'video/mp4; codecs="hevc"',
    'VP8 (WebM)': 'video/webm; codecs="vp8, vorbis"',
    'VP9 (WebM)': 'video/webm; codecs="vp9"',
    AV1: 'video/webm; codecs="av01.0.05M.08"',
    'Ogg Theora': 'video/ogg; codecs="theora"',
  };

  const supported = {};

  // Check Audio
  for (const [name, type] of Object.entries(audioTypes)) {
    const canPlay = audio.canPlayType(type);
    if (canPlay !== '') {
      supported[name] = canPlay === 'probably' ? 'Supported (Probable)' : 'Supported (Maybe)';
    }
  }

  // Check Video
  for (const [name, type] of Object.entries(videoTypes)) {
    const canPlay = video.canPlayType(type);
    if (canPlay !== '') {
      supported[name] = canPlay === 'probably' ? 'Supported (Probable)' : 'Supported (Maybe)';
    }
  }

  // Check MediaRecorder types if available
  if (typeof MediaRecorder !== 'undefined') {
    const recorderTypes = [
      'video/webm',
      'video/mp4',
      'video/x-matroska',
      'audio/webm',
      'audio/ogg',
    ];

    const recorderSupport = recorderTypes
      .filter((t) => MediaRecorder.isTypeSupported(t))
      .join(', ');

    supported['MediaRecorder Types'] = recorderSupport || 'None';
  }

  // Encrypted Media Extensions (EME) - DRM Detection
  if (navigator.requestMediaKeySystemAccess) {
    supported['EME (DRM) API'] = 'Supported';
    
    // Check for common DRM systems
    const drmSystems = [
      { name: 'Widevine', keySystem: 'com.widevine.alpha' },
      { name: 'PlayReady', keySystem: 'com.microsoft.playready' },
      { name: 'FairPlay', keySystem: 'com.apple.fps.1_0' },
      { name: 'ClearKey', keySystem: 'org.w3.clearkey' },
    ];

    for (const drm of drmSystems) {
      try {
        await navigator.requestMediaKeySystemAccess(drm.keySystem, [
          { initDataTypes: ['cenc'], videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }] },
        ]);
        supported[`DRM: ${drm.name}`] = 'Supported';
      } catch (e) {
        supported[`DRM: ${drm.name}`] = 'Not Supported';
      }
    }
  } else {
    supported['EME (DRM) API'] = 'Not Supported';
  }

  // WebCodecs API (Hardware video decoding)
  supported['WebCodecs (VideoDecoder)'] = 'VideoDecoder' in window ? 'Supported' : 'Not Supported';
  supported['WebCodecs (AudioDecoder)'] = 'AudioDecoder' in window ? 'Supported' : 'Not Supported';
  supported['WebCodecs (VideoEncoder)'] = 'VideoEncoder' in window ? 'Supported' : 'Not Supported';

  return supported;
}
