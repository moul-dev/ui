export interface Author {
  name: string
  title: string
  avatar: string
  github: string
  x: string
}

export const authors: Record<string, Author> = {
  thasophearak: {
    name: 'Phearak S. Tha',
    title: 'Founder',
    avatar: 'https://github.com/thasophearak.png',
    github: 'https://github.com/thasophearak',
    x: 'https://x.com/thasophearak',
  },
  moul: {
    name: 'Moul Team',
    title: 'Core Team',
    avatar: 'https://github.com/moul-dev.png',
    github: 'https://github.com/moul-dev',
    x: 'https://x.com/moul_dev',
  },
}

export function getAuthor(id: string): Author {
  return (
    authors[id] || {
      name: id,
      title: 'Contributor',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`,
      github: `https://github.com/${id}`,
      x: `https://x.com/${id}`,
    }
  )
}
