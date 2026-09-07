import * as stylex from '@stylexjs/stylex'
import type React from 'react'
import { useState } from 'react'
import {
  Badge,
  BreadcrumbItem,
  Breadcrumbs,
  Pagination,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  TagGroup,
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
})

const sampleNodes = [
  {
    id: 'node-1',
    name: 'prod-api-worker-01',
    zone: 'us-east-1a',
    cpu: '18%',
    memory: '4.2 GB',
    status: 'Healthy',
    variant: 'success' as const,
  },
  {
    id: 'node-2',
    name: 'prod-api-worker-02',
    zone: 'us-east-1b',
    cpu: '74%',
    memory: '7.8 GB',
    status: 'High Load',
    variant: 'warning' as const,
  },
  {
    id: 'node-3',
    name: 'prod-cache-redis-01',
    zone: 'us-east-1c',
    cpu: '12%',
    memory: '14.1 GB',
    status: 'Healthy',
    variant: 'success' as const,
  },
  {
    id: 'node-4',
    name: 'prod-indexer-elastic-01',
    zone: 'us-east-1a',
    cpu: '98%',
    memory: '29.4 GB',
    status: 'Degraded',
    variant: 'error' as const,
  },
]

export const NavigationSection: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'react',
    'typescript',
  ])

  return (
    <div {...stylex.props(styles.card)}>
      {/* Breadcrumbs & Tabs */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Breadcrumbs & Tab Navigation
        </h3>
        <Breadcrumbs>
          <BreadcrumbItem>Home</BreadcrumbItem>
          <BreadcrumbItem>Infrastructure</BreadcrumbItem>
          <BreadcrumbItem>Clusters</BreadcrumbItem>
          <BreadcrumbItem isCurrent>Production-US-East</BreadcrumbItem>
        </Breadcrumbs>

        <Tabs defaultSelectedKey="overview">
          <TabList aria-label="Cluster Navigation">
            <Tab id="overview">Overview</Tab>
            <Tab id="metrics">Metrics & Charts</Tab>
            <Tab id="deployments">Deployments</Tab>
            <Tab id="logs">Live Logs</Tab>
          </TabList>
          <TabPanels>
            <TabPanel id="overview">
              <div
                style={{
                  padding: '16px 0',
                  fontSize: '0.875rem',
                  opacity: 0.85,
                }}
              >
                Displaying cluster overview for{' '}
                <strong>Production-US-East</strong>. All edge nodes are
                currently receiving incoming traffic.
              </div>
            </TabPanel>
            <TabPanel id="metrics">
              <div
                style={{
                  padding: '16px 0',
                  fontSize: '0.875rem',
                  opacity: 0.85,
                }}
              >
                Real-time latency metrics: P50: 18ms | P95: 42ms | P99: 89ms.
              </div>
            </TabPanel>
            <TabPanel id="deployments">
              <div
                style={{
                  padding: '16px 0',
                  fontSize: '0.875rem',
                  opacity: 0.85,
                }}
              >
                Active deployment: Release v2026.09.07 (zero-downtime rolling
                rollout complete).
              </div>
            </TabPanel>
            <TabPanel id="logs">
              <div
                style={{
                  padding: '16px 0',
                  fontSize: '0.875rem',
                  opacity: 0.85,
                }}
              >
                Log stream initialized with 10,000 tail records.
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </section>

      {/* Data Table */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Accessible Data Table</h3>
        <Table aria-label="Compute Instances Table">
          <TableHeader>
            <TableRow>
              <TableHead>Node Name</TableHead>
              <TableHead>Availability Zone</TableHead>
              <TableHead>CPU Usage</TableHead>
              <TableHead>Memory</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sampleNodes.map((node) => (
              <TableRow key={node.id}>
                <TableCell>
                  <strong>{node.name}</strong>
                </TableCell>
                <TableCell>{node.zone}</TableCell>
                <TableCell>{node.cpu}</TableCell>
                <TableCell>{node.memory}</TableCell>
                <TableCell>
                  <Badge size="sm" variant={node.variant} dot>
                    {node.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Pagination */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Pagination Controls</h3>
        <Pagination
          page={currentPage}
          totalPages={10}
          total={100}
          pageSize={10}
          onPageChange={setCurrentPage}
        />
      </section>

      {/* Tag Groups */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Interactive Tag Groups</h3>
        <TagGroup
          label="Technology Stack Filter"
          selectionMode="multiple"
          selectedKeys={selectedTags}
          onSelectionChange={(keys) =>
            setSelectedTags(Array.from(keys as Set<string>))
          }
        >
          <Tag id="react">React 19</Tag>
          <Tag id="typescript">TypeScript 5.8</Tag>
          <Tag id="stylex">StyleX</Tag>
          <Tag id="react-aria">React Aria</Tag>
          <Tag id="waku">Waku RSC</Tag>
          <Tag id="biome">Biome</Tag>
        </TagGroup>
      </section>
    </div>
  )
}
