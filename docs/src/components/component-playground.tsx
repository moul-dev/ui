'use client'

import React, { useState, useEffect } from 'react'
import {
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Switch,
  Select,
  SelectItem,
  TextField,
  Slider,
  Badge,
  Alert,
  TagGroup,
  Tag,
  Tooltip,
  TooltipTrigger,
  ToastContainer,
  useToast
} from '@moul-dev/ui'

// Custom Syntax Highlighting for JSX
function highlightJSX(code: string): string {
  // Escape HTML entities first to prevent rendering issues
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Apply highlighting using non-colliding placeholder tags
  let highlighted = escaped
    // 1. Highlight component tag names (&lt;Button, &lt;/Button, etc.)
    .replace(/(&lt;\/?[A-Z][a-zA-Z0-9]*)/g, '___TAG_START___$1___TAG_END___')
    // 2. Highlight closing tag brackets (&gt; or /&gt;) of component tags
    .replace(/(\/&gt;|___TAG_END___.*?)(&gt;)/g, '$1___TAG_START___$2___TAG_END___')
    // 3. Highlight string literals (double/single quotes, escaped/unescaped)
    .replace(/(&quot;.*?&quot;|&#x27;.*?&#x27;|&#39;.*?&#39;|'.*?'|".*?")/g, '___STR_START___$1___STR_END___')
    // 4. Highlight prop keys (words followed directly by = sign)
    .replace(/(\b[a-zA-Z0-9_-]+)(?=\=)/g, '___PROP_START___$1___PROP_END___')
    // 5. Highlight braced expressions ({...})
    .replace(/({.*?})/g, '___EXPR_START___$1___EXPR_END___')

  // Finally, replace placeholders with actual styled HTML spans
  return highlighted
    .replace(/___TAG_START___/g, '<span class="text-indigo-500 dark:text-indigo-400">')
    .replace(/___TAG_END___/g, '</span>')
    .replace(/___STR_START___/g, '<span class="text-emerald-600 dark:text-emerald-400">')
    .replace(/___STR_END___/g, '</span>')
    .replace(/___PROP_START___/g, '<span class="text-amber-500 dark:text-amber-300">')
    .replace(/___PROP_END___/g, '</span>')
    .replace(/___EXPR_START___/g, '<span class="text-blue-500 dark:text-blue-400">')
    .replace(/___EXPR_END___/g, '</span>')
}

interface PropConfig {
  name: string
  type: 'select' | 'boolean' | 'text' | 'number'
  label: string
  options?: string[]
  defaultValue: any
  min?: number
  max?: number
  step?: number
}

interface ComponentConfig {
  name: string
  defaultProps: Record<string, any>
  props: PropConfig[]
}

const REGISTRY: Record<string, ComponentConfig> = {
  Button: {
    name: 'Button',
    defaultProps: {
      variant: 'primary',
      size: 'md',
      isDisabled: false,
      isPending: false,
      children: 'Button Text',
    },
    props: [
      {
        name: 'variant',
        type: 'select',
        label: 'Variant',
        options: ['primary', 'secondary', 'tertiary', 'outline', 'ghost', 'danger', 'danger-soft'],
        defaultValue: 'primary',
      },
      {
        name: 'size',
        type: 'select',
        label: 'Size',
        options: ['sm', 'md', 'lg'],
        defaultValue: 'md',
      },
      {
        name: 'children',
        type: 'text',
        label: 'Button Text',
        defaultValue: 'Button Text',
      },
      {
        name: 'isDisabled',
        type: 'boolean',
        label: 'Disabled',
        defaultValue: false,
      },
      {
        name: 'isPending',
        type: 'boolean',
        label: 'Pending',
        defaultValue: false,
      },
    ],
  },
  TextField: {
    name: 'TextField',
    defaultProps: {
      label: 'Email Address',
      placeholder: 'user@example.com',
      description: 'We will not share your email.',
      errorMessage: 'Please enter a valid email address.',
      isDisabled: false,
      isReadOnly: false,
      isRequired: false,
    },
    props: [
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        defaultValue: 'Email Address',
      },
      {
        name: 'placeholder',
        type: 'text',
        label: 'Placeholder',
        defaultValue: 'user@example.com',
      },
      {
        name: 'description',
        type: 'text',
        label: 'Description Helper',
        defaultValue: 'We will not share your email.',
      },
      {
        name: 'errorMessage',
        type: 'text',
        label: 'Error Message',
        defaultValue: 'Please enter a valid email address.',
      },
      {
        name: 'isDisabled',
        type: 'boolean',
        label: 'Disabled',
        defaultValue: false,
      },
      {
        name: 'isReadOnly',
        type: 'boolean',
        label: 'Read Only',
        defaultValue: false,
      },
      {
        name: 'isRequired',
        type: 'boolean',
        label: 'Required',
        defaultValue: false,
      },
    ],
  },
  Switch: {
    name: 'Switch',
    defaultProps: {
      isDisabled: false,
      children: 'Enable Notifications',
    },
    props: [
      {
        name: 'children',
        type: 'text',
        label: 'Label',
        defaultValue: 'Enable Notifications',
      },
      {
        name: 'isDisabled',
        type: 'boolean',
        label: 'Disabled',
        defaultValue: false,
      },
    ],
  },
  Select: {
    name: 'Select',
    defaultProps: {
      label: 'Choose Role',
      placeholder: 'Select a profile...',
      isDisabled: false,
    },
    props: [
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        defaultValue: 'Choose Role',
      },
      {
        name: 'placeholder',
        type: 'text',
        label: 'Placeholder',
        defaultValue: 'Select a profile...',
      },
      {
        name: 'isDisabled',
        type: 'boolean',
        label: 'Disabled',
        defaultValue: false,
      },
    ],
  },
  ToggleButton: {
    name: 'ToggleButton',
    defaultProps: {
      variant: 'primary',
      size: 'md',
      isDisabled: false,
      isSquare: false,
      children: 'Mute Audio',
    },
    props: [
      {
        name: 'variant',
        type: 'select',
        label: 'Variant',
        options: ['primary', 'secondary'],
        defaultValue: 'primary',
      },
      {
        name: 'size',
        type: 'select',
        label: 'Size',
        options: ['sm', 'md', 'lg'],
        defaultValue: 'md',
      },
      {
        name: 'children',
        type: 'text',
        label: 'Button Label',
        defaultValue: 'Mute Audio',
      },
      {
        name: 'isDisabled',
        type: 'boolean',
        label: 'Disabled',
        defaultValue: false,
      },
      {
        name: 'isSquare',
        type: 'boolean',
        label: 'Square Style',
        defaultValue: false,
      },
    ],
  },
  Slider: {
    name: 'Slider',
    defaultProps: {
      label: 'Brightness Level',
      isDisabled: false,
      minValue: 0,
      maxValue: 100,
      step: 1,
      defaultValue: 40,
    },
    props: [
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        defaultValue: 'Brightness Level',
      },
      {
        name: 'minValue',
        type: 'number',
        label: 'Min Value',
        defaultValue: 0,
      },
      {
        name: 'maxValue',
        type: 'number',
        label: 'Max Value',
        defaultValue: 100,
      },
      {
        name: 'step',
        type: 'number',
        label: 'Step Increment',
        defaultValue: 1,
      },
      {
        name: 'isDisabled',
        type: 'boolean',
        label: 'Disabled',
        defaultValue: false,
      },
    ],
  },
  Badge: {
    name: 'Badge',
    defaultProps: {
      variant: 'neutral',
      children: 'Active Status',
    },
    props: [
      {
        name: 'variant',
        type: 'select',
        label: 'Variant',
        options: ['neutral', 'primary', 'success', 'warning', 'error'],
        defaultValue: 'neutral',
      },
      {
        name: 'children',
        type: 'text',
        label: 'Badge Text',
        defaultValue: 'Active Status',
      },
    ],
  },
  Toast: {
    name: 'Toast',
    defaultProps: {
      title: 'Action Complete',
      description: 'Your user profile details have been saved successfully.',
      variant: 'success',
    },
    props: [
      {
        name: 'title',
        type: 'text',
        label: 'Toast Title',
        defaultValue: 'Action Complete',
      },
      {
        name: 'description',
        type: 'text',
        label: 'Description Text',
        defaultValue: 'Your user profile details have been saved successfully.',
      },
      {
        name: 'variant',
        type: 'select',
        label: 'Toast Variant',
        options: ['info', 'success', 'warning', 'error'],
        defaultValue: 'success',
      },
    ],
  },
  Alert: {
    name: 'Alert',
    defaultProps: {
      variant: 'info',
      title: 'Maintenance Alert',
      description: 'The API server will undergo scheduled updates tonight at 12:00 AM UTC.',
      hasCloseButton: true,
    },
    props: [
      {
        name: 'variant',
        type: 'select',
        label: 'Alert Variant',
        options: ['info', 'success', 'warning', 'error'],
        defaultValue: 'info',
      },
      {
        name: 'title',
        type: 'text',
        label: 'Alert Title',
        defaultValue: 'Maintenance Alert',
      },
      {
        name: 'description',
        type: 'text',
        label: 'Alert Description',
        defaultValue: 'The API server will undergo scheduled updates tonight at 12:00 AM UTC.',
      },
      {
        name: 'hasCloseButton',
        type: 'boolean',
        label: 'Close Button',
        defaultValue: true,
      },
    ],
  },
  TagGroup: {
    name: 'TagGroup',
    defaultProps: {
      label: 'Add Topics',
      variant: 'primary',
      size: 'md',
      selectionMode: 'multiple',
    },
    props: [
      {
        name: 'label',
        type: 'text',
        label: 'Group Label',
        defaultValue: 'Add Topics',
      },
      {
        name: 'variant',
        type: 'select',
        label: 'Tag Variant',
        options: ['primary', 'secondary', 'tertiary'],
        defaultValue: 'primary',
      },
      {
        name: 'size',
        type: 'select',
        label: 'Size',
        options: ['sm', 'md', 'lg'],
        defaultValue: 'md',
      },
      {
        name: 'selectionMode',
        type: 'select',
        label: 'Selection Mode',
        options: ['none', 'single', 'multiple'],
        defaultValue: 'multiple',
      },
    ],
  },
  Tooltip: {
    name: 'Tooltip',
    defaultProps: {
      placement: 'top',
      children: 'This is helper information!',
    },
    props: [
      {
        name: 'placement',
        type: 'select',
        label: 'Tooltip Placement',
        options: ['top', 'bottom', 'left', 'right'],
        defaultValue: 'top',
      },
      {
        name: 'children',
        type: 'text',
        label: 'Tooltip Text',
        defaultValue: 'This is helper information!',
      },
    ],
  },
}

// Custom Toast Preview wrapper
function ToastPreviewWrapper({ title, description, variant }: { title: string; description: string; variant: string }) {
  const toast = useToast()
  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onPress={() =>
          toast.show(title, {
            description,
            variant: variant as any,
          })
        }
      >
        Trigger Toast Notification
      </Button>
      <ToastContainer />
    </div>
  )
}

// Custom Alert Preview wrapper that handles resets
function AlertPreviewWrapper({ variant, title, description, hasCloseButton }: { variant: string; title: string; description: string; hasCloseButton: boolean }) {
  const [isOpen, setIsOpen] = useState(true)

  // Auto reset when props change
  useEffect(() => {
    setIsOpen(true)
  }, [variant, title, description, hasCloseButton])

  if (!isOpen) {
    return (
      <Button variant="outline" onPress={() => setIsOpen(true)}>
        Reopen Alert
      </Button>
    )
  }

  return (
    <Alert
      variant={variant as any}
      title={title}
      onClose={hasCloseButton ? () => setIsOpen(false) : undefined}
    >
      {description}
    </Alert>
  )
}

// Custom TagGroup Preview wrapper
function TagGroupPreviewWrapper({ label, variant, size, selectionMode }: { label: string; variant: string; size: string; selectionMode: string }) {
  const [selected, setSelected] = useState<any>(new Set(['coding']))
  return (
    <div className="flex flex-col gap-3 w-full max-w-[320px]">
      <TagGroup
        label={label}
        variant={variant as any}
        size={size as any}
        selectionMode={selectionMode as any}
        selectedKeys={selected}
        onSelectionChange={setSelected}
      >
        <Tag id="coding">Software Development</Tag>
        <Tag id="design">UI/UX Design</Tag>
        <Tag id="strategy">Product Roadmap</Tag>
      </TagGroup>
      {selectionMode !== 'none' && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          Selected: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{[...selected].join(', ') || 'None'}</span>
        </div>
      )}
    </div>
  )
}

export function ComponentPlayground({ component }: { component: string }) {
  const config = REGISTRY[component]
  if (!config) {
    return (
      <div className="p-4 text-red-500 border border-red-200 rounded">
        Component "{component}" not found in Playground registry.
      </div>
    )
  }

  // Initialize state with default properties
  const [activeProps, setActiveProps] = useState<Record<string, any>>(config.defaultProps)
  const [copied, setCopied] = useState(false)

  // Track prop changes
  const handlePropChange = (name: string, value: any) => {
    setActiveProps((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Generate JSX Code string
  const generateCode = (): string => {
    switch (component) {
      case 'Button': {
        const { variant, size, isDisabled, isPending, children } = activeProps
        let propsStr = ''
        if (variant !== 'primary') propsStr += ` variant="${variant}"`
        if (size !== 'md') propsStr += ` size="${size}"`
        if (isDisabled) propsStr += ` isDisabled`
        if (isPending) propsStr += ` isPending`
        return `import { Button } from '@moul-dev/ui';

export default function Example() {
  return (
    <Button${propsStr}>
      ${children}
    </Button>
  );
}`
      }
      case 'TextField': {
        const { label, placeholder, description, errorMessage, isDisabled, isReadOnly, isRequired } = activeProps
        let propsStr = ''
        if (label) propsStr += ` label="${label}"`
        if (placeholder) propsStr += ` placeholder="${placeholder}"`
        if (description) propsStr += ` description="${description}"`
        if (errorMessage) propsStr += ` errorMessage="${errorMessage}"`
        if (isDisabled) propsStr += ` isDisabled`
        if (isReadOnly) propsStr += ` isReadOnly`
        if (isRequired) propsStr += ` isRequired`
        return `import { TextField } from '@moul-dev/ui';
import { useState } from 'react';

export default function Example() {
  const [value, setValue] = useState('');

  return (
    <TextField
      value={value}
      onChange={setValue}${propsStr}
    />
  );
}`
      }
      case 'Switch': {
        const { isDisabled, children } = activeProps
        let propsStr = ''
        if (isDisabled) propsStr += ` isDisabled`
        return `import { Switch } from '@moul-dev/ui';
import { useState } from 'react';

export default function Example() {
  const [isSelected, setIsSelected] = useState(false);

  return (
    <Switch
      isSelected={isSelected}
      onChange={setIsSelected}${propsStr}
    >
      ${children}
    </Switch>
  );
}`
      }
      case 'Select': {
        const { label, placeholder, isDisabled } = activeProps
        let propsStr = ''
        if (label) propsStr += ` label="${label}"`
        if (placeholder) propsStr += ` placeholder="${placeholder}"`
        if (isDisabled) propsStr += ` isDisabled`
        return `import { Select, SelectItem } from '@moul-dev/ui';
import { useState } from 'react';
import type { Key } from 'react-aria-components';

export default function Example() {
  const [selectedKey, setSelectedKey] = useState<Key>('editor');

  return (
    <Select
      selectedKey={selectedKey}
      onSelectionChange={setSelectedKey}${propsStr}
    >
      <SelectItem id="admin">Administrator</SelectItem>
      <SelectItem id="editor">Editor</SelectItem>
      <SelectItem id="viewer">Viewer</SelectItem>
    </Select>
  );
}`
      }
      case 'ToggleButton': {
        const { variant, size, isDisabled, isSquare, children } = activeProps
        let propsStr = ''
        if (variant !== 'primary') propsStr += ` variant="${variant}"`
        if (size !== 'md') propsStr += ` size="${size}"`
        if (isDisabled) propsStr += ` isDisabled`
        if (isSquare) propsStr += ` isSquare`
        return `import { ToggleButton } from '@moul-dev/ui';
import { useState } from 'react';

export default function Example() {
  const [isSelected, setIsSelected] = useState(false);

  return (
    <ToggleButton
      isSelected={isSelected}
      onChange={setIsSelected}${propsStr}
    >
      ${children}
    </ToggleButton>
  );
}`
      }
      case 'Slider': {
        const { label, isDisabled, minValue, maxValue, step, defaultValue } = activeProps
        let propsStr = ''
        if (label) propsStr += ` label="${label}"`
        if (minValue !== 0) propsStr += ` minValue={${minValue}}`
        if (maxValue !== 100) propsStr += ` maxValue={${maxValue}}`
        if (step !== 1) propsStr += ` step={${step}}`
        if (defaultValue !== undefined) propsStr += ` defaultValue={${defaultValue}}`
        if (isDisabled) propsStr += ` isDisabled`
        return `import { Slider } from '@moul-dev/ui';
import { useState } from 'react';

export default function Example() {
  const [value, setValue] = useState(40);

  return (
    <Slider
      value={value}
      onChange={setValue}${propsStr}
    />
  );
}`
      }
      case 'Badge': {
        const { variant, children } = activeProps
        let propsStr = ''
        if (variant !== 'neutral') propsStr += ` variant="${variant}"`
        return `import { Badge } from '@moul-dev/ui';

export default function Example() {
  return (
    <Badge${propsStr}>
      ${children}
    </Badge>
  );
}`
      }
      case 'Toast': {
        const { title, description, variant } = activeProps
        return `import { Button, ToastContainer, useToast } from '@moul-dev/ui';

export default function Example() {
  const toast = useToast();

  return (
    <>
      <Button
        onPress={() =>
          toast.show('${title}', {
            description: '${description}',
            variant: '${variant}'
          })
        }
      >
        Trigger Toast
      </Button>
      <ToastContainer />
    </>
  );
}`
      }
      case 'Alert': {
        const { variant, title, description, hasCloseButton } = activeProps
        let propsStr = ` variant="${variant}" title="${title}"`
        return `import { Alert } from '@moul-dev/ui';
import { useState } from 'react';

export default function Example() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <Alert${propsStr}${hasCloseButton ? ' onClose={() => setIsOpen(false)}' : ''}>
      ${description}
    </Alert>
  );
}`
      }
      case 'TagGroup': {
        const { label, variant, size, selectionMode } = activeProps
        let propsStr = ''
        if (label) propsStr += ` label="${label}"`
        if (variant !== 'secondary') propsStr += ` variant="${variant}"`
        if (size !== 'md') propsStr += ` size="${size}"`
        if (selectionMode !== 'none') propsStr += ` selectionMode="${selectionMode}"`
        
        if (selectionMode === 'none') {
          return `import { TagGroup, Tag } from '@moul-dev/ui';

export default function Example() {
  return (
    <TagGroup${propsStr}>
      <Tag id="coding">Software Development</Tag>
      <Tag id="design">UI/UX Design</Tag>
      <Tag id="strategy">Product Roadmap</Tag>
    </TagGroup>
  );
}`
        }

        return `import { TagGroup, Tag } from '@moul-dev/ui';
import { useState } from 'react';
import type { Selection } from 'react-aria-components';

export default function Example() {
  const [selected, setSelected] = useState<Selection>(new Set(['coding']));

  return (
    <TagGroup
      selectedKeys={selected}
      onSelectionChange={setSelected}${propsStr}
    >
      <Tag id="coding">Software Development</Tag>
      <Tag id="design">UI/UX Design</Tag>
      <Tag id="strategy">Product Roadmap</Tag>
    </TagGroup>
  );
}`
      }
      case 'Tooltip': {
        const { placement, children } = activeProps
        let propsStr = ''
        if (placement !== 'top') propsStr += ` placement="${placement}"`
        return `import { Button, Tooltip, TooltipTrigger } from '@moul-dev/ui';

export default function Example() {
  return (
    <TooltipTrigger>
      <Button variant="outline">Hover me</Button>
      <Tooltip${propsStr}>
        ${children}
      </Tooltip>
    </TooltipTrigger>
  );
}`
      }
      default:
        return `<${component} />`
    }
  }

  const codeText = generateCode()

  // Copy code to clipboard
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = codeText
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Render the component preview
  const renderPreview = () => {
    switch (component) {
      case 'Button':
        return <Button {...activeProps}>{activeProps.children}</Button>
      case 'TextField':
        return <TextField {...activeProps} />
      case 'Switch':
        return <Switch {...activeProps}>{activeProps.children}</Switch>
      case 'Select':
        return (
          <Select {...activeProps}>
            <SelectItem id="admin">Administrator</SelectItem>
            <SelectItem id="editor">Editor</SelectItem>
            <SelectItem id="viewer">Viewer</SelectItem>
          </Select>
        )
      case 'ToggleButton':
        return <ToggleButton {...activeProps}>{activeProps.children}</ToggleButton>
      case 'Slider':
        return <Slider {...activeProps} />
      case 'Badge':
        return <Badge {...activeProps}>{activeProps.children}</Badge>
      case 'Toast':
        return (
          <ToastPreviewWrapper
            title={activeProps.title}
            description={activeProps.description}
            variant={activeProps.variant}
          />
        )
      case 'Alert':
        return (
          <AlertPreviewWrapper
            variant={activeProps.variant}
            title={activeProps.title}
            description={activeProps.description}
            hasCloseButton={activeProps.hasCloseButton}
          />
        )
      case 'TagGroup':
        return (
          <TagGroupPreviewWrapper
            label={activeProps.label}
            variant={activeProps.variant}
            size={activeProps.size}
            selectionMode={activeProps.selectionMode}
          />
        )
      case 'Tooltip':
        return (
          <div className="py-6">
            <TooltipTrigger>
              <Button variant="outline">Hover me</Button>
              <Tooltip placement={activeProps.placement}>{activeProps.children}</Tooltip>
            </TooltipTrigger>
          </div>
        )
      default:
        return <div>No Preview Available</div>
    }
  }

  return (
    <div className="not-prose border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-950/70 shadow-sm flex flex-col my-8">
      {/* Top Banner */}
      <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-200">{config.name} Playground</span>
        </div>
        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">interactive</span>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 min-h-[350px]">
        {/* Preview Panel (Left Columns) */}
        <div className="lg:col-span-2 p-8 flex items-center justify-center bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:16px_16px] border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800">
          <div className="max-w-md w-full flex justify-center">
            {renderPreview()}
          </div>
        </div>

        {/* Controls Panel (Right Column) */}
        <div className="p-6 flex flex-col gap-6 bg-neutral-50/30 dark:bg-neutral-900/20 overflow-y-auto max-h-[450px]">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Properties</h4>
          
          <div className="flex flex-col gap-5">
            {config.props.map((prop) => {
              const value = activeProps[prop.name]

              return (
                <div key={prop.name} className="flex flex-col gap-1.5">
                  {/* Select Prop Control */}
                  {prop.type === 'select' && (
                    <Select
                      label={prop.label}
                      placeholder={`Choose ${prop.name}`}
                      selectedKey={value}
                      onSelectionChange={(val) => handlePropChange(prop.name, val)}
                    >
                      {prop.options?.map((opt) => (
                        <SelectItem key={opt} id={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </Select>
                  )}

                  {/* Text Prop Control */}
                  {prop.type === 'text' && (
                    <TextField
                      label={prop.label}
                      placeholder={prop.defaultValue}
                      value={value}
                      onChange={(val) => handlePropChange(prop.name, val)}
                    />
                  )}

                  {/* Number Prop Control */}
                  {prop.type === 'number' && (
                    <TextField
                      label={prop.label}
                      type="number"
                      value={String(value)}
                      onChange={(val) => handlePropChange(prop.name, Number(val))}
                    />
                  )}

                  {/* Boolean Prop Control */}
                  {prop.type === 'boolean' && (
                    <div className="flex items-center pt-2">
                      <Switch
                        isSelected={value}
                        onChange={(checked) => handlePropChange(prop.name, checked)}
                      >
                        {prop.label}
                      </Switch>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Code Snippet Footer */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 bg-neutral-950 text-neutral-50 p-4 font-mono text-sm relative group">
        <div className="flex justify-between items-center pb-2 border-b border-neutral-800 mb-2">
          <span className="text-xs text-neutral-500 font-semibold tracking-wider uppercase">Live Code Snippet</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded transition-all cursor-pointer animate-none"
          >
            {copied ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
        <pre className="overflow-x-auto whitespace-pre p-2 leading-relaxed text-xs">
          <code dangerouslySetInnerHTML={{ __html: highlightJSX(codeText) }} />
        </pre>
      </div>
    </div>
  )
}
