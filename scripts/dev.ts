#!/usr/bin/env bun
import { spawn } from 'node:child_process'
import { resolve } from 'node:path'

const rootDir = resolve(__dirname, '..')

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

const services: Service[] = [
  {
    name: 'ui:build',
    color: colors.blue,
    command: 'bun',
    args: ['--cwd', 'ui', 'build:watch'],
    cwd: rootDir,
  },
  {
    name: 'ui:vite',
    color: colors.cyan,
    command: 'bun',
    args: ['--cwd', 'ui', 'dev'],
    cwd: rootDir,
  },
  {
    name: 'docs:waku',
    color: colors.magenta,
    command: 'bun',
    args: ['--cwd', 'docs', 'dev'],
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

  ${colors.blue}● ui:build${colors.reset}  Watch library StyleX/TS changes
  ${colors.cyan}● ui:vite${colors.reset}   Sandbox server (Vite)
  ${colors.magenta}● docs:waku${colors.reset} Documentation server (Waku)

${colors.dim}Press Ctrl+C to terminate all services cleanly.${colors.reset}
`)

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
