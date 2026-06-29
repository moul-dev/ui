import { Alert, Button, Tag, TagGroup } from '@moul-dev/ui'
import { Card, Cards } from 'fumadocs-ui/components/card'
import { Step, Steps } from 'fumadocs-ui/components/steps'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { ComponentPreview } from './component-preview'
import {
  AlertDemo,
  AlertDialogDemo,
  ComboBoxTagGroupDemo,
  FormDemo,
  ModalDemo,
  TagGroupDemo,
  ToastDemo,
} from './demos'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Button,
    Alert,
    TagGroup,
    Tag,
    Card,
    Cards,
    Step,
    Steps,
    Tab,
    Tabs,
    ComponentPreview,
    AlertDialogDemo,
    ModalDemo,
    ToastDemo,
    FormDemo,
    AlertDemo,
    TagGroupDemo,
    ComboBoxTagGroupDemo,
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
