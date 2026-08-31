import type { Metadata } from 'next'
import AgentbookApp from './app-client'

export const metadata: Metadata = {
  title: 'Ethogram local interface',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function AppPage() {
  return <AgentbookApp />
}
