/**
 * Small WebGL helpers for the canvas elements that draw on the GPU. No
 * library: a shader program, a full-screen triangle and context-loss
 * handling are all these effects need.
 */

export type GL = WebGLRenderingContext | WebGL2RenderingContext

/** Compiles one shader, or throws with the driver's log. */
export function compileShader(
  gl: GL,
  type: number,
  source: string,
): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error('[moul] WebGL could not create a shader.')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`[moul] WebGL shader failed to compile: ${log ?? ''}`)
  }
  return shader
}

/** Compiles and links a program from vertex and fragment source, or throws with the log. */
export function createProgram(
  gl: GL,
  vertexSource: string,
  fragmentSource: string,
): WebGLProgram {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  if (!program) throw new Error('[moul] WebGL could not create a program.')
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(`[moul] WebGL program failed to link: ${log ?? ''}`)
  }
  return program
}

/**
 * The vertex shader for a full-screen pass: pair it with `drawFullscreen`.
 * It hands the fragment shader `v_uv`, 0 to 1 across the canvas.
 */
export const FULLSCREEN_VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`

const fullscreenBuffers = new WeakMap<GL, WebGLBuffer>()

/**
 * Draws one triangle that covers the canvas with `program`, whose vertex
 * shader reads `a_position` (use `FULLSCREEN_VERTEX`).
 */
export function drawFullscreen(gl: GL, program: WebGLProgram): void {
  let buffer = fullscreenBuffers.get(gl)
  // A lost and restored context is the same object with every buffer gone.
  if (!buffer || !gl.isBuffer(buffer)) {
    const created = gl.createBuffer()
    if (!created) return
    buffer = created
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    )
    fullscreenBuffers.set(gl, buffer)
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  const location = gl.getAttribLocation(program, 'a_position')
  gl.enableVertexAttribArray(location)
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

/**
 * Listens for the GPU taking the context away (a driver reset, too many
 * contexts on the page) and giving it back. `onLost` should drop programs
 * and buffers; `onRestored` builds them again. Returns a function that stops
 * listening.
 */
export function watchContextLoss(
  canvas: HTMLCanvasElement,
  onLost: () => void,
  onRestored: () => void,
): () => void {
  const lost = (event: Event): void => {
    // Without preventDefault the browser never restores the context.
    event.preventDefault()
    onLost()
  }
  canvas.addEventListener('webglcontextlost', lost)
  canvas.addEventListener('webglcontextrestored', onRestored)
  return () => {
    canvas.removeEventListener('webglcontextlost', lost)
    canvas.removeEventListener('webglcontextrestored', onRestored)
  }
}
