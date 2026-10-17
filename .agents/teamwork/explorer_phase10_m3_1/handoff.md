# Handoff Report: CEM Schema v2 AST Plugin for `ui/custom-elements-manifest.config.mjs`

## 1. Observation

### 1.1 Existing CEM Config & Defect
- **File**: `ui/custom-elements-manifest.config.mjs` (lines 1–7):
  ```javascript
  export default {
    globs: ['src/components/**/*.ts'],
    exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts'],
    outdir: 'dist',
    litelement: true,
  }
  ```
- **Execution**: Running `@custom-elements-manifest/analyzer` (`cem analyze --config custom-elements-manifest.config.mjs`) against `ui/` outputs `ui/dist/custom-elements.json`.
- **Manifest State Before Plugin**:
  - `manifest.schemaVersion`: `"1.0.0"`
  - Total `customElement` declarations: 77
  - Declarations with `tagName`: **0**
  - Declarations without `tagName`: **77**
  - Exports with `kind: 'custom-element-definition'`: **0**
  - Verbatim excerpt from declaration:
    ```json
    {
      "kind": "class",
      "description": "",
      "name": "MoulAlert",
      "customElement": true
    }
    ```
- **Root Cause**: `@custom-elements-manifest/analyzer` standard parser only detects `customElements.define('tag', Class)` or `@customElement('tag')` decorators. `@moul-dev/ui` registers all custom elements via the idempotent helper `defineElement('moul-tag', Class)` from `ui/src/utils/define-element.ts`.

### 1.2 Plugin Architecture & AST Inspection
- **Plugin Implementation**: Analyzes TypeScript AST during `analyzePhase` hook:
  ```javascript
  export default {
    globs: ['src/components/**/*.ts'],
    exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts'],
    outdir: 'dist',
    litelement: true,
    plugins: [
      {
        name: 'moul-define-element-plugin',
        analyzePhase({ ts, node, moduleDoc }) {
          if (ts.isCallExpression(node)) {
            const expr = node.expression
            if (ts.isIdentifier(expr) && expr.text === 'defineElement') {
              const [tagArg, classArg] = node.arguments
              if (
                tagArg &&
                classArg &&
                ts.isStringLiteral(tagArg) &&
                ts.isIdentifier(classArg)
              ) {
                const tagName = tagArg.text
                const className = classArg.text
                moduleDoc.exports = moduleDoc.exports || []
                moduleDoc.exports.push({
                  kind: 'custom-element-definition',
                  name: tagName,
                  declaration: {
                    name: className,
                    module: moduleDoc.path,
                  },
                })
              }
            }
          }
        },
      },
    ],
  }
  ```
- **Execution**: Tested via `cd ui && node node_modules/.bin/cem analyze --config ../.agents/teamwork/explorer_phase10_m3_1/proposed-cem.config.mjs`.
- **Manifest State After Plugin**:
  - Total `customElement` declarations: **77**
  - Elements with `tagName`: **77** (100%)
  - Elements without `tagName`: **0**
  - Custom element definition exports: **77** (100%)
  - Unlinked or mismatched exports: **0**
  - Non-`moul-` tags: **0**
  - Duplicate tags: **0**

### 1.3 77 Custom Elements Complete Verification Inventory
Every custom element in the library is properly tagged and exported:
1. `moul-alert` -> `MoulAlert` (`src/components/Alert/Alert.ts`)
2. `moul-alert-dialog` -> `MoulAlertDialog` (`src/components/AlertDialog/AlertDialog.ts`)
3. `moul-area-chart` -> `MoulAreaChart` (`src/components/AreaChart/AreaChart.ts`)
4. `moul-avatar` -> `MoulAvatar` (`src/components/Avatar/Avatar.ts`)
5. `moul-avatar-group` -> `MoulAvatarGroup` (`src/components/Avatar/AvatarGroup.ts`)
6. `moul-badge` -> `MoulBadge` (`src/components/Badge/Badge.ts`)
7. `moul-bar-chart` -> `MoulBarChart` (`src/components/BarChart/BarChart.ts`)
8. `moul-breadcrumb-item` -> `MoulBreadcrumbItem` (`src/components/Breadcrumbs/BreadcrumbItem.ts`)
9. `moul-breadcrumbs` -> `MoulBreadcrumbs` (`src/components/Breadcrumbs/Breadcrumbs.ts`)
10. `moul-button` -> `MoulButton` (`src/components/Button/Button.ts`)
11. `moul-button-group` -> `MoulButtonGroup` (`src/components/ButtonGroup/ButtonGroup.ts`)
12. `moul-calendar` -> `MoulCalendar` (`src/components/Calendar/Calendar.ts`)
13. `moul-card` -> `MoulCard` (`src/components/Card/Card.ts`)
14. `moul-card-body` -> `MoulCardBody` (`src/components/Card/Card.ts`)
15. `moul-card-footer` -> `MoulCardFooter` (`src/components/Card/Card.ts`)
16. `moul-card-header` -> `MoulCardHeader` (`src/components/Card/Card.ts`)
17. `moul-chart-container` -> `MoulChartContainer` (`src/components/ChartContainer/ChartContainer.ts`)
18. `moul-chart-tooltip` -> `MoulChartTooltip` (`src/components/ChartTooltip/ChartTooltip.ts`)
19. `moul-checkbox` -> `MoulCheckbox` (`src/components/Checkbox/Checkbox.ts`)
20. `moul-checkbox-group` -> `MoulCheckboxGroup` (`src/components/Checkbox/CheckboxGroup.ts`)
21. `moul-combobox` -> `MoulComboBox` (`src/components/ComboBox/ComboBox.ts`)
22. `moul-combobox-item` -> `MoulComboBoxItem` (`src/components/ComboBox/ComboBoxItem.ts`)
23. `moul-command-palette` -> `MoulCommandPalette` (`src/components/CommandPalette/CommandPalette.ts`)
24. `moul-date-picker` -> `MoulDatePicker` (`src/components/DatePicker/DatePicker.ts`)
25. `moul-doughnut-chart` -> `MoulDoughnutChart` (`src/components/DoughnutChart/DoughnutChart.ts`)
26. `moul-drawer` -> `MoulDrawer` (`src/components/Drawer/Drawer.ts`)
27. `moul-empty-state` -> `MoulEmptyState` (`src/components/EmptyState/EmptyState.ts`)
28. `moul-form` -> `MoulForm` (`src/components/Form/Form.ts`)
29. `moul-input-otp` -> `MoulInputOTP` (`src/components/InputOTP/InputOTP.ts`)
30. `moul-kbd` -> `MoulKbd` (`src/components/Kbd/Kbd.ts`)
31. `moul-line-chart` -> `MoulLineChart` (`src/components/LineChart/LineChart.ts`)
32. `moul-link` -> `MoulLink` (`src/components/Link/Link.ts`)
33. `moul-logs` -> `MoulLogs` (`src/components/LogsViewer/Logs.ts`)
34. `moul-logs-viewer` -> `MoulLogsViewer` (`src/components/LogsViewer/LogsViewer.ts`)
35. `moul-modal` -> `MoulModal` (`src/components/Modal/Modal.ts`)
36. `moul-number-field` -> `MoulNumberField` (`src/components/NumberField/NumberField.ts`)
37. `moul-pagination` -> `MoulPagination` (`src/components/Pagination/Pagination.ts`)
38. `moul-percentage-bar` -> `MoulPercentageBar` (`src/components/Percentage/PercentageBar.ts`)
39. `moul-percentage-circle` -> `MoulPercentageCircle` (`src/components/Percentage/PercentageCircle.ts`)
40. `moul-popover` -> `MoulPopover` (`src/components/Popover/Popover.ts`)
41. `moul-progress-bar` -> `MoulProgressBar` (`src/components/ProgressBar/ProgressBar.ts`)
42. `moul-radio` -> `MoulRadio` (`src/components/RadioGroup/Radio.ts`)
43. `moul-radio-group` -> `MoulRadioGroup` (`src/components/RadioGroup/RadioGroup.ts`)
44. `moul-search-field` -> `MoulSearchField` (`src/components/SearchField/SearchField.ts`)
45. `moul-select` -> `MoulSelect` (`src/components/Select/Select.ts`)
46. `moul-select-item` -> `MoulSelectItem` (`src/components/Select/SelectItem.ts`)
47. `moul-separator` -> `MoulSeparator` (`src/components/Separator/Separator.ts`)
48. `moul-sidebar` -> `MoulSidebar` (`src/components/Sidebar/Sidebar.ts`)
49. `moul-sidebar-aside` -> `MoulSidebarAside` (`src/components/Sidebar/Sidebar.ts`)
50. `moul-sidebar-brand` -> `MoulSidebarBrand` (`src/components/Sidebar/Sidebar.ts`)
51. `moul-sidebar-divider` -> `MoulSidebarDivider` (`src/components/Sidebar/Sidebar.ts`)
52. `moul-sidebar-footer` -> `MoulSidebarFooter` (`src/components/Sidebar/Sidebar.ts`)
53. `moul-sidebar-group` -> `MoulSidebarGroup` (`src/components/Sidebar/Sidebar.ts`)
54. `moul-sidebar-header` -> `MoulSidebarHeader` (`src/components/Sidebar/Sidebar.ts`)
55. `moul-sidebar-item` -> `MoulSidebarItem` (`src/components/Sidebar/Sidebar.ts`)
56. `moul-sidebar-main` -> `MoulSidebarMain` (`src/components/Sidebar/Sidebar.ts`)
57. `moul-sidebar-user` -> `MoulSidebarUser` (`src/components/Sidebar/Sidebar.ts`)
58. `moul-skeleton` -> `MoulSkeleton` (`src/components/Skeleton/Skeleton.ts`)
59. `moul-slider` -> `MoulSlider` (`src/components/Slider/Slider.ts`)
60. `moul-spinner` -> `MoulSpinner` (`src/components/Spinner/Spinner.ts`)
61. `moul-stat` -> `MoulStat` (`src/components/Stat/Stat.ts`)
62. `moul-switch` -> `MoulSwitch` (`src/components/Switch/Switch.ts`)
63. `moul-tab` -> `MoulTab` (`src/components/Tabs/Tab.ts`)
64. `moul-tab-panel` -> `MoulTabPanel` (`src/components/Tabs/TabPanel.ts`)
65. `moul-table` -> `MoulTable` (`src/components/Table/Table.ts`)
66. `moul-tabs` -> `MoulTabs` (`src/components/Tabs/Tabs.ts`)
67. `moul-tag` -> `MoulTag` (`src/components/TagGroup/Tag.ts`)
68. `moul-tag-group` -> `MoulTagGroup` (`src/components/TagGroup/TagGroup.ts`)
69. `moul-text-area` -> `MoulTextArea` (`src/components/TextArea/TextArea.ts`)
70. `moul-text-field` -> `MoulTextField` (`src/components/TextField/TextField.ts`)
71. `moul-toast` -> `MoulToast` (`src/components/Toast/Toast.ts`)
72. `moul-toast-region` -> `MoulToastRegion` (`src/components/Toast/ToastQueue.ts`)
73. `moul-toggle-button` -> `MoulToggleButton` (`src/components/ToggleButton/ToggleButton.ts`)
74. `moul-toggle-button-group` -> `MoulToggleButtonGroup` (`src/components/ToggleButtonGroup/ToggleButtonGroup.ts`)
75. `moul-tooltip` -> `MoulTooltip` (`src/components/Tooltip/Tooltip.ts`)
76. `moul-top-list` -> `MoulTopList` (`src/components/TopList/TopList.ts`)
77. `moul-typography` -> `MoulTypography` (`src/components/Typography/Typography.ts`)

### 1.4 Comparison with `ui/src/index.ts`
- Comparison of all 77 manifest tags with `HTMLElementTagNameMap` in `ui/src/index.ts`:
  - In manifest but not index: `[]` (0)
  - In index but not manifest: `[]` (0)
  - Exact 1:1 match across all 77 tags and class constructor names.

---

## 2. Logic Chain

1. **Step 1 (Root Cause Identification)**:
   - CEM's built-in `custom-elements-define-calls` plugin scans AST for `customElements.define(...)` calls and creates a module export with `kind: 'custom-element-definition'`.
   - The built-in `linkClassToTagnamePlugin` subsequently links the declaration to its `tagName` only when that export exists in the module.
   - Because `@moul-dev/ui` wraps element registration inside `defineElement(tagName, ctor)`, the built-in scanner ignores the registration, resulting in 77 declarations with `tagName === undefined` and 0 exports.

2. **Step 2 (Plugin Design)**:
   - The plugin hooks into `analyzePhase({ ts, node, moduleDoc })`.
   - When encountering a `CallExpression` where `expression` is an identifier named `'defineElement'`:
     - It extracts the first argument (`tagArg`) as a string literal and the second argument (`classArg`) as an identifier.
     - It creates and pushes `{ kind: 'custom-element-definition', name: tagName, declaration: { name: className, module: moduleDoc.path } }` into `moduleDoc.exports`.
   - During the analyzer's subsequent `packageLinkPhase`, the standard `linkClassToTagnamePlugin` picks up these definition exports and links each declaration to its corresponding `tagName`.

3. **Step 3 (Multi-Element Module Resilience)**:
   - Several component files register multiple elements in a single module (e.g. `Card.ts` registers `moul-card`, `moul-card-header`, `moul-card-body`, `moul-card-footer`; `Sidebar.ts` registers 10 elements).
   - Because `analyzePhase` visits each AST `CallExpression` node independently, each `defineElement` call is visited and appended to `moduleDoc.exports`.
   - Verification confirmed all multi-element modules (`Card.ts`, `Sidebar.ts`, `Tabs.ts`, `ToastQueue.ts`, etc.) have all child elements properly tagged and exported.

4. **Step 4 (Format & Style Compliance)**:
   - The configuration conforms to `biome.json` formatting: 2-space indentation, single quotes, no unnecessary semicolons.

---

## 3. Caveats

1. **Working Directory during Analysis**: `cem analyze` must be executed with working directory `ui` (as configured in `ui/package.json` `"build"` script).
2. **Read-Only Explorer Discipline**: In accordance with the explorer role, `ui/custom-elements-manifest.config.mjs` was NOT directly modified. The verified configuration is saved at `.agents/teamwork/explorer_phase10_m3_1/proposed-cem.config.mjs` and presented below as a drop-in replacement for `worker_phase10_m3_1`.

---

## 4. Conclusion & Drop-In Replacement Code

The proposed AST plugin completely solves the CEM manifest tag name deficiency, mapping 100% of the 77 custom elements with valid tag names and exports.

### Drop-in Replacement for `ui/custom-elements-manifest.config.mjs`:

```javascript
export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts'],
  outdir: 'dist',
  litelement: true,
  plugins: [
    {
      name: 'moul-define-element-plugin',
      analyzePhase({ ts, node, moduleDoc }) {
        if (ts.isCallExpression(node)) {
          const expr = node.expression
          if (ts.isIdentifier(expr) && expr.text === 'defineElement') {
            const [tagArg, classArg] = node.arguments
            if (
              tagArg &&
              classArg &&
              ts.isStringLiteral(tagArg) &&
              ts.isIdentifier(classArg)
            ) {
              const tagName = tagArg.text
              const className = classArg.text
              moduleDoc.exports = moduleDoc.exports || []
              moduleDoc.exports.push({
                kind: 'custom-element-definition',
                name: tagName,
                declaration: {
                  name: className,
                  module: moduleDoc.path,
                },
              })
            }
          }
        }
      },
    },
  ],
}
```

---

## 5. Verification Method

To independently verify this configuration:

```bash
# 1. Run CEM analyzer using the proposed config
cd /Users/phearak/github/orgs/moul-dev/ui/ui && node node_modules/.bin/cem analyze --config ../.agents/teamwork/explorer_phase10_m3_1/proposed-cem.config.mjs

# 2. Inspect resulting manifest integrity
bun -e "
const fs = require('fs');
const manifest = JSON.parse(fs.readFileSync('ui/dist/custom-elements.json', 'utf-8'));
const decls = manifest.modules.flatMap(m => m.declarations || []).filter(d => d.customElement);
const withTag = decls.filter(d => d.tagName);
const withoutTag = decls.filter(d => !d.tagName);
const exports = manifest.modules.flatMap(m => m.exports || []).filter(e => e.kind === 'custom-element-definition');

console.log('Total custom elements:', decls.length, '(expected 77)');
console.log('With tagName:', withTag.length, '(expected 77)');
console.log('Without tagName:', withoutTag.length, '(expected 0)');
console.log('Definition exports:', exports.length, '(expected 77)');

if (decls.length !== 77 || withTag.length !== 77 || withoutTag.length !== 0 || exports.length !== 77) {
  console.error('Verification failed!');
  process.exit(1);
}
console.log('✓ All 77 custom elements verified with valid tag names and definition exports.');
"
```
