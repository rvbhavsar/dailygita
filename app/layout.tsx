import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';
import './globals.css';

const title = 'Bhagavad Gita Wisdom – Ancient Wisdom for Modern Life';
const description =
  "Reduce stress, improve clarity, and navigate life's challenges with timeless wisdom from the Bhagavad Gita, delivered one verse at a time.";

export const metadata: Metadata = {
  title,
  description,
  authors: [{ name: 'Bhagavad Gita Wisdom' }],
  appleWebApp: { capable: true, title: 'Gita Wisdom', statusBarStyle: 'default' },
  formatDetection: { telephone: false },
  openGraph: { title, description, type: 'website' },
  twitter: { card: 'summary_large_image', site: '@DailyGita' },
  icons: { apple: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f97316' },
    { media: '(prefers-color-scheme: dark)', color: '#f59e0b' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Arya:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
