export type SandboxCategoryId =
  | 'all'
  | 'actions'
  | 'forms'
  | 'overlays'
  | 'feedback'
  | 'navigation'
  | 'layout'
  | 'charts'
  | 'blocks'

export interface SandboxCategory {
  id: SandboxCategoryId
  label: string
  count: number
  description: string
}
