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
      'docs/components/slidetoconfirm',
      'docs/components/splitbutton',
      'docs/components/themetoggle',
      'docs/components/togglebutton',
      'docs/components/togglebuttongroup',
    ],
  },
  {
    key: 'surfaces',
    label: 'Surfaces & Feedback',
    slugs: [
      'docs/components/accordion',
      'docs/components/alert',
      'docs/components/animatedlist',
      'docs/components/avatar',
      'docs/components/badge',
      'docs/components/card',
      'docs/components/confetti',
      'docs/components/emptystate',
      'docs/components/expandablecard',
      'docs/components/iconmorph',
      'docs/components/kbd',
      'docs/components/numberticker',
      'docs/components/progressbar',
      'docs/components/pulltorefresh',
      'docs/components/resultcard',
      'docs/components/selectiontoolbar',
      'docs/components/separator',
      'docs/components/skeleton',
      'docs/components/spinner',
      'docs/components/steploader',
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
      'docs/components/dropdownmenu',
      'docs/components/focusmode',
      'docs/components/hovercard',
      'docs/components/link',
      'docs/components/modal',
      'docs/components/notificationbell',
      'docs/components/pagination',
      'docs/components/popover',
      'docs/components/stepper',
      'docs/components/tabs',
      'docs/components/tooltip',
      'docs/components/tour',
      'docs/components/tree',
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
      'docs/components/fileupload',
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
