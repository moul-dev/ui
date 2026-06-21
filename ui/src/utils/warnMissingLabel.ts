import * as React from 'react'

/**
 * Helper to recursively detect non-empty text content inside React children.
 */
export function hasTextContent(children: React.ReactNode): boolean {
  if (children == null) {
    return false
  }
  if (typeof children === 'string' || typeof children === 'number') {
    return String(children).trim().length > 0
  }
  if (Array.isArray(children)) {
    return children.some(hasTextContent)
  }
  if (typeof children === 'object' && 'props' in children) {
    const element = children as React.ReactElement<any>
    if (element.props && 'children' in element.props) {
      return hasTextContent(element.props.children)
    }
  }
  return false
}

interface WarnMissingLabelOptions {
  label?: string
  labelledBy?: string
  children?: React.ReactNode
}

/**
 * Warns in the console during development if an interactive component
 * lacks an accessible name (label, labelledBy, or non-empty text children).
 */
export function warnMissingLabel(
  componentName: string,
  { label, labelledBy, children }: WarnMissingLabelOptions,
): void {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  if (!label && !labelledBy && !hasTextContent(children)) {
    console.warn(
      `[${componentName}] This component has no accessible name. ` +
        `Provide an \`aria-label\`, \`aria-labelledby\`, or visible text children.`,
    )
  }
}
