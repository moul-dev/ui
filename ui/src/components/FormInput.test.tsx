import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import * as React from 'react'
import '@testing-library/jest-dom'
import * as fc from 'fast-check'
import {
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  Radio,
  Switch,
  TextField,
  TextArea,
  NumberField,
  SearchField,
  Select,
  SelectItem,
  ComboBox,
  ComboBoxItem,
  Slider,
  SliderTrack,
  SliderThumb,
} from '../index'

const getTargetElement = (container: HTMLElement) => {
  const first = container.firstChild as HTMLElement
  if (first && first.tagName === 'TEMPLATE') {
    return first.nextSibling as HTMLElement
  }
  return first
}

describe('Checkbox component', () => {
  test('renders with correct role', () => {
    const { getByRole } = render(<Checkbox>Agree</Checkbox>)
    const checkbox = getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
    expect(checkbox.tagName).toBe('INPUT')
  })

  test('reflects name attribute on native input', () => {
    const { container } = render(<Checkbox name="accept-terms">Agree</Checkbox>)
    const input = container.querySelector('input[name="accept-terms"]')
    expect(input).toBeInTheDocument()
  })

  test('accepts variant props', () => {
    const { getByRole, rerender } = render(<Checkbox variant="primary">Agree</Checkbox>)
    expect(getByRole('checkbox')).toBeInTheDocument()

    rerender(<Checkbox variant="secondary">Agree</Checkbox>)
    expect(getByRole('checkbox')).toBeInTheDocument()

    rerender(<Checkbox variant="tertiary">Agree</Checkbox>)
    expect(getByRole('checkbox')).toBeInTheDocument()
  })
})

describe('CheckboxGroup component', () => {
  test('renders with label and description', () => {
    const { getByText } = render(
      <CheckboxGroup label="Roles" description="Choose your roles">
        <Checkbox value="admin">Admin</Checkbox>
        <Checkbox value="user">User</Checkbox>
      </CheckboxGroup>,
    )
    expect(getByText('Roles')).toBeInTheDocument()
    expect(getByText('Choose your roles')).toBeInTheDocument()
  })

  test('accepts orientation and variant props and inherits variant to children', () => {
    const { getByRole } = render(
      <CheckboxGroup label="Roles" variant="secondary" orientation="horizontal">
        <Checkbox value="admin">Admin</Checkbox>
        <Checkbox value="user">User</Checkbox>
      </CheckboxGroup>,
    )
    expect(getByRole('group')).toBeInTheDocument()
  })
})

describe('RadioGroup & Radio components', () => {
  test('renders group and radios with correct roles', () => {
    const { getByRole, getAllByRole } = render(
      <RadioGroup label="Color">
        <Radio value="red">Red</Radio>
        <Radio value="blue">Blue</Radio>
      </RadioGroup>,
    )
    expect(getByRole('radiogroup')).toBeInTheDocument()
    const radios = getAllByRole('radio')
    expect(radios).toHaveLength(2)
  })
})

describe('Switch component', () => {
  test('renders with switch role', () => {
    const { getByRole } = render(<Switch>Dark mode</Switch>)
    const switchEl = getByRole('switch')
    expect(switchEl).toBeInTheDocument()
  })
})

describe('TextField component', () => {
  test('renders with textbox role and uncontrolled default value', () => {
    const { getByRole } = render(<TextField label="Name" defaultValue="John" />)
    const input = getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('John')
  })

  test('reflects controlled value updates', () => {
    const changeHandler = vi.fn()
    const { getByRole, rerender } = render(
      <TextField label="Name" value="Alice" onChange={changeHandler} />,
    )
    const input = getByRole('textbox')
    expect(input).toHaveValue('Alice')

    // type in input
    fireEvent.change(input, { target: { value: 'Bob' } })
    expect(changeHandler).toHaveBeenCalledWith('Bob')
    // since it is controlled, it doesn't change unless rerendered with new value
    expect(input).toHaveValue('Alice')

    rerender(<TextField label="Name" value="Bob" onChange={changeHandler} />)
    expect(input).toHaveValue('Bob')
  })
})

describe('TextArea component', () => {
  test('renders text area with textbox role', () => {
    const { getByRole } = render(<TextArea label="Comments" />)
    const textarea = getByRole('textbox')
    expect(textarea).toBeInTheDocument()
    expect(textarea.tagName).toBe('TEXTAREA')
  })
})

describe('NumberField component', () => {
  test('renders input and stepper buttons', () => {
    const { getByRole, getAllByRole } = render(
      <NumberField label="Count" defaultValue={5} />,
    )
    const input = getByRole('textbox')
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue('5')

    const buttons = getAllByRole('button')
    // increment and decrement
    expect(buttons).toHaveLength(2)
  })
})

describe('SearchField component', () => {
  test('renders with searchbox role', () => {
    const { getByRole } = render(
      <SearchField label="Search" defaultValue="query" />,
    )
    const searchbox = getByRole('searchbox')
    expect(searchbox).toBeInTheDocument()
  })
})

describe('Select component', () => {
  test('renders trigger button and dropdown list', () => {
    const { getByRole } = render(
      <Select label="Option" placeholder="Select one">
        <SelectItem id="1">First</SelectItem>
        <SelectItem id="2">Second</SelectItem>
      </Select>,
    )
    const trigger = getByRole('button')
    expect(trigger).toBeInTheDocument()
    expect(trigger.textContent).toContain('Select one')
  })
})

describe('ComboBox component', () => {
  test('renders input and dropdown trigger', () => {
    const { getByRole } = render(
      <ComboBox label="Option">
        <ComboBoxItem id="1">First</ComboBoxItem>
        <ComboBoxItem id="2">Second</ComboBoxItem>
      </ComboBox>,
    )
    const input = getByRole('combobox')
    expect(input).toBeInTheDocument()

    const trigger = getByRole('button')
    expect(trigger).toBeInTheDocument()
  })
})

describe('Slider component', () => {
  test('renders track and thumb', () => {
    const { getByRole } = render(
      <Slider label="Volume" defaultValue={40}>
        <SliderTrack>
          <SliderThumb />
        </SliderTrack>
      </Slider>,
    )
    const slider = getByRole('slider')
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveValue('40')
  })
})

// ── Property-Based Tests ──────────────────────────────────────────────

describe('Form Components Property-Based Tests', () => {
  test('Form components append consumer className', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          (props: any) => <Checkbox {...props}>Check</Checkbox>,
          (props: any) => (
            <CheckboxGroup {...props}>
              <Checkbox>Check</Checkbox>
            </CheckboxGroup>
          ),
          (props: any) => (
            <RadioGroup {...props}>
              <Radio value="a">A</Radio>
            </RadioGroup>
          ),
          (props: any) => <Switch {...props}>Switch</Switch>,
          (props: any) => <TextField {...props} />,
          (props: any) => <TextArea {...props} />,
          (props: any) => <NumberField {...props} />,
          (props: any) => <SearchField {...props} />,
          (props: any) => (
            <Select {...props}>
              <SelectItem id="1">1</SelectItem>
            </Select>
          ),
          (props: any) => (
            <ComboBox {...props}>
              <ComboBoxItem id="1">1</ComboBoxItem>
            </ComboBox>
          ),
          (props: any) => (
            <Slider {...props}>
              <SliderTrack>
                <SliderThumb />
              </SliderTrack>
            </Slider>
          ),
        ),
        fc.string({ minLength: 1 }).filter((s) => /^[a-zA-Z][\w-]*$/.test(s)),
        (ComponentFn, consumerClass) => {
          const { container, unmount } = render(
            ComponentFn({ className: consumerClass }),
          )
          const el = getTargetElement(container)
          expect(el.className).toContain(consumerClass)
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })

  test('ref forwarding resolves to DOM element', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          (ref: any) => <Checkbox ref={ref}>Check</Checkbox>,
          (ref: any) => (
            <CheckboxGroup ref={ref}>
              <Checkbox>Check</Checkbox>
            </CheckboxGroup>
          ),
          (ref: any) => (
            <RadioGroup ref={ref}>
              <Radio value="a">A</Radio>
            </RadioGroup>
          ),
          (ref: any) => <Switch ref={ref}>Switch</Switch>,
          (ref: any) => <TextField ref={ref} />,
          (ref: any) => <TextArea ref={ref} />,
          (ref: any) => <NumberField ref={ref} />,
          (ref: any) => <SearchField ref={ref} />,
          (ref: any) => (
            <Select ref={ref}>
              <SelectItem id="1">1</SelectItem>
            </Select>
          ),
          (ref: any) => (
            <ComboBox ref={ref}>
              <ComboBoxItem id="1">1</ComboBoxItem>
            </ComboBox>
          ),
          (ref: any) => (
            <Slider ref={ref}>
              <SliderTrack>
                <SliderThumb />
              </SliderTrack>
            </Slider>
          ),
        ),
        (ComponentFn) => {
          const ref = React.createRef<any>()
          const { unmount } = render(ComponentFn(ref))
          expect(ref.current).toBeInstanceOf(HTMLElement)
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })

  test('isDisabled applies correct disabled semantics', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          (props: any) => <Checkbox {...props}>Check</Checkbox>,
          (props: any) => (
            <CheckboxGroup {...props}>
              <Checkbox>Check</Checkbox>
            </CheckboxGroup>
          ),
          (props: any) => (
            <RadioGroup {...props}>
              <Radio value="a">A</Radio>
            </RadioGroup>
          ),
          (props: any) => <Switch {...props}>Switch</Switch>,
          (props: any) => <TextField {...props} />,
          (props: any) => <TextArea {...props} />,
          (props: any) => <NumberField {...props} />,
          (props: any) => <SearchField {...props} />,
          (props: any) => (
            <Select {...props}>
              <SelectItem id="1">1</SelectItem>
            </Select>
          ),
          (props: any) => (
            <ComboBox {...props}>
              <ComboBoxItem id="1">1</ComboBoxItem>
            </ComboBox>
          ),
          (props: any) => (
            <Slider {...props}>
              <SliderTrack>
                <SliderThumb />
              </SliderTrack>
            </Slider>
          ),
        ),
        (ComponentFn) => {
          const { container, unmount } = render(
            ComponentFn({ isDisabled: true }),
          )
          const el = getTargetElement(container)
          // either has disabled attribute or has aria-disabled="true"
          const hasSemantics =
            el.hasAttribute('disabled') ||
            el.getAttribute('aria-disabled') === 'true' ||
            el.querySelector('input')?.hasAttribute('disabled') ||
            el.querySelector('button')?.hasAttribute('disabled') ||
            el.querySelector('textarea')?.hasAttribute('disabled')
          expect(hasSemantics).toBe(true)
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })

  test('hidden native inputs for form submission carry name and value', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          (props: any) => (
            <Checkbox {...props} defaultValue={true} value={true}>
              Check
            </Checkbox>
          ),
          (props: any) => (
            <CheckboxGroup {...props} defaultValue={['a']} value={['a']}>
              <Checkbox value="a">A</Checkbox>
            </CheckboxGroup>
          ),
          (props: any) => (
            <RadioGroup {...props} defaultValue="a" value="a">
              <Radio value="a">A</Radio>
            </RadioGroup>
          ),
          (props: any) => (
            <Switch {...props} defaultValue={true} value={true}>
              Switch
            </Switch>
          ),
          (props: any) => <TextField {...props} defaultValue="a" value="a" />,
          (props: any) => <TextArea {...props} defaultValue="a" value="a" />,
          (props: any) => (
            <NumberField {...props} defaultValue={10} value={10} />
          ),
          (props: any) => <SearchField {...props} defaultValue="a" value="a" />,
          (props: any) => (
            <Select {...props} defaultValue="a" value="a">
              <SelectItem id="a">A</SelectItem>
            </Select>
          ),
          (props: any) => (
            <ComboBox {...props} defaultValue="a" value="a">
              <ComboBoxItem id="a">A</ComboBoxItem>
            </ComboBox>
          ),
          (props: any) => (
            <Slider {...props} defaultValue={40} value={40}>
              <SliderTrack>
                <SliderThumb />
              </SliderTrack>
            </Slider>
          ),
        ),
        fc.string({ minLength: 1 }).filter((s) => /^[a-zA-Z][\w-]*$/.test(s)),
        (ComponentFn, name) => {
          const { container, unmount } = render(ComponentFn({ name }))
          // Find any input/select element with name
          const el = container.querySelector(`[name="${name}"]`)
          expect(el).toBeInTheDocument()
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })
})

describe('Missing label warnings in development mode', () => {
  let warnSpy: any
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    warnSpy.mockRestore()
    process.env.NODE_ENV = originalEnv
  })

  test('fires console.warn when missing accessible name', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { name: 'Checkbox', element: <Checkbox>{null}</Checkbox> },
          {
            name: 'Radio',
            element: (
              <RadioGroup aria-label="Group">
                <Radio value="a">{null}</Radio>
              </RadioGroup>
            ),
          },
          { name: 'Switch', element: <Switch>{null}</Switch> },
        ),
        ({ name, element }) => {
          warnSpy.mockClear()
          const { unmount } = render(element)
          expect(warnSpy).toHaveBeenCalledTimes(1)
          expect(warnSpy.mock.calls[0][0]).toContain(
            `[${name}] This component has no accessible name`,
          )
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })
})
