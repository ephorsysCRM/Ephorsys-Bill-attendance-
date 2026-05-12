import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ 
  subsets: ["latin"], 
  variable: '--font-geist-sans' 
});

const geistMono = Geist_Mono({ 
  subsets: ["latin"], 
  variable: '--font-geist-mono' 
});

export const metadata: Metadata = {
  title: 'Ephorsys Pvt Ltd - Professional Billing Software',
  description: 'Modern invoice, quotation, and billing management platform for businesses. Create, send, and track invoices with ease.',
  keywords: [
    'billing software',
    'invoice generator',
    'quotation software',
    'gst invoice',
    'ephorsys',
    'online invoicing',
    'business billing'
  ],
  authors: [{ name: 'Ephorsys Pvt Ltd' }],
  icons: {
    icon: [
      {
        url: 'https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: 'https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: 'https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png',
        type: 'image/png',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'Ephorsys Pvt Ltd - Billing Software',
    description: 'Professional billing and invoice management platform',
    images: [
      {
        url: 'https://res.cloudinary.com/devrmpo2p/image/upload/q_auto/f_auto/v1775475149/logo-BXdpNzpB_iqbjcp.png',
        width: 1200,
        height: 630,
        alt: 'Ephorsys Pvt Ltd Logo',
      },
    ],
    siteName: 'Ephorsys Pvt Ltd',
  },
}

export const viewport: Viewport = {
  themeColor: '#22c55e',        
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body 
        className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}
      >
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}