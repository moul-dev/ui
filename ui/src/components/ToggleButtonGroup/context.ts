import * as React from 'react'

export interface ToggleButtonGroupContextValue {
  isInGroup: boolean
  orientation: 'horizontal' | 'vertical'
  variant: 'primary' | 'secondary' | 'tertiary'
  animated: boolean
}

export const ToggleButtonGroupContext =
  React.createContext<ToggleButtonGroupContextValue | null>(null)
