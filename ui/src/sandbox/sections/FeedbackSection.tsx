import * as stylex from '@stylexjs/stylex'
import type React from 'react'
import { useState } from 'react'
import {
  Alert,
  Badge,
  type BadgeSize,
  Button,
  EmptyState,
  ProgressBar,
  Skeleton,
  Spinner,
  useToast,
} from '../../index'
import { tokens } from '../../tokens/tokens.stylex'
import { FolderIcon, RadioIcon } from '../icons'

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
    gap: tokens.spacing3,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  alertList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing3,
    width: '100%',
  },
  bulletList: {
    margin: 0,
    paddingLeft: tokens.spacing5,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing1,
    fontSize: tokens.fontSizeSm,
    color: tokens.colorFgSubtle,
  },
})

export const FeedbackSection: React.FC = () => {
  const [badgeSize, setBadgeSize] = useState<BadgeSize>('md')
  const [progressVal, setProgressVal] = useState(65)
  const [isIndeterminateProgress, setIsIndeterminateProgress] = useState(false)
  const [skeletonShape, setSkeletonShape] = useState<
    'block' | 'text' | 'circle'
  >('block')
  const [skeletonCount, setSkeletonCount] = useState(3)
  const toast = useToast()

  return (
    <div {...stylex.props(styles.card)}>
      {/* Alerts */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Alert Banners</h3>
        <div {...stylex.props(styles.alertList)}>
          <Alert
            variant="info"
            title="New features available"
            description="Check out our latest updates including dark mode support and improved accessibility features."
          />

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
                  color: 'var(--colorFgSubtle, #94a3b8)',
                }}
              >
                We're experiencing connection issues. Please try the following:
              </p>
              <ul {...stylex.props(styles.bulletList)}>
                <li>Check your internet connection</li>
                <li>Refresh the page</li>
                <li>Clear your browser cache</li>
              </ul>
            </div>
          </Alert>

          <Alert
            variant="success"
            title="Profile updated successfully"
            onClose={() => alert('Close clicked')}
          />

          <Alert
            variant="loading"
            title="Processing your request"
            description="Please wait while we sync your data. This may take a few moments."
          />

          <Alert
            variant="warning"
            title="Scheduled maintenance"
            description="Our services will be unavailable on Sunday from 2:00 AM to 6:00 AM UTC for maintenance."
          />
        </div>
      </section>

      {/* Badges */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Status Badges</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--colorFgSubtle, #94a3b8)',
            }}
          >
            Size:
          </span>
          <Button
            size="sm"
            variant={badgeSize === 'sm' ? 'primary' : 'outline'}
            onPress={() => setBadgeSize('sm')}
          >
            SM
          </Button>
          <Button
            size="sm"
            variant={badgeSize === 'md' ? 'primary' : 'outline'}
            onPress={() => setBadgeSize('md')}
          >
            MD
          </Button>
          <Button
            size="sm"
            variant={badgeSize === 'lg' ? 'primary' : 'outline'}
            onPress={() => setBadgeSize('lg')}
          >
            LG
          </Button>
        </div>

        <div {...stylex.props(styles.buttonGroup)}>
          <Badge size={badgeSize} variant="neutral">
            Neutral
          </Badge>
          <Badge size={badgeSize} variant="primary">
            Primary
          </Badge>
          <Badge size={badgeSize} variant="success">
            Success
          </Badge>
          <Badge size={badgeSize} variant="warning">
            Warning
          </Badge>
          <Badge size={badgeSize} variant="error">
            Error
          </Badge>
        </div>

        <div {...stylex.props(styles.buttonGroup)}>
          <Badge size={badgeSize} variant="dot">
            Status Dot
          </Badge>
          <Badge size={badgeSize} variant="success" dot>
            Operational
          </Badge>
          <Badge size={badgeSize} variant="warning" dot>
            Degraded
          </Badge>
          <Badge size={badgeSize} variant="error" dot>
            Incident
          </Badge>
          <Badge size={badgeSize} variant="primary" dot>
            Deploying
          </Badge>
        </div>
      </section>

      {/* Progress Bars */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Linear Progress Bars</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            size="sm"
            variant="outline"
            onPress={() => setProgressVal((p) => Math.max(0, p - 10))}
          >
            -10%
          </Button>
          <Button
            size="sm"
            variant="outline"
            onPress={() => setProgressVal((p) => Math.min(100, p + 10))}
          >
            +10%
          </Button>
          <Button
            size="sm"
            variant={isIndeterminateProgress ? 'primary' : 'ghost'}
            onPress={() => setIsIndeterminateProgress((v) => !v)}
          >
            {isIndeterminateProgress
              ? 'Indeterminate: ON'
              : 'Toggle Indeterminate'}
          </Button>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxWidth: '600px',
          }}
        >
          <ProgressBar
            label="Primary Progress (md)"
            value={progressVal}
            isIndeterminate={isIndeterminateProgress}
            variant="primary"
            size="md"
          />
          <ProgressBar
            label="Success Accent (lg)"
            value={progressVal}
            isIndeterminate={isIndeterminateProgress}
            variant="success"
            size="lg"
          />
          <ProgressBar
            label="Warning Stage (sm)"
            value={progressVal}
            isIndeterminate={isIndeterminateProgress}
            variant="warning"
            size="sm"
          />
        </div>
      </section>

      {/* Spinners & Skeletons */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Spinners & Skeletons</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Spinner size="sm" aria-label="Small spinner" />
          <Spinner size="md" aria-label="Medium spinner" />
          <Spinner size="lg" aria-label="Large spinner" />
          <Spinner size="xl" aria-label="Extra large spinner" />
        </div>

        <div {...stylex.props(styles.buttonGroup)}>
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--colorFgSubtle, #94a3b8)',
            }}
          >
            Shape:
          </span>
          <Button
            size="sm"
            variant={skeletonShape === 'block' ? 'primary' : 'outline'}
            onPress={() => setSkeletonShape('block')}
          >
            Block
          </Button>
          <Button
            size="sm"
            variant={skeletonShape === 'text' ? 'primary' : 'outline'}
            onPress={() => setSkeletonShape('text')}
          >
            Text
          </Button>
          <Button
            size="sm"
            variant={skeletonShape === 'circle' ? 'primary' : 'outline'}
            onPress={() => setSkeletonShape('circle')}
          >
            Circle
          </Button>
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--colorFgSubtle, #94a3b8)',
              marginLeft: '12px',
            }}
          >
            Count:
          </span>
          <Button
            size="sm"
            variant={skeletonCount === 1 ? 'primary' : 'outline'}
            onPress={() => setSkeletonCount(1)}
          >
            1
          </Button>
          <Button
            size="sm"
            variant={skeletonCount === 3 ? 'primary' : 'outline'}
            onPress={() => setSkeletonCount(3)}
          >
            3
          </Button>
        </div>

        <div style={{ maxWidth: '400px' }}>
          <Skeleton variant={skeletonShape} count={skeletonCount} />
        </div>
      </section>

      {/* Empty States */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Empty State Placeholders</h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
          }}
        >
          <EmptyState
            variant="card"
            icon={<FolderIcon />}
            title="No repositories found"
            description="Get started by creating a new repository or importing an existing project."
            action={<Button size="sm">Create Repository</Button>}
          />

          <EmptyState
            variant="dashed"
            icon={<RadioIcon />}
            title="No active audio streams"
            description="Connect a streaming audio source to begin telemetry."
            action={
              <Button size="sm" variant="outline">
                Connect Stream
              </Button>
            }
          />
        </div>
      </section>

      {/* Toasts */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Toast System</h3>
        <div {...stylex.props(styles.buttonGroup)}>
          <Button
            variant="primary"
            onPress={() =>
              toast.show('Operation successful', {
                description:
                  'Your project configurations were saved to the cloud.',
                variant: 'success',
              })
            }
          >
            Trigger Success Toast
          </Button>
          <Button
            variant="danger"
            onPress={() =>
              toast.show('Network timeout', {
                description: 'Failed to synchronize repository metadata.',
                variant: 'error',
              })
            }
          >
            Trigger Error Toast
          </Button>
        </div>
      </section>
    </div>
  )
}
