#!/usr/bin/env bun
import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const rootDir = resolve(import.meta.dir, '..')

interface Service {
  name: string
  color: string
  command: string
  args: string[]
  cwd: string
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
}

// `bun dev` = `bun run dev:ui` + `bun run dev:docs`, side by side (Req 15.1–15.3).
const services: Service[] = [
  {
    name: 'ui:vite',
    color: colors.cyan,
    command: 'bun',
    args: ['run', 'dev:ui'],
    cwd: rootDir,
  },
  {
    name: 'docs:astro',
    color: colors.magenta,
    command: 'bun',
    args: ['run', 'dev:docs'],
    cwd: rootDir,
  },
]

const children: ReturnType<typeof spawn>[] = []
let isShuttingDown = false

function logPrefix(name: string, color: string, text: string) {
  const lines = text.toString().split('\n')
  for (const line of lines) {
    if (line.trim().length > 0) {
      console.log(`${color}${colors.bright}[${name}]${colors.reset} ${line}`)
    }
  }
}

function shutdown(signal: string) {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(
    `\n${colors.yellow}${colors.bright}Received ${signal}. Shutting down all processes cleanly...${colors.reset}`,
  )

  for (const child of children) {
    if (child && !child.killed) {
      try {
        child.kill('SIGTERM')
      } catch {
        // Process might already be dead
      }
    }
  }

  // Force kill fallback if any process hangs
  setTimeout(() => {
    for (const child of children) {
      if (child && !child.killed) {
        try {
          child.kill('SIGKILL')
        } catch {
          // ignore
        }
      }
    }
    process.exit(0)
  }, 2000).unref()
}

// Trap termination signals
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGHUP', () => shutdown('SIGHUP'))
process.on('exit', () => shutdown('exit'))

console.log(`
${colors.bright}${colors.cyan}========================================${colors.reset}
${colors.bright}  Moul UI Dev Environment Supervisor${colors.reset}
${colors.cyan}========================================${colors.reset}

  ${colors.cyan}● ui:vite${colors.reset}    Web Components sandbox (Vite)
  ${colors.magenta}● docs:astro${colors.reset}  Documentation site (Astro Starlight)

${colors.dim}Press Ctrl+C to terminate all services cleanly.${colors.reset}
`)

// The docs site resolves `@moul-dev/ui` through the package exports, which
// point at `ui/dist`. Build once up front so a fresh clone can start docs.
if (!existsSync(join(rootDir, 'ui', 'dist', 'moul-ui.js'))) {
  console.log(
    `${colors.yellow}ui/dist not found — running ${colors.bright}bun run build:ui${colors.reset}${colors.yellow} first...${colors.reset}\n`,
  )
  const build = spawnSync('bun', ['run', 'build:ui'], {
    cwd: rootDir,
    stdio: 'inherit',
  })
  if (build.status !== 0) {
    console.error(
      `${colors.red}${colors.bright}build:ui failed with code ${build.status}; not starting dev servers.${colors.reset}`,
    )
    process.exit(build.status ?? 1)
  }
}

for (const s of services) {
  const child = spawn(s.command, s.args, {
    cwd: s.cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '1' },
  })

  children.push(child)

  child.stdout?.on('data', (data) => {
    logPrefix(s.name, s.color, data)
  })

  child.stderr?.on('data', (data) => {
    logPrefix(s.name, s.color, data)
  })

  child.on('exit', (code, _sig) => {
    if (!isShuttingDown) {
      if (code !== 0 && code !== null) {
        console.log(
          `${s.color}${colors.bright}[${s.name}]${colors.reset} ${colors.red}exited with code ${code}${colors.reset}`,
        )
      }
    }
  })
}
