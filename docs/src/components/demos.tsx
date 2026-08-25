'use client'

import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AreaChart,
  Avatar,
  AvatarGroup,
  type AvatarShape,
  type AvatarSize,
  type AvatarStatus,
  Badge,
  BarChart,
  Button,
  Calendar,
  ChartContainer,
  Checkbox,
  ComboBox,
  ComboBoxItem,
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteFooter,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  CommandPaletteSection,
  DateField,
  DatePicker,
  DateRangePicker,
  DoughnutChart,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerDialog,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  type DrawerPlacement,
  type DrawerSize,
  DrawerTitle,
  EmptyState,
  EmptyStateActions,
  EmptyStateDescription,
  EmptyStateIcon,
  EmptyStateTitle,
  Form,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Kbd,
  LineChart,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPageSize,
  PaginationPrevious,
  PaginationSummary,
  PercentageBar,
  PercentageCircle,
  ProgressBar,
  RangeCalendar,
  REGEXP_ONLY_DIGITS,
  Sidebar,
  SidebarAside,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarMain,
  Stat,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableEmpty,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  Tag,
  TagGroup,
  TextField,
  ToastContainer,
  TopList,
  tokens,
  useToast,
} from '@moul-dev/ui'
import {
  createColumnHelper,
  createCoreRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  flexRender,
  stockFeatures,
  tableFeatures,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  useTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { Store } from '@tanstack/store'
import { useStore } from '@tanstack/react-store'
import { useDebouncedValue } from '@tanstack/react-pacer'
import React, { useMemo, useRef, useState } from 'react'

export function AlertDialogDemo() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <Button variant="danger" onPress={() => setIsOpen(true)}>
        Deactivate Account
      </Button>
      <ModalOverlay isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal>
          <AlertDialog>
            <AlertDialogHeader>Deactivate Account</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to deactivate your account? This action
              cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button variant="outline" onPress={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onPress={() => setIsOpen(false)}>
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialog>
        </Modal>
      </ModalOverlay>
    </>
  )
}

export function ModalDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md')

  const openModal = (sz: 'sm' | 'md' | 'lg') => {
    setSize(sz)
    setIsOpen(true)
  }

  return (
    <div className="flex gap-4">
      <Button variant="outline" onPress={() => openModal('sm')}>
        Open Small
      </Button>
      <Button onPress={() => openModal('md')}>Open Medium</Button>
      <Button variant="secondary" onPress={() => openModal('lg')}>
        Open Large
      </Button>

      <ModalOverlay isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal size={size}>
          <ModalDialog>
            <ModalHeader>Modal Title ({size.toUpperCase()})</ModalHeader>
            <ModalBody>
              This is the content inside the {size} size Modal.
            </ModalBody>
            <ModalFooter>
              <Button onPress={() => setIsOpen(false)}>Close</Button>
            </ModalFooter>
          </ModalDialog>
        </Modal>
      </ModalOverlay>
    </div>
  )
}

export function DrawerDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const [placement, setPlacement] = useState<DrawerPlacement>('right')
  const [size, setSize] = useState<DrawerSize>('md')

  const openDrawer = (
    nextPlacement: DrawerPlacement = 'right',
    nextSize: DrawerSize = 'md',
  ) => {
    setPlacement(nextPlacement)
    setSize(nextSize)
    setIsOpen(true)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onPress={() => openDrawer('right', 'md')}>
        Right (Default 600px)
      </Button>
      <Button variant="outline" onPress={() => openDrawer('left', 'md')}>
        Left Drawer
      </Button>
      <Button variant="secondary" onPress={() => openDrawer('bottom', 'md')}>
        Bottom Sheet
      </Button>
      <Button variant="secondary" onPress={() => openDrawer('top', 'sm')}>
        Top Drawer
      </Button>

      <DrawerOverlay
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement={placement}
        size={size}
      >
        <Drawer placement={placement} size={size}>
          <DrawerDialog>
            <DrawerHeader>
              <DrawerTitle>
                {placement.charAt(0).toUpperCase() + placement.slice(1)} Drawer
              </DrawerTitle>
              <DrawerCloseButton />
            </DrawerHeader>
            <DrawerBody>
              <div className="space-y-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  This drawer is anchored to the{' '}
                  <strong className="text-neutral-950 dark:text-neutral-100">
                    {placement}
                  </strong>{' '}
                  edge. On desktop viewports, its default width is around{' '}
                  <strong className="text-neutral-950 dark:text-neutral-100">
                    600px
                  </strong>
                  . On mobile viewports (≤ 640px), it automatically expands to
                  full width.
                </p>
                <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 p-4 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <h4 className="text-sm font-semibold mb-1 text-neutral-900 dark:text-neutral-100">
                    Sticky Top & Bottom Sections
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Scroll this body section to see how the title/close button
                    at the top and the action buttons at the bottom stay pinned
                    in place.
                  </p>
                </div>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/30 space-y-1"
                  >
                    <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      Configuration Item #{i + 1}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Settings and content fields can be composed inside
                      DrawerBody freely.
                    </div>
                  </div>
                ))}
              </div>
            </DrawerBody>
            <DrawerFooter>
              <Button variant="outline" onPress={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onPress={() => setIsOpen(false)}>Save Changes</Button>
            </DrawerFooter>
          </DrawerDialog>
        </Drawer>
      </DrawerOverlay>
    </div>
  )
}

export function ToastDemo() {
  const toast = useToast()
  return (
    <div className="flex flex-wrap gap-4">
      <Button
        variant="outline"
        onPress={() =>
          toast.show('Info Notification', {
            description: 'This is a general informational message.',
            variant: 'info',
          })
        }
      >
        Info Toast
      </Button>
      <Button
        onPress={() =>
          toast.show('Success Notification', {
            description: 'Action completed successfully.',
            variant: 'success',
          })
        }
        variant="outline"
      >
        Success Toast
      </Button>
      <Button
        variant="outline"
        onPress={() =>
          toast.show('Warning Notification', {
            description: 'Please review your input values.',
            variant: 'warning',
          })
        }
      >
        Warning Toast
      </Button>
      <Button
        variant="outline"
        onPress={() =>
          toast.show('Error Notification', {
            description: 'Failed to process request. Please try again.',
            variant: 'error',
          })
        }
      >
        Error Toast
      </Button>
      <ToastContainer />
    </div>
  )
}

export function FormDemo() {
  return (
    <Form onSubmit={(e) => e.preventDefault()} className="w-72 space-y-4">
      <TextField label="Username" placeholder="Enter username" />
      <Button type="submit">Submit</Button>
    </Form>
  )
}

export function AlertDemo() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) {
    return (
      <div className="flex justify-center p-4">
        <Button variant="outline" onPress={() => setIsVisible(true)}>
          Reset Alert Demo
        </Button>
      </div>
    )
  }

  return (
    <Alert
      variant="success"
      title="Profile updated successfully"
      onClose={() => setIsVisible(false)}
    />
  )
}

export function TagGroupDemo() {
  const [selected, setSelected] = useState<any>(new Set(['travel']))
  const [tags, setTags] = useState([
    { id: 'news', label: 'News' },
    { id: 'travel', label: 'Travel' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'shopping', label: 'Shopping' },
  ])

  const handleRemove = (keys: Set<any>) => {
    setTags((prev) => prev.filter((tag) => !keys.has(tag.id)))
  }

  return (
    <div className="w-full max-w-xl flex flex-col gap-6 p-2">
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Variants (Primary, Secondary, Tertiary)
        </h3>
        <div className="flex flex-col gap-3">
          <TagGroup label="Primary Tags" variant="primary">
            <Tag id="p1">Analytics</Tag>
            <Tag id="p2">Security</Tag>
            <Tag id="p3">Database</Tag>
          </TagGroup>

          <TagGroup label="Secondary Tags (Default)" variant="secondary">
            <Tag id="s1">Analytics</Tag>
            <Tag id="s2">Security</Tag>
            <Tag id="s3">Database</Tag>
          </TagGroup>

          <TagGroup label="Tertiary Tags" variant="tertiary">
            <Tag id="t1">Analytics</Tag>
            <Tag id="t2">Security</Tag>
            <Tag id="t3">Database</Tag>
          </TagGroup>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Sizes (Small, Medium, Large)
        </h3>
        <div className="flex flex-col gap-3">
          <TagGroup
            label="Small size"
            size="sm"
            variant="primary"
            onRemove={() => { }}
          >
            <Tag id="sm1">Small Tag</Tag>
            <Tag id="sm2">Tag 2</Tag>
          </TagGroup>

          <TagGroup
            label="Medium size"
            size="md"
            variant="secondary"
            onRemove={() => { }}
          >
            <Tag id="md1">Medium Tag</Tag>
            <Tag id="md2">Tag 2</Tag>
          </TagGroup>

          <TagGroup
            label="Large size"
            size="lg"
            variant="tertiary"
            onRemove={() => { }}
          >
            <Tag id="lg1">Large Tag</Tag>
            <Tag id="lg2">Tag 2</Tag>
          </TagGroup>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-neutral-200 dark:border-neutral-800 pt-4">
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Interactive & Removable
        </h3>
        <TagGroup
          label="Tags with Action & Removal"
          selectionMode="multiple"
          selectedKeys={selected}
          onSelectionChange={setSelected}
          onRemove={handleRemove}
        >
          {tags.map((tag) => (
            <Tag key={tag.id} id={tag.id}>
              {tag.label}
            </Tag>
          ))}
        </TagGroup>
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          Selected:{' '}
          <span className="text-primary-600 dark:text-primary-400 font-medium">
            {[...selected].join(', ') || 'None'}
          </span>
        </div>
      </div>
    </div>
  )
}

export function ComboBoxTagGroupDemo() {
  const provinces = [
    { id: 'phnom-penh', name: 'Phnom Penh' },
    { id: 'siem-reap', name: 'Siem Reap' },
    { id: 'battambang', name: 'Battambang' },
    { id: 'sihanoukville', name: 'Sihanoukville' },
    { id: 'kampot', name: 'Kampot' },
    { id: 'kandal', name: 'Kandal' },
    { id: 'kampong-cham', name: 'Kampong Cham' },
    { id: 'koh-kong', name: 'Koh Kong' },
    { id: 'kep', name: 'Kep' },
  ]

  const [selectedKeys, setSelectedKeys] = useState<Set<any>>(new Set())
  const [inputValue, setInputValue] = useState('')

  const availableProvinces = provinces.filter((p) => !selectedKeys.has(p.id))

  const handleSelectionChange = (key: any) => {
    if (key) {
      setSelectedKeys((prev) => {
        const next = new Set(prev)
        next.add(key)
        return next
      })
      setInputValue('')
    }
  }

  const handleRemove = (keys: Set<any>) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      for (const k of keys) {
        next.delete(k)
      }
      return next
    })
  }

  return (
    <div className="w-full max-w-sm flex flex-col gap-4">
      <ComboBox
        label="Cambodian Provinces"
        placeholder="Select a province"
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSelectionChange={handleSelectionChange}
        selectedKey={null}
      >
        {availableProvinces.map((province) => (
          <ComboBoxItem key={province.id} id={province.id}>
            {province.name}
          </ComboBoxItem>
        ))}
      </ComboBox>

      {selectedKeys.size > 0 && (
        <TagGroup
          label="Selected Provinces"
          onRemove={handleRemove}
          variant="primary"
        >
          {[...selectedKeys].map((key) => {
            const province = provinces.find((p) => p.id === key)
            return (
              <Tag key={key} id={key}>
                {province?.name || key}
              </Tag>
            )
          })}
        </TagGroup>
      )}
    </div>
  )
}

export function InputOTPDemo() {
  const [value1, setValue1] = useState('')
  const [value2, setValue2] = useState('')
  const [value3, setValue3] = useState('')

  return (
    <div className="flex flex-col gap-8 w-full max-w-sm p-2">
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Default (6 Digits with Separator)
        </h4>
        <InputOTP
          maxLength={6}
          value={value1}
          onChange={setValue1}
          pattern={REGEXP_ONLY_DIGITS}
        >
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
        </InputOTP>
        <p className="text-xs text-neutral-500">Value: {value1}</p>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          With Form Labels & Description
        </h4>
        <InputOTP
          maxLength={4}
          value={value2}
          onChange={setValue2}
          pattern={REGEXP_ONLY_DIGITS}
          label="Verification Code"
          description="Enter the 4-digit code sent to your phone."
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Invalid State with Error Message
        </h4>
        <InputOTP
          maxLength={4}
          value={value3}
          onChange={setValue3}
          pattern={REGEXP_ONLY_DIGITS}
          label="One-Time Password"
          isInvalid={value3.length > 0 && value3 !== '1234'}
          errorMessage={
            value3.length > 0 && value3 !== '1234'
              ? 'Invalid code. Try entering 1234.'
              : undefined
          }
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      </div>
    </div>
  )
}

// ── Chart & Analytics Demos ───────────────────────────────────────────

const kFormatter = (val: number) => {
  if (val >= 1000) {
    return `${(val / 1000).toFixed(2).replace(/\.?0+$/, '')}k`
  }
  return val.toString()
}

// Mock Data
const timeseriesData = [
  {
    time: '12:00',
    'United States': 120,
    Netherlands: 80,
    Singapore: 40,
    Canada: 50,
    Ireland: 10,
  },
  {
    time: '14:00',
    'United States': 150,
    Netherlands: 110,
    Singapore: 60,
    Canada: 70,
    Ireland: 15,
  },
  {
    time: '16:00',
    'United States': 880,
    Netherlands: 130,
    Singapore: 90,
    Canada: 80,
    Ireland: 310,
  },
  {
    time: '18:00',
    'United States': 220,
    Netherlands: 320,
    Singapore: 80,
    Canada: 90,
    Ireland: 40,
  },
  {
    time: '20:00',
    'United States': 180,
    Netherlands: 520,
    Singapore: 70,
    Canada: 85,
    Ireland: 25,
  },
  {
    time: '22:00',
    'United States': 310,
    Netherlands: 120,
    Singapore: 50,
    Canada: 60,
    Ireland: 20,
  },
  {
    time: '13',
    'United States': 140,
    Netherlands: 550,
    Singapore: 60,
    Canada: 75,
    Ireland: 15,
  },
  {
    time: '02:00',
    'United States': 120,
    Netherlands: 110,
    Singapore: 40,
    Canada: 50,
    Ireland: 12,
  },
  {
    time: '04:00',
    'United States': 160,
    Netherlands: 130,
    Singapore: 90,
    Canada: 60,
    Ireland: 350,
  },
  {
    time: '06:00',
    'United States': 140,
    Netherlands: 180,
    Singapore: 80,
    Canada: 55,
    Ireland: 20,
  },
  {
    time: '08:00',
    'United States': 920,
    Netherlands: 1750,
    Singapore: 110,
    Canada: 380,
    Ireland: 15,
  },
  {
    time: '10:00',
    'United States': 620,
    Netherlands: 150,
    Singapore: 1250,
    Canada: 120,
    Ireland: 25,
  },
  {
    time: '12:00',
    'United States': 140,
    Netherlands: 120,
    Singapore: 80,
    Canada: 90,
    Ireland: 10,
  },
]

const categoricalData = [
  { name: 'United States', Requests: 7530 },
  { name: 'Netherlands', Requests: 4670 },
  { name: 'Singapore', Requests: 1400 },
  { name: 'Canada', Requests: 1370 },
  { name: 'Ireland', Requests: 271 },
  { name: 'India', Requests: 270 },
]

const doughnutData = [
  { name: 'United States', value: 7530 },
  { name: 'Netherlands', value: 4670 },
  { name: 'Singapore', value: 1400 },
  { name: 'Canada', value: 1370 },
  { name: 'Ireland', value: 271 },
  { name: 'India', value: 270 },
  { name: 'Brazil', value: 154 },
  { name: 'Germany', value: 95 },
  { name: 'United Kingdom', value: 88 },
  { name: 'France', value: 64 },
]

export function LineChartDemo() {
  const legendItems = [
    { name: 'United States', value: '7.53k', color: tokens.colorChart1 },
    { name: 'Netherlands', value: '4.67k', color: tokens.colorChart2 },
    { name: 'Singapore', value: '1.4k', color: tokens.colorChart3 },
    { name: 'Canada', value: '1.37k', color: tokens.colorChart4 },
    { name: 'Ireland', value: '271', color: tokens.colorChart5 },
  ]

  return (
    <div className="w-full max-w-3xl p-4">
      <ChartContainer
        title="All requests"
        legend={legendItems}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Globe
            </Button>
            <Button variant="outline" size="sm">
              Bookmark
            </Button>
          </div>
        }
      >
        <LineChart
          data={timeseriesData}
          indexKey="time"
          categories={[
            'United States',
            'Netherlands',
            'Singapore',
            'Canada',
            'Ireland',
          ]}
          valueFormatter={kFormatter}
          height={320}
        />
      </ChartContainer>
    </div>
  )
}

export function BarChartDemo() {
  const legendItems = [
    { name: 'United States', value: '7.53k', color: tokens.colorChart1 },
    { name: 'Netherlands', value: '4.67k', color: tokens.colorChart2 },
    { name: 'Singapore', value: '1.4k', color: tokens.colorChart3 },
    { name: 'Canada', value: '1.37k', color: tokens.colorChart4 },
    { name: 'Ireland', value: '271', color: tokens.colorChart5 },
    { name: 'India', value: '270', color: tokens.colorChart6 },
  ]

  return (
    <div className="w-full max-w-3xl flex flex-col gap-8 p-4">
      <ChartContainer
        title="Vertical Bar Chart (Categorical)"
        legend={legendItems}
      >
        <BarChart
          data={categoricalData}
          indexKey="name"
          categories={['Requests']}
          categorical
          valueFormatter={kFormatter}
          height={300}
        />
      </ChartContainer>

      <ChartContainer
        title="Horizontal Bar Chart (Categorical)"
        legend={legendItems}
      >
        <BarChart
          data={categoricalData}
          indexKey="name"
          categories={['Requests']}
          layout="vertical"
          categorical
          valueFormatter={kFormatter}
          height={300}
        />
      </ChartContainer>

      <ChartContainer title="Stacked Bar Chart">
        <BarChart
          data={[
            { month: 'Jan', hits: 4000, misses: 2400 },
            { month: 'Feb', hits: 3000, misses: 1398 },
            { month: 'Mar', hits: 2000, misses: 9800 },
            { month: 'Apr', hits: 2780, misses: 3908 },
          ]}
          indexKey="month"
          categories={['hits', 'misses']}
          stacked
          height={300}
        />
      </ChartContainer>
    </div>
  )
}

export function DoughnutChartDemo() {
  const legendItems = doughnutData.map((d, i) => ({
    name: d.name,
    value: kFormatter(d.value),
    color: (tokens as any)[`colorChart${(i % 8) + 1}`],
  }))

  return (
    <div className="w-full max-w-md p-4">
      <ChartContainer title="All requests" legend={legendItems} legendLimit={7}>
        <DoughnutChart
          data={doughnutData}
          nameKey="name"
          valueKey="value"
          valueFormatter={kFormatter}
          height={260}
        />
      </ChartContainer>
    </div>
  )
}

export function TopListDemo() {
  const topListData = [
    { label: 'United States', value: 7530 },
    { label: 'Netherlands', value: 4670 },
    { label: 'Singapore', value: 1400 },
    { label: 'Canada', value: 1370 },
    { label: 'Ireland', value: 271 },
    { label: 'India', value: 270 },
    { label: 'Brazil', value: 154 },
  ]

  return (
    <div className="w-full max-w-md p-4">
      <ChartContainer
        title="Top list"
        actions={
          <Button variant="outline" size="sm">
            View All
          </Button>
        }
      >
        <TopList data={topListData} valueFormatter={kFormatter} />
      </ChartContainer>
    </div>
  )
}

export function StatDemo() {
  return (
    <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <Stat
        label="Total Requests"
        value="15.8k"
        trend="+12.3%"
        trendDirection="up"
        trendLabel="vs last month"
      />
      <Stat
        label="Error Rate"
        value="0.45%"
        trend="-4.2%"
        trendDirection="down"
        trendLabel="vs yesterday"
      />
      <Stat
        label="Cache Hits"
        value="89.2%"
        trend="Flat"
        trendDirection="neutral"
        trendLabel="vs last week"
      />
    </div>
  )
}

export function PercentageDemo() {
  return (
    <div className="w-full max-w-3xl flex flex-col gap-6 p-4">
      <div className="flex flex-wrap gap-8 items-center justify-center p-6 border rounded-lg dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
        <PercentageCircle value={75} label="Server CPU" size={90} />
        <PercentageCircle
          value={45}
          label="Memory Usage"
          size={90}
          color={tokens.colorChart2}
        />
        <PercentageCircle
          value={12}
          label="Disk IO"
          size={90}
          color={tokens.colorChart3}
        />
      </div>

      <div className="flex flex-col gap-4 p-6 border rounded-lg dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
        <PercentageBar value={85} label="Task Completion" size="md" />
        <PercentageBar
          value={52}
          label="Network Bandwidth"
          size="sm"
          color={tokens.colorChart5}
        />
        <PercentageBar
          value={95}
          label="Database Sync"
          size="lg"
          color={tokens.colorChart7}
        />
      </div>
    </div>
  )
}

export function StatusChartDemo() {
  const statusData = [
    { time: '1', value: 100 },
    { time: '2', value: 100 },
    { time: '3', value: 100 },
    { time: '4', value: 100 },
    { time: '5', value: 100 },
    { time: '6', value: 100 },
    { time: '7', value: 100 },
    { time: '8', value: 100 },
    { time: '9', value: 100 },
    { time: '10', value: 100 },
    { time: '11', value: 100 },
    { time: '12', value: 100 },
    { time: '13', value: 5 }, // sharp dip
    { time: '14', value: 100 },
    { time: '15', value: 100 },
    { time: '16', value: 100 },
    { time: '17', value: 100 },
    { time: '18', value: 100 },
    { time: '19', value: 100 },
    { time: '20', value: 100 },
    { time: '21', value: 100 },
    { time: '22', value: 100 },
    { time: '23', value: 100 },
    { time: '24', value: 100 },
  ]

  return (
    <div className="w-full max-w-sm">
      <ChartContainer title="All requests" edgeToEdge>
        <div className="px-6 pt-4 pb-2">
          <div className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
            100.00%
          </div>
        </div>
        <AreaChart
          data={statusData}
          indexKey="time"
          categories={['value']}
          gridLines={false}
          showXAxis={false}
          showYAxis={false}
          height={120}
        />
      </ChartContainer>
    </div>
  )
}

export function SpikyAreaChartDemo() {
  const spikyData = [
    { time: '1', value: 100 },
    { time: '2', value: 120 },
    { time: '3', value: 80 },
    { time: '4', value: 210 },
    { time: '5', value: 90 },
    { time: '6', value: 70 },
    { time: '7', value: 110 },
    { time: '8', value: 320 },
    { time: '9', value: 80 },
    { time: '10', value: 90 },
    { time: '11', value: 150 },
    { time: '12', value: 120 },
    { time: '13', value: 140 },
    { time: '14', value: 130 },
    { time: '15', value: 160 },
    { time: '16', value: 100 },
    { time: '17', value: 1200 }, // giant spike!
    { time: '18', value: 110 },
    { time: '19', value: 350 },
    { time: '20', value: 280 },
    { time: '21', value: 300 },
    { time: '22', value: 180 },
    { time: '23', value: 500 }, // medium spike
    { time: '24', value: 80 },
    { time: '25', value: 120 },
    { time: '26', value: 180 },
    { time: '27', value: 110 },
    { time: '28', value: 130 },
    { time: '29', value: 220 },
    { time: '30', value: 100 },
    { time: '31', value: 400 }, // smaller spike
    { time: '32', value: 110 },
    { time: '33', value: 90 },
  ]

  return (
    <div className="w-full max-w-sm">
      <ChartContainer title="All requests" edgeToEdge>
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
              15.19k
            </span>
            <span className="flex items-center gap-0.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              <span className="text-emerald-500 font-bold text-sm">↑</span>{' '}
              138.8%
            </span>
          </div>
        </div>
        <AreaChart
          data={spikyData}
          indexKey="time"
          categories={['value']}
          gridLines={false}
          showXAxis={false}
          showYAxis={false}
          height={120}
        />
      </ChartContainer>
    </div>
  )
}

const GlobeIcon = () => (
  <svg
    className="w-3.5 h-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
)

const ChevronDownIcon = () => (
  <svg
    className="w-3 h-3 text-neutral-500 dark:text-neutral-400"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

const BookmarkIcon = () => (
  <svg
    className="w-3.5 h-3.5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
  </svg>
)

function ChartActionPill() {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800/80 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/65 rounded-full shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none !h-auto !p-0"
      >
        <GlobeIcon />
        <ChevronDownIcon />
      </Button>
      <div className="w-[1px] h-3 bg-neutral-300 dark:bg-neutral-700/60" />
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center justify-center text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-0 outline-none !h-auto !p-0"
      >
        <BookmarkIcon />
      </Button>
    </div>
  )
}

export function SidebarDemo() {
  const [activeTab, setActiveTab] = useState('home')
  const [isCollapsed, setIsCollapsed] = useState(false)

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

  const SettingsIcon = () => (
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )

  return (
    <Sidebar
      isCollapsed={isCollapsed}
      onCollapseChange={setIsCollapsed}
      selectedKey={activeTab}
      onSelectionChange={setActiveTab}
      variant="solid"
      className="flex gap-4 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full bg-neutral-950 text-neutral-100 shadow-xl"
      style={{ height: '450px', width: '100%' }}
    >
      <SidebarAside
        showCollapseToggle={false}
        style={
          {
            '--sidebar-width': '200px',
            '--sidebar-collapsed-width': '64px',
          } as React.CSSProperties
        }
      >
        <SidebarHeader>
          <div className="w-6 h-6 rounded bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-xs text-white">
            M
          </div>
          <span className="font-extrabold text-sm text-neutral-100">
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
          <SidebarItem id="settings" icon={<SettingsIcon />}>
            Settings
          </SidebarItem>
        </SidebarGroup>

        <SidebarDivider />

        <SidebarFooter showBorder={false}>
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-xs">
            U
          </div>
          <div className="flex flex-col text-[10px] overflow-hidden leading-tight">
            <span className="font-semibold text-neutral-200">User Account</span>
            <span className="text-neutral-400">user@moul.dev</span>
          </div>
        </SidebarFooter>
      </SidebarAside>

      <SidebarMain className="flex-1 pt-0 pb-0 pr-2 pl-0 flex flex-col gap-4 overflow-y-auto bg-transparent">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold">
            Active Section: {activeTab.toUpperCase()}
          </h3>
          <Button
            variant="secondary"
            size="sm"
            onPress={() => setIsCollapsed(!isCollapsed)}
          >
            Toggle Sidebar
          </Button>
        </div>
        <div className="flex-1 border border-dashed border-neutral-800 rounded-lg flex items-center justify-center text-sm text-neutral-400 bg-neutral-900/20 p-4 text-center">
          This is the application workspace.
          <br />
          Try interacting with the sidebar collapse and selection states.
        </div>
      </SidebarMain>
    </Sidebar>
  )
}

export function ProgressBarDemo() {
  const [value, setValue] = useState(60)
  const [isIndeterminate, setIsIndeterminate] = useState(false)
  const [variant, setVariant] = useState<
    'primary' | 'success' | 'warning' | 'error'
  >('primary')

  return (
    <div className="flex flex-col gap-6 w-full max-w-xl p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onPress={() => setValue((v) => Math.max(0, v - 10))}
          >
            -10%
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={() => setValue((v) => Math.min(100, v + 10))}
          >
            +10%
          </Button>
          <Button
            size="sm"
            variant={isIndeterminate ? 'primary' : 'ghost'}
            onPress={() => setIsIndeterminate((v) => !v)}
          >
            {isIndeterminate ? 'Indeterminate: ON' : 'Indeterminate: OFF'}
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          {(['primary', 'success', 'warning', 'error'] as const).map((v) => (
            <Button
              key={v}
              size="sm"
              variant={variant === v ? 'primary' : 'ghost'}
              onPress={() => setVariant(v)}
              className="capitalize text-xs"
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <ProgressBar
          label="File Upload Progress"
          value={value}
          isIndeterminate={isIndeterminate}
          variant={variant}
          size="md"
        />

        <ProgressBar
          label="Memory Allocation"
          value={value}
          valueLabel={`${Math.round(value * 16)} MB / 1600 MB`}
          isIndeterminate={isIndeterminate}
          variant={variant}
          size="sm"
        />
      </div>
    </div>
  )
}

export function EmptyStateDemo() {
  const [variant, setVariant] = useState<'default' | 'card' | 'dashed'>('card')

  return (
    <div className="flex flex-col gap-4 w-full max-w-xl">
      <div className="flex items-center gap-2 justify-center">
        {(['default', 'card', 'dashed'] as const).map((v) => (
          <Button
            key={v}
            size="sm"
            variant={variant === v ? 'primary' : 'outline'}
            onPress={() => setVariant(v)}
            className="capitalize"
          >
            {v} Variant
          </Button>
        ))}
      </div>

      <EmptyState
        variant={variant}
        icon={
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        }
        title="No repositories found"
        description="You haven't created any repositories yet. Get started by creating your first project repository."
        action={<Button size="sm">Create Repository</Button>}
        secondaryAction={
          <Button size="sm" variant="ghost">
            Import Repo
          </Button>
        }
      />
    </div>
  )
}

export function PaginationDemo() {
  const [page, setPage] = useState(3)
  const [pageSize, setPageSize] = useState(10)

  const sampleUsers = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    role: i % 3 === 0 ? 'Admin' : i % 2 === 0 ? 'Editor' : 'Viewer',
    status: i % 4 === 0 ? 'Inactive' : 'Active',
  }))

  const paginatedData = sampleUsers.slice(
    (page - 1) * pageSize,
    page * pageSize,
  )

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs font-semibold text-neutral-500">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {paginatedData.map((u) => (
              <tr
                key={u.id}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40"
              >
                <td className="p-3 font-mono text-xs">{u.id}</td>
                <td className="p-3 font-medium">{u.name}</td>
                <td className="p-3 text-neutral-500">{u.role}</td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${u.status === 'Active'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                  >
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        total={sampleUsers.length}
        pageSize={pageSize}
        showSummary
        showPageSize
        showFirstLast
        showPrevNext
        onChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  )
}

// ── Table Ecosystem Demos ──────────────────────────────────────────

interface ServiceRow {
  id: string
  name: string
  team: string
  region: string
  status: string
  variant: 'success' | 'warning' | 'error'
  cpu: string
  memory: string
  latency: string
  requests: string
  uptime: string
}

const initialServices: ServiceRow[] = [
  {
    id: 'srv-1',
    name: 'Auth Gateway',
    team: 'Security',
    region: 'us-east-1',
    status: 'Operational',
    variant: 'success',
    cpu: '18%',
    memory: '1.4 GB',
    latency: '24ms',
    requests: '1.2M req/s',
    uptime: '99.99%',
  },
  {
    id: 'srv-2',
    name: 'PostgreSQL Primary',
    team: 'Data Platform',
    region: 'us-west-2',
    status: 'Operational',
    variant: 'success',
    cpu: '42%',
    memory: '14.2 GB',
    latency: '4ms',
    requests: '450k req/s',
    uptime: '99.98%',
  },
  {
    id: 'srv-3',
    name: 'Edge CDN Gateway',
    team: 'Networking',
    region: 'global',
    status: 'Degraded',
    variant: 'warning',
    cpu: '78%',
    memory: '3.8 GB',
    latency: '142ms',
    requests: '3.8M req/s',
    uptime: '99.85%',
  },
  {
    id: 'srv-4',
    name: 'Telemetry Ingestion',
    team: 'Compute',
    region: 'eu-central-1',
    status: 'Operational',
    variant: 'success',
    cpu: '31%',
    memory: '2.1 GB',
    latency: '18ms',
    requests: '820k req/s',
    uptime: '100%',
  },
  {
    id: 'srv-5',
    name: 'Payment Processing',
    team: 'Billing',
    region: 'us-east-1',
    status: 'Incident',
    variant: 'error',
    cpu: '94%',
    memory: '8.6 GB',
    latency: '520ms',
    requests: '95k req/s',
    uptime: '98.90%',
  },
  {
    id: 'srv-6',
    name: 'Search Indexer',
    team: 'Search',
    region: 'ap-northeast-1',
    status: 'Operational',
    variant: 'success',
    cpu: '55%',
    memory: '6.4 GB',
    latency: '32ms',
    requests: '610k req/s',
    uptime: '99.95%',
  },
  {
    id: 'srv-7',
    name: 'Media Transcoder',
    team: 'Media',
    region: 'us-east-2',
    status: 'Operational',
    variant: 'success',
    cpu: '64%',
    memory: '5.2 GB',
    latency: '85ms',
    requests: '140k req/s',
    uptime: '99.90%',
  },
  {
    id: 'srv-8',
    name: 'Notification Hub',
    team: 'Messaging',
    region: 'eu-west-1',
    status: 'Operational',
    variant: 'success',
    cpu: '22%',
    memory: '1.8 GB',
    latency: '12ms',
    requests: '2.1M req/s',
    uptime: '99.99%',
  },
]

// Global reactive store using TanStack Store for table view preferences
const tablePreferencesStore = new Store({
  dense: true,
  striped: false,
  stickyHeader: true,
  stickyPinning: true,
})

/**
 * Full TanStack Table v9 + TanStack Store + TanStack Pacer Showcase
 */
export function TableDemo() {
  const [data] = useState<ServiceRow[]>(initialServices)
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({
    'srv-2': true,
  })
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch] = useDebouncedValue(searchQuery, { wait: 250 })
  const [isLoading, setIsLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)

  // Reactive state from TanStack Store
  const prefs = useStore(tablePreferencesStore)

  const columns = useMemo<any[]>(
    () => [
      {
        id: 'select',
        size: 44,
        minSize: 44,
        maxSize: 44,
        header: ({ table }: any) => (
          <div className="flex items-center justify-center">
            <Checkbox
              aria-label="Select all rows on page"
              isSelected={table.getIsAllPageRowsSelected()}
              isIndeterminate={table.getIsSomePageRowsSelected()}
              onChange={(val) => table.toggleAllPageRowsSelected(val)}
            />
          </div>
        ),
        cell: ({ row }: any) => (
          <div className="flex items-center justify-center">
            <Checkbox
              aria-label={`Select ${row.original.name}`}
              isSelected={row.getIsSelected()}
              onChange={(val) => row.toggleSelected(val)}
            />
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Service Name',
        size: 190,
        minSize: 170,
        cell: (info: any) => (
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
              {info.getValue()}
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              {info.row.original.id}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'team',
        header: 'Team',
        size: 130,
        minSize: 110,
        cell: (info: any) => (
          <span className="text-neutral-700 dark:text-neutral-300">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'region',
        header: 'Region',
        size: 120,
        minSize: 100,
        cell: (info: any) => (
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Health',
        size: 130,
        minSize: 110,
        cell: (info: any) => (
          <Badge variant={info.row.original.variant} dot>
            {info.getValue()}
          </Badge>
        ),
      },
      {
        accessorKey: 'cpu',
        header: 'CPU Load',
        size: 100,
        minSize: 90,
        cell: (info: any) => (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'memory',
        header: 'Memory',
        size: 110,
        minSize: 95,
        cell: (info: any) => (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'latency',
        header: 'Latency',
        size: 100,
        minSize: 90,
        cell: (info: any) => (
          <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'requests',
        header: 'Throughput',
        size: 140,
        minSize: 120,
        cell: (info: any) => (
          <span className="font-medium text-neutral-900 dark:text-neutral-100">
            {info.getValue()}
          </span>
        ),
      },
      {
        accessorKey: 'uptime',
        header: 'Uptime',
        size: 100,
        minSize: 90,
        cell: (info: any) => (
          <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {info.getValue()}
          </span>
        ),
      },
      {
        id: 'actions',
        header: 'Action',
        size: 96,
        minSize: 96,
        maxSize: 96,
        cell: ({ row }: any) => (
          <Button
            size="sm"
            variant="ghost"
            onPress={() => alert(`Managing service: ${row.original.name}`)}
          >
            Manage
          </Button>
        ),
      },
    ],
    [],
  )

  const activeData = isEmpty ? [] : data

  const columnPinning = useMemo(() => {
    if (!prefs.stickyPinning) return { start: [], end: [] }
    return {
      start: ['select', 'name'],
      end: ['actions'],
    }
  }, [prefs.stickyPinning])

  const table = useTable({
    data: activeData,
    columns,
    state: {
      sorting,
      globalFilter: debouncedSearch,
      rowSelection,
      pagination,
      columnPinning,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    features: tableFeatures({
      ...stockFeatures,
      coreRowModel: createCoreRowModel(),
      sortedRowModel: createSortedRowModel(),
      filteredRowModel: createFilteredRowModel(),
      paginatedRowModel: createPaginatedRowModel(),
    }),
    getRowId: (row: any) => row.id,
  })

  const selectedCount = Object.keys(rowSelection).filter(
    (k) => rowSelection[k],
  ).length

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/40 backdrop-blur-md shadow-xs">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <input
            type="text"
            placeholder="Pacer debounced search (services, teams, regions)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* View Preferences (TanStack Store) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant={prefs.stickyPinning ? 'primary' : 'outline'}
            onPress={() =>
              tablePreferencesStore.setState((s) => ({
                ...s,
                stickyPinning: !s.stickyPinning,
              }))
            }
          >
            Column Pinning: {prefs.stickyPinning ? 'ON' : 'OFF'}
          </Button>

          <Button
            size="sm"
            variant={prefs.dense ? 'primary' : 'outline'}
            onPress={() =>
              tablePreferencesStore.setState((s) => ({
                ...s,
                dense: !s.dense,
              }))
            }
          >
            Dense: {prefs.dense ? 'ON' : 'OFF'}
          </Button>

          <Button
            size="sm"
            variant={prefs.striped ? 'primary' : 'outline'}
            onPress={() =>
              tablePreferencesStore.setState((s) => ({
                ...s,
                striped: !s.striped,
              }))
            }
          >
            Striped: {prefs.striped ? 'ON' : 'OFF'}
          </Button>

          <Button
            size="sm"
            variant={isLoading ? 'primary' : 'outline'}
            onPress={() => setIsLoading((v) => !v)}
          >
            Loading: {isLoading ? 'ON' : 'OFF'}
          </Button>

          <Button
            size="sm"
            variant={isEmpty ? 'primary' : 'outline'}
            onPress={() => setIsEmpty((v) => !v)}
          >
            Empty: {isEmpty ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Selected Items Summary Bar */}
      {selectedCount > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200">
          <span>
            <strong>{selectedCount}</strong>{' '}
            {selectedCount === 1 ? 'service' : 'services'} selected across table
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRowSelection({})}
              className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:underline"
            >
              Clear selection
            </button>
            <Button size="sm" variant="danger">
              Batch Restart ({selectedCount})
            </Button>
          </div>
        </div>
      )}

      {/* Table Container with Horizontal Scroll */}
      <div className="max-h-[360px] overflow-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950">
        <Table
          aria-label="Cluster Services Table"
          layout="fixed"
          dense={prefs.dense}
          striped={prefs.striped}
          stickyHeader={prefs.stickyHeader}
          wrapInContainer={false}
          className="min-w-[1260px]"
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort()
                  const sortDir = header.column.getIsSorted()
                  const isPinned = header.column.getIsPinned()
                  const pinOffset =
                    isPinned === 'start'
                      ? header.column.getStart('start')
                      : isPinned === 'end'
                        ? header.column.getAfter('end')
                        : undefined

                  return (
                    <TableHead
                      key={header.id}
                      width={header.getSize()}
                      minWidth={header.column.columnDef.minSize}
                      maxWidth={header.column.columnDef.maxSize}
                      pinned={
                        isPinned
                          ? isPinned === 'start'
                            ? 'left'
                            : 'right'
                          : undefined
                      }
                      pinOffset={pinOffset}
                      sortDirection={sortDir}
                      onSort={
                        isSortable
                          ? () => header.column.toggleSorting()
                          : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeleton rows={5} columns={columns.length} />
            ) : table.getRowModel().rows.length === 0 ? (
              <TableEmpty colSpan={columns.length}>
                <EmptyState
                  variant="default"
                  title="No services match your query"
                  description="Try adjusting your debounced search terms or clearing active filters."
                  action={
                    <Button size="sm" onPress={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  }
                />
              </TableEmpty>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} selected={row.getIsSelected()}>
                  {row.getVisibleCells().map((cell) => {
                    const isPinned = cell.column.getIsPinned()
                    const pinOffset =
                      isPinned === 'start'
                        ? cell.column.getStart('start')
                        : isPinned === 'end'
                          ? cell.column.getAfter('end')
                          : undefined

                    return (
                      <TableCell
                        key={cell.id}
                        width={cell.column.getSize()}
                        minWidth={cell.column.columnDef.minSize}
                        maxWidth={cell.column.columnDef.maxSize}
                        pinned={
                          isPinned
                            ? isPinned === 'start'
                              ? 'left'
                              : 'right'
                            : undefined
                        }
                        pinOffset={pinOffset}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell
                colSpan={2}
                pinned={prefs.stickyPinning ? 'left' : undefined}
                pinOffset={0}
              >
                <span className="text-xs text-neutral-500">
                  Showing {table.getRowModel().rows.length} of{' '}
                  {table.getFilteredRowModel().rows.length} total services
                </span>
              </TableCell>
              <TableCell colSpan={9} align="right">
                <span className="text-xs font-mono text-neutral-500">
                  Cluster Health: 100% Verified
                </span>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-500 pt-1">
        <span>
          Page <strong>{pagination.pageIndex + 1}</strong> of{' '}
          <strong>{table.getPageCount() || 1}</strong>
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onPress={() => table.previousPage()}
            isDisabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={() => table.nextPage()}
            isDisabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

/**
 * TanStack Virtual Showcase: 2,000 Rows Windowed Scrolling
 */
export function TableVirtualDemo() {
  const parentRef = useRef<HTMLDivElement>(null)

  // Generate 2,000 synthetic records
  const virtualData = useMemo(() => {
    return Array.from({ length: 2000 }, (_, i) => ({
      id: `node-${i + 1}`,
      host: `worker-node-${String(i + 1).padStart(4, '0')}.infra.internal`,
      ip: `10.240.${Math.floor(i / 254)}.${(i % 254) + 1}`,
      cpu: `${((i * 13) % 85) + 10}%`,
      memory: `${(((i * 7) % 60) + 30).toFixed(1)} GB`,
      status: i % 17 === 0 ? 'Degraded' : 'Healthy',
      variant: (i % 17 === 0 ? 'warning' : 'success') as 'warning' | 'success',
    }))
  }, [])

  const rowVirtualizer = useVirtualizer({
    count: virtualData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 12,
  })

  const virtualRows = rowVirtualizer.getVirtualItems()
  const totalSize = rowVirtualizer.getTotalSize()
  const firstVirtual = virtualRows[0]
  const lastVirtual = virtualRows[virtualRows.length - 1]
  const paddingTop = firstVirtual ? firstVirtual.start : 0
  const paddingBottom = lastVirtual ? totalSize - lastVirtual.end : 0

  return (
    <div className="flex flex-col gap-3 w-full max-w-3xl p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          Rendering <strong>2,000</strong> virtualized rows via{' '}
          <code className="text-indigo-600 dark:text-indigo-400 font-mono">
            @tanstack/react-virtual
          </code>
        </span>
        <span className="font-mono text-xs">
          DOM Rows in View: <strong>{virtualRows.length}</strong>
        </span>
      </div>

      <div
        ref={parentRef}
        className="max-h-[320px] overflow-y-auto rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950"
      >
        <Table stickyHeader dense wrapInContainer={false}>
          <TableHeader>
            <TableRow>
              <TableHead>Node Hostname</TableHead>
              <TableHead>Private IP</TableHead>
              <TableHead align="numeric">CPU Load</TableHead>
              <TableHead align="numeric">Memory</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: `${paddingTop}px` }} colSpan={5} />
              </tr>
            )}
            {virtualRows.map((virtualRow) => {
              const item = virtualData[virtualRow.index]
              if (!item) return null
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="font-medium text-neutral-900 dark:text-neutral-100 font-mono text-xs">
                      {item.host}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-neutral-500">
                      {item.ip}
                    </span>
                  </TableCell>
                  <TableCell align="numeric">{item.cpu}</TableCell>
                  <TableCell align="numeric">{item.memory}</TableCell>
                  <TableCell>
                    <Badge variant={item.variant} dot>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: `${paddingBottom}px` }} colSpan={5} />
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// TanStack Query Demo Client
const queryClient = new QueryClient()

function QueryTableInner() {
  const [page, setPage] = useState(1)

  // Simulated server fetch with TanStack Query
  const { data, isFetching, refetch } = useQuery({
    queryKey: ['server-logs', page],
    queryFn: async () => {
      await new Promise((res) => setTimeout(res, 400))
      return {
        page,
        totalPages: 4,
        records: Array.from({ length: 4 }, (_, i) => ({
          id: `log-${page}-${i + 1}`,
          timestamp: new Date(Date.now() - (page * 4 + i) * 60000).toISOString(),
          level: (i % 3 === 0 ? 'ERROR' : i % 2 === 0 ? 'WARN' : 'INFO') as
            | 'INFO'
            | 'WARN'
            | 'ERROR',
          message: `Worker instance ${page * 10 + i} processed batch queue event successfully`,
        })),
      }
    },
  })

  return (
    <div className="flex flex-col gap-3 w-full max-w-3xl p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <div className="flex items-center gap-2">
          <span>
            Server Query State:{' '}
            <strong className="text-neutral-900 dark:text-neutral-100">
              Page {page} of {data?.totalPages ?? 4}
            </strong>
          </span>
          {isFetching && (
            <span className="text-indigo-600 dark:text-indigo-400 animate-pulse font-medium">
              • Fetching from cloud...
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onPress={() => refetch()}>
          Refetch Query
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-hidden">
        <Table dense wrapInContainer={false}>
          <TableHeader>
            <TableRow>
              <TableHead>Event ID</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Log Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isFetching && !data ? (
              <TableSkeleton rows={4} columns={4} />
            ) : (
              data?.records.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="font-mono text-xs text-neutral-500">
                      {item.id}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs text-neutral-600 dark:text-neutral-400">
                      {item.timestamp.slice(11, 19)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.level === 'ERROR'
                          ? 'error'
                          : item.level === 'WARN'
                            ? 'warning'
                            : 'neutral'
                      }
                      dot
                    >
                      {item.level}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-neutral-900 dark:text-neutral-100">
                      {item.message}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-1">
        <Button
          size="sm"
          variant="outline"
          isDisabled={page <= 1 || isFetching}
          onPress={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous Server Page
        </Button>
        <Button
          size="sm"
          variant="outline"
          isDisabled={page >= 4 || isFetching}
          onPress={() => setPage((p) => Math.min(4, p + 1))}
        >
          Next Server Page
        </Button>
      </div>
    </div>
  )
}

export function TableQueryDemo() {
  return (
    <QueryClientProvider client={queryClient}>
      <QueryTableInner />
    </QueryClientProvider>
  )
}

// ── Avatar Demo ──────────────────────────────────────────────────────

// ── Avatar Demo ──────────────────────────────────────────────────────

export function AvatarDemo() {
  const [size, setSize] = useState<AvatarSize>('md')
  const [shape, setShape] = useState<AvatarShape>('circle')
  const [status, setStatus] = useState<AvatarStatus | 'none'>('online')

  return (
    <div className="flex flex-col gap-6 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-neutral-500">Size:</span>
          {(['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as AvatarSize[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              className={`px-2 py-1 rounded text-xs font-medium uppercase transition-colors ${size === s
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-neutral-500">Shape:</span>
          {(['circle', 'square'] as AvatarShape[]).map((sh) => (
            <button
              key={sh}
              type="button"
              onClick={() => setShape(sh)}
              className={`px-2 py-1 rounded text-xs font-medium capitalize transition-colors ${shape === sh
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                }`}
            >
              {sh}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-neutral-500">Status:</span>
          {(['none', 'online', 'away', 'busy', 'offline'] as const).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatus(st)}
                className={`px-2 py-1 rounded text-xs font-medium capitalize transition-colors ${status === st
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'bg-neutral-200/60 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200'
                  }`}
              >
                {st}
              </button>
            ),
          )}
        </div>
      </div>

      {/* Interactive Avatar Preview */}
      <div className="flex items-center justify-around py-4 flex-wrap gap-6 bg-white dark:bg-neutral-950 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col items-center gap-2">
          <Avatar
            src="https://github.com/thasophearak.png"
            alt="Phearak S. Tha"
            size={size}
            shape={shape}
            status={status === 'none' ? undefined : status}
          />
          <span className="text-xs text-neutral-500">Image Avatar</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Avatar
            initials="PT"
            aria-label="Phearak Tha"
            size={size}
            shape={shape}
            status={status === 'none' ? undefined : status}
          />
          <span className="text-xs text-neutral-500">Initials Avatar</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <Avatar
            aria-label="Default user"
            size={size}
            shape={shape}
            status={status === 'none' ? undefined : status}
          />
          <span className="text-xs text-neutral-500">Default Icon</span>
        </div>
      </div>

      {/* Avatar Group Preview */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          Stacked AvatarGroup with Max Overflow (+N)
        </span>
        <div className="flex items-center gap-8 py-4 px-6 bg-white dark:bg-neutral-950 rounded-lg border border-neutral-200 dark:border-neutral-800 flex-wrap">
          <AvatarGroup max={3} aria-label="Design team">
            <Avatar initials="AL" aria-label="Alex" />
            <Avatar initials="BT" aria-label="Beth" />
            <Avatar initials="CK" aria-label="Chris" />
            <Avatar initials="DL" aria-label="Dana" />
            <Avatar initials="EV" aria-label="Evan" />
          </AvatarGroup>

          <AvatarGroup size="sm" shape="square" max={4} aria-label="Engineers">
            <Avatar initials="E1" aria-label="Dev 1" />
            <Avatar initials="E2" aria-label="Dev 2" />
            <Avatar initials="E3" aria-label="Dev 3" />
            <Avatar initials="E4" aria-label="Dev 4" />
            <Avatar initials="E5" aria-label="Dev 5" />
          </AvatarGroup>
        </div>
      </div>
    </div>
  )
}

// ── Calendar Demo ────────────────────────────────────────────────────

export function CalendarDemo() {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          Single Date Calendar
        </span>
        <Calendar aria-label="Select appointment date" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          Date Range Calendar
        </span>
        <RangeCalendar aria-label="Select trip dates" />
      </div>
    </div>
  )
}

// ── DatePicker Demo ──────────────────────────────────────────────────

export function DatePickerDemo() {
  return (
    <div className="flex flex-col gap-6 p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 max-w-lg mx-auto">
      <DatePicker
        label="Event Date"
        description="Select the scheduled event day"
      />

      <DateRangePicker
        label="Booking Range"
        description="Select check-in and check-out dates"
      />

      <DateField
        label="Manual Date Input"
        description="Type directly into month/day/year segments"
      />
    </div>
  )
}

// ── CommandPalette Demo ──────────────────────────────────────────────

export function CommandPaletteDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const [lastAction, setLastAction] = useState<string | null>(null)

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
      <p className="text-xs text-neutral-500">
        Press <Kbd>⌘K</Kbd> or click the button below to launch the Command
        Palette
      </p>

      <Button variant="primary" onPress={() => setIsOpen(true)}>
        Open Command Palette
      </Button>

      {lastAction && (
        <div className="text-xs px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Triggered action: <strong>{lastAction}</strong>
        </div>
      )}

      <CommandPalette isOpen={isOpen} onOpenChange={setIsOpen}>
        <CommandPaletteInput placeholder="Search commands, docs, or actions..." />
        <CommandPaletteList>
          <CommandPaletteSection heading="Navigation">
            <CommandPaletteItem
              shortcut={['G', 'H']}
              onAction={() => setLastAction('Navigated to Home')}
            >
              Go to Home
            </CommandPaletteItem>
            <CommandPaletteItem
              shortcut={['G', 'D']}
              onAction={() => setLastAction('Navigated to Docs')}
            >
              Browse Components
            </CommandPaletteItem>
            <CommandPaletteItem
              shortcut={['G', 'S']}
              onAction={() => setLastAction('Opened Settings')}
            >
              Account Settings
            </CommandPaletteItem>
          </CommandPaletteSection>

          <CommandPaletteSection heading="Actions">
            <CommandPaletteItem
              shortcut={['⌘', 'N']}
              description="Create a new dashboard project"
              onAction={() => setLastAction('Created New Project')}
            >
              Create New Project
            </CommandPaletteItem>
            <CommandPaletteItem
              shortcut={['⌘', 'C']}
              description="Copy installation command"
              onAction={() => setLastAction('Copied install command')}
            >
              Copy npm install
            </CommandPaletteItem>
            <CommandPaletteItem
              shortcut={['⌘', 'T']}
              description="Switch between light and dark themes"
              onAction={() => setLastAction('Toggled Theme')}
            >
              Toggle Theme
            </CommandPaletteItem>
          </CommandPaletteSection>
        </CommandPaletteList>
        <CommandPaletteEmpty>No matching commands found.</CommandPaletteEmpty>
        <CommandPaletteFooter />
      </CommandPalette>
    </div>
  )
}
