/**
 * Media Codec detection module
 * Checks support for various audio and video codecs
 */

/**
 * Checks support for media types
 * @returns {Object} Media codec support data
 */
export async function collectMediaCodecs() {
  const audio = document.createElement('audio');
  const video = document.createElement('video');
  const canPlayTypeUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canPlayType';

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
      supported[name] = { 
          value: canPlay === 'probably' ? 'Supported (Probable)' : 'Supported (Maybe)',
          url: canPlayTypeUrl
      };
    }
  }

  // Check Video
  for (const [name, type] of Object.entries(videoTypes)) {
    const canPlay = video.canPlayType(type);
    if (canPlay !== '') {
      supported[name] = { 
          value: canPlay === 'probably' ? 'Supported (Probable)' : 'Supported (Maybe)',
          url: canPlayTypeUrl
      };
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

    supported['MediaRecorder Types'] = { 
        value: recorderSupport || 'None', 
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported' 
    };
  }

  // Encrypted Media Extensions (EME) - DRM Detection
  const emeUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/Encrypted_Media_Extensions_API';
  if (navigator.requestMediaKeySystemAccess) {
    supported['EME (DRM) API'] = { value: 'Supported', url: emeUrl };
    
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
        supported[`DRM: ${drm.name}`] = { value: 'Supported', url: emeUrl };
      } catch (e) {
        supported[`DRM: ${drm.name}`] = { value: 'Not Supported', url: emeUrl };
      }
    }
  } else {
    supported['EME (DRM) API'] = { value: 'Not Supported', url: emeUrl };
  }

  // WebCodecs API (Hardware video decoding)
  const webCodecsUrl = 'https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API';
  supported['WebCodecs (VideoDecoder)'] = { 
      value: 'VideoDecoder' in window ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/VideoDecoder'
  };
  supported['WebCodecs (AudioDecoder)'] = { 
      value: 'AudioDecoder' in window ? 'Supported' : 'Not Supported',
      url: 'https://developer.mozilla.org/en-US/docs/Web/API/AudioDecoder'
  };
  
  return supported;
}
