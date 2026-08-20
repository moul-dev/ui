import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'
import { DialogTrigger } from 'react-aria-components'
import { Alert } from './components/Alert'
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
} from './components/AlertDialog'
import { Button } from './components/Button'
import { Card, CardBody, CardFooter, CardHeader } from './components/Card'
import {
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
} from './components/Drawer'
import { Logs, SERVER_LOGS } from './components/LogsViewer'
import { Modal, ModalOverlay } from './components/Modal'
import {
  Sidebar,
  SidebarAside,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarMain,
} from './components/Sidebar'
import { ToggleButton } from './components/ToggleButton'
import { ToggleButtonGroup } from './components/ToggleButtonGroup'
import { Typography } from './components/Typography'

// ── Icons ────────────────────────────────────────────────────────────

const HomeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
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

const RadioIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="2" />
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
  </svg>
)

const ArtistIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const AlbumIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
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

const SongIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)

const StoreIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
)

const DeviceIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
)

const PlaylistIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)

const SettingsIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="18"
    height="18"
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

// ── StyleX Styles ───────────────────────────────────────────────────

const styles = stylex.create({
  mainContent: {
    flex: 1,
    paddingTop: '12px',
    paddingBottom: '12px',
    paddingRight: '12px',
    paddingLeft: '12px',
    overflowY: 'auto',
    height: '100%',
    backgroundColor: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    boxSizing: 'border-box',
  },
  logo: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#fff',
    flexShrink: 0,
  },
  logoText: {
    fontSize: '18px',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#a855f7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '14px',
    flexShrink: 0,
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: '0.8125rem',
    overflow: 'hidden',
  },
  profileName: {
    fontWeight: 600,
    color: '#f8fafc',
  },
  profileEmail: {
    color: '#94a3b8',
    fontSize: '0.75rem',
  },
  controlsCard: {
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '24px',
    padding: '24px',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    maxWidth: '600px',
    width: '100%',
    marginBottom: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  controlsTitle: {
    margin: 0,
    fontSize: '1rem',
  },
  controlsRow: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '12px',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '1.1rem',
    color: '#94a3b8',
    fontWeight: 400,
  },
  card: {
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '24px',
    padding: '40px',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    maxWidth: '600px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  wideCard: {
    background: 'rgba(30, 41, 59, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '24px',
    padding: '32px',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    maxWidth: '1000px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    marginTop: '24px',
    marginBottom: '48px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '8px',
  },
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  counterText: {
    fontSize: '1rem',
    color: '#cbd5e1',
    fontWeight: 500,
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  },
  bulletList: {
    margin: 0,
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '0.875rem',
    color: '#94a3b8',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    width: '100%',
    marginTop: '12px',
  },
})

// ── App Component ────────────────────────────────────────────────────

function App() {
  const [count, setCount] = useState(0)

  // Drawer interactive state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerPlacement, setDrawerPlacement] =
    useState<DrawerPlacement>('right')
  const [drawerSize, setDrawerSize] = useState<DrawerSize>('md')

  const openDrawer = (
    placement: DrawerPlacement = 'right',
    size: DrawerSize = 'md',
  ) => {
    setDrawerPlacement(placement)
    setDrawerSize(size)
    setIsDrawerOpen(true)
  }

  // Sidebar interactive states
  const [activeTab, setActiveTab] = useState('home')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [sidebarVariant, setSidebarVariant] = useState<'solid' | 'glass'>(
    'glass',
  )
  const [showToggle, setShowToggle] = useState(true)

  return (
    <Sidebar
      isCollapsed={isCollapsed}
      onCollapseChange={setIsCollapsed}
      selectedKey={activeTab}
      onSelectionChange={setActiveTab}
      variant={sidebarVariant}
      style={{ height: '100vh', width: '100vw' }}
    >
      {/* Premium Apple Music/Podcast style Sidebar Demo */}
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

        <SidebarGroup title="Library" collapsible={true} defaultExpanded={true}>
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

        <SidebarGroup title="Store" collapsible={true} defaultExpanded={false}>
          <SidebarItem id="store" icon={<StoreIcon />}>
            iTunes Store
          </SidebarItem>
        </SidebarGroup>

        <SidebarGroup title="Devices" collapsible={true} defaultExpanded={true}>
          <SidebarItem id="device" icon={<DeviceIcon />}>
            Phearak S.'s iPhone
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
          <div {...stylex.props(styles.avatar)}>P</div>
          <div {...stylex.props(styles.profileInfo)}>
            <span {...stylex.props(styles.profileName)}>Phearak S.</span>
            <span {...stylex.props(styles.profileEmail)}>phearak@moul.dev</span>
          </div>
        </SidebarFooter>
      </SidebarAside>

      {/* Main Sandbox Showcase */}
      <SidebarMain style={styles.mainContent}>
        <header {...stylex.props(styles.header)}>
          <h1 {...stylex.props(styles.title)}>Moul UI</h1>
          <p {...stylex.props(styles.subtitle)}>
            Vite + React-TS + React Aria + StyleX Components Sandbox
          </p>
        </header>

        {/* Sidebar Controls Card */}
        <section {...stylex.props(styles.controlsCard)}>
          <Typography.Heading as="h3" style={styles.controlsTitle}>
            Sidebar Interactive Controller
          </Typography.Heading>
          <div {...stylex.props(styles.controlsRow)}>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setIsCollapsed(!isCollapsed)}
            >
              Toggle Collapse ({isCollapsed ? 'Collapsed' : 'Expanded'})
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() =>
                setSidebarVariant(
                  sidebarVariant === 'glass' ? 'solid' : 'glass',
                )
              }
            >
              Toggle Style: {sidebarVariant.toUpperCase()}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onPress={() => setShowToggle(!showToggle)}
            >
              Floating Toggle Button: {showToggle ? 'Show' : 'Hide'}
            </Button>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Current Active Key: <strong>{activeTab}</strong>
          </span>
        </section>

        {/* The rest of the showcases */}
        <div {...stylex.props(styles.card)}>
          {/* Interactive Button */}
          <section {...stylex.props(styles.section)}>
            <h2 {...stylex.props(styles.sectionTitle)}>Stateful Showcase</h2>
            <div {...stylex.props(styles.buttonGroup)}>
              <Button onPress={() => setCount((c) => c + 1)}>Click Me</Button>
              <span {...stylex.props(styles.counterText)}>
                Count is: <strong>{count}</strong>
              </span>
            </div>
          </section>

          {/* Button Variants */}
          <section {...stylex.props(styles.section)}>
            <h2 {...stylex.props(styles.sectionTitle)}>Variants</h2>
            <div {...stylex.props(styles.buttonGroup)}>
              <Button variant="primary">Primary Accent</Button>
              <Button variant="secondary">Secondary Glass</Button>
            </div>
          </section>

          {/* Toggle Button Showcase */}
          <section {...stylex.props(styles.section)}>
            <h2 {...stylex.props(styles.sectionTitle)}>Toggle Buttons</h2>
            <div {...stylex.props(styles.buttonGroup)}>
              <div
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <span>Standalone (Primary):</span>
                <ToggleButton variant="primary">Toggle</ToggleButton>
                <ToggleButton variant="primary" defaultSelected>
                  Selected
                </ToggleButton>
              </div>
              <div
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <span>Standalone (Secondary):</span>
                <ToggleButton variant="secondary">Toggle</ToggleButton>
                <ToggleButton variant="secondary" defaultSelected>
                  Selected
                </ToggleButton>
              </div>
              <div
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <span>Group (Animated):</span>
                <ToggleButtonGroup animated defaultSelectedKeys={['week']}>
                  <ToggleButton id="day">Day</ToggleButton>
                  <ToggleButton id="week">Week</ToggleButton>
                  <ToggleButton id="month">Month</ToggleButton>
                </ToggleButtonGroup>
              </div>
              <div
                style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
              >
                <span>Group Secondary (Animated):</span>
                <ToggleButtonGroup animated defaultSelectedKeys={['bold']}>
                  <ToggleButton id="bold" variant="secondary">
                    Bold
                  </ToggleButton>
                  <ToggleButton id="italic" variant="secondary">
                    Italic
                  </ToggleButton>
                  <ToggleButton id="underline" variant="secondary">
                    Underline
                  </ToggleButton>
                </ToggleButtonGroup>
              </div>
            </div>
          </section>

          {/* Disabled States */}
          <section {...stylex.props(styles.section)}>
            <h2 {...stylex.props(styles.sectionTitle)}>Disabled State</h2>
            <div {...stylex.props(styles.buttonGroup)}>
              <Button variant="primary" isDisabled>
                Primary Disabled
              </Button>
              <Button variant="secondary" isDisabled>
                Secondary Disabled
              </Button>
            </div>
          </section>

          {/* Drawers & Overlays Showcase */}
          <section {...stylex.props(styles.section)}>
            <h2 {...stylex.props(styles.sectionTitle)}>Drawers & Overlays</h2>
            <div {...stylex.props(styles.buttonGroup)}>
              <Button
                variant="primary"
                onPress={() => openDrawer('right', 'md')}
              >
                Open Right Drawer (600px)
              </Button>
              <Button
                variant="secondary"
                onPress={() => openDrawer('left', 'md')}
              >
                Open Left Drawer
              </Button>
              <Button
                variant="secondary"
                onPress={() => openDrawer('bottom', 'md')}
              >
                Open Bottom Sheet
              </Button>
              <Button
                variant="secondary"
                onPress={() => openDrawer('top', 'sm')}
              >
                Open Top Drawer
              </Button>

              <DialogTrigger>
                <Button variant="outline">Delete Account Modal</Button>
                <ModalOverlay>
                  <Modal>
                    <AlertDialog>
                      {({ close }) => (
                        <>
                          <AlertDialogHeader>Delete Account</AlertDialogHeader>
                          <AlertDialogBody>
                            Are you sure you want to delete your account? This
                            action cannot be undone and all of your data will be
                            permanently removed.
                          </AlertDialogBody>
                          <AlertDialogFooter>
                            <Button variant="secondary" onPress={close}>
                              Cancel
                            </Button>
                            <Button variant="danger" onPress={close}>
                              Delete
                            </Button>
                          </AlertDialogFooter>
                        </>
                      )}
                    </AlertDialog>
                  </Modal>
                </ModalOverlay>
              </DialogTrigger>
            </div>

            <DrawerOverlay
              isOpen={isDrawerOpen}
              onOpenChange={setIsDrawerOpen}
              placement={drawerPlacement}
              size={drawerSize}
            >
              <Drawer placement={drawerPlacement} size={drawerSize}>
                <DrawerDialog>
                  <DrawerHeader>
                    <DrawerTitle>
                      {drawerPlacement.charAt(0).toUpperCase() +
                        drawerPlacement.slice(1)}{' '}
                      Drawer ({drawerSize})
                    </DrawerTitle>
                    <DrawerCloseButton />
                  </DrawerHeader>
                  <DrawerBody>
                    <p style={{ margin: '0 0 16px 0', opacity: 0.8 }}>
                      This drawer is anchored to the{' '}
                      <strong>{drawerPlacement}</strong> with a default desktop
                      size of{' '}
                      <strong>
                        {drawerSize === 'md' ? '600px' : drawerSize}
                      </strong>
                      . On small screens, it automatically adapts to 100%
                      full-width.
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                      }}
                    >
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(128, 128, 128, 0.2)',
                            background: 'rgba(128, 128, 128, 0.05)',
                          }}
                        >
                          <h4
                            style={{
                              margin: '0 0 8px 0',
                              fontSize: '14px',
                              fontWeight: 600,
                            }}
                          >
                            Section {i + 1}: Configuration Item
                          </h4>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '13px',
                              opacity: 0.7,
                            }}
                          >
                            Notice that as you scroll this body content, the top
                            header (with title and close button) and bottom
                            footer (with action buttons) remain sticky.
                          </p>
                        </div>
                      ))}
                    </div>
                  </DrawerBody>
                  <DrawerFooter>
                    <Button
                      variant="secondary"
                      onPress={() => setIsDrawerOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onPress={() => setIsDrawerOpen(false)}
                    >
                      Save Changes
                    </Button>
                  </DrawerFooter>
                </DrawerDialog>
              </Drawer>
            </DrawerOverlay>
          </section>

          {/* Alerts Showcase */}
          <section {...stylex.props(styles.section)}>
            <h2 {...stylex.props(styles.sectionTitle)}>Alerts Showcase</h2>
            <div {...stylex.props(styles.alertList)}>
              {/* Info Standard */}
              <Alert
                variant="info"
                title="New features available"
                description="Check out our latest updates including dark mode support and improved accessibility features."
              />

              {/* Info with Accent & Action */}
              <Alert
                variant="accent"
                title="Update available"
                description="A new version of the application is available. Please refresh to get the latest features and bug fixes."
                action={
                  <Button variant="primary" size="sm">
                    Refresh
                  </Button>
                }
              />

              {/* Error with Action & Bullet List */}
              <Alert
                variant="error"
                title="Unable to connect to server"
                action={
                  <Button variant="danger" size="sm">
                    Retry
                  </Button>
                }
              >
                <div style={{ marginTop: '8px' }}>
                  <p
                    style={{
                      margin: '0 0 8px 0',
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                    }}
                  >
                    We're experiencing connection issues. Please try the
                    following:
                  </p>
                  <ul {...stylex.props(styles.bulletList)}>
                    <li>Check your internet connection</li>
                    <li>Refresh the page</li>
                    <li>Clear your browser cache</li>
                  </ul>
                </div>
              </Alert>

              {/* Success with Close button */}
              <Alert
                variant="success"
                title="Profile updated successfully"
                onClose={() => alert('Close clicked')}
              />

              {/* Loading/Processing State */}
              <Alert
                variant="loading"
                title="Processing your request"
                description="Please wait while we sync your data. This may take a few moments."
              />

              {/* Warning State */}
              <Alert
                variant="warning"
                title="Scheduled maintenance"
                description="Our services will be unavailable on Sunday, March 15th from 2:00 AM to 6:00 AM UTC for scheduled maintenance."
              />
            </div>
          </section>

          {/* Cards Showcase */}
          <section {...stylex.props(styles.section)}>
            <h2 {...stylex.props(styles.sectionTitle)}>Cards Showcase</h2>
            <div {...stylex.props(styles.cardsGrid)}>
              {/* Glass Card */}
              <Card variant="glass" size="md">
                <CardHeader>Glassmorphic Card</CardHeader>
                <CardBody>
                  Features a gorgeous glassmorphic style. Perfect for modern,
                  premium designs.
                </CardBody>
                <CardFooter>
                  <Button variant="secondary" size="sm">
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm">
                    Save
                  </Button>
                </CardFooter>
              </Card>

              {/* Elevated Card */}
              <Card variant="default" size="md" divided>
                <CardHeader>Elevated Card</CardHeader>
                <CardBody>
                  Uses standard elevation with clean borders dividing header,
                  body, and footer.
                </CardBody>
                <CardFooter>
                  <Button variant="secondary" size="sm">
                    Action
                  </Button>
                </CardFooter>
              </Card>

              {/* Flat Card */}
              <Card variant="flat" size="sm">
                <CardHeader>Flat Card</CardHeader>
                <CardBody>Flat background without borders or shadows.</CardBody>
                <CardFooter>
                  <Button variant="secondary" size="sm">
                    Close
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </section>

          {/* Typography Showcase */}
          <section {...stylex.props(styles.section)}>
            <h2 {...stylex.props(styles.sectionTitle)}>Typography Showcase</h2>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: '#94a3b8',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Standard Typography Tags (as prop)
                </span>
                <Typography as="h1">Heading 1 (h1)</Typography>
                <Typography as="h2">Heading 2 (h2)</Typography>
                <Typography as="h3">Heading 3 (h3)</Typography>
                <Typography as="h4">Heading 4 (h4)</Typography>
                <Typography as="h5">Heading 5 (h5)</Typography>
                <Typography as="h6">Heading 6 (h6)</Typography>
                <Typography as="p">
                  Paragraph (p) - Standard body text.
                </Typography>
                <Typography as="span">
                  Span (span) - Inline text wrapper.
                </Typography>
                <Typography as="label">
                  Label (label) - Form label style.
                </Typography>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.8125rem',
                    color: '#94a3b8',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Semantic Exports
                </span>
                <Typography.Heading as="h1">
                  Heading 1 (Typography.Heading as="h1")
                </Typography.Heading>
                <Typography.Heading as="h3">
                  Heading 3 (Typography.Heading as="h3")
                </Typography.Heading>
                <Typography.Paragraph>
                  Paragraph (Typography.Paragraph) - Standard body text.
                </Typography.Paragraph>
                <Typography.Span>
                  Span (Typography.Span) - Inline text element.
                </Typography.Span>
                <Typography.Label>
                  Label (Typography.Label) - Form label element.
                </Typography.Label>
              </div>
            </div>
          </section>
        </div>

        {/* Logs Component Showcase */}
        <div {...stylex.props(styles.wideCard)}>
          <section {...stylex.props(styles.section)}>
            <h2 {...stylex.props(styles.sectionTitle)}>
              Logs Component Showcase (React Aria Table)
            </h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#94a3b8' }}>
              Interactive log stream viewer parsing structured server logs with
              level filtering, live search, line numbers, status code pills, and
              inspection panel.
            </p>
            <Logs
              data={SERVER_LOGS}
              title="Mould Engine Logs"
              inspectorMode="drawer"
              drawerPlacement="right"
              drawerSize="md"
              maxHeight="460px"
            />
          </section>
        </div>
      </SidebarMain>
    </Sidebar>
  )
}

export default App
