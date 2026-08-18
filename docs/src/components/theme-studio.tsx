'use client'

import {
  Alert,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AreaChart,
  Avatar,
  Badge,
  BarChart,
  BreadcrumbItem,
  Breadcrumbs,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardHeader,
  Cell,
  ChartContainer,
  Checkbox,
  CheckboxGroup,
  Column,
  ComboBox,
  ComboBoxItem,
  DoughnutChart,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  Kbd,
  Label,
  Modal,
  ModalBody,
  ModalDialog,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberField,
  PercentageBar,
  PercentageCircle,
  Popover,
  PopoverDialog,
  PopoverTrigger,
  REGEXP_ONLY_DIGITS,
  Row,
  SearchField,
  Select,
  SelectItem,
  Separator,
  Slider,
  SliderThumb,
  SliderTrack,
  Stat,
  Switch,
  Tab,
  TabList,
  Table,
  TableBody,
  TableHeader,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TagGroup,
  TextField,
  ToastContainer,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  TooltipTrigger,
  TopList,
  toastQueue,
} from '@moul-dev/ui'
import {
  Activity,
  Bell,
  Check,
  ChevronDown,
  Code,
  Copy,
  CreditCard,
  Layers,
  RefreshCw,
  Share2,
  Sliders,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react'
import * as React from 'react'
import {
  applyThemeToDOM,
  DENSITY_PRESETS,
  type DensityPreset,
  generateCssConfig,
  generateShareUrl,
  getDefaultThemeState,
  parseThemeFromUrl,
  RADIUS_PRESETS,
  type RadiusPreset,
  saveThemeToStorage,
  THEME_COLORS,
  type ThemeColor,
  type ThemeState,
} from '@/lib/theme'

// Sample chart data
const revenueChartData = [
  { month: 'Jan', revenue: 18400, target: 15000, profit: 7200 },
  { month: 'Feb', revenue: 22100, target: 17000, profit: 8900 },
  { month: 'Mar', revenue: 26800, target: 20000, profit: 11400 },
  { month: 'Apr', revenue: 31200, target: 24000, profit: 13800 },
  { month: 'May', revenue: 29500, target: 26000, profit: 12900 },
  { month: 'Jun', revenue: 38400, target: 30000, profit: 17600 },
  { month: 'Jul', revenue: 42900, target: 35000, profit: 19800 },
]

const donutChartData = [
  { name: 'Direct Sales', value: 48 },
  { name: 'Referral', value: 26 },
  { name: 'Organic', value: 16 },
  { name: 'Affiliate', value: 10 },
]

const topListItems = [
  { label: 'Enterprise Annual Plan', value: 48200 },
  { label: 'Pro Team Subscription', value: 29850 },
  { label: 'Developer Seats Addon', value: 14100 },
  { label: 'Custom SSO Integration', value: 9400 },
]

const mockTableUsers = [
  {
    id: '1',
    name: 'Sarah Connor',
    email: 's.connor@sky.net',
    role: 'Admin',
    status: 'Active',
    plan: 'Enterprise',
    spent: '$12,400',
  },
  {
    id: '2',
    name: 'Alex Mercer',
    email: 'alex@blacklight.org',
    role: 'Editor',
    status: 'Pending',
    plan: 'Pro Team',
    spent: '$3,850',
  },
  {
    id: '3',
    name: 'Elena Fisher',
    email: 'elena@drake-exp.com',
    role: 'Viewer',
    status: 'Active',
    plan: 'Pro Team',
    spent: '$2,100',
  },
  {
    id: '4',
    name: 'Marcus Holloway',
    email: 'marcus@dedsec.io',
    role: 'Developer',
    status: 'Suspended',
    plan: 'Starter',
    spent: '$490',
  },
]

export function ThemeStudio() {
  const [themeState, setThemeState] = React.useState<ThemeState>(
    getDefaultThemeState(),
  )
  const [showAdvancedSliders, setShowAdvancedSliders] = React.useState(false)
  const [copiedCss, setCopiedCss] = React.useState(false)
  const [copiedUrl, setCopiedUrl] = React.useState(false)
  const [isCssModalOpen, setIsCssModalOpen] = React.useState(false)

  // Interactive states for preview controls
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [isAlertOpen, setIsAlertOpen] = React.useState(false)
  const [selectedTab, setSelectedTab] = React.useState('overview')
  const [sliderValue, setSliderValue] = React.useState(68)
  const [otpValue, setOtpValue] = React.useState('482910')
  const [switchChecked, setSwitchChecked] = React.useState(true)

  // Initialize theme from URL or storage
  React.useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search)
      const parsedFromUrl = parseThemeFromUrl(searchParams)

      const initialHue = localStorage.getItem('moul-theme-hue')
      const initialChroma = localStorage.getItem('moul-theme-chroma')
      const initialDensity = localStorage.getItem('moul-theme-density')
      const initialFontScale = localStorage.getItem('moul-theme-font-scale')
      const initialRadius = localStorage.getItem('moul-theme-radius')

      let nextColor = THEME_COLORS[0]!
      let nextDensity = DENSITY_PRESETS[1]!
      let nextDensityFactor = 1.0
      let nextFontScale = 1.0
      let nextRadius = RADIUS_PRESETS[2]!
      let nextRadiusFactor = 1.0

      if (initialHue !== null && initialChroma !== null) {
        const h = Number.parseInt(initialHue, 10)
        const c = Number.parseFloat(initialChroma)
        const found = THEME_COLORS.find(
          (col) => col.hue === h && col.chroma === c,
        )
        if (found) nextColor = found
      }

      if (initialDensity !== null) {
        const dVal = Number.parseFloat(initialDensity)
        const fsVal = initialFontScale
          ? Number.parseFloat(initialFontScale)
          : 1.0
        const found = DENSITY_PRESETS.find((d) => d.densityFactor === dVal)
        if (found) {
          nextDensity = found
          nextDensityFactor = found.densityFactor
          nextFontScale = found.fontScale
        } else if (!Number.isNaN(dVal)) {
          nextDensityFactor = dVal
          nextFontScale = fsVal
        }
      }

      if (initialRadius !== null) {
        const rVal = Number.parseFloat(initialRadius)
        const found = RADIUS_PRESETS.find((r) => r.radiusFactor === rVal)
        if (found) {
          nextRadius = found
          nextRadiusFactor = found.radiusFactor
        } else if (!Number.isNaN(rVal)) {
          nextRadiusFactor = rVal
        }
      }

      // Apply URL params override
      if (parsedFromUrl) {
        if (parsedFromUrl.color) nextColor = parsedFromUrl.color
        if (parsedFromUrl.density) nextDensity = parsedFromUrl.density
        if (parsedFromUrl.densityFactor !== undefined)
          nextDensityFactor = parsedFromUrl.densityFactor
        if (parsedFromUrl.fontScale !== undefined)
          nextFontScale = parsedFromUrl.fontScale
        if (parsedFromUrl.radius) nextRadius = parsedFromUrl.radius
        if (parsedFromUrl.radiusFactor !== undefined)
          nextRadiusFactor = parsedFromUrl.radiusFactor
      }

      const mergedState: ThemeState = {
        color: nextColor,
        density: nextDensity,
        densityFactor: nextDensityFactor,
        fontScale: nextFontScale,
        radius: nextRadius,
        radiusFactor: nextRadiusFactor,
      }

      setThemeState(mergedState)
      applyThemeToDOM({
        hue: mergedState.color.hue,
        chroma: mergedState.color.chroma,
        densityFactor: mergedState.densityFactor,
        fontScale: mergedState.fontScale,
        radiusFactor: mergedState.radiusFactor,
      })
    } catch (e) {
      console.error('Failed to init ThemeStudio', e)
    }
  }, [])

  // Sync updates with URL query parameters and storage
  const updateTheme = (partial: Partial<ThemeState>) => {
    setThemeState((prev) => {
      const next: ThemeState = { ...prev, ...partial }

      applyThemeToDOM({
        hue: next.color.hue,
        chroma: next.color.chroma,
        densityFactor: next.densityFactor,
        fontScale: next.fontScale,
        radiusFactor: next.radiusFactor,
      })

      saveThemeToStorage({
        hue: next.color.hue,
        chroma: next.color.chroma,
        densityFactor: next.densityFactor,
        fontScale: next.fontScale,
        radiusFactor: next.radiusFactor,
      })

      // Sync URL search params with replaceState without scrolling or reloading
      if (typeof window !== 'undefined') {
        const shareUrl = generateShareUrl(next, window.location.pathname)
        window.history.replaceState(null, '', shareUrl)
      }

      return next
    })
  }

  const handleSelectColor = (color: ThemeColor) => {
    updateTheme({ color })
  }

  const handleSelectDensity = (density: DensityPreset) => {
    updateTheme({
      density,
      densityFactor: density.densityFactor,
      fontScale: density.fontScale,
    })
  }

  const handleSelectRadius = (radius: RadiusPreset) => {
    updateTheme({
      radius,
      radiusFactor: radius.radiusFactor,
    })
  }

  const handleResetDefaults = () => {
    const defaults = getDefaultThemeState()
    updateTheme(defaults)
  }

  const cssConfig = generateCssConfig({
    hue: themeState.color.hue,
    chroma: themeState.color.chroma,
    densityFactor: themeState.densityFactor,
    fontScale: themeState.fontScale,
    radiusFactor: themeState.radiusFactor,
  })

  const handleCopyCss = () => {
    try {
      navigator.clipboard.writeText(cssConfig)
      setCopiedCss(true)
      setTimeout(() => setCopiedCss(false), 2000)
    } catch (e) {
      console.error('Failed to copy CSS', e)
    }
  }

  const handleCopyShareLink = () => {
    try {
      const url = generateShareUrl(themeState)
      navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch (e) {
      console.error('Failed to copy URL', e)
    }
  }

  const showToast = (type: 'info' | 'success' | 'warning' | 'error') => {
    const messages = {
      info: 'Deployment build started for production.',
      success: 'Invoice #8492 marked as paid.',
      warning: 'Your monthly API rate limit is at 85%.',
      error: 'Failed to connect to database replica.',
    }
    toastQueue.add(
      {
        title: `${type.toUpperCase()} Notification`,
        description: messages[type],
        variant: type,
      },
      { timeout: 4000 },
    )
  }

  return (
    <div className="relative min-h-screen bg-fd-background text-fd-foreground pb-28">
      <ToastContainer />

      {/* Hero Header */}
      <div className="relative border-b border-fd-border/50 bg-fd-card/20 backdrop-blur-md pt-10 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-fd-primary/10 text-fd-primary w-fit border border-fd-primary/20">
              <Sparkles className="h-3.5 w-3.5" />
              Theme Studio & Component Preview
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Design System Customizer
            </h1>
            <p className="text-sm sm:text-base text-fd-muted-foreground max-w-2xl">
              Tune color palettes, component density, typography scale, and
              corner radiuses in real time. All changes automatically update
              your shareable URL and production CSS configuration.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              onPress={handleCopyShareLink}
              className="gap-1.5 shadow-xs"
            >
              {copiedUrl ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {copiedUrl ? 'Link Copied!' : 'Share Theme'}
            </Button>
            <Button
              variant="primary"
              onPress={() => setIsCssModalOpen(true)}
              className="gap-1.5 shadow-sm"
            >
              <Code className="h-4 w-4" />
              Export CSS
            </Button>
            <Button
              variant="ghost"
              onPress={handleResetDefaults}
              aria-label="Reset to default theme values"
              className="px-2.5"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Sticky / Floating Interactive Toolbar */}
      <div className="sticky top-14 z-40 border-b border-fd-border/80 bg-fd-background/85 backdrop-blur-xl shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Swatches Bar */}
            <div className="flex items-center gap-3 overflow-x-auto py-1 px-1">
              <span className="text-xs font-bold text-fd-muted-foreground uppercase tracking-wider select-none shrink-0">
                Color
              </span>
              <div className="flex items-center gap-2 py-1.5 px-1 shrink-0">
                {THEME_COLORS.map((color) => {
                  const isActive =
                    color.hue === themeState.color.hue &&
                    color.chroma === themeState.color.chroma
                  return (
                    <button
                      type="button"
                      key={color.id}
                      onClick={() => handleSelectColor(color)}
                      title={`${color.name} (Hue ${color.hue})`}
                      aria-label={`Select ${color.name} theme`}
                      className={`group relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer outline-hidden border ${
                        isActive
                          ? 'ring-2 ring-fd-primary ring-offset-2 ring-offset-fd-background scale-105'
                          : 'border-black/10 dark:border-white/15 hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.colorClass }}
                    >
                      {isActive && (
                        <Check
                          className={`h-3.5 w-3.5 stroke-[2.5] ${color.checkmarkColor}`}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Density & Radius Presets */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Density */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-fd-muted-foreground uppercase tracking-wider select-none">
                  Density
                </span>
                <div className="flex p-0.5 bg-fd-muted/80 rounded-xl border border-fd-border/50">
                  {DENSITY_PRESETS.map((preset) => {
                    const isSelected =
                      themeState.density.id === preset.id &&
                      themeState.densityFactor === preset.densityFactor
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => handleSelectDensity(preset)}
                        title={preset.description}
                        className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-fd-card text-fd-foreground shadow-xs'
                            : 'text-fd-muted-foreground hover:text-fd-foreground'
                        }`}
                      >
                        {preset.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Radius */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-fd-muted-foreground uppercase tracking-wider select-none">
                  Radius
                </span>
                <div className="flex p-0.5 bg-fd-muted/80 rounded-xl border border-fd-border/50">
                  {RADIUS_PRESETS.map((preset) => {
                    const isSelected =
                      themeState.radius.id === preset.id &&
                      themeState.radiusFactor === preset.radiusFactor
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => handleSelectRadius(preset)}
                        title={preset.description}
                        className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-fd-card text-fd-foreground shadow-xs'
                            : 'text-fd-muted-foreground hover:text-fd-foreground'
                        }`}
                      >
                        {preset.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Toggle Sliders for Fine Tuning */}
              <button
                type="button"
                onClick={() => setShowAdvancedSliders(!showAdvancedSliders)}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  showAdvancedSliders
                    ? 'bg-fd-primary text-fd-primary-foreground border-fd-primary'
                    : 'bg-fd-muted/60 text-fd-muted-foreground hover:text-fd-foreground border-fd-border/60'
                }`}
                title="Fine-tune with sliders"
              >
                <Sliders className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Collapsible Fine-Tuning Sliders */}
          {showAdvancedSliders && (
            <div className="mt-3 pt-3 border-t border-fd-border/50 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <Slider
                  aria-label="Spacing Factor"
                  label="Spacing Factor"
                  minValue={0.7}
                  maxValue={1.4}
                  step={0.05}
                  value={themeState.densityFactor}
                  onChange={(val) => {
                    const nextVal = typeof val === 'number' ? val : val[0]
                    updateTheme({
                      densityFactor: nextVal,
                      density: {
                        id: 'custom',
                        name: 'Custom',
                        densityFactor: nextVal,
                        fontScale: themeState.fontScale,
                        description: 'Custom spacing',
                      },
                    })
                  }}
                  getValueLabel={(val) => {
                    const v = (Array.isArray(val) ? val[0] : val) ?? 0
                    return `${v.toFixed(2)}x`
                  }}
                >
                  <SliderTrack>
                    <SliderThumb />
                  </SliderTrack>
                </Slider>
              </div>

              <div>
                <Slider
                  aria-label="Typography Scale"
                  label="Typography Scale"
                  minValue={0.85}
                  maxValue={1.2}
                  step={0.02}
                  value={themeState.fontScale}
                  onChange={(val) => {
                    const nextVal = typeof val === 'number' ? val : val[0]
                    updateTheme({
                      fontScale: nextVal,
                      density: {
                        id: 'custom',
                        name: 'Custom',
                        densityFactor: themeState.densityFactor,
                        fontScale: nextVal,
                        description: 'Custom font scale',
                      },
                    })
                  }}
                  getValueLabel={(val) => {
                    const v = (Array.isArray(val) ? val[0] : val) ?? 0
                    return `${v.toFixed(2)}x`
                  }}
                >
                  <SliderTrack>
                    <SliderThumb />
                  </SliderTrack>
                </Slider>
              </div>

              <div>
                <Slider
                  aria-label="Radius Multiplier"
                  label="Radius Multiplier"
                  minValue={0}
                  maxValue={2.5}
                  step={0.1}
                  value={themeState.radiusFactor}
                  onChange={(val) => {
                    const nextVal = typeof val === 'number' ? val : val[0]
                    updateTheme({
                      radiusFactor: nextVal,
                      radius: {
                        id: 'custom',
                        name: 'Custom',
                        radiusFactor: nextVal,
                        description: 'Custom radius',
                      },
                    })
                  }}
                  getValueLabel={(val) => {
                    const v = (Array.isArray(val) ? val[0] : val) ?? 0
                    return `${v.toFixed(2)}x`
                  }}
                >
                  <SliderTrack>
                    <SliderThumb />
                  </SliderTrack>
                </Slider>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Catalog Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 flex flex-col gap-12">
        {/* Section 1: Live Interactive SaaS Dashboard Demo */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-5 w-5 text-fd-primary" />
              Live Dashboard Preview
            </h2>
            <span className="text-xs text-fd-muted-foreground">
              Integrated real-world component synergy
            </span>
          </div>

          <Card className="p-6 border border-fd-border/70 shadow-lg bg-fd-card/50 backdrop-blur-xs">
            <div className="flex flex-col gap-6">
              {/* Dashboard Top Row Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Stat
                  variant="flat"
                  label="Monthly Recurring Revenue"
                  value="$42,900"
                  trend="+18.4%"
                  trendDirection="up"
                  trendLabel="vs last month"
                />
                <Stat
                  variant="flat"
                  label="Active Subscribers"
                  value="1,842"
                  trend="+12.1%"
                  trendDirection="up"
                  trendLabel="vs last month"
                />
                <Stat
                  variant="flat"
                  label="Conversion Rate"
                  value="4.82%"
                  trend="+0.8%"
                  trendDirection="up"
                  trendLabel="vs last month"
                />
                <Stat variant="flat" label="Quarterly Goal Target">
                  <div className="flex items-center gap-3 my-1">
                    <PercentageCircle value={78} size={56} />
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-fd-foreground">
                        78%
                      </span>
                      <span className="text-xs text-fd-muted-foreground">
                        On track
                      </span>
                    </div>
                  </div>
                  <PercentageBar value={78} />
                </Stat>
              </div>

              {/* Chart & TopList Middle Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 w-full">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <h3 className="text-sm font-bold text-fd-foreground">
                            Revenue Analytics
                          </h3>
                          <p className="text-xs text-fd-muted-foreground mt-0.5">
                            Monthly cash flow and targets
                          </p>
                        </div>
                        <ButtonGroup>
                          <Button variant="outline" size="sm">
                            Monthly
                          </Button>
                          <Button variant="primary" size="sm">
                            Quarterly
                          </Button>
                        </ButtonGroup>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <AreaChart
                        data={revenueChartData}
                        categories={['revenue', 'profit']}
                        indexKey="month"
                        height={260}
                      />
                    </CardBody>
                  </Card>
                </div>

                <div className="w-full">
                  <Card variant="flat">
                    <CardHeader>
                      <h3 className="text-sm font-bold text-fd-foreground">
                        Top Performing Products
                      </h3>
                    </CardHeader>
                    <CardBody>
                      <TopList
                        data={topListItems}
                        valueFormatter={(v) => `$${v.toLocaleString()}`}
                      />
                    </CardBody>
                  </Card>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Section 2: Buttons & Actions */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-5 w-5 text-fd-primary" />
              Buttons & Action Controls
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Variants */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Button Variants
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="tertiary">Tertiary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button variant="danger-soft">Danger Soft</Button>
                </div>
              </CardBody>
            </Card>

            {/* Sizing & States */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Sizes & Sizing Behavior
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Button size="sm" variant="primary">
                    Small (sm)
                  </Button>
                  <Button size="md" variant="primary">
                    Medium (md)
                  </Button>
                  <Button size="lg" variant="primary">
                    Large (lg)
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Button isPending variant="primary">
                    Saving...
                  </Button>
                  <Button isDisabled variant="outline">
                    Disabled
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Groups & Shortcuts */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Button Groups & Toggle Controls
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-3">
                <ButtonGroup>
                  <Button variant="outline">Daily</Button>
                  <Button variant="outline">Weekly</Button>
                  <Button variant="outline">Yearly</Button>
                </ButtonGroup>
                <ToggleButtonGroup
                  selectionMode="multiple"
                  defaultSelectedKeys={['bold', 'italic']}
                >
                  <ToggleButton id="bold">Bold</ToggleButton>
                  <ToggleButton id="italic">Italic</ToggleButton>
                  <ToggleButton id="underline">Underline</ToggleButton>
                </ToggleButtonGroup>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-xs text-fd-muted-foreground">
                    Shortcuts:
                  </span>
                  <Kbd>⌘K</Kbd>
                  <Kbd>Shift + Enter</Kbd>
                  <Kbd>ESC</Kbd>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Section 3: Form Inputs & Fields */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-fd-primary" />
              Form & Input Controls
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Text & Search */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Text & Number Fields
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                <TextField
                  label="Organization Name"
                  placeholder="Acme Corp"
                  defaultValue="Moul Systems"
                />
                <SearchField
                  label="Quick Component Search"
                  placeholder="Type to filter..."
                />
                <NumberField
                  label="Seat Licenses"
                  defaultValue={12}
                  minValue={1}
                  maxValue={100}
                />
              </CardBody>
            </Card>

            {/* Select & Combobox */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Select & Authentication
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                <Select label="Deployment Region" defaultSelectedKey="us-east">
                  <SelectItem id="us-east">US East (N. Virginia)</SelectItem>
                  <SelectItem id="us-west">US West (Oregon)</SelectItem>
                  <SelectItem id="eu-central">
                    EU Central (Frankfurt)
                  </SelectItem>
                  <SelectItem id="ap-southeast">
                    AP Southeast (Singapore)
                  </SelectItem>
                </Select>

                <ComboBox label="Assigned Team Lead" defaultSelectedKey="sarah">
                  <ComboBoxItem id="sarah">Sarah Connor (Admin)</ComboBoxItem>
                  <ComboBoxItem id="alex">Alex Mercer (Editor)</ComboBoxItem>
                  <ComboBoxItem id="elena">Elena Fisher (Viewer)</ComboBoxItem>
                </ComboBox>

                <div className="flex flex-col gap-1.5">
                  <Label>Two-Factor Auth OTP</Label>
                  <InputOTP
                    maxLength={6}
                    value={otpValue}
                    onChange={setOtpValue}
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
                </div>
              </CardBody>
            </Card>

            {/* Checkboxes, Radios, Sliders & Switches */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Selection & Sliders
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-fd-foreground">
                      Auto Backup
                    </span>
                    <span className="text-xs text-fd-muted-foreground">
                      Snapshot every 6 hours
                    </span>
                  </div>
                  <Switch
                    isSelected={switchChecked}
                    onChange={setSwitchChecked}
                  >
                    <span className="inline-block w-16 text-left">
                      {switchChecked ? 'Enabled' : 'Disabled'}
                    </span>
                  </Switch>
                </div>

                <CheckboxGroup
                  label="Notification Channels"
                  defaultValue={['email', 'slack']}
                >
                  <Checkbox value="email">Email Alerts</Checkbox>
                  <Checkbox value="slack">Slack Integration</Checkbox>
                  <Checkbox value="sms">SMS Priority</Checkbox>
                </CheckboxGroup>

                <Slider
                  label="Volume Level"
                  value={sliderValue}
                  onChange={(v) =>
                    setSliderValue(Array.isArray(v) ? (v[0] ?? 0) : v)
                  }
                  minValue={0}
                  maxValue={100}
                  getValueLabel={(v) =>
                    `${(Array.isArray(v) ? v[0] : v) ?? 0}%`
                  }
                >
                  <SliderTrack>
                    <SliderThumb />
                  </SliderTrack>
                </Slider>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Section 4: Data Display, Badges & Alerts */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Bell className="h-5 w-5 text-fd-primary" />
              Badges, Status Alerts & Feedback
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Badges & Tags */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Badges & Tags
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="primary">Primary</Badge>
                  <Badge variant="success">Success</Badge>
                  <Badge variant="warning">Warning</Badge>
                  <Badge variant="error">Error</Badge>
                  <Badge variant="neutral">Neutral</Badge>
                </div>

                <TagGroup
                  label="Active Frameworks"
                  selectionMode="multiple"
                  defaultSelectedKeys={['react', 'stylex']}
                >
                  <Tag id="react">React 19</Tag>
                  <Tag id="stylex">StyleX</Tag>
                  <Tag id="react-aria">React Aria</Tag>
                  <Tag id="tailwind">Tailwind CSS</Tag>
                </TagGroup>

                <div className="flex items-center gap-3 pt-2">
                  <Avatar initials="SC" alt="Sarah Connor" />
                  <Avatar initials="AM" alt="Alex Mercer" />
                  <Avatar initials="EF" alt="Elena Fisher" />
                  <div className="flex flex-col text-xs">
                    <span className="font-semibold text-fd-foreground">
                      Team Members
                    </span>
                    <span className="text-fd-muted-foreground">
                      3 collaborators active
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Alerts */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Contextual Alerts
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-3">
                <Alert variant="info" title="System Maintenance">
                  Scheduled database index rebuilding tomorrow at 02:00 UTC.
                </Alert>
                <Alert variant="accent" title="New Release Available">
                  Moul UI v2026.08.17 is now ready for deployment.
                </Alert>
                <Alert variant="success" title="Backup Completed">
                  All cloud storage snapshots were successfully archived.
                </Alert>
                <Alert variant="warning" title="SSL Certificate Expiry">
                  Domain certificate will expire in 14 days.
                </Alert>
                <Alert variant="error" title="Rate Limit Exceeded">
                  Payment gateway API key exceeded quota.
                </Alert>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Section 5: Data Tables */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Users className="h-5 w-5 text-fd-primary" />
              Interactive Data Table
            </h2>
          </div>

          <Card className="border border-fd-border/70 overflow-hidden shadow-sm">
            <Table
              aria-label="Customer Accounts Table"
              selectionMode="multiple"
            >
              <TableHeader>
                <Column isRowHeader>User</Column>
                <Column>Role</Column>
                <Column>Plan</Column>
                <Column>Status</Column>
                <Column>Total Spent</Column>
                <Column>Action</Column>
              </TableHeader>
              <TableBody items={mockTableUsers}>
                {(item) => (
                  <Row key={item.id}>
                    <Cell>
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          initials={item.name.slice(0, 2).toUpperCase()}
                          alt={item.name}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-fd-foreground">
                            {item.name}
                          </span>
                          <span className="text-xs text-fd-muted-foreground">
                            {item.email}
                          </span>
                        </div>
                      </div>
                    </Cell>
                    <Cell>{item.role}</Cell>
                    <Cell>{item.plan}</Cell>
                    <Cell>
                      <Badge
                        variant={
                          item.status === 'Active'
                            ? 'success'
                            : item.status === 'Pending'
                              ? 'warning'
                              : 'error'
                        }
                      >
                        {item.status}
                      </Badge>
                    </Cell>
                    <Cell>
                      <span className="font-mono font-medium">
                        {item.spent}
                      </span>
                    </Cell>
                    <Cell>
                      <Button variant="ghost" size="sm">
                        Manage
                      </Button>
                    </Cell>
                  </Row>
                )}
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* Section 6: Overlays, Modals & Toast Triggers */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-fd-primary" />
              Overlays, Modals & Interactive Feedback
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Modal Dialog */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Modal & Alert Dialogs
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-3">
                <p className="text-xs text-fd-muted-foreground">
                  Accessible dialogs with focus trapping and backdrop blur.
                </p>
                <div className="flex items-center gap-2 flex-wrap mt-auto">
                  <Button
                    variant="primary"
                    onPress={() => setIsModalOpen(true)}
                  >
                    Open Modal
                  </Button>
                  <Button variant="danger" onPress={() => setIsAlertOpen(true)}>
                    Delete Item
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Popover & Tooltip */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Popovers & Tooltips
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-3">
                <p className="text-xs text-fd-muted-foreground">
                  Floating overlays with anchor positioning.
                </p>
                <div className="flex items-center gap-3 mt-auto">
                  <PopoverTrigger>
                    <Button variant="outline">
                      Filter Menu
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                    <Popover placement="bottom start">
                      <PopoverDialog className="w-56 p-3 bg-fd-card rounded-xl border border-fd-border shadow-xl">
                        <div className="flex flex-col gap-2 text-xs">
                          <span className="font-bold text-fd-foreground">
                            Filter by status
                          </span>
                          <Checkbox defaultSelected>Active records</Checkbox>
                          <Checkbox defaultSelected>
                            Pending verification
                          </Checkbox>
                          <Checkbox>Archived accounts</Checkbox>
                        </div>
                      </PopoverDialog>
                    </Popover>
                  </PopoverTrigger>

                  <TooltipTrigger>
                    <Button variant="secondary">Hover Me</Button>
                    <Tooltip>Instant context information tooltip</Tooltip>
                  </TooltipTrigger>
                </div>
              </CardBody>
            </Card>

            {/* Live Toasts */}
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Toast Notification Triggers
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-3">
                <p className="text-xs text-fd-muted-foreground">
                  Queued reactive floating messages.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => showToast('info')}
                  >
                    Info Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onPress={() => showToast('success')}
                  >
                    Success Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => showToast('warning')}
                  >
                    Warning Toast
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onPress={() => showToast('error')}
                  >
                    Error Toast
                  </Button>
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* Section 7: Charts & Analytics Grid */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-fd-primary" />
              Theme-Responsive Charts
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ChartContainer
              title="Area Chart"
              description="Monthly revenue trajectory"
            >
              <AreaChart
                data={revenueChartData}
                categories={['revenue']}
                indexKey="month"
                height={220}
              />
            </ChartContainer>

            <ChartContainer
              title="Bar Chart"
              description="Monthly profit distribution"
            >
              <BarChart
                data={revenueChartData}
                categories={['profit']}
                indexKey="month"
                height={220}
              />
            </ChartContainer>

            <ChartContainer
              title="Doughnut Distribution"
              description="Traffic acquisition channels"
            >
              <DoughnutChart
                data={donutChartData}
                nameKey="name"
                valueKey="value"
                height={220}
              />
            </ChartContainer>
          </div>
        </section>

        {/* Section 8: Navigation & Layouts */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Layers className="h-5 w-5 text-fd-primary" />
              Navigation & Container Structure
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Breadcrumbs & Separator
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                <Breadcrumbs>
                  <BreadcrumbItem>Home</BreadcrumbItem>
                  <BreadcrumbItem>Products</BreadcrumbItem>
                  <BreadcrumbItem>Analytics</BreadcrumbItem>
                  <BreadcrumbItem isCurrent>Theme Settings</BreadcrumbItem>
                </Breadcrumbs>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-fd-muted-foreground">
                    Active Breadcrumb Path
                  </span>
                  <Badge variant="primary">Production Ready</Badge>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-sm font-bold text-fd-foreground">
                  Tabs Container
                </h3>
              </CardHeader>
              <CardBody className="flex flex-col gap-4">
                <Tabs
                  selectedKey={selectedTab}
                  onSelectionChange={(k) => setSelectedTab(k as string)}
                >
                  <TabList aria-label="Settings navigation">
                    <Tab id="overview">Overview</Tab>
                    <Tab id="billing">Billing</Tab>
                    <Tab id="integrations">Integrations</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel
                      id="overview"
                      className="pt-3 text-xs text-fd-muted-foreground"
                    >
                      Overview metrics and performance telemetry for your active
                      account.
                    </TabPanel>
                    <TabPanel
                      id="billing"
                      className="pt-3 text-xs text-fd-muted-foreground"
                    >
                      Manage billing contacts, invoices, and credit card
                      payments.
                    </TabPanel>
                    <TabPanel
                      id="integrations"
                      className="pt-3 text-xs text-fd-muted-foreground"
                    >
                      Connect GitHub, Webhooks, Slack, and third-party
                      observability providers.
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </CardBody>
            </Card>
          </div>
        </section>
      </div>

      {/* Interactive Modal Dialog */}
      <ModalOverlay
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      >
        <Modal
          size="md"
          className="w-full max-w-md bg-fd-card rounded-2xl border border-fd-border shadow-2xl overflow-hidden"
        >
          <ModalDialog>
            <ModalHeader className="px-5 py-4 border-b border-fd-border text-lg font-bold">
              Create Deployment Project
            </ModalHeader>
            <ModalBody className="p-5 flex flex-col gap-4 text-sm">
              <TextField
                label="Project Name"
                placeholder="my-awesome-app"
                defaultValue="moul-analytics"
              />
              <Select label="Framework Preset" defaultSelectedKey="vite">
                <SelectItem id="vite">Vite + React 19</SelectItem>
                <SelectItem id="waku">Waku RSC</SelectItem>
                <SelectItem id="next">Next.js App Router</SelectItem>
              </Select>
              <p className="text-xs text-fd-muted-foreground">
                Your environment variables will automatically be provisioned in
                edge runtime clusters.
              </p>
            </ModalBody>
            <ModalFooter className="px-5 py-4 border-t border-fd-border flex justify-end gap-2">
              <Button variant="outline" onPress={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onPress={() => setIsModalOpen(false)}>
                Confirm & Deploy
              </Button>
            </ModalFooter>
          </ModalDialog>
        </Modal>
      </ModalOverlay>

      {/* Interactive Alert Confirmation Dialog */}
      <ModalOverlay
        isOpen={isAlertOpen}
        onOpenChange={setIsAlertOpen}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      >
        <Modal
          size="sm"
          className="w-full max-w-sm bg-fd-card rounded-2xl border border-fd-border shadow-2xl overflow-hidden"
        >
          <AlertDialog>
            <AlertDialogHeader className="px-5 py-4 border-b border-fd-border text-lg font-bold text-red-500">
              Delete Cluster Instance?
            </AlertDialogHeader>
            <AlertDialogBody className="p-5 text-sm text-fd-muted-foreground">
              This action cannot be undone. All active cache storage and
              persistent volumes will be deleted immediately.
            </AlertDialogBody>
            <AlertDialogFooter className="px-5 py-4 border-t border-fd-border flex justify-end gap-2">
              <Button variant="outline" onPress={() => setIsAlertOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onPress={() => setIsAlertOpen(false)}>
                Yes, Delete Instance
              </Button>
            </AlertDialogFooter>
          </AlertDialog>
        </Modal>
      </ModalOverlay>

      {/* Export CSS Config Modal */}
      <ModalOverlay
        isOpen={isCssModalOpen}
        onOpenChange={setIsCssModalOpen}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
      >
        <Modal
          size="md"
          className="w-full max-w-md bg-fd-card rounded-2xl border border-fd-border shadow-2xl overflow-hidden"
        >
          <ModalDialog>
            <ModalHeader className="px-5 py-4 border-b border-fd-border text-lg font-bold">
              Export Production CSS
            </ModalHeader>
            <ModalBody className="p-5 flex flex-col gap-4 text-sm">
              <p className="text-xs text-fd-muted-foreground">
                Paste this into your global stylesheet (e.g.{' '}
                <code className="font-mono bg-fd-muted px-1 py-0.5 rounded-sm">
                  globals.css
                </code>
                ) to reproduce this exact theme in your application:
              </p>
              <div className="relative font-mono text-xs bg-zinc-950 text-zinc-200 p-4 rounded-xl border border-zinc-800 shadow-inner group">
                <pre className="overflow-x-auto whitespace-pre">
                  {cssConfig}
                </pre>
                <button
                  type="button"
                  onClick={handleCopyCss}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Copy CSS"
                >
                  {copiedCss ? (
                    <Check className="h-4 w-4 text-green-500 stroke-[2.5]" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </ModalBody>
            <ModalFooter className="px-5 py-4 border-t border-fd-border flex justify-end gap-2">
              <Button
                variant="outline"
                onPress={() => setIsCssModalOpen(false)}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalDialog>
        </Modal>
      </ModalOverlay>
    </div>
  )
}
