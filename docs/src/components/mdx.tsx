import {
  Alert,
  AreaChart,
  BarChart,
  Button,
  ChartContainer,
  DoughnutChart,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerDialog,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerTitle,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  LineChart,
  Logs,
  PercentageBar,
  PercentageCircle,
  Sidebar,
  SidebarDivider,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  Stat,
  Tag,
  TagGroup,
  TopList,
  Typography,
  TypographyHeading,
  TypographyLabel,
  TypographyParagraph,
  TypographySpan,
} from '@moul-dev/ui'
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { Card, Cards } from 'fumadocs-ui/components/card'
import { Step, Steps } from 'fumadocs-ui/components/steps'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { TypeTable } from 'fumadocs-ui/components/type-table'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { ExternalLink } from 'lucide-react'
import type { MDXComponents } from 'mdx/types'
import { BlockPreview } from './block-preview'
import { ComponentPlayground } from './component-playground'
import { ComponentPreview } from './component-preview'
import {
  AlertDemo,
  AlertDialogDemo,
  BarChartDemo,
  ComboBoxTagGroupDemo,
  DoughnutChartDemo,
  DrawerDemo,
  FormDemo,
  InputOTPDemo,
  LineChartDemo,
  ModalDemo,
  PercentageDemo,
  SidebarDemo,
  SpikyAreaChartDemo,
  StatDemo,
  StatusChartDemo,
  TagGroupDemo,
  ToastDemo,
  TopListDemo,
} from './demos'

export function FullPagePreviewLink({ href }: { href: string }) {
  return (
    <div className="my-4 not-prose flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-neutral-950 dark:text-neutral-50">
          Full Page Preview
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          Experience this component in a full browser viewport.
        </span>
      </div>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-md transition-all duration-200"
      >
        <span>Open Preview</span>
        <ExternalLink className="size-3.5" />
      </a>
    </div>
  )
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Button,
    Alert,
    Logs,
    TagGroup,
    Tag,
    Typography,
    'Typography.Heading': TypographyHeading,
    'Typography.Paragraph': TypographyParagraph,
    'Typography.Span': TypographySpan,
    'Typography.Label': TypographyLabel,
    Card,
    Cards,
    Step,
    Steps,
    Tab,
    Tabs,
    TypeTable,
    Accordion,
    Accordions,
    ComponentPreview,
    ComponentPlayground,
    BlockPreview,
    FullPagePreviewLink,
    AlertDialogDemo,
    ModalDemo,
    DrawerDemo,
    Drawer,
    DrawerOverlay,
    DrawerDialog,
    DrawerHeader,
    DrawerTitle,
    DrawerCloseButton,
    DrawerBody,
    DrawerFooter,
    ToastDemo,
    FormDemo,
    AlertDemo,
    TagGroupDemo,
    ComboBoxTagGroupDemo,
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
    InputOTPSeparator,
    InputOTPDemo,
    ChartContainer,
    AreaChart,
    LineChart,
    BarChart,
    DoughnutChart,
    TopList,
    Stat,
    PercentageBar,
    PercentageCircle,
    LineChartDemo,
    BarChartDemo,
    DoughnutChartDemo,
    TopListDemo,
    StatDemo,
    PercentageDemo,
    StatusChartDemo,
    SpikyAreaChartDemo,
    Sidebar,
    SidebarHeader,
    SidebarGroup,
    SidebarItem,
    SidebarFooter,
    SidebarDivider,
    SidebarDemo,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
