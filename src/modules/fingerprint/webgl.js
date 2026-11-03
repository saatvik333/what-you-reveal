/**
 * WebGL card: GPU identity, render hash, limits and WebGPU adapter info.
 * This is the only module that reads GPU details, so the device card does not repeat them.
 */

import { cyrb53 } from '../../utils/crypto.js';

const MDN = 'https://developer.mozilla.org/en-US/docs/Web/API/';

const VERTEX_SHADER = `
  attribute vec2 position;
  varying vec2 vPos;
  void main() {
    vPos = position;
    gl_Position = vec4(position, 0.0, 1.0);
  }`;

const FRAGMENT_SHADER = `
  precision mediump float;
  varying vec2 vPos;
  void main() {
    gl_FragColor = vec4(sin(vPos.x * 10.0) * 0.5 + 0.5, cos(vPos.y * 10.0) * 0.5 + 0.5,
                        sin(vPos.x * vPos.y * 5.0) * 0.5 + 0.5, 1.0);
  }`;

/** Draws a shaded triangle and hashes the pixels; shader math and rasterization vary by GPU and driver. */
function renderHash(gl) {
  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const vs = compile(gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return 'Shader Error';
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-0.8, -0.8, 0.8, -0.8, 0.0, 0.8]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  gl.clearColor(0.2, 0.4, 0.6, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  const { drawingBufferWidth: w, drawingBufferHeight: h } = gl;
  const pixels = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  return cyrb53(pixels.join(',')).toString(16).toUpperCase();
}

function gpuTier(maxTexture, maxTextureUnits, maxVertexAttribs) {
  if (maxTexture >= 16384 && maxTextureUnits >= 32 && maxVertexAttribs >= 16) return 'High';
  if (maxTexture >= 8192 && maxTextureUnits >= 16) return 'Medium';
  return 'Low';
}

async function webGPURow() {
  const url = `${MDN}WebGPU_API`;
  if (!('gpu' in navigator)) return { value: 'Not Supported', url };
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { value: 'Supported (no adapter available)', url };
    // `adapter.info` replaced the removed requestAdapterInfo() (Chrome 131+).
    const info = adapter.info ?? (await adapter.requestAdapterInfo?.());
    const details = [info?.vendor, info?.architecture, info?.device, info?.description].filter(Boolean).join(' / ');
    return { value: details ? `Supported (${details})` : 'Supported', warning: Boolean(details), url: `${MDN}GPUAdapterInfo` };
  } catch {
    return { value: 'Supported (adapter request failed)', url };
  }
}

export async function collectWebGLData() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) return { 'WebGL': { value: 'Not Supported', url: `${MDN}WebGL_API` }, 'WebGPU': await webGPURow() };

  try {
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : null;
    const maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
    const maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
    const software = /SwiftShader|llvmpipe|softpipe|Software/i.test(renderer ?? '');

    const data = {
      'WebGL Version': { value: gl.getParameter(gl.VERSION), url: `${MDN}WebGLRenderingContext/getParameter` },
      'Shading Language': { value: gl.getParameter(gl.SHADING_LANGUAGE_VERSION), url: `${MDN}WebGLRenderingContext/getParameter` },
      'GPU Vendor': {
        value: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Hidden',
        url: `${MDN}WEBGL_debug_renderer_info`,
      },
      'GPU Renderer': { value: renderer ?? 'Hidden', warning: Boolean(renderer), url: `${MDN}WEBGL_debug_renderer_info` },
      'Hardware Acceleration': renderer === null
        ? { value: 'Unknown (renderer hidden)' }
        : software
          ? { value: 'Off (software rendering)', warning: true }
          : { value: 'On' },
      'Render Hash': { value: renderHash(gl), warning: true, url: `${MDN}WebGLRenderingContext/readPixels` },
      'GPU Tier (Est.)': { value: gpuTier(maxTexture, maxTextureUnits, maxVertexAttribs) },
      'Max Texture Size': { value: maxTexture },
      'Max Viewport': { value: [...gl.getParameter(gl.MAX_VIEWPORT_DIMS)].join(' x ') },
      'Max Texture Units': { value: maxTextureUnits },
      'Max Vertex Attribs': { value: maxVertexAttribs },
      'Antialiasing': { value: gl.getContextAttributes()?.antialias ? 'On' : 'Off' },
      'Extensions': {
        value: `${(gl.getSupportedExtensions() ?? []).length} supported`,
        url: `${MDN}WebGLRenderingContext/getSupportedExtensions`,
      },
    };
    if (typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext) {
      data['Max Samples (MSAA)'] = { value: gl.getParameter(gl.MAX_SAMPLES) };
    }
    data['WebGPU'] = await webGPURow();
    return data;
  } finally {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
