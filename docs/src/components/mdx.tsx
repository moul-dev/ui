import {
  Alert,
  BarChart,
  Button,
  ChartContainer,
  DoughnutChart,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  LineChart,
  PercentageBar,
  PercentageCircle,
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
import type { MDXComponents } from 'mdx/types'
import { ComponentPlayground } from './component-playground'
import { ComponentPreview } from './component-preview'
import {
  AlertDemo,
  AlertDialogDemo,
  BarChartDemo,
  ComboBoxTagGroupDemo,
  DoughnutChartDemo,
  FormDemo,
  InputOTPDemo,
  LineChartDemo,
  ModalDemo,
  PercentageDemo,
  SpikyAreaChartDemo,
  StatDemo,
  StatusChartDemo,
  TagGroupDemo,
  ToastDemo,
  TopListDemo,
} from './demos'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Button,
    Alert,
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
    AlertDialogDemo,
    ModalDemo,
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
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
