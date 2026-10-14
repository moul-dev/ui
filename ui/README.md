# @moul-dev/ui

> Accessible, native Web Component library built with Lit and Bootstrap 6 in Shadow DOM.

[![npm version](https://img.shields.io/npm/v/@moul-dev/ui.svg)](https://www.npmjs.com/package/@moul-dev/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Moul UI** is a modular component library designed for engineers who want a modern, consistent, and highly accessible baseline across any web stack.

By pairing the standard custom element lifecycle of **Lit** with **Bootstrap 6 (`6.0.0-alpha.1`)** adopted directly into the Shadow DOM, Moul UI delivers battle-tested UI primitives with complete style isolation and zero runtime overhead.

---

## ✨ Features

- ♿ **Accessible by Default**: Keyboard navigation, roving tabindex, focus trapping, floating overlays, and ARIA live regions built into reactive controllers.
- 🛡️ **Shadow DOM Style Isolation**: Adopts Bootstrap 6's compiled CSS stylesheets natively via `adoptedStyleSheets`. No leaking global CSS.
- 🎨 **Theme Tokens**: Seamless dark mode support via `data-bs-theme="dark"` and cascading CSS custom properties.
- 🌐 **Framework Agnostic**: Works in vanilla HTML, React, Next.js, Vue, Svelte, Astro, Angular, and more.
- 📦 **Tree Shakeable**: Single barrel export (`@moul-dev/ui`) or fine-grained per-component imports (`@moul-dev/ui/button`, `@moul-dev/ui/modal`).

---

## 📦 Installation

```bash
# Bun
bun add @moul-dev/ui

# npm
npm install @moul-dev/ui

# pnpm
pnpm add @moul-dev/ui

# yarn
yarn add @moul-dev/ui
```

---

## 🚀 Quick Start

### 1. Register Components

Import the full library barrel:

```ts
import '@moul-dev/ui';
```

Or import specific components to keep your bundle minimal:

```ts
import '@moul-dev/ui/button';
import '@moul-dev/ui/alert';
import '@moul-dev/ui/modal';
```

### 2. Use Custom Elements

```html
<moul-alert variant="info" title="System Notice">
  Welcome to Moul UI native web components!
</moul-alert>

<moul-button variant="primary">
  Get Started
</moul-button>
```

---

## 📚 Documentation

For complete documentation, interactive previews, and component API references, visit:

📖 **[https://moul.dev/ui](https://moul.dev/ui)**

---

## 📄 License

MIT © [Moul](https://moul.dev)
