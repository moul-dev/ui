'use client'

import { useEffect, useRef, useState } from 'react'

// --- Matrix Mathematics Helpers (Lightweight 3D operations) ---
type Mat4 = number[]
type Mat3 = number[]

function createIdentity(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}

function perspective(
  fovRad: number,
  aspect: number,
  near: number,
  far: number,
): Mat4 {
  const f = 1.0 / Math.tan(fovRad / 2)
  const nf = 1 / (near - far)
  return [
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) * nf,
    -1,
    0,
    0,
    2 * far * near * nf,
    0,
  ]
}

function rotateX(m: Mat4, rad: number): Mat4 {
  const dst = [...m]
  const c = Math.cos(rad)
  const s = Math.sin(rad)

  const m1 = m[4]!,
    m2 = m[5]!,
    m3 = m[6]!,
    m4 = m[7]!
  const m5 = m[8]!,
    m6 = m[9]!,
    m7 = m[10]!,
    m8 = m[11]!

  dst[4] = m1 * c + m5 * s
  dst[5] = m2 * c + m6 * s
  dst[6] = m3 * c + m7 * s
  dst[7] = m4 * c + m8 * s

  dst[8] = m5 * c - m1 * s
  dst[9] = m6 * c - m2 * s
  dst[10] = m7 * c - m3 * s
  dst[11] = m8 * c - m4 * s

  return dst
}

function rotateY(m: Mat4, rad: number): Mat4 {
  const dst = [...m]
  const c = Math.cos(rad)
  const s = Math.sin(rad)

  const m0 = m[0]!,
    m1 = m[1]!,
    m2 = m[2]!,
    m3 = m[3]!
  const m8 = m[8]!,
    m9 = m[9]!,
    m10 = m[10]!,
    m11 = m[11]!

  dst[0] = m0 * c - m8 * s
  dst[1] = m1 * c - m9 * s
  dst[2] = m2 * c - m10 * s
  dst[3] = m3 * c - m11 * s

  dst[8] = m0 * s + m8 * c
  dst[9] = m1 * s + m9 * c
  dst[10] = m2 * s + m10 * c
  dst[11] = m3 * s + m11 * c

  return dst
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const dst = new Array(16).fill(0)
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row]! * b[col * 4 + k]!
      }
      dst[col * 4 + row] = sum
    }
  }
  return dst
}

function getNormalMatrix(m: Mat4): Mat3 {
  return [m[0]!, m[1]!, m[2]!, m[4]!, m[5]!, m[6]!, m[8]!, m[9]!, m[10]!]
}

// --- OKLCH to sRGB Conversion (For Theme Matching) ---
function oklchToRgb(
  l: number,
  c: number,
  hDeg: number,
): [number, number, number] {
  const h = (hDeg * Math.PI) / 180

  // OKLCH -> OKLAB
  const a = c * Math.cos(h)
  const b = c * Math.sin(h)

  // OKLAB -> LMS
  const l_ = l + 0.3963377774 * a + 0.2158017502 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b

  const l3 = l_ * l_ * l_
  const m3 = m_ * m_ * m_
  const s3 = s_ * s_ * s_

  // LMS -> Linear RGB
  const rL = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  const gL = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413190065 * s3
  const bL = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614614 * s3

  // Linear RGB -> sRGB (Gamma correction)
  const f = (x: number) =>
    x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1.0 / 2.4) - 0.055

  return [
    Math.max(0, Math.min(1, f(rL))),
    Math.max(0, Math.min(1, f(gL))),
    Math.max(0, Math.min(1, f(bL))),
  ]
}

// --- Shader Sources ---
const vsSource = `#version 300 es
in vec4 a_position;
in vec3 a_normal;

uniform mat4 u_modelMatrix;
uniform mat4 u_viewProjectionMatrix;
uniform mat3 u_normalMatrix;

out vec3 v_normal;
out vec3 v_worldPosition;

void main() {
  vec4 worldPos = u_modelMatrix * a_position;
  v_worldPosition = worldPos.xyz;
  v_normal = normalize(u_normalMatrix * a_normal);
  gl_Position = u_viewProjectionMatrix * worldPos;
}
`

const fsSource = `#version 300 es
precision highp float;

in vec3 v_normal;
in vec3 v_worldPosition;

uniform vec3 u_brandColor;
uniform vec3 u_viewPos;
uniform float u_time;

out vec4 outColor;

vec3 getBgColor(vec3 dir, vec3 brandColor) {
  // Artistic background gradient that is sampled by refraction rays
  float t = dir.y * 0.5 + 0.5;
  vec3 sky = mix(vec3(0.01, 0.01, 0.03), brandColor * 0.22, t);
  
  // Simulating virtual light sources
  vec3 lightDir1 = normalize(vec3(1.5, 2.0, 1.0));
  vec3 lightDir2 = normalize(vec3(-1.5, -1.0, -1.0));
  
  float spec1 = pow(max(0.0, dot(dir, lightDir1)), 32.0);
  float spec2 = pow(max(0.0, dot(dir, lightDir2)), 16.0);
  
  sky += vec3(spec1) * 0.55;
  sky += brandColor * spec2 * 0.45;
  
  return sky;
}

void main() {
  vec3 normal = normalize(v_normal);
  vec3 viewDir = normalize(u_viewPos - v_worldPosition);
  

  
  // Fresnel glow at grazing angles
  float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0);
  
  // Specular reflection (shiny surface glare)
  vec3 lightDir = normalize(vec3(2.0, 3.0, 4.0));
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(0.0, dot(normal, halfDir)), 80.0);
  vec3 specularColor = vec3(1.0) * spec * 0.85;
  
  // Edge glow matching primary color
  vec3 glowColor = u_brandColor * fresnel * 0.8;
  
  // Subtle internal color pulsing
  float pulse = 0.5 + 0.5 * sin(u_time * 1.5);
  vec3 pulseGlow = u_brandColor * (0.05 + 0.05 * pulse);
  
  // Revert to Chromatic Aberration Refraction
  vec3 refractR = refract(-viewDir, normal, 1.0 / 1.12);
  vec3 refractG = refract(-viewDir, normal, 1.0 / 1.16);
  vec3 refractB = refract(-viewDir, normal, 1.0 / 1.20);
  
  float rVal = getBgColor(refractR, u_brandColor).r;
  float gVal = getBgColor(refractG, u_brandColor).g;
  float bVal = getBgColor(refractB, u_brandColor).b;
  vec3 refractedColor = vec3(rVal, gVal, bVal);
  
  // Base glass body color (transparent glass tint)
  vec3 glassTint = u_brandColor * 0.12;
  
  // Final compositing
  vec3 finalColor = refractedColor * 0.55 + specularColor + glowColor + pulseGlow + glassTint;
  
  // Semi-transparent opacity
  float opacity = mix(0.45, 0.95, fresnel);
  
  outColor = vec4(finalColor, opacity);
}
`

// --- Geometry Generation Helper ---
// Creates a 3D extruded prism wedge from a 2D CCW triangle
function createExtrudedTriangle(
  A: [number, number],
  B: [number, number],
  C: [number, number],
  depth: number,
) {
  const vertices: number[] = []
  const normals: number[] = []

  const Af = [A[0], A[1], depth]
  const Bf = [B[0], B[1], depth]
  const Cf = [C[0], C[1], depth]

  const Ab = [A[0], A[1], -depth]
  const Bb = [B[0], B[1], -depth]
  const Cb = [C[0], C[1], -depth]

  // 1. Front face (CCW: Af, Bf, Cf)
  vertices.push(...Af, ...Bf, ...Cf)
  normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1)

  // 2. Back face (CCW: Ab, Cb, Bb)
  vertices.push(...Ab, ...Cb, ...Bb)
  normals.push(0, 0, -1, 0, 0, -1, 0, 0, -1)

  // 3. Side AB (Af -> Bf)
  const dxAB = B[0] - A[0]
  const dyAB = B[1] - A[1]
  const lenAB = Math.hypot(dxAB, dyAB)
  const nAB = [dyAB / lenAB, -dxAB / lenAB, 0]

  vertices.push(...Af, ...Ab, ...Bf)
  normals.push(...nAB, ...nAB, ...nAB)
  vertices.push(...Bf, ...Ab, ...Bb)
  normals.push(...nAB, ...nAB, ...nAB)

  // 4. Side BC (Bf -> Cf)
  const dxBC = C[0] - B[0]
  const dyBC = C[1] - B[1]
  const lenBC = Math.hypot(dxBC, dyBC)
  const nBC = [dyBC / lenBC, -dxBC / lenBC, 0]

  vertices.push(...Bf, ...Bb, ...Cf)
  normals.push(...nBC, ...nBC, ...nBC)
  vertices.push(...Cf, ...Bb, ...Cb)
  normals.push(...nBC, ...nBC, ...nBC)

  // 5. Side CA (Cf -> Af)
  const dxCA = A[0] - C[0]
  const dyCA = A[1] - C[1]
  const lenCA = Math.hypot(dxCA, dyCA)
  const nCA = [dyCA / lenCA, -dxCA / lenCA, 0]

  vertices.push(...Cf, ...Cb, ...Af)
  normals.push(...nCA, ...nCA, ...nCA)
  vertices.push(...Af, ...Cb, ...Ab)
  normals.push(...nCA, ...nCA, ...nCA)

  return { vertices, normals }
}

export function WebGLLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // State for dragging/rotation tracking
  const isDragging = useRef(false)
  const previousMousePosition = useRef({ x: 0, y: 0 })
  const rotationAngles = useRef({ x: -0.15, y: -0.2 }) // Initial orientation
  const rotationVelocity = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Set up WebGL2 Context
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: true })
    if (!gl) {
      console.warn('WebGL2 not supported')
      setErrorMsg(
        'WebGL2 context creation failed. Your browser or device may not support WebGL2.',
      )
      return
    }

    // Enable Blending and Depth Test
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    // --- Compile shaders ---
    const createShader = (
      gl: WebGL2RenderingContext,
      type: number,
      source: string,
    ) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const errLog = gl.getShaderInfoLog(shader)
        console.error('Shader compilation error:', errLog)
        setErrorMsg('Shader compilation error: ' + errLog)
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const errLog = gl.getProgramInfoLog(program)
      console.error('Program link error:', errLog)
      setErrorMsg('Shader program link error: ' + errLog)
      return
    }

    // --- Generate geometries ---
    // Original SVG coordinates translated to -1..1 range (centered at (12, 12) with split offsets)
    // Polygon points (reordered CCW):
    // 0. Top-Left: CCW (A, B, C)
    const pTopLeft = createExtrudedTriangle(
      [-0.04, 0.975], // A: (11.6, 2.25)
      [-0.85, 0.075], // B: (3.5, 11.25)
      [-0.26, -0.15], // C: (9.4, 13.5)
      0.16,
    )

    // 1. Top-Right: CCW (A, C, B) -> reordered
    const pTopRight = createExtrudedTriangle(
      [0.04, 0.975], // A: (12.2, 2.25)
      [-0.2, -0.15], // C: (10.0, 13.5)
      [0.83, 0.075], // B: (20.3, 11.25)
      0.16,
    )

    // 2. Bottom-Left: CCW (A, C, B) -> reordered
    const pBottomLeft = createExtrudedTriangle(
      [-0.04, -0.985], // A: (11.6, 21.85)
      [-0.26, -0.22], // C: (9.4, 14.2)
      [-0.85, 0.005], // B: (3.5, 11.95)
      0.16,
    )

    // 3. Bottom-Right: CCW (A, B, C)
    const pBottomRight = createExtrudedTriangle(
      [0.04, -0.985], // A: (12.2, 21.85)
      [0.83, 0.005], // B: (20.3, 11.95)
      [-0.2, -0.22], // C: (10.0, 14.2)
      0.16,
    )

    // Combine all arrays
    const combinedVertices = new Float32Array([
      ...pTopLeft.vertices,
      ...pTopRight.vertices,
      ...pBottomLeft.vertices,
      ...pBottomRight.vertices,
    ])

    const combinedNormals = new Float32Array([
      ...pTopLeft.normals,
      ...pTopRight.normals,
      ...pBottomLeft.normals,
      ...pBottomRight.normals,
    ])

    const vertexCount = combinedVertices.length / 3

    // Create and bind VAO
    const vao = gl.createVertexArray()
    gl.bindVertexArray(vao)

    // Position Buffer
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, combinedVertices, gl.STATIC_DRAW)
    const aPositionLoc = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(aPositionLoc)
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0)

    // Normal Buffer
    const normalBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, combinedNormals, gl.STATIC_DRAW)
    const aNormalLoc = gl.getAttribLocation(program, 'a_normal')
    gl.enableVertexAttribArray(aNormalLoc)
    gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 0, 0)

    // Get Uniform Locations
    const uModelMatrixLoc = gl.getUniformLocation(program, 'u_modelMatrix')
    const uViewProjectionMatrixLoc = gl.getUniformLocation(
      program,
      'u_viewProjectionMatrix',
    )
    const uNormalMatrixLoc = gl.getUniformLocation(program, 'u_normalMatrix')
    const uBrandColorLoc = gl.getUniformLocation(program, 'u_brandColor')
    const uViewPosLoc = gl.getUniformLocation(program, 'u_viewPos')
    const uTimeLoc = gl.getUniformLocation(program, 'u_time')

    // Handle viewport sizing dynamically
    const handleResize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(container)
    handleResize() // Initial run

    // Render loop state
    let animationId: number
    const startTime = performance.now()

    // Camera settings
    const eye: [number, number, number] = [0.0, 0.0, 3.2] // Camera position

    const render = (timeMs: number) => {
      const elapsedSeconds = (timeMs - startTime) / 1000

      // Clear canvas with transparent background
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      // Calculate dynamic aspect ratio
      const aspect = canvas.width / canvas.height
      const projMatrix = perspective((40 * Math.PI) / 180, aspect, 0.1, 100)

      // View Matrix (camera looking down -Z axis)
      const viewMatrix = createIdentity()
      viewMatrix[12] = -eye[0]
      viewMatrix[13] = -eye[1]
      viewMatrix[14] = -eye[2] // Simple translate for camera view

      // ViewProjectionMatrix
      const viewProjMatrix = multiply(projMatrix, viewMatrix)

      // --- Model matrix calculation & interaction physics ---
      if (isDragging.current) {
        // Drag velocities added directly to angles
        rotationAngles.current.x += rotationVelocity.current.x
        rotationAngles.current.y += rotationVelocity.current.y
        rotationVelocity.current.x = 0
        rotationVelocity.current.y = 0
      } else {
        // Apply inertia (damping)
        rotationAngles.current.x += rotationVelocity.current.x
        rotationAngles.current.y += rotationVelocity.current.y
        rotationVelocity.current.x *= 0.94
        rotationVelocity.current.y *= 0.94

        // Return gently to baseline ambient spin on X, and slow auto-spin on Y
        rotationAngles.current.y += 0.003
        rotationAngles.current.x +=
          (Math.sin(elapsedSeconds * 0.4) * 0.1 - rotationAngles.current.x) *
          0.02
      }

      // Build model matrix (rotate the logo)
      let modelMatrix = createIdentity()
      modelMatrix = rotateX(modelMatrix, rotationAngles.current.x)
      modelMatrix = rotateY(modelMatrix, rotationAngles.current.y)

      // Normal matrix (transforms normals based on model rotations)
      const normalMatrix = getNormalMatrix(modelMatrix)

      // --- Theme Color Hook ---
      // Read the current Waku theme colors from CSS variables
      const computedStyles = getComputedStyle(document.documentElement)
      const rawHue = computedStyles.getPropertyValue('--brand-hue').trim()
      const rawChroma = computedStyles
        .getPropertyValue('--brand-chroma-multiplier')
        .trim()

      let hue = rawHue ? parseFloat(rawHue) : 250
      if (Number.isNaN(hue)) hue = 250
      let chromaMult = rawChroma ? parseFloat(rawChroma) : 1.0
      if (Number.isNaN(chromaMult)) chromaMult = 1.0

      // Get RGB coordinates in 0..1 scale
      const rgb = oklchToRgb(0.7, 0.18 * chromaMult, hue)

      // Use the WebGL Program
      // biome-ignore lint/correctness/useHookAtTopLevel: WebGLRenderingContext native method
      gl.useProgram(program)

      // Pass Uniforms
      gl.uniformMatrix4fv(uModelMatrixLoc, false, new Float32Array(modelMatrix))
      gl.uniformMatrix4fv(
        uViewProjectionMatrixLoc,
        false,
        new Float32Array(viewProjMatrix),
      )
      gl.uniformMatrix3fv(
        uNormalMatrixLoc,
        false,
        new Float32Array(normalMatrix),
      )
      gl.uniform3fv(uBrandColorLoc, new Float32Array(rgb))
      gl.uniform3fv(uViewPosLoc, new Float32Array(eye))
      gl.uniform1f(uTimeLoc, elapsedSeconds)

      // Bind VAO and Draw
      gl.bindVertexArray(vao)
      gl.drawArrays(gl.TRIANGLES, 0, vertexCount)

      animationId = requestAnimationFrame(render)
    }

    animationId = requestAnimationFrame(render)

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteBuffer(positionBuffer)
      gl.deleteBuffer(normalBuffer)
      gl.deleteVertexArray(vao)
    }
  }, [])

  // --- Drag and Drop handlers for 3D Orbit ---
  const handleStart = (clientX: number, clientY: number) => {
    isDragging.current = true
    previousMousePosition.current = { x: clientX, y: clientY }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return
    const deltaX = clientX - previousMousePosition.current.x
    const deltaY = clientY - previousMousePosition.current.y

    // Scale movement to rotation velocity
    rotationVelocity.current.y = deltaX * 0.007
    rotationVelocity.current.x = deltaY * 0.007

    previousMousePosition.current = { x: clientX, y: clientY }
  }

  const handleEnd = () => {
    isDragging.current = false
  }

  return (
    <div
      ref={containerRef}
      className="relative flex items-center justify-center h-[350px] sm:h-[450px] w-full max-w-[450px] mx-auto select-none cursor-grab active:cursor-grabbing logo-ambient-shadow"
      onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => {
        if (e.touches[0]) {
          handleStart(e.touches[0].clientX, e.touches[0].clientY)
        }
      }}
      onTouchMove={(e) => {
        if (e.touches[0]) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY)
        }
      }}
      onTouchEnd={handleEnd}
    >
      {errorMsg ? (
        <div className="text-red-500 text-xs p-4 bg-red-500/10 border border-red-500/20 rounded-lg max-w-[300px] text-center font-mono">
          {errorMsg}
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none"
          style={{
            filter:
              'drop-shadow(0 0 35px oklch(0.70 0.18 var(--brand-hue, 250) / 0.2))',
          }}
        />
      )}
    </div>
  )
}
