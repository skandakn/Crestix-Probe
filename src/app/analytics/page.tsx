import AnalyticsPage from './AnalyticsPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Research analytics | Crestix Probe',
  description: 'Scientific validation analytics for Crestix Probe.',
}

export default function Page() {
  return <AnalyticsPage />
}
