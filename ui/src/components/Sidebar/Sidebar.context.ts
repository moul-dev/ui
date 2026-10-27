import { createContext } from '@lit/context'
import type { SidebarContextValue } from './Sidebar.types'

export const sidebarContext = createContext<SidebarContextValue>(
  Symbol('sidebar-context'),
)
