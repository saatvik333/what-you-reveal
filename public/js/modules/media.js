/**
 * Media Codec detection module
 * Checks support for various audio and video codecs
 */

/**
 * Checks support for media types
 * @returns {Object} Media codec support data
 */
export function collectMediaData() {
    const audio = document.createElement('audio');
    const video = document.createElement('video');

    const audioTypes = {
        'MP3': 'audio/mpeg',
        'AAC': 'audio/mp4; codecs="mp4a.40.2"',
        'Ogg Vorbis': 'audio/ogg; codecs="vorbis"',
        'Ogg Opus': 'audio/ogg; codecs="opus"',
        'WAV': 'audio/wav; codecs="1"',
        'FLAC': 'audio/flac',
        'WebM Audio': 'audio/webm; codecs="vorbis"'
    };

    const videoTypes = {
        'H.264 (MP4)': 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
        'H.265 (HEVC)': 'video/mp4; codecs="hevc"',
        'VP8 (WebM)': 'video/webm; codecs="vp8, vorbis"',
        'VP9 (WebM)': 'video/webm; codecs="vp9"',
        'AV1': 'video/webm; codecs="av01.0.05M.08"',
        'Ogg Theora': 'video/ogg; codecs="theora"'
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
            'video/webm', 'video/mp4', 'video/x-matroska', 
            'audio/webm', 'audio/ogg'
        ];
        
        const recorderSupport = recorderTypes
            .filter(t => MediaRecorder.isTypeSupported(t))
            .join(', ');
            
        supported['MediaRecorder Types'] = recorderSupport || 'None';
    }

    return supported;
}
