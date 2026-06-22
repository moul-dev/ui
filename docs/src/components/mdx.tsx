import { Button } from '@moul-dev/ui'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { Card, Cards } from 'fumadocs-ui/components/card'
import { Step, Steps } from 'fumadocs-ui/components/steps'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import { ComponentPreview } from './component-preview'
import { AlertDialogDemo, ModalDemo, ToastDemo, FormDemo } from './demos'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Button,
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
    ...components,
  } satisfies MDXComponents
}

export const useMDXComponents = getMDXComponents

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>
}
