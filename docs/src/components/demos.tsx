'use client'

import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  Button,
  ComboBox,
  ComboBoxItem,
  Form,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  REGEXP_ONLY_DIGITS,
  Tag,
  TagGroup,
  TextField,
  ToastContainer,
  useToast,
  ChartContainer,
  LineChart,
  BarChart,
  DoughnutChart,
  TopList,
  Stat,
  PercentageBar,
  PercentageCircle,
  tokens,
} from '@moul-dev/ui'
import React, { useState } from 'react'

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
            onRemove={() => {}}
          >
            <Tag id="sm1">Small Tag</Tag>
            <Tag id="sm2">Tag 2</Tag>
          </TagGroup>

          <TagGroup
            label="Medium size"
            size="md"
            variant="secondary"
            onRemove={() => {}}
          >
            <Tag id="md1">Medium Tag</Tag>
            <Tag id="md2">Tag 2</Tag>
          </TagGroup>

          <TagGroup
            label="Large size"
            size="lg"
            variant="tertiary"
            onRemove={() => {}}
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
  { time: '12:00', 'United States': 120, 'Netherlands': 80, 'Singapore': 40, 'Canada': 50, 'Ireland': 10 },
  { time: '14:00', 'United States': 150, 'Netherlands': 110, 'Singapore': 60, 'Canada': 70, 'Ireland': 15 },
  { time: '16:00', 'United States': 880, 'Netherlands': 130, 'Singapore': 90, 'Canada': 80, 'Ireland': 310 },
  { time: '18:00', 'United States': 220, 'Netherlands': 320, 'Singapore': 80, 'Canada': 90, 'Ireland': 40 },
  { time: '20:00', 'United States': 180, 'Netherlands': 520, 'Singapore': 70, 'Canada': 85, 'Ireland': 25 },
  { time: '22:00', 'United States': 310, 'Netherlands': 120, 'Singapore': 50, 'Canada': 60, 'Ireland': 20 },
  { time: '13', 'United States': 140, 'Netherlands': 550, 'Singapore': 60, 'Canada': 75, 'Ireland': 15 },
  { time: '02:00', 'United States': 120, 'Netherlands': 110, 'Singapore': 40, 'Canada': 50, 'Ireland': 12 },
  { time: '04:00', 'United States': 160, 'Netherlands': 130, 'Singapore': 90, 'Canada': 60, 'Ireland': 350 },
  { time: '06:00', 'United States': 140, 'Netherlands': 180, 'Singapore': 80, 'Canada': 55, 'Ireland': 20 },
  { time: '08:00', 'United States': 920, 'Netherlands': 1750, 'Singapore': 110, 'Canada': 380, 'Ireland': 15 },
  { time: '10:00', 'United States': 620, 'Netherlands': 150, 'Singapore': 1250, 'Canada': 120, 'Ireland': 25 },
  { time: '12:00', 'United States': 140, 'Netherlands': 120, 'Singapore': 80, 'Canada': 90, 'Ireland': 10 },
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
            <button className="px-3 py-1 text-xs border rounded-md dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              Globe
            </button>
            <button className="px-3 py-1 text-xs border rounded-md dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
              Bookmark
            </button>
          </div>
        }
      >
        <LineChart
          data={timeseriesData}
          indexKey="time"
          categories={['United States', 'Netherlands', 'Singapore', 'Canada', 'Ireland']}
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
      <ChartContainer title="Vertical Bar Chart (Categorical)" legend={legendItems}>
        <BarChart
          data={categoricalData}
          indexKey="name"
          categories={['Requests']}
          categorical
          valueFormatter={kFormatter}
          height={300}
        />
      </ChartContainer>

      <ChartContainer title="Horizontal Bar Chart (Categorical)" legend={legendItems}>
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
          <button className="px-3 py-1 text-xs border rounded-md dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
            View All
          </button>
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
        <PercentageCircle value={45} label="Memory Usage" size={90} color={tokens.colorChart2} />
        <PercentageCircle value={12} label="Disk IO" size={90} color={tokens.colorChart3} />
      </div>

      <div className="flex flex-col gap-4 p-6 border rounded-lg dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
        <PercentageBar value={85} label="Task Completion" size="md" />
        <PercentageBar value={52} label="Network Bandwidth" size="sm" color={tokens.colorChart5} />
        <PercentageBar value={95} label="Database Sync" size="lg" color={tokens.colorChart7} />
      </div>
    </div>
  )
}

