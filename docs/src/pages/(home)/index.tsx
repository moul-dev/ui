import { HomeView } from '@/components/home-view'

export default function Home() {
  return <HomeView lang="en" />
}

export async function getConfig() {
  return {
    render: 'static',
  }
}
