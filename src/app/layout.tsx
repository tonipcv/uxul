import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'
import { ThemeProvider } from '@/components/theme-provider'
import { NextAuthProvider } from '@/components/NextAuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Habit Tracker',
  description: 'Track your habits and achieve your goals',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>
            <div className="min-h-screen flex">
              <Navigation />
              <main className="flex-1 lg:pl-20">
                {children}
              </main>
            </div>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
