/**
 * Lit templates are opaque to the analyzer, so slots, CSS parts, and events
 * dispatched from multi-line `dispatchEvent(...)` calls are collected from each
 * class's source text and merged into the manifest once every module is linked.
 */
const templateApi = new Map()

function addUnique(list, entry) {
  if (!list.some((item) => item.name === entry.name)) list.push(entry)
}

function collectTemplateApi(source) {
  const slots = []
  const cssParts = []
  const events = []
  for (const [, attrs] of source.matchAll(/<slot\b([^>]*)>/g)) {
    const name = attrs.match(/\bname="([\w-]+)"/)?.[1] ?? ''
    addUnique(slots, { name, description: '' })
  }
  for (const [, value] of source.matchAll(/\bpart="([^"$]+)"/g)) {
    for (const name of value.trim().split(/\s+/)) {
      addUnique(cssParts, { name, description: '' })
    }
  }
  for (const [, name] of source.matchAll(
    /new (?:Custom)?Event(?:<[^>]*>)?\(\s*['"]([\w:-]+)['"]/g,
  )) {
    addUnique(events, { name, type: { text: 'CustomEvent' } })
  }
  return { slots, cssParts, events }
}

export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts'],
  outdir: 'dist',
  litelement: true,
  plugins: [
    {
      name: 'moul-define-element-plugin',
      analyzePhase({ ts, node, moduleDoc }) {
        if (ts.isClassDeclaration(node) && node.name) {
          templateApi.set(
            `${moduleDoc.path}#${node.name.text}`,
            collectTemplateApi(node.getText()),
          )
        }
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
      packageLinkPhase({ customElementsManifest }) {
        for (const mod of customElementsManifest.modules) {
          for (const decl of mod.declarations ?? []) {
            const api = templateApi.get(`${mod.path}#${decl.name}`)
            if (!decl.customElement || !api) continue
            for (const key of ['slots', 'cssParts', 'events']) {
              const merged = decl[key] ?? []
              for (const entry of api[key]) addUnique(merged, entry)
              if (merged.length > 0) decl[key] = merged
            }
          }
        }
      },
    },
  ],
}
