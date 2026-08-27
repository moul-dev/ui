import * as stylex from '@stylexjs/stylex'
import type React from 'react'
import { useState } from 'react'
import {
  Button,
  ButtonGroup,
  Kbd,
  Link,
  ToggleButton,
  ToggleButtonGroup,
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
  buttonGroup: {
    display: 'flex',
    gap: tokens.spacing4,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  counterText: {
    fontSize: tokens.fontSizeMd,
    color: tokens.colorFg,
    fontWeight: tokens.fontWeightMedium,
  },
})

export const ActionsSection: React.FC = () => {
  const [count, setCount] = useState(0)

  return (
    <div {...stylex.props(styles.card)}>
      {/* Stateful Counter */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Stateful Action</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button onPress={() => setCount((c) => c + 1)}>Click Me</Button>
          <span {...stylex.props(styles.counterText)}>
            Count is: <strong>{count}</strong>
          </span>
          <Button variant="secondary" size="sm" onPress={() => setCount(0)}>
            Reset
          </Button>
        </div>
      </section>

      {/* Button Variants */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Button Variants & Sizes</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button variant="primary" size="sm">
            Primary SM
          </Button>
          <Button variant="primary" size="md">
            Primary MD
          </Button>
          <Button variant="primary" size="lg">
            Primary LG
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>

      {/* Button Group */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Button Group</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <ButtonGroup>
            <Button variant="secondary">Left</Button>
            <Button variant="secondary">Middle</Button>
            <Button variant="secondary">Right</Button>
          </ButtonGroup>
        </div>
      </section>

      {/* Toggle Buttons */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Toggle Buttons & Groups</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--colorFgSubtle, #94a3b8)',
              }}
            >
              Standalone (Primary):
            </span>
            <ToggleButton variant="primary">Toggle</ToggleButton>
            <ToggleButton variant="primary" defaultSelected>
              Selected
            </ToggleButton>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--colorFgSubtle, #94a3b8)',
              }}
            >
              Standalone (Secondary):
            </span>
            <ToggleButton variant="secondary">Toggle</ToggleButton>
            <ToggleButton variant="secondary" defaultSelected>
              Selected
            </ToggleButton>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--colorFgSubtle, #94a3b8)',
              }}
            >
              Group (Animated):
            </span>
            <ToggleButtonGroup animated defaultSelectedKeys={['week']}>
              <ToggleButton id="day">Day</ToggleButton>
              <ToggleButton id="week">Week</ToggleButton>
              <ToggleButton id="month">Month</ToggleButton>
            </ToggleButtonGroup>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--colorFgSubtle, #94a3b8)',
              }}
            >
              Group Secondary:
            </span>
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
        <h3 {...stylex.props(styles.sectionTitle)}>Disabled States</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button variant="primary" isDisabled>
            Primary Disabled
          </Button>
          <Button variant="secondary" isDisabled>
            Secondary Disabled
          </Button>
          <Button variant="outline" isDisabled>
            Outline Disabled
          </Button>
        </div>
      </section>

      {/* Links and Kbds */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Links & Keyboard Shortcuts
        </h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Link href="#actions" variant="primary">
            Primary Link
          </Link>
          <Link href="#actions" variant="secondary">
            Secondary Link
          </Link>
          <Link href="#actions" variant="ghost">
            Ghost Link
          </Link>
          <div
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--colorFgSubtle, #94a3b8)',
              }}
            >
              Search:
            </span>
            <Kbd>⌘K</Kbd>
          </div>
          <div
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--colorFgSubtle, #94a3b8)',
              }}
            >
              Save:
            </span>
            <Kbd>⌘S</Kbd>
          </div>
        </div>
      </section>
    </div>
  )
}
