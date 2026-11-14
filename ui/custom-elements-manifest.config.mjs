/**
 * Lit templates are opaque to the analyzer, so slots, CSS parts, and events
 * dispatched from multi-line `dispatchEvent(...)` calls are collected from each
 * class's source text and merged into the manifest once every module is linked.
 *
 * The same pass takes out what the analyzer reports but is not API:
 *
 * - Fields declared `{ state: true }` in `static properties`: Lit gives them no
 *   attribute, but the analyzer lists them as attributes (`hasToolbarSlot`),
 *   and `sync:llms` would document them for agents.
 * - Events named after a variable: for `new CustomEvent(type, …)` in a shared
 *   emit helper, the analyzer records an event called `type`. The real names
 *   come from the string literals and the JSDoc.
 * - Private members, which were a quarter of the published manifest.
 */
const templateApi = new Map()

/** `ClassName#field` for every `{ state: true }` property. Class names are unique (`Moul*`). */
const stateFields = new Set()

function addUnique(list, entry) {
  if (!list.some((item) => item.name === entry.name)) list.push(entry)
}

function collectTemplateApi(source) {
  const slots = []
  const cssParts = []
  const events = []
  const variableEvents = new Set()
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
  for (const [, name] of source.matchAll(
    /new (?:Custom)?Event(?:<[^>]*>)?\(\s*([A-Za-z_$][\w$]*)\s*[,)]/g,
  )) {
    variableEvents.add(name)
  }
  return { slots, cssParts, events, variableEvents }
}

/** Records the `{ state: true }` entries of a class's `static properties`. */
function collectStateFields(ts, node) {
  for (const member of node.members) {
    if (
      !ts.isPropertyDeclaration(member) ||
      member.name.getText() !== 'properties' ||
      !member.modifiers?.some((m) => m.kind === ts.SyntaxKind.StaticKeyword)
    ) {
      continue
    }
    let init = member.initializer
    while (
      init &&
      (ts.isAsExpression(init) ||
        ts.isSatisfiesExpression(init) ||
        ts.isParenthesizedExpression(init))
    ) {
      init = init.expression
    }
    if (!init || !ts.isObjectLiteralExpression(init)) continue
    for (const prop of init.properties) {
      if (
        !ts.isPropertyAssignment(prop) ||
        !ts.isObjectLiteralExpression(prop.initializer)
      ) {
        continue
      }
      const isState = prop.initializer.properties.some(
        (option) =>
          ts.isPropertyAssignment(option) &&
          option.name.getText() === 'state' &&
          option.initializer.kind === ts.SyntaxKind.TrueKeyword,
      )
      if (isState) {
        const field = prop.name.getText().replace(/^['"]|['"]$/g, '')
        stateFields.add(`${node.name.text}#${field}`)
      }
    }
  }
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
          collectStateFields(ts, node)
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
            // An inherited entry belongs to the class it came from.
            const owner = (entry) => entry.inheritedFrom?.name ?? decl.name
            const isState = (entry, field) =>
              stateFields.has(`${owner(entry)}#${field}`)
            if (decl.attributes) {
              decl.attributes = decl.attributes.filter(
                (attr) => !isState(attr, attr.fieldName ?? attr.name),
              )
            }
            if (decl.members) {
              decl.members = decl.members.filter(
                (member) =>
                  member.privacy !== 'private' &&
                  !member.name.startsWith('#') &&
                  !(member.kind === 'field' && isState(member, member.name)),
              )
            }
            const api = templateApi.get(`${mod.path}#${decl.name}`)
            if (!decl.customElement || !api) continue
            for (const key of ['slots', 'cssParts', 'events']) {
              const merged = decl[key] ?? []
              for (const entry of api[key]) addUnique(merged, entry)
              if (merged.length > 0) decl[key] = merged
            }
            if (decl.events) {
              decl.events = decl.events.filter(
                (event) =>
                  !api.variableEvents.has(event.name) ||
                  api.events.some((literal) => literal.name === event.name),
              )
            }
          }
        }
      },
    },
  ],
}
