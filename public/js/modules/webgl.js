/**
 * WebGL information collection module
 */

/**
 * Collects WebGL capabilities and GPU information
 * @returns {Object} WebGL data object
 */
export function collectWebGLData() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    let webglData = {};

    if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        webglData['WebGL Supported'] = 'Yes';
        webglData['Vendor'] = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
        webglData['Renderer'] = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
        webglData['Shading Language Version'] = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
        webglData['Version'] = gl.getParameter(gl.VERSION);
        webglData['Max Texture Size'] = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        webglData['Max Cube Map Texture Size'] = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
        webglData['Max Renderbuffer Size'] = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
        webglData['Max Viewport Dims'] = gl.getParameter(gl.MAX_VIEWPORT_DIMS).join(' x ');
        
        const extensions = gl.getSupportedExtensions();
        webglData['Supported Extensions'] = extensions.length + ' extensions';
        webglData['Extensions List'] = extensions.join(', ');
        
    } else {
        webglData['WebGL'] = 'Not Supported';
    }

    return webglData;
}
