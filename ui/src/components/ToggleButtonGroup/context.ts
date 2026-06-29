import * as React from 'react'

export interface ToggleButtonGroupContextValue {
  isInGroup: boolean
  orientation: 'horizontal' | 'vertical'
  size?: 'sm' | 'md' | 'lg'
  animated: boolean
}

export const ToggleButtonGroupContext =
  React.createContext<ToggleButtonGroupContextValue | null>(null)
