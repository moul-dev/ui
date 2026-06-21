'use client'
import * as React from 'react'
import * as stylex from '@stylexjs/stylex'
import {
  Slider as AriaSlider,
  SliderTrack as AriaSliderTrack,
  SliderThumb as AriaSliderThumb,
  SliderOutput as AriaSliderOutput,
  useLocale,
  type SliderProps as AriaSliderProps,
  type SliderTrackProps as AriaSliderTrackProps,
  type SliderThumbProps as AriaSliderThumbProps,
} from 'react-aria-components'
import type { StyleXStyles } from '@stylexjs/stylex'
import { styles } from './Slider.styles'
import { Label } from '../Label'

// ── SliderThumb Component ─────────────────────────────────────────────

export interface SliderThumbProps extends Omit<AriaSliderThumbProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const SliderThumb = React.forwardRef<HTMLDivElement, SliderThumbProps>(
  function SliderThumb({ style, className, ...rest }, ref) {
    return (
      <AriaSliderThumb
        {...rest}
        ref={ref}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.thumb,
            renderProps.isFocusVisible && styles.thumbFocusVisible,
            renderProps.isDisabled && styles.thumbDisabled,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.thumb,
            renderProps.isFocusVisible && styles.thumbFocusVisible,
            renderProps.isDisabled && styles.thumbDisabled,
            style,
          )
          return stylexStyle
        }}
      />
    )
  },
)

// ── SliderTrack Component ─────────────────────────────────────────────

export interface SliderTrackProps extends Omit<AriaSliderTrackProps, 'style'> {
  style?: StyleXStyles
  className?: string
}

export const SliderTrack = React.forwardRef<HTMLDivElement, SliderTrackProps>(
  function SliderTrack({ style, className, children, ...rest }, ref) {
    const { direction } = useLocale()
    return (
      <AriaSliderTrack
        {...rest}
        ref={ref}
        className={(renderProps) => {
          const { className: stylexClass } = stylex.props(
            styles.track,
            renderProps.isDisabled && styles.trackDisabled,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(renderProps) => {
          const { style: stylexStyle } = stylex.props(
            styles.track,
            renderProps.isDisabled && styles.trackDisabled,
            style,
          )
          return stylexStyle
        }}
      >
        {({ state, ...renderProps }) => {
          const percent = state.getThumbPercent(0) * 100
          const isRTL = direction === 'rtl'

          const fillStyle = isRTL
            ? { right: 0, width: `${percent}%` }
            : { left: 0, width: `${percent}%` }

          return (
            <>
              <div {...stylex.props(styles.fill)} style={fillStyle} />
              {typeof children === 'function'
                ? children({ state, ...renderProps })
                : children}
            </>
          )
        }}
      </AriaSliderTrack>
    )
  },
)

// ── Slider Component ──────────────────────────────────────────────────

export interface SliderProps extends Omit<AriaSliderProps<any>, 'style'> {
  style?: StyleXStyles
  className?: string
  label?: string
  getValueLabel?: (value: number[]) => string
  name?: string
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  function Slider(
    { style, className, label, getValueLabel, children, name, ...rest },
    ref,
  ) {
    return (
      <AriaSlider
        {...rest}
        ref={ref}
        className={(_) => {
          const { className: stylexClass } = stylex.props(
            styles.container,
            style,
          )
          return [stylexClass, className].filter(Boolean).join(' ')
        }}
        style={(_) => {
          const { style: stylexStyle } = stylex.props(styles.container, style)
          return stylexStyle
        }}
      >
        {({ state, ...renderProps }) => (
          <>
            {name &&
              state.values.map((val, index) => (
                <input key={index} type="hidden" name={name} value={val} />
              ))}
            <div {...stylex.props(styles.header)}>
              {label && <Label>{label}</Label>}
              <AriaSliderOutput {...stylex.props(styles.output)}>
                {getValueLabel
                  ? getValueLabel(state.values)
                  : state.values
                      .map((v) => state.getThumbValueLabel(v))
                      .join(' - ')}
              </AriaSliderOutput>
            </div>
            {typeof children === 'function'
              ? children({ state, ...renderProps })
              : children}
          </>
        )}
      </AriaSlider>
    )
  },
)
