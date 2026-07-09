import { metaSchema, pageSchema } from 'fumadocs-core/source/schema'
import {
  defineCollections,
  defineConfig,
  defineDocs,
  frontmatterSchema,
} from 'fumadocs-mdx/config'
import { z } from 'zod'

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
})

export const devlog = defineCollections({
  type: 'doc',
  dir: 'content/devlog',
  schema: frontmatterSchema.extend({
    date: z
      .string()
      .or(z.date())
      .transform((val) => new Date(val)),
    author: z.string(),
  }),
})

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
})
