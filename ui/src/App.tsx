import * as stylex from '@stylexjs/stylex'
import { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Button,
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteFooter,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteList,
  CommandPaletteSection,
  Kbd,
  Sidebar,
  SidebarAside,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarMain,
  SidebarUser,
  ThemeProvider,
  ToastContainer,
} from './index'
import {
  AlbumIcon,
  ArtistIcon,
  DeviceIcon,
  HomeIcon,
  MoonIcon,
  PlaylistIcon,
  RadioIcon,
  SettingsIcon,
  SongIcon,
  StoreIcon,
  SunIcon,
} from './sandbox/icons'
import { ActionsSection } from './sandbox/sections/ActionsSection'
import { BlocksSection } from './sandbox/sections/BlocksSection'
import { ChartsSection } from './sandbox/sections/ChartsSection'
import { FeedbackSection } from './sandbox/sections/FeedbackSection'
import { FormsSection } from './sandbox/sections/FormsSection'
import { LayoutSection } from './sandbox/sections/LayoutSection'
import { NavigationSection } from './sandbox/sections/NavigationSection'
import { OverlaysSection } from './sandbox/sections/OverlaysSection'
import type { SandboxCategory, SandboxCategoryId } from './sandbox/types'
import { tokens } from './tokens/tokens.stylex'

const styles = stylex.create({
  themeRoot: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: tokens.colorBg,
    color: tokens.colorFg,
    transitionProperty: 'background-color, color',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease',
    display: 'flex',
  },
  mainContent: {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    height: '100%',
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    boxSizing: 'border-box',
  },
  container: {
    maxWidth: '1100px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  logo: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: tokens.colorFg,
    color: tokens.colorBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 800,
    color: tokens.colorFg,
    letterSpacing: '-0.02em',
  },
  header: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    paddingBottom: '8px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 800,
    color: tokens.colorFg,
    margin: 0,
    letterSpacing: '-0.03em',
  },
  subtitle: {
    fontSize: '1rem',
    color: tokens.colorFgSubtle,
    fontWeight: 400,
    margin: '4px 0 0 0',
  },
  toolbar: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  categoriesNav: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    padding: '6px',
    backgroundColor: tokens.colorBgSubtle,
    borderRadius: tokens.radiusLg,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
  },
  searchBar: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '10px',
    backgroundColor: tokens.colorBgSubtle,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: tokens.colorBorderSubtle,
    color: tokens.colorFgSubtle,
    fontSize: '0.875rem',
    cursor: 'pointer',
    transition: 'all 150ms ease',
  },
})

const CATEGORIES: SandboxCategory[] = [
  {
    id: 'all',
    label: 'All Components',
    count: 59,
    description: 'Explore the complete zero-runtime design system',
  },
  {
    id: 'actions',
    label: 'Actions',
    count: 6,
    description: 'Buttons, ButtonGroups, ToggleButtons, Links, Kbds',
  },
  {
    id: 'forms',
    label: 'Forms & Inputs',
    count: 15,
    description: 'Text, Date, Select, Checkboxes, Switches, Sliders, OTP',
  },
  {
    id: 'overlays',
    label: 'Overlays',
    count: 6,
    description: 'Drawers, Modals, AlertDialogs, Popovers, Tooltips',
  },
  {
    id: 'feedback',
    label: 'Feedback',
    count: 7,
    description: 'Alerts, Badges, Progress, Skeletons, Spinners, Toasts',
  },
  {
    id: 'navigation',
    label: 'Navigation',
    count: 6,
    description: 'Tabs, Pagination, Breadcrumbs, Data Tables, Tags',
  },
  {
    id: 'layout',
    label: 'Layout',
    count: 5,
    description: 'Cards, Avatars, AvatarGroups, Typography, Separators',
  },
  {
    id: 'charts',
    label: 'Charts & Logs',
    count: 8,
    description: 'Area, Bar, Line, Doughnut, Stats, TopList, LogsViewer',
  },
  {
    id: 'blocks',
    label: 'Blocks',
    count: 2,
    description: 'Application shell navigation and responsive sidebars',
  },
]

export function App() {
  const [colorScheme, setColorScheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('moul-sandbox-color-scheme')
      if (saved === 'light' || saved === 'dark') return saved
    }
    return 'dark'
  })

  const [selectedCategory, setSelectedCategory] =
    useState<SandboxCategoryId>('all')
  const [filterQuery, setFilterQuery] = useState('')
  const [isCommandOpen, setIsCommandOpen] = useState(false)

  // Sidebar interactive states
  const [activeSidebarKey, setActiveSidebarKey] = useState('home')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isSidebarDense, setIsSidebarDense] = useState(false)
  const [sidebarVariant, setSidebarVariant] = useState<'solid' | 'glass'>(
    'glass',
  )
  const [showToggle, setShowToggle] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('moul-sandbox-color-scheme', colorScheme)
      document.documentElement.setAttribute('data-theme', colorScheme)
      document.documentElement.style.colorScheme = colorScheme
    }
  }, [colorScheme])

  const toggleTheme = () => {
    setColorScheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedCategory) || CATEGORIES[0],
    [selectedCategory],
  )

  const shouldShow = (cat: SandboxCategoryId) => {
    if (selectedCategory === 'all') return true
    return selectedCategory === cat
  }

  return (
    <ThemeProvider colorScheme={colorScheme} style={styles.themeRoot}>
      <ToastContainer />
      <Sidebar
        isCollapsed={isCollapsed}
        onCollapseChange={setIsCollapsed}
        selectedKey={activeSidebarKey}
        onSelectionChange={setActiveSidebarKey}
        variant={sidebarVariant}
        dense={isSidebarDense}
        style={{ height: '100vh', width: '100vw' }}
      >
        {/* Apple Music style Sidebar Showcase */}
        <SidebarAside showCollapseToggle={showToggle}>
          <SidebarHeader>
            <div {...stylex.props(styles.logo)}>M</div>
            <span {...stylex.props(styles.logoText)}>Moul UI</span>
          </SidebarHeader>

          <SidebarGroup title="Discover" collapsible={false}>
            <SidebarItem id="home" icon={<HomeIcon />}>
              Home
            </SidebarItem>
            <SidebarItem id="radio" icon={<RadioIcon />}>
              Radio
            </SidebarItem>
          </SidebarGroup>

          <SidebarGroup
            title="Library"
            collapsible={true}
            defaultExpanded={true}
          >
            <SidebarItem id="recent" icon={<ArtistIcon />}>
              Recently Added
            </SidebarItem>
            <SidebarItem id="artists" icon={<ArtistIcon />}>
              Artists
            </SidebarItem>
            <SidebarItem id="albums" icon={<AlbumIcon />}>
              Albums
            </SidebarItem>
            <SidebarItem id="songs" icon={<SongIcon />}>
              Songs
            </SidebarItem>
          </SidebarGroup>

          <SidebarGroup
            title="Store"
            collapsible={true}
            defaultExpanded={false}
          >
            <SidebarItem id="store" icon={<StoreIcon />}>
              iTunes Store
            </SidebarItem>
          </SidebarGroup>

          <SidebarGroup
            title="Devices"
            collapsible={true}
            defaultExpanded={true}
          >
            <SidebarItem id="device" icon={<DeviceIcon />}>
              Phearak's Device
            </SidebarItem>
          </SidebarGroup>

          <SidebarGroup title="Playlists" collapsible={false}>
            <SidebarItem id="all-playlists" icon={<PlaylistIcon />}>
              All Playlists
            </SidebarItem>
          </SidebarGroup>

          <SidebarGroup title="Settings" collapsible={false}>
            <SidebarItem id="settings" icon={<SettingsIcon />}>
              Settings
            </SidebarItem>
          </SidebarGroup>

          <SidebarDivider />

          <SidebarFooter showBorder={false}>
            <SidebarUser
              avatar={
                <Avatar
                  initials="PT"
                  size="sm"
                  shape="circle"
                  status="online"
                />
              }
              name="Phearak S."
              description="phearak@moul.dev"
            />
          </SidebarFooter>
        </SidebarAside>

        {/* Main Content Area */}
        <SidebarMain style={styles.mainContent}>
          <div {...stylex.props(styles.container)}>
            {/* Header */}
            <header {...stylex.props(styles.header)}>
              <div>
                <h1 {...stylex.props(styles.title)}>Moul UI Sandbox</h1>
                <p {...stylex.props(styles.subtitle)}>
                  {activeCategory.description} • {activeCategory.count} items
                </p>
              </div>

              <div {...stylex.props(styles.toolbar)}>
                {/* Theme Toggle Button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={toggleTheme}
                  aria-label={`Switch to ${colorScheme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {colorScheme === 'dark' ? <SunIcon /> : <MoonIcon />}
                  <span>
                    {colorScheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </Button>

                {/* Quick Navigation Command Palette Trigger */}
                <button
                  type="button"
                  onClick={() => setIsCommandOpen(true)}
                  {...stylex.props(styles.searchBar)}
                >
                  <span>Quick Navigation</span>
                  <Kbd>⌘K</Kbd>
                </button>
              </div>
            </header>

            {/* Category Filter Pills */}
            <nav
              aria-label="Component categories"
              {...stylex.props(styles.categoriesNav)}
            >
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  variant={selectedCategory === cat.id ? 'secondary' : 'ghost'}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
            </nav>

            {/* Modular Component Sections */}
            {shouldShow('blocks') && (
              <BlocksSection
                isCollapsed={isCollapsed}
                onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
                isSidebarDense={isSidebarDense}
                onToggleDense={() => setIsSidebarDense(!isSidebarDense)}
                sidebarVariant={sidebarVariant}
                onToggleVariant={() =>
                  setSidebarVariant((v) => (v === 'glass' ? 'solid' : 'glass'))
                }
                showToggle={showToggle}
                onToggleShowToggle={() => setShowToggle(!showToggle)}
                activeTab={activeSidebarKey}
              />
            )}

            {shouldShow('actions') && <ActionsSection />}
            {shouldShow('forms') && <FormsSection />}
            {shouldShow('overlays') && (
              <OverlaysSection
                onOpenCommandPalette={() => setIsCommandOpen(true)}
              />
            )}
            {shouldShow('feedback') && <FeedbackSection />}
            {shouldShow('navigation') && <NavigationSection />}
            {shouldShow('layout') && <LayoutSection />}
            {shouldShow('charts') && <ChartsSection />}
          </div>

          {/* Command Palette Modal */}
          <CommandPalette
            isOpen={isCommandOpen}
            onOpenChange={setIsCommandOpen}
          >
            <CommandPaletteInput
              placeholder="Jump to component section or command..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
            <CommandPaletteList>
              <CommandPaletteSection heading="Theme & Appearance">
                <CommandPaletteItem
                  icon={colorScheme === 'dark' ? <SunIcon /> : <MoonIcon />}
                  shortcut={['⌘', 'M']}
                  onAction={() => {
                    toggleTheme()
                    setIsCommandOpen(false)
                  }}
                >
                  Switch to {colorScheme === 'dark' ? 'Light' : 'Dark'} Mode
                </CommandPaletteItem>
                <CommandPaletteItem
                  shortcut={['⌘', 'T']}
                  onAction={() => {
                    setSidebarVariant((v) =>
                      v === 'glass' ? 'solid' : 'glass',
                    )
                    setIsCommandOpen(false)
                  }}
                >
                  Toggle Sidebar Surface ({sidebarVariant})
                </CommandPaletteItem>
                <CommandPaletteItem
                  shortcut={['⌘', 'D']}
                  onAction={() => {
                    setIsCollapsed((v) => !v)
                    setIsCommandOpen(false)
                  }}
                >
                  Toggle Sidebar Collapse
                </CommandPaletteItem>
              </CommandPaletteSection>

              <CommandPaletteSection heading="Categories">
                {CATEGORIES.map((cat) => (
                  <CommandPaletteItem
                    key={cat.id}
                    onAction={() => {
                      setSelectedCategory(cat.id)
                      setIsCommandOpen(false)
                    }}
                  >
                    View {cat.label} ({cat.count})
                  </CommandPaletteItem>
                ))}
              </CommandPaletteSection>
            </CommandPaletteList>
            <CommandPaletteEmpty>No matching items found.</CommandPaletteEmpty>
            <CommandPaletteFooter />
          </CommandPalette>
        </SidebarMain>
      </Sidebar>
    </ThemeProvider>
  )
}

export default App
