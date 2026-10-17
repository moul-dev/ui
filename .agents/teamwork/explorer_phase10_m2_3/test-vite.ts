import { createServer } from '/Users/phearak/github/orgs/moul-dev/ui/ui/node_modules/vite/dist/node/index.js'
import { resolve } from 'node:path'

async function testWithExistingTs() {
  const uiDir = resolve('/Users/phearak/github/orgs/moul-dev/ui/ui')
  const server = await createServer({
    root: uiDir,
    configFile: resolve(uiDir, 'vite.config.ts'),
    server: {
      port: 5199,
      strictPort: false,
    },
  })

  try {
    const html = `<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="/src/styles/style.css" />
  </head>
  <body>
    <script type="module" src="/src/index.ts"></script>
  </body>
</html>`

    const transformed = await server.transformIndexHtml('/index.html', html)
    console.log('TRANSFORMED WITH INDEX.TS SUCCESS!')

    const transformedModule = await server.transformRequest('/src/index.ts')
    console.log('MODULE TRANSFORMED SUCCESS, CODE LENGTH:', transformedModule?.code.length)
  } finally {
    await server.close()
  }
}

testWithExistingTs().catch((err) => {
  console.error('ERROR:', err)
  process.exit(1)
})
