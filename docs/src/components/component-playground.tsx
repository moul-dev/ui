'use client'

import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  EmptyState,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Pagination,
  ProgressBar,
  Select,
  SelectItem,
  Sidebar,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  Slider,
  SliderThumb,
  SliderTrack,
  Switch,
  Tag,
  TagGroup,
  TextField,
  ToastContainer,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TooltipTrigger,
  Typography,
  useToast,
} from '@moul-dev/ui'
import type React from 'react'
import { useEffect, useState } from 'react'

// Custom Syntax Highlighting for JSX
function highlightJSX(code: string): string {
  // Escape HTML entities first to prevent rendering issues
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Apply highlighting using non-colliding placeholder tags
  const highlighted = escaped
    // 1. Highlight component tag names (&lt;Button, &lt;/Button, etc.)
    .replace(/(&lt;\/?[A-Z][a-zA-Z0-9]*)/g, '___TAG_START___$1___TAG_END___')
    // 2. Highlight closing tag brackets (&gt; or /&gt;) of component tags
    .replace(
      /(\/&gt;|___TAG_END___.*?)(&gt;)/g,
      '$1___TAG_START___$2___TAG_END___',
    )
    // 3. Highlight string literals (double/single quotes, escaped/unescaped)
    .replace(
      /(&quot;.*?&quot;|&#x27;.*?&#x27;|&#39;.*?&#39;|'.*?'|".*?")/g,
      '___STR_START___$1___STR_END___',
    )
    // 4. Highlight prop keys (words followed directly by = sign)
    .replace(/(\b[a-zA-Z0-9_-]+)(?==)/g, '___PROP_START___$1___PROP_END___')
    // 5. Highlight braced expressions ({...})
    .replace(/({.*?})/g, '___EXPR_START___$1___EXPR_END___')

  // Finally, replace placeholders with actual styled HTML spans
  return highlighted
    .replace(
      /___TAG_START___/g,
      '<span class="text-indigo-500 dark:text-indigo-400">',
    )
    .replace(/___TAG_END___/g, '</span>')
    .replace(
      /___STR_START___/g,
      '<span class="text-emerald-600 dark:text-emerald-400">',
    )
    .replace(/___STR_END___/g, '</span>')
    .replace(
      /___PROP_START___/g,
      '<span class="text-amber-500 dark:text-amber-300">',
    )
    .replace(/___PROP_END___/g, '</span>')
    .replace(
      /___EXPR_START___/g,
      '<span class="text-blue-500 dark:text-blue-400">',
    )
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
        options: [
          'primary',
          'secondary',
          'tertiary',
          'outline',
          'ghost',
          'danger',
          'danger-soft',
        ],
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
      size: 'md',
    },
    props: [
      {
        name: 'size',
        type: 'select',
        label: 'Size',
        options: ['sm', 'md', 'lg'],
        defaultValue: 'md',
      },
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
      size: 'md',
    },
    props: [
      {
        name: 'size',
        type: 'select',
        label: 'Size',
        options: ['sm', 'md', 'lg'],
        defaultValue: 'md',
      },
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
      isIcon: false,
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
        name: 'isIcon',
        type: 'boolean',
        label: 'Icon Only Style',
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
  Typography: {
    name: 'Typography',
    defaultProps: {
      as: 'span',
      children: 'The quick brown fox jumps over the lazy dog.',
    },
    props: [
      {
        name: 'as',
        type: 'select',
        label: 'As (HTML Tag)',
        options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label'],
        defaultValue: 'span',
      },
      {
        name: 'children',
        type: 'text',
        label: 'Typography Text',
        defaultValue: 'The quick brown fox jumps over the lazy dog.',
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
      description:
        'The API server will undergo scheduled updates tonight at 12:00 AM UTC.',
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
        defaultValue:
          'The API server will undergo scheduled updates tonight at 12:00 AM UTC.',
      },
      {
        name: 'hasCloseButton',
        type: 'boolean',
        label: 'Close Button',
        defaultValue: true,
      },
    ],
  },
  ProgressBar: {
    name: 'ProgressBar',
    defaultProps: {
      value: 65,
      variant: 'primary',
      size: 'md',
      shape: 'pill',
      isIndeterminate: false,
      label: 'Upload Progress',
      showValueText: true,
    },
    props: [
      {
        name: 'value',
        type: 'number',
        label: 'Progress Value (%)',
        min: 0,
        max: 100,
        step: 5,
        defaultValue: 65,
      },
      {
        name: 'variant',
        type: 'select',
        label: 'Color Variant',
        options: ['primary', 'accent', 'success', 'warning', 'error', 'neutral'],
        defaultValue: 'primary',
      },
      {
        name: 'size',
        type: 'select',
        label: 'Track Size',
        options: ['sm', 'md', 'lg'],
        defaultValue: 'md',
      },
      {
        name: 'shape',
        type: 'select',
        label: 'Shape',
        options: ['pill', 'square'],
        defaultValue: 'pill',
      },
      {
        name: 'isIndeterminate',
        type: 'boolean',
        label: 'Indeterminate',
        defaultValue: false,
      },
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        defaultValue: 'Upload Progress',
      },
      {
        name: 'showValueText',
        type: 'boolean',
        label: 'Show Value Text',
        defaultValue: true,
      },
    ],
  },
  EmptyState: {
    name: 'EmptyState',
    defaultProps: {
      variant: 'card',
      size: 'md',
      align: 'center',
      title: 'No repositories found',
      description:
        'You haven\'t created any repositories yet. Get started by creating your first project.',
      showAction: true,
      showSecondaryAction: true,
    },
    props: [
      {
        name: 'variant',
        type: 'select',
        label: 'Variant',
        options: ['default', 'card', 'dashed'],
        defaultValue: 'card',
      },
      {
        name: 'size',
        type: 'select',
        label: 'Size',
        options: ['sm', 'md', 'lg'],
        defaultValue: 'md',
      },
      {
        name: 'align',
        type: 'select',
        label: 'Alignment',
        options: ['center', 'start'],
        defaultValue: 'center',
      },
      {
        name: 'title',
        type: 'text',
        label: 'Title',
        defaultValue: 'No repositories found',
      },
      {
        name: 'description',
        type: 'text',
        label: 'Description',
        defaultValue:
          'You haven\'t created any repositories yet. Get started by creating your first project.',
      },
      {
        name: 'showAction',
        type: 'boolean',
        label: 'Show Primary Action',
        defaultValue: true,
      },
      {
        name: 'showSecondaryAction',
        type: 'boolean',
        label: 'Show Secondary Action',
        defaultValue: true,
      },
    ],
  },
  Pagination: {
    name: 'Pagination',
    defaultProps: {
      totalPages: 10,
      size: 'md',
      variant: 'outline',
      shape: 'rounded',
      showSummary: true,
      showPageSize: true,
      showFirstLast: true,
      showPrevNext: true,
    },
    props: [
      {
        name: 'totalPages',
        type: 'number',
        label: 'Total Pages',
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 10,
      },
      {
        name: 'variant',
        type: 'select',
        label: 'Variant',
        options: ['primary', 'outline', 'ghost', 'subtle'],
        defaultValue: 'outline',
      },
      {
        name: 'size',
        type: 'select',
        label: 'Size',
        options: ['sm', 'md', 'lg'],
        defaultValue: 'md',
      },
      {
        name: 'shape',
        type: 'select',
        label: 'Shape',
        options: ['rounded', 'circle', 'square'],
        defaultValue: 'rounded',
      },
      {
        name: 'showSummary',
        type: 'boolean',
        label: 'Show Summary Counter',
        defaultValue: true,
      },
      {
        name: 'showPageSize',
        type: 'boolean',
        label: 'Show Page Size Selector',
        defaultValue: true,
      },
      {
        name: 'showFirstLast',
        type: 'boolean',
        label: 'Show First / Last Buttons',
        defaultValue: true,
      },
      {
        name: 'showPrevNext',
        type: 'boolean',
        label: 'Show Prev / Next Buttons',
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
      offset: 8,
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
        name: 'offset',
        type: 'number',
        label: 'Offset',
        defaultValue: 8,
      },
      {
        name: 'children',
        type: 'text',
        label: 'Tooltip Text',
        defaultValue: 'This is helper information!',
      },
    ],
  },
  InputOTP: {
    name: 'InputOTP',
    defaultProps: {
      maxLength: 6,
      label: 'One-Time Password',
      description: 'Please enter the 6-digit code sent to your phone.',
      errorMessage: 'The code is invalid.',
      isInvalid: false,
      disabled: false,
      size: 'md',
    },
    props: [
      {
        name: 'size',
        type: 'select',
        label: 'Size',
        options: ['sm', 'md', 'lg'],
        defaultValue: 'md',
      },
      {
        name: 'maxLength',
        type: 'number',
        label: 'Max Length',
        defaultValue: 6,
      },
      {
        name: 'label',
        type: 'text',
        label: 'Label',
        defaultValue: 'One-Time Password',
      },
      {
        name: 'description',
        type: 'text',
        label: 'Description Helper',
        defaultValue: 'Please enter the 6-digit code sent to your phone.',
      },
      {
        name: 'errorMessage',
        type: 'text',
        label: 'Error Message',
        defaultValue: 'The code is invalid.',
      },
      {
        name: 'isInvalid',
        type: 'boolean',
        label: 'Invalid State',
        defaultValue: false,
      },
      {
        name: 'disabled',
        type: 'boolean',
        label: 'Disabled',
        defaultValue: false,
      },
    ],
  },
  Card: {
    name: 'Card',
    defaultProps: {
      variant: 'default',
      size: 'md',
      elevation: 1,
      divided: false,
      title: 'Card Title',
      description: 'This is the card body description content.',
    },
    props: [
      {
        name: 'variant',
        type: 'select',
        label: 'Variant',
        options: ['default', 'flat', 'glass'],
        defaultValue: 'default',
      },
      {
        name: 'size',
        type: 'select',
        label: 'Size',
        options: ['sm', 'md', 'lg'],
        defaultValue: 'md',
      },
      {
        name: 'elevation',
        type: 'select',
        label: 'Elevation',
        options: ['0', '1', '2', '3'],
        defaultValue: '1',
      },
      {
        name: 'divided',
        type: 'boolean',
        label: 'Divided Section Borders',
        defaultValue: false,
      },
      {
        name: 'title',
        type: 'text',
        label: 'Card Title',
        defaultValue: 'Card Title',
      },
      {
        name: 'description',
        type: 'text',
        label: 'Card Body Text',
        defaultValue: 'This is the card body description content.',
      },
    ],
  },
  Sidebar: {
    name: 'Sidebar',
    defaultProps: {
      variant: 'solid',
      isCollapsed: false,
      showCollapseToggle: true,
    },
    props: [
      {
        name: 'variant',
        type: 'select',
        label: 'Variant',
        options: ['solid', 'glass'],
        defaultValue: 'solid',
      },
      {
        name: 'isCollapsed',
        type: 'boolean',
        label: 'Collapsed',
        defaultValue: false,
      },
      {
        name: 'showCollapseToggle',
        type: 'boolean',
        label: 'Show Toggle Button',
        defaultValue: true,
      },
    ],
  },
}

function SidebarPreviewWrapper({
  variant,
  isCollapsed,
  showCollapseToggle,
}: {
  variant: 'solid' | 'glass'
  isCollapsed: boolean
  showCollapseToggle: boolean
}) {
  const [activeTab, setActiveTab] = useState('home')

  // Simple inline SVGs for the demo
  const HomeIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )

  const SearchIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )

  const LibraryIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )

  return (
    <div className="flex p-3 gap-3 border border-neutral-200 dark:border-neutral-800 rounded-2xl h-[300px] w-full max-w-[480px] bg-neutral-950 text-neutral-100 shadow-xl box-sizing">
      <div
        className="h-full flex-shrink-0"
        style={
          {
            '--sidebar-width': '150px',
            '--sidebar-collapsed-width': '64px',
          } as React.CSSProperties
        }
      >
        <Sidebar
          isCollapsed={isCollapsed}
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
          variant={variant}
          showCollapseToggle={showCollapseToggle}
        >
          <SidebarHeader>
            <div className="w-5 h-5 rounded bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-[10px] text-white">
              M
            </div>
            <span className="font-extrabold text-[11px] text-neutral-100 font-sans">
              Moul UI
            </span>
          </SidebarHeader>

          <SidebarGroup title="Menu" collapsible={false}>
            <SidebarItem id="home" icon={<HomeIcon />}>
              Home
            </SidebarItem>
            <SidebarItem id="search" icon={<SearchIcon />}>
              Search
            </SidebarItem>
          </SidebarGroup>

          <SidebarGroup title="Library" collapsible={true}>
            <SidebarItem id="playlists" icon={<LibraryIcon />}>
              Playlists
            </SidebarItem>
          </SidebarGroup>

          <SidebarDivider />

          <SidebarFooter showBorder={false}>
            <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-[10px]">
              U
            </div>
            <span className="text-[9px] text-neutral-200 font-semibold truncate max-w-[85px]">
              User Account
            </span>
          </SidebarFooter>
        </Sidebar>
      </div>

      <div className="flex-1 pt-0 pb-0 pr-1.5 pl-0 flex flex-col gap-2 overflow-y-auto bg-transparent">
        <h5 className="text-xs font-bold truncate">
          Section: {activeTab.toUpperCase()}
        </h5>
        <div className="flex-1 border border-dashed border-neutral-700 rounded-lg flex items-center justify-center text-[10px] text-neutral-400 bg-neutral-950/20 p-2 text-center">
          Workspace View
        </div>
      </div>
    </div>
  )
}

// Custom Toast Preview wrapper
function ToastPreviewWrapper({
  title,
  description,
  variant,
}: {
  title: string
  description: string
  variant: string
}) {
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
function AlertPreviewWrapper({
  variant,
  title,
  description,
  hasCloseButton,
}: {
  variant: string
  title: string
  description: string
  hasCloseButton: boolean
}) {
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

function PaginationPreviewWrapper({ activeProps }: { activeProps: any }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  return (
    <div className="w-full max-w-xl py-2">
      <Pagination
        page={page}
        onChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        totalPages={activeProps.totalPages}
        variant={activeProps.variant}
        size={activeProps.size}
        shape={activeProps.shape}
        showSummary={activeProps.showSummary}
        showPageSize={activeProps.showPageSize}
        showFirstLast={activeProps.showFirstLast}
        showPrevNext={activeProps.showPrevNext}
      />
    </div>
  )
}

// Custom TagGroup Preview wrapper
function TagGroupPreviewWrapper({
  label,
  variant,
  size,
  selectionMode,
}: {
  label: string
  variant: string
  size: string
  selectionMode: string
}) {
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
          Selected:{' '}
          <span className="font-semibold text-neutral-800 dark:text-neutral-200">
            {[...selected].join(', ') || 'None'}
          </span>
        </div>
      )}
    </div>
  )
}

// Custom InputOTP Preview wrapper
function InputOTPPreviewWrapper({
  maxLength,
  label,
  description,
  errorMessage,
  isInvalid,
  disabled,
  size,
}: {
  maxLength: number
  label?: string
  description?: string
  errorMessage?: string
  isInvalid?: boolean
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const [value, setValue] = useState('')
  const isSix = maxLength === 6

  return (
    <InputOTP
      maxLength={maxLength}
      value={value}
      onChange={setValue}
      label={label}
      description={description}
      errorMessage={errorMessage}
      isInvalid={isInvalid}
      disabled={disabled}
      size={size}
    >
      {isSix ? (
        <>
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </>
      ) : (
        <InputOTPGroup>
          {Array.from({ length: maxLength || 4 }).map((_, i) => (
            <InputOTPSlot key={i} index={i} />
          ))}
        </InputOTPGroup>
      )}
    </InputOTP>
  )
}

export function ComponentPlayground({ component }: { component: string }) {
  const config = REGISTRY[component]

  // Initialize state with default properties unconditionally
  const [activeProps, setActiveProps] = useState<Record<string, any>>(
    () => config?.defaultProps ?? {},
  )
  const [copied, setCopied] = useState(false)

  if (!config) {
    return (
      <div className="p-4 text-red-500 border border-red-200 rounded">
        Component "{component}" not found in Playground registry.
      </div>
    )
  }

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
      case 'InputOTP': {
        const {
          maxLength,
          label,
          description,
          errorMessage,
          isInvalid,
          disabled,
          size,
        } = activeProps
        let propsStr = ''
        if (maxLength !== 6) propsStr += ` maxLength={${maxLength}}`
        if (label) propsStr += ` label="${label}"`
        if (description) propsStr += ` description="${description}"`
        if (errorMessage) propsStr += ` errorMessage="${errorMessage}"`
        if (isInvalid) propsStr += ` isInvalid`
        if (disabled) propsStr += ` disabled`
        if (size && size !== 'md') propsStr += ` size="${size}"`

        const isSix = maxLength === 6
        const slotJSX = isSix
          ? `      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>`
          : `      <InputOTPGroup>
${Array.from({ length: maxLength || 4 })
  .map((_, i) => `        <InputOTPSlot index={${i}} />`)
  .join('\n')}
      </InputOTPGroup>`

        return `import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@moul-dev/ui';
import { useState } from 'react';

export default function Example() {
  const [value, setValue] = useState('');

  return (
    <InputOTP
      value={value}
      onChange={setValue}${propsStr}
    >
${slotJSX}
    </InputOTP>
  );
}`
      }
      case 'Typography': {
        const { as, children } = activeProps
        let tag = ''
        let propsStr = ''

        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(as)) {
          tag = 'Typography.Heading'
          if (as !== 'h2') {
            propsStr += ` as="${as}"`
          }
        } else if (as === 'p') {
          tag = 'Typography.Paragraph'
        } else if (as === 'span') {
          tag = 'Typography.Span'
        } else if (as === 'label') {
          tag = 'Typography.Label'
        } else {
          tag = 'Typography'
          propsStr += ` as="${as}"`
        }

        return `import { Typography } from '@moul-dev/ui';

export default function Example() {
  return (
    <${tag}${propsStr}>
      ${children}
    </${tag}>
  );
}`
      }
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
        const {
          label,
          placeholder,
          description,
          errorMessage,
          isDisabled,
          isReadOnly,
          isRequired,
          size,
        } = activeProps
        let propsStr = ''
        if (label) propsStr += ` label="${label}"`
        if (placeholder) propsStr += ` placeholder="${placeholder}"`
        if (description) propsStr += ` description="${description}"`
        if (errorMessage) propsStr += ` errorMessage="${errorMessage}"`
        if (isDisabled) propsStr += ` isDisabled`
        if (isReadOnly) propsStr += ` isReadOnly`
        if (isRequired) propsStr += ` isRequired`
        if (size && size !== 'md') propsStr += ` size="${size}"`
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
        const { label, placeholder, isDisabled, size } = activeProps
        let propsStr = ''
        if (label) propsStr += ` label="${label}"`
        if (placeholder) propsStr += ` placeholder="${placeholder}"`
        if (isDisabled) propsStr += ` isDisabled`
        if (size && size !== 'md') propsStr += ` size="${size}"`
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
        const { variant, size, isDisabled, isIcon, children } = activeProps
        let propsStr = ''
        if (variant !== 'primary') propsStr += ` variant="${variant}"`
        if (size !== 'md') propsStr += ` size="${size}"`
        if (isDisabled) propsStr += ` isDisabled`
        if (isIcon) propsStr += ` isIcon`
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
        const { label, isDisabled, minValue, maxValue, step, defaultValue } =
          activeProps
        let propsStr = ''
        if (label) propsStr += ` label="${label}"`
        if (minValue !== 0) propsStr += ` minValue={${minValue}}`
        if (maxValue !== 100) propsStr += ` maxValue={${maxValue}}`
        if (step !== 1) propsStr += ` step={${step}}`
        if (defaultValue !== undefined)
          propsStr += ` defaultValue={${defaultValue}}`
        if (isDisabled) propsStr += ` isDisabled`
        return `import { Slider, SliderTrack, SliderThumb } from '@moul-dev/ui';
import { useState } from 'react';

export default function Example() {
  const [value, setValue] = useState(40);

  return (
    <Slider
      value={value}
      onChange={setValue}${propsStr}
    >
      <SliderTrack>
        <SliderThumb />
      </SliderTrack>
    </Slider>
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
        const propsStr = ` variant="${variant}" title="${title}"`
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
      case 'ProgressBar': {
        const { value, variant, size, shape, isIndeterminate, label, showValueText } = activeProps
        let propsStr = ''
        if (value !== 50) propsStr += ` value={${value}}`
        if (variant !== 'primary') propsStr += ` variant="${variant}"`
        if (size !== 'md') propsStr += ` size="${size}"`
        if (shape !== 'pill') propsStr += ` shape="${shape}"`
        if (isIndeterminate) propsStr += ` isIndeterminate`
        if (label) propsStr += ` label="${label}"`
        if (showValueText) propsStr += ` showValueText`

        return `import { ProgressBar } from '@moul-dev/ui';

export default function Example() {
  return (
    <ProgressBar${propsStr} />
  );
}`
      }
      case 'EmptyState': {
        const { variant, size, align, title, description, showAction, showSecondaryAction } = activeProps
        let propsStr = ''
        if (variant !== 'default') propsStr += ` variant="${variant}"`
        if (size !== 'md') propsStr += ` size="${size}"`
        if (align !== 'center') propsStr += ` align="${align}"`
        if (title) propsStr += ` title="${title}"`
        if (description) propsStr += ` description="${description}"`

        return `import { EmptyState, Button } from '@moul-dev/ui';

export default function Example() {
  return (
    <EmptyState${propsStr}${
      showAction ? '\n      action={<Button size="sm">Create New</Button>}' : ''
    }${
      showSecondaryAction ? '\n      secondaryAction={<Button size="sm" variant="ghost">Learn More</Button>}' : ''
    }
    />
  );
}`
      }
      case 'Pagination': {
        const { totalPages, variant, size, shape, showSummary, showPageSize, showFirstLast, showPrevNext } = activeProps
        let propsStr = ` totalPages={${totalPages}}`
        if (variant !== 'outline') propsStr += ` variant="${variant}"`
        if (size !== 'md') propsStr += ` size="${size}"`
        if (shape !== 'rounded') propsStr += ` shape="${shape}"`
        if (showSummary) propsStr += ` showSummary`
        if (showPageSize) propsStr += ` showPageSize`
        if (showFirstLast) propsStr += ` showFirstLast`
        if (!showPrevNext) propsStr += ` showPrevNext={false}`

        return `import { Pagination } from '@moul-dev/ui';
import { useState } from 'react';

export default function Example() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  return (
    <Pagination
      page={page}
      onChange={setPage}
      pageSize={pageSize}
      onPageSizeChange={setPageSize}${propsStr}
    />
  );
}`
      }
      case 'TagGroup': {
        const { label, variant, size, selectionMode } = activeProps
        let propsStr = ''
        if (label) propsStr += ` label="${label}"`
        if (variant !== 'secondary') propsStr += ` variant="${variant}"`
        if (size !== 'md') propsStr += ` size="${size}"`
        if (selectionMode !== 'none')
          propsStr += ` selectionMode="${selectionMode}"`

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
        const { placement, children, offset } = activeProps
        let propsStr = ''
        if (placement !== 'top') propsStr += ` placement="${placement}"`
        if (offset !== undefined && offset !== 8)
          propsStr += ` offset={${offset}}`
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
      case 'Card': {
        const { variant, size, elevation, divided, title, description } =
          activeProps
        let propsStr = ''
        if (variant !== 'default') propsStr += ` variant="${variant}"`
        if (size !== 'md') propsStr += ` size="${size}"`
        if (divided) propsStr += ` divided`
        if (variant === 'default' && elevation !== 1 && elevation !== '1') {
          const numericElevation = isNaN(Number(elevation))
            ? elevation
            : Number(elevation)
          const formatEl =
            typeof numericElevation === 'number'
              ? `{${numericElevation}}`
              : `"${numericElevation}"`
          propsStr += ` elevation=${formatEl}`
        }
        return `import { Card, CardHeader, CardBody, CardFooter, Button } from '@moul-dev/ui';

export default function Example() {
  return (
    <Card${propsStr} className="w-80">
      <CardHeader>${title}</CardHeader>
      <CardBody>
        ${description}
      </CardBody>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary">Confirm</Button>
      </CardFooter>
    </Card>
  );
}`
      }
      case 'Sidebar': {
        const { variant, isCollapsed, showCollapseToggle } = activeProps
        let propsStr = ''
        if (variant !== 'solid') propsStr += ` variant="${variant}"`
        if (isCollapsed) propsStr += ` isCollapsed`
        if (!showCollapseToggle) propsStr += ` showCollapseToggle={false}`

        return `import {
  Sidebar,
  SidebarHeader,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  SidebarDivider,
} from '@moul-dev/ui';
import { HomeIcon, SearchIcon, LibraryIcon } from './icons';

export default function Example() {
  return (
    <Sidebar${propsStr}>
      <SidebarHeader>
        <div className="logo">M</div>
        <span>Moul UI</span>
      </SidebarHeader>

      <SidebarGroup title="Menu" collapsible={false}>
        <SidebarItem id="home" icon={<HomeIcon />}>Home</SidebarItem>
        <SidebarItem id="search" icon={<SearchIcon />}>Search</SidebarItem>
      </SidebarGroup>

      <SidebarGroup title="Library" collapsible={true}>
        <SidebarItem id="playlists" icon={<LibraryIcon />}>Playlists</SidebarItem>
      </SidebarGroup>

      <SidebarDivider />

      <SidebarFooter>
        <Avatar />
        <span>User Account</span>
      </SidebarFooter>
    </Sidebar>
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
      case 'Typography':
        return <Typography {...activeProps}>{activeProps.children}</Typography>
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
        return (
          <ToggleButton {...activeProps}>{activeProps.children}</ToggleButton>
        )
      case 'Slider':
        return (
          <Slider {...activeProps}>
            <SliderTrack>
              <SliderThumb />
            </SliderTrack>
          </Slider>
        )
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
      case 'ProgressBar':
        return (
          <div className="w-full max-w-md py-4">
            <ProgressBar
              value={activeProps.value}
              variant={activeProps.variant}
              size={activeProps.size}
              shape={activeProps.shape}
              isIndeterminate={activeProps.isIndeterminate}
              label={activeProps.label}
              showValueText={activeProps.showValueText}
            />
          </div>
        )
      case 'EmptyState':
        return (
          <div className="w-full max-w-md py-2">
            <EmptyState
              variant={activeProps.variant}
              size={activeProps.size}
              align={activeProps.align}
              icon={
                <svg
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
              }
              title={activeProps.title}
              description={activeProps.description}
              action={
                activeProps.showAction ? (
                  <Button size="sm">Create Repository</Button>
                ) : undefined
              }
              secondaryAction={
                activeProps.showSecondaryAction ? (
                  <Button size="sm" variant="ghost">
                    Import Project
                  </Button>
                ) : undefined
              }
            />
          </div>
        )
      case 'Pagination':
        return <PaginationPreviewWrapper activeProps={activeProps} />
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
              <Tooltip
                placement={activeProps.placement}
                offset={activeProps.offset}
              >
                {activeProps.children}
              </Tooltip>
            </TooltipTrigger>
          </div>
        )
      case 'InputOTP':
        return (
          <InputOTPPreviewWrapper
            maxLength={activeProps.maxLength}
            label={activeProps.label}
            description={activeProps.description}
            errorMessage={activeProps.errorMessage}
            isInvalid={activeProps.isInvalid}
            disabled={activeProps.disabled}
            size={activeProps.size}
          />
        )
      case 'Card': {
        const { variant, size, elevation, divided, title, description } =
          activeProps
        const numericElevation = isNaN(Number(elevation))
          ? elevation
          : Number(elevation)
        return (
          <Card
            variant={variant}
            size={size}
            elevation={numericElevation as any}
            divided={divided}
            className="w-full max-w-[320px]"
          >
            <CardHeader>{title}</CardHeader>
            <CardBody>{description}</CardBody>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="secondary">Cancel</Button>
              <Button variant="primary">Confirm</Button>
            </CardFooter>
          </Card>
        )
      }
      case 'Sidebar': {
        const { variant, isCollapsed, showCollapseToggle } = activeProps
        return (
          <SidebarPreviewWrapper
            variant={variant}
            isCollapsed={isCollapsed}
            showCollapseToggle={showCollapseToggle}
          />
        )
      }
      default:
        return <div>No Preview Available</div>
    }
  }

  return (
    <div className="not-prose border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-neutral-950/70 shadow-sm flex flex-col my-8">
      {/* Top Banner */}
      <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between">
        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono">
          Interactive
        </span>
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
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            Properties
          </h4>

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
                      onSelectionChange={(val) =>
                        handlePropChange(prop.name, val)
                      }
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
                      onChange={(val) =>
                        handlePropChange(prop.name, Number(val))
                      }
                    />
                  )}

                  {/* Boolean Prop Control */}
                  {prop.type === 'boolean' && (
                    <div className="flex items-center pt-2">
                      <Switch
                        isSelected={value}
                        onChange={(checked) =>
                          handlePropChange(prop.name, checked)
                        }
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
          <span className="text-xs text-neutral-500 font-semibold tracking-wider uppercase">
            Live Code Snippet
          </span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 rounded transition-all cursor-pointer animate-none"
          >
            {copied ? (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
