'use client'

import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AreaChart,
  BarChart,
  Button,
  ChartContainer,
  ComboBox,
  ComboBoxItem,
  DoughnutChart,
  Form,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  LineChart,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  PercentageBar,
  PercentageCircle,
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
  Tag,
  TagGroup,
  TextField,
  ToastContainer,
  TopList,
  tokens,
  useToast,
} from '@moul-dev/ui'
import type React from 'react'
import { useState } from 'react'

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
