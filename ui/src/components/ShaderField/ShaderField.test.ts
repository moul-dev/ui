import { fixture, html } from '@open-wc/testing-helpers'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  type ManualFrames,
  manualAnimationFrames,
  mockReducedMotion,
  type ReducedMotionMock,
  triggerResize,
} from '../../test-setup'
import './ShaderField'
import {
  type MoulShaderField,
  parseColorList,
  SHADER_FIELD_DEFAULT_COLORS,
} from './ShaderField'
import {
  fragmentSource,
  NOISE_PERIOD,
  noiseTexels,
  UNIFORMS,
  wrapDrift,
} from './shaders'

/**
 * A stand-in WebGL context: every method is a spy, programs and shaders
 * compile, and the lose-context extension flips `isContextLost`.
 */
function fakeGl() {
  let lost = false
  const calls: Array<[string, unknown[]]> = []
  const extension = {
    loseContext: vi.fn(() => {
      lost = true
    }),
    restoreContext: vi.fn(() => {
      lost = false
    }),
  }
  const constants: Record<string, number> = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    TEXTURE_2D: 7,
    TEXTURE0: 8,
    RGBA: 9,
    UNSIGNED_BYTE: 10,
    LINEAR: 11,
    REPEAT: 12,
    TEXTURE_MIN_FILTER: 13,
    TEXTURE_MAG_FILTER: 14,
    TEXTURE_WRAP_S: 15,
    TEXTURE_WRAP_T: 16,
    UNPACK_ALIGNMENT: 17,
    FLOAT: 18,
    TRIANGLES: 19,
  }
  const handlers: Record<string, (...args: any[]) => unknown> = {
    isContextLost: () => lost,
    getExtension: (name: string) =>
      name === 'WEBGL_lose_context' && !lost ? extension : null,
    createShader: () => ({ shader: true }),
    createProgram: () => ({ program: true }),
    createBuffer: () => ({ buffer: true }),
    createTexture: () => ({ texture: true }),
    getShaderParameter: () => true,
    getProgramParameter: () => true,
    getUniformLocation: (_program: unknown, name: string) => ({ name }),
    getAttribLocation: () => 0,
  }
  const gl = new Proxy(constants, {
    get(target, key: string) {
      if (key in target) return target[key]
      if (key === 'then') return undefined
      return (...args: unknown[]) => {
        calls.push([key, args])
        return handlers[key]?.(...args)
      }
    },
  }) as unknown as WebGLRenderingContext
  const count = (name: string) => calls.filter(([n]) => n === name).length
  /** The last value set for a uniform, by name. */
  const uniform = (name: string): unknown[] | undefined => {
    for (let i = calls.length - 1; i >= 0; i--) {
      const [method, args] = calls[i]
      if (
        method.startsWith('uniform') &&
        (args[0] as { name?: string } | null)?.name === name
      ) {
        return args.slice(1)
      }
    }
    return undefined
  }
  return { gl, calls, count, uniform, extension }
}

const originalGetContext = HTMLCanvasElement.prototype.getContext

function canvasOf(el: MoulShaderField): HTMLCanvasElement {
  return el.shadowRoot?.querySelector('canvas') as HTMLCanvasElement
}

describe('<moul-shader-field>', () => {
  it('is registered with a canvas and a fallback hidden from screen readers', async () => {
    const el = await fixture<MoulShaderField>(
      html`<moul-shader-field></moul-shader-field>`,
    )
    expect(customElements.get('moul-shader-field')).toBeDefined()
    expect(canvasOf(el).getAttribute('aria-hidden')).toBe('true')
    expect(
      el.shadowRoot?.querySelector('.layer')?.getAttribute('aria-hidden'),
    ).toBe('true')
    expect(el.shadowRoot?.querySelector('[part="fallback"]')).not.toBeNull()
    expect(el.shadowRoot?.querySelector('[part="content"] slot')).not.toBeNull()
  })

  it('has calm defaults', async () => {
    const el = await fixture<MoulShaderField>(
      html`<moul-shader-field></moul-shader-field>`,
    )
    expect(el.variant).toBe('dither')
    expect(el.getAttribute('variant')).toBe('dither')
    expect(el.shape).toBe('dot')
    expect(el.speed).toBe(1)
    expect(el.fieldScale).toBe(1)
    expect(el.pixelSize).toBe(6)
    expect(el.density).toBe(0.5)
    expect(el.seed).toBe(3)
    expect(el.interactive).toBe(false)
    expect(el.colors).toEqual([])
  })

  it('reads its attributes, including colours with commas inside functions', async () => {
    const el = await fixture<MoulShaderField>(html`
      <moul-shader-field
        variant="clouds"
        scale="2"
        pixel-size="10"
        density="0.8"
        speed="0"
        seed="4"
        interactive
        colors="var(--color-background), color-mix(in oklab, var(--color-accent) 30%, white)"
      ></moul-shader-field>
    `)
    expect(el.variant).toBe('clouds')
    expect(el.fieldScale).toBe(2)
    expect(el.pixelSize).toBe(10)
    expect(el.density).toBe(0.8)
    expect(el.speed).toBe(0)
    expect(el.seed).toBe(4)
    expect(el.interactive).toBe(true)
    expect(el.colors).toEqual([
      'var(--color-background)',
      'color-mix(in oklab, var(--color-accent) 30%, white)',
    ])
  })

  describe('parseColorList', () => {
    it('splits on top-level commas only', () => {
      expect(parseColorList('red, rgb(1, 2, 3) ,var(--a, blue)')).toEqual([
        'red',
        'rgb(1, 2, 3)',
        'var(--a, blue)',
      ])
    })

    it('reads a JSON array and ignores empty entries', () => {
      expect(parseColorList('["red", " ", "var(--b)"]')).toEqual([
        'red',
        'var(--b)',
      ])
      expect(parseColorList('')).toEqual([])
      expect(parseColorList(null)).toEqual([])
      expect(parseColorList('red,,blue,')).toEqual(['red', 'blue'])
    })
  })

  describe('without WebGL', () => {
    it('shows the CSS gradient, in the theme colours of its variant', async () => {
      const el = await fixture<MoulShaderField>(
        html`<moul-shader-field></moul-shader-field>`,
      )
      await el.updateComplete
      expect(el.hasAttribute('is-fallback')).toBe(true)
      expect(el.isWebgl).toBe(false)
      const fallback = el.shadowRoot?.querySelector<HTMLElement>('.fallback')
      const style = fallback?.getAttribute('style') ?? ''
      expect(style).toContain(`--_c0: ${SHADER_FIELD_DEFAULT_COLORS.dither[0]}`)
      expect(style).toContain(`--_c2: ${SHADER_FIELD_DEFAULT_COLORS.dither[2]}`)
      // Three dither colours: the fourth slot repeats the last.
      expect(style).toContain(`--_c3: ${SHADER_FIELD_DEFAULT_COLORS.dither[2]}`)

      el.variant = 'clouds'
      await el.updateComplete
      expect(fallback?.getAttribute('style')).toContain(
        `--_c3: ${SHADER_FIELD_DEFAULT_COLORS.clouds[3]}`,
      )
    })

    it('uses the author colours, repeating a single one', async () => {
      const el = await fixture<MoulShaderField>(
        html`<moul-shader-field colors="var(--color-chart-4)"></moul-shader-field>`,
      )
      const style =
        el.shadowRoot?.querySelector('.fallback')?.getAttribute('style') ?? ''
      expect(style).toContain('--_c0: var(--color-chart-4)')
      expect(style).toContain('--_c1: var(--color-chart-4)')
    })
  })

  describe('shaders', () => {
    it('compiles the octave count of each variant into its fragment shader', () => {
      const dither = fragmentSource('dither')
      const clouds = fragmentSource('clouds')
      expect(dither).toMatch(/^#define OCTAVES 3\n/)
      expect(clouds).toMatch(/^#define OCTAVES 5\n/)
      expect(dither).toContain('bayer8(cell)')
      expect(dither).not.toContain('fbmWarp(mod')
      expect(clouds).toContain('fbmWarp(mod')
      expect(clouds).not.toContain('bayer8(cell)')
    })

    it('declares every uniform the element sets, with a precision fallback', () => {
      for (const source of [
        fragmentSource('dither'),
        fragmentSource('clouds'),
      ]) {
        for (const name of UNIFORMS) {
          expect(source).toMatch(new RegExp(`uniform \\w+ ${name};`))
        }
        expect(source).toContain('#ifdef GL_FRAGMENT_PRECISION_HIGH')
        expect(source).toContain('precision mediump float;')
        // GLSL ES 1.00 forbids indexing arrays with computed values.
        expect(source).not.toMatch(/u_c\[/)
      }
    })

    it('wraps drift where the noise repeats, so time never loses precision', () => {
      expect(wrapDrift(0)).toBe(0)
      expect(wrapDrift(NOISE_PERIOD + 1.5)).toBeCloseTo(1.5)
      expect(wrapDrift(-1)).toBeCloseTo(NOISE_PERIOD - 1)
      expect(wrapDrift(1e7 + 0.25)).toBeLessThan(NOISE_PERIOD)
    })

    it('fills the noise texture deterministically', () => {
      let n = 0
      const random = () => (((n++ * 0.618) % 1) + 1) % 1
      const texels = noiseTexels(random)
      expect(texels.length).toBe(NOISE_PERIOD * NOISE_PERIOD * 4)
      n = 0
      expect(noiseTexels(random)).toEqual(texels)
    })
  })

  describe('with WebGL', () => {
    let fake: ReturnType<typeof fakeGl>
    let frames: ManualFrames
    let motion: ReducedMotionMock

    beforeEach(() => {
      fake = fakeGl()
      ;(HTMLCanvasElement.prototype as any).getContext = vi.fn(
        (kind: string) => (kind === 'webgl' ? fake.gl : null),
      )
      frames = manualAnimationFrames()
      motion = mockReducedMotion(false)
    })

    afterEach(() => {
      HTMLCanvasElement.prototype.getContext = originalGetContext
      frames.restore()
      motion.restore()
      vi.useRealTimers()
    })

    async function mount(
      markup = html`<moul-shader-field></moul-shader-field>`,
    ) {
      const el = await fixture<MoulShaderField>(markup)
      triggerResize(canvasOf(el), { width: 320, height: 180 })
      await el.updateComplete
      return el
    }

    it('draws one full-screen triangle with the palette and the field settings', async () => {
      const el = await mount(
        html`<moul-shader-field density="0.7" pixel-size="8"></moul-shader-field>`,
      )
      expect(el.hasAttribute('is-fallback')).toBe(false)
      expect(el.isWebgl).toBe(true)
      expect(fake.count('createProgram')).toBe(1)
      expect(fake.count('texImage2D')).toBe(1)
      expect(fake.count('drawArrays')).toBeGreaterThan(0)
      expect(fake.uniform('u_density')).toEqual([0.7])
      expect(fake.uniform('u_cell')).toEqual([8])
      expect(fake.uniform('u_count')).toEqual([3])
      expect(fake.uniform('u_shape')).toEqual([1])
      expect(fake.uniform('u_c0')).toHaveLength(4)
    })

    it('swaps only the program when the variant changes, and recompiles nothing on a colour change', async () => {
      const el = await mount()
      el.variant = 'clouds'
      await el.updateComplete
      expect(fake.count('createProgram')).toBe(2)
      expect(fake.count('deleteProgram')).toBe(1)
      expect(fake.count('createBuffer')).toBe(1)
      expect(fake.count('createTexture')).toBe(1)
      expect(fake.uniform('u_count')).toEqual([4])

      el.colors = ['var(--color-chart-1)', 'var(--color-chart-2)']
      await el.updateComplete
      expect(fake.count('createProgram')).toBe(2)
      expect(fake.uniform('u_count')).toEqual([2])
    })

    it('animates with a frame loop, and holds still at speed 0', async () => {
      const el = await mount()
      expect(frames.pending).toBeGreaterThan(0)
      el.speed = 0
      await el.updateComplete
      frames.step(1000)
      expect(frames.pending).toBe(0)
      el.interactive = true
      await el.updateComplete
      // The pointer still needs frames, even when the field itself is still.
      expect(frames.pending).toBeGreaterThan(0)
    })

    it('shows the fallback while the context is lost, and draws again once it is back', async () => {
      const el = await mount()
      const canvas = canvasOf(el)
      const lost = new Event('webglcontextlost', { cancelable: true })
      canvas.dispatchEvent(lost)
      expect(lost.defaultPrevented).toBe(true)
      expect(el.hasAttribute('is-fallback')).toBe(true)

      const programs = fake.count('createProgram')
      canvas.dispatchEvent(new Event('webglcontextrestored'))
      expect(el.hasAttribute('is-fallback')).toBe(false)
      expect(fake.count('createProgram')).toBe(programs + 1)
      expect(fake.count('texImage2D')).toBe(2)
    })

    it('gives the context back when removed, and asks for it again when it returns', async () => {
      vi.useFakeTimers()
      const el = await mount()
      const parent = el.parentElement as HTMLElement
      el.remove()
      vi.runAllTimers()
      expect(fake.count('deleteProgram')).toBe(1)
      expect(fake.extension.loseContext).toHaveBeenCalledTimes(1)

      parent.append(el)
      expect(fake.extension.restoreContext).toHaveBeenCalledTimes(1)
    })

    it('keeps the context through a move within the page', async () => {
      vi.useFakeTimers()
      const el = await mount()
      const other = document.createElement('div')
      document.body.append(other)
      other.append(el)
      vi.runAllTimers()
      expect(fake.extension.loseContext).not.toHaveBeenCalled()
      other.remove()
    })

    it('falls back once, with a warning, when the shader does not compile', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      fake = fakeGl()
      const broken = new Proxy(fake.gl as object, {
        get(target, key) {
          if (key === 'getShaderParameter') return () => false
          if (key === 'getShaderInfoLog') return () => 'driver says no'
          return Reflect.get(target, key)
        },
      })
      ;(HTMLCanvasElement.prototype as any).getContext = vi.fn(() => broken)
      const el = await mount()
      expect(el.hasAttribute('is-fallback')).toBe(true)
      expect(warn).toHaveBeenCalledTimes(1)
      warn.mockRestore()
    })
  })

  describe('keyboard and screen readers', () => {
    it('never takes focus and leaves slotted content in the tab order', async () => {
      const el = await fixture<MoulShaderField>(html`
        <moul-shader-field><button>Start a build</button></moul-shader-field>
      `)
      expect(el.hasAttribute('tabindex')).toBe(false)
      expect(el.shadowRoot?.querySelector('[tabindex]')).toBeNull()
      const button = el.querySelector('button') as HTMLButtonElement
      button.focus()
      expect(document.activeElement).toBe(button)
      const slot = el.shadowRoot?.querySelector('slot') as HTMLSlotElement
      expect(slot.assignedElements()).toContain(button)
    })
  })

  describe('reduced motion', () => {
    let fake: ReturnType<typeof fakeGl>
    let frames: ManualFrames
    let motion: ReducedMotionMock

    beforeEach(() => {
      fake = fakeGl()
      ;(HTMLCanvasElement.prototype as any).getContext = vi.fn(() => fake.gl)
      frames = manualAnimationFrames()
      motion = mockReducedMotion(true)
    })

    afterEach(() => {
      HTMLCanvasElement.prototype.getContext = originalGetContext
      frames.restore()
      motion.restore()
    })

    it('draws one still frame, and the pointer does not move it', async () => {
      const el = await fixture<MoulShaderField>(
        html`<moul-shader-field interactive></moul-shader-field>`,
      )
      triggerResize(canvasOf(el), { width: 320, height: 180 })
      await el.updateComplete
      expect(fake.count('drawArrays')).toBeGreaterThan(0)
      expect(frames.pending).toBe(0)

      el.dispatchEvent(
        new PointerEvent('pointermove', {
          clientX: 100,
          clientY: 60,
          pointerType: 'mouse',
        }),
      )
      frames.step(16)
      expect(frames.pending).toBe(0)
      expect(fake.uniform('u_pointer_strength')).toEqual([0])
    })

    it('starts moving when reduced motion is turned off', async () => {
      const el = await fixture<MoulShaderField>(
        html`<moul-shader-field></moul-shader-field>`,
      )
      triggerResize(canvasOf(el), { width: 320, height: 180 })
      await el.updateComplete
      expect(frames.pending).toBe(0)
      motion.set(false)
      expect(frames.pending).toBeGreaterThan(0)
    })
  })
})
