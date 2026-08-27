#!/usr/bin/env bun
import { chmodSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

const rootDir = resolve(__dirname, '..')
const gitHooksDir = join(rootDir, '.git', 'hooks')
const preCommitPath = join(gitHooksDir, 'pre-commit')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
}

const hookContent = `#!/usr/bin/env bash
# Moul UI Pre-Commit Guard
# Runs fast Biome check on staged files before commit

echo "🔍 Running pre-commit checks..."

# Run Biome check on staged files
if ! bun x @biomejs/biome check --staged; then
  echo ""
  echo "❌ \x1b[31mPre-commit check failed!\x1b[0m"
  echo "👉 Run '\x1b[36mbun run format\x1b[0m' or '\x1b[36mbun run lint\x1b[0m' to fix issues before committing."
  exit 1
fi

echo "✅ \x1b[32mPre-commit checks passed.\x1b[0m"
exit 0
`

async function main() {
  if (!existsSync(join(rootDir, '.git'))) {
    console.log(
      `${colors.yellow}No .git directory found. Skipping git hooks setup.${colors.reset}`,
    )
    return
  }

  if (!existsSync(gitHooksDir)) {
    mkdirSync(gitHooksDir, { recursive: true })
  }

  writeFileSync(preCommitPath, hookContent, { encoding: 'utf-8', mode: 0o755 })
  try {
    chmodSync(preCommitPath, 0o755)
  } catch {
    // ignore on windows
  }

  console.log(
    `${colors.green}✓ Pre-commit hook installed at .git/hooks/pre-commit${colors.reset}`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
