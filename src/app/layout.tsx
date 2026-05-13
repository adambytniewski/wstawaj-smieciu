import './globals.css';
// Self-hosted fonts (no network at build time)
import '@fontsource/anton/latin-400.css';
import '@fontsource/anton/latin-ext-400.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import type { Metadata, Viewport } from 'next';
import BottomNav from '@/components/BottomNav';
import PWARegister from '@/components/PWARegister';
import WakeUpGate from '@/components/WakeUpGate';

export const metadata: Metadata = {
  title: 'wstawaj śmieciu',
  description: 'Personalny coach. Bez owijania.',
  manifest: '/manifest.json',
  applicationName: 'wstawaj',
  appleWebApp: {
    capable: true,
    title: 'wstawaj',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body className="min-h-dvh">
        <WakeUpGate>
          <main className="mx-auto max-w-md min-h-dvh pb-28">{children}</main>
          <BottomNav />
        </WakeUpGate>
        <PWARegister />
      </body>
    </html>
  );
}
