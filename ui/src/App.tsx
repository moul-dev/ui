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
import { Modal, ModalOverlay } from './components/Modal'
import { ToggleButton } from './components/ToggleButton'
import { ToggleButtonGroup } from './components/ToggleButtonGroup'

// Define StyleX styles
const styles = stylex.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
    color: '#f8fafc',
    fontFamily: "'Google Sans', 'Inter', system-ui, -apple-system, sans-serif",
    padding: '40px 20px',
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
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  cardTitle: {
    fontSize: '1.125rem',
    fontWeight: 700,
    margin: 0,
  },
  cardSubtitle: {
    fontSize: '0.8125rem',
    opacity: 0.7,
    margin: 0,
  },
  cardText: {
    fontSize: '0.875rem',
    lineHeight: '1.5',
    margin: 0,
  },
})

function App() {
  const [count, setCount] = useState(0)

  return (
    <div {...stylex.props(styles.container)}>
      <header {...stylex.props(styles.header)}>
        <h1 {...stylex.props(styles.title)}>Moul UI</h1>
        <p {...stylex.props(styles.subtitle)}>
          Vite + React-TS + React Aria + StyleX Components Sandbox
        </p>
      </header>

      <main {...stylex.props(styles.card)}>
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>Standalone (Primary):</span>
              <ToggleButton variant="primary">Toggle</ToggleButton>
              <ToggleButton variant="primary" defaultSelected>Selected</ToggleButton>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>Standalone (Secondary):</span>
              <ToggleButton variant="secondary">Toggle</ToggleButton>
              <ToggleButton variant="secondary" defaultSelected>Selected</ToggleButton>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>Group (Animated):</span>
              <ToggleButtonGroup animated defaultSelectedKeys={['week']}>
                <ToggleButton id="day">Day</ToggleButton>
                <ToggleButton id="week">Week</ToggleButton>
                <ToggleButton id="month">Month</ToggleButton>
              </ToggleButtonGroup>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>Group Secondary (Animated):</span>
              <ToggleButtonGroup animated defaultSelectedKeys={['bold']}>
                <ToggleButton id="bold" variant="secondary">Bold</ToggleButton>
                <ToggleButton id="italic" variant="secondary">Italic</ToggleButton>
                <ToggleButton id="underline" variant="secondary">Underline</ToggleButton>
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

        {/* Dialogs Showcase */}
        <section {...stylex.props(styles.section)}>
          <h2 {...stylex.props(styles.sectionTitle)}>Overlays & Dialogs</h2>
          <div {...stylex.props(styles.buttonGroup)}>
            <DialogTrigger>
              <Button variant="primary">Delete Account</Button>
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

            {/* Outline Card */}
            <Card variant="outline" size="md">
              <CardHeader>Outline Card</CardHeader>
              <CardBody>
                Features a clean outline style, ideal for dark layouts and grid
                structures.
              </CardBody>
              <CardFooter>
                <Button variant="secondary" size="sm">
                  View
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
      </main>
    </div>
  )
}

export default App
