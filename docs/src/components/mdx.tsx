import { Button } from '@moul-dev/ui'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import { ComponentPreview } from './component-preview'
import { AlertDialogDemo, ModalDemo, ToastDemo, FormDemo } from './demos'

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Button,
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
