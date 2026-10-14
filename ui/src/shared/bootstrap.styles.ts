import bootstrapRaw from 'bootstrap/dist/css/bootstrap.css?inline'
import { type CSSResultOrNative, unsafeCSS } from 'lit'

let sheet: CSSResultOrNative
try {
  const s = new CSSStyleSheet()
  s.replaceSync(bootstrapRaw)
  sheet = s
} catch {
  sheet = unsafeCSS(bootstrapRaw)
}

export const bootstrapSheet = sheet
