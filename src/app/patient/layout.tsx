import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from 'react-hot-toast'
import { satoshi } from '@/fonts/satoshi'
import { cn } from '@/lib/utils'

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      {children}
      <Toaster position="top-right" />
    </ThemeProvider>
  )
} 