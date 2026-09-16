import * as stylex from '@stylexjs/stylex'
import type React from 'react'
import { useState } from 'react'
import { useDragAndDrop } from 'react-aria-components'
import {
  Autocomplete,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopover,
  AutocompleteSection,
  Calendar,
  Checkbox,
  CheckboxGroup,
  ComboBox,
  ComboBoxItem,
  ComboBoxSection,
  DateField,
  DatePicker,
  DateRangePicker,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Kbd,
  ListBox,
  ListBoxItem,
  ListBoxSection,
  Radio,
  RadioGroup,
  SearchField,
  Select,
  SelectItem,
  Slider,
  Switch,
  Tag,
  TagGroup,
  Text,
  TextArea,
  TextField,
} from '../../index'
import { tokens } from '../../tokens/tokens.stylex'

const styles = stylex.create({
  card: {
    backgroundColor: tokens.colorBgGlass,
    borderColor: tokens.colorBorderSubtle,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: tokens.radiusLg,
    padding: tokens.spacing8,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: tokens.shadowSm,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing7,
    boxSizing: 'border-box',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing4,
    width: '100%',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFgSubtle,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorderSubtle,
    paddingBottom: tokens.spacing2,
    margin: 0,
  },
  gridTwoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacing5,
    width: '100%',
  },
  autocompleteList: {
    maxHeight: '220px',
  },
  tagGroupMargin: {
    marginTop: tokens.spacing2,
  },
  listboxDemo: {
    maxHeight: '260px',
    width: '100%',
  },
  demoColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing2,
  },
  demoLabel: {
    fontSize: tokens.fontSizeSm,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorFg,
  },
  demoMeta: {
    fontSize: tokens.fontSizeXs,
    color: tokens.colorFgSubtle,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing1,
  },
  demoHighlight: {
    color: tokens.colorPrimary700,
    backgroundColor: tokens.colorPrimary50,
    fontWeight: tokens.fontWeightSemibold,
    paddingBlock: '1px',
    paddingInline: tokens.spacing2,
    borderRadius: tokens.radiusSm,
  },
  emptyStateContainer: {
    padding: tokens.spacing1,
  },
  emptyStateAction: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBlock: tokens.spacing2,
    paddingInline: tokens.spacing3,
    borderRadius: tokens.radiusSm,
    backgroundColor: {
      default: 'transparent',
      ':hover': tokens.colorBgSubtle,
    },
    borderWidth: 0,
    color: tokens.colorFg,
    fontSize: tokens.fontSizeSm,
    fontFamily: tokens.fontFamilyBase,
    cursor: 'pointer',
    outline: 'none',
    boxSizing: 'border-box',
    transitionProperty: 'background-color, color',
    transitionDuration: '0.12s',
    transitionTimingFunction: 'ease-in-out',
    textAlign: 'start',
  },
  emptyActionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  emptyActionIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: tokens.radiusFull,
    backgroundColor: tokens.colorPrimary50,
    color: tokens.colorPrimary700,
    fontSize: tokens.fontSizeXs,
    fontWeight: tokens.fontWeightBold,
    flexShrink: 0,
  },
  emptyActionHint: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacing1,
    fontSize: tokens.fontSizeXs,
    color: tokens.colorFgSubtle,
    flexShrink: 0,
  },
})

export const FormsSection: React.FC = () => {
  const [sliderValue, setSliderValue] = useState(42)
  const [isSwitchActive, setIsSwitchActive] = useState(true)
  const [otpValue, setOtpValue] = useState('9421')
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [selectedCommand, setSelectedCommand] = useState<any>(null)
  const [selectedLang, setSelectedLang] = useState<any>(null)
  const [creatableOpen, setCreatableOpen] = useState(false)
  const [creatableQuery, setCreatableQuery] = useState('')
  const [selectedFramework, setSelectedFramework] = useState<string | null>(
    null,
  )
  const [frameworks, setFrameworks] = useState([
    { id: 'react', name: 'React', description: 'Component-based UI library' },
    { id: 'vue', name: 'Vue', description: 'Progressive JavaScript framework' },
    {
      id: 'svelte',
      name: 'Svelte',
      description: 'Cybernetically enhanced web apps',
    },
    {
      id: 'solid',
      name: 'Solid',
      description: 'Simple and performant reactivity',
    },
    {
      id: 'angular',
      name: 'Angular',
      description: 'Full-featured enterprise platform',
    },
  ])

  // ListBox demo state
  const [listBoxRole, setListBoxRole] = useState<any>(new Set(['developer']))
  const [listBoxTelemetry, setListBoxTelemetry] = useState<any>(
    new Set(['cpu', 'error-traces']),
  )
  const [pipelineSteps, setPipelineSteps] = useState([
    { id: 'lint', name: 'Lint & Typecheck (Biome + TSC)' },
    { id: 'test', name: 'Unit Tests (Vitest + JSDOM)' },
    { id: 'build', name: 'Container Build & StyleX Extract' },
    { id: 'deploy', name: 'Zero-Downtime Blue/Green Deploy' },
  ])
  const { dragAndDropHooks: listboxDndHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => {
        const step = pipelineSteps.find((s) => s.id === key)
        return { 'text/plain': step?.name ?? String(key) }
      }),
    onReorder(e) {
      if (e.target.dropPosition === 'before') {
        const key = e.target.key
        const moving = pipelineSteps.filter((s) => e.keys.has(s.id))
        const remaining = pipelineSteps.filter((s) => !e.keys.has(s.id))
        const idx = remaining.findIndex((s) => s.id === key)
        const updated = [...remaining]
        updated.splice(idx, 0, ...moving)
        setPipelineSteps(updated)
      } else if (e.target.dropPosition === 'after') {
        const key = e.target.key
        const moving = pipelineSteps.filter((s) => e.keys.has(s.id))
        const remaining = pipelineSteps.filter((s) => !e.keys.has(s.id))
        const idx = remaining.findIndex((s) => s.id === key)
        const updated = [...remaining]
        updated.splice(idx + 1, 0, ...moving)
        setPipelineSteps(updated)
      }
    },
  })

  const trimmedCreatable = creatableQuery.trim()
  const matchingFrameworks = frameworks.filter((f) =>
    f.name.toLowerCase().includes(trimmedCreatable.toLowerCase()),
  )
  const hasNoMatches =
    trimmedCreatable.length > 0 && matchingFrameworks.length === 0

  const handleCreateFramework = (name: string) => {
    const clean = name.trim()
    if (!clean) return
    const id = clean.toLowerCase().replace(/\s+/g, '-')
    const exists = frameworks.find(
      (f) => f.id === id || f.name.toLowerCase() === clean.toLowerCase(),
    )
    if (!exists) {
      const created = {
        id,
        name: clean,
        description: 'User-created framework',
      }
      setFrameworks((prev) => [...prev, created])
      setSelectedFramework(id)
    } else {
      setSelectedFramework(exists.id)
    }
    setCreatableQuery('')
    setCreatableOpen(false)
  }

  const activeFramework = frameworks.find((f) => f.id === selectedFramework)

  const [comboboxItems, setComboboxItems] = useState([
    { id: 'prod', name: 'production' },
    { id: 'staging', name: 'staging' },
    { id: 'dev', name: 'development' },
    { id: 'preview', name: 'preview-pr-42' },
  ])
  const [comboboxInput, setComboboxInput] = useState('')
  const [lastComboboxAction, setLastComboboxAction] = useState<string | null>(
    null,
  )
  const [lastDispatcherAction, setLastDispatcherAction] = useState<
    string | null
  >(null)

  const isExistingEnv = comboboxItems.some(
    (item) => item.name.toLowerCase() === comboboxInput.trim().toLowerCase(),
  )

  const handleCreateEnv = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const id = trimmed.toLowerCase().replace(/\s+/g, '-')
    setComboboxItems((prev) => [...prev, { id, name: trimmed }])
    setLastComboboxAction(`Created new environment: "${trimmed}"`)
    setComboboxInput('')
  }

  return (
    <div {...stylex.props(styles.card)}>
      {/* Text & Search Inputs */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Text & Search Inputs</h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          <TextField
            label="Email Address"
            placeholder="phearak@moul.dev"
            description="We'll never share your email with third parties."
          />
          <TextField
            label="API Secret Key"
            type="password"
            placeholder="••••••••••••••••"
          />
          <SearchField
            label="Search Documentation"
            placeholder="Search components, recipes..."
          />
          <TextArea
            label="Project Description"
            placeholder="Write a brief overview of your deployment configuration..."
            rows={3}
          />
        </div>
      </section>

      {/* Select & ComboBox */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Select & ComboBox Dropdowns
        </h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          <Select label="Deployment Region" defaultSelectedKey="us-east">
            <SelectItem id="us-east">US East (N. Virginia)</SelectItem>
            <SelectItem id="us-west">US West (Oregon)</SelectItem>
            <SelectItem id="eu-central">EU Central (Frankfurt)</SelectItem>
            <SelectItem id="ap-southeast">AP Southeast (Singapore)</SelectItem>
          </Select>

          <ComboBox
            label="Compute Architecture (Standard)"
            defaultSelectedKey="arm64"
          >
            <ComboBoxItem id="arm64">
              ARM64 (Apple Silicon / Graviton)
            </ComboBoxItem>
            <ComboBoxItem id="x86_64">x86_64 (Intel / AMD)</ComboBoxItem>
            <ComboBoxItem id="wasm">Wasm Edge Worker</ComboBoxItem>
          </ComboBox>

          <div {...stylex.props(styles.demoColumn)}>
            <ComboBox
              label="Target Environment (Creatable via onAction)"
              placeholder="Select or type new environment..."
              allowsEmptyCollection
              inputValue={comboboxInput}
              onInputChange={setComboboxInput}
              onAction={(key) => {
                const selected = comboboxItems.find((item) => item.id === key)
                if (selected) {
                  setLastComboboxAction(`Selected: ${selected.name} (${key})`)
                }
              }}
            >
              {comboboxInput.trim().length > 0 && !isExistingEnv && (
                <ComboBoxItem
                  id="create-env"
                  onAction={() => handleCreateEnv(comboboxInput)}
                >
                  + Create "{comboboxInput.trim()}"
                </ComboBoxItem>
              )}
              {comboboxItems.map((item) => (
                <ComboBoxItem key={item.id} id={item.id}>
                  {item.name}
                </ComboBoxItem>
              ))}
            </ComboBox>
            {lastComboboxAction && (
              <span {...stylex.props(styles.demoMeta)}>
                Last action:{' '}
                <code {...stylex.props(styles.demoHighlight)}>
                  {lastComboboxAction}
                </code>
              </span>
            )}
          </div>

          <div {...stylex.props(styles.demoColumn)}>
            <ComboBox
              label="CLI Action Runner (Sections & onAction)"
              placeholder="Select quick action or tool..."
              onAction={(key) => {
                setLastDispatcherAction(`Executed: ${String(key)}`)
              }}
            >
              <ComboBoxSection title="Git Operations">
                <ComboBoxItem id="git-pull">git pull --rebase</ComboBoxItem>
                <ComboBoxItem id="git-push">git push origin main</ComboBoxItem>
                <ComboBoxItem id="git-stash">git stash pop</ComboBoxItem>
              </ComboBoxSection>
              <ComboBoxSection title="Package Scripts">
                <ComboBoxItem id="bun-dev">bun run dev</ComboBoxItem>
                <ComboBoxItem id="bun-build">bun run build</ComboBoxItem>
                <ComboBoxItem id="bun-test">bun run test</ComboBoxItem>
              </ComboBoxSection>
            </ComboBox>
            {lastDispatcherAction && (
              <span {...stylex.props(styles.demoMeta)}>
                Last action:{' '}
                <code {...stylex.props(styles.demoHighlight)}>
                  {lastDispatcherAction}
                </code>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Autocomplete & Collection Filtering */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Autocomplete & Collection Filtering
        </h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          {/* 1. Command Suggestions */}
          <div {...stylex.props(styles.demoColumn)}>
            <span {...stylex.props(styles.demoLabel)}>
              Command Suggestions (Rich Items & Shortcuts)
            </span>
            <Autocomplete>
              <SearchField
                aria-label="Filter commands"
                placeholder="Search commands or shortcuts..."
              />
              <AutocompleteList
                aria-label="Available commands"
                style={styles.autocompleteList}
                selectionMode="single"
                selectedKeys={selectedCommand ? [selectedCommand] : []}
                onSelectionChange={(keys) => {
                  const [first] = Array.from(keys)
                  setSelectedCommand(first)
                }}
              >
                <AutocompleteSection title="Projects">
                  <AutocompleteItem
                    id="new-proj"
                    description="Scaffold a new Next.js or Vite project"
                    shortcut="⌘N"
                  >
                    Create New Project
                  </AutocompleteItem>
                  <AutocompleteItem
                    id="clone-repo"
                    description="Clone from GitHub or GitLab"
                    shortcut="⌘O"
                  >
                    Clone Repository
                  </AutocompleteItem>
                </AutocompleteSection>
                <AutocompleteSection title="Preferences">
                  <AutocompleteItem
                    id="theme"
                    description="Switch between light and dark mode"
                    shortcut="⌘T"
                  >
                    Toggle Theme
                  </AutocompleteItem>
                  <AutocompleteItem
                    id="settings"
                    description="Manage workspace and user configurations"
                    shortcut="⌘,"
                  >
                    Open Settings
                  </AutocompleteItem>
                </AutocompleteSection>
              </AutocompleteList>
            </Autocomplete>
            {selectedCommand && (
              <span {...stylex.props(styles.demoMeta)}>
                Selected:{' '}
                <span {...stylex.props(styles.demoHighlight)}>
                  {String(selectedCommand)}
                </span>
              </span>
            )}
          </div>

          {/* 2. Floating Dropdown with Popover */}
          <div {...stylex.props(styles.demoColumn)}>
            <span {...stylex.props(styles.demoLabel)}>
              Floating Dropdown with Popover
            </span>
            <Autocomplete>
              <SearchField
                aria-label="Filter languages"
                placeholder="Search programming languages..."
                onFocus={() => setPopoverOpen(true)}
              />
              <AutocompletePopover
                isOpen={popoverOpen}
                onOpenChange={setPopoverOpen}
                isNonModal
              >
                <AutocompleteList
                  aria-label="Languages"
                  selectionMode="single"
                  selectedKeys={selectedLang ? [selectedLang] : []}
                  onSelectionChange={(keys) => {
                    const [first] = Array.from(keys)
                    setSelectedLang(first)
                    setPopoverOpen(false)
                  }}
                  variant="borderless"
                >
                  <AutocompleteItem
                    id="ts"
                    description="Typed JavaScript superset"
                  >
                    TypeScript
                  </AutocompleteItem>
                  <AutocompleteItem
                    id="js"
                    description="Standard web scripting"
                  >
                    JavaScript
                  </AutocompleteItem>
                  <AutocompleteItem
                    id="rust"
                    description="High performance systems language"
                  >
                    Rust
                  </AutocompleteItem>
                  <AutocompleteItem
                    id="go"
                    description="Simplicity and concurrency"
                  >
                    Go
                  </AutocompleteItem>
                  <AutocompleteItem
                    id="python"
                    description="Data science and automation"
                  >
                    Python
                  </AutocompleteItem>
                </AutocompleteList>
              </AutocompletePopover>
            </Autocomplete>
            {selectedLang && (
              <span {...stylex.props(styles.demoMeta)}>
                Selected:{' '}
                <span {...stylex.props(styles.demoHighlight)}>
                  {String(selectedLang)}
                </span>
              </span>
            )}
          </div>

          {/* 3. TagGroup Dynamic Filtering */}
          <div {...stylex.props(styles.demoColumn)}>
            <span {...stylex.props(styles.demoLabel)}>
              TagGroup Dynamic Filtering
            </span>
            <Autocomplete>
              <SearchField
                aria-label="Filter skills"
                placeholder="Filter technology tags..."
              />
              <TagGroup
                aria-label="Technology skills"
                selectionMode="multiple"
                style={styles.tagGroupMargin}
              >
                <Tag id="react">React</Tag>
                <Tag id="typescript">TypeScript</Tag>
                <Tag id="stylex">StyleX</Tag>
                <Tag id="react-aria">React Aria</Tag>
                <Tag id="vite">Vite</Tag>
                <Tag id="bun">Bun</Tag>
                <Tag id="tailwind">Tailwind</Tag>
                <Tag id="nextjs">Next.js</Tag>
              </TagGroup>
            </Autocomplete>
          </div>

          {/* 4. Creatable Floating Dropdown with Popover */}
          <div {...stylex.props(styles.demoColumn)}>
            <span {...stylex.props(styles.demoLabel)}>
              Creatable with Popover (Empty State & Return Hint)
            </span>
            <Autocomplete>
              <SearchField
                aria-label="Filter or create framework"
                placeholder="Search or create framework..."
                value={creatableQuery}
                onChange={(val) => {
                  setCreatableQuery(val)
                  if (!creatableOpen) setCreatableOpen(true)
                }}
                onFocus={() => setCreatableOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && hasNoMatches) {
                    e.preventDefault()
                    handleCreateFramework(creatableQuery)
                  }
                }}
              />
              <AutocompletePopover
                isOpen={creatableOpen}
                onOpenChange={setCreatableOpen}
                isNonModal
              >
                <AutocompleteList
                  aria-label="Frameworks"
                  selectionMode="single"
                  selectedKeys={selectedFramework ? [selectedFramework] : []}
                  onSelectionChange={(keys) => {
                    const [first] = Array.from(keys)
                    if (first) setSelectedFramework(String(first))
                    setCreatableOpen(false)
                  }}
                  variant="borderless"
                  renderEmptyState={() => (
                    <div {...stylex.props(styles.emptyStateContainer)}>
                      <button
                        type="button"
                        onClick={() => handleCreateFramework(creatableQuery)}
                        {...stylex.props(styles.emptyStateAction)}
                      >
                        <span {...stylex.props(styles.emptyActionLabel)}>
                          <span {...stylex.props(styles.emptyActionIcon)}>
                            +
                          </span>
                          <span>
                            Create{' '}
                            <strong>&ldquo;{trimmedCreatable}&rdquo;</strong>
                          </span>
                        </span>
                        <span {...stylex.props(styles.emptyActionHint)}>
                          <span>Press</span>
                          <Kbd>↵</Kbd>
                        </span>
                      </button>
                    </div>
                  )}
                >
                  {frameworks.map((fw) => (
                    <AutocompleteItem
                      key={fw.id}
                      id={fw.id}
                      description={fw.description}
                    >
                      {fw.name}
                    </AutocompleteItem>
                  ))}
                </AutocompleteList>
              </AutocompletePopover>
            </Autocomplete>
            {activeFramework && (
              <span {...stylex.props(styles.demoMeta)}>
                Selected:{' '}
                <span {...stylex.props(styles.demoHighlight)}>
                  {activeFramework.name}
                </span>
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ListBox Collection Suite */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          ListBox Collection & Option Selection
        </h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          {/* 1. Single Selection with Checkmarks & Descriptions */}
          <div {...stylex.props(styles.demoColumn)}>
            <span {...stylex.props(styles.demoLabel)}>
              Single Selection with Checkmarks & Descriptions
            </span>
            <ListBox
              aria-label="Cluster Access Role"
              selectionMode="single"
              selectedKeys={listBoxRole}
              onSelectionChange={setListBoxRole}
              style={styles.listboxDemo}
            >
              <ListBoxItem
                id="admin"
                label="Administrator"
                description="Unrestricted cluster access & key rotation"
                showCheckmark
              />
              <ListBoxItem
                id="developer"
                label="Developer"
                description="Read and write staging & development workloads"
                showCheckmark
              />
              <ListBoxItem
                id="viewer"
                label="Viewer"
                description="Read-only access to runtime dashboards and metrics"
                showCheckmark
              />
              <ListBoxItem
                id="billing"
                label="Billing Manager"
                description="Manage payment methods and compute quotas"
                showCheckmark
                isDisabled
              />
            </ListBox>
            <span {...stylex.props(styles.demoMeta)}>
              Selected role:{' '}
              <code {...stylex.props(styles.demoHighlight)}>
                {Array.from(listBoxRole).join(', ') || 'None'}
              </code>
            </span>
          </div>

          {/* 2. Multi-Selection with Sticky Section Headers */}
          <div {...stylex.props(styles.demoColumn)}>
            <span {...stylex.props(styles.demoLabel)}>
              Multi-Selection with Sticky Headers
            </span>
            <ListBox
              aria-label="Service Telemetry"
              selectionMode="multiple"
              selectedKeys={listBoxTelemetry}
              onSelectionChange={setListBoxTelemetry}
              style={styles.listboxDemo}
            >
              <ListBoxSection id="metrics" title="System Metrics">
                <ListBoxItem
                  id="cpu"
                  label="CPU Utilization"
                  description="Core load and throttling rates"
                  showCheckmark
                />
                <ListBoxItem
                  id="memory"
                  label="Memory Footprint"
                  description="Resident RSS and slab allocation"
                  showCheckmark
                />
                <ListBoxItem
                  id="io"
                  label="Disk & Network I/O"
                  description="Bandwidth saturation and packet queue"
                  showCheckmark
                />
              </ListBoxSection>
              <ListBoxSection id="logs" title="Log Streaming">
                <ListBoxItem
                  id="access-logs"
                  label="HTTP Access Logs"
                  description="Incoming request headers and status codes"
                  showCheckmark
                />
                <ListBoxItem
                  id="error-traces"
                  label="Error Stack Traces"
                  description="Unhandled exceptions and fatal signals"
                  showCheckmark
                />
                <ListBoxItem
                  id="audit-trail"
                  label="Security Audit Trail"
                  description="Authentication events and privilege escalations"
                  showCheckmark
                />
              </ListBoxSection>
            </ListBox>
            <span {...stylex.props(styles.demoMeta)}>
              Selected telemetry streams:{' '}
              <code {...stylex.props(styles.demoHighlight)}>
                {Array.from(listBoxTelemetry).join(', ') || 'None'}
              </code>
            </span>
          </div>

          {/* 3. Drag & Drop Pipeline Reordering */}
          <div {...stylex.props(styles.demoColumn)}>
            <span {...stylex.props(styles.demoLabel)}>
              Drag & Drop Pipeline Reordering (useDragAndDrop)
            </span>
            <ListBox
              aria-label="CI/CD Pipeline Stages"
              selectionMode="single"
              dragAndDropHooks={listboxDndHooks}
              items={pipelineSteps}
              style={styles.listboxDemo}
            >
              {(item) => (
                <ListBoxItem id={item.id} textValue={item.name}>
                  <Text slot="label">{item.name}</Text>
                </ListBoxItem>
              )}
            </ListBox>
            <span {...stylex.props(styles.demoMeta)}>
              Order: {pipelineSteps.map((s) => s.id).join(' → ')}
            </span>
          </div>

          {/* 4. Grid Layout (2-Column Options) */}
          <div {...stylex.props(styles.demoColumn)}>
            <span {...stylex.props(styles.demoLabel)}>
              Grid Layout (2-Column Options)
            </span>
            <ListBox
              aria-label="Compute Instance Type"
              selectionMode="single"
              layout="grid"
              defaultSelectedKeys={['c6g-xlarge']}
              style={styles.listboxDemo}
            >
              <ListBoxItem
                id="t4g-nano"
                label="t4g.nano"
                description="0.5 GB RAM"
              />
              <ListBoxItem
                id="t4g-micro"
                label="t4g.micro"
                description="1 GB RAM"
              />
              <ListBoxItem
                id="t4g-small"
                label="t4g.small"
                description="2 GB RAM"
              />
              <ListBoxItem
                id="c6g-medium"
                label="c6g.med"
                description="4 GB RAM"
              />
              <ListBoxItem
                id="c6g-large"
                label="c6g.lrg"
                description="8 GB RAM"
              />
              <ListBoxItem
                id="c6g-xlarge"
                label="c6g.xlarge"
                description="16 GB RAM"
              />
            </ListBox>
          </div>
        </div>
      </section>

      {/* Checkboxes, Radios, Switches */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Toggles, Checkboxes & Radios
        </h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          <CheckboxGroup label="Notifications" defaultValue={['email', 'sms']}>
            <Checkbox value="email">Email Alerts</Checkbox>
            <Checkbox value="sms">SMS Notifications</Checkbox>
            <Checkbox value="push">Push Webhooks</Checkbox>
          </CheckboxGroup>

          <RadioGroup label="Billing Plan" defaultValue="pro">
            <Radio value="starter">Starter ($0/mo)</Radio>
            <Radio value="pro">Pro ($29/mo)</Radio>
            <Radio value="enterprise">Enterprise (Custom)</Radio>
          </RadioGroup>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Switch isSelected={isSwitchActive} onChange={setIsSwitchActive}>
            Automatic Scaling: {isSwitchActive ? 'Active' : 'Disabled'}
          </Switch>
          <Switch defaultSelected isDisabled>
            Maintenance Mode (Locked)
          </Switch>
        </div>
      </section>

      {/* Sliders & One-Time Passwords */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Sliders & OTP Verification
        </h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <Slider
              label="Bandwidth Allocation"
              value={sliderValue}
              onChange={(val) => setSliderValue(val as number)}
              minValue={0}
              maxValue={100}
            />
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--colorFgSubtle, #94a3b8)',
              }}
            >
              Current Limit: <strong>{sliderValue} GB/s</strong>
            </span>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--colorFg, #f8fafc)',
              }}
            >
              Two-Factor Authenticator Code (InputOTP)
            </span>
            <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>
      </section>

      {/* Date & Calendars */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Date & Calendar Pickers</h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <DateField label="Select Date Field" />
            <DatePicker label="Audit Date" />
            <DateRangePicker label="Billing Cycle Range" />
          </div>
          <div>
            <Calendar aria-label="Calendar Showcase" />
          </div>
        </div>
      </section>
    </div>
  )
}
