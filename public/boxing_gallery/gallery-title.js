// One texture, one draw: an antialiased type mask and its signed distance field.
// The DOM wordmark remains the fallback until the first successful WebGL frame.
const VERTEX_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SOURCE = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_mask;
uniform vec2 u_fieldSize;
uniform float u_range;
uniform float u_time;
uniform float u_activity;
uniform float u_still;

float distanceAt(vec2 uv) {
  return (texture2D(u_mask, uv).g * 2.0 - 1.0) * u_range;
}

void main() {
  vec2 texel = 1.0 / u_fieldSize;
  vec2 uv = v_uv;
  vec2 p = (uv - 0.5) * vec2(u_fieldSize.x / u_fieldSize.y, 1.0);
  vec4 field = texture2D(u_mask, uv);
  float ink = field.r;
  float d = (field.g * 2.0 - 1.0) * u_range;
  float scale = u_fieldSize.y / 620.0;
  float outside = max(-d, 0.0) / scale;
  float inside = max(d, 0.0) / scale;

  // A planted beat, a shorter counter-step, and a small shoulder feint.
  // Neither the glyph geometry nor its opacity pulses with this rhythm.
  float beat = u_time * 1.08;
  float step = sin(beat) * 0.72 + sin(beat * 2.0 + 0.62) * 0.17;
  float feint = sin(beat * 3.0 - 0.4) * 0.035;
  float bounce = abs(sin(beat * 2.0 + 0.25));
  float travel = mix(step + feint, 0.27, u_still);
  vec2 key = vec2(travel * 0.84, 0.27 + bounce * 0.055);
  vec2 counter = vec2(-travel * 0.70 - 0.16, -0.30 - bounce * 0.026);

  vec2 gradient = vec2(
    distanceAt(uv + vec2(texel.x * 2.0, 0.0)) - distanceAt(uv - vec2(texel.x * 2.0, 0.0)),
    distanceAt(uv + vec2(0.0, texel.y * 2.0)) - distanceAt(uv - vec2(0.0, texel.y * 2.0))
  );
  vec2 normal = -gradient / max(length(gradient), 0.025);
  vec2 keyDirection = (key - p) / max(length(key - p), 0.001);
  vec2 counterDirection = (counter - p) / max(length(counter - p), 0.001);
  float keyEdge = pow(max(dot(normal, keyDirection), 0.0), 1.6);
  float counterEdge = pow(max(dot(normal, counterDirection), 0.0), 1.9);
  float keyBand = exp(-pow((p.x - key.x + p.y * 0.27) / 0.34, 2.0));
  float counterBand = exp(-pow((p.x - counter.x - p.y * 0.18) / 0.27, 2.0));
  float edgeLight = keyBand * (0.24 + keyEdge * 0.95)
                  + counterBand * (0.12 + counterEdge * 0.56);

  // Broad ivory faces keep the two words readable between the passing lights.
  vec3 ivory = vec3(0.865, 0.852, 0.811);
  vec3 silver = vec3(0.995, 0.988, 0.947);
  vec3 gold = vec3(0.91, 0.73, 0.46);
  float faceRoll = smoothstep(-0.29, 0.32, p.y);
  vec3 face = ivory * (0.89 + faceRoll * 0.10);
  face += silver * keyBand * 0.095;
  face += gold * counterBand * 0.034;
  float bevel = exp(-inside / 2.2);
  face = mix(face, silver, clamp(bevel * edgeLight * 0.65, 0.0, 0.76));
  face += gold * bevel * counterEdge * counterBand * 0.055;
  face = min(face, vec3(1.0));

  // Offset contour echoes suggest a feint without duplicating the letter faces.
  float echoTravel = mix(sin(beat * 2.0) * 1.8, 0.0, u_still);
  vec2 echoA = vec2(7.0 + echoTravel, -3.2) * scale * texel;
  vec2 echoB = vec2(-11.5 + echoTravel * 0.45, 5.1) * scale * texel;
  float echoDistanceA = abs(distanceAt(uv + echoA)) / scale;
  float echoDistanceB = abs(distanceAt(uv + echoB)) / scale;
  float echo = exp(-echoDistanceA / 0.74) * (0.052 + counterBand * 0.057)
             + exp(-echoDistanceB / 0.82) * (0.027 + keyBand * 0.035);
  echo *= 0.65 + u_activity * 0.35;

  float halo = exp(-outside / 12.5) * edgeLight * 0.20
             + exp(-outside / 25.0) * keyBand * 0.033;
  float rim = exp(-outside / 1.35) * edgeLight * 0.29;
  // The field has finite range: fade it to literal transparency before its edge.
  // This also lets the whole canvas dock over a light background without a box.
  float reach = 1.0 - smoothstep(u_range * 0.72, u_range * 0.98, max(-d, 0.0));
  float glow = clamp((halo + rim + echo) * reach, 0.0, 0.72) * (1.0 - ink);
  vec3 glowColor = mix(gold, silver, 0.38 + keyBand * 0.38);
  float alpha = ink + glow;
  gl_FragColor = vec4(face * ink + glowColor * glow, alpha);
}`;

// Exact squared Euclidean distance transform. The temporary line buffers are
// reused, keeping allocation outside the row/column loops.
function distanceTransform(grid, width, height) {
  const longest = Math.max(width, height);
  const line = new Float64Array(longest);
  const result = new Float64Array(longest);
  const sites = new Int32Array(longest);
  const boundaries = new Float64Array(longest + 1);

  function transformLine(length) {
    let k = 0;
    sites[0] = 0;
    boundaries[0] = -Infinity;
    boundaries[1] = Infinity;
    for (let q = 1; q < length; q += 1) {
      let intersection;
      do {
        const previous = sites[k];
        intersection = ((line[q] + q * q) - (line[previous] + previous * previous)) / (2 * (q - previous));
        if (intersection > boundaries[k]) break;
        k -= 1;
      } while (k >= 0);
      k += 1;
      sites[k] = q;
      boundaries[k] = intersection;
      boundaries[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < length; q += 1) {
      while (boundaries[k + 1] < q) k += 1;
      const offset = q - sites[k];
      result[q] = offset * offset + line[sites[k]];
    }
  }

  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) line[y] = grid[y * width + x];
    transformLine(height);
    for (let y = 0; y < height; y += 1) grid[y * width + x] = result[y];
  }
  for (let y = 0; y < height; y += 1) {
    const start = y * width;
    for (let x = 0; x < width; x += 1) line[x] = grid[start + x];
    transformLine(width);
    for (let x = 0; x < width; x += 1) grid[start + x] = result[x];
  }
}

function createTypeField(document, width, height) {
  const surface = document.createElement('canvas');
  surface.width = width;
  surface.height = height;
  const context = surface.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('A 2D text mask could not be created.');
  const words = ['BOXING', 'GALLERY'];
  let fontSize = height * 0.40;
  let tracking = -fontSize * 0.04;
  context.font = `700 ${fontSize}px "DM Sans", Arial, sans-serif`;
  const wordWidth = word => context.measureText(word).width + tracking * (word.length - 1);
  const widest = Math.max(...words.map(wordWidth));
  fontSize *= Math.min(1, width * 0.84 / widest);
  tracking = -fontSize * 0.04;
  context.font = `700 ${fontSize}px "DM Sans", Arial, sans-serif`;
  context.fillStyle = '#fff';
  context.textBaseline = 'alphabetic';
  const metrics = words.map(word => {
    const metric = context.measureText(word);
    return {
      ascent: metric.actualBoundingBoxAscent || fontSize * 0.73,
      descent: Math.max(0, metric.actualBoundingBoxDescent || 0),
    };
  });
  const gap = fontSize * 0.095;
  const totalHeight = metrics.reduce((sum, metric) => sum + metric.ascent + metric.descent, gap);
  let top = (height - totalHeight) * 0.5;
  words.forEach((word, index) => {
    const left = (width - wordWidth(word)) * 0.5;
    const baseline = top + metrics[index].ascent;
    for (let character = 0; character < word.length; character += 1) {
      // Prefix metrics retain the font's kerning while adding tight tracking.
      const prefixWidth = context.measureText(word.slice(0, character + 1)).width;
      const glyphWidth = context.measureText(word[character]).width;
      context.fillText(word[character], left + prefixWidth - glyphWidth + tracking * character, baseline);
    }
    top += metrics[index].ascent + metrics[index].descent + gap;
  });

  const pixels = context.getImageData(0, 0, width, height).data;
  const count = width * height;
  const toInk = new Float64Array(count);
  const toPaper = new Float64Array(count);
  const infinity = 1e12;
  for (let index = 0; index < count; index += 1) {
    const alpha = pixels[index * 4 + 3] / 255;
    toInk[index] = alpha === 1 ? 0 : alpha === 0 ? infinity : Math.max(0, 0.5 - alpha) ** 2;
    toPaper[index] = alpha === 0 ? 0 : alpha === 1 ? infinity : Math.max(0, alpha - 0.5) ** 2;
  }
  distanceTransform(toInk, width, height);
  distanceTransform(toPaper, width, height);
  const range = Math.max(24, Math.min(width, height) * 0.09);
  const data = new Uint8Array(count * 4);
  for (let index = 0; index < count; index += 1) {
    const signed = Math.sqrt(toPaper[index]) - Math.sqrt(toInk[index]);
    const offset = index * 4;
    data[offset] = pixels[offset + 3];
    data[offset + 1] = Math.round(Math.max(0, Math.min(1, signed / (range * 2) + 0.5)) * 255);
    data[offset + 3] = 255;
  }
  // The typed-array texture is bottom-up, matching WebGL's UV convention.
  const stride = width * 4;
  const row = new Uint8Array(stride);
  for (let y = 0; y < Math.floor(height / 2); y += 1) {
    const first = y * stride;
    const last = (height - y - 1) * stride;
    row.set(data.subarray(first, first + stride));
    data.copyWithin(first, last, last + stride);
    data.set(row, last);
  }
  return { data, width, height, range };
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('A title shader could not be allocated.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'A title shader could not be compiled.';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

/**
 * Attach the title to an existing, CSS-sized canvas. Activity controls the light
 * rhythm and rendering lifecycle; the caller owns opacity and docking geometry.
 */
export function createGalleryTitle(canvas, { reducedMotion = false } = {}) {
  const inert = { setActivity() {}, destroy() {} };
  if (!canvas || typeof canvas.getContext !== 'function') return inert;
  const document = canvas.ownerDocument;
  const window = document.defaultView;
  if (!window) return inert;
  const host = canvas.parentElement;
  let gl;
  try {
    gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: 'low-power',
    });
  } catch (_) { return inert; }
  if (!gl) return inert;

  let destroyed = false;
  let lost = false;
  let failed = false;
  let resources = null;
  let field = null;
  let fieldDirty = true;
  let resizeFrame = 0;
  let frame = 0;
  let previousTime = 0;
  let time = 1.8;
  let activity = 1;
  let visible = !document.hidden;
  let intersecting = true;
  let maxTextureSize = 2048;
  let maxBufferSize = 2048;
  let firstFrame = true;

  function releaseResources() {
    if (!resources || lost) { resources = null; return; }
    gl.deleteTexture(resources.texture);
    gl.deleteBuffer(resources.buffer);
    gl.deleteProgram(resources.program);
    resources = null;
  }

  function stop() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }

  function fail(error) {
    if (destroyed || lost) return;
    failed = true;
    stop();
    host?.classList.remove('shader-ready');
    releaseResources();
    if (window.console?.warn) window.console.warn('Gallery title is using its text fallback.', error);
  }

  function initialize() {
    let vertex = null;
    let fragment = null;
    let program = null;
    let buffer = null;
    let texture = null;
    try {
      vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SOURCE);
      fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SOURCE);
      program = gl.createProgram();
      if (!program) throw new Error('A title program could not be allocated.');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Title program linking failed.');
      buffer = gl.createBuffer();
      texture = gl.createTexture();
      if (!buffer || !texture) throw new Error('Title GPU resources could not be allocated.');
      const uniforms = {};
      for (const name of ['u_mask', 'u_fieldSize', 'u_range', 'u_time', 'u_activity', 'u_still']) {
        uniforms[name] = gl.getUniformLocation(program, name);
      }
      resources = { program, buffer, texture, uniforms, position: gl.getAttribLocation(program, 'a_position') };
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      maxTextureSize = Math.max(1, gl.getParameter(gl.MAX_TEXTURE_SIZE));
      maxBufferSize = Math.max(1, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.BLEND);
      failed = false;
      firstFrame = true;
      fieldDirty = true;
    } catch (error) {
      if (texture) gl.deleteTexture(texture);
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
      resources = null;
      throw error;
    } finally {
      if (vertex) gl.deleteShader(vertex);
      if (fragment) gl.deleteShader(fragment);
    }
  }

  function resizeAndUpload() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width < 2 || height < 2) return false;
    let ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    ratio = Math.min(ratio, Math.min(1800, maxBufferSize) / Math.max(width, height), Math.sqrt(1600000 / (width * height)));
    const renderWidth = Math.max(1, Math.round(width * ratio));
    const renderHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
      canvas.width = renderWidth;
      canvas.height = renderHeight;
    }
    const fieldRatio = Math.min(ratio, Math.min(1400, maxTextureSize) / Math.max(width, height));
    const fieldWidth = Math.max(2, Math.round(width * fieldRatio));
    const fieldHeight = Math.max(2, Math.round(height * fieldRatio));
    if (fieldDirty || !field || field.width !== fieldWidth || field.height !== fieldHeight) {
      field = createTypeField(document, fieldWidth, fieldHeight);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, resources.texture);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, field.width, field.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, field.data);
      fieldDirty = false;
      firstFrame = true;
    }
    return true;
  }

  function draw() {
    if (destroyed || lost || failed || !resources) return false;
    try {
      if (!resizeAndUpload()) return false;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(resources.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, resources.buffer);
      gl.enableVertexAttribArray(resources.position);
      gl.vertexAttribPointer(resources.position, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, resources.texture);
      gl.uniform1i(resources.uniforms.u_mask, 0);
      gl.uniform2f(resources.uniforms.u_fieldSize, field.width, field.height);
      gl.uniform1f(resources.uniforms.u_range, field.range);
      gl.uniform1f(resources.uniforms.u_time, time);
      gl.uniform1f(resources.uniforms.u_activity, reducedMotion ? 0 : activity);
      gl.uniform1f(resources.uniforms.u_still, reducedMotion || activity === 0 ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      // Synchronize only the first frame/upload; avoid a GPU query every frame.
      if (firstFrame) {
        const error = gl.getError();
        if (error !== gl.NO_ERROR || gl.isContextLost()) throw new Error(`Title draw failed (${error}).`);
        host?.classList.add('shader-ready');
        firstFrame = false;
      }
      return true;
    } catch (error) {
      fail(error);
      return false;
    }
  }

  function canAnimate() {
    return !destroyed && !lost && !failed && !reducedMotion && activity > 0 && visible && intersecting;
  }

  function tick(timestamp) {
    frame = 0;
    if (!canAnimate()) return;
    if (previousTime) time += Math.min((timestamp - previousTime) / 1000, 0.05) * (0.32 + activity * 0.68);
    previousTime = timestamp;
    const painted = draw();
    if (painted && canAnimate()) frame = window.requestAnimationFrame(tick);
  }

  function resume() {
    if (canAnimate() && !frame) frame = window.requestAnimationFrame(tick);
  }

  function requestDraw() {
    if (destroyed || lost || failed || resizeFrame) return;
    resizeFrame = window.requestAnimationFrame(() => {
      resizeFrame = 0;
      if (visible && intersecting) draw();
      resume();
    });
  }

  function onVisibility() {
    visible = !document.hidden;
    if (visible) requestDraw();
    else stop();
  }

  function onContextLost(event) {
    event.preventDefault();
    lost = true;
    stop();
    if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
    resizeFrame = 0;
    resources = null;
    host?.classList.remove('shader-ready');
  }

  function onContextRestored() {
    if (destroyed) return;
    lost = false;
    try { initialize(); requestDraw(); } catch (error) { fail(error); }
  }

  canvas.addEventListener('webglcontextlost', onContextLost, false);
  canvas.addEventListener('webglcontextrestored', onContextRestored, false);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', requestDraw, { passive: true });
  const resizeObserver = typeof window.ResizeObserver === 'function' ? new window.ResizeObserver(requestDraw) : null;
  resizeObserver?.observe(canvas);
  const intersectionObserver = typeof window.IntersectionObserver === 'function' ? new window.IntersectionObserver(entries => {
    intersecting = entries.some(entry => entry.isIntersecting);
    if (intersecting) requestDraw();
    else stop();
  }) : null;
  intersectionObserver?.observe(canvas);

  try { initialize(); requestDraw(); } catch (error) { fail(error); }

  // Keep the fallback font usable immediately, then replace its mask once the
  // page's actual DM Sans face is available. A destroyed/lost context stays inert.
  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      if (destroyed) return;
      fieldDirty = true;
      requestDraw();
    }).catch(() => {});
  }

  return {
    setActivity(value) {
      if (destroyed) return;
      const numeric = Number(value);
      const next = Number.isFinite(numeric) ? Math.max(0, Math.min(1, numeric)) : 0;
      if (next === activity) return;
      activity = next;
      if (activity === 0) {
        stop();
        requestDraw();
      } else resume();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      stop();
      if (resizeFrame) window.cancelAnimationFrame(resizeFrame);
      resizeFrame = 0;
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener('webglcontextlost', onContextLost, false);
      canvas.removeEventListener('webglcontextrestored', onContextRestored, false);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('resize', requestDraw);
      host?.classList.remove('shader-ready');
      releaseResources();
      field = null;
    },
  };
}
