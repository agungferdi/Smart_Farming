import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'IoT Sensor Dashboard',
  description:
    'Real-time monitoring of temperature, humidity, and soil moisture from ESP32 sensors',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Prevent theme flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
            try {
              const stored = localStorage.getItem('theme');
              const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              const useDark = stored ? stored === 'dark' : systemDark;
              if (useDark) document.documentElement.classList.add('dark');
            } catch {}
          `,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
