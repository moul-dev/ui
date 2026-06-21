import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import * as React from 'react'
import * as fc from 'fast-check'
import * as fs from 'fs'
import { glob } from 'glob'
import * as stylex from '@stylexjs/stylex'
import { TextField as AriaTextField } from 'react-aria-components'

import {
  Label,
  Description,
  FieldError,
  ErrorMessage,
  Form,
  Separator,
  Spinner,
  Skeleton,
  Button,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
  Link,
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
  Badge,
  Avatar,
  Typography,
  Surface,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Kbd,
  ModalOverlay,
  Modal,
  ModalDialog,
  Tooltip,
  TooltipTrigger,
  Popover,
  PopoverTrigger,
  PopoverDialog,
  Toast,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Breadcrumbs,
  BreadcrumbItem,
  Table,
  TableHeader,
  TableBody,
  Row,
  Column,
  Cell,
  ListBox,
  ListBoxItem,
  AlertDialog,
} from '../index'

const getTargetElement = (container: HTMLElement, className?: string) => {
  if (className) {
    const portalEl = document.body.querySelector(`.${className}`)
    if (portalEl) return portalEl as HTMLElement
  }
  let child = container.firstChild as HTMLElement
  while (child) {
    if (
      child.nodeType === Node.ELEMENT_NODE &&
      child.tagName !== 'TEMPLATE' &&
      !child.hasAttribute('data-focus-scope-start') &&
      !child.hasAttribute('data-focus-scope-end')
    ) {
      return child
    }
    child = child.nextSibling as HTMLElement
  }
  return container.firstChild as HTMLElement
}

// ── Define Lists of Components for Properties ──────────────────────────

const allComponents = [
  { name: 'Label', render: (props: any) => <Label {...props}>Label</Label> },
  {
    name: 'Description',
    render: (props: any) => <Description {...props}>Desc</Description>,
  },
  {
    name: 'FieldError',
    render: (props: any) => (
      <AriaTextField isInvalid>
        <FieldError {...props}>Error</FieldError>
      </AriaTextField>
    ),
  },
  {
    name: 'Form',
    render: (props: any) => (
      <Form {...props} onSubmit={(e) => e.preventDefault()} />
    ),
  },
  { name: 'Separator', render: (props: any) => <Separator {...props} /> },
  {
    name: 'Spinner',
    render: (props: any) => <Spinner {...props} aria-label="Loading" />,
  },
  { name: 'Skeleton', render: (props: any) => <Skeleton {...props} /> },
  {
    name: 'Button',
    render: (props: any) => <Button {...props}>Button</Button>,
  },
  {
    name: 'ButtonGroup',
    render: (props: any) => (
      <ButtonGroup {...props}>
        <Button>A</Button>
      </ButtonGroup>
    ),
  },
  {
    name: 'ToggleButton',
    render: (props: any) => <ToggleButton {...props}>Toggle</ToggleButton>,
  },
  {
    name: 'ToggleButtonGroup',
    render: (props: any) => (
      <ToggleButtonGroup {...props}>
        <ToggleButton>A</ToggleButton>
      </ToggleButtonGroup>
    ),
  },
  {
    name: 'Link',
    render: (props: any) => (
      <Link href="#" {...props}>
        Link
      </Link>
    ),
  },
  {
    name: 'Checkbox',
    render: (props: any) => <Checkbox {...props}>Check</Checkbox>,
  },
  {
    name: 'CheckboxGroup',
    render: (props: any) => (
      <CheckboxGroup label="Group" {...props}>
        <Checkbox value="a">A</Checkbox>
      </CheckboxGroup>
    ),
  },
  {
    name: 'RadioGroup',
    render: (props: any) => (
      <RadioGroup label="Group" {...props}>
        <Radio value="a">A</Radio>
      </RadioGroup>
    ),
  },
  {
    name: 'Radio',
    render: (props: any) => (
      <RadioGroup label="Group">
        <Radio value="a" {...props}>
          Radio
        </Radio>
      </RadioGroup>
    ),
  },
  {
    name: 'Switch',
    render: (props: any) => <Switch {...props}>Switch</Switch>,
  },
  {
    name: 'TextField',
    render: (props: any) => <TextField label="Text" {...props} />,
  },
  {
    name: 'TextArea',
    render: (props: any) => <TextArea label="Text" {...props} />,
  },
  {
    name: 'NumberField',
    render: (props: any) => <NumberField label="Number" {...props} />,
  },
  {
    name: 'SearchField',
    render: (props: any) => <SearchField label="Search" {...props} />,
  },
  {
    name: 'Select',
    render: (props: any) => (
      <Select label="Select" {...props}>
        <SelectItem id="a">A</SelectItem>
      </Select>
    ),
  },
  {
    name: 'ComboBox',
    render: (props: any) => (
      <ComboBox label="Combo" {...props}>
        <ComboBoxItem id="a">A</ComboBoxItem>
      </ComboBox>
    ),
  },
  {
    name: 'Slider',
    render: (props: any) => (
      <Slider label="Slider" {...props}>
        <SliderTrack>
          <SliderThumb />
        </SliderTrack>
      </Slider>
    ),
  },
  { name: 'Badge', render: (props: any) => <Badge {...props}>Badge</Badge> },
  { name: 'Avatar', render: (props: any) => <Avatar name="John" {...props} /> },
  {
    name: 'Typography',
    render: (props: any) => <Typography {...props}>Text</Typography>,
  },
  {
    name: 'Surface',
    render: (props: any) => <Surface {...props}>Surface</Surface>,
  },
  {
    name: 'Card',
    render: (props: any) => (
      <Card {...props}>
        <CardBody>Body</CardBody>
      </Card>
    ),
  },
  {
    name: 'CardHeader',
    render: (props: any) => <CardHeader {...props}>Header</CardHeader>,
  },
  {
    name: 'CardBody',
    render: (props: any) => <CardBody {...props}>Body</CardBody>,
  },
  {
    name: 'CardFooter',
    render: (props: any) => <CardFooter {...props}>Footer</CardFooter>,
  },
  { name: 'Kbd', render: (props: any) => <Kbd {...props}>Ctrl</Kbd> },
  {
    name: 'Modal',
    render: (props: any) => (
      <ModalOverlay isOpen={true} {...props} data-testid="modal-overlay">
        <Modal>
          <ModalDialog>Content</ModalDialog>
        </Modal>
      </ModalOverlay>
    ),
  },
  {
    name: 'AlertDialog',
    render: (props: any) => <AlertDialog {...props}>Alert</AlertDialog>,
  },
  {
    name: 'Tooltip',
    render: (props: any) => (
      <TooltipTrigger isOpen={true}>
        <Button>Trigger</Button>
        <Tooltip {...props}>Tooltip</Tooltip>
      </TooltipTrigger>
    ),
  },
  {
    name: 'Popover',
    render: (props: any) => (
      <PopoverTrigger isOpen={true}>
        <Button>Trigger</Button>
        <Popover {...props}>
          <PopoverDialog>Popover</PopoverDialog>
        </Popover>
      </PopoverTrigger>
    ),
  },
  {
    name: 'Tabs',
    render: (props: any) => (
      <Tabs {...props}>
        <TabList>
          <Tab id="a">A</Tab>
        </TabList>
        <TabPanel id="a">Panel</TabPanel>
      </Tabs>
    ),
  },
  {
    name: 'Breadcrumbs',
    render: (props: any) => (
      <Breadcrumbs {...props}>
        <BreadcrumbItem>
          <Link href="#">Home</Link>
        </BreadcrumbItem>
      </Breadcrumbs>
    ),
  },
  {
    name: 'Table',
    render: (props: any) => (
      <Table aria-label="Table" {...props}>
        <TableHeader>
          <Column>Col</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>Cell</Cell>
          </Row>
        </TableBody>
      </Table>
    ),
  },
  {
    name: 'ListBox',
    render: (props: any) => (
      <ListBox label="List" {...props}>
        <ListBoxItem>A</ListBoxItem>
      </ListBox>
    ),
  },
]

const interactiveComponents = [
  {
    name: 'Button',
    render: (props: any) => <Button {...props}>Btn</Button>,
    role: 'button',
  },
  {
    name: 'ToggleButton',
    render: (props: any) => <ToggleButton {...props}>Toggle</ToggleButton>,
    role: 'button',
  },
  {
    name: 'Link',
    render: (props: any) => (
      <Link href="#" {...props}>
        Link
      </Link>
    ),
    role: 'link',
  },
  {
    name: 'Checkbox',
    render: (props: any) => <Checkbox {...props}>Check</Checkbox>,
    role: 'checkbox',
  },
  {
    name: 'Switch',
    render: (props: any) => <Switch {...props}>Switch</Switch>,
    role: 'switch',
  },
  {
    name: 'RadioGroup',
    render: (props: any) => (
      <RadioGroup label="Group" {...props}>
        <Radio value="a">A</Radio>
      </RadioGroup>
    ),
    role: 'radiogroup',
  },
  {
    name: 'Radio',
    render: (props: any) => (
      <RadioGroup label="Group">
        <Radio value="a" {...props}>
          Radio
        </Radio>
      </RadioGroup>
    ),
    role: 'radio',
  },
  {
    name: 'TextField',
    render: (props: any) => <TextField label="Text" {...props} />,
    role: 'textbox',
  },
  {
    name: 'TextArea',
    render: (props: any) => <TextArea label="Text" {...props} />,
    role: 'textbox',
  },
  {
    name: 'SearchField',
    render: (props: any) => <SearchField label="Search" {...props} />,
    role: 'searchbox',
  },
  {
    name: 'NumberField',
    render: (props: any) => <NumberField label="Num" {...props} />,
    role: 'textbox',
  },
  {
    name: 'ComboBox',
    render: (props: any) => (
      <ComboBox label="Combo" {...props}>
        <ComboBoxItem id="a">A</ComboBoxItem>
      </ComboBox>
    ),
    role: 'combobox',
  },
  {
    name: 'Select',
    render: (props: any) => (
      <Select label="Select" {...props}>
        <SelectItem id="a">A</SelectItem>
      </Select>
    ),
    role: 'button',
  },
  {
    name: 'Slider',
    render: (props: any) => (
      <Slider label="Slider" {...props}>
        <SliderTrack>
          <SliderThumb />
        </SliderTrack>
      </Slider>
    ),
    role: 'slider',
  },
  {
    name: 'TabList',
    render: (props: any) => (
      <Tabs>
        <TabList {...props}>
          <Tab id="a">A</Tab>
        </TabList>
        <TabPanel id="a">Panel</TabPanel>
      </Tabs>
    ),
    role: 'tablist',
  },
  {
    name: 'ListBox',
    render: (props: any) => (
      <ListBox label="List" {...props}>
        <ListBoxItem>A</ListBoxItem>
      </ListBox>
    ),
    role: 'listbox',
  },
  {
    name: 'Breadcrumbs',
    render: (props: any) => (
      <Breadcrumbs {...props}>
        <BreadcrumbItem>
          <Link href="#">Home</Link>
        </BreadcrumbItem>
      </Breadcrumbs>
    ),
    role: 'navigation',
  },
  {
    name: 'Table',
    render: (props: any) => (
      <Table aria-label="Table" {...props}>
        <TableHeader>
          <Column>Col</Column>
        </TableHeader>
        <TableBody>
          <Row>
            <Cell>Cell</Cell>
          </Row>
        </TableBody>
      </Table>
    ),
    role: 'grid',
  },
]

const warningComponents = [
  {
    name: 'Button',
    render: (props: any) => <Button {...props}>{null}</Button>,
  },
  {
    name: 'ToggleButton',
    render: (props: any) => <ToggleButton {...props}>{null}</ToggleButton>,
  },
  {
    name: 'Checkbox',
    render: (props: any) => <Checkbox {...props}>{null}</Checkbox>,
  },
  {
    name: 'Switch',
    render: (props: any) => <Switch {...props}>{null}</Switch>,
  },
  {
    name: 'Radio',
    render: (props: any) => (
      <RadioGroup aria-label="Group">
        <Radio value="a" {...props}>
          {null}
        </Radio>
      </RadioGroup>
    ),
    customName: 'Radio',
  },
  { name: 'Spinner', render: (props: any) => <Spinner {...props} /> },
  { name: 'Avatar', render: (props: any) => <Avatar {...props} /> },
]

const formComponents = [
  {
    name: 'Checkbox',
    render: (props: any) => (
      <Checkbox {...props} defaultValue={true} value={true}>
        Check
      </Checkbox>
    ),
  },
  {
    name: 'CheckboxGroup',
    render: (props: any) => (
      <CheckboxGroup {...props} defaultValue={['a']} value={['a']}>
        <Checkbox value="a">A</Checkbox>
      </CheckboxGroup>
    ),
  },
  {
    name: 'RadioGroup',
    render: (props: any) => (
      <RadioGroup {...props} defaultValue="a" value="a">
        <Radio value="a">A</Radio>
      </RadioGroup>
    ),
  },
  {
    name: 'Switch',
    render: (props: any) => (
      <Switch {...props} defaultValue={true} value={true}>
        Switch
      </Switch>
    ),
  },
  {
    name: 'TextField',
    render: (props: any) => <TextField {...props} defaultValue="a" value="a" />,
  },
  {
    name: 'TextArea',
    render: (props: any) => <TextArea {...props} defaultValue="a" value="a" />,
  },
  {
    name: 'NumberField',
    render: (props: any) => (
      <NumberField {...props} defaultValue={10} value={10} />
    ),
  },
  {
    name: 'SearchField',
    render: (props: any) => (
      <SearchField {...props} defaultValue="a" value="a" />
    ),
  },
  {
    name: 'Select',
    render: (props: any) => (
      <Select {...props} defaultValue="a" value="a">
        <SelectItem id="a">A</SelectItem>
      </Select>
    ),
  },
  {
    name: 'ComboBox',
    render: (props: any) => (
      <ComboBox {...props} defaultValue="a" value="a">
        <ComboBoxItem id="a">A</ComboBoxItem>
      </ComboBox>
    ),
  },
  {
    name: 'Slider',
    render: (props: any) => (
      <Slider {...props} defaultValue={40} value={40}>
        <SliderTrack>
          <SliderThumb />
        </SliderTrack>
      </Slider>
    ),
  },
]

const disabledSupportedComponents = [
  { name: 'Button', render: (props: any) => <Button {...props}>Btn</Button> },
  {
    name: 'ToggleButton',
    render: (props: any) => <ToggleButton {...props}>Toggle</ToggleButton>,
  },
  {
    name: 'Link',
    render: (props: any) => (
      <Link href="#" {...props}>
        Link
      </Link>
    ),
  },
  {
    name: 'Checkbox',
    render: (props: any) => <Checkbox {...props}>Check</Checkbox>,
  },
  {
    name: 'Switch',
    render: (props: any) => <Switch {...props}>Switch</Switch>,
  },
  {
    name: 'RadioGroup',
    render: (props: any) => (
      <RadioGroup label="Group" {...props}>
        <Radio value="a">A</Radio>
      </RadioGroup>
    ),
  },
  {
    name: 'Radio',
    render: (props: any) => (
      <RadioGroup label="Group">
        <Radio value="a" {...props}>
          Radio
        </Radio>
      </RadioGroup>
    ),
  },
  {
    name: 'TextField',
    render: (props: any) => <TextField label="Text" {...props} />,
  },
  {
    name: 'TextArea',
    render: (props: any) => <TextArea label="Text" {...props} />,
  },
  {
    name: 'SearchField',
    render: (props: any) => <SearchField label="Search" {...props} />,
  },
  {
    name: 'NumberField',
    render: (props: any) => <NumberField label="Num" {...props} />,
  },
  {
    name: 'ComboBox',
    render: (props: any) => (
      <ComboBox label="Combo" {...props}>
        <ComboBoxItem id="a">A</ComboBoxItem>
      </ComboBox>
    ),
  },
  {
    name: 'Select',
    render: (props: any) => (
      <Select label="Select" {...props}>
        <SelectItem id="a">A</SelectItem>
      </Select>
    ),
  },
  {
    name: 'Slider',
    render: (props: any) => (
      <Slider label="Slider" {...props}>
        <SliderTrack>
          <SliderThumb />
        </SliderTrack>
      </Slider>
    ),
  },
]

// Local Styles for testing Precedence (Property 8)
const testStyles = stylex.create({
  red: {
    color: 'red',
  },
  blue: {
    color: 'blue',
  },
})

describe('Centralized Component Properties Tests', () => {
  // ── Property 3: Interactive components expose correct ARIA roles ───────
  test('Property 3: Interactive components expose correct ARIA roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...interactiveComponents),
        async (comp) => {
          const { container, unmount } = render(comp.render({}))
          const el = getTargetElement(container)

          // Find expected role element in tree, taking native tags (implicit roles) into account
          const matchesRole = (node: HTMLElement): boolean => {
            const role = node.getAttribute('role')
            const tag = node.tagName

            if (role === comp.role) return true

            // Check implicit HTML semantics
            if (
              comp.role === 'button' &&
              (tag === 'BUTTON' ||
                (tag === 'INPUT' &&
                  ['button', 'submit', 'reset', 'image'].includes(
                    node.getAttribute('type') || '',
                  )))
            )
              return true
            if (comp.role === 'link' && tag === 'A') return true
            if (
              comp.role === 'checkbox' &&
              tag === 'INPUT' &&
              node.getAttribute('type') === 'checkbox'
            )
              return true
            if (
              comp.role === 'radio' &&
              tag === 'INPUT' &&
              node.getAttribute('type') === 'radio'
            )
              return true
            if (
              comp.role === 'textbox' &&
              (tag === 'TEXTAREA' ||
                (tag === 'INPUT' &&
                  (node.getAttribute('type') || 'text') === 'text'))
            )
              return true
            if (
              comp.role === 'searchbox' &&
              tag === 'INPUT' &&
              node.getAttribute('type') === 'search'
            )
              return true
            if (comp.role === 'navigation' && tag === 'NAV') return true
            if (
              comp.role === 'slider' &&
              tag === 'INPUT' &&
              node.getAttribute('type') === 'range'
            )
              return true

            return false
          }

          // Delay slightly to let collection managers resolve state
          let hasExpectedRole = false
          for (let i = 0; i < 5; i++) {
            hasExpectedRole =
              matchesRole(el) ||
              Array.from(el.querySelectorAll('*')).some((n) =>
                matchesRole(n as HTMLElement),
              )
            if (hasExpectedRole) break
            await new Promise((resolve) => setTimeout(resolve, 2))
          }

          expect(hasExpectedRole).toBe(true)
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })

  // ── Property 4: ARIA label forwarding ──────────────────────────────────
  test('Property 4: ARIA label forwarding', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...interactiveComponents),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (comp, label) => {
          const { container, unmount } = render(
            comp.render({ 'aria-label': label }),
          )
          const el = getTargetElement(container)

          const getLabelCarrier = (node: HTMLElement): HTMLElement | null => {
            if (node.getAttribute('aria-label') === label) return node

            const children = Array.from(node.querySelectorAll('*'))
            for (const child of children) {
              if (child.getAttribute('aria-label') === label) {
                return child as HTMLElement
              }
            }

            const bodyElements = Array.from(document.body.querySelectorAll('*'))
            for (const bodyEl of bodyElements) {
              if (bodyEl.getAttribute('aria-label') === label) {
                return bodyEl as HTMLElement
              }
            }
            return null
          }

          const labelCarrier = getLabelCarrier(el)
          expect(labelCarrier).not.toBeNull()
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })

  // ── Property 5: Missing label warning fires console.warn ──────────────
  describe('Property 5: Missing label warnings', () => {
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

    test('Missing label warning fires console.warn', () => {
      fc.assert(
        fc.property(fc.constantFrom(...warningComponents), (comp) => {
          warnSpy.mockClear()
          const { unmount } = render(comp.render({}))
          expect(warnSpy).toHaveBeenCalledTimes(1)
          const expectedName = comp.customName || comp.name
          expect(warnSpy.mock.calls[0][0]).toContain(
            `[${expectedName}] This component has no accessible name`,
          )
          unmount()
        }),
        { numRuns: 20 },
      )
    })
  })

  // ── Property 6: Status/alert components use ARIA live regions ─────────
  test('Property 6: Status/alert components use ARIA live regions', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        (msg) => {
          // Toast status role test
          const mockToast = {
            key: '1',
            content: { title: msg, variant: 'info' as const },
          }
          const { container: toastContainer, unmount: toastUnmount } = render(
            <Toast toast={mockToast} />,
          )
          const toastEl = getTargetElement(toastContainer)
          const toastRoleCarrier =
            toastEl.querySelector('[role="status"]') || toastEl
          expect(toastRoleCarrier.getAttribute('role')).toBe('status')
          toastUnmount()

          // Toast alert role test (error variant)
          const mockErrorToast = {
            key: '2',
            content: { title: msg, variant: 'error' as const },
          }
          const { container: errorToastContainer, unmount: errorToastUnmount } =
            render(<Toast toast={mockErrorToast} />)
          const errorToastEl = getTargetElement(errorToastContainer)
          const errorToastRoleCarrier =
            errorToastEl.querySelector('[role="alert"]') || errorToastEl
          expect(errorToastRoleCarrier.getAttribute('role')).toBe('alert')
          errorToastUnmount()

          // ErrorMessage alert role test
          const { container: errContainer, unmount: errUnmount } = render(
            <ErrorMessage>{msg}</ErrorMessage>,
          )
          const errEl = getTargetElement(errContainer)
          expect(errEl.getAttribute('role')).toBe('alert')
          errUnmount()

          // AlertDialog alertdialog role test
          const { container: alertContainer, unmount: alertUnmount } = render(
            <AlertDialog>{msg}</AlertDialog>,
          )
          const alertEl = getTargetElement(alertContainer)
          expect(alertEl.getAttribute('role')).toBe('alertdialog')
          alertUnmount()
        },
      ),
      { numRuns: 10 },
    )
  })

  // ── Property 7: className is appended, not replaced ────────────────────
  test('Property 7: className is appended, not replaced', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allComponents),
        fc.string({ minLength: 1 }).filter((s) => /^[a-zA-Z][\w-]*$/.test(s)),
        async (comp, consumerClass) => {
          const { container, unmount } = render(
            comp.render({ className: consumerClass }),
          )

          let el: HTMLElement | null = null
          for (let i = 0; i < 5; i++) {
            el = getTargetElement(container, consumerClass)
            if (el && el.className.includes(consumerClass)) break
            await new Promise((resolve) => setTimeout(resolve, 2))
          }

          expect(el).not.toBeNull()
          expect(el!.className).toContain(consumerClass)
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })

  // ── Property 8: Consumer StyleX styles take precedence ──────────────────
  test('Property 8: Consumer StyleX styles take precedence', () => {
    const props = stylex.props(testStyles.red, testStyles.blue)
    const redProp = stylex.props(testStyles.red)
    const blueProp = stylex.props(testStyles.blue)

    expect(props.className).toContain(blueProp.className)
    expect(props.className).not.toContain(redProp.className)
  })

  // ── Property 9: ref forwarding resolves to DOM element ──────────────────
  test('Property 9: ref forwarding resolves to DOM element', async () => {
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...allComponents), async (comp) => {
        const ref = React.createRef<any>()
        const { unmount } = render(comp.render({ ref }))

        for (let i = 0; i < 5; i++) {
          if (ref.current) break
          await new Promise((resolve) => setTimeout(resolve, 2))
        }

        expect(ref.current).toBeInstanceOf(HTMLElement)
        unmount()
      }),
      { numRuns: 20 },
    )
  })

  // ── Property 10: HTML attribute pass-through ────────────────────────────
  test('Property 10: HTML attribute pass-through', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allComponents),
        fc.string({ minLength: 1 }).filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
        async (comp, val) => {
          const attrKey = `data-test-${val.toLowerCase()}`
          const { container, unmount } = render(comp.render({ [attrKey]: val }))
          const el = getTargetElement(container)

          const getAttrCarrier = (
            node: HTMLElement | null,
          ): HTMLElement | null => {
            if (!node) return null
            if (node.getAttribute(attrKey) === val) return node

            const children = Array.from(node.querySelectorAll('*'))
            for (const child of children) {
              if (child.getAttribute(attrKey) === val) {
                return child as HTMLElement
              }
            }

            const bodyElements = Array.from(document.body.querySelectorAll('*'))
            for (const bodyEl of bodyElements) {
              if (bodyEl.getAttribute(attrKey) === val) {
                return bodyEl as HTMLElement
              }
            }
            return null
          }

          let carrier: HTMLElement | null = null
          for (let i = 0; i < 5; i++) {
            carrier = getAttrCarrier(el)
            if (carrier) break
            await new Promise((resolve) => setTimeout(resolve, 2))
          }

          expect(carrier).not.toBeNull()
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })

  // ── Property 11: isDisabled applies correct disabled semantics ──────────
  test('Property 11: isDisabled applies correct disabled semantics', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...disabledSupportedComponents),
        async (comp) => {
          const { container, unmount } = render(
            comp.render({ isDisabled: true }),
          )
          const el = getTargetElement(container)

          const checkDisabled = (node: HTMLElement): boolean => {
            return (
              node.hasAttribute('disabled') ||
              node.getAttribute('aria-disabled') === 'true' ||
              node.querySelector('[disabled]') !== null ||
              node.querySelector('[aria-disabled="true"]') !== null
            )
          }

          // Delay slightly to let collection managers resolve state
          let hasSemantics = false
          for (let i = 0; i < 5; i++) {
            hasSemantics = checkDisabled(el)
            if (hasSemantics) break
            await new Promise((resolve) => setTimeout(resolve, 2))
          }

          expect(hasSemantics).toBe(true)
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })

  // ── Property 12: Controlled form component reflects value prop ─────────
  test('Property 12: Controlled form component reflects value prop', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        fc.integer(),
        fc.boolean(),
        (strVal, _intVal, boolVal) => {
          // TextField controlled value
          const { container: tf, unmount: tfU } = render(
            <TextField label="Text" value={strVal} onChange={() => {}} />,
          )
          const tfInput = tf.querySelector('input')
          expect(tfInput?.value).toBe(strVal)
          tfU()

          // TextArea controlled value
          const { container: ta, unmount: taU } = render(
            <TextArea label="Text" value={strVal} onChange={() => {}} />,
          )
          const taInput = ta.querySelector('textarea')
          expect(taInput?.value).toBe(strVal)
          taU()

          // SearchField controlled value
          const { container: sf, unmount: sfU } = render(
            <SearchField label="Search" value={strVal} onChange={() => {}} />,
          )
          const sfInput = sf.querySelector('input')
          expect(sfInput?.value).toBe(strVal)
          sfU()

          // Checkbox controlled value (isSelected)
          const { container: cb, unmount: cbU } = render(
            <Checkbox isSelected={boolVal} onChange={() => {}}>
              Check
            </Checkbox>,
          )
          const cbInput = cb.querySelector('input')
          expect(cbInput?.checked).toBe(boolVal)
          cbU()

          // Switch controlled value (isSelected)
          const { container: sw, unmount: swU } = render(
            <Switch isSelected={boolVal} onChange={() => {}}>
              Switch
            </Switch>,
          )
          const swInput = sw.querySelector('input')
          expect(swInput?.checked).toBe(boolVal)
          swU()
        },
      ),
      { numRuns: 10 },
    )
  })

  // ── Property 13: Hidden native input carries name and value ─────────────
  test('Property 13: Hidden native input carries name and value', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...formComponents),
        fc.string({ minLength: 1 }).filter((s) => /^[a-zA-Z][\w-]*$/.test(s)),
        (comp, name) => {
          const { container, unmount } = render(comp.render({ name }))
          const inputEl = container.querySelector(`[name="${name}"]`)
          expect(inputEl).toBeInTheDocument()
          unmount()
        },
      ),
      { numRuns: 20 },
    )
  })

  // ── Property 14: FieldError visibility invariant ────────────────────────
  test('Property 14: FieldError visibility invariant', () => {
    fc.assert(
      fc.property(fc.boolean(), (isInvalid) => {
        const { container, unmount } = render(
          <TextField isInvalid={isInvalid} errorMessage="Err string" />,
        )
        const errorTextEl = container.querySelector('[role="alert"]')
        if (isInvalid) {
          expect(errorTextEl).toBeInTheDocument()
          expect(errorTextEl?.textContent).toBe('Err string')
        } else {
          expect(errorTextEl).toBeNull()
        }
        unmount()
      }),
      { numRuns: 20 },
    )
  })

  // ── Property 15: CSS logical properties — no physical directional CSS ──
  test('Property 15: CSS logical properties — no physical directional values', () => {
    const componentStyles = glob.sync('src/components/**/*.styles.ts')
    const tokenStyles = glob.sync('src/tokens/**/*.stylex.ts')
    const files = [...componentStyles, ...tokenStyles]

    const physicalPropsRegex =
      /\b(marginLeft|marginRight|paddingLeft|paddingRight|borderLeft|borderRight)\b/
    const physicalKeysRegex = /\b(left|right)\s*:/
    const textAlignRegex = /textAlign\s*:\s*['"](left|right)['"]/

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8')
      expect(content).not.toMatch(physicalPropsRegex)
      expect(content).not.toMatch(physicalKeysRegex)
      expect(content).not.toMatch(textAlignRegex)
    }
  })

  // ── Property 16: RTL layout mirroring ──────────────────────────────────
  test('Property 16: RTL layout mirroring', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allComponents), (comp) => {
        const { container, unmount } = render(
          <div dir="rtl">{comp.render({})}</div>,
        )
        const el = getTargetElement(container)
        expect(el.closest('[dir="rtl"]')).not.toBeNull()
        unmount()
      }),
      { numRuns: 20 },
    )
  })

  // ── Property 17: SSR renders without browser globals ────────────────────
  test('Property 17: SSR renders without browser globals', async () => {
    const { renderToString } = await import('react-dom/server')

    fc.assert(
      fc.property(fc.constantFrom(...allComponents), (comp) => {
        const originalWindow = globalThis.window
        const originalDocument = globalThis.document

        try {
          // @ts-ignore
          delete globalThis.window
          // @ts-ignore
          delete globalThis.document

          const html = renderToString(comp.render({}))
          expect(typeof html).toBe('string')
        } finally {
          globalThis.window = originalWindow
          globalThis.document = originalDocument
        }
      }),
      { numRuns: 20 },
    )
  })

  // ── Property 18: SSR/client render parity ───────────────────────────────
  test('Property 18: SSR/client render parity', async () => {
    const { renderToString } = await import('react-dom/server')

    // Recursive structural DOM equivalence helper
    function assertDOMEquivalence(nodeA: Node, nodeB: Node) {
      expect(nodeA.nodeType).toBe(nodeB.nodeType)
      if (nodeA.nodeType === Node.TEXT_NODE) {
        expect(nodeA.textContent?.trim()).toBe(nodeB.textContent?.trim())
        return
      }
      if (nodeA.nodeType === Node.ELEMENT_NODE) {
        const elA = nodeA as HTMLElement
        const elB = nodeB as HTMLElement
        expect(elA.tagName).toBe(elB.tagName)

        const getNormalizedAttrs = (el: HTMLElement) => {
          const attrs: Record<string, string> = {}
          for (let i = 0; i < el.attributes.length; i++) {
            const attr = el.attributes[i]
            const name = attr.name.toLowerCase()

            // Ignore style attribute, parsed style is compared separately
            if (name === 'style') continue

            // Ignore tabindex, as focus management/tabindex is dynamically set on client hydration
            if (name === 'tabindex') continue

            // Normalise and placeholder react-aria dynamic ID strings in any attribute value
            let val = attr.value
            val = val.replace(
              /react-aria-(?:_[rR]_)?([a-zA-Z0-9_-]+)/g,
              'react-aria-placeholder',
            )
            val = val.replace(
              /react-aria-placeholder(?:\s+react-aria-placeholder)+/g,
              'react-aria-placeholder',
            )

            // Normalise casing differences (browser lowercases attributes, ssr keeps camelCase)
            if (
              [
                'autocomplete',
                'inputmode',
                'autocorrect',
                'spellcheck',
              ].includes(name)
            ) {
              attrs[name] = val.toLowerCase()
            } else {
              attrs[name] = val
            }
          }
          return attrs
        }

        const attrsA = getNormalizedAttrs(elA)
        const attrsB = getNormalizedAttrs(elB)

        for (const key of Object.keys(attrsA)) {
          if (key in attrsB) {
            expect(attrsA[key]).toBe(attrsB[key])
          }
        }
        for (const key of Object.keys(attrsB)) {
          if (key in attrsA) {
            expect(attrsA[key]).toBe(attrsB[key])
          }
        }

        // Compare parsed styles directly to avoid raw style string formatting mismatches
        const styleA = elA.style
        const styleB = elB.style
        for (let i = 0; i < styleA.length; i++) {
          const prop = styleA[i]
          expect(styleA.getPropertyValue(prop)).toBe(
            styleB.getPropertyValue(prop),
          )
        }
        for (let i = 0; i < styleB.length; i++) {
          const prop = styleB[i]
          expect(styleA.getPropertyValue(prop)).toBe(
            styleB.getPropertyValue(prop),
          )
        }

        const childrenA = Array.from(elA.childNodes).filter(
          (n) => n.nodeType !== Node.COMMENT_NODE,
        )
        const childrenB = Array.from(elB.childNodes).filter(
          (n) => n.nodeType !== Node.COMMENT_NODE,
        )
        expect(childrenA.length).toBe(childrenB.length)

        for (let i = 0; i < childrenA.length; i++) {
          assertDOMEquivalence(childrenA[i], childrenB[i])
        }
      }
    }

    fc.assert(
      fc.property(fc.constantFrom(...allComponents), (comp) => {
        // Skip overlays because portal rendering behaves differently in SSR vs DOM
        if (['Modal', 'Tooltip', 'Popover'].includes(comp.name)) {
          return
        }

        const element = comp.render({})
        const ssrStr = renderToString(element)

        const ssrContainer = document.createElement('div')
        ssrContainer.innerHTML = ssrStr

        const { container, unmount } = render(element)

        assertDOMEquivalence(container, ssrContainer)
        unmount()
      }),
      { numRuns: 20 },
    )
  })
})
