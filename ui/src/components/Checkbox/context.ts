import * as React from 'react'

export interface CheckboxGroupContextValue {
  variant?: 'primary' | 'secondary' | 'tertiary'
}

export const CheckboxGroupContext = React.createContext<CheckboxGroupContextValue | null>(null)
