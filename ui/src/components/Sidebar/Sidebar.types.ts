/**
 * Moul UI - Compound Sidebar Element Suite Types
 */

export type SidebarLayout = 'sidebar-framed' | 'main-framed'

export interface SidebarContextValue {
  layout: SidebarLayout
  dense: boolean
  collapsed: boolean
  selectedKey: string
  previousActiveRect?: DOMRect | null
  onSelect?: (key: string) => void
  selectItem?: (key: string) => void
  toggleCollapse?: () => void
}

export interface SidebarProps {
  layout?: SidebarLayout
  dense?: boolean
  collapsed?: boolean
  selectedKey?: string
}

export interface SidebarAsideProps {
  ariaLabel?: string
  showCollapseToggle?: boolean
  dense?: boolean
  collapsed?: boolean
}

export interface SidebarMainProps {
  layout?: SidebarLayout
}

export interface SidebarHeaderProps {
  dense?: boolean
  collapsed?: boolean
}

export interface SidebarBrandProps {
  logo?: string
  title?: string
  subtitle?: string
  href?: string
  dense?: boolean
  collapsed?: boolean
}

export interface SidebarGroupProps {
  label?: string
  title?: string
  collapsible?: boolean
  collapsed?: boolean
  dense?: boolean
}

export interface SidebarItemProps {
  key?: string
  id?: string
  href?: string
  label?: string
  badge?: string
  isDisabled?: boolean
  isSelected?: boolean
  dense?: boolean
  collapsed?: boolean
}

export interface SidebarDividerProps {
  dense?: boolean
  collapsed?: boolean
}

export interface SidebarFooterProps {
  dense?: boolean
  collapsed?: boolean
  showBorder?: boolean
}

export interface SidebarUserProps {
  name?: string
  email?: string
  description?: string
  avatarSrc?: string
  status?: string
  dense?: boolean
  collapsed?: boolean
}
