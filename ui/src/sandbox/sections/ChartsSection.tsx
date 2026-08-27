import * as stylex from '@stylexjs/stylex'
import type React from 'react'
import {
  AreaChart,
  BarChart,
  ChartContainer,
  DoughnutChart,
  LineChart,
  Logs,
  PercentageBar,
  PercentageCircle,
  SERVER_LOGS,
  Stat,
  TopList,
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
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: tokens.spacing5,
    width: '100%',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: tokens.spacing4,
    width: '100%',
  },
})

const sampleTrafficData = [
  { month: 'Jan', requests: 1200, errors: 20 },
  { month: 'Feb', requests: 1900, errors: 35 },
  { month: 'Mar', requests: 3000, errors: 45 },
  { month: 'Apr', requests: 4800, errors: 60 },
  { month: 'May', requests: 6200, errors: 40 },
  { month: 'Jun', requests: 7900, errors: 55 },
]

const sampleDistributionData = [
  { name: 'Direct API', value: 45 },
  { name: 'Edge CDN', value: 30 },
  { name: 'Mobile SDK', value: 15 },
  { name: 'Webhooks', value: 10 },
]

const topEndpoints = [
  { label: '/v1/auth/session', value: 4200000 },
  { label: '/v1/graphql/query', value: 2800000 },
  { label: '/v1/telemetry/events', value: 1900000 },
  { label: '/v1/billing/usage', value: 740000 },
]

export const ChartsSection: React.FC = () => {
  return (
    <div {...stylex.props(styles.card)}>
      {/* Logs Component */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Real-Time Log Stream Viewer (Table Primitives)
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: '0.875rem',
            color: 'var(--colorFgSubtle, #94a3b8)',
          }}
        >
          Interactive log viewer with level filtering, live search, line
          numbers, status code pills, and drawer inspection.
        </p>
        <Logs
          data={SERVER_LOGS}
          title="Cluster Event Stream"
          inspectorMode="drawer"
          drawerPlacement="right"
          drawerSize="md"
          maxHeight="380px"
        />
      </section>

      {/* KPI Stats */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>KPI Metric Cards</h3>
        <div {...stylex.props(styles.statsGrid)}>
          <Stat
            label="Total API Calls"
            value="48.2M"
            trend="+14.2%"
            trendDirection="up"
            description="vs previous 30 days"
          />
          <Stat
            label="Avg P95 Latency"
            value="38ms"
            trend="-4.8%"
            trendDirection="down"
            description="Global edge round-trip"
          />
          <Stat
            label="Error Rate"
            value="0.04%"
            trend="-0.01%"
            trendDirection="down"
            description="99.96% SLA uptime"
          />
        </div>
      </section>

      {/* Analytics Charts */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Analytics & Visualizations
        </h3>
        <div {...stylex.props(styles.chartsGrid)}>
          <ChartContainer
            title="Request Volume Over Time"
            description="Monthly active requests (Area)"
          >
            <AreaChart
              data={sampleTrafficData}
              indexKey="month"
              categories={['requests']}
              height={220}
            />
          </ChartContainer>

          <ChartContainer
            title="Throughput & Errors"
            description="Traffic compared with errors (Bar)"
          >
            <BarChart
              data={sampleTrafficData}
              indexKey="month"
              categories={['requests', 'errors']}
              height={220}
            />
          </ChartContainer>

          <ChartContainer
            title="Time-Series Trends"
            description="Continuous multi-series metric (Line)"
          >
            <LineChart
              data={sampleTrafficData}
              indexKey="month"
              categories={['requests', 'errors']}
              height={220}
            />
          </ChartContainer>

          <ChartContainer
            title="Traffic Distribution"
            description="Breakdown by transport protocol (Doughnut)"
          >
            <DoughnutChart
              data={sampleDistributionData}
              nameKey="name"
              valueKey="value"
              height={220}
            />
          </ChartContainer>

          <ChartContainer
            title="Top API Endpoints"
            description="Ranked by total monthly invocations"
          >
            <TopList
              data={topEndpoints}
              valueFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
            />
          </ChartContainer>
        </div>
      </section>

      {/* Percentage Progress */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Percentage Meters</h3>
        <div
          style={{
            display: 'flex',
            gap: '32px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <PercentageCircle value={78} size={90} label="Storage Quota" />
          <PercentageCircle value={42} size={90} label="Compute Load" />
          <div
            style={{
              flex: 1,
              minWidth: '240px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <PercentageBar value={85} label="Primary Database Capacity" />
            <PercentageBar value={32} label="Memory Cache Allocation" />
          </div>
        </div>
      </section>
    </div>
  )
}
