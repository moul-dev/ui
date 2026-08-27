import * as stylex from '@stylexjs/stylex'
import type React from 'react'
import { useState } from 'react'
import {
  Calendar,
  Checkbox,
  CheckboxGroup,
  ComboBox,
  ComboBoxItem,
  DateField,
  DatePicker,
  DateRangePicker,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  Radio,
  RadioGroup,
  SearchField,
  Select,
  SelectItem,
  Slider,
  Switch,
  TextArea,
  TextField,
} from '../../index'
import { tokens } from '../../tokens/tokens.stylex'

const styles = stylex.create({
  card: {
    backgroundColor: tokens.colorBgGlass,
    borderColor: tokens.colorBorderSubtle,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: tokens.radiusLg,
    padding: tokens.spacing8,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: tokens.shadowSm,
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing7,
    boxSizing: 'border-box',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing4,
    width: '100%',
  },
  sectionTitle: {
    fontSize: tokens.fontSizeMd,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorFgSubtle,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorBorderSubtle,
    paddingBottom: tokens.spacing2,
    margin: 0,
  },
  gridTwoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacing5,
    width: '100%',
  },
})

export const FormsSection: React.FC = () => {
  const [sliderValue, setSliderValue] = useState(42)
  const [isSwitchActive, setIsSwitchActive] = useState(true)
  const [otpValue, setOtpValue] = useState('9421')

  return (
    <div {...stylex.props(styles.card)}>
      {/* Text & Search Inputs */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Text & Search Inputs</h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          <TextField
            label="Email Address"
            placeholder="phearak@moul.dev"
            description="We'll never share your email with third parties."
          />
          <TextField
            label="API Secret Key"
            type="password"
            placeholder="••••••••••••••••"
          />
          <SearchField
            label="Search Documentation"
            placeholder="Search components, recipes..."
          />
          <TextArea
            label="Project Description"
            placeholder="Write a brief overview of your deployment configuration..."
            rows={3}
          />
        </div>
      </section>

      {/* Select & ComboBox */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Select & ComboBox Dropdowns
        </h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          <Select label="Deployment Region" defaultSelectedKey="us-east">
            <SelectItem id="us-east">US East (N. Virginia)</SelectItem>
            <SelectItem id="us-west">US West (Oregon)</SelectItem>
            <SelectItem id="eu-central">EU Central (Frankfurt)</SelectItem>
            <SelectItem id="ap-southeast">AP Southeast (Singapore)</SelectItem>
          </Select>

          <ComboBox label="Compute Architecture" defaultSelectedKey="arm64">
            <ComboBoxItem id="arm64">
              ARM64 (Apple Silicon / Graviton)
            </ComboBoxItem>
            <ComboBoxItem id="x86_64">x86_64 (Intel / AMD)</ComboBoxItem>
            <ComboBoxItem id="wasm">Wasm Edge Worker</ComboBoxItem>
          </ComboBox>
        </div>
      </section>

      {/* Checkboxes, Radios, Switches */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Toggles, Checkboxes & Radios
        </h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          <CheckboxGroup label="Notifications" defaultValue={['email', 'sms']}>
            <Checkbox value="email">Email Alerts</Checkbox>
            <Checkbox value="sms">SMS Notifications</Checkbox>
            <Checkbox value="push">Push Webhooks</Checkbox>
          </CheckboxGroup>

          <RadioGroup label="Billing Plan" defaultValue="pro">
            <Radio value="starter">Starter ($0/mo)</Radio>
            <Radio value="pro">Pro ($29/mo)</Radio>
            <Radio value="enterprise">Enterprise (Custom)</Radio>
          </RadioGroup>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Switch isSelected={isSwitchActive} onChange={setIsSwitchActive}>
            Automatic Scaling: {isSwitchActive ? 'Active' : 'Disabled'}
          </Switch>
          <Switch defaultSelected isDisabled>
            Maintenance Mode (Locked)
          </Switch>
        </div>
      </section>

      {/* Sliders & One-Time Passwords */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>
          Sliders & OTP Verification
        </h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <Slider
              label="Bandwidth Allocation"
              value={sliderValue}
              onChange={(val) => setSliderValue(val as number)}
              minValue={0}
              maxValue={100}
            />
            <span
              style={{
                fontSize: '0.875rem',
                color: 'var(--colorFgSubtle, #94a3b8)',
              }}
            >
              Current Limit: <strong>{sliderValue} GB/s</strong>
            </span>
          </div>

          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <span
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--colorFg, #f8fafc)',
              }}
            >
              Two-Factor Authenticator Code (InputOTP)
            </span>
            <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>
      </section>

      {/* Date & Calendars */}
      <section {...stylex.props(styles.section)}>
        <h3 {...stylex.props(styles.sectionTitle)}>Date & Calendar Pickers</h3>
        <div {...stylex.props(styles.gridTwoCol)}>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <DateField label="Select Date Field" />
            <DatePicker label="Audit Date" />
            <DateRangePicker label="Billing Cycle Range" />
          </div>
          <div>
            <Calendar aria-label="Calendar Showcase" />
          </div>
        </div>
      </section>
    </div>
  )
}
