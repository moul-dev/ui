# @moul-dev/ui

> Accessible, zero-runtime React component library built on React Aria and StyleX.

[![npm version](https://img.shields.io/npm/v/@moul-dev/ui.svg)](https://www.npmjs.com/package/@moul-dev/ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Moul UI** is a modular component library designed for product engineers who want a modern, consistent, and highly accessible baseline for React applications.

By merging the robust, accessible interaction primitives of **React Aria** with the compile-time type safety and efficiency of **StyleX**, Moul UI delivers beautiful default styles with zero runtime styling overhead.

---

## ✨ Features

- ♿ **Accessible by Default**: Full keyboard navigation, screen reader support, ARIA semantics, and robust interaction states powered by React Aria.
- ⚡ **Zero-Runtime Styling**: Built with StyleX. Atomic CSS is extracted at build time, eliminating CSS-in-JS runtime overhead.
- 🎨 **Dynamic OKLCH Theming**: Perceptually uniform color tokens with runtime hue and chroma customization for instant white-labeling.
- 🌐 **RTL & Logical Properties**: Full bidirectional support using CSS logical properties (`marginBlock`, `paddingInline`, `insetInlineEnd`, etc.).
- 🚀 **Server Component (RSC) Ready**: Fully compatible with modern React frameworks like Next.js, Remix, Waku, and Vite.
- 📊 **Rich Analytics & Charts**: Production-grade data visualizations (AreaChart, BarChart, LineChart, DoughnutChart, TopList, Stat, Percentage) built on Recharts.

---

## 📦 Installation

Install `@moul-dev/ui` and its peer dependencies in your React project:

```bash
# Bun
bun add @moul-dev/ui @stylexjs/stylex

# npm
npm install @moul-dev/ui @stylexjs/stylex

# pnpm
pnpm add @moul-dev/ui @stylexjs/stylex

# yarn
yarn add @moul-dev/ui @stylexjs/stylex
```

---

## 🚀 Quick Start

### 1. Import the Stylesheet

Import the compiled StyleX CSS at the root of your application (e.g. `main.tsx`, `index.tsx`, or `globals.css`):

```tsx
import '@moul-dev/ui/style.css';
```

### 2. (Optional) Wrap with `ThemeProvider`

Wrap your application tree or sections with `ThemeProvider` to control color schemes and custom brand variables:

```tsx
import { ThemeProvider } from '@moul-dev/ui';

export function App({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider colorScheme="light dark">
      {children}
    </ThemeProvider>
  );
}
```

### 3. Use Components

```tsx
import { Button, Alert, Stat, LineChart, ChartContainer } from '@moul-dev/ui';

export function Dashboard() {
  const chartData = [
    { time: '09:00', ActiveUsers: 120 },
    { time: '12:00', ActiveUsers: 450 },
    { time: '15:00', ActiveUsers: 890 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
      <Alert variant="info" title="System Notice">
        Moul UI is running with zero runtime overhead.
      </Alert>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Stat
          label="Total Revenue"
          value="$45,231.89"
          trend={{ direction: 'up', value: '+20.1% from last month' }}
        />
      </div>

      <ChartContainer title="User Activity">
        <LineChart
          data={chartData}
          indexKey="time"
          categories={['ActiveUsers']}
          height={260}
        />
      </ChartContainer>

      <Button variant="primary" onPress={() => alert('Clicked!')}>
        Get Started
      </Button>
    </div>
  );
}
```

---

## 📚 Documentation

For complete documentation, interactive previews, and component API references, visit:

📖 **[https://moul.dev/ui](https://moul.dev/ui)**

---

## 🛠️ Monorepo & Development

This repository is managed with **Bun**:

```bash
# Install dependencies
bun install

# Run UI sandbox
bun run dev:ui

# Run documentation website
bun run dev:docs

# Run test suite
bun --cwd ui test

# Build library
bun run build:ui
```

---

## 📄 License

MIT © [Moul](https://moul.dev)
