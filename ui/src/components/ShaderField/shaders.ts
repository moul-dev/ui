/**
 * GLSL for `<moul-shader-field>`, written for WebGL 1 (GLSL ES 1.00) so it
 * runs wherever WebGL does.
 *
 * Noise comes from a 32 × 32 texture of random values sampled with hardware
 * bilinear filtering and smoothed coordinates: one texture read per octave,
 * which is the cheapest smooth noise a phone's GPU can draw. The texture
 * repeats every 32 lattice cells, so every coordinate is wrapped into
 * [0, 32) before it is sampled; wrapping keeps the numbers small (safe
 * where only `mediump` precision exists) and is seamless because the noise
 * is periodic. Drift offsets are wrapped the same way on the CPU, so time
 * can run forever without losing precision.
 */

export type ShaderFieldVariant = 'dither' | 'clouds'

/** The period of the noise, in lattice cells: the noise texture's size. */
export const NOISE_PERIOD = 32

/** Octaves of noise per variant: few for the dither (it is quantised anyway), more for soft clouds. */
export const OCTAVES: Record<ShaderFieldVariant, number> = {
  dither: 3,
  clouds: 5,
}

/** Octaves for the clouds' warp layers, which only bend the clouds and need no fine detail. */
export const WARP_OCTAVES = 3

/** Uniforms every variant reads, set once per frame. */
export const UNIFORMS = [
  'u_noise',
  'u_resolution',
  'u_ratio',
  'u_drift1',
  'u_drift2',
  'u_drift3',
  'u_frequency',
  'u_density',
  'u_c0',
  'u_c1',
  'u_c2',
  'u_c3',
  'u_count',
  'u_cell',
  'u_shape',
  'u_pointer',
  'u_pointer_strength',
  'u_pointer_radius',
] as const

export type ShaderFieldUniform = (typeof UNIFORMS)[number]

export const VERTEX_SOURCE = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

/** GLSL ES 1.00 needs constant loop bounds, so each octave count gets its own function. */
function fbmFunction(name: string, octaves: string): string {
  return `float ${name}(vec2 p, vec4 channel) {
  float value = 0.0;
  float amplitude = 0.5;
  float total = 0.0;
  for (int i = 0; i < ${octaves}; i++) {
    value += amplitude * noise(p, channel);
    total += amplitude;
    p = mod(p * 2.0 + vec2(13.7, 7.3), PERIOD);
    amplitude *= 0.5;
  }
  return value / total;
}`
}

const HEADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform sampler2D u_noise;
uniform vec2 u_resolution;   // drawing buffer, device pixels
uniform float u_ratio;       // device pixels per CSS pixel
uniform vec2 u_drift1;       // wrapped drift offsets, lattice cells
uniform vec2 u_drift2;
uniform vec2 u_drift3;
uniform float u_frequency;   // lattice cells per CSS pixel
uniform float u_density;     // 0 to 1
uniform vec4 u_c0;           // palette, straight sRGB + alpha
uniform vec4 u_c1;
uniform vec4 u_c2;
uniform vec4 u_c3;
uniform float u_count;       // colours in use, 2 to 4
uniform float u_cell;        // dither cell, CSS pixels
uniform float u_shape;       // 0 square, 1 dot
uniform vec2 u_pointer;      // CSS pixels from the top left
uniform float u_pointer_strength; // 0 to 1, eased
uniform float u_pointer_radius;   // CSS pixels

const float PERIOD = ${NOISE_PERIOD.toFixed(1)};
const float WARP = 0.8;     // how far the clouds' warp layers bend them, lattice cells

// Smooth value noise in [0, 1] from one bilinear texture read.
float noise(vec2 p, vec4 channel) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return dot(texture2D(u_noise, (i + f + 0.5) / PERIOD), channel);
}

// Fractal noise in [0, 1]: fbm with OCTAVES octaves, fbmWarp with WARP_OCTAVES.
// Lacunarity is exactly 2 so wrapping stays seamless.
${fbmFunction('fbm', 'OCTAVES')}
${fbmFunction('fbmWarp', 'WARP_OCTAVES')}
// Position in CSS pixels from the top left, as the page sees it.
vec2 cssPosition() {
  vec2 device = vec2(gl_FragCoord.x, u_resolution.y - gl_FragCoord.y);
  return device / u_ratio;
}

// Eased pointer influence at a CSS position: 1 under the pointer, 0 far away.
float pointerInfluence(vec2 css) {
  if (u_pointer_strength <= 0.0) return 0.0;
  vec2 d = (css - u_pointer) / max(u_pointer_radius, 1.0);
  return u_pointer_strength * exp(-dot(d, d) * 2.0);
}

// Picks palette entry 0 to 3 without dynamic indexing (not allowed in GLSL ES 1.00).
vec4 palette(float level) {
  vec4 color = u_c0;
  color = mix(color, u_c1, step(0.5, level));
  color = mix(color, u_c2, step(1.5, level));
  color = mix(color, u_c3, step(2.5, level));
  return color;
}

// A tiny grain, half a step of 8-bit colour, so soft gradients do not band.
float grain() {
  return (texture2D(u_noise, gl_FragCoord.xy / PERIOD).w - 0.5) / 255.0;
}
`

const DITHER_MAIN = `
// Ordered 8 × 8 Bayer threshold in [0, 1), built from the 2 × 2 matrix.
float bayer2(vec2 a) {
  a = floor(a);
  return fract(dot(a, vec2(0.5, a.y * 0.75)));
}
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

void main() {
  vec2 css = cssPosition();
  vec2 cell = floor(css / u_cell);
  vec2 centre = (cell + 0.5) * u_cell;

  // The field, sampled once per cell at its centre so a cell is one colour.
  vec2 p = mod(centre * u_frequency + u_drift1, PERIOD);
  vec2 q = mod(centre * u_frequency * 0.5 + u_drift2, PERIOD);
  float field = fbm(p, vec4(1.0, 0.0, 0.0, 0.0)) * 0.65
    + fbm(q, vec4(0.0, 1.0, 0.0, 0.0)) * 0.35;
  // Stretch the narrow band fbm lives in, then let density lift or lower it.
  field = smoothstep(0.28, 0.72, field) + (u_density - 0.5) * 0.9;
  field += pointerInfluence(centre) * 0.6;
  field = clamp(field, 0.0, 1.0);

  float levels = u_count - 1.0;
  float scaled = field * levels;
  float threshold = bayer8(cell);
  float level = min(floor(scaled) + step(threshold, fract(scaled)), levels);
  vec4 ink = palette(level);

  vec4 color = ink;
  if (u_shape > 0.5) {
    // A round dot on the first colour, larger where the field is stronger.
    vec2 local = (css - centre) / u_cell;
    float radius = mix(0.2, 0.46, field);
    float edge = 0.75 / (u_cell * u_ratio);
    float cover = 1.0 - smoothstep(radius - edge, radius + edge, length(local));
    cover *= step(0.5, level);
    color = mix(u_c0, ink, cover);
  }
  gl_FragColor = vec4(color.rgb * color.a, color.a);
}
`

const CLOUDS_MAIN = `
void main() {
  vec2 css = cssPosition();
  vec2 uv = css / max(u_resolution / u_ratio, vec2(1.0));
  vec2 p = css * u_frequency;

  // The pointer parts the clouds a little and lights them.
  float touch = pointerInfluence(css);
  vec2 away = css - u_pointer;
  p += touch * 0.6 * away / max(length(away), 1.0);

  // Domain warping: the clouds' own noise bends where the noise is read.
  vec2 q = vec2(
    fbmWarp(mod(p + u_drift1, PERIOD), vec4(1.0, 0.0, 0.0, 0.0)),
    fbmWarp(mod(p + vec2(5.2, 1.3) + u_drift2, PERIOD), vec4(0.0, 1.0, 0.0, 0.0))
  );
  float f = fbm(mod(p + WARP * q + u_drift3, PERIOD), vec4(0.0, 0.0, 1.0, 0.0));
  // fbm crowds around 0.5: spread it so density maps evenly onto coverage.
  f = clamp((f - 0.5) * 2.2 + 0.5, 0.0, 1.0);

  // Coverage: density 0 is a clear sky, 1 is overcast.
  float low = mix(0.78, -0.02, u_density);
  float cover = smoothstep(low, low + 0.42, f);
  // Billows: the bright rim where the warp field is strongest.
  float light = clamp(length(q - 0.5) * 1.6 + touch * 0.35, 0.0, 1.0);

  // The sky darkens a touch toward the top, like depth.
  vec4 sky = mix(u_c0, mix(u_c0, u_c3, 0.55), smoothstep(0.0, 1.0, 1.0 - uv.y));
  vec4 cloud = mix(u_c1, u_c2, light * smoothstep(0.0, 1.0, cover));
  vec4 color = mix(sky, cloud, cover);
  color.rgb += grain();
  gl_FragColor = vec4(color.rgb * color.a, color.a);
}
`

/** The fragment shader for a variant, with its octave count compiled in. */
export function fragmentSource(variant: ShaderFieldVariant): string {
  const main = variant === 'clouds' ? CLOUDS_MAIN : DITHER_MAIN
  return `#define OCTAVES ${OCTAVES[variant]}\n#define WARP_OCTAVES ${WARP_OCTAVES}\n${HEADER}\n${main}`
}

/** Wraps a drift offset into [0, period), where the noise repeats seamlessly. */
export function wrapDrift(value: number, period = NOISE_PERIOD): number {
  const wrapped = value % period
  return wrapped < 0 ? wrapped + period : wrapped
}

/**
 * Random bytes for the noise texture, `size` × `size` RGBA. Each channel is
 * an independent noise, so one read can serve two or more layers.
 */
export function noiseTexels(
  random: () => number,
  size = NOISE_PERIOD,
): Uint8Array {
  const texels = new Uint8Array(size * size * 4)
  for (let i = 0; i < texels.length; i++) {
    texels[i] = Math.floor(random() * 256)
  }
  return texels
}
