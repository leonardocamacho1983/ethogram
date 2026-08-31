import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LabInterface } from './lab-interface'
import './lab-interface.css'

export const metadata: Metadata = {
  title: 'Ethogram Lab 04 — Interface',
  description: 'Interactive interface specimens for the Ethogram product design system.',
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

export default function InterfaceLabPage() {
  if (process.env.NODE_ENV === 'production') notFound()
  return <LabInterface />
}
