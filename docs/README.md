# Moul UI Documentation (`docs`)

The official documentation website for **Moul UI**, built on the **Waku** React Server Components (RSC) framework and **Fumadocs**.

---

## 🏗️ Architecture

- **Framework**: [Waku](https://waku.gg) (React Server Components)
- **Docs Engine**: [Fumadocs MDX & UI](https://fumadocs.dev)
- **Styling**: Tailwind CSS v4 + `@moul-dev/ui` compiled StyleX atomic styles
- **Icons**: [Lucide React](https://lucide.dev)

---

## 🚀 Development

From the repository root:

```bash
# Run docs dev server
bun run dev:docs

# Or run from the docs directory
bun --cwd docs dev
```

### Type Checking & MDX Validation

```bash
bun --cwd docs types:check
```

### Building for Production

```bash
bun run build:docs
```

Static outputs are generated into `docs/dist/public` and `docs/dist/server`.

---

## 📄 License

MIT © [Moul](https://moul.dev)
