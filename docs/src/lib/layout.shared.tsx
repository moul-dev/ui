import { uiTranslations } from 'fumadocs-ui/i18n'
import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { Logo } from '@/components/logo'
import { ThemeSelector } from '@/components/theme-selector'
import { i18n } from './i18n'
import { gitConfig } from './shared'

export const translations = i18n
  .translations()
  .extend(uiTranslations())
  .add({
    en: {
      displayName: 'English',
    },
    km: {
      displayName: 'ភាសាខ្មែរ',
      'Choose a language(language switcher)': 'ជ្រើសរើសភាសា',
      'Choose a language(language switcher)(aria-label)': 'ជ្រើសរើសភាសា',
      'Close Search(search dialog)(aria-label)': 'បិទផ្ទាំងស្វែងរក',
      'Collapse Sidebar(sidebar)(aria-label)': 'បង្រួមរបារចំហៀង',
      'Open Sidebar(sidebar)(aria-label)': 'បើករបារចំហៀង',
      'Open Search(search trigger)(aria-label)': 'បើកផ្ទាំងស្វែងរក',
      'On this page(table of contents)': 'មាតិកាក្នុងទំព័រនេះ',
      'Table of Contents(inline table of contents)': 'មាតិកា',
      'No Headings(table of contents)': 'គ្មានចំណងជើងរងទេ',
      'Next Page(pagination)': 'ទំព័របន្ទាប់',
      'Previous Page(pagination)': 'ទំព័រមុន',
      'Search(search dialog)': 'ស្វែងរក',
      'Search(search trigger)': 'ស្វែងរក',
      'No results found(search dialog)': 'រកមិនឃើញលទ្ធផលទេ',
      'Copy Text(code block)(aria-label)': 'ចម្លងកូដ',
      'Copied Text(code block)(aria-label)': 'បានចម្លង',
      'Copy Markdown(page actions)': 'ចម្លងជា Markdown',
      'View as Markdown(page actions)': 'មើលជា Markdown',
      'Open in GitHub(page actions)': 'បើកមើលក្នុង GitHub',
      'Back to Home(404 page)': 'ត្រឡប់ទៅកាន់ទំព័រដើម',
      'Page Not Found(404 page)': 'រកមិនឃើញទំព័រនេះទេ',
      'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 page)':
        'ទំព័រដែលអ្នកកំពុងស្វែងរក អាចផ្លាស់ប្ដូរឈ្មោះ លុបចេញ ឬផ្អាកដំណើរការជាបណ្ដោះអាសន្ន។',
      'Edit on GitHub(edit page)': 'កែសម្រួលទំព័រនេះលើ GitHub',
      'Last updated on(page footer)': 'ធ្វើបច្ចុប្បន្នភាពចុងក្រោយ៖',
      'Toggle Menu(mobile menu)(aria-label)': 'បិទបើកម៉ឺនុយ',
      'Toggle Theme(theme switcher)(aria-label)': 'ប្ដូររូបរាងពន្លឺ/ងងឹត',
      'Dark(theme switcher)(aria-label)': 'ងងឹត',
      'Light(theme switcher)(aria-label)': 'ភ្លឺ',
      'System(theme switcher)(aria-label)': 'តាមប្រព័ន្ធ',
    },
  })

export function baseOptions(
  locale: string = i18n.defaultLanguage,
): BaseLayoutProps {
  const isKm = locale === 'km'
  return {
    nav: {
      title: <Logo />,
      url: isKm ? '/km' : '/',
    },
    links: [
      {
        text: isKm ? 'ឯកសារណែនាំ' : 'Docs',
        url: isKm ? '/km/docs' : '/docs',
        active: 'nested-url',
      },
      {
        text: isKm ? 'រូបរាង' : 'Theme',
        url: '/theme',
        active: 'url',
      },
      {
        text: isKm ? 'កំណត់ហេតុការផ្លាស់ប្ដូរ' : 'Changelog',
        url: '/changelog',
        active: 'nested-url',
      },
      {
        type: 'custom',
        secondary: true,
        children: <ThemeSelector />,
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  }
}

export function docsOptions(
  locale: string = i18n.defaultLanguage,
): BaseLayoutProps {
  const isKm = locale === 'km'
  return {
    nav: {
      title: <Logo />,
      url: isKm ? '/km' : '/',
      children: (
        <div className="flex justify-end">
          <ThemeSelector />
        </div>
      ),
    },
    links: [
      {
        text: isKm ? 'ឯកសារណែនាំ' : 'Docs',
        url: isKm ? '/km/docs' : '/docs',
        active: 'nested-url',
      },
      {
        text: isKm ? 'រូបរាង' : 'Theme',
        url: '/theme',
        active: 'url',
      },
      {
        text: isKm ? 'កំណត់ហេតុការផ្លាស់ប្ដូរ' : 'Changelog',
        url: '/changelog',
        active: 'nested-url',
      },
    ],
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
  }
}
