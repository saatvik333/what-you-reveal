/**
 * WebGL information collection module
 * Enhanced with WebGL2, shader precision, and render fingerprinting
 */

import { cyrb53 } from './crypto.js';

/**
 * Gets shader precision format for a given shader type and precision
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {number} shaderType - VERTEX_SHADER or FRAGMENT_SHADER
 * @param {number} precisionType - HIGH_FLOAT, MEDIUM_FLOAT, etc.
 * @returns {string} Precision format string
 */
function getShaderPrecision(gl, shaderType, precisionType) {
  try {
    const format = gl.getShaderPrecisionFormat(shaderType, precisionType);
    if (format) {
      return `${format.rangeMin},${format.rangeMax},${format.precision}`;
    }
  } catch (e) {
    /* ignore */
  }
  return 'N/A';
}

/**
 * Generates a WebGL render fingerprint by drawing a 3D scene
 * @param {WebGLRenderingContext} gl - WebGL context
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {string} Hash of rendered pixels
 */
function getWebGLRenderFingerprint(gl, canvas) {
  try {
    // Set viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Clear with a specific color
    gl.clearColor(0.2, 0.4, 0.6, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Create shaders
    const vertexShaderSource = `
            attribute vec2 position;
            varying vec2 vPos;
            void main() {
                vPos = position;
                gl_Position = vec4(position, 0.0, 1.0);
            }
        `;

    const fragmentShaderSource = `
            precision mediump float;
            varying vec2 vPos;
            void main() {
                gl_FragColor = vec4(
                    sin(vPos.x * 10.0) * 0.5 + 0.5,
                    cos(vPos.y * 10.0) * 0.5 + 0.5,
                    sin(vPos.x * vPos.y * 5.0) * 0.5 + 0.5,
                    1.0
                );
            }
        `;

    // Compile vertex shader
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    // Compile fragment shader
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    // Create triangle vertices
    const vertices = new Float32Array([-0.8, -0.8, 0.8, -0.8, 0.0, 0.8]);

    // Create buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // Set up attribute
    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Read pixels and hash
    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    // Clean up
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);

    // Hash the pixel data
    return cyrb53(pixels.toString()).toString(16);
  } catch (e) {
    return 'Error';
  }
}

/**
 * Collects WebGL capabilities and GPU information
 * @returns {Object} WebGL data object
 */
export function collectWebGLData() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const gl2 = canvas.getContext('webgl2');

  const webglData = {};

  if (gl) {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

    // Basic Info
    webglData['WebGL Supported'] = 'Yes';
    webglData['WebGL2 Supported'] = gl2 ? 'Yes' : 'No';
    webglData['Vendor'] = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
    webglData['Renderer'] = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : 'Unknown';
    webglData['Shading Language Version'] = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
    webglData['Version'] = gl.getParameter(gl.VERSION);

    // Texture Limits
    webglData['Max Texture Size'] = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    webglData['Max Cube Map Texture Size'] = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
    webglData['Max Renderbuffer Size'] = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    webglData['Max Viewport Dims'] = gl.getParameter(gl.MAX_VIEWPORT_DIMS).join(' x ');
    webglData['Max Vertex Attribs'] = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    webglData['Max Varying Vectors'] = gl.getParameter(gl.MAX_VARYING_VECTORS);
    webglData['Max Vertex Uniform Vectors'] = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
    webglData['Max Fragment Uniform Vectors'] = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    webglData['Max Vertex Texture Image Units'] = gl.getParameter(
      gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS
    );
    webglData['Max Texture Image Units'] = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
    webglData['Max Combined Texture Image Units'] = gl.getParameter(
      gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS
    );

    // Shader Precision (Fingerprinting gold - varies per GPU)
    webglData['Vertex High Float Precision'] = getShaderPrecision(
      gl,
      gl.VERTEX_SHADER,
      gl.HIGH_FLOAT
    );
    webglData['Vertex Medium Float Precision'] = getShaderPrecision(
      gl,
      gl.VERTEX_SHADER,
      gl.MEDIUM_FLOAT
    );
    webglData['Fragment High Float Precision'] = getShaderPrecision(
      gl,
      gl.FRAGMENT_SHADER,
      gl.HIGH_FLOAT
    );
    webglData['Fragment Medium Float Precision'] = getShaderPrecision(
      gl,
      gl.FRAGMENT_SHADER,
      gl.MEDIUM_FLOAT
    );

    // Antialiasing
    webglData['Antialias'] = gl.getContextAttributes()?.antialias ? 'Yes' : 'No';

    // Render Fingerprint (Most unique - actual GPU rendering differences)
    webglData['Render Fingerprint'] = {
      value: getWebGLRenderFingerprint(gl, canvas).toUpperCase(),
      warning: true,
    };

    // Extensions
    const extensions = gl.getSupportedExtensions() || [];
    webglData['Supported Extensions'] = extensions.length + ' extensions';
    webglData['Extensions List'] = extensions.join(', ');

    // WebGL2 specific parameters
    if (gl2) {
      webglData['WebGL2 Max 3D Texture Size'] = gl2.getParameter(gl2.MAX_3D_TEXTURE_SIZE);
      webglData['WebGL2 Max Array Texture Layers'] = gl2.getParameter(gl2.MAX_ARRAY_TEXTURE_LAYERS);
      webglData['WebGL2 Max Draw Buffers'] = gl2.getParameter(gl2.MAX_DRAW_BUFFERS);
      webglData['WebGL2 Max Color Attachments'] = gl2.getParameter(gl2.MAX_COLOR_ATTACHMENTS);
      webglData['WebGL2 Max Samples'] = gl2.getParameter(gl2.MAX_SAMPLES);
    }
  } else {
    webglData['WebGL'] = 'Not Supported';
  }

  return webglData;
}
