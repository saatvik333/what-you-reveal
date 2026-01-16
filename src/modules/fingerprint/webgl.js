/**
 * WebGL Render Engine Fingerprinting Module
 * Captures GPU details, Render Hash, and WebGPU support
 */

import { cyrb53 } from '../../utils/crypto';

/**
 * Generates a unique hash by rendering a 2D scene
 */
function getWebGLRenderFingerprint(gl, canvas) {
  try {
      gl.clearColor(0.2, 0.4, 0.6, 1.0); 
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Shaders
      const vsSource = `
          attribute vec2 position;
          varying vec2 vPos;
          void main() {
              vPos = position;
              gl_Position = vec4(position, 0.0, 1.0);
          }
      `;
      const fsSource = `
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

      const vs = gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs, vsSource);
      gl.compileShader(vs);

      const fs = gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs, fsSource);
      gl.compileShader(fs);

      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      gl.useProgram(prog);

      // Triangle
      const vertices = new Float32Array([-0.8, -0.8, 0.8, -0.8, 0.0, 0.8]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

      const posLoc = gl.getAttribLocation(prog, 'position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // Hash
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      
      // Clean
      gl.deleteBuffer(buffer);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);

      return cyrb53(pixels.toString()).toString(16).toUpperCase();
  } catch(e) {
      return 'Error';
  }
}

function getShaderPrecision(gl, shaderType, precisionType) {
    try {
        const format = gl.getShaderPrecisionFormat(shaderType, precisionType);
        return format ? `${format.rangeMin},${format.rangeMax},${format.precision}` : 'N/A';
    } catch(e) { return 'N/A'; }
}

export async function collectWebGLData() {
  const canvas = document.createElement('canvas');
  canvas.width = 64; 
  canvas.height = 64; // Small canvas for fingerprinting speed
  
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const data = {};

  if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const isWebGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;

      // 1. Core Info
      data['WebGL Version'] = {
          value: gl.getParameter(gl.VERSION),
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter'
      };
      
      data['Shading Language'] = {
          value: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API'
      };

      data['Renderer Vendor'] = {
          value: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown',
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info'
      };
      
      data['Renderer Model'] = {
          value: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown',
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info'
      };

      // 2. Render Fingerprint
      data['Render Hash (64x64)'] = {
          value: getWebGLRenderFingerprint(gl, canvas),
          warning: true, // Unique
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/readPixels'
      };

      // 3. Limits
      data['Max Texture Size'] = { value: gl.getParameter(gl.MAX_TEXTURE_SIZE) };
      data['Max Viewport'] = { value: gl.getParameter(gl.MAX_VIEWPORT_DIMS).join('x') };
      data['Antialiasing'] = { value: gl.getContextAttributes().antialias ? 'Supported' : 'No' };
      
      // 4. Extensions
      const extensions = gl.getSupportedExtensions() || [];
      data['Supported Extensions'] = {
          value: extensions.length + ' extensions detected',
          url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getSupportedExtensions'
      };

      // 5. WebGPU (Next Gen)
      if ('gpu' in navigator) {
          try {
              const adapter = await navigator.gpu.requestAdapter();
              const info = adapter ? await adapter.requestAdapterInfo() : null;
              data['WebGPU Support'] = {
                  value: 'Supported' + (info ? ` (${info.device})` : ''),
                  url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API'
              };
          } catch(e) {
              data['WebGPU Support'] = { value: 'Supported (Blocked)', warning: true };
          }
      } else {
          data['WebGPU Support'] = { value: 'Not Supported' };
      }

  } else {
      data['WebGL Support'] = { value: 'Not Supported' };
  }

  return data;
}
