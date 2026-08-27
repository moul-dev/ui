import * as stylex from '@stylexjs/stylex'
import type React from 'react'
import {
  Avatar,
  AvatarGroup,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Separator,
  Typography,
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
  gridCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacing5,
    width: '100%',
  },
  avatarRow: {
    display: 'flex',
    gap: tokens.spacing4,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
})

export const LayoutSection: React.FC = () => {
  return (
    <div {...stylex.props(styles.card)}>
      {/* Cards & Containers */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Container Cards & Surfaces
        </h3>
        <div {...stylex.props(styles.gridCards)}>
          {/* Glass Card */}
          <Card variant="glass" elevation={1} divided>
            <CardHeader>Glass Surface</CardHeader>
            <CardBody>
              High-performance backdrop blur with reactive borders that adapt
              smoothly to light and dark themes.
            </CardBody>
            <CardFooter>
              <Button size="sm" variant="ghost">
                Dismiss
              </Button>
              <Button size="sm" variant="primary">
                Action
              </Button>
            </CardFooter>
          </Card>

          {/* Elevated Card */}
          <Card variant="default" elevation={2} divided>
            <CardHeader>Elevated Surface</CardHeader>
            <CardBody>
              Zero-runtime multi-layer box shadows computed at compile-time via
              StyleX design tokens.
            </CardBody>
            <CardFooter>
              <Button size="sm" variant="secondary">
                Configure
              </Button>
            </CardFooter>
          </Card>

          {/* Flat Card */}
          <Card variant="flat" divided>
            <CardHeader>Flat Surface</CardHeader>
            <CardBody>
              Subtle contrast background without elevation shadows for nested
              grouping.
            </CardBody>
            <CardFooter>
              <Button size="sm" variant="outline">
                Details
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Avatars & Avatar Groups */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Avatars & Avatar Groups</h3>
        <div {...stylex.props(styles.avatarRow)}>
          <Avatar initials="PT" size="xs" status="online" shape="circle" />
          <Avatar initials="JD" size="sm" status="busy" shape="circle" />
          <Avatar initials="AB" size="md" status="away" shape="circle" />
          <Avatar initials="ML" size="lg" status="offline" shape="square" />
          <Avatar initials="UX" size="xl" status="online" shape="circle" />
        </div>

        <div style={{ marginTop: '8px' }}>
          <span
            style={{
              fontSize: '0.85rem',
              color: 'var(--colorFgSubtle, #94a3b8)',
              display: 'block',
              marginBottom: '8px',
            }}
          >
            Stacked Avatar Group with Overflow Limit:
          </span>
          <AvatarGroup max={4}>
            <Avatar initials="PT" size="md" />
            <Avatar initials="JD" size="md" />
            <Avatar initials="AB" size="md" />
            <Avatar initials="ML" size="md" />
            <Avatar initials="UX" size="md" />
            <Avatar initials="AI" size="md" />
            <Avatar initials="DS" size="md" />
          </AvatarGroup>
        </div>
      </section>

      {/* Typography & Separators */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Typography & Separators</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Typography as="h2">Heading 2 Token Style</Typography>
          <Typography as="h4">Heading 4 Sub-section Heading</Typography>
          <Typography as="p">
            Body 1 text with accessible color contrast ratios according to WCAG
            2.1 AAA specifications.
          </Typography>
          <Separator />
          <Typography as="span">
            Caption metadata label — 12px neutral text
          </Typography>
        </div>
      </section>
    </div>
  )
}
