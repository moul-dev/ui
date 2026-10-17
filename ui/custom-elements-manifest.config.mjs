export default {
  globs: ['src/components/**/*.ts'],
  exclude: ['src/**/*.test.ts', 'src/**/*.styles.ts'],
  outdir: 'dist',
  litelement: true,
  plugins: [
    {
      name: 'moul-define-element-plugin',
      analyzePhase({ ts, node, moduleDoc }) {
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
    },
  ],
}
