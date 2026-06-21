import * as stylex from '@stylexjs/stylex'
import { useState } from 'react'
import { Button } from './components/Button'

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
    fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
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
      </main>
    </div>
  )
}

export default App
