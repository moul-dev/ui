/**
 * Component categories, in the order and with the names the sandbox
 * (`ui/src/sandbox.ts`) uses. Drives the docs sidebar so it stays in step
 * with the kitchen sink.
 *
 * Slugs are locale-free; Starlight resolves them to the Khmer page under `/km/`.
 */

export interface ComponentCategory {
  /** The sandbox section id. */
  key: string
  label: string
  slugs: string[]
}

export const COMPONENT_CATEGORIES: ComponentCategory[] = [
  {
    key: 'actions',
    label: 'Actions & Toggles',
    slugs: [
      'docs/components/button',
      'docs/components/buttongroup',
      'docs/components/togglebutton',
      'docs/components/togglebuttongroup',
    ],
  },
  {
    key: 'surfaces',
    label: 'Surfaces & Feedback',
    slugs: [
      'docs/components/alert',
      'docs/components/avatar',
      'docs/components/badge',
      'docs/components/card',
      'docs/components/emptystate',
      'docs/components/kbd',
      'docs/components/progressbar',
      'docs/components/separator',
      'docs/components/skeleton',
      'docs/components/spinner',
      'docs/components/table',
      'docs/components/taggroup',
      'docs/components/toast',
      'docs/components/typography',
    ],
  },
  {
    key: 'overlays',
    label: 'Overlays & Navigation',
    slugs: [
      'docs/components/alertdialog',
      'docs/components/breadcrumbs',
      'docs/components/commandpalette',
      'docs/components/drawer',
      'docs/components/link',
      'docs/components/modal',
      'docs/components/pagination',
      'docs/components/popover',
      'docs/components/tabs',
      'docs/components/tooltip',
    ],
  },
  {
    key: 'forms',
    label: 'Forms & Inputs',
    slugs: [
      'docs/components/autocomplete',
      'docs/components/calendar',
      'docs/components/checkbox',
      'docs/components/checkboxgroup',
      'docs/components/combobox',
      'docs/components/datepicker',
      'docs/components/form',
      'docs/components/inputotp',
      'docs/components/numberfield',
      'docs/components/radiogroup',
      'docs/components/searchfield',
      'docs/components/select',
      'docs/components/slider',
      'docs/components/switch',
      'docs/components/textarea',
      'docs/components/textfield',
    ],
  },
  {
    key: 'charts',
    label: 'Charts & Analytics',
    slugs: [
      'docs/components/charts/areachart',
      'docs/components/charts/barchart',
      'docs/components/charts/doughnutchart',
      'docs/components/charts/funnelchart',
      'docs/components/charts/heatmapchart',
      'docs/components/charts/linechart',
      'docs/components/charts/percentage',
      'docs/components/stat',
      'docs/components/charts/toplist',
    ],
  },
  {
    key: 'blocks',
    label: 'Composite Blocks',
    slugs: ['docs/blocks/logs', 'docs/blocks/sidebar'],
  },
]
