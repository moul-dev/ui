export {
  MoulSidebar,
  MoulSidebar as Sidebar,
  MoulSidebarAside,
  MoulSidebarAside as SidebarAside,
  MoulSidebarBrand,
  MoulSidebarBrand as SidebarBrand,
  MoulSidebarDivider,
  MoulSidebarDivider as SidebarDivider,
  MoulSidebarFooter,
  MoulSidebarFooter as SidebarFooter,
  MoulSidebarGroup,
  MoulSidebarGroup as SidebarGroup,
  MoulSidebarHeader,
  MoulSidebarHeader as SidebarHeader,
  MoulSidebarItem,
  MoulSidebarItem as SidebarItem,
  MoulSidebarMain,
  MoulSidebarMain as SidebarMain,
  MoulSidebarUser,
  MoulSidebarUser as SidebarUser,
} from './Sidebar'
export { sidebarContext } from './Sidebar.context'
export type {
  SidebarAsideProps,
  SidebarBrandProps,
  SidebarContextValue,
  SidebarDividerProps,
  SidebarFooterProps,
  SidebarGroupProps,
  SidebarHeaderProps,
  SidebarItemProps,
  SidebarLayout,
  SidebarMainProps,
  SidebarProps,
  SidebarUserProps,
} from './Sidebar.types'

/**
 * Backward compatibility helper for legacy code querying context.
 * In Lit 3, consume `sidebarContext` via `@lit/context` ContextConsumer.
 */
export function useSidebar(): undefined {
  return undefined
}
